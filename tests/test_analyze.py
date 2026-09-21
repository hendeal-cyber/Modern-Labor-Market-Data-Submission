"""Analysis tests: recover planted coefficients from simulated data.

Shipping regression code that has never estimated anything would be untested in
the way that matters, so a synthetic dataset with known truth is generated and
the estimates are checked against it.
"""
import sys, pathlib, tempfile, csv
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from lmstudy.analyze import run_analysis, detectable_effect

# Planted truth, in log points. These are exactly the CORE_MODEL regressors
# the simulation can construct, so the test measures recovery rather than
# omitted-variable bias: when advanced_degree_pref and soft_leadership moved to
# the extended model on 2026-09-21 but were still planted here, their effect
# landed in the intercept and the recovery check read 92,466 against a planted
# 85,000. That was the test working — but testing the wrong thing.
TRUE = {"degree_stem": 0.08, "degree_required": 0.05, "skill_cloud": 0.10,
        "skill_ml_ai": 0.12, "industry_data_center": -0.05,
        "remote_eligible": 0.06, "yrs_exp_min": 0.04,
        # National-scope regressors, planted so the model that actually runs is
        # the model under test.
        "seniority_rank": 0.11, "mandate_state": -0.02,
        "region_west": 0.07, "region_northeast": 0.09, "region_south": -0.03}
INTERCEPT = np.log(85000)

def simulate(n=600, seed=7):
    rng = np.random.default_rng(seed)
    employers = [f"Employer{i}" for i in range(12)]
    rows = []
    for i in range(n):
        d = {k: int(rng.random() < 0.5) for k in TRUE
             if k not in ("yrs_exp_min", "seniority_rank",
                          "region_west", "region_northeast", "region_south")}
        d["yrs_exp_min"] = int(rng.integers(0, 4))
        # Seniority spans the real ladder rather than a coin flip: it is the
        # headline regressor now, and an ordinal is not a dummy.
        d["seniority_rank"] = int(rng.integers(1, 7))
        # Exactly one region dummy is on, Midwest being the omitted reference.
        region = rng.choice(["midwest", "northeast", "south", "west"])
        for name in ("northeast", "south", "west"):
            d[f"region_{name}"] = int(region == name)
        emp = employers[i % len(employers)]
        # Employer-level shock: makes clustered SEs the correct choice.
        shock = rng.normal(0, 0.04) if i < len(employers) else 0
        log_pay = INTERCEPT + sum(TRUE[k] * d[k] for k in TRUE) + rng.normal(0, 0.10) + shock
        mid = float(np.exp(log_pay))
        row = {
            "posting_key": f"k{i}", "employer": emp,
            "industry": "data_center" if d["industry_data_center"] else "utility",
            "title": "Data Engineer I", "ats_platform": "greenhouse", "url": "",
            "metro": "chicago" if i % 4 else "indianapolis",
            "tier": 1,
            "state": {"midwest": "IL", "northeast": "NY",
                      "south": "TX", "west": "CO"}[region],
            "census_region": region,
            "study_metro": 1,
            "mandate_state": d["mandate_state"],
            "seniority_rank": d["seniority_rank"],
            "seniority_label": "mid",
            "early_career": int(d["seniority_rank"] <= 1),
            "rpp": "", "pay_midpoint_real": "",
            "distance_miles": 5.0, "work_arrangement": "onsite",
            "remote_eligible": d["remote_eligible"],
            "posted_at": "2026-09-01", "posting_age_days": 19,
            "first_seen_run": "2026-09-20", "last_seen_run": "2026-09-20",
            # Postings that state no minimum are drawn from those genuinely
            # requiring zero years, so the imputation is truthful and the
            # intercept stays comparable to the planted base.
            "yrs_exp_min": "" if (d["yrs_exp_min"] == 0 and i % 2 == 0)
                           else d["yrs_exp_min"],
            "yrs_exp_excerpt": "",
            "pay_disclosed": 1, "pay_min": mid*0.9, "pay_max": mid*1.1,
            "pay_midpoint": mid, "pay_range_width": mid*0.2,
            "pay_source": "text", "pay_unit_original": "year",
            "hourly_original": 0, "pay_single_figure": 0, "pay_excerpt": "",
            "description_hash": "x", "description_chars": 2000,
        }
        # industry_data_center is encoded via the industry column, and
        # yrs_exp_min is set above (blank for one row in five, to exercise the
        # unstated-experience path) — neither may be overwritten from d here.
        row.update({k: v for k, v in d.items()
                    if k not in ("industry_data_center", "yrs_exp_min")})
        for extra in ["degree_required","prior_internship_req","certification_req",
                      "skill_python_r","skill_sql","skill_viz_bi","skill_big_data",
                      "soft_teamwork","soft_communication","soft_problem_solving",
                      "travel_required","on_call","security_clearance","union_role",
                      "sponsorship_unavailable","benefit_health","benefit_retirement",
                      "benefit_bonus","benefit_equity","benefit_paid_leave",
                      "benefit_tuition","benefit_relocation","benefit_wellness"]:
            row.setdefault(extra, int(rng.random() < 0.5))
        rows.append(row)
    # A block of non-disclosing postings, to exercise the selection report.
    for i in range(120):
        base = dict(rows[i]); base["posting_key"] = f"nd{i}"
        base["pay_disclosed"] = 0
        for f in ("pay_min","pay_max","pay_midpoint","pay_range_width"):
            base[f] = ""
        base["degree_stem"] = 1   # plant a real difference for the t-test to find
        rows.append(base)
    return rows

def write(rows, path):
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

def run():
    fails = []
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        ds = tmp / "postings.csv"
        write(simulate(), ds)
        rep = run_analysis(ds, tmp / "out")

        if rep["status"] != "ok":
            fails.append(f"status={rep['status']}")
            print("analyze:", fails); return len(fails)

        if rep["n_estimation"] != 600:
            fails.append(f"n_estimation={rep['n_estimation']} want 600")

        coefs = rep["models"]["core"]["coefficients"]
        if "yrs_exp_stated" not in coefs:
            fails.append("yrs_exp_stated missing: imputed zeros are confounded without it")
        for name, truth in TRUE.items():
            if name not in coefs:
                fails.append(f"{name} missing from core model"); continue
            got = coefs[name]["coef"]
            if abs(got - truth) > 0.035:
                fails.append(f"{name}: estimated {got} vs planted {truth} (off by {abs(got-truth):.3f})")
        # CI coverage is checked across seeds below, not per-coefficient here:
        # with eight 95% intervals, an occasional miss is expected behaviour.

        if rep["models"]["core"]["cov_type"] != "cluster":
            fails.append(f"expected clustered SEs, got {rep['models']['core']['cov_type']}")

        # Intercept should land near the planted base pay.
        const = coefs.get("const", {}).get("coef")
        if const is None or abs(np.exp(const) - 85000) > 6000:
            fails.append(f"intercept implies base pay {np.exp(const):.0f} vs planted 85000")

        # Selection report should detect the planted degree_stem difference.
        sel = rep["selection"]
        if sel.get("n_withheld") != 120:
            fails.append(f"selection n_withheld={sel.get('n_withheld')} want 120")
        ds_row = (sel.get("by_variable") or {}).get("degree_stem")
        if not ds_row or ds_row["p_value"] > 0.05:
            fails.append(f"planted disclosure difference not detected: {ds_row}")

        # VIF should be sane for near-independent binary regressors.
        bad_vif = {k: v for k, v in rep["vif_core"].items() if v > 5}
        if bad_vif:
            fails.append(f"unexpected multicollinearity: {bad_vif}")

        if "range_width" not in rep["models"]:
            fails.append("secondary range-width model missing")

        # Small-N path must refuse to estimate rather than produce noise.
        small = tmp / "small.csv"
        write(simulate(n=15), small)
        rep_small = run_analysis(small, tmp / "out_small")
        if rep_small["status"] != "insufficient data":
            fails.append(f"small-N status={rep_small['status']} want 'insufficient data'")

    # CI coverage across seeds: 95% intervals should cover the planted truth
    # most of the time. A systematically wrong SE would show up as low coverage.
    covered = total = 0
    for seed in (1, 2, 3, 4, 5):
        with tempfile.TemporaryDirectory() as tmp2:
            tmp2 = pathlib.Path(tmp2)
            ds2 = tmp2 / "p.csv"
            write(simulate(seed=seed), ds2)
            r2 = run_analysis(ds2, tmp2 / "o")
            c2 = r2["models"]["core"]["coefficients"]
            for name, truth in TRUE.items():
                if name in c2:
                    total += 1
                    if c2[name]["ci_low"] <= truth <= c2[name]["ci_high"]:
                        covered += 1
    coverage = covered / total if total else 0
    if coverage < 0.85:
        fails.append(f"95% CI coverage only {coverage:.0%} across {total} intervals")
    else:
        print(f"  CI coverage {coverage:.0%} over {total} intervals across 5 seeds")

    # Power calculation sanity: more data detects smaller effects.
    if not (detectable_effect(500, 10) < detectable_effect(100, 10)):
        fails.append("power: larger N should detect smaller effects")

    print(f"analyze: {len(fails)} failure(s)")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

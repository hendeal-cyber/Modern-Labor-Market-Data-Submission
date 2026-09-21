"""Estimate the pay model and produce the study's tables and diagnostics.

Primary specification: OLS on log(pay_midpoint) with standard errors clustered
by employer, since employers contribute many postings and their errors are
plainly not independent.

Model size adapts to realized N. With roughly 20 observations per regressor as
the guide, a small sample gets the pre-specified CORE model and only a larger
one unlocks the EXTENDED model. This is decided from N, not from which
specification gives nicer results.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys
import warnings

import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

OBS_PER_REGRESSOR = 20

# Pre-specified. Declared here rather than chosen after seeing results.
# Fixed in docs/pre-registration.md BEFORE the national run collected, so the
# specification cannot be read as chosen after seeing results. Changing this
# list requires a dated amendment in that document's section 8.
CORE_MODEL = [
    "seniority_rank", "yrs_exp_min", "yrs_exp_stated",
    "degree_required", "degree_stem",
    "skill_cloud", "skill_ml_ai",
    "remote_eligible", "hourly_original",
    "mandate_state", "region_northeast", "region_south", "region_west",
    "industry_data_center", "family_ai_ml",
]
# `yrs_exp_stated` must travel with `yrs_exp_min`: postings that state no
# minimum are imputed to zero, and without the indicator that imputation is
# indistinguishable from a genuine "0 years required".
EXTENDED_EXTRA = [
    "advanced_degree_pref", "soft_leadership", "job_level", "study_metro",
    "prior_internship_req", "certification_req",
    "skill_python_r", "skill_sql", "skill_viz_bi", "skill_big_data",
    "soft_teamwork", "soft_communication", "soft_problem_solving",
    "travel_required", "on_call", "security_clearance",
    "benefit_bonus", "benefit_equity", "benefit_tuition", "benefit_relocation",
    "posting_age_days",
    "family_siting_dev", "family_regulatory", "family_market_commercial",
    "family_grid_power", "family_gis", "family_sustainability",
    "industry_grid_operator", "industry_energy_analytics", "industry_developer",
    "industry_consulting", "industry_grid_vendor",
    "industry_cooperative", "industry_retailer",
    "metro_remote_national",
]


def load(path: pathlib.Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["industry_data_center"] = (df["industry"] == "data_center").astype(int)
    df["metro_indianapolis"] = (df["metro"] == "indianapolis").astype(int)
    # Nationwide-remote postings name no state, so they carry no determinate
    # pay-disclosure jurisdiction. The dummy absorbs them so they cannot load
    # onto the metro contrasts that identify off Illinois HB 3129.
    df["metro_remote_national"] = (df["metro"] == "remote_national").astype(int)
    # National scope, 2026-09-21. Census region dummies with Midwest as the
    # reference category — it holds Chicago and Indianapolis, the metros the
    # study started from, so every regional coefficient reads against the
    # original population.
    for region in ("northeast", "south", "west"):
        if "census_region" in df:
            df[f"region_{region}"] = (df["census_region"] == region).astype(int)
    for col in ("seniority_rank", "mandate_state", "study_metro", "early_career"):
        if col in df:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    # industry is categorical now that the frame spans operators, grid
    # operators, analytics firms, developers, consultancies and vendors.
    # Utility is the reference category.
    for value in ("grid_operator", "energy_analytics", "developer",
                  "consulting", "grid_vendor", "cooperative", "retailer"):
        if "industry" in df:
            df[f"industry_{value}"] = (df["industry"] == value).astype(int)
    # Role family, with software_data as the reference category.
    for value in ("ai_ml", "siting_dev", "regulatory", "market_commercial",
                  "grid_power", "gis", "sustainability"):
        if "role_family" in df:
            df[f"family_{value}"] = (df["role_family"] == value).astype(int)
    if "job_level" in df:
        df["job_level"] = pd.to_numeric(df["job_level"], errors="coerce").fillna(0)
    for col in ("yrs_exp_min", "posting_age_days", "pay_midpoint", "pay_range_width"):
        if col in df:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    # A posting that states no minimum is treated as 0 years, with a companion
    # indicator so the imputation is not silently confounded with a true 0.
    if "yrs_exp_min" in df:
        df["yrs_exp_stated"] = df["yrs_exp_min"].notna().astype(int)
        df["yrs_exp_min"] = df["yrs_exp_min"].fillna(0)
    return df


# Regressors dropped by available(), and why. Read into the report so a
# coefficient's absence from the table is explained rather than mysterious.
DROPPED_REGRESSORS: dict[str, str] = {}


def available(df: pd.DataFrame, names: list[str]) -> list[str]:
    """Keep regressors that exist, vary, and are not perfectly collinear.

    Constant columns break OLS outright. Perfect collinearity is worse: statsmodels
    returns a rank-deficient fit with a warning and *non-unique* parameters, so
    coefficients still print and look like estimates. At small N this happens
    easily — every Midwest posting in this sample is from Illinois, which is a
    mandate state, so region_* and mandate_state are linearly dependent.

    Dropping the later column of a dependent pair is what the reference-category
    convention does anyway; the point is to do it deliberately and say so.
    """
    DROPPED_REGRESSORS.clear()
    kept: list[str] = []
    for name in names:
        if name not in df.columns:
            DROPPED_REGRESSORS[name] = "not in dataset"
            continue
        series = pd.to_numeric(df[name], errors="coerce")
        if series.notna().sum() == 0:
            DROPPED_REGRESSORS[name] = "all missing"
            continue
        if series.nunique(dropna=True) < 2:
            only = series.dropna().unique()
            DROPPED_REGRESSORS[name] = (
                f"constant at {only[0]:g} in this sample" if len(only) else "constant")
            continue
        kept.append(name)

    # Now remove exact linear dependence, keeping the earlier column of each
    # dependent pair so the pre-registered ordering decides what survives.
    if len(kept) > 1:
        matrix = df[kept].apply(pd.to_numeric, errors="coerce").fillna(0.0)
        matrix = sm.add_constant(matrix, has_constant="add")
        surviving = list(kept)
        while len(surviving) > 1:
            sub = matrix[["const"] + surviving].to_numpy(dtype=float)
            if np.linalg.matrix_rank(sub) == sub.shape[1]:
                break
            dropped = surviving.pop()
            DROPPED_REGRESSORS[dropped] = "perfectly collinear with earlier regressors"
        kept = surviving
    return kept


def fit(df: pd.DataFrame, regressors: list[str], cluster: str = "employer"):
    y = np.log(df["pay_midpoint"])
    X = sm.add_constant(df[regressors].astype(float), has_constant="add")
    model = sm.OLS(y, X, missing="drop")
    if cluster in df.columns and df[cluster].nunique() > 1:
        return model.fit(cov_type="cluster", cov_kwds={"groups": df[cluster]})
    return model.fit(cov_type="HC3")


def vif_table(df: pd.DataFrame, regressors: list[str]) -> dict[str, float]:
    X = sm.add_constant(df[regressors].astype(float), has_constant="add").dropna()
    if X.shape[0] <= X.shape[1]:
        return {}
    out = {}
    for i, name in enumerate(X.columns):
        if name == "const":
            continue
        try:
            out[name] = round(float(variance_inflation_factor(X.values, i)), 2)
        except (np.linalg.LinAlgError, ZeroDivisionError, ValueError):
            out[name] = float("inf")
    return out


def detectable_effect(n: int, k: int, alpha: float = 0.05, power: float = 0.80) -> float | None:
    """Smallest standardized slope detectable at the given N, k, alpha, power.

    Uses the normal approximation: beta_min = (z_a/2 + z_b) / sqrt(n - k - 1).
    Reported in log points, so ~0.05 reads as a ~5% pay difference.
    """
    from scipy import stats

    dof = n - k - 1
    if dof <= 0:
        return None
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z_beta = stats.norm.ppf(power)
    return float((z_alpha + z_beta) / np.sqrt(dof))


def selection_report(df: pd.DataFrame, regressors: list[str]) -> dict:
    """Compare disclosing and non-disclosing postings on observables."""
    if "pay_disclosed" not in df:
        return {}
    disclosed = df[df["pay_disclosed"] == 1]
    withheld = df[df["pay_disclosed"] == 0]
    if withheld.empty or disclosed.empty:
        return {"note": "no variation in disclosure; selection test not applicable",
                "n_disclosed": int(len(disclosed)), "n_withheld": int(len(withheld))}
    from scipy import stats

    rows = {}
    for name in regressors + ["metro_indianapolis", "industry_data_center"]:
        if name not in df.columns:
            continue
        a = pd.to_numeric(disclosed[name], errors="coerce").dropna()
        b = pd.to_numeric(withheld[name], errors="coerce").dropna()
        if len(a) < 2 or len(b) < 2:
            continue
        # Welch's t-test is undefined when both groups are constant, and warns
        # noisily when they are near-identical. Skip those comparisons.
        if float(a.var()) == 0.0 and float(b.var()) == 0.0:
            continue
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            t, p = stats.ttest_ind(a, b, equal_var=False)
        if not np.isfinite(p):
            continue
        rows[name] = {"mean_disclosed": round(float(a.mean()), 3),
                      "mean_withheld": round(float(b.mean()), 3),
                      "diff": round(float(a.mean() - b.mean()), 3),
                      "p_value": round(float(p), 4)}
    return {"n_disclosed": int(len(disclosed)), "n_withheld": int(len(withheld)),
            "disclosure_rate": round(len(disclosed) / len(df), 3), "by_variable": rows}


def result_table(res, label: str) -> dict:
    return {
        "label": label,
        "n": int(res.nobs),
        "r_squared": round(float(res.rsquared), 4),
        "adj_r_squared": round(float(res.rsquared_adj), 4),
        "cov_type": res.cov_type,
        "coefficients": {
            name: {
                "coef": round(float(res.params[name]), 4),
                "std_err": round(float(res.bse[name]), 4),
                "t": round(float(res.tvalues[name]), 3),
                "p_value": round(float(res.pvalues[name]), 4),
                "ci_low": round(float(res.conf_int().loc[name, 0]), 4),
                "ci_high": round(float(res.conf_int().loc[name, 1]), 4),
                # For a binary regressor, exp(coef)-1 is the approximate
                # percentage pay difference. It is meaningless for the
                # intercept, which is a level, not an effect — reporting it
                # there produced "7,370,111%".
                "pct_effect": (None if name == "const"
                               else round((float(np.exp(res.params[name])) - 1) * 100, 2)),
            }
            for name in res.params.index
        },
    }


def run_analysis(dataset: pathlib.Path, out_dir: pathlib.Path) -> dict:
    df = load(dataset)
    out_dir.mkdir(parents=True, exist_ok=True)

    report: dict = {
        "dataset": str(dataset),
        "n_total": int(len(df)),
        "n_with_pay": int((df["pay_disclosed"] == 1).sum()),
        "distinct_employers": int(df["employer"].nunique()),
    }

    estimation = df[(df["pay_disclosed"] == 1) & df["pay_midpoint"].notna()].copy()
    report["n_estimation"] = int(len(estimation))
    report["selection"] = selection_report(df, CORE_MODEL)

    if len(estimation) < 20:
        report["status"] = "insufficient data"
        report["note"] = (
            f"{len(estimation)} usable observations. Estimation is deferred until "
            "the sample is large enough to be meaningful."
        )
        (out_dir / "analysis.json").write_text(json.dumps(report, indent=2))
        return report

    core = available(estimation, CORE_MODEL)
    # Captured immediately: available() resets DROPPED_REGRESSORS on every call,
    # and the secondary models below each call it for their own subsample.
    report["dropped_regressors"] = dict(DROPPED_REGRESSORS)
    budget = max(1, len(estimation) // OBS_PER_REGRESSOR)
    report["regressor_budget"] = budget
    report["specification_chosen"] = "extended" if budget >= len(core) + 5 else "core"

    models = {}
    res_core = fit(estimation, core)
    models["core"] = result_table(res_core, "Core model (pre-specified)")
    report["vif_core"] = vif_table(estimation, core)

    if report["specification_chosen"] == "extended":
        extended = available(estimation, CORE_MODEL + EXTENDED_EXTRA)[:budget]
        res_ext = fit(estimation, extended)
        models["extended"] = result_table(res_ext, "Extended model")
        report["vif_extended"] = vif_table(estimation, extended)

    # Secondary outcome: how wide employers set their ranges.
    width = estimation[estimation["pay_range_width"].notna() & (estimation["pay_range_width"] > 0)]
    if len(width) >= 20:
        y = np.log(width["pay_range_width"])
        # Re-checked on this subsample: a regressor that varies in the full
        # sample can be constant among postings that disclose a RANGE.
        width_reg = available(width, CORE_MODEL)
        X = sm.add_constant(width[width_reg].astype(float), has_constant="add")
        res_w = sm.OLS(y, X, missing="drop").fit(
            cov_type="cluster", cov_kwds={"groups": width["employer"]}
        )
        models["range_width"] = result_table(res_w, "Secondary: log(range width)")


    # --- Model 3: disclosure (pre-registered) --------------------------
    # National coverage is what makes this estimable: at six metros there was
    # almost no variation in mandate_state to identify it from. Reported as a
    # finding in its own right, not a footnote.
    #
    # ASSOCIATIONAL, NOT CAUSAL. This is a single cross-section with no time
    # variation, so there is no difference-in-differences here. Employers who
    # operate in mandate states differ from those who do not in ways this
    # cannot control for. The write-up must not drift into causal language.
    if "mandate_state" in df and df["mandate_state"].notna().any():
        disc = df[df["mandate_state"].notna()].copy()
        share = disc.groupby("mandate_state")["pay_disclosed"].agg(["mean", "count"])
        report["disclosure"] = {
            "by_mandate": {
                ("mandate" if int(k) == 1 else "no_mandate"): {
                    "share_disclosed": round(float(v["mean"]), 4),
                    "n": int(v["count"]),
                }
                for k, v in share.iterrows()
            },
            "design": "associational; single cross-section, no DiD available",
        }
        both = disc["mandate_state"].nunique() > 1
        varies = disc["pay_disclosed"].nunique() > 1
        if both and varies and len(disc) >= 30:
            controls = available(disc, ["seniority_rank", "remote_eligible",
                                        "industry_data_center", "region_northeast",
                                        "region_south", "region_west"])
            X = sm.add_constant(disc[["mandate_state"] + controls].astype(float),
                                has_constant="add")
            res_d = sm.OLS(disc["pay_disclosed"].astype(float), X, missing="drop").fit(
                cov_type="cluster", cov_kwds={"groups": disc["employer"]}
            )
            models["disclosure_lpm"] = result_table(
                res_d, "Model 3: pay disclosed (linear probability)")
        else:
            report["disclosure"]["note"] = (
                "not estimated: needs variation in both mandate status and "
                "disclosure, and at least 30 postings")

    # --- Model 4: early-career subsample (pre-registered) --------------
    # The study's original question. Reported whether or not it agrees with the
    # full sample; a disagreement is a finding, not a reason to drop it.
    if "early_career" in estimation:
        ec = estimation[estimation["early_career"] == 1]
        report["early_career_subsample"] = {"n": int(len(ec)),
                                            "n_employers": int(ec["employer"].nunique())}
        if len(ec) >= 20:
            ec_reg = available(ec, core)
            res_ec = fit(ec, ec_reg)
            models["early_career"] = result_table(
                res_ec, "Model 4: early-career subsample (original question)")
        else:
            report["early_career_subsample"]["note"] = (
                f"{len(ec)} observations; too few to estimate separately")

    # --- Robustness: price-adjusted pay --------------------------------
    real = estimation[estimation["pay_midpoint_real"].notna()] \
        if "pay_midpoint_real" in estimation else estimation.iloc[0:0]
    if len(real) >= 20:
        y = np.log(real["pay_midpoint_real"].astype(float))
        real_reg = available(real, CORE_MODEL)
        X = sm.add_constant(real[real_reg].astype(float), has_constant="add")
        res_r = sm.OLS(y, X, missing="drop").fit(
            cov_type="cluster", cov_kwds={"groups": real["employer"]}
        )
        models["real_pay"] = result_table(
            res_r, "Robustness: log(pay), BEA price-adjusted")
        report["price_adjustment"] = {"n": int(len(real)), "available": True}
    else:
        report["price_adjustment"] = {
            "n": int(len(real)), "available": False,
            "note": ("BEA regional price parities were not fetched, so pay is "
                     "nominal only. No deflator is imputed."),
        }

    obs_per_regressor = len(estimation) / max(1, len(core))
    n_clusters = int(estimation["employer"].nunique())
    warnings_list = []
    if obs_per_regressor < 10:
        warnings_list.append(
            f"{obs_per_regressor:.1f} observations per regressor ({len(estimation)} "
            f"observations, {len(core)} regressors). Below about 10 the estimates "
            "are overfit and the coefficients should not be interpreted.")
    if n_clusters < 20:
        warnings_list.append(
            f"{n_clusters} employer clusters. Cluster-robust standard errors are "
            "biased downward with few clusters, so p-values are anti-conservative. "
            "A wild cluster bootstrap is required before reporting significance.")
    detectable = detectable_effect(len(estimation), len(core))
    if detectable and detectable > 0.25:
        warnings_list.append(
            f"Minimum detectable effect is {detectable:.2f} log points, roughly a "
            f"{(np.exp(detectable) - 1) * 100:.0f}% pay difference. Any coefficient "
            "smaller than that is not distinguishable from noise regardless of its "
            "p-value.")
    report["interpretability_warnings"] = warnings_list
    report["interpretable"] = not warnings_list
    report["obs_per_regressor"] = round(obs_per_regressor, 2)
    report["n_clusters"] = n_clusters

    report["models"] = models
    report["power"] = {
        "n": len(estimation),
        "k_core": len(core),
        "min_detectable_std_effect_log_points": round(
            detectable_effect(len(estimation), len(core)) or float("nan"), 4
        ),
        "interpretation": (
            "Smallest standardized effect detectable at alpha=0.05 with 80% power. "
            "In log points: 0.05 is roughly a 5% pay difference."
        ),
    }
    report["descriptives"] = {
        "pay_midpoint": {
            stat: round(float(getattr(estimation["pay_midpoint"], stat)()), 2)
            for stat in ("mean", "median", "std", "min", "max")
        },
        "by_metro": {
            str(k): int(v) for k, v in estimation["metro"].value_counts().items()
        },
        "by_industry": {
            str(k): int(v) for k, v in estimation["industry"].value_counts().items()
        },
    }
    report["status"] = "ok"
    (out_dir / "analysis.json").write_text(json.dumps(report, indent=2))
    _write_markdown(report, out_dir / "results.md")
    return report


def _write_markdown(report: dict, path: pathlib.Path) -> None:
    lines = ["# Results", "",
             f"- Postings in scope: **{report['n_total']}**",
             f"- With disclosed pay: **{report['n_with_pay']}**",
             f"- Used in estimation: **{report['n_estimation']}**",
             f"- Distinct employers: **{report['distinct_employers']}**", ""]
    if report.get("status") != "ok":
        lines += [f"> {report.get('note', 'Analysis not run.')}", ""]
        path.write_text("\n".join(lines) + "\n")
        return

    if report.get("interpretability_warnings"):
        lines += ["> **These estimates are not yet interpretable.**", ">"]
        for w in report["interpretability_warnings"]:
            lines.append(f"> - {w}")
        lines += [">",
                  "> The model is reported so the pipeline is verifiable end to end, "
                  "not because the coefficients mean anything yet. Collect more "
                  "before drawing conclusions.", ""]

    power = report["power"]
    lines += [
        f"Regressor budget at {OBS_PER_REGRESSOR} observations each: "
        f"**{report['regressor_budget']}** "
        f"(specification used: **{report['specification_chosen']}**).", "",
        f"Minimum detectable standardized effect: "
        f"**{power['min_detectable_std_effect_log_points']}** log points "
        "(alpha 0.05, power 0.80).", "",
    ]
    for key, model in report["models"].items():
        lines += [f"## {model['label']}", "",
                  f"N = {model['n']}, R² = {model['r_squared']}, "
                  f"adjusted R² = {model['adj_r_squared']}, SE: {model['cov_type']}", "",
                  "| Variable | Coef | Std err | p | 95% CI | Approx % effect |",
                  "|---|---|---|---|---|---|"]
        for name, c in model["coefficients"].items():
            stars = "***" if c["p_value"] < 0.01 else "**" if c["p_value"] < 0.05 else "*" if c["p_value"] < 0.10 else ""
            pct = "—" if c["pct_effect"] is None else f"{c['pct_effect']}%"
            lines.append(
                f"| `{name}` | {c['coef']}{stars} | {c['std_err']} | {c['p_value']} | "
                f"[{c['ci_low']}, {c['ci_high']}] | {pct} |"
            )
        lines += ["", "Significance: *** p<0.01, ** p<0.05, * p<0.10.", ""]

    sel = report.get("selection") or {}
    if sel.get("by_variable"):
        lines += ["## Disclosure selection", "",
                  f"Disclosure rate: **{sel['disclosure_rate']}** "
                  f"({sel['n_disclosed']} disclosed, {sel['n_withheld']} withheld).", "",
                  "| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |",
                  "|---|---|---|---|---|"]
        for name, row in sel["by_variable"].items():
            lines.append(f"| `{name}` | {row['mean_disclosed']} | {row['mean_withheld']} | "
                         f"{row['diff']} | {row['p_value']} |")
        lines.append("")
    path.write_text("\n".join(lines) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Estimate the pay model.")
    parser.add_argument("--dataset", default=str(ROOT / "data" / "analysis" / "postings.csv"))
    parser.add_argument("--out", default=str(ROOT / "data" / "analysis"))
    args = parser.parse_args()
    path = pathlib.Path(args.dataset)
    if not path.exists():
        print(f"dataset not found: {path}")
        return 1
    report = run_analysis(path, pathlib.Path(args.out))
    print(json.dumps({k: report[k] for k in
                      ("n_total", "n_with_pay", "n_estimation", "status")}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

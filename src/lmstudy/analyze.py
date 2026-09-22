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
# Pre-registration section 6: the interpretability block fires below this
# many employer clusters. Changing it needs a dated amendment there.
CLUSTER_GATE = 30

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


# --- Wild cluster bootstrap ------------------------------------------------
# Required by docs/pre-registration.md section 6 before ANY significance claim
# while employer clusters number under 30. It is not decoration: the coverage
# simulation in tests/test_analyze.py measures cluster-robust errors covering
# 92% against a nominal 95%, and over-rejecting a cluster-level placebo at 9.5%
# against a nominal 5%, so the asymptotic p-values are anti-conservative and a
# marginal one cannot be trusted. (The 88% previously cited here was measured
# on a fixture whose employer shock reached one posting per employer rather
# than all of them, so it described data with no within-employer correlation.)
#
# Cameron, Gelbach and Miller (2008), restricted ("null-imposed") variant,
# which is what the literature recommends for few clusters: the bootstrap
# data-generating process satisfies the null being tested, so the reference
# distribution is the distribution of t under H0 rather than around the
# estimate. Rademacher weights, drawn once per CLUSTER per replication -- the
# whole point is to preserve within-employer dependence, and drawing per
# observation would destroy exactly the correlation being corrected for.
# 9999, not 999. At 999 replications `degree_required` returned 0.049, 0.063
# and 0.082 across three seeds, straddling the very threshold its verdict is
# read off. Monte Carlo error must be small relative to the decision being
# made, and at 9999 the same coefficient is stable at 0.069. Costs ~100s.
BOOTSTRAP_REPS = 9999
BOOTSTRAP_SEED = 20260922


def _cluster_t(X: np.ndarray, y: np.ndarray, groups: np.ndarray,
               idx: int) -> tuple[float, float]:
    """OLS coefficient idx and its cluster-robust t, computed in numpy.

    Matches statsmodels cov_type="cluster" with use_correction=True, whose
    finite-sample factor is (G/(G-1)) * ((N-1)/(N-K)). Verified against a
    statsmodels fit in tests/test_analyze.py rather than assumed -- the
    bootstrap is only valid if t* and the observed t are on the same scale.
    """
    n, k = X.shape
    xtx_inv = np.linalg.pinv(X.T @ X)
    beta = xtx_inv @ (X.T @ y)
    resid = y - X @ beta
    uniq = np.unique(groups)
    meat = np.zeros((k, k))
    for g in uniq:
        m = groups == g
        xu = X[m].T @ resid[m]
        meat += np.outer(xu, xu)
    g_count = len(uniq)
    correction = (g_count / max(1, g_count - 1)) * ((n - 1) / max(1, n - k))
    cov = xtx_inv @ meat @ xtx_inv * correction
    var = cov[idx, idx]
    se = float(np.sqrt(var)) if var > 0 else float("nan")
    return float(beta[idx]), (float(beta[idx]) / se if se and se == se else float("nan"))


def _expand_cluster_weights(rng, masks: list[np.ndarray], n: int) -> np.ndarray:
    """One Rademacher draw per CLUSTER, expanded to that cluster's rows.

    Extracted so the property the bootstrap depends on can be tested exactly.
    A Monte Carlo test was tried first and abandoned: at 12 clusters and an
    intra-cluster correlation of 0.97, the per-cluster and per-observation
    variants rejected a cluster-level placebo at 4.5% and 6.0% over 200 draws,
    a gap well inside sampling noise, so a sabotaged implementation passed the
    statistical check. The mechanism is deterministic, so it is tested as a
    mechanism.
    """
    draws = rng.choice(np.array([-1.0, 1.0]), size=len(masks))
    weights = np.empty(n)
    for mask, w in zip(masks, draws):
        weights[mask] = w
    return weights


def wild_cluster_bootstrap(df: pd.DataFrame, regressors: list[str],
                           cluster: str = "employer",
                           reps: int = BOOTSTRAP_REPS,
                           seed: int = BOOTSTRAP_SEED) -> dict:
    """Restricted wild cluster bootstrap p-value for each regressor.

    For each regressor j the null b_j = 0 is imposed by re-fitting WITHOUT j,
    then each replication rebuilds the outcome as fitted_restricted + w_g *
    residual_restricted and re-estimates the FULL model. The p-value is the
    share of replications whose |t*| reaches the observed |t|.
    """
    y_full = np.log(df["pay_midpoint"].astype(float)).to_numpy()
    X_full = np.column_stack([
        np.ones(len(df)),
        *[df[r].astype(float).to_numpy() for r in regressors],
    ])
    groups = df[cluster].to_numpy()
    uniq = np.unique(groups)
    # Precomputed once: which rows belong to which cluster. Rebuilding this
    # inside the replication loop dominated the runtime.
    masks = [groups == g for g in uniq]
    rng = np.random.default_rng(seed)

    out: dict[str, dict] = {}
    for j, name in enumerate(regressors, start=1):
        beta_hat, t_hat = _cluster_t(X_full, y_full, groups, j)
        if not np.isfinite(t_hat):
            out[name] = {"coef": round(beta_hat, 4), "t_observed": None,
                         "p_value": None, "reps": 0,
                         "note": "standard error not estimable"}
            continue
        # Restricted fit: the null is imposed by omitting the regressor.
        keep = [c for c in range(X_full.shape[1]) if c != j]
        X_r = X_full[:, keep]
        beta_r = np.linalg.pinv(X_r.T @ X_r) @ (X_r.T @ y_full)
        fitted_r = X_r @ beta_r
        resid_r = y_full - fitted_r

        extreme = 0
        valid = 0
        for _ in range(reps):
            weights = _expand_cluster_weights(rng, masks, len(df))
            y_star = fitted_r + weights * resid_r
            _, t_star = _cluster_t(X_full, y_star, groups, j)
            if np.isfinite(t_star):
                valid += 1
                if abs(t_star) >= abs(t_hat):
                    extreme += 1
        # (extreme + 1) / (reps + 1): the observed statistic is itself one
        # draw from the null distribution, so a p-value of exactly zero is not
        # attainable and is not claimed.
        p = (extreme + 1) / (valid + 1) if valid else None
        out[name] = {
            "coef": round(beta_hat, 4),
            "t_observed": round(t_hat, 3),
            "p_value": round(p, 4) if p is not None else None,
            "reps": valid,
        }
    return {
        "method": "restricted wild cluster bootstrap, Rademacher weights",
        "reference": "Cameron, Gelbach & Miller (2008)",
        "reps_requested": reps,
        "n_clusters": int(len(uniq)),
        "seed": seed,
        "by_variable": out,
    }


def run_analysis(dataset: pathlib.Path, out_dir: pathlib.Path,
                 bootstrap_reps: int = BOOTSTRAP_REPS) -> dict:
    df = load(dataset)
    out_dir.mkdir(parents=True, exist_ok=True)

    report: dict = {
        "dataset": str(dataset),
        "n_total": int(len(df)),
        "n_with_pay": int((df["pay_disclosed"] == 1).sum()),
        # Counted over the in-scope corpus, which is NOT the cluster count.
        "distinct_employers_in_scope": int(df["employer"].nunique()),
    }

    estimation = df[(df["pay_disclosed"] == 1) & df["pay_midpoint"].notna()].copy()
    report["n_estimation"] = int(len(estimation))
    # `distinct_employers` is the ESTIMATION sample's employer count, because
    # that is the number every consumer of this field means: the clusters the
    # standard errors rest on and the figure the pre-registered 30-employer
    # condition is judged against. It previously counted the whole in-scope
    # corpus, so results.md and the slide deck both reported 30 employers
    # beside 137 estimation rows when the true cluster count was 23 -- which
    # is exactly the pre-registered target, displayed as met while failing.
    report["distinct_employers"] = int(estimation["employer"].nunique())
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
        # Robustness. The headline gap moved from 71 to 50 points when the
        # corpus grew, and the whole move came from ONE employer in ONE state:
        # 23 of the 25 non-disclosing mandate-state postings are Guidehouse and
        # 24 of 25 are in Virginia, whose mandate took effect 2026-07-01 and is
        # under three months old. Cutting each way is what tells a reader
        # whether the contrast is a finding or an artifact of composition.
        cuts = {}
        for label, mask in (
            ("all", disc.index == disc.index),
            ("excluding_virginia",
             ~disc.get("states_listed", pd.Series("", index=disc.index))
                 .fillna("").astype(str).str.contains("VA")),
            ("excluding_largest_employer",
             disc["employer"] != disc["employer"].value_counts().idxmax()),
        ):
            sub = disc[mask]
            m1 = sub[sub["mandate_state"] == 1]
            m0 = sub[sub["mandate_state"] == 0]
            if len(m1) and len(m0):
                a = float(m1["pay_disclosed"].mean())
                b = float(m0["pay_disclosed"].mean())
                cuts[label] = {
                    "mandate": round(a, 4), "n_mandate": int(len(m1)),
                    "no_mandate": round(b, 4), "n_no_mandate": int(len(m0)),
                    "gap": round(a - b, 4),
                }
        report["disclosure"]["robustness"] = cuts
        # Measured, not asserted. This note read "its SIZE is sensitive to
        # Virginia ... partial compliance with a three-month-old statute"
        # unconditionally. That was true at a 50-71 point spread and became
        # false once audit round 4 removed a federal consultancy's
        # off-umbrella postings, which WERE the Virginia non-disclosers. A
        # caveat that cannot stop applying is not a caveat; it is a claim.
        _gaps = [v["gap"] for v in cuts.values()] if cuts else []
        _spread = (max(_gaps) - min(_gaps)) if len(_gaps) > 1 else 0.0
        if _spread > 0.10:
            report["disclosure"]["note"] = (
                "The gap is large under every cut, but its SIZE is sensitive "
                f"to one jurisdiction: the cuts span {_spread * 100:.0f} "
                "points. Read the robustness table rather than a single "
                "figure, and treat a very recent mandate as partially "
                "complied with rather than assuming otherwise."
            )
        else:
            report["disclosure"]["note"] = (
                "The gap is large under every cut and stable across them, a "
                f"spread of {_spread * 100:.0f} points. An earlier version of "
                "this study reported it swinging from 50 to 71 points and "
                "sensitive to Virginia alone; that sensitivity was an "
                "artifact of including a federal consultancy's public health, "
                "national security and law-enforcement postings, removed in "
                "audit round 4 as outside the sector under study."
            )

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
    # 30, not 20. docs/pre-registration.md section 6 fixes the gate at "clusters
    # below 30", and the code read 20 -- lenient in exactly the direction that
    # flatters the study. At 23 clusters the warning did not fire at all, and
    # had observations per regressor risen above 10 the whole block would have
    # disappeared while the pre-registered condition still failed.
    if n_clusters < CLUSTER_GATE:
        warnings_list.append(
            f"{n_clusters} employer clusters, against the {CLUSTER_GATE} "
            "pre-registered. Cluster-robust standard errors are biased downward "
            "with few clusters, so the asymptotic p-values are anti-conservative. "
            "Read the wild cluster bootstrap p-values below, not these.")
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

    # Run unconditionally while the cluster gate binds. Deciding to run it only
    # when a p-value looks marginal would make the reported inference depend on
    # the result, which is the thing the pre-registration exists to prevent.
    if n_clusters < CLUSTER_GATE and bootstrap_reps > 0:
        report["wild_cluster_bootstrap"] = wild_cluster_bootstrap(
            estimation, core, reps=bootstrap_reps)

        # Nationwide-remote postings resolve to no state, so all three census
        # dummies are zero and they fall into the MIDWEST reference without
        # being Midwest (docs/limitations.md 9a). This re-estimates without
        # them. It is reported whichever way it comes out: it confirmed
        # `region_south`, and it withdrew `remote_eligible`, which is
        # identified partly off exactly these rows -- the nationwide-remote
        # postings are the remote-eligible ones.
        regionless = (estimation["state"].isna() | (estimation["state"] == "")
                      | (estimation["metro"] == "remote_national"))
        dropped_n = int(regionless.sum())
        if 0 < dropped_n < len(estimation) - 30:
            sub = estimation[~regionless].copy()
            sub_reg = available(sub, core)
            res_sub = fit(sub, sub_reg)
            sub_boot = wild_cluster_bootstrap(
                sub, sub_reg, reps=min(bootstrap_reps, 1999),
                seed=BOOTSTRAP_SEED + 1)["by_variable"]
            base = report["wild_cluster_bootstrap"]["by_variable"]
            changed = [
                n for n in sub_reg
                if n in base and base[n].get("p_value") is not None
                and sub_boot.get(n, {}).get("p_value") is not None
                and ((base[n]["p_value"] < 0.05)
                     != (sub_boot[n]["p_value"] < 0.05))
            ]
            report["region_robustness"] = {
                "n": int(len(sub)),
                "n_dropped": dropped_n,
                "n_clusters": int(sub["employer"].nunique()),
                "why": ("nationwide-remote postings have no resolvable state, "
                        "so they sit in the Midwest reference category of the "
                        "census-region dummies without being Midwest"),
                "verdicts_changed": changed,
                "by_variable": {
                    n: {"coef": round(float(res_sub.params[n]), 4),
                        "clustered_p": round(float(res_sub.pvalues[n]), 4),
                        "bootstrap_p": sub_boot.get(n, {}).get("p_value")}
                    for n in sub_reg
                },
            }

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
             f"- Distinct employers in the estimation sample "
             f"(**the cluster count**): **{report['distinct_employers']}**",
             f"- Distinct employers across all postings in scope: "
             f"**{report.get('distinct_employers_in_scope', 'n/a')}**", ""]
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

    boot = report.get("wild_cluster_bootstrap")
    if boot and boot.get("by_variable"):
        core_coeffs = (report.get("models", {}).get("core", {}) or {}).get("coefficients", {})
        lines += ["## Wild cluster bootstrap", "",
                  f"{boot['method'].capitalize()}, {boot['reps_requested']} replications "
                  f"over {boot['n_clusters']} employer clusters "
                  f"({boot['reference']}, seed {boot['seed']}).", "",
                  "**These are the p-values to read.** The asymptotic clustered "
                  "p-values in the table above are anti-conservative at this cluster "
                  "count, and the pre-registration requires the bootstrap before any "
                  "significance claim while clusters stay under "
                  f"{CLUSTER_GATE}.", "",
                  "| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |",
                  "|---|---|---|---|---|"]
        changed = []
        for name, b in boot["by_variable"].items():
            clustered_p = core_coeffs.get(name, {}).get("p_value")
            bp = b["p_value"]
            if clustered_p is None or bp is None:
                verdict = "not estimable"
            else:
                was = clustered_p < 0.05
                now = bp < 0.05
                if was and not now:
                    verdict = "**no longer significant**"
                    changed.append(name)
                elif now and not was:
                    verdict = "**becomes significant**"
                    changed.append(name)
                else:
                    verdict = "unchanged" + (" (significant)" if now else " (null)")
            lines.append(
                f"| `{name}` | {b['coef']} | "
                f"{'—' if clustered_p is None else clustered_p} | "
                f"{'—' if bp is None else bp} | {verdict} |")
        lines += [""]
        if changed:
            lines += ["Conclusions that change once clustering is bootstrapped: "
                      + ", ".join(f"`{c}`" for c in changed)
                      + ". Any claim about these rests on the bootstrap column, "
                        "not the clustered one.", ""]
        else:
            lines += ["No variable's significance verdict changes at the 0.05 level. "
                      "The clustered p-values survive the bootstrap here; that is a "
                      "result of the check, not a reason to have skipped it.", ""]

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

# Advertised Pay in Early-Career Software and Data Roles
## Evidence from Utility and Data Center Operators in Chicago and Indianapolis

*Built from data collected through 2026-09-21. Collection cycles: 2.*

## 1. Introduction

Data center construction is driving a wave of technical hiring across the
utility sector and the colocation operators that depend on it. Both compete
for early-career software and data talent against employers who pay on a
national technology scale. This paper asks which attributes stated in a job
posting predict the pay that employers advertise for those roles.

The dependent variable is the natural log of the midpoint of the
employer-stated pay range, annualized to US dollars.

## 2. Institutional background

Illinois House Bill 3129, amending the Illinois Equal Pay Act, took effect on
1 January 2025. Employers with fifteen or more employees must state the pay
scale and describe benefits in any posting for work performed at least partly
in Illinois. Both the dependent variable and several benefit regressors are
therefore legally required to appear in Chicago-area postings.

Indiana has no comparable requirement. Indianapolis postings disclose pay far
less often, and those that do are self-selected. The indicator `mandate_state`
carries this contrast into the analysis rather than leaving it implicit.

## 3. Data

### 3.1 Source

Postings are collected from the public, unauthenticated applicant tracking
system APIs that employers publish through, which are the upstream source for
the job boards those postings appear on. LinkedIn is not used: its User
Agreement prohibits programmatic collection. Full methodological detail,
including the compliance posture, is in `docs/methods.md`.

### 3.2 Sampling frame

The frame is restricted to core operators — firms that own or operate
utilities or data centers — excluding the engineering firms and equipment
vendors that serve the sector. Roles are restricted to software, data and
analytics. Early career means three years or fewer of required experience.

> **Known gap.** Exelon and ComEd run iCIMS, which exposes no free public
> jobs API. They are the largest Chicago-headquartered utility employer and
> the most likely source of Chicago early-career software and data roles.
> Results describing "Chicago utilities" exclude them.

### 3.3 Selection funnel

| Stage | Postings |
|---|---|
| Retrieved from ATS boards | 696 |
| Passed role, seniority and internship screens | 72 |
| Within 35 miles of a study metro | 43 |
| Unique after de-duplication | 38 |
| With a disclosed pay range (estimation sample) | 35 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 408 |
| `seniority_excluded` | 304 |
| `role_excluded` | 190 |
| `experience_too_high` | 53 |
| `out_of_metro` | 29 |
| `internship` | 22 |

Distinct employers contributing a disclosed range: **8**. By metro: `{'denver': 8, 'chicago': 21, 'northern_virginia': 6}`.

> The pre-registered floor of 100 usable
> observations is **not yet met**. Collection continues; the escalation
> rule in `config/scope.yaml` governs what widens if it stays unmet.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

*TODO: no audit has been scored yet. Run `src/lmstudy/audit.py sample`,
hand-code the sheet, then `audit.py score`. Accuracy claims must not be
made until this exists.*

## 4. Empirical strategy

The specification regresses log advertised pay on posting attributes, with
standard errors clustered by employer because employers contribute many
postings each. A core model is pre-specified; an extended model is estimated
only when the sample supports roughly twenty observations per regressor, so
the specification is chosen by sample size rather than by results.

Cluster-robust standard errors are biased downward when clusters are few.
Simulation with twelve employer clusters recovered nominal 95% coverage of
only about 88%. Where the realized employer count is small, a wild cluster
bootstrap should precede any claim resting on a marginal p-value.

## 5. Results

> **Not yet interpretable.** 3.2 observations per regressor (35 observations, 11 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
>
> **Not yet interpretable.** 8 employer clusters. Cluster-robust standard errors are biased downward with few clusters, so p-values are anti-conservative. A wild cluster bootstrap is required before reporting significance.
>
> **Not yet interpretable.** Minimum detectable effect is 0.58 log points, roughly a 79% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model below is reported so the pipeline is verifiable end to end,
> not because the coefficients support conclusions.

Advertised pay in the estimation sample averages **$90,112** (median $81,000, SD $30,789, range $46,500–$148,500).

At N = 35 with 11 regressors, the smallest
detectable standardized effect is **0.5842**
log points at 5% significance and 80% power.

### Core model (pre-specified)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.2078*** | 0.1268 | 0.000 | [10.959, 11.456] | — |
| `degree_stem` | 0.3072** | 0.1494 | 0.040 | [0.014, 0.600] | 36.0% |
| `advanced_degree_pref` | 0.4610*** | 0.0428 | 0.000 | [0.377, 0.545] | 58.6% |
| `yrs_exp_min` | -0.1979*** | 0.0632 | 0.002 | [-0.322, -0.074] | -18.0% |
| `yrs_exp_stated` | 0.3374*** | 0.1178 | 0.004 | [0.106, 0.568] | 40.1% |
| `skill_cloud` | -0.2220 | 0.2704 | 0.412 | [-0.752, 0.308] | -19.9% |
| `skill_ml_ai` | 0.4997*** | 0.1824 | 0.006 | [0.142, 0.857] | 64.8% |
| `soft_leadership` | 0.2183 | 0.3376 | 0.518 | [-0.443, 0.880] | 24.4% |
| `industry_data_center` | 0.2461** | 0.1019 | 0.016 | [0.046, 0.446] | 27.9% |
| `remote_eligible` | 0.2611 | 0.1807 | 0.148 | [-0.093, 0.615] | 29.8% |
| `job_level` | -0.0237 | 0.0656 | 0.718 | [-0.152, 0.105] | -2.3% |
| `family_ai_ml` | -0.3247*** | 0.0875 | 0.000 | [-0.496, -0.153] | -27.7% |

*** p<0.01, ** p<0.05, * p<0.10. N = 35, R² = 0.713, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4387*** | 0.8952 | 0.000 | [9.684, 13.193] | — |
| `degree_stem` | -0.1389 | 0.6306 | 0.826 | [-1.375, 1.097] | -13.0% |
| `advanced_degree_pref` | -0.2788** | 0.1383 | 0.044 | [-0.550, -0.008] | -24.3% |
| `yrs_exp_min` | 0.7658* | 0.4190 | 0.068 | [-0.055, 1.587] | 115.1% |
| `yrs_exp_stated` | -1.8673 | 1.6046 | 0.244 | [-5.012, 1.278] | -84.5% |
| `skill_cloud` | -0.3533 | 0.9915 | 0.722 | [-2.296, 1.590] | -29.8% |
| `skill_ml_ai` | 0.2498 | 0.9749 | 0.798 | [-1.661, 2.161] | 28.4% |
| `soft_leadership` | -1.1051 | 1.1748 | 0.347 | [-3.408, 1.198] | -66.9% |
| `industry_data_center` | -0.5862 | 0.5848 | 0.316 | [-1.732, 0.560] | -44.4% |
| `remote_eligible` | -1.3993 | 0.8985 | 0.119 | [-3.160, 0.362] | -75.3% |
| `job_level` | -0.7470 | 0.5030 | 0.138 | [-1.733, 0.239] | -52.6% |
| `family_ai_ml` | -0.4013 | 0.8437 | 0.634 | [-2.055, 1.252] | -33.1% |

*** p<0.01, ** p<0.05, * p<0.10. N = 35, R² = 0.415, SE: cluster.

### Who discloses pay

Disclosure rate **92.1%** (35 disclosed, 3 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `degree_stem` | 0.257 | 0.0 | 0.257 | 0.0016 |
| `advanced_degree_pref` | 0.114 | 0.333 | -0.219 | 0.5802 |
| `yrs_exp_min` | 0.629 | 1.333 | -0.705 | 0.403 |
| `yrs_exp_stated` | 0.257 | 0.667 | -0.41 | 0.3435 |
| `skill_cloud` | 0.057 | 0.0 | 0.057 | 0.1603 |
| `skill_ml_ai` | 0.086 | 0.0 | 0.086 | 0.0831 |
| `soft_leadership` | 0.086 | 0.0 | 0.086 | 0.0831 |
| `industry_data_center` | 0.143 | 0.0 | 0.143 | 0.023 |
| `remote_eligible` | 0.057 | 0.0 | 0.057 | 0.1603 |
| `job_level` | 0.971 | 0.667 | 0.305 | 0.6946 |
| `family_ai_ml` | 0.086 | 0.0 | 0.086 | 0.0831 |

## 6. Threats to validity

These are treated at length in `docs/limitations.md`. In short: the outcome is
advertised pay rather than realized pay; disclosure is selected, and that
selection is concentrated in Indiana where no mandate applies; the panel has
no historical backfill, so the opening sample over-represents long-open roles;
rule-based coding misreads some postings, which the audit measures rather than
assumes away; standard errors under-cover when employer clusters are few; and
Exelon and ComEd are absent from the frame entirely.

## 7. Conclusion

*TODO: write once the results above are stable across collection cycles.*

## Appendix

- `docs/codebook.md` — every variable and its coding rule
- `docs/methods.md` — design, compliance posture, estimation strategy
- `docs/limitations.md` — what the data cannot support
- `docs/audit-log.md` — coding accuracy by round
- `data/analysis/postings.csv` — the analysis dataset
- `data/analysis/selection_funnel.json` — full funnel and rejection reasons

Reproduce with `pip install -r requirements.txt && python tests/run_all.py`,
then `python src/lmstudy/collect/run.py && python src/lmstudy/build_dataset.py`.

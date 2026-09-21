# Results

- Postings in scope: **38**
- With disclosed pay: **35**
- Used in estimation: **35**
- Distinct employers: **8**

> **These estimates are not yet interpretable.**
>
> - 3.2 observations per regressor (35 observations, 11 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - 8 employer clusters. Cluster-robust standard errors are biased downward with few clusters, so p-values are anti-conservative. A wild cluster bootstrap is required before reporting significance.
> - Minimum detectable effect is 0.58 log points, roughly a 79% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **1** (specification used: **core**).

Minimum detectable standardized effect: **0.5842** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 35, R² = 0.7125, adjusted R² = 0.575, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2078*** | 0.1268 | 0.0 | [10.9593, 11.4563] | — |
| `degree_stem` | 0.3072** | 0.1494 | 0.0398 | [0.0144, 0.6] | 35.96% |
| `advanced_degree_pref` | 0.461*** | 0.0428 | 0.0 | [0.3771, 0.5449] | 58.56% |
| `yrs_exp_min` | -0.1979*** | 0.0632 | 0.0017 | [-0.3218, -0.074] | -17.96% |
| `yrs_exp_stated` | 0.3374*** | 0.1178 | 0.0042 | [0.1064, 0.5683] | 40.12% |
| `skill_cloud` | -0.222 | 0.2704 | 0.4118 | [-0.752, 0.3081] | -19.91% |
| `skill_ml_ai` | 0.4997*** | 0.1824 | 0.0061 | [0.1423, 0.8571] | 64.83% |
| `soft_leadership` | 0.2183 | 0.3376 | 0.5178 | [-0.4433, 0.88] | 24.4% |
| `industry_data_center` | 0.2461** | 0.1019 | 0.0158 | [0.0463, 0.4459] | 27.9% |
| `remote_eligible` | 0.2611 | 0.1807 | 0.1485 | [-0.0931, 0.6152] | 29.83% |
| `job_level` | -0.0237 | 0.0656 | 0.7179 | [-0.1523, 0.1049] | -2.34% |
| `family_ai_ml` | -0.3247*** | 0.0875 | 0.0002 | [-0.4962, -0.1532] | -27.73% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 35, R² = 0.4147, adjusted R² = 0.1348, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4387*** | 0.8952 | 0.0 | [9.6842, 13.1932] | — |
| `degree_stem` | -0.1389 | 0.6306 | 0.8257 | [-1.3748, 1.0971] | -12.97% |
| `advanced_degree_pref` | -0.2788** | 0.1383 | 0.0439 | [-0.5499, -0.0077] | -24.33% |
| `yrs_exp_min` | 0.7658* | 0.419 | 0.0676 | [-0.0554, 1.5869] | 115.07% |
| `yrs_exp_stated` | -1.8673 | 1.6046 | 0.2445 | [-5.0121, 1.2776] | -84.55% |
| `skill_cloud` | -0.3533 | 0.9915 | 0.7216 | [-2.2965, 1.59] | -29.76% |
| `skill_ml_ai` | 0.2498 | 0.9749 | 0.7978 | [-1.661, 2.1606] | 28.38% |
| `soft_leadership` | -1.1051 | 1.1748 | 0.3469 | [-3.4077, 1.1975] | -66.88% |
| `industry_data_center` | -0.5862 | 0.5848 | 0.3162 | [-1.7325, 0.5601] | -44.36% |
| `remote_eligible` | -1.3993 | 0.8985 | 0.1194 | [-3.1603, 0.3617] | -75.32% |
| `job_level` | -0.747 | 0.503 | 0.1376 | [-1.7329, 0.239] | -52.62% |
| `family_ai_ml` | -0.4013 | 0.8437 | 0.6343 | [-2.0548, 1.2522] | -33.06% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.921** (35 disclosed, 3 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
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


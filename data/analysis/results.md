# Results

- Postings in scope: **56**
- With disclosed pay: **44**
- Used in estimation: **44**
- Distinct employers: **15**

> **These estimates are not yet interpretable.**
>
> - 4.0 observations per regressor (44 observations, 11 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - 13 employer clusters. Cluster-robust standard errors are biased downward with few clusters, so p-values are anti-conservative. A wild cluster bootstrap is required before reporting significance.
> - Minimum detectable effect is 0.50 log points, roughly a 64% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **2** (specification used: **core**).

Minimum detectable standardized effect: **0.4953** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 44, R² = 0.6934, adjusted R² = 0.588, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.1622*** | 0.1151 | 0.0 | [10.9366, 11.3878] | — |
| `degree_stem` | 0.3419*** | 0.0492 | 0.0 | [0.2454, 0.4384] | 40.77% |
| `advanced_degree_pref` | 0.3961*** | 0.0757 | 0.0 | [0.2478, 0.5444] | 48.6% |
| `yrs_exp_min` | -0.2058 | 0.1343 | 0.1253 | [-0.4689, 0.0574] | -18.6% |
| `yrs_exp_stated` | 0.5353* | 0.3106 | 0.0848 | [-0.0734, 1.1439] | 70.79% |
| `skill_cloud` | 0.6648*** | 0.2 | 0.0009 | [0.2727, 1.0568] | 94.4% |
| `skill_ml_ai` | -0.3764 | 0.2349 | 0.1091 | [-0.8369, 0.084] | -31.37% |
| `soft_leadership` | 0.392 | 0.2522 | 0.1201 | [-0.1023, 0.8864] | 48.0% |
| `industry_data_center` | 0.1562** | 0.0778 | 0.0445 | [0.0038, 0.3086] | 16.91% |
| `remote_eligible` | 0.0286 | 0.1103 | 0.7957 | [-0.1876, 0.2448] | 2.9% |
| `job_level` | -0.0215 | 0.061 | 0.7246 | [-0.1409, 0.098] | -2.12% |
| `family_ai_ml` | -0.0199 | 0.1016 | 0.8449 | [-0.219, 0.1792] | -1.97% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 43, R² = 0.2522, adjusted R² = -0.0131, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.0154*** | 0.8595 | 0.0 | [9.3307, 12.7] | — |
| `degree_stem` | -0.4777 | 0.484 | 0.3236 | [-1.4262, 0.4709] | -37.98% |
| `advanced_degree_pref` | 0.1425 | 0.3136 | 0.6497 | [-0.4722, 0.7571] | 15.31% |
| `yrs_exp_min` | 0.6928* | 0.4021 | 0.0849 | [-0.0952, 1.4809] | 99.94% |
| `yrs_exp_stated` | -1.6362 | 1.4491 | 0.2588 | [-4.4764, 1.2039] | -80.53% |
| `skill_cloud` | -0.597 | 0.7875 | 0.4484 | [-2.1405, 0.9465] | -44.95% |
| `skill_ml_ai` | 1.5452** | 0.7572 | 0.0413 | [0.061, 3.0294] | 368.89% |
| `soft_leadership` | -0.723 | 0.788 | 0.3589 | [-2.2673, 0.8214] | -51.47% |
| `industry_data_center` | -0.2328 | 0.5611 | 0.6782 | [-1.3325, 0.8669] | -20.77% |
| `remote_eligible` | -0.3864 | 0.4699 | 0.4109 | [-1.3072, 0.5345] | -32.05% |
| `job_level` | -0.4701 | 0.4522 | 0.2985 | [-1.3564, 0.4161] | -37.51% |
| `family_ai_ml` | -0.426 | 0.7691 | 0.5797 | [-1.9335, 1.0815] | -34.69% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.786** (44 disclosed, 12 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `degree_stem` | 0.364 | 0.167 | 0.197 | 0.1567 |
| `advanced_degree_pref` | 0.159 | 0.167 | -0.008 | 0.9526 |
| `yrs_exp_min` | 0.682 | 1.667 | -0.985 | 0.0127 |
| `yrs_exp_stated` | 0.273 | 0.833 | -0.561 | 0.0004 |
| `skill_cloud` | 0.114 | 0.167 | -0.053 | 0.6707 |
| `skill_ml_ai` | 0.182 | 0.5 | -0.318 | 0.0687 |
| `soft_leadership` | 0.091 | 0.0 | 0.091 | 0.0441 |
| `industry_data_center` | 0.182 | 0.167 | 0.015 | 0.9063 |
| `remote_eligible` | 0.114 | 0.667 | -0.553 | 0.0026 |
| `job_level` | 1.068 | 1.0 | 0.068 | 0.8363 |
| `family_ai_ml` | 0.114 | 0.25 | -0.136 | 0.3438 |
| `metro_indianapolis` | 0.0 | 0.333 | -0.333 | 0.0388 |


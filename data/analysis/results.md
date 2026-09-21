# Results

- Postings in scope: **46**
- With disclosed pay: **37**
- Used in estimation: **37**
- Distinct employers: **11**

> **These estimates are not yet interpretable.**
>
> - 3.4 observations per regressor (37 observations, 11 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - 10 employer clusters. Cluster-robust standard errors are biased downward with few clusters, so p-values are anti-conservative. A wild cluster bootstrap is required before reporting significance.
> - Minimum detectable effect is 0.56 log points, roughly a 75% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **1** (specification used: **core**).

Minimum detectable standardized effect: **0.5603** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 37, R² = 0.6632, adjusted R² = 0.515, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.1409*** | 0.1331 | 0.0 | [10.8801, 11.4017] | — |
| `degree_stem` | 0.3911*** | 0.1327 | 0.0032 | [0.131, 0.6512] | 47.86% |
| `advanced_degree_pref` | 0.4578*** | 0.0252 | 0.0 | [0.4084, 0.5073] | 58.07% |
| `yrs_exp_min` | -0.207** | 0.0804 | 0.01 | [-0.3645, -0.0495] | -18.7% |
| `yrs_exp_stated` | 0.4567** | 0.1851 | 0.0136 | [0.0939, 0.8195] | 57.89% |
| `skill_cloud` | 0.5584* | 0.3058 | 0.0679 | [-0.041, 1.1578] | 74.78% |
| `skill_ml_ai` | -0.3412 | 0.3833 | 0.3735 | [-1.0924, 0.4101] | -28.9% |
| `soft_leadership` | 0.4242 | 0.3477 | 0.2224 | [-0.2572, 1.1057] | 52.84% |
| `industry_data_center` | 0.1969 | 0.1363 | 0.1485 | [-0.0702, 0.4639] | 21.76% |
| `remote_eligible` | 0.1147 | 0.1145 | 0.3165 | [-0.1097, 0.339] | 12.15% |
| `job_level` | -0.0052 | 0.0612 | 0.9329 | [-0.125, 0.1147] | -0.51% |
| `family_ai_ml` | -0.0655 | 0.1222 | 0.592 | [-0.3051, 0.1741] | -6.34% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 36, R² = 0.3597, adjusted R² = 0.0663, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2365*** | 0.8457 | 0.0 | [9.5788, 12.8941] | — |
| `degree_stem` | -0.2255 | 0.6599 | 0.7326 | [-1.5188, 1.0679] | -20.18% |
| `advanced_degree_pref` | -0.2949** | 0.1473 | 0.0453 | [-0.5837, -0.0062] | -25.54% |
| `yrs_exp_min` | 0.7884* | 0.4442 | 0.0759 | [-0.0821, 1.659] | 119.99% |
| `yrs_exp_stated` | -1.8167 | 1.6445 | 0.2693 | [-5.0399, 1.4065] | -83.74% |
| `skill_cloud` | 0.2581 | 0.7508 | 0.731 | [-1.2134, 1.7297] | 29.45% |
| `skill_ml_ai` | 0.274 | 0.8658 | 0.7516 | [-1.4229, 1.9709] | 31.52% |
| `soft_leadership` | -0.8515 | 1.0869 | 0.4334 | [-2.9818, 1.2789] | -57.32% |
| `industry_data_center` | -0.7528 | 0.676 | 0.2654 | [-2.0778, 0.5721] | -52.9% |
| `remote_eligible` | -0.7536 | 0.7206 | 0.2956 | [-2.1659, 0.6586] | -52.94% |
| `job_level` | -0.592 | 0.4676 | 0.2055 | [-1.5084, 0.3244] | -44.68% |
| `family_ai_ml` | -0.3903 | 0.7378 | 0.5968 | [-1.8364, 1.0558] | -32.32% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.804** (37 disclosed, 9 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `degree_stem` | 0.27 | 0.111 | 0.159 | 0.2506 |
| `advanced_degree_pref` | 0.108 | 0.111 | -0.003 | 0.9809 |
| `yrs_exp_min` | 0.676 | 1.889 | -1.213 | 0.0097 |
| `yrs_exp_stated` | 0.27 | 0.889 | -0.619 | 0.0003 |
| `skill_cloud` | 0.081 | 0.222 | -0.141 | 0.3815 |
| `skill_ml_ai` | 0.135 | 0.556 | -0.42 | 0.0467 |
| `soft_leadership` | 0.081 | 0.0 | 0.081 | 0.0831 |
| `industry_data_center` | 0.135 | 0.0 | 0.135 | 0.0232 |
| `remote_eligible` | 0.108 | 0.667 | -0.559 | 0.01 |
| `job_level` | 1.027 | 0.889 | 0.138 | 0.7188 |
| `family_ai_ml` | 0.081 | 0.222 | -0.141 | 0.3815 |
| `metro_indianapolis` | 0.0 | 0.333 | -0.333 | 0.0805 |


# Results

- Postings in scope: **51**
- With disclosed pay: **40**
- Used in estimation: **40**
- Distinct employers: **13**

> **These estimates are not yet interpretable.**
>
> - 3.6 observations per regressor (40 observations, 11 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - 12 employer clusters. Cluster-robust standard errors are biased downward with few clusters, so p-values are anti-conservative. A wild cluster bootstrap is required before reporting significance.
> - Minimum detectable effect is 0.53 log points, roughly a 70% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **2** (specification used: **core**).

Minimum detectable standardized effect: **0.5294** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 40, R² = 0.6558, adjusted R² = 0.5206, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.1853*** | 0.1079 | 0.0 | [10.9738, 11.3968] | — |
| `degree_stem` | 0.349*** | 0.0854 | 0.0 | [0.1816, 0.5165] | 41.77% |
| `advanced_degree_pref` | 0.4342*** | 0.0572 | 0.0 | [0.322, 0.5464] | 54.37% |
| `yrs_exp_min` | -0.1973** | 0.0958 | 0.0393 | [-0.385, -0.0096] | -17.91% |
| `yrs_exp_stated` | 0.4382** | 0.2191 | 0.0455 | [0.0088, 0.8677] | 54.99% |
| `skill_cloud` | 0.6697*** | 0.2301 | 0.0036 | [0.2186, 1.1207] | 95.36% |
| `skill_ml_ai` | -0.4028 | 0.2613 | 0.1232 | [-0.9149, 0.1093] | -33.15% |
| `soft_leadership` | 0.3579 | 0.2759 | 0.1947 | [-0.183, 0.8987] | 43.03% |
| `industry_data_center` | 0.1493* | 0.0808 | 0.0646 | [-0.009, 0.3076] | 16.1% |
| `remote_eligible` | 0.0743 | 0.1306 | 0.5694 | [-0.1817, 0.3303] | 7.71% |
| `job_level` | -0.0312 | 0.0526 | 0.5534 | [-0.1343, 0.0719] | -3.07% |
| `family_ai_ml` | -0.0399 | 0.0834 | 0.6328 | [-0.2033, 0.1236] | -3.91% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 39, R² = 0.2569, adjusted R² = -0.0459, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.0816*** | 0.8437 | 0.0 | [9.4279, 12.7352] | — |
| `degree_stem` | -0.2668 | 0.4472 | 0.5508 | [-1.1432, 0.6096] | -23.41% |
| `advanced_degree_pref` | 0.0573 | 0.2461 | 0.8158 | [-0.425, 0.5397] | 5.9% |
| `yrs_exp_min` | 0.7773* | 0.4443 | 0.0802 | [-0.0936, 1.6481] | 117.55% |
| `yrs_exp_stated` | -1.8971 | 1.5411 | 0.2183 | [-4.9175, 1.1234] | -85.0% |
| `skill_cloud` | -1.2076 | 0.7775 | 0.1204 | [-2.7316, 0.3164] | -70.11% |
| `skill_ml_ai` | 1.7036** | 0.8497 | 0.045 | [0.0383, 3.3689] | 449.36% |
| `soft_leadership` | -0.852 | 0.938 | 0.3637 | [-2.6905, 0.9864] | -57.35% |
| `industry_data_center` | -0.4574 | 0.5234 | 0.3821 | [-1.4832, 0.5683] | -36.71% |
| `remote_eligible` | -0.3444 | 0.5334 | 0.5185 | [-1.3899, 0.7011] | -29.14% |
| `job_level` | -0.4703 | 0.4747 | 0.3218 | [-1.4007, 0.46] | -37.52% |
| `family_ai_ml` | -0.7706 | 0.6761 | 0.2544 | [-2.0958, 0.5546] | -53.73% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.784** (40 disclosed, 11 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `degree_stem` | 0.3 | 0.091 | 0.209 | 0.0858 |
| `advanced_degree_pref` | 0.15 | 0.091 | 0.059 | 0.5887 |
| `yrs_exp_min` | 0.625 | 1.818 | -1.193 | 0.0029 |
| `yrs_exp_stated` | 0.25 | 0.909 | -0.659 | 0.0 |
| `skill_cloud` | 0.075 | 0.182 | -0.107 | 0.4234 |
| `skill_ml_ai` | 0.15 | 0.455 | -0.305 | 0.0926 |
| `soft_leadership` | 0.1 | 0.0 | 0.1 | 0.044 |
| `industry_data_center` | 0.15 | 0.182 | -0.032 | 0.8165 |
| `remote_eligible` | 0.125 | 0.727 | -0.602 | 0.0015 |
| `job_level` | 1.1 | 1.091 | 0.009 | 0.979 |
| `family_ai_ml` | 0.075 | 0.182 | -0.107 | 0.4234 |
| `metro_indianapolis` | 0.0 | 0.273 | -0.273 | 0.0816 |


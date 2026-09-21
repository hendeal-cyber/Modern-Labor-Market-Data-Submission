# Results

- Postings in scope: **52**
- With disclosed pay: **40**
- Used in estimation: **40**
- Distinct employers: **15**

> **These estimates are not yet interpretable.**
>
> - 3.6 observations per regressor (40 observations, 11 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - 13 employer clusters. Cluster-robust standard errors are biased downward with few clusters, so p-values are anti-conservative. A wild cluster bootstrap is required before reporting significance.
> - Minimum detectable effect is 0.53 log points, roughly a 70% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **2** (specification used: **core**).

Minimum detectable standardized effect: **0.5294** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 40, R² = 0.7536, adjusted R² = 0.6568, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.1654*** | 0.1202 | 0.0 | [10.9297, 11.4011] | — |
| `degree_stem` | 0.2705*** | 0.0883 | 0.0022 | [0.0974, 0.4435] | 31.06% |
| `advanced_degree_pref` | 0.4597*** | 0.0904 | 0.0 | [0.2826, 0.6369] | 58.36% |
| `yrs_exp_min` | -0.1972 | 0.1309 | 0.1321 | [-0.4538, 0.0595] | -17.89% |
| `yrs_exp_stated` | 0.4743 | 0.2947 | 0.1074 | [-0.1032, 1.0519] | 60.7% |
| `skill_cloud` | 1.1986*** | 0.3156 | 0.0001 | [0.58, 1.8171] | 231.54% |
| `skill_ml_ai` | -0.8084*** | 0.2417 | 0.0008 | [-1.2821, -0.3346] | -55.44% |
| `soft_leadership` | 0.4303*** | 0.1498 | 0.0041 | [0.1367, 0.7239] | 53.77% |
| `industry_data_center` | 0.2537*** | 0.0767 | 0.0009 | [0.1033, 0.4041] | 28.88% |
| `remote_eligible` | 0.1763 | 0.1578 | 0.2639 | [-0.133, 0.4857] | 19.29% |
| `job_level` | -0.0151 | 0.0684 | 0.8251 | [-0.1491, 0.1189] | -1.5% |
| `family_ai_ml` | -0.2261 | 0.151 | 0.1344 | [-0.5222, 0.0699] | -20.24% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 39, R² = 0.4339, adjusted R² = 0.2033, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.6531*** | 0.5065 | 0.0 | [10.6603, 12.6459] | — |
| `degree_stem` | -0.409 | 0.59 | 0.4882 | [-1.5654, 0.7474] | -33.57% |
| `advanced_degree_pref` | -0.3113 | 0.2725 | 0.2533 | [-0.8455, 0.2228] | -26.75% |
| `yrs_exp_min` | 0.7555** | 0.3539 | 0.0328 | [0.062, 1.4491] | 112.88% |
| `yrs_exp_stated` | -1.974 | 1.3109 | 0.1321 | [-4.5434, 0.5953] | -86.11% |
| `skill_cloud` | -3.1705* | 1.8181 | 0.0812 | [-6.7338, 0.3929] | -95.8% |
| `skill_ml_ai` | 4.292*** | 1.3677 | 0.0017 | [1.6114, 6.9727] | 7211.56% |
| `soft_leadership` | -1.2009 | 0.8788 | 0.1718 | [-2.9234, 0.5216] | -69.91% |
| `industry_data_center` | -0.6189 | 0.5849 | 0.29 | [-1.7653, 0.5275] | -46.15% |
| `remote_eligible` | -0.8724 | 0.7041 | 0.2153 | [-2.2524, 0.5075] | -58.21% |
| `job_level` | -0.8495*** | 0.2747 | 0.002 | [-1.3878, -0.3112] | -57.24% |
| `family_ai_ml` | -0.5665 | 0.4861 | 0.2438 | [-1.5191, 0.3862] | -43.25% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.769** (40 disclosed, 12 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `degree_stem` | 0.375 | 0.167 | 0.208 | 0.1409 |
| `advanced_degree_pref` | 0.125 | 0.167 | -0.042 | 0.7416 |
| `yrs_exp_min` | 0.75 | 1.667 | -0.917 | 0.0208 |
| `yrs_exp_stated` | 0.3 | 0.833 | -0.533 | 0.0007 |
| `skill_cloud` | 0.125 | 0.167 | -0.042 | 0.7416 |
| `skill_ml_ai` | 0.175 | 0.5 | -0.325 | 0.0643 |
| `soft_leadership` | 0.05 | 0.0 | 0.05 | 0.1599 |
| `industry_data_center` | 0.2 | 0.167 | 0.033 | 0.7994 |
| `remote_eligible` | 0.125 | 0.667 | -0.542 | 0.003 |
| `job_level` | 1.125 | 1.0 | 0.125 | 0.7056 |
| `family_ai_ml` | 0.1 | 0.25 | -0.15 | 0.299 |
| `metro_indianapolis` | 0.0 | 0.333 | -0.333 | 0.0388 |


# Results

- Postings in scope: **138**
- With disclosed pay: **100**
- Used in estimation: **100**
- Distinct employers: **27**

> **These estimates are not yet interpretable.**
>
> - 7.1 observations per regressor (100 observations, 14 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - Minimum detectable effect is 0.30 log points, roughly a 36% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **5** (specification used: **core**).

Minimum detectable standardized effect: **0.3039** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 100, R² = 0.5681, adjusted R² = 0.4969, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.309*** | 0.0554 | 0.0 | [11.2004, 11.4175] | — |
| `seniority_rank` | 0.0639*** | 0.0106 | 0.0 | [0.0431, 0.0847] | 6.6% |
| `yrs_exp_min` | -0.0063 | 0.0139 | 0.6479 | [-0.0336, 0.0209] | -0.63% |
| `yrs_exp_stated` | -0.0418 | 0.1388 | 0.7632 | [-0.3139, 0.2302] | -4.1% |
| `degree_required` | -0.1273** | 0.0567 | 0.0247 | [-0.2383, -0.0162] | -11.95% |
| `degree_stem` | 0.0929 | 0.063 | 0.1406 | [-0.0306, 0.2164] | 9.73% |
| `skill_cloud` | 0.1009 | 0.1278 | 0.4299 | [-0.1496, 0.3514] | 10.62% |
| `skill_ml_ai` | 0.1722 | 0.1238 | 0.164 | [-0.0703, 0.4148] | 18.8% |
| `remote_eligible` | 0.1925** | 0.0772 | 0.0127 | [0.0412, 0.3439] | 21.23% |
| `mandate_state` | -0.0914 | 0.0929 | 0.3253 | [-0.2736, 0.0907] | -8.74% |
| `region_northeast` | 0.3414*** | 0.0983 | 0.0005 | [0.1488, 0.534] | 40.7% |
| `region_south` | 0.2718*** | 0.0944 | 0.004 | [0.0868, 0.4568] | 31.23% |
| `region_west` | 0.1248** | 0.052 | 0.0165 | [0.0228, 0.2268] | 13.29% |
| `industry_data_center` | 0.1437* | 0.0863 | 0.0959 | [-0.0255, 0.3129] | 15.46% |
| `family_ai_ml` | -0.0616 | 0.1347 | 0.6475 | [-0.3256, 0.2024] | -5.97% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 98, R² = 0.1864, adjusted R² = 0.0492, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.0737*** | 0.3358 | 0.0 | [9.4155, 10.7319] | — |
| `seniority_rank` | 0.0619 | 0.1051 | 0.5562 | [-0.1442, 0.2679] | 6.38% |
| `yrs_exp_min` | 0.1293* | 0.0676 | 0.0557 | [-0.0032, 0.2618] | 13.8% |
| `yrs_exp_stated` | -0.4382 | 0.4189 | 0.2956 | [-1.2593, 0.383] | -35.48% |
| `degree_required` | -0.0782 | 0.1139 | 0.4924 | [-0.3015, 0.1451] | -7.52% |
| `degree_stem` | 0.1163 | 0.1658 | 0.483 | [-0.2086, 0.4411] | 12.33% |
| `skill_cloud` | -0.0547 | 0.3851 | 0.887 | [-0.8095, 0.7001] | -5.32% |
| `skill_ml_ai` | -0.0917 | 0.4739 | 0.8466 | [-1.0206, 0.8372] | -8.76% |
| `remote_eligible` | 0.3798 | 0.392 | 0.3326 | [-0.3885, 1.1481] | 46.2% |
| `mandate_state` | 0.5101 | 0.3429 | 0.1368 | [-0.162, 1.1822] | 66.55% |
| `region_northeast` | -0.8382** | 0.3341 | 0.0121 | [-1.493, -0.1833] | -56.75% |
| `region_south` | -0.226 | 0.1822 | 0.2149 | [-0.5832, 0.1312] | -20.23% |
| `region_west` | -0.0905 | 0.1812 | 0.6175 | [-0.4456, 0.2647] | -8.65% |
| `industry_data_center` | -0.8085* | 0.4186 | 0.0534 | [-1.6289, 0.0119] | -55.45% |
| `family_ai_ml` | 0.5658* | 0.2906 | 0.0516 | [-0.0038, 1.1354] | 76.08% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 138, R² = 0.6947, adjusted R² = 0.6783, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.2816** | 0.1145 | 0.0139 | [0.0572, 0.5059] | — |
| `mandate_state` | 0.6784*** | 0.0852 | 0.0 | [0.5115, 0.8454] | 97.08% |
| `seniority_rank` | 0.0059 | 0.0182 | 0.7434 | [-0.0297, 0.0415] | 0.6% |
| `remote_eligible` | 0.3536*** | 0.0725 | 0.0 | [0.2115, 0.4956] | 42.41% |
| `industry_data_center` | -0.1359 | 0.0845 | 0.1079 | [-0.3015, 0.0298] | -12.7% |
| `region_northeast` | -0.1452 | 0.0888 | 0.1021 | [-0.3192, 0.0289] | -13.51% |
| `region_south` | -0.1284 | 0.0953 | 0.1777 | [-0.3151, 0.0583] | -12.05% |
| `region_west` | 0.1149 | 0.0744 | 0.1226 | [-0.031, 0.2607] | 12.18% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 26, R² = 0.6012, adjusted R² = 0.4753, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.9499*** | 0.1434 | 0.0 | [10.6689, 11.2309] | — |
| `seniority_rank` | 0.3844*** | 0.0967 | 0.0001 | [0.195, 0.5738] | 46.87% |
| `yrs_exp_min` | -0.1753** | 0.0718 | 0.0147 | [-0.3161, -0.0345] | -16.08% |
| `yrs_exp_stated` | 0.2404 | 0.2955 | 0.4159 | [-0.3388, 0.8196] | 27.17% |
| `degree_required` | -0.1009 | 0.1365 | 0.46 | [-0.3685, 0.1667] | -9.6% |
| `degree_stem` | 0.36** | 0.1448 | 0.0129 | [0.0762, 0.6438] | 43.33% |
| `skill_cloud` | 0.1636 | 0.161 | 0.3095 | [-0.1519, 0.479] | 17.77% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.725** (100 disclosed, 38 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.62 | 2.737 | -0.117 | 0.592 |
| `yrs_exp_min` | 1.52 | 1.711 | -0.191 | 0.6684 |
| `yrs_exp_stated` | 0.39 | 0.5 | -0.11 | 0.2546 |
| `degree_required` | 0.72 | 0.711 | 0.009 | 0.9138 |
| `degree_stem` | 0.36 | 0.342 | 0.018 | 0.8459 |
| `skill_cloud` | 0.21 | 0.211 | -0.001 | 0.9947 |
| `skill_ml_ai` | 0.25 | 0.237 | 0.013 | 0.8735 |
| `remote_eligible` | 0.12 | 0.079 | 0.041 | 0.4581 |
| `mandate_state` | 0.87 | 0.053 | 0.817 | 0.0 |
| `region_northeast` | 0.09 | 0.105 | -0.015 | 0.7936 |
| `region_south` | 0.12 | 0.579 | -0.459 | 0.0 |
| `region_west` | 0.34 | 0.026 | 0.314 | 0.0 |
| `industry_data_center` | 0.18 | 0.395 | -0.215 | 0.0194 |
| `family_ai_ml` | 0.11 | 0.053 | 0.057 | 0.2383 |
| `metro_indianapolis` | 0.03 | 0.158 | -0.128 | 0.0463 |


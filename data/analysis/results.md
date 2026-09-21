# Results

- Postings in scope: **141**
- With disclosed pay: **101**
- Used in estimation: **101**
- Distinct employers: **27**

> **These estimates are not yet interpretable.**
>
> - 7.2 observations per regressor (101 observations, 14 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - Minimum detectable effect is 0.30 log points, roughly a 35% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **5** (specification used: **core**).

Minimum detectable standardized effect: **0.3021** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 101, R² = 0.5784, adjusted R² = 0.5097, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3382*** | 0.0415 | 0.0 | [11.2569, 11.4196] | — |
| `seniority_rank` | 0.0615*** | 0.0122 | 0.0 | [0.0375, 0.0854] | 6.34% |
| `yrs_exp_min` | -0.0048 | 0.013 | 0.7107 | [-0.0304, 0.0207] | -0.48% |
| `yrs_exp_stated` | -0.0339 | 0.131 | 0.7959 | [-0.2907, 0.2229] | -3.33% |
| `degree_required` | -0.1121** | 0.0551 | 0.0418 | [-0.22, -0.0042] | -10.6% |
| `degree_stem` | 0.0755 | 0.0586 | 0.1974 | [-0.0393, 0.1903] | 7.84% |
| `skill_cloud` | 0.0932 | 0.1261 | 0.4596 | [-0.1539, 0.3403] | 9.77% |
| `skill_ml_ai` | 0.1775 | 0.1215 | 0.1441 | [-0.0606, 0.4156] | 19.42% |
| `remote_eligible` | 0.171** | 0.0692 | 0.0135 | [0.0354, 0.3067] | 18.65% |
| `mandate_state` | -0.1377** | 0.0622 | 0.0268 | [-0.2596, -0.0158] | -12.86% |
| `region_northeast` | 0.3556*** | 0.0978 | 0.0003 | [0.1639, 0.5473] | 42.7% |
| `region_south` | 0.2274* | 0.1224 | 0.0632 | [-0.0125, 0.4672] | 25.53% |
| `region_west` | 0.1195** | 0.059 | 0.0426 | [0.004, 0.2351] | 12.7% |
| `industry_data_center` | 0.1677* | 0.0884 | 0.0576 | [-0.0054, 0.3409] | 18.26% |
| `family_ai_ml` | -0.0625 | 0.1304 | 0.6316 | [-0.3181, 0.193] | -6.06% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 99, R² = 0.2086, adjusted R² = 0.0767, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.9781*** | 0.3099 | 0.0 | [9.3708, 10.5855] | — |
| `seniority_rank` | 0.0936 | 0.0911 | 0.304 | [-0.0849, 0.2722] | 9.82% |
| `yrs_exp_min` | 0.1259* | 0.0693 | 0.0692 | [-0.0099, 0.2618] | 13.42% |
| `yrs_exp_stated` | -0.4493 | 0.3911 | 0.2506 | [-1.2158, 0.3172] | -36.19% |
| `degree_required` | -0.0596 | 0.116 | 0.6073 | [-0.2869, 0.1677] | -5.79% |
| `degree_stem` | 0.1229 | 0.1484 | 0.4074 | [-0.1679, 0.4138] | 13.08% |
| `skill_cloud` | 0.0211 | 0.3971 | 0.9575 | [-0.7571, 0.7993] | 2.14% |
| `skill_ml_ai` | -0.1186 | 0.4401 | 0.7876 | [-0.9812, 0.7441] | -11.18% |
| `remote_eligible` | 0.3851 | 0.311 | 0.2155 | [-0.2244, 0.9947] | 46.98% |
| `mandate_state` | 0.5631*** | 0.2138 | 0.0085 | [0.144, 0.9821] | 75.6% |
| `region_northeast` | -0.888*** | 0.3253 | 0.0063 | [-1.5256, -0.2504] | -58.85% |
| `region_south` | -0.1181 | 0.1867 | 0.5272 | [-0.484, 0.2479] | -11.14% |
| `region_west` | -0.1384 | 0.1897 | 0.4654 | [-0.5102, 0.2333] | -12.93% |
| `industry_data_center` | -0.8348* | 0.4313 | 0.0529 | [-1.6801, 0.0105] | -56.61% |
| `family_ai_ml` | 0.4993* | 0.2939 | 0.0893 | [-0.0767, 1.0753] | 64.75% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 141, R² = 0.6029, adjusted R² = 0.582, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.3467*** | 0.0998 | 0.0005 | [0.1511, 0.5422] | — |
| `mandate_state` | 0.603*** | 0.0766 | 0.0 | [0.4528, 0.7532] | 82.76% |
| `seniority_rank` | 0.0193 | 0.0245 | 0.431 | [-0.0287, 0.0672] | 1.95% |
| `remote_eligible` | 0.3039*** | 0.0861 | 0.0004 | [0.1351, 0.4727] | 35.51% |
| `industry_data_center` | -0.1685* | 0.093 | 0.07 | [-0.3507, 0.0138] | -15.51% |
| `region_northeast` | -0.1809* | 0.0953 | 0.0578 | [-0.3677, 0.006] | -16.55% |
| `region_south` | -0.1239 | 0.0902 | 0.1695 | [-0.3008, 0.0529] | -11.66% |
| `region_west` | 0.089 | 0.0635 | 0.1611 | [-0.0355, 0.2134] | 9.31% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 23, R² = 0.5887, adjusted R² = 0.4344, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.0844*** | 0.2372 | 0.0 | [10.6196, 11.5493] | — |
| `seniority_rank` | 0.2937*** | 0.0923 | 0.0015 | [0.1128, 0.4747] | 34.14% |
| `yrs_exp_min` | -0.2066*** | 0.0523 | 0.0001 | [-0.3091, -0.1041] | -18.67% |
| `yrs_exp_stated` | 0.3082 | 0.247 | 0.2122 | [-0.176, 0.7924] | 36.1% |
| `degree_required` | -0.142* | 0.0803 | 0.0771 | [-0.2995, 0.0155] | -13.24% |
| `degree_stem` | 0.3903* | 0.201 | 0.0522 | [-0.0037, 0.7842] | 47.74% |
| `skill_cloud` | 0.2823 | 0.2125 | 0.1839 | [-0.1341, 0.6987] | 32.62% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.716** (101 disclosed, 40 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.693 | 2.825 | -0.132 | 0.5237 |
| `yrs_exp_min` | 1.545 | 1.725 | -0.18 | 0.6776 |
| `yrs_exp_stated` | 0.396 | 0.5 | -0.104 | 0.2716 |
| `degree_required` | 0.713 | 0.675 | 0.038 | 0.6668 |
| `degree_stem` | 0.356 | 0.325 | 0.031 | 0.7249 |
| `skill_cloud` | 0.208 | 0.2 | 0.008 | 0.9171 |
| `skill_ml_ai` | 0.248 | 0.225 | 0.023 | 0.778 |
| `remote_eligible` | 0.119 | 0.075 | 0.044 | 0.4121 |
| `mandate_state` | 0.802 | 0.025 | 0.777 | 0.0 |
| `region_northeast` | 0.089 | 0.1 | -0.011 | 0.846 |
| `region_south` | 0.119 | 0.575 | -0.456 | 0.0 |
| `region_west` | 0.337 | 0.025 | 0.312 | 0.0 |
| `industry_data_center` | 0.178 | 0.4 | -0.222 | 0.0137 |
| `family_ai_ml` | 0.109 | 0.05 | 0.059 | 0.2108 |
| `metro_indianapolis` | 0.03 | 0.15 | -0.12 | 0.0496 |


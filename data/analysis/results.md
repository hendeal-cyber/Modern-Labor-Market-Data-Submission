# Results

- Postings in scope: **141**
- With disclosed pay: **103**
- Used in estimation: **103**
- Distinct employers: **29**

> **These estimates are not yet interpretable.**
>
> - 6.9 observations per regressor (103 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - Minimum detectable effect is 0.30 log points, roughly a 35% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **6** (specification used: **core**).

Minimum detectable standardized effect: **0.3004** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 103, R² = 0.5429, adjusted R² = 0.4641, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2685*** | 0.0628 | 0.0 | [11.1453, 11.3917] | — |
| `seniority_rank` | 0.0649*** | 0.0106 | 0.0 | [0.0442, 0.0856] | 6.71% |
| `yrs_exp_min` | -0.0049 | 0.014 | 0.7279 | [-0.0323, 0.0225] | -0.49% |
| `yrs_exp_stated` | -0.0403 | 0.1383 | 0.7706 | [-0.3113, 0.2307] | -3.95% |
| `degree_required` | -0.0913 | 0.0646 | 0.1576 | [-0.2179, 0.0353] | -8.72% |
| `degree_stem` | 0.1059* | 0.0605 | 0.0802 | [-0.0127, 0.2245] | 11.17% |
| `skill_cloud` | 0.1149 | 0.1368 | 0.4008 | [-0.1531, 0.3829] | 12.18% |
| `skill_ml_ai` | 0.1677 | 0.1319 | 0.2035 | [-0.0908, 0.4262] | 18.26% |
| `remote_eligible` | 0.2146** | 0.0883 | 0.0151 | [0.0415, 0.3877] | 23.94% |
| `hourly_original` | -0.0353 | 0.2602 | 0.8921 | [-0.5452, 0.4747] | -3.47% |
| `mandate_state` | -0.0871 | 0.0914 | 0.3403 | [-0.2662, 0.092] | -8.35% |
| `region_northeast` | 0.2642** | 0.1042 | 0.0112 | [0.06, 0.4684] | 30.24% |
| `region_south` | 0.2851*** | 0.0896 | 0.0015 | [0.1094, 0.4608] | 32.99% |
| `region_west` | 0.1445*** | 0.0503 | 0.0041 | [0.0458, 0.2431] | 15.54% |
| `industry_data_center` | 0.1257 | 0.0871 | 0.1491 | [-0.0451, 0.2965] | 13.4% |
| `family_ai_ml` | -0.0788 | 0.1285 | 0.5396 | [-0.3308, 0.1731] | -7.58% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 100, R² = 0.1864, adjusted R² = 0.0411, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.0738*** | 0.3366 | 0.0 | [9.414, 10.7336] | — |
| `seniority_rank` | 0.0616 | 0.1056 | 0.5599 | [-0.1454, 0.2686] | 6.35% |
| `yrs_exp_min` | 0.1295* | 0.0675 | 0.0551 | [-0.0028, 0.2619] | 13.83% |
| `yrs_exp_stated` | -0.4395 | 0.4188 | 0.294 | [-1.2603, 0.3813] | -35.56% |
| `degree_required` | -0.0779 | 0.1143 | 0.4954 | [-0.3019, 0.1461] | -7.5% |
| `degree_stem` | 0.1121 | 0.1601 | 0.4839 | [-0.2018, 0.426] | 11.86% |
| `skill_cloud` | -0.0532 | 0.3862 | 0.8904 | [-0.81, 0.7037] | -5.18% |
| `skill_ml_ai` | -0.0912 | 0.4754 | 0.8479 | [-1.023, 0.8406] | -8.71% |
| `remote_eligible` | 0.3809 | 0.3924 | 0.3318 | [-0.3883, 1.1501] | 46.36% |
| `hourly_original` | -0.0634 | 0.2342 | 0.7867 | [-0.5223, 0.3956] | -6.14% |
| `mandate_state` | 0.5113 | 0.3425 | 0.1354 | [-0.1599, 1.1825] | 66.75% |
| `region_northeast` | -0.8372** | 0.3356 | 0.0126 | [-1.495, -0.1795] | -56.71% |
| `region_south` | -0.2256 | 0.183 | 0.2177 | [-0.5842, 0.1331] | -20.2% |
| `region_west` | -0.0898 | 0.1809 | 0.6199 | [-0.4444, 0.2649] | -8.58% |
| `industry_data_center` | -0.8081* | 0.42 | 0.0543 | [-1.6312, 0.015] | -55.43% |
| `family_ai_ml` | 0.5668* | 0.2908 | 0.0513 | [-0.0032, 1.1367] | 76.25% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 141, R² = 0.6956, adjusted R² = 0.6796, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.2809** | 0.1139 | 0.0136 | [0.0577, 0.5042] | — |
| `mandate_state` | 0.6792*** | 0.0847 | 0.0 | [0.5132, 0.8452] | 97.23% |
| `seniority_rank` | 0.0061 | 0.0181 | 0.7372 | [-0.0294, 0.0415] | 0.61% |
| `remote_eligible` | 0.3507*** | 0.0725 | 0.0 | [0.2086, 0.4928] | 42.01% |
| `industry_data_center` | -0.1334 | 0.0839 | 0.1116 | [-0.2978, 0.0309] | -12.49% |
| `region_northeast` | -0.1326 | 0.0814 | 0.1034 | [-0.2921, 0.027] | -12.42% |
| `region_south` | -0.1294 | 0.0951 | 0.1739 | [-0.3158, 0.0571] | -12.13% |
| `region_west` | 0.1093 | 0.0712 | 0.1248 | [-0.0303, 0.2488] | 11.55% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 29, R² = 0.7144, adjusted R² = 0.4289, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.945*** | 0.359 | 0.0 | [10.2414, 11.6486] | — |
| `seniority_rank` | 0.16 | 0.2736 | 0.5587 | [-0.3763, 0.6962] | 17.35% |
| `yrs_exp_min` | -0.0929 | 0.1038 | 0.3709 | [-0.2963, 0.1105] | -8.87% |
| `yrs_exp_stated` | 0.0368 | 0.3563 | 0.9177 | [-0.6615, 0.7351] | 3.75% |
| `degree_required` | -0.18 | 0.171 | 0.2926 | [-0.5152, 0.1552] | -16.47% |
| `degree_stem` | 0.1875 | 0.2091 | 0.3701 | [-0.2224, 0.5973] | 20.62% |
| `skill_cloud` | -0.0973 | 0.2429 | 0.6885 | [-0.5733, 0.3786] | -9.28% |
| `skill_ml_ai` | 0.2723 | 0.2571 | 0.2896 | [-0.2316, 0.7761] | 31.29% |
| `remote_eligible` | -0.182 | 0.2066 | 0.3783 | [-0.5869, 0.2229] | -16.64% |
| `mandate_state` | 0.2038 | 0.3133 | 0.5155 | [-0.4103, 0.8179] | 22.6% |
| `region_northeast` | 0.5617 | 0.367 | 0.1259 | [-0.1577, 1.2811] | 75.37% |
| `region_south` | 0.284 | 0.2395 | 0.2358 | [-0.1855, 0.7534] | 32.84% |
| `region_west` | 0.2963 | 0.1872 | 0.1135 | [-0.0707, 0.6632] | 34.49% |
| `industry_data_center` | 0.3423 | 0.2565 | 0.182 | [-0.1604, 0.8449] | 40.81% |
| `family_ai_ml` | -0.0828 | 0.3293 | 0.8014 | [-0.7283, 0.5626] | -7.95% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.73** (103 disclosed, 38 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.602 | 2.737 | -0.135 | 0.5322 |
| `yrs_exp_min` | 1.476 | 1.711 | -0.235 | 0.5955 |
| `yrs_exp_stated` | 0.379 | 0.5 | -0.121 | 0.207 |
| `degree_required` | 0.718 | 0.711 | 0.008 | 0.9276 |
| `degree_stem` | 0.359 | 0.342 | 0.017 | 0.8519 |
| `skill_cloud` | 0.204 | 0.211 | -0.007 | 0.9324 |
| `skill_ml_ai` | 0.243 | 0.237 | 0.006 | 0.9429 |
| `remote_eligible` | 0.117 | 0.079 | 0.038 | 0.4931 |
| `hourly_original` | 0.029 | 0.0 | 0.029 | 0.0832 |
| `mandate_state` | 0.874 | 0.053 | 0.821 | 0.0 |
| `region_northeast` | 0.097 | 0.105 | -0.008 | 0.889 |
| `region_south` | 0.117 | 0.579 | -0.462 | 0.0 |
| `region_west` | 0.35 | 0.026 | 0.323 | 0.0 |
| `industry_data_center` | 0.175 | 0.395 | -0.22 | 0.0163 |
| `family_ai_ml` | 0.107 | 0.053 | 0.054 | 0.2599 |
| `metro_indianapolis` | 0.029 | 0.158 | -0.129 | 0.0445 |


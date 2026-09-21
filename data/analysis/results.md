# Results

- Postings in scope: **204**
- With disclosed pay: **137**
- Used in estimation: **137**
- Distinct employers: **30**

> **These estimates are not yet interpretable.**
>
> - 9.1 observations per regressor (137 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - Minimum detectable effect is 0.25 log points, roughly a 29% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **6** (specification used: **core**).

Minimum detectable standardized effect: **0.2547** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 137, R² = 0.5249, adjusted R² = 0.466, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2482*** | 0.0577 | 0.0 | [11.1351, 11.3613] | — |
| `seniority_rank` | 0.0675*** | 0.0072 | 0.0 | [0.0534, 0.0815] | 6.98% |
| `yrs_exp_min` | 0.0089 | 0.0158 | 0.5726 | [-0.0221, 0.0399] | 0.9% |
| `yrs_exp_stated` | -0.09 | 0.1217 | 0.4595 | [-0.3284, 0.1485] | -8.6% |
| `degree_required` | -0.0939** | 0.0447 | 0.0354 | [-0.1815, -0.0064] | -8.97% |
| `degree_stem` | 0.1143** | 0.0496 | 0.0211 | [0.0172, 0.2115] | 12.11% |
| `skill_cloud` | -0.0288 | 0.0653 | 0.6597 | [-0.1569, 0.0993] | -2.84% |
| `skill_ml_ai` | 0.237*** | 0.0649 | 0.0003 | [0.1097, 0.3643] | 26.75% |
| `remote_eligible` | 0.1512*** | 0.0494 | 0.0022 | [0.0544, 0.248] | 16.32% |
| `hourly_original` | -0.046 | 0.264 | 0.8618 | [-0.5633, 0.4714] | -4.49% |
| `mandate_state` | -0.048 | 0.0636 | 0.4507 | [-0.1727, 0.0767] | -4.69% |
| `region_northeast` | 0.2685** | 0.1062 | 0.0114 | [0.0604, 0.4766] | 30.8% |
| `region_south` | 0.2083*** | 0.0609 | 0.0006 | [0.0888, 0.3277] | 23.15% |
| `region_west` | 0.1208*** | 0.0469 | 0.0099 | [0.029, 0.2126] | 12.84% |
| `industry_data_center` | 0.1645** | 0.0797 | 0.039 | [0.0083, 0.3206] | 17.88% |
| `family_ai_ml` | -0.0296 | 0.0686 | 0.6665 | [-0.1639, 0.1048] | -2.91% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 134, R² = 0.2354, adjusted R² = 0.1382, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.1523*** | 0.2168 | 0.0 | [9.7273, 10.5772] | — |
| `seniority_rank` | 0.0676 | 0.0859 | 0.4317 | [-0.1009, 0.236] | 6.99% |
| `yrs_exp_min` | 0.1177* | 0.0645 | 0.0681 | [-0.0088, 0.2441] | 12.49% |
| `yrs_exp_stated` | -0.4696 | 0.3693 | 0.2035 | [-1.1934, 0.2542] | -37.47% |
| `degree_required` | -0.0026 | 0.0782 | 0.973 | [-0.156, 0.1507] | -0.26% |
| `degree_stem` | 0.1718 | 0.1442 | 0.2333 | [-0.1107, 0.4544] | 18.75% |
| `skill_cloud` | 0.0534 | 0.1578 | 0.735 | [-0.2559, 0.3628] | 5.49% |
| `skill_ml_ai` | -0.0031 | 0.2917 | 0.9915 | [-0.5749, 0.5687] | -0.31% |
| `remote_eligible` | 0.2669 | 0.179 | 0.1359 | [-0.0839, 0.6176] | 30.59% |
| `hourly_original` | -0.1282 | 0.2123 | 0.5459 | [-0.5442, 0.2878] | -12.03% |
| `mandate_state` | 0.375* | 0.214 | 0.0797 | [-0.0445, 0.7945] | 45.5% |
| `region_northeast` | -0.8392*** | 0.3195 | 0.0086 | [-1.4654, -0.213] | -56.79% |
| `region_south` | -0.0316 | 0.1568 | 0.8402 | [-0.339, 0.2757] | -3.11% |
| `region_west` | -0.0842 | 0.1659 | 0.6118 | [-0.4094, 0.241] | -8.08% |
| `industry_data_center` | -0.8603** | 0.4079 | 0.0349 | [-1.6598, -0.0608] | -57.7% |
| `family_ai_ml` | 0.2766 | 0.239 | 0.2471 | [-0.1918, 0.745] | 31.86% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 204, R² = 0.4856, adjusted R² = 0.4672, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.3773*** | 0.1169 | 0.0013 | [0.1481, 0.6064] | — |
| `mandate_state` | 0.5055*** | 0.1086 | 0.0 | [0.2926, 0.7184] | 65.78% |
| `seniority_rank` | 0.017 | 0.0158 | 0.2818 | [-0.014, 0.048] | 1.71% |
| `remote_eligible` | 0.3742*** | 0.0843 | 0.0 | [0.209, 0.5395] | 45.39% |
| `industry_data_center` | -0.1004 | 0.0778 | 0.1966 | [-0.2528, 0.052] | -9.55% |
| `region_northeast` | -0.1396 | 0.1141 | 0.2212 | [-0.3632, 0.084] | -13.03% |
| `region_south` | -0.3308*** | 0.0921 | 0.0003 | [-0.5112, -0.1504] | -28.16% |
| `region_west` | 0.122 | 0.0849 | 0.1508 | [-0.0444, 0.2885] | 12.98% |

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

Disclosure rate: **0.672** (137 disclosed, 67 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.54 | 2.478 | 0.063 | 0.6841 |
| `yrs_exp_min` | 1.117 | 0.97 | 0.147 | 0.622 |
| `yrs_exp_stated` | 0.292 | 0.284 | 0.008 | 0.9017 |
| `degree_required` | 0.752 | 0.806 | -0.054 | 0.3775 |
| `degree_stem` | 0.467 | 0.537 | -0.07 | 0.3501 |
| `skill_cloud` | 0.299 | 0.239 | 0.06 | 0.3579 |
| `skill_ml_ai` | 0.365 | 0.358 | 0.007 | 0.9254 |
| `remote_eligible` | 0.182 | 0.045 | 0.138 | 0.0012 |
| `hourly_original` | 0.022 | 0.0 | 0.022 | 0.0833 |
| `mandate_state` | 0.854 | 0.373 | 0.481 | 0.0 |
| `region_northeast` | 0.073 | 0.06 | 0.013 | 0.7179 |
| `region_south` | 0.299 | 0.761 | -0.462 | 0.0 |
| `region_west` | 0.27 | 0.015 | 0.255 | 0.0 |
| `industry_data_center` | 0.131 | 0.209 | -0.078 | 0.1825 |
| `family_ai_ml` | 0.19 | 0.194 | -0.004 | 0.9429 |
| `metro_indianapolis` | 0.022 | 0.09 | -0.068 | 0.0735 |


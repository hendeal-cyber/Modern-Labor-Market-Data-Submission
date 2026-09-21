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

N = 137, R² = 0.5244, adjusted R² = 0.4655, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2654*** | 0.053 | 0.0 | [11.1615, 11.3693] | — |
| `seniority_rank` | 0.0679*** | 0.0081 | 0.0 | [0.052, 0.0838] | 7.03% |
| `yrs_exp_min` | 0.0095 | 0.0165 | 0.5673 | [-0.0229, 0.0418] | 0.95% |
| `yrs_exp_stated` | -0.091 | 0.1255 | 0.4682 | [-0.337, 0.1549] | -8.7% |
| `degree_required` | -0.1143*** | 0.0381 | 0.0027 | [-0.189, -0.0396] | -10.8% |
| `degree_stem` | 0.1007** | 0.0489 | 0.0396 | [0.0048, 0.1966] | 10.59% |
| `skill_cloud` | -0.0324 | 0.0577 | 0.5737 | [-0.1454, 0.0806] | -3.19% |
| `skill_ml_ai` | 0.2364*** | 0.0614 | 0.0001 | [0.1161, 0.3568] | 26.67% |
| `remote_eligible` | 0.1539*** | 0.0486 | 0.0015 | [0.0586, 0.2491] | 16.63% |
| `hourly_original` | -0.0431 | 0.2751 | 0.8756 | [-0.5823, 0.4962] | -4.21% |
| `mandate_state` | -0.0385 | 0.0601 | 0.5223 | [-0.1563, 0.0794] | -3.77% |
| `region_northeast` | 0.2602** | 0.1104 | 0.0184 | [0.0438, 0.4767] | 29.72% |
| `region_south` | 0.1753** | 0.0702 | 0.0125 | [0.0378, 0.3128] | 19.16% |
| `region_west` | 0.1065** | 0.0529 | 0.0442 | [0.0028, 0.2102] | 11.24% |
| `industry_data_center` | 0.1643** | 0.0779 | 0.0349 | [0.0116, 0.317] | 17.86% |
| `family_ai_ml` | 0.0169 | 0.0826 | 0.8376 | [-0.1449, 0.1787] | 1.71% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 134, R² = 0.238, adjusted R² = 0.1412, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.2544*** | 0.2264 | 0.0 | [9.8107, 10.698] | — |
| `seniority_rank` | 0.0528 | 0.0864 | 0.5408 | [-0.1164, 0.2221] | 5.42% |
| `yrs_exp_min` | 0.1179* | 0.0632 | 0.0619 | [-0.0059, 0.2418] | 12.52% |
| `yrs_exp_stated` | -0.4738 | 0.365 | 0.1942 | [-1.1891, 0.2415] | -37.74% |
| `degree_required` | -0.0206 | 0.0745 | 0.7816 | [-0.1666, 0.1253] | -2.04% |
| `degree_stem` | 0.146 | 0.1355 | 0.2811 | [-0.1195, 0.4115] | 15.72% |
| `skill_cloud` | 0.0366 | 0.152 | 0.8095 | [-0.2612, 0.3345] | 3.73% |
| `skill_ml_ai` | -0.0075 | 0.2919 | 0.9796 | [-0.5795, 0.5646] | -0.74% |
| `remote_eligible` | 0.2684 | 0.1736 | 0.1221 | [-0.0719, 0.6088] | 30.79% |
| `hourly_original` | -0.1241 | 0.2165 | 0.5664 | [-0.5485, 0.3002] | -11.67% |
| `mandate_state` | 0.3289 | 0.2013 | 0.1023 | [-0.0656, 0.7233] | 38.94% |
| `region_northeast` | -0.8178*** | 0.3066 | 0.0076 | [-1.4188, -0.2169] | -55.86% |
| `region_south` | -0.0518 | 0.1428 | 0.717 | [-0.3317, 0.2282] | -5.05% |
| `region_west` | -0.0838 | 0.1637 | 0.6087 | [-0.4046, 0.237] | -8.04% |
| `industry_data_center` | -0.8573** | 0.4013 | 0.0326 | [-1.6438, -0.0709] | -57.57% |
| `family_ai_ml` | 0.3209 | 0.213 | 0.132 | [-0.0966, 0.7383] | 37.83% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 204, R² = 0.4844, adjusted R² = 0.466, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.4281*** | 0.1248 | 0.0006 | [0.1834, 0.6727] | — |
| `mandate_state` | 0.4712*** | 0.1191 | 0.0001 | [0.2377, 0.7047] | 60.2% |
| `seniority_rank` | 0.0057 | 0.014 | 0.682 | [-0.0217, 0.0332] | 0.58% |
| `remote_eligible` | 0.3824*** | 0.0937 | 0.0 | [0.1986, 0.5661] | 46.57% |
| `industry_data_center` | -0.1006 | 0.0758 | 0.1844 | [-0.2492, 0.0479] | -9.57% |
| `region_northeast` | -0.1395 | 0.1201 | 0.2455 | [-0.3749, 0.0959] | -13.02% |
| `region_south` | -0.3465*** | 0.0909 | 0.0001 | [-0.5248, -0.1683] | -29.29% |
| `region_west` | 0.1303 | 0.0896 | 0.146 | [-0.0453, 0.3059] | 13.92% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 28, R² = 0.7547, adjusted R² = 0.4904, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.8595*** | 0.2516 | 0.0 | [10.3664, 11.3526] | — |
| `seniority_rank` | 0.1011 | 0.1971 | 0.6081 | [-0.2852, 0.4874] | 10.63% |
| `yrs_exp_min` | -0.1194 | 0.0787 | 0.1292 | [-0.2737, 0.0348] | -11.26% |
| `yrs_exp_stated` | 0.1266 | 0.2837 | 0.6554 | [-0.4294, 0.6826] | 13.5% |
| `degree_required` | -0.2751*** | 0.0975 | 0.0048 | [-0.4662, -0.084] | -24.05% |
| `degree_stem` | 0.2446 | 0.2182 | 0.2622 | [-0.183, 0.6723] | 27.72% |
| `skill_cloud` | 0.0791 | 0.1806 | 0.6614 | [-0.2749, 0.4331] | 8.23% |
| `skill_ml_ai` | 0.1946 | 0.2061 | 0.3453 | [-0.2095, 0.5986] | 21.48% |
| `remote_eligible` | -0.159 | 0.1393 | 0.2537 | [-0.432, 0.114] | -14.7% |
| `mandate_state` | 0.4093 | 0.2957 | 0.1663 | [-0.1702, 0.9889] | 50.58% |
| `region_northeast` | 0.497 | 0.3261 | 0.1275 | [-0.1421, 1.1361] | 64.38% |
| `region_south` | 0.0843 | 0.2266 | 0.7097 | [-0.3597, 0.5284] | 8.8% |
| `region_west` | 0.2657 | 0.1996 | 0.183 | [-0.1254, 0.6569] | 30.44% |
| `industry_data_center` | 0.344** | 0.1531 | 0.0246 | [0.044, 0.644] | 41.06% |
| `family_ai_ml` | -0.0637 | 0.2399 | 0.7905 | [-0.534, 0.4065] | -6.18% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.672** (137 disclosed, 67 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.584 | 2.537 | 0.047 | 0.7759 |
| `yrs_exp_min` | 1.117 | 0.94 | 0.176 | 0.5529 |
| `yrs_exp_stated` | 0.292 | 0.269 | 0.023 | 0.7286 |
| `degree_required` | 0.745 | 0.821 | -0.076 | 0.2067 |
| `degree_stem` | 0.46 | 0.537 | -0.077 | 0.3022 |
| `skill_cloud` | 0.299 | 0.239 | 0.06 | 0.3579 |
| `skill_ml_ai` | 0.365 | 0.358 | 0.007 | 0.9254 |
| `remote_eligible` | 0.204 | 0.045 | 0.16 | 0.0003 |
| `hourly_original` | 0.022 | 0.0 | 0.022 | 0.0833 |
| `mandate_state` | 0.847 | 0.388 | 0.459 | 0.0 |
| `region_northeast` | 0.073 | 0.06 | 0.013 | 0.7179 |
| `region_south` | 0.292 | 0.776 | -0.484 | 0.0 |
| `region_west` | 0.27 | 0.015 | 0.255 | 0.0 |
| `industry_data_center` | 0.131 | 0.209 | -0.078 | 0.1825 |
| `family_ai_ml` | 0.197 | 0.194 | 0.003 | 0.9591 |
| `metro_indianapolis` | 0.022 | 0.075 | -0.053 | 0.1322 |


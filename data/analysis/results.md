# Results

- Postings in scope: **298**
- With disclosed pay: **220**
- Used in estimation: **220**
- Distinct employers in the estimation sample (**the cluster count**): **34**
- Distinct employers across all postings in scope: **46**

Regressor budget at 20 observations each: **11** (specification used: **core**).

Minimum detectable standardized effect: **0.1962** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 220, R² = 0.5546, adjusted R² = 0.5219, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2964*** | 0.0401 | 0.0 | [11.2179, 11.3749] | — |
| `seniority_rank` | 0.1178*** | 0.009 | 0.0 | [0.1001, 0.1355] | 12.5% |
| `yrs_exp_min` | 0.015 | 0.0105 | 0.1536 | [-0.0056, 0.0356] | 1.51% |
| `yrs_exp_stated` | -0.0135 | 0.0504 | 0.7892 | [-0.1123, 0.0853] | -1.34% |
| `degree_required` | 0.0071 | 0.0343 | 0.8361 | [-0.0602, 0.0744] | 0.71% |
| `degree_stem` | 0.0513 | 0.0317 | 0.1052 | [-0.0108, 0.1133] | 5.26% |
| `skill_cloud` | 0.1357** | 0.0566 | 0.0164 | [0.0248, 0.2466] | 14.54% |
| `skill_ml_ai` | 0.0022 | 0.0459 | 0.9611 | [-0.0877, 0.0921] | 0.22% |
| `remote_eligible` | 0.0414 | 0.0478 | 0.3868 | [-0.0523, 0.135] | 4.22% |
| `hourly_original` | 0.0829** | 0.0347 | 0.0168 | [0.0149, 0.1508] | 8.64% |
| `mandate_state` | -0.0338 | 0.0254 | 0.183 | [-0.0835, 0.0159] | -3.32% |
| `region_northeast` | 0.1084*** | 0.0383 | 0.0047 | [0.0332, 0.1835] | 11.45% |
| `region_south` | 0.0919** | 0.038 | 0.0156 | [0.0174, 0.1664] | 9.63% |
| `region_west` | 0.0177 | 0.0381 | 0.6427 | [-0.057, 0.0923] | 1.78% |
| `industry_data_center` | 0.0216 | 0.0564 | 0.7011 | [-0.0888, 0.1321] | 2.19% |
| `family_ai_ml` | 0.0182 | 0.0713 | 0.7989 | [-0.1216, 0.158] | 1.83% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 215, R² = 0.3161, adjusted R² = 0.2645, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.673*** | 0.2014 | 0.0 | [9.2783, 10.0676] | — |
| `seniority_rank` | 0.1164*** | 0.0318 | 0.0003 | [0.0541, 0.1787] | 12.35% |
| `yrs_exp_min` | -0.0195 | 0.0315 | 0.5362 | [-0.0812, 0.0423] | -1.93% |
| `yrs_exp_stated` | 0.1063 | 0.1464 | 0.4677 | [-0.1806, 0.3933] | 11.22% |
| `degree_required` | 0.2206 | 0.1642 | 0.1791 | [-0.1012, 0.5423] | 24.68% |
| `degree_stem` | 0.3644*** | 0.1243 | 0.0034 | [0.1207, 0.608] | 43.96% |
| `skill_cloud` | 0.058 | 0.1742 | 0.7392 | [-0.2835, 0.3994] | 5.97% |
| `skill_ml_ai` | 0.0823 | 0.1687 | 0.6258 | [-0.2484, 0.413] | 8.58% |
| `remote_eligible` | 0.1309 | 0.2071 | 0.5273 | [-0.275, 0.5367] | 13.98% |
| `hourly_original` | 0.0749 | 0.1544 | 0.6278 | [-0.2278, 0.3776] | 7.78% |
| `mandate_state` | -0.2199* | 0.1161 | 0.0582 | [-0.4474, 0.0076] | -19.74% |
| `region_northeast` | 0.0591 | 0.2712 | 0.8276 | [-0.4725, 0.5906] | 6.08% |
| `region_south` | 0.349*** | 0.1107 | 0.0016 | [0.1321, 0.566] | 41.77% |
| `region_west` | 0.3697*** | 0.1288 | 0.0041 | [0.1172, 0.6222] | 44.73% |
| `industry_data_center` | -0.7965*** | 0.2701 | 0.0032 | [-1.3258, -0.2672] | -54.91% |
| `family_ai_ml` | -0.0858 | 0.257 | 0.7383 | [-0.5895, 0.4178] | -8.23% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 298, R² = 0.3518, adjusted R² = 0.3362, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6607*** | 0.1438 | 0.0 | [0.3788, 0.9426] | — |
| `mandate_state` | 0.3334*** | 0.1198 | 0.0054 | [0.0986, 0.5681] | 39.56% |
| `seniority_rank` | 0.0017 | 0.0161 | 0.9139 | [-0.0298, 0.0332] | 0.17% |
| `remote_eligible` | -0.1324 | 0.1575 | 0.4006 | [-0.4412, 0.1764] | -12.4% |
| `industry_data_center` | -0.2278 | 0.1664 | 0.1709 | [-0.5539, 0.0983] | -20.37% |
| `region_northeast` | -0.037 | 0.1106 | 0.7382 | [-0.2536, 0.1797] | -3.63% |
| `region_south` | -0.2199 | 0.1388 | 0.1131 | [-0.492, 0.0521] | -19.74% |
| `region_west` | 0.0472 | 0.0813 | 0.5616 | [-0.1121, 0.2064] | 4.83% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 50, R² = 0.5176, adjusted R² = 0.3246, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4504*** | 0.173 | 0.0 | [11.1113, 11.7895] | — |
| `seniority_rank` | 0.0768 | 0.0791 | 0.3315 | [-0.0782, 0.2318] | 7.98% |
| `yrs_exp_min` | -0.0058 | 0.0417 | 0.8893 | [-0.0875, 0.0759] | -0.58% |
| `yrs_exp_stated` | -0.0493 | 0.11 | 0.6537 | [-0.2649, 0.1662] | -4.81% |
| `degree_required` | -0.0003 | 0.0349 | 0.993 | [-0.0686, 0.068] | -0.03% |
| `degree_stem` | 0.1079*** | 0.035 | 0.002 | [0.0393, 0.1765] | 11.39% |
| `skill_cloud` | 0.2612 | 0.2206 | 0.2363 | [-0.1711, 0.6936] | 29.85% |
| `skill_ml_ai` | -0.0498 | 0.129 | 0.6995 | [-0.3026, 0.203] | -4.86% |
| `remote_eligible` | -0.0398 | 0.0679 | 0.5574 | [-0.1729, 0.0932] | -3.9% |
| `mandate_state` | 0.0085 | 0.0979 | 0.9308 | [-0.1834, 0.2004] | 0.85% |
| `region_northeast` | -0.001 | 0.0709 | 0.9889 | [-0.14, 0.138] | -0.1% |
| `region_south` | -0.0267 | 0.1102 | 0.8083 | [-0.2428, 0.1893] | -2.64% |
| `region_west` | 0.0723 | 0.073 | 0.3217 | [-0.0707, 0.2153] | 7.5% |
| `industry_data_center` | -0.1233 | 0.0887 | 0.1645 | [-0.2971, 0.0505] | -11.6% |
| `family_ai_ml` | 0.5391*** | 0.1911 | 0.0048 | [0.1645, 0.9138] | 71.45% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 212, R² = 0.5683, adjusted R² = 0.5353, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3598*** | 0.0452 | 0.0 | [11.2712, 11.4483] | — |
| `seniority_rank` | 0.1181*** | 0.0088 | 0.0 | [0.1009, 0.1352] | 12.53% |
| `yrs_exp_min` | 0.0165* | 0.0099 | 0.0957 | [-0.0029, 0.036] | 1.67% |
| `yrs_exp_stated` | -0.009 | 0.0518 | 0.8622 | [-0.1106, 0.0926] | -0.9% |
| `degree_required` | 0.0031 | 0.0352 | 0.9309 | [-0.066, 0.0721] | 0.31% |
| `degree_stem` | 0.0557 | 0.0354 | 0.1151 | [-0.0136, 0.125] | 5.73% |
| `skill_cloud` | 0.1441** | 0.0575 | 0.0122 | [0.0314, 0.2568] | 15.5% |
| `skill_ml_ai` | -0.0321 | 0.0404 | 0.4273 | [-0.1114, 0.0472] | -3.16% |
| `remote_eligible` | 0.0389 | 0.051 | 0.4455 | [-0.061, 0.1388] | 3.97% |
| `hourly_original` | 0.0219 | 0.0359 | 0.5417 | [-0.0484, 0.0922] | 2.21% |
| `mandate_state` | -0.0863*** | 0.0317 | 0.0064 | [-0.1484, -0.0243] | -8.27% |
| `region_northeast` | 0.0354 | 0.0406 | 0.3837 | [-0.0442, 0.115] | 3.6% |
| `region_south` | 0.0719* | 0.0409 | 0.0787 | [-0.0083, 0.152] | 7.45% |
| `region_west` | -0.0328 | 0.0327 | 0.3155 | [-0.0968, 0.0312] | -3.22% |
| `industry_data_center` | -0.0047 | 0.0555 | 0.9332 | [-0.1134, 0.1041] | -0.46% |
| `family_ai_ml` | 0.0613 | 0.0693 | 0.3762 | [-0.0745, 0.1972] | 6.33% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 34 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1178 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.015 | 0.1536 | 0.3192 | unchanged (null) |
| `yrs_exp_stated` | -0.0135 | 0.7892 | 0.7983 | unchanged (null) |
| `degree_required` | 0.0071 | 0.8361 | 0.8513 | unchanged (null) |
| `degree_stem` | 0.0513 | 0.1052 | 0.147 | unchanged (null) |
| `skill_cloud` | 0.1357 | 0.0164 | 0.0288 | unchanged (significant) |
| `skill_ml_ai` | 0.0022 | 0.9611 | 0.9635 | unchanged (null) |
| `remote_eligible` | 0.0414 | 0.3868 | 0.4186 | unchanged (null) |
| `hourly_original` | 0.0829 | 0.0168 | 0.4644 | **no longer significant** |
| `mandate_state` | -0.0338 | 0.183 | 0.2189 | unchanged (null) |
| `region_northeast` | 0.1084 | 0.0047 | 0.0144 | unchanged (significant) |
| `region_south` | 0.0919 | 0.0156 | 0.0834 | **no longer significant** |
| `region_west` | 0.0177 | 0.6427 | 0.6537 | unchanged (null) |
| `industry_data_center` | 0.0216 | 0.7011 | 0.7297 | unchanged (null) |
| `family_ai_ml` | 0.0182 | 0.7989 | 0.8713 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `hourly_original`, `region_south`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.738** (220 disclosed, 78 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.077 | 3.449 | -0.371 | 0.0559 |
| `yrs_exp_min` | 1.414 | 1.897 | -0.484 | 0.1478 |
| `yrs_exp_stated` | 0.382 | 0.5 | -0.118 | 0.0746 |
| `degree_required` | 0.7 | 0.59 | 0.11 | 0.0876 |
| `degree_stem` | 0.282 | 0.385 | -0.103 | 0.1065 |
| `skill_cloud` | 0.114 | 0.09 | 0.024 | 0.541 |
| `skill_ml_ai` | 0.177 | 0.231 | -0.053 | 0.3283 |
| `remote_eligible` | 0.077 | 0.179 | -0.102 | 0.033 |
| `hourly_original` | 0.009 | 0.0 | 0.009 | 0.1578 |
| `mandate_state` | 0.705 | 0.141 | 0.564 | 0.0 |
| `region_northeast` | 0.259 | 0.115 | 0.144 | 0.0025 |
| `region_south` | 0.186 | 0.615 | -0.429 | 0.0 |
| `region_west` | 0.232 | 0.026 | 0.206 | 0.0 |
| `industry_data_center` | 0.091 | 0.321 | -0.23 | 0.0001 |
| `family_ai_ml` | 0.068 | 0.038 | 0.03 | 0.2857 |
| `metro_indianapolis` | 0.018 | 0.103 | -0.084 | 0.0204 |


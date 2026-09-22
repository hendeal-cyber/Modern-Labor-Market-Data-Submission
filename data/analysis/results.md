# Results

- Postings in scope: **297**
- With disclosed pay: **220**
- Used in estimation: **220**
- Distinct employers in the estimation sample (**the cluster count**): **34**
- Distinct employers across all postings in scope: **46**

Regressor budget at 20 observations each: **11** (specification used: **core**).

Minimum detectable standardized effect: **0.1962** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 220, R² = 0.5525, adjusted R² = 0.5196, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2891*** | 0.0418 | 0.0 | [11.2072, 11.371] | — |
| `seniority_rank` | 0.1185*** | 0.009 | 0.0 | [0.1007, 0.1362] | 12.58% |
| `yrs_exp_min` | 0.0143 | 0.0107 | 0.1823 | [-0.0067, 0.0352] | 1.44% |
| `yrs_exp_stated` | -0.01 | 0.0505 | 0.8434 | [-0.1089, 0.089] | -0.99% |
| `degree_required` | 0.0049 | 0.0341 | 0.8864 | [-0.0619, 0.0717] | 0.49% |
| `degree_stem` | 0.0538* | 0.0316 | 0.089 | [-0.0082, 0.1158] | 5.53% |
| `skill_cloud` | 0.1349** | 0.0569 | 0.0178 | [0.0233, 0.2465] | 14.44% |
| `skill_ml_ai` | 0.0035 | 0.046 | 0.9402 | [-0.0868, 0.0937] | 0.35% |
| `remote_eligible` | 0.0422 | 0.0478 | 0.3771 | [-0.0515, 0.1359] | 4.31% |
| `hourly_original` | 0.0842** | 0.0344 | 0.0144 | [0.0168, 0.1516] | 8.78% |
| `mandate_state` | -0.0289 | 0.0264 | 0.2732 | [-0.0807, 0.0228] | -2.85% |
| `region_northeast` | 0.1098*** | 0.0381 | 0.0039 | [0.0352, 0.1843] | 11.6% |
| `region_south` | 0.0927** | 0.0393 | 0.0183 | [0.0157, 0.1697] | 9.71% |
| `region_west` | 0.0184 | 0.0382 | 0.6312 | [-0.0566, 0.0933] | 1.85% |
| `industry_data_center` | 0.0218 | 0.0563 | 0.6988 | [-0.0885, 0.1321] | 2.2% |
| `family_ai_ml` | 0.0192 | 0.0712 | 0.7874 | [-0.1204, 0.1588] | 1.94% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 215, R² = 0.3215, adjusted R² = 0.2703, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.6568*** | 0.1968 | 0.0 | [9.2711, 10.0426] | — |
| `seniority_rank` | 0.1209*** | 0.0311 | 0.0001 | [0.06, 0.1818] | 12.85% |
| `yrs_exp_min` | -0.0183 | 0.0312 | 0.5573 | [-0.0795, 0.0429] | -1.82% |
| `yrs_exp_stated` | 0.1118 | 0.1462 | 0.4444 | [-0.1747, 0.3984] | 11.83% |
| `degree_required` | 0.2222 | 0.1639 | 0.1753 | [-0.0991, 0.5434] | 24.88% |
| `degree_stem` | 0.3659*** | 0.1247 | 0.0033 | [0.1215, 0.6103] | 44.18% |
| `skill_cloud` | 0.0587 | 0.1751 | 0.7375 | [-0.2846, 0.4019] | 6.04% |
| `skill_ml_ai` | 0.075 | 0.1697 | 0.6583 | [-0.2575, 0.4076] | 7.79% |
| `remote_eligible` | 0.1286 | 0.2068 | 0.534 | [-0.2768, 0.5341] | 13.73% |
| `hourly_original` | 0.0833 | 0.1532 | 0.5868 | [-0.217, 0.3836] | 8.68% |
| `mandate_state` | -0.2223* | 0.1142 | 0.0516 | [-0.4461, 0.0015] | -19.93% |
| `region_northeast` | 0.0598 | 0.2711 | 0.8255 | [-0.4716, 0.5912] | 6.16% |
| `region_south` | 0.3632*** | 0.1089 | 0.0009 | [0.1497, 0.5767] | 43.79% |
| `region_west` | 0.3686*** | 0.13 | 0.0046 | [0.1139, 0.6234] | 44.58% |
| `industry_data_center` | -0.7965*** | 0.2711 | 0.0033 | [-1.328, -0.2651] | -54.91% |
| `family_ai_ml` | -0.0868 | 0.2577 | 0.7362 | [-0.5919, 0.4183] | -8.31% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 297, R² = 0.3567, adjusted R² = 0.3411, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6622*** | 0.138 | 0.0 | [0.3917, 0.9326] | — |
| `mandate_state` | 0.3425*** | 0.1193 | 0.0041 | [0.1087, 0.5763] | 40.84% |
| `seniority_rank` | -0.0004 | 0.0151 | 0.9776 | [-0.0301, 0.0292] | -0.04% |
| `remote_eligible` | -0.1069 | 0.1502 | 0.4765 | [-0.4013, 0.1875] | -10.14% |
| `industry_data_center` | -0.2305 | 0.1648 | 0.1617 | [-0.5535, 0.0924] | -20.59% |
| `region_northeast` | -0.0398 | 0.1104 | 0.7185 | [-0.2563, 0.1766] | -3.9% |
| `region_south` | -0.2167 | 0.1398 | 0.1212 | [-0.4906, 0.0573] | -19.48% |
| `region_west` | 0.043 | 0.081 | 0.5956 | [-0.1158, 0.2017] | 4.39% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 51, R² = 0.513, adjusted R² = 0.3236, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3509*** | 0.1655 | 0.0 | [11.0266, 11.6752] | — |
| `seniority_rank` | 0.1071 | 0.0817 | 0.1899 | [-0.0531, 0.2673] | 11.31% |
| `yrs_exp_min` | -0.0067 | 0.0407 | 0.8687 | [-0.0866, 0.0731] | -0.67% |
| `yrs_exp_stated` | -0.0314 | 0.1133 | 0.7813 | [-0.2534, 0.1905] | -3.1% |
| `degree_required` | -0.0092 | 0.0345 | 0.7902 | [-0.0768, 0.0585] | -0.91% |
| `degree_stem` | 0.113*** | 0.0317 | 0.0004 | [0.0509, 0.175] | 11.96% |
| `skill_cloud` | 0.1993 | 0.2106 | 0.344 | [-0.2135, 0.6121] | 22.06% |
| `skill_ml_ai` | -0.0338 | 0.1242 | 0.7853 | [-0.2773, 0.2096] | -3.33% |
| `remote_eligible` | -0.0423 | 0.0692 | 0.5406 | [-0.1779, 0.0932] | -4.14% |
| `mandate_state` | 0.0672 | 0.0972 | 0.4892 | [-0.1233, 0.2577] | 6.95% |
| `region_northeast` | 0.0036 | 0.0723 | 0.9605 | [-0.1381, 0.1453] | 0.36% |
| `region_south` | -0.0079 | 0.1122 | 0.9436 | [-0.2278, 0.2119] | -0.79% |
| `region_west` | 0.0581 | 0.0737 | 0.4303 | [-0.0864, 0.2026] | 5.99% |
| `industry_data_center` | -0.1159 | 0.0757 | 0.1259 | [-0.2643, 0.0325] | -10.94% |
| `family_ai_ml` | 0.5598*** | 0.176 | 0.0015 | [0.2148, 0.9049] | 75.04% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 212, R² = 0.562, adjusted R² = 0.5285, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3514*** | 0.0476 | 0.0 | [11.2582, 11.4447] | — |
| `seniority_rank` | 0.1188*** | 0.0088 | 0.0 | [0.1016, 0.136] | 12.61% |
| `yrs_exp_min` | 0.0158 | 0.0101 | 0.1184 | [-0.004, 0.0356] | 1.59% |
| `yrs_exp_stated` | -0.0052 | 0.0521 | 0.9197 | [-0.1073, 0.0968] | -0.52% |
| `degree_required` | 0.0009 | 0.0351 | 0.9796 | [-0.0678, 0.0696] | 0.09% |
| `degree_stem` | 0.0584* | 0.0354 | 0.0993 | [-0.0111, 0.1279] | 6.02% |
| `skill_cloud` | 0.143** | 0.0577 | 0.0133 | [0.0298, 0.2561] | 15.37% |
| `skill_ml_ai` | -0.031 | 0.0405 | 0.4445 | [-0.1104, 0.0484] | -3.05% |
| `remote_eligible` | 0.0369 | 0.0512 | 0.4713 | [-0.0635, 0.1373] | 3.76% |
| `hourly_original` | 0.0231 | 0.0357 | 0.5177 | [-0.0468, 0.0929] | 2.33% |
| `mandate_state` | -0.0807** | 0.0327 | 0.0135 | [-0.1448, -0.0166] | -7.76% |
| `region_northeast` | 0.0371 | 0.0402 | 0.3557 | [-0.0417, 0.116] | 3.78% |
| `region_south` | 0.0732* | 0.0418 | 0.0795 | [-0.0086, 0.1551] | 7.6% |
| `region_west` | -0.0319 | 0.0327 | 0.3303 | [-0.0961, 0.0323] | -3.14% |
| `industry_data_center` | -0.0047 | 0.0551 | 0.9325 | [-0.1128, 0.1034] | -0.47% |
| `family_ai_ml` | 0.0627 | 0.069 | 0.3639 | [-0.0726, 0.198] | 6.47% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 34 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1185 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0143 | 0.1823 | 0.3449 | unchanged (null) |
| `yrs_exp_stated` | -0.01 | 0.8434 | 0.8519 | unchanged (null) |
| `degree_required` | 0.0049 | 0.8864 | 0.8966 | unchanged (null) |
| `degree_stem` | 0.0538 | 0.089 | 0.1316 | unchanged (null) |
| `skill_cloud` | 0.1349 | 0.0178 | 0.0308 | unchanged (significant) |
| `skill_ml_ai` | 0.0035 | 0.9402 | 0.9446 | unchanged (null) |
| `remote_eligible` | 0.0422 | 0.3771 | 0.4101 | unchanged (null) |
| `hourly_original` | 0.0842 | 0.0144 | 0.462 | **no longer significant** |
| `mandate_state` | -0.0289 | 0.2732 | 0.3016 | unchanged (null) |
| `region_northeast` | 0.1098 | 0.0039 | 0.0101 | unchanged (significant) |
| `region_south` | 0.0927 | 0.0183 | 0.0953 | **no longer significant** |
| `region_west` | 0.0184 | 0.6312 | 0.6428 | unchanged (null) |
| `industry_data_center` | 0.0218 | 0.6988 | 0.7295 | unchanged (null) |
| `family_ai_ml` | 0.0192 | 0.7874 | 0.8638 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `hourly_original`, `region_south`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.741** (220 disclosed, 77 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.055 | 3.429 | -0.374 | 0.0549 |
| `yrs_exp_min` | 1.386 | 1.857 | -0.471 | 0.1592 |
| `yrs_exp_stated` | 0.377 | 0.494 | -0.116 | 0.0808 |
| `degree_required` | 0.7 | 0.597 | 0.103 | 0.1126 |
| `degree_stem` | 0.282 | 0.39 | -0.108 | 0.093 |
| `skill_cloud` | 0.114 | 0.091 | 0.023 | 0.5643 |
| `skill_ml_ai` | 0.177 | 0.234 | -0.056 | 0.3062 |
| `remote_eligible` | 0.077 | 0.169 | -0.092 | 0.0521 |
| `hourly_original` | 0.009 | 0.0 | 0.009 | 0.1578 |
| `mandate_state` | 0.705 | 0.13 | 0.575 | 0.0 |
| `region_northeast` | 0.259 | 0.117 | 0.142 | 0.003 |
| `region_south` | 0.182 | 0.61 | -0.429 | 0.0 |
| `region_west` | 0.232 | 0.026 | 0.206 | 0.0 |
| `industry_data_center` | 0.091 | 0.325 | -0.234 | 0.0001 |
| `family_ai_ml` | 0.068 | 0.039 | 0.029 | 0.2978 |
| `metro_indianapolis` | 0.018 | 0.104 | -0.086 | 0.0199 |


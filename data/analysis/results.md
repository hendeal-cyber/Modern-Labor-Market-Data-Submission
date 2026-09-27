# Results

- Postings in scope: **486**
- With disclosed pay: **365**
- Used in estimation: **365**
- Distinct employers in the estimation sample (**the cluster count**): **52**
- Distinct employers across all postings in scope: **72**

Regressor budget at 20 observations each: **18** (specification used: **core**).

Minimum detectable standardized effect: **0.15** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 365, R² = 0.6448, adjusted R² = 0.6295, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.287*** | 0.0402 | 0.0 | [11.2082, 11.3659] | — |
| `seniority_rank` | 0.1122*** | 0.0092 | 0.0 | [0.0941, 0.1303] | 11.87% |
| `yrs_exp_min` | 0.0266*** | 0.0058 | 0.0 | [0.0152, 0.0379] | 2.69% |
| `yrs_exp_stated` | -0.0661* | 0.0365 | 0.0703 | [-0.1376, 0.0055] | -6.39% |
| `degree_required` | -0.0137 | 0.0261 | 0.6011 | [-0.0649, 0.0376] | -1.36% |
| `degree_stem` | 0.0537** | 0.0233 | 0.0212 | [0.008, 0.0994] | 5.52% |
| `skill_cloud` | 0.0837*** | 0.0297 | 0.0049 | [0.0254, 0.1419] | 8.73% |
| `skill_ml_ai` | 0.0826** | 0.0408 | 0.0431 | [0.0026, 0.1627] | 8.61% |
| `remote_eligible` | 0.0474 | 0.0365 | 0.1938 | [-0.0241, 0.119] | 4.86% |
| `hourly_original` | -0.2526 | 0.2683 | 0.3464 | [-0.7785, 0.2733] | -22.32% |
| `mandate_state` | -0.0037 | 0.0351 | 0.9154 | [-0.0726, 0.0651] | -0.37% |
| `region_northeast` | 0.1028*** | 0.0322 | 0.0014 | [0.0397, 0.1659] | 10.82% |
| `region_south` | 0.0499 | 0.0545 | 0.36 | [-0.057, 0.1568] | 5.12% |
| `region_west` | 0.0847* | 0.0445 | 0.0568 | [-0.0025, 0.1719] | 8.84% |
| `industry_data_center` | 0.1623** | 0.0755 | 0.0316 | [0.0143, 0.3102] | 17.62% |
| `family_ai_ml` | 0.0579 | 0.0383 | 0.13 | [-0.0171, 0.1329] | 5.96% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 355, R² = 0.3043, adjusted R² = 0.2735, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.6861*** | 0.1555 | 0.0 | [9.3813, 9.9909] | — |
| `seniority_rank` | 0.1109*** | 0.0283 | 0.0001 | [0.0554, 0.1664] | 11.72% |
| `yrs_exp_min` | 0.0147 | 0.0156 | 0.3468 | [-0.0159, 0.0453] | 1.48% |
| `yrs_exp_stated` | -0.0488 | 0.106 | 0.6456 | [-0.2566, 0.1591] | -4.76% |
| `degree_required` | 0.1253 | 0.1031 | 0.2242 | [-0.0768, 0.3273] | 13.35% |
| `degree_stem` | 0.2579*** | 0.0775 | 0.0009 | [0.1061, 0.4097] | 29.42% |
| `skill_cloud` | -0.0375 | 0.075 | 0.6173 | [-0.1845, 0.1096] | -3.68% |
| `skill_ml_ai` | 0.3264*** | 0.1264 | 0.0098 | [0.0786, 0.5742] | 38.6% |
| `remote_eligible` | 0.0403 | 0.1345 | 0.7645 | [-0.2234, 0.304] | 4.11% |
| `hourly_original` | -0.48 | 0.5132 | 0.3496 | [-1.486, 0.5259] | -38.12% |
| `mandate_state` | -0.0973 | 0.0993 | 0.3273 | [-0.2919, 0.0973] | -9.27% |
| `region_northeast` | 0.0663 | 0.2351 | 0.778 | [-0.3945, 0.527] | 6.85% |
| `region_south` | 0.3116*** | 0.1086 | 0.0041 | [0.0987, 0.5245] | 36.56% |
| `region_west` | 0.4257*** | 0.1002 | 0.0 | [0.2294, 0.6221] | 53.07% |
| `industry_data_center` | -0.5107*** | 0.191 | 0.0075 | [-0.8851, -0.1363] | -39.99% |
| `family_ai_ml` | 0.0644 | 0.1641 | 0.6949 | [-0.2573, 0.3861] | 6.65% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 486, R² = 0.3633, adjusted R² = 0.354, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.685*** | 0.1069 | 0.0 | [0.4754, 0.8945] | — |
| `mandate_state` | 0.3401*** | 0.0991 | 0.0006 | [0.1458, 0.5345] | 40.51% |
| `seniority_rank` | 0.0061 | 0.0127 | 0.6314 | [-0.0188, 0.031] | 0.61% |
| `remote_eligible` | 0.0048 | 0.089 | 0.9573 | [-0.1697, 0.1792] | 0.48% |
| `industry_data_center` | -0.0969 | 0.0958 | 0.3119 | [-0.2848, 0.0909] | -9.24% |
| `region_northeast` | -0.0951 | 0.0955 | 0.3194 | [-0.2822, 0.0921] | -9.07% |
| `region_south` | -0.3745*** | 0.1123 | 0.0009 | [-0.5945, -0.1544] | -31.23% |
| `region_west` | -0.047 | 0.0831 | 0.5719 | [-0.2098, 0.1159] | -4.59% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 63, R² = 0.5397, adjusted R² = 0.3928, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4359*** | 0.1342 | 0.0 | [11.1729, 11.6988] | — |
| `seniority_rank` | 0.0482 | 0.0705 | 0.4941 | [-0.09, 0.1864] | 4.94% |
| `yrs_exp_min` | -0.0129 | 0.0422 | 0.7606 | [-0.0957, 0.0699] | -1.28% |
| `yrs_exp_stated` | 0.0254 | 0.118 | 0.8296 | [-0.2058, 0.2566] | 2.57% |
| `degree_required` | -0.0464 | 0.048 | 0.3337 | [-0.1404, 0.0476] | -4.53% |
| `degree_stem` | 0.0823** | 0.0407 | 0.0431 | [0.0025, 0.1621] | 8.58% |
| `skill_cloud` | 0.1929 | 0.2111 | 0.3608 | [-0.2208, 0.6066] | 21.28% |
| `skill_ml_ai` | 0.0315 | 0.1184 | 0.7903 | [-0.2006, 0.2636] | 3.2% |
| `remote_eligible` | 0.0196 | 0.0771 | 0.799 | [-0.1315, 0.1707] | 1.98% |
| `hourly_original` | -0.9219*** | 0.1656 | 0.0 | [-1.2464, -0.5974] | -60.22% |
| `mandate_state` | 0.0813 | 0.0777 | 0.2953 | [-0.0709, 0.2335] | 8.47% |
| `region_northeast` | -0.0487 | 0.0817 | 0.5506 | [-0.2088, 0.1113] | -4.76% |
| `region_south` | -0.0763 | 0.1142 | 0.5043 | [-0.3001, 0.1475] | -7.34% |
| `region_west` | 0.0351 | 0.0677 | 0.604 | [-0.0976, 0.1679] | 3.57% |
| `industry_data_center` | 0.01 | 0.1147 | 0.9308 | [-0.2148, 0.2347] | 1.0% |
| `family_ai_ml` | 0.4401** | 0.1749 | 0.0119 | [0.0973, 0.783] | 55.29% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 341, R² = 0.6268, adjusted R² = 0.6096, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3632*** | 0.0492 | 0.0 | [11.2667, 11.4597] | — |
| `seniority_rank` | 0.1128*** | 0.0091 | 0.0 | [0.095, 0.1306] | 11.94% |
| `yrs_exp_min` | 0.0255*** | 0.0055 | 0.0 | [0.0147, 0.0362] | 2.58% |
| `yrs_exp_stated` | -0.0606* | 0.0354 | 0.0874 | [-0.13, 0.0089] | -5.88% |
| `degree_required` | -0.0097 | 0.0275 | 0.7246 | [-0.0636, 0.0442] | -0.96% |
| `degree_stem` | 0.052** | 0.0247 | 0.0355 | [0.0035, 0.1004] | 5.33% |
| `skill_cloud` | 0.087*** | 0.0271 | 0.0013 | [0.0338, 0.1402] | 9.09% |
| `skill_ml_ai` | 0.0694* | 0.0375 | 0.0646 | [-0.0042, 0.143] | 7.18% |
| `remote_eligible` | 0.0529 | 0.0414 | 0.2013 | [-0.0282, 0.134] | 5.43% |
| `hourly_original` | -0.2887 | 0.2629 | 0.2722 | [-0.804, 0.2267] | -25.07% |
| `mandate_state` | -0.0696* | 0.0391 | 0.0753 | [-0.1463, 0.0071] | -6.72% |
| `region_northeast` | 0.0255 | 0.0336 | 0.4483 | [-0.0404, 0.0914] | 2.58% |
| `region_south` | 0.0161 | 0.0519 | 0.7569 | [-0.0856, 0.1178] | 1.62% |
| `region_west` | 0.0114 | 0.035 | 0.7448 | [-0.0573, 0.0801] | 1.15% |
| `industry_data_center` | 0.1464** | 0.069 | 0.0338 | [0.0112, 0.2817] | 15.77% |
| `family_ai_ml` | 0.0743** | 0.0366 | 0.0422 | [0.0026, 0.1459] | 7.71% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 52 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1122 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0266 | 0.0 | 0.0013 | unchanged (significant) |
| `yrs_exp_stated` | -0.0661 | 0.0703 | 0.0737 | unchanged (null) |
| `degree_required` | -0.0137 | 0.6011 | 0.6287 | unchanged (null) |
| `degree_stem` | 0.0537 | 0.0212 | 0.0317 | unchanged (significant) |
| `skill_cloud` | 0.0837 | 0.0049 | 0.0463 | unchanged (significant) |
| `skill_ml_ai` | 0.0826 | 0.0431 | 0.0803 | **no longer significant** |
| `remote_eligible` | 0.0474 | 0.1938 | 0.2951 | unchanged (null) |
| `hourly_original` | -0.2526 | 0.3464 | 0.8082 | unchanged (null) |
| `mandate_state` | -0.0037 | 0.9154 | 0.9229 | unchanged (null) |
| `region_northeast` | 0.1028 | 0.0014 | 0.0019 | unchanged (significant) |
| `region_south` | 0.0499 | 0.36 | 0.4867 | unchanged (null) |
| `region_west` | 0.0847 | 0.0568 | 0.0725 | unchanged (null) |
| `industry_data_center` | 0.1623 | 0.0316 | 0.2413 | **no longer significant** |
| `family_ai_ml` | 0.0579 | 0.13 | 0.199 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `skill_ml_ai`, `industry_data_center`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.751** (365 disclosed, 121 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.326 | 3.364 | -0.038 | 0.8085 |
| `yrs_exp_min` | 2.11 | 1.802 | 0.308 | 0.2762 |
| `yrs_exp_stated` | 0.444 | 0.496 | -0.052 | 0.3233 |
| `degree_required` | 0.627 | 0.57 | 0.057 | 0.2713 |
| `degree_stem` | 0.367 | 0.397 | -0.03 | 0.565 |
| `skill_cloud` | 0.189 | 0.14 | 0.049 | 0.2001 |
| `skill_ml_ai` | 0.356 | 0.24 | 0.116 | 0.0127 |
| `remote_eligible` | 0.145 | 0.132 | 0.013 | 0.719 |
| `hourly_original` | 0.008 | 0.0 | 0.008 | 0.0833 |
| `mandate_state` | 0.729 | 0.165 | 0.563 | 0.0 |
| `region_northeast` | 0.225 | 0.107 | 0.117 | 0.0012 |
| `region_south` | 0.148 | 0.661 | -0.513 | 0.0 |
| `region_west` | 0.351 | 0.066 | 0.285 | 0.0 |
| `industry_data_center` | 0.197 | 0.24 | -0.042 | 0.3385 |
| `family_ai_ml` | 0.101 | 0.058 | 0.044 | 0.1023 |
| `metro_indianapolis` | 0.011 | 0.066 | -0.055 | 0.0195 |


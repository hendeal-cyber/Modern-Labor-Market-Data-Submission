# Results

- Postings in scope: **290**
- With disclosed pay: **214**
- Used in estimation: **214**
- Distinct employers in the estimation sample (**the cluster count**): **34**
- Distinct employers across all postings in scope: **46**

Regressor budget at 20 observations each: **10** (specification used: **core**).

Minimum detectable standardized effect: **0.1991** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 214, R² = 0.5559, adjusted R² = 0.5222, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2939*** | 0.0474 | 0.0 | [11.201, 11.3869] | — |
| `seniority_rank` | 0.1206*** | 0.0096 | 0.0 | [0.1017, 0.1395] | 12.82% |
| `yrs_exp_min` | 0.0135 | 0.0111 | 0.2225 | [-0.0082, 0.0353] | 1.36% |
| `yrs_exp_stated` | -0.003 | 0.054 | 0.9551 | [-0.1089, 0.1028] | -0.3% |
| `degree_required` | 0.0062 | 0.0352 | 0.8606 | [-0.0628, 0.0751] | 0.62% |
| `degree_stem` | 0.0477 | 0.0301 | 0.1128 | [-0.0113, 0.1067] | 4.89% |
| `skill_cloud` | 0.1242** | 0.0572 | 0.0299 | [0.0121, 0.2364] | 13.23% |
| `skill_ml_ai` | 0.018 | 0.0468 | 0.7005 | [-0.0737, 0.1096] | 1.81% |
| `remote_eligible` | 0.0349 | 0.0485 | 0.4714 | [-0.0601, 0.13] | 3.56% |
| `hourly_original` | 0.086** | 0.0336 | 0.0105 | [0.0201, 0.1519] | 8.98% |
| `mandate_state` | -0.0379 | 0.0295 | 0.1989 | [-0.0958, 0.0199] | -3.72% |
| `region_northeast` | 0.1069*** | 0.0399 | 0.0073 | [0.0287, 0.185] | 11.28% |
| `region_south` | 0.0825** | 0.0415 | 0.0469 | [0.0011, 0.1638] | 8.6% |
| `region_west` | 0.0182 | 0.0376 | 0.6282 | [-0.0555, 0.0919] | 1.84% |
| `industry_data_center` | 0.023 | 0.0557 | 0.6797 | [-0.0862, 0.1322] | 2.33% |
| `family_ai_ml` | 0.0046 | 0.076 | 0.9515 | [-0.1444, 0.1537] | 0.46% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 209, R² = 0.31, adjusted R² = 0.2564, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.6709*** | 0.2179 | 0.0 | [9.2439, 10.0979] | — |
| `seniority_rank` | 0.115*** | 0.0339 | 0.0007 | [0.0487, 0.1814] | 12.19% |
| `yrs_exp_min` | -0.0186 | 0.0327 | 0.5688 | [-0.0827, 0.0454] | -1.85% |
| `yrs_exp_stated` | 0.1073 | 0.1473 | 0.4665 | [-0.1815, 0.3961] | 11.33% |
| `degree_required` | 0.2116 | 0.1709 | 0.2159 | [-0.1235, 0.5466] | 23.56% |
| `degree_stem` | 0.3689*** | 0.1284 | 0.0041 | [0.1173, 0.6205] | 44.62% |
| `skill_cloud` | 0.0479 | 0.1849 | 0.7954 | [-0.3145, 0.4104] | 4.91% |
| `skill_ml_ai` | 0.0949 | 0.1763 | 0.5903 | [-0.2507, 0.4405] | 9.96% |
| `remote_eligible` | 0.1286 | 0.2065 | 0.5333 | [-0.2761, 0.5334] | 13.73% |
| `hourly_original` | 0.0866 | 0.1517 | 0.5682 | [-0.2107, 0.3838] | 9.04% |
| `mandate_state` | -0.2156* | 0.1195 | 0.0712 | [-0.4498, 0.0186] | -19.39% |
| `region_northeast` | 0.0661 | 0.2837 | 0.8157 | [-0.4899, 0.6221] | 6.84% |
| `region_south` | 0.3579*** | 0.1137 | 0.0016 | [0.135, 0.5807] | 43.03% |
| `region_west` | 0.3654*** | 0.1287 | 0.0045 | [0.1131, 0.6176] | 44.1% |
| `industry_data_center` | -0.7941*** | 0.2679 | 0.003 | [-1.3191, -0.2691] | -54.8% |
| `family_ai_ml` | -0.0812 | 0.2692 | 0.7628 | [-0.6089, 0.4464] | -7.8% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 290, R² = 0.364, adjusted R² = 0.3482, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6423*** | 0.1329 | 0.0 | [0.3818, 0.9028] | — |
| `mandate_state` | 0.3525*** | 0.1166 | 0.0025 | [0.124, 0.5809] | 42.26% |
| `seniority_rank` | -0.0014 | 0.015 | 0.9255 | [-0.0308, 0.028] | -0.14% |
| `remote_eligible` | -0.0966 | 0.149 | 0.5169 | [-0.3886, 0.1955] | -9.2% |
| `industry_data_center` | -0.2275 | 0.1645 | 0.1667 | [-0.55, 0.095] | -20.35% |
| `region_northeast` | -0.0213 | 0.0987 | 0.8295 | [-0.2146, 0.1721] | -2.1% |
| `region_south` | -0.198 | 0.1378 | 0.151 | [-0.4681, 0.0722] | -17.96% |
| `region_west` | 0.0561 | 0.0791 | 0.4776 | [-0.0988, 0.2111] | 5.77% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 50, R² = 0.5197, adjusted R² = 0.3276, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3853*** | 0.1883 | 0.0 | [11.0162, 11.7544] | — |
| `seniority_rank` | 0.1039 | 0.0844 | 0.2184 | [-0.0615, 0.2693] | 10.94% |
| `yrs_exp_min` | -0.0056 | 0.0404 | 0.8906 | [-0.0848, 0.0737] | -0.55% |
| `yrs_exp_stated` | -0.0257 | 0.1189 | 0.8289 | [-0.2587, 0.2073] | -2.54% |
| `degree_required` | -0.033 | 0.0448 | 0.4616 | [-0.1209, 0.0549] | -3.25% |
| `degree_stem` | 0.1124*** | 0.0331 | 0.0007 | [0.0475, 0.1774] | 11.9% |
| `skill_cloud` | 0.1174 | 0.1436 | 0.4135 | [-0.164, 0.3989] | 12.46% |
| `skill_ml_ai` | 0.0606* | 0.0366 | 0.098 | [-0.0112, 0.1323] | 6.24% |
| `remote_eligible` | -0.0516 | 0.0779 | 0.5074 | [-0.2043, 0.1011] | -5.03% |
| `mandate_state` | 0.0584 | 0.1055 | 0.5803 | [-0.1485, 0.2652] | 6.01% |
| `region_northeast` | -0.0098 | 0.0812 | 0.9043 | [-0.1689, 0.1494] | -0.97% |
| `region_south` | -0.042 | 0.1418 | 0.7672 | [-0.3199, 0.236] | -4.11% |
| `region_west` | 0.0511 | 0.0758 | 0.5001 | [-0.0974, 0.1997] | 5.24% |
| `industry_data_center` | -0.1091 | 0.0765 | 0.1539 | [-0.2591, 0.0409] | -10.34% |
| `family_ai_ml` | 0.5449*** | 0.1853 | 0.0033 | [0.1816, 0.9081] | 72.44% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 206, R² = 0.5664, adjusted R² = 0.5322, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.356*** | 0.0558 | 0.0 | [11.2467, 11.4653] | — |
| `seniority_rank` | 0.1209*** | 0.0094 | 0.0 | [0.1026, 0.1393] | 12.86% |
| `yrs_exp_min` | 0.015 | 0.0105 | 0.1544 | [-0.0056, 0.0357] | 1.51% |
| `yrs_exp_stated` | 0.0008 | 0.0553 | 0.9877 | [-0.1075, 0.1092] | 0.08% |
| `degree_required` | 0.0034 | 0.036 | 0.9252 | [-0.0672, 0.074] | 0.34% |
| `degree_stem` | 0.0521 | 0.0343 | 0.1295 | [-0.0152, 0.1194] | 5.34% |
| `skill_cloud` | 0.1348** | 0.0584 | 0.0211 | [0.0203, 0.2493] | 14.43% |
| `skill_ml_ai` | -0.0179 | 0.04 | 0.6539 | [-0.0964, 0.0605] | -1.78% |
| `remote_eligible` | 0.0344 | 0.0496 | 0.4883 | [-0.0628, 0.1316] | 3.5% |
| `hourly_original` | 0.0247 | 0.0349 | 0.4788 | [-0.0437, 0.0932] | 2.5% |
| `mandate_state` | -0.0907** | 0.038 | 0.0171 | [-0.1652, -0.0161] | -8.67% |
| `region_northeast` | 0.0352 | 0.0423 | 0.4048 | [-0.0476, 0.118] | 3.58% |
| `region_south` | 0.063 | 0.0459 | 0.17 | [-0.027, 0.153] | 6.5% |
| `region_west` | -0.0318 | 0.0321 | 0.3229 | [-0.0947, 0.0312] | -3.13% |
| `industry_data_center` | -0.0019 | 0.0546 | 0.9724 | [-0.1089, 0.1052] | -0.19% |
| `family_ai_ml` | 0.0467 | 0.0747 | 0.5317 | [-0.0997, 0.1932] | 4.78% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 34 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1206 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0135 | 0.2225 | 0.3666 | unchanged (null) |
| `yrs_exp_stated` | -0.003 | 0.9551 | 0.9567 | unchanged (null) |
| `degree_required` | 0.0062 | 0.8606 | 0.8758 | unchanged (null) |
| `degree_stem` | 0.0477 | 0.1128 | 0.1499 | unchanged (null) |
| `skill_cloud` | 0.1242 | 0.0299 | 0.0455 | unchanged (significant) |
| `skill_ml_ai` | 0.018 | 0.7005 | 0.7153 | unchanged (null) |
| `remote_eligible` | 0.0349 | 0.4714 | 0.5062 | unchanged (null) |
| `hourly_original` | 0.086 | 0.0105 | 0.4504 | **no longer significant** |
| `mandate_state` | -0.0379 | 0.1989 | 0.2506 | unchanged (null) |
| `region_northeast` | 0.1069 | 0.0073 | 0.0324 | unchanged (significant) |
| `region_south` | 0.0825 | 0.0469 | 0.1104 | **no longer significant** |
| `region_west` | 0.0182 | 0.6282 | 0.6376 | unchanged (null) |
| `industry_data_center` | 0.023 | 0.6797 | 0.7103 | unchanged (null) |
| `family_ai_ml` | 0.0046 | 0.9515 | 0.9681 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `hourly_original`, `region_south`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.738** (214 disclosed, 76 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.042 | 3.434 | -0.392 | 0.0472 |
| `yrs_exp_min` | 1.397 | 1.882 | -0.484 | 0.1528 |
| `yrs_exp_stated` | 0.379 | 0.487 | -0.108 | 0.1063 |
| `degree_required` | 0.701 | 0.605 | 0.096 | 0.141 |
| `degree_stem` | 0.28 | 0.395 | -0.114 | 0.0777 |
| `skill_cloud` | 0.112 | 0.092 | 0.02 | 0.6151 |
| `skill_ml_ai` | 0.173 | 0.237 | -0.064 | 0.2516 |
| `remote_eligible` | 0.079 | 0.171 | -0.092 | 0.0553 |
| `hourly_original` | 0.009 | 0.0 | 0.009 | 0.1578 |
| `mandate_state` | 0.72 | 0.132 | 0.588 | 0.0 |
| `region_northeast` | 0.262 | 0.105 | 0.156 | 0.0009 |
| `region_south` | 0.187 | 0.618 | -0.432 | 0.0 |
| `region_west` | 0.234 | 0.026 | 0.207 | 0.0 |
| `industry_data_center` | 0.093 | 0.329 | -0.235 | 0.0001 |
| `family_ai_ml` | 0.065 | 0.039 | 0.026 | 0.3581 |
| `metro_indianapolis` | 0.014 | 0.105 | -0.091 | 0.014 |


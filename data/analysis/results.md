# Results

- Postings in scope: **210**
- With disclosed pay: **165**
- Used in estimation: **165**
- Distinct employers in the estimation sample (**the cluster count**): **33**
- Distinct employers across all postings in scope: **43**

Regressor budget at 20 observations each: **8** (specification used: **core**).

Minimum detectable standardized effect: **0.2295** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 165, R² = 0.3985, adjusted R² = 0.338, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3892*** | 0.0433 | 0.0 | [11.3043, 11.474] | — |
| `seniority_rank` | 0.0874*** | 0.0111 | 0.0 | [0.0657, 0.1092] | 9.14% |
| `yrs_exp_min` | 0.0147 | 0.0156 | 0.3453 | [-0.0158, 0.0452] | 1.48% |
| `yrs_exp_stated` | -0.0839 | 0.0842 | 0.319 | [-0.2489, 0.0811] | -8.05% |
| `degree_required` | -0.0019 | 0.0413 | 0.9624 | [-0.083, 0.0791] | -0.19% |
| `degree_stem` | 0.0697 | 0.054 | 0.197 | [-0.0362, 0.1757] | 7.22% |
| `skill_cloud` | 0.0592 | 0.0936 | 0.527 | [-0.1243, 0.2427] | 6.1% |
| `skill_ml_ai` | 0.0788 | 0.0838 | 0.3469 | [-0.0854, 0.2431] | 8.2% |
| `remote_eligible` | 0.0689 | 0.0545 | 0.2062 | [-0.038, 0.1758] | 7.14% |
| `hourly_original` | -0.0913 | 0.2259 | 0.6862 | [-0.5341, 0.3515] | -8.72% |
| `mandate_state` | -0.1718*** | 0.0578 | 0.0029 | [-0.285, -0.0586] | -15.78% |
| `region_northeast` | 0.1837*** | 0.0624 | 0.0032 | [0.0615, 0.3059] | 20.17% |
| `region_south` | 0.1585*** | 0.0483 | 0.001 | [0.0639, 0.2531] | 17.18% |
| `region_west` | 0.0758* | 0.0449 | 0.0915 | [-0.0122, 0.1639] | 7.88% |
| `industry_data_center` | 0.1096 | 0.0755 | 0.1469 | [-0.0385, 0.2576] | 11.58% |
| `family_ai_ml` | -0.0183 | 0.1269 | 0.8854 | [-0.2671, 0.2305] | -1.81% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 148, R² = 0.2133, adjusted R² = 0.1239, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.0082*** | 0.1925 | 0.0 | [9.6309, 10.3855] | — |
| `seniority_rank` | 0.1333*** | 0.0503 | 0.0081 | [0.0346, 0.232] | 14.26% |
| `yrs_exp_min` | 0.0222 | 0.036 | 0.5381 | [-0.0485, 0.0928] | 2.24% |
| `yrs_exp_stated` | 0.1614 | 0.2272 | 0.4774 | [-0.2838, 0.6066] | 17.52% |
| `degree_required` | -0.1955 | 0.1439 | 0.1742 | [-0.4775, 0.0865] | -17.76% |
| `degree_stem` | 0.2963** | 0.1247 | 0.0175 | [0.0518, 0.5408] | 34.49% |
| `skill_cloud` | 0.019 | 0.2735 | 0.9446 | [-0.5171, 0.5551] | 1.92% |
| `skill_ml_ai` | -0.156 | 0.3076 | 0.612 | [-0.7589, 0.4469] | -14.44% |
| `remote_eligible` | 0.1164 | 0.2746 | 0.6716 | [-0.4218, 0.6546] | 12.34% |
| `hourly_original` | 0.1978* | 0.1124 | 0.0783 | [-0.0224, 0.4181] | 21.88% |
| `mandate_state` | 0.0695 | 0.1776 | 0.6955 | [-0.2785, 0.4175] | 7.2% |
| `region_northeast` | -0.3092 | 0.2161 | 0.1525 | [-0.7328, 0.1144] | -26.6% |
| `region_south` | 0.0129 | 0.1549 | 0.9336 | [-0.2907, 0.3165] | 1.3% |
| `region_west` | 0.0385 | 0.1483 | 0.795 | [-0.2521, 0.3291] | 3.93% |
| `industry_data_center` | -0.8139** | 0.3331 | 0.0145 | [-1.4668, -0.1611] | -55.69% |
| `family_ai_ml` | 0.4642 | 0.3033 | 0.1258 | [-0.1302, 1.0586] | 59.07% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 210, R² = 0.3592, adjusted R² = 0.337, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6224*** | 0.1329 | 0.0 | [0.362, 0.8828] | — |
| `mandate_state` | 0.386*** | 0.1045 | 0.0002 | [0.1811, 0.5908] | 47.1% |
| `seniority_rank` | 0.0058 | 0.0181 | 0.7476 | [-0.0297, 0.0414] | 0.59% |
| `remote_eligible` | -0.0526 | 0.155 | 0.7341 | [-0.3564, 0.2511] | -5.13% |
| `industry_data_center` | -0.1734 | 0.1371 | 0.2059 | [-0.442, 0.0952] | -15.92% |
| `region_northeast` | -0.0582 | 0.0852 | 0.4945 | [-0.2252, 0.1088] | -5.66% |
| `region_south` | -0.1944 | 0.1542 | 0.2075 | [-0.4968, 0.1079] | -17.67% |
| `region_west` | 0.0239 | 0.0777 | 0.759 | [-0.1285, 0.1762] | 2.41% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 38, R² = 0.5964, adjusted R² = 0.3508, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.1415*** | 0.4976 | 0.0 | [10.1663, 12.1167] | — |
| `seniority_rank` | 0.2349 | 0.2579 | 0.3623 | [-0.2706, 0.7404] | 26.48% |
| `yrs_exp_min` | -0.1336* | 0.0777 | 0.0856 | [-0.2859, 0.0187] | -12.51% |
| `yrs_exp_stated` | 0.0338 | 0.1337 | 0.8003 | [-0.2282, 0.2958] | 3.44% |
| `degree_required` | -0.0232 | 0.076 | 0.7607 | [-0.1722, 0.1259] | -2.29% |
| `degree_stem` | 0.2874** | 0.133 | 0.0307 | [0.0267, 0.548] | 33.3% |
| `skill_cloud` | 0.2743 | 0.326 | 0.4 | [-0.3645, 0.9132] | 31.57% |
| `skill_ml_ai` | 0.0384 | 0.097 | 0.6923 | [-0.1518, 0.2286] | 3.91% |
| `remote_eligible` | -0.1035 | 0.1715 | 0.5461 | [-0.4396, 0.2326] | -9.83% |
| `mandate_state` | 0.0494 | 0.2369 | 0.8348 | [-0.415, 0.5138] | 5.07% |
| `region_northeast` | -0.0194 | 0.1267 | 0.8785 | [-0.2676, 0.2289] | -1.92% |
| `region_south` | 0.0205 | 0.1497 | 0.8912 | [-0.273, 0.3139] | 2.07% |
| `region_west` | 0.1258 | 0.1346 | 0.3502 | [-0.1381, 0.3896] | 13.4% |
| `industry_data_center` | 0.137 | 0.2765 | 0.6202 | [-0.405, 0.679] | 14.69% |
| `family_ai_ml` | -0.165 | 0.4949 | 0.7389 | [-1.1349, 0.805] | -15.21% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 156, R² = 0.3911, adjusted R² = 0.3259, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4443*** | 0.0579 | 0.0 | [11.3308, 11.5579] | — |
| `seniority_rank` | 0.091*** | 0.0105 | 0.0 | [0.0704, 0.1116] | 9.53% |
| `yrs_exp_min` | 0.0167 | 0.0161 | 0.3011 | [-0.0149, 0.0483] | 1.68% |
| `yrs_exp_stated` | -0.0886 | 0.0876 | 0.3119 | [-0.2603, 0.0831] | -8.48% |
| `degree_required` | 0.0005 | 0.0431 | 0.9907 | [-0.0841, 0.0851] | 0.05% |
| `degree_stem` | 0.076 | 0.0592 | 0.1994 | [-0.0401, 0.1921] | 7.9% |
| `skill_cloud` | 0.0264 | 0.108 | 0.8066 | [-0.1852, 0.238] | 2.68% |
| `skill_ml_ai` | 0.0608 | 0.0989 | 0.5385 | [-0.133, 0.2546] | 6.27% |
| `remote_eligible` | 0.065 | 0.0598 | 0.2769 | [-0.0522, 0.1822] | 6.72% |
| `hourly_original` | -0.1231 | 0.2007 | 0.5394 | [-0.5164, 0.2702] | -11.59% |
| `mandate_state` | -0.2289*** | 0.0736 | 0.0019 | [-0.3732, -0.0845] | -20.46% |
| `region_northeast` | 0.1197* | 0.0691 | 0.0832 | [-0.0157, 0.2552] | 12.72% |
| `region_south` | 0.1358** | 0.061 | 0.0259 | [0.0164, 0.2553] | 14.55% |
| `region_west` | 0.0227 | 0.0428 | 0.5966 | [-0.0612, 0.1066] | 2.29% |
| `industry_data_center` | 0.1127 | 0.0886 | 0.2034 | [-0.061, 0.2863] | 11.93% |
| `family_ai_ml` | 0.0154 | 0.1515 | 0.9192 | [-0.2816, 0.3124] | 1.55% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 33 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.0874 | 0.0 | 0.0002 | unchanged (significant) |
| `yrs_exp_min` | 0.0147 | 0.3453 | 0.4037 | unchanged (null) |
| `yrs_exp_stated` | -0.0839 | 0.319 | 0.4087 | unchanged (null) |
| `degree_required` | -0.0019 | 0.9624 | 0.9643 | unchanged (null) |
| `degree_stem` | 0.0697 | 0.197 | 0.3333 | unchanged (null) |
| `skill_cloud` | 0.0592 | 0.527 | 0.553 | unchanged (null) |
| `skill_ml_ai` | 0.0788 | 0.3469 | 0.425 | unchanged (null) |
| `remote_eligible` | 0.0689 | 0.2062 | 0.2204 | unchanged (null) |
| `hourly_original` | -0.0913 | 0.6862 | 0.7716 | unchanged (null) |
| `mandate_state` | -0.1718 | 0.0029 | 0.0406 | unchanged (significant) |
| `region_northeast` | 0.1837 | 0.0032 | 0.0219 | unchanged (significant) |
| `region_south` | 0.1585 | 0.001 | 0.0207 | unchanged (significant) |
| `region_west` | 0.0758 | 0.0915 | 0.1152 | unchanged (null) |
| `industry_data_center` | 0.1096 | 0.1469 | 0.1785 | unchanged (null) |
| `family_ai_ml` | -0.0183 | 0.8854 | 0.904 | unchanged (null) |

No variable's significance verdict changes at the 0.05 level. The clustered p-values survive the bootstrap here; that is a result of the check, not a reason to have skipped it.

## Disclosure selection

Disclosure rate: **0.786** (165 disclosed, 45 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.752 | 2.956 | -0.204 | 0.3414 |
| `yrs_exp_min` | 1.442 | 2.133 | -0.691 | 0.1285 |
| `yrs_exp_stated` | 0.394 | 0.533 | -0.139 | 0.1029 |
| `degree_required` | 0.721 | 0.622 | 0.099 | 0.2263 |
| `degree_stem` | 0.352 | 0.289 | 0.063 | 0.4237 |
| `skill_cloud` | 0.152 | 0.178 | -0.026 | 0.6832 |
| `skill_ml_ai` | 0.218 | 0.2 | 0.018 | 0.7911 |
| `remote_eligible` | 0.115 | 0.222 | -0.107 | 0.1178 |
| `hourly_original` | 0.018 | 0.0 | 0.018 | 0.0833 |
| `mandate_state` | 0.752 | 0.111 | 0.64 | 0.0 |
| `region_northeast` | 0.236 | 0.111 | 0.125 | 0.0329 |
| `region_south` | 0.164 | 0.556 | -0.392 | 0.0 |
| `region_west` | 0.242 | 0.044 | 0.198 | 0.0 |
| `industry_data_center` | 0.115 | 0.311 | -0.196 | 0.0106 |
| `family_ai_ml` | 0.097 | 0.044 | 0.053 | 0.178 |
| `metro_indianapolis` | 0.018 | 0.111 | -0.093 | 0.0613 |


# Results

- Postings in scope: **730**
- With disclosed pay: **544**
- Used in estimation: **544**
- Distinct employers in the estimation sample (**the cluster count**): **100**
- Distinct employers across all postings in scope: **138**

Regressor budget at 20 observations each: **27** (specification used: **extended**).

Minimum detectable standardized effect: **0.1219** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 544, R² = 0.5902, adjusted R² = 0.5786, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3335*** | 0.0446 | 0.0 | [11.246, 11.4209] | — |
| `seniority_rank` | 0.1065*** | 0.0079 | 0.0 | [0.0911, 0.1219] | 11.23% |
| `yrs_exp_min` | 0.025*** | 0.0042 | 0.0 | [0.0167, 0.0333] | 2.53% |
| `yrs_exp_stated` | -0.073** | 0.0314 | 0.0199 | [-0.1345, -0.0115] | -7.04% |
| `degree_required` | -0.0524* | 0.0269 | 0.0517 | [-0.1052, 0.0004] | -5.11% |
| `degree_stem` | 0.0488** | 0.023 | 0.0339 | [0.0037, 0.094] | 5.01% |
| `skill_cloud` | 0.1167*** | 0.0329 | 0.0004 | [0.0522, 0.1812] | 12.38% |
| `skill_ml_ai` | 0.0963** | 0.043 | 0.0252 | [0.012, 0.1806] | 10.11% |
| `remote_eligible` | 0.0091 | 0.0343 | 0.7915 | [-0.0581, 0.0762] | 0.91% |
| `hourly_original` | -0.0259 | 0.0406 | 0.5236 | [-0.1055, 0.0537] | -2.56% |
| `mandate_state` | 0.0105 | 0.0308 | 0.7343 | [-0.05, 0.0709] | 1.05% |
| `region_northeast` | 0.0849*** | 0.0307 | 0.0057 | [0.0247, 0.1451] | 8.86% |
| `region_south` | 0.0787* | 0.0427 | 0.0655 | [-0.005, 0.1625] | 8.19% |
| `region_west` | 0.1284*** | 0.0389 | 0.001 | [0.0521, 0.2048] | 13.7% |
| `industry_data_center` | 0.0963 | 0.0694 | 0.1649 | [-0.0396, 0.2323] | 10.11% |
| `family_ai_ml` | 0.0747* | 0.0384 | 0.0513 | [-0.0004, 0.1499] | 7.76% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Extended model

N = 544, R² = 0.6696, adjusted R² = 0.6523, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4752*** | 0.0437 | 0.0 | [11.3896, 11.5609] | — |
| `seniority_rank` | 0.086*** | 0.0083 | 0.0 | [0.0698, 0.1022] | 8.98% |
| `yrs_exp_min` | 0.0219*** | 0.0032 | 0.0 | [0.0155, 0.0282] | 2.21% |
| `yrs_exp_stated` | -0.0664** | 0.0259 | 0.0104 | [-0.1172, -0.0156] | -6.43% |
| `degree_required` | -0.0378* | 0.0221 | 0.0875 | [-0.0812, 0.0056] | -3.71% |
| `degree_stem` | 0.0674*** | 0.0221 | 0.0023 | [0.024, 0.1108] | 6.97% |
| `skill_cloud` | 0.0921*** | 0.0314 | 0.0034 | [0.0305, 0.1538] | 9.65% |
| `skill_ml_ai` | 0.09** | 0.0434 | 0.0382 | [0.0049, 0.1751] | 9.42% |
| `remote_eligible` | 0.0095 | 0.0296 | 0.7485 | [-0.0486, 0.0676] | 0.95% |
| `hourly_original` | 0.1564*** | 0.051 | 0.0022 | [0.0564, 0.2563] | 16.93% |
| `mandate_state` | 0.0146 | 0.039 | 0.7074 | [-0.0618, 0.0911] | 1.47% |
| `region_northeast` | 0.0609** | 0.0282 | 0.0309 | [0.0056, 0.1161] | 6.28% |
| `region_south` | 0.0852* | 0.0453 | 0.06 | [-0.0036, 0.174] | 8.9% |
| `region_west` | 0.0939*** | 0.0354 | 0.0081 | [0.0245, 0.1634] | 9.85% |
| `industry_data_center` | 0.0943 | 0.059 | 0.1102 | [-0.0214, 0.2099] | 9.89% |
| `family_ai_ml` | 0.0785* | 0.0417 | 0.0596 | [-0.0032, 0.1601] | 8.16% |
| `advanced_degree_pref` | 0.0637*** | 0.0228 | 0.0052 | [0.019, 0.1084] | 6.58% |
| `soft_leadership` | 0.0523** | 0.0229 | 0.022 | [0.0075, 0.0971] | 5.37% |
| `job_level` | -0.0889*** | 0.0131 | 0.0 | [-0.1146, -0.0632] | -8.5% |
| `study_metro` | 0.0355 | 0.0355 | 0.3181 | [-0.0342, 0.1051] | 3.61% |
| `prior_internship_req` | -0.1863** | 0.0785 | 0.0176 | [-0.3402, -0.0324] | -17.0% |
| `certification_req` | -0.0281 | 0.0355 | 0.428 | [-0.0977, 0.0414] | -2.77% |
| `skill_python_r` | -0.0013 | 0.0235 | 0.955 | [-0.0474, 0.0447] | -0.13% |
| `skill_sql` | -0.0194 | 0.0262 | 0.4593 | [-0.0706, 0.0319] | -1.92% |
| `skill_viz_bi` | -0.0229 | 0.0231 | 0.322 | [-0.0683, 0.0224] | -2.27% |
| `skill_big_data` | -0.0451 | 0.0334 | 0.1769 | [-0.1105, 0.0203] | -4.41% |
| `soft_teamwork` | -0.0649*** | 0.0212 | 0.0022 | [-0.1064, -0.0233] | -6.28% |
| `soft_communication` | -0.0243 | 0.0226 | 0.2818 | [-0.0687, 0.02] | -2.4% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 539, R² = 0.292, adjusted R² = 0.2717, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.7318*** | 0.1575 | 0.0 | [9.4231, 10.0406] | — |
| `seniority_rank` | 0.0979*** | 0.0211 | 0.0 | [0.0565, 0.1392] | 10.28% |
| `yrs_exp_min` | 0.0291*** | 0.0097 | 0.0027 | [0.0101, 0.0482] | 2.96% |
| `yrs_exp_stated` | -0.1243 | 0.0817 | 0.1279 | [-0.2844, 0.0357] | -11.69% |
| `degree_required` | 0.0456 | 0.0818 | 0.5774 | [-0.1147, 0.2059] | 4.66% |
| `degree_stem` | 0.254*** | 0.0652 | 0.0001 | [0.1262, 0.3818] | 28.91% |
| `skill_cloud` | 0.0019 | 0.0744 | 0.9795 | [-0.1439, 0.1477] | 0.19% |
| `skill_ml_ai` | 0.2488** | 0.1205 | 0.0389 | [0.0127, 0.485] | 28.25% |
| `remote_eligible` | 0.0054 | 0.1149 | 0.9624 | [-0.2198, 0.2307] | 0.54% |
| `hourly_original` | 0.07 | 0.1047 | 0.5038 | [-0.1352, 0.2752] | 7.25% |
| `mandate_state` | -0.0601 | 0.0881 | 0.4951 | [-0.2329, 0.1126] | -5.84% |
| `region_northeast` | 0.0613 | 0.2435 | 0.8014 | [-0.4159, 0.5385] | 6.32% |
| `region_south` | 0.3069*** | 0.1148 | 0.0075 | [0.082, 0.5319] | 35.92% |
| `region_west` | 0.4232*** | 0.0895 | 0.0 | [0.2479, 0.5986] | 52.69% |
| `industry_data_center` | -0.4749*** | 0.1597 | 0.0029 | [-0.7879, -0.1618] | -37.8% |
| `family_ai_ml` | 0.1047 | 0.1335 | 0.433 | [-0.157, 0.3664] | 11.04% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 730, R² = 0.3356, adjusted R² = 0.3291, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6378*** | 0.0993 | 0.0 | [0.4431, 0.8325] | — |
| `mandate_state` | 0.3876*** | 0.0895 | 0.0 | [0.2123, 0.5629] | 47.34% |
| `seniority_rank` | -0.0018 | 0.0115 | 0.8726 | [-0.0244, 0.0207] | -0.18% |
| `remote_eligible` | 0.0824 | 0.0748 | 0.2709 | [-0.0643, 0.229] | 8.59% |
| `industry_data_center` | -0.0716 | 0.0973 | 0.4616 | [-0.2622, 0.119] | -6.91% |
| `region_northeast` | -0.1314 | 0.0958 | 0.1702 | [-0.3191, 0.0564] | -12.31% |
| `region_south` | -0.3279*** | 0.0993 | 0.001 | [-0.5226, -0.1332] | -27.95% |
| `region_west` | -0.0544 | 0.0739 | 0.4617 | [-0.1992, 0.0904] | -5.29% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 80, R² = 0.5104, adjusted R² = 0.405, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4565*** | 0.1118 | 0.0 | [11.2373, 11.6757] | — |
| `seniority_rank` | 0.081 | 0.0687 | 0.238 | [-0.0536, 0.2157] | 8.44% |
| `yrs_exp_min` | 0.0204 | 0.0315 | 0.5187 | [-0.0415, 0.0822] | 2.06% |
| `yrs_exp_stated` | -0.0311 | 0.0733 | 0.6711 | [-0.1747, 0.1125] | -3.06% |
| `degree_required` | -0.0834* | 0.0499 | 0.0944 | [-0.1811, 0.0143] | -8.0% |
| `degree_stem` | 0.0258 | 0.049 | 0.5986 | [-0.0703, 0.1219] | 2.61% |
| `skill_cloud` | 0.2162** | 0.1097 | 0.0488 | [0.0011, 0.4313] | 24.13% |
| `skill_ml_ai` | 0.0685 | 0.0973 | 0.4817 | [-0.1222, 0.2591] | 7.08% |
| `remote_eligible` | 0.0014 | 0.0745 | 0.9855 | [-0.1447, 0.1474] | 0.14% |
| `mandate_state` | 0.051 | 0.0542 | 0.3473 | [-0.0553, 0.1573] | 5.23% |
| `region_northeast` | -0.0952 | 0.0587 | 0.1048 | [-0.2103, 0.0198] | -9.08% |
| `region_south` | -0.1142 | 0.0839 | 0.1736 | [-0.2788, 0.0503] | -10.8% |
| `region_west` | 0.0309 | 0.0569 | 0.5877 | [-0.0807, 0.1424] | 3.13% |
| `industry_data_center` | 0.0606 | 0.0907 | 0.5041 | [-0.1172, 0.2384] | 6.25% |
| `family_ai_ml` | 0.2229** | 0.1027 | 0.0299 | [0.0217, 0.4241] | 24.97% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 499, R² = 0.5996, adjusted R² = 0.5871, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.393*** | 0.0443 | 0.0 | [11.3062, 11.4798] | — |
| `seniority_rank` | 0.1114*** | 0.0071 | 0.0 | [0.0975, 0.1252] | 11.78% |
| `yrs_exp_min` | 0.0236*** | 0.004 | 0.0 | [0.0159, 0.0313] | 2.39% |
| `yrs_exp_stated` | -0.0735** | 0.0308 | 0.017 | [-0.1339, -0.0132] | -7.09% |
| `degree_required` | -0.0421 | 0.0262 | 0.1089 | [-0.0935, 0.0094] | -4.12% |
| `degree_stem` | 0.0481** | 0.0234 | 0.0395 | [0.0023, 0.0939] | 4.93% |
| `skill_cloud` | 0.0911*** | 0.0272 | 0.0008 | [0.0377, 0.1444] | 9.54% |
| `skill_ml_ai` | 0.1078*** | 0.0331 | 0.0011 | [0.0429, 0.1727] | 11.38% |
| `remote_eligible` | 0.0062 | 0.0352 | 0.8596 | [-0.0627, 0.0751] | 0.62% |
| `hourly_original` | -0.0636* | 0.0369 | 0.0847 | [-0.1358, 0.0087] | -6.16% |
| `mandate_state` | -0.0573* | 0.0333 | 0.0855 | [-0.1227, 0.008] | -5.57% |
| `region_northeast` | 0.0115 | 0.0308 | 0.7091 | [-0.0488, 0.0718] | 1.15% |
| `region_south` | 0.0398 | 0.0394 | 0.3121 | [-0.0374, 0.117] | 4.06% |
| `region_west` | 0.0527 | 0.0354 | 0.1368 | [-0.0167, 0.1222] | 5.41% |
| `industry_data_center` | 0.078 | 0.0631 | 0.2164 | [-0.0456, 0.2016] | 8.11% |
| `family_ai_ml` | 0.0803** | 0.0345 | 0.0198 | [0.0128, 0.1479] | 8.36% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 100 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1065 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.025 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_stated` | -0.073 | 0.0199 | 0.0229 | unchanged (significant) |
| `degree_required` | -0.0524 | 0.0517 | 0.07 | unchanged (null) |
| `degree_stem` | 0.0488 | 0.0339 | 0.0462 | unchanged (significant) |
| `skill_cloud` | 0.1167 | 0.0004 | 0.0008 | unchanged (significant) |
| `skill_ml_ai` | 0.0963 | 0.0252 | 0.0607 | **no longer significant** |
| `remote_eligible` | 0.0091 | 0.7915 | 0.8048 | unchanged (null) |
| `hourly_original` | -0.0259 | 0.5236 | 0.6391 | unchanged (null) |
| `mandate_state` | 0.0105 | 0.7343 | 0.7483 | unchanged (null) |
| `region_northeast` | 0.0849 | 0.0057 | 0.0188 | unchanged (significant) |
| `region_south` | 0.0787 | 0.0655 | 0.1574 | unchanged (null) |
| `region_west` | 0.1284 | 0.001 | 0.0102 | unchanged (significant) |
| `industry_data_center` | 0.0963 | 0.1649 | 0.5927 | unchanged (null) |
| `family_ai_ml` | 0.0747 | 0.0513 | 0.0875 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `skill_ml_ai`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.745** (544 disclosed, 186 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.408 | 3.419 | -0.011 | 0.9295 |
| `yrs_exp_min` | 2.312 | 2.344 | -0.032 | 0.9022 |
| `yrs_exp_stated` | 0.476 | 0.575 | -0.099 | 0.0194 |
| `degree_required` | 0.605 | 0.522 | 0.083 | 0.0499 |
| `degree_stem` | 0.406 | 0.366 | 0.041 | 0.3245 |
| `skill_cloud` | 0.21 | 0.108 | 0.102 | 0.0004 |
| `skill_ml_ai` | 0.36 | 0.274 | 0.086 | 0.0269 |
| `remote_eligible` | 0.167 | 0.113 | 0.054 | 0.055 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.756 | 0.21 | 0.546 | 0.0 |
| `region_northeast` | 0.217 | 0.145 | 0.072 | 0.0227 |
| `region_south` | 0.143 | 0.581 | -0.437 | 0.0 |
| `region_west` | 0.403 | 0.081 | 0.322 | 0.0 |
| `industry_data_center` | 0.14 | 0.183 | -0.043 | 0.1802 |
| `family_ai_ml` | 0.101 | 0.086 | 0.015 | 0.5359 |
| `metro_indianapolis` | 0.006 | 0.043 | -0.037 | 0.0148 |


# Results

- Postings in scope: **707**
- With disclosed pay: **531**
- Used in estimation: **531**
- Distinct employers in the estimation sample (**the cluster count**): **99**
- Distinct employers across all postings in scope: **136**

Regressor budget at 20 observations each: **26** (specification used: **extended**).

Minimum detectable standardized effect: **0.1235** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 531, R² = 0.5918, adjusted R² = 0.5799, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.342*** | 0.0441 | 0.0 | [11.2555, 11.4284] | — |
| `seniority_rank` | 0.1049*** | 0.0079 | 0.0 | [0.0893, 0.1204] | 11.06% |
| `yrs_exp_min` | 0.0259*** | 0.0043 | 0.0 | [0.0175, 0.0343] | 2.62% |
| `yrs_exp_stated` | -0.0731** | 0.0312 | 0.0191 | [-0.1342, -0.0119] | -7.05% |
| `degree_required` | -0.0562** | 0.027 | 0.0373 | [-0.1091, -0.0033] | -5.46% |
| `degree_stem` | 0.0502** | 0.0225 | 0.026 | [0.006, 0.0943] | 5.14% |
| `skill_cloud` | 0.1123*** | 0.0321 | 0.0005 | [0.0494, 0.1752] | 11.88% |
| `skill_ml_ai` | 0.0926** | 0.0438 | 0.0346 | [0.0067, 0.1785] | 9.7% |
| `remote_eligible` | 0.0128 | 0.0346 | 0.7113 | [-0.055, 0.0806] | 1.29% |
| `hourly_original` | -0.0239 | 0.0389 | 0.5383 | [-0.1002, 0.0523] | -2.36% |
| `mandate_state` | 0.0096 | 0.0312 | 0.7584 | [-0.0516, 0.0708] | 0.96% |
| `region_northeast` | 0.0877*** | 0.03 | 0.0034 | [0.0289, 0.1464] | 9.16% |
| `region_south` | 0.0713 | 0.045 | 0.1131 | [-0.0169, 0.1596] | 7.39% |
| `region_west` | 0.1252*** | 0.0376 | 0.0009 | [0.0515, 0.1989] | 13.34% |
| `industry_data_center` | 0.1026 | 0.0691 | 0.1374 | [-0.0328, 0.2381] | 10.81% |
| `family_ai_ml` | 0.0838** | 0.0376 | 0.026 | [0.01, 0.1575] | 8.74% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Extended model

N = 531, R² = 0.668, adjusted R² = 0.6509, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4741*** | 0.0439 | 0.0 | [11.3881, 11.5601] | — |
| `seniority_rank` | 0.0842*** | 0.0081 | 0.0 | [0.0683, 0.1001] | 8.79% |
| `yrs_exp_min` | 0.023*** | 0.0032 | 0.0 | [0.0168, 0.0292] | 2.33% |
| `yrs_exp_stated` | -0.0663*** | 0.0256 | 0.0096 | [-0.1164, -0.0161] | -6.41% |
| `degree_required` | -0.0429* | 0.0226 | 0.0579 | [-0.0872, 0.0014] | -4.2% |
| `degree_stem` | 0.0719*** | 0.0217 | 0.0009 | [0.0294, 0.1144] | 7.45% |
| `skill_cloud` | 0.0904*** | 0.032 | 0.0047 | [0.0277, 0.1531] | 9.46% |
| `skill_ml_ai` | 0.0869* | 0.0451 | 0.0542 | [-0.0016, 0.1754] | 9.08% |
| `remote_eligible` | 0.013 | 0.0313 | 0.6766 | [-0.0482, 0.0743] | 1.31% |
| `hourly_original` | 0.1527*** | 0.0508 | 0.0026 | [0.0532, 0.2522] | 16.5% |
| `mandate_state` | 0.0178 | 0.0402 | 0.6589 | [-0.0611, 0.0966] | 1.79% |
| `region_northeast` | 0.062** | 0.0285 | 0.0297 | [0.0061, 0.1179] | 6.4% |
| `region_south` | 0.0823* | 0.0477 | 0.0845 | [-0.0112, 0.1758] | 8.58% |
| `region_west` | 0.092*** | 0.0355 | 0.0095 | [0.0225, 0.1615] | 9.64% |
| `industry_data_center` | 0.0937 | 0.0602 | 0.1196 | [-0.0243, 0.2116] | 9.82% |
| `family_ai_ml` | 0.0914** | 0.0395 | 0.0208 | [0.0139, 0.1689] | 9.57% |
| `advanced_degree_pref` | 0.0629*** | 0.0231 | 0.0065 | [0.0176, 0.1082] | 6.49% |
| `soft_leadership` | 0.0539** | 0.0227 | 0.0177 | [0.0094, 0.0984] | 5.54% |
| `job_level` | -0.0885*** | 0.0129 | 0.0 | [-0.1138, -0.0632] | -8.47% |
| `study_metro` | 0.0303 | 0.0355 | 0.3932 | [-0.0393, 0.0999] | 3.08% |
| `prior_internship_req` | -0.1984*** | 0.0768 | 0.0097 | [-0.3488, -0.0479] | -17.99% |
| `certification_req` | -0.0264 | 0.0369 | 0.4747 | [-0.0987, 0.046] | -2.6% |
| `skill_python_r` | -0.0058 | 0.0231 | 0.8026 | [-0.051, 0.0395] | -0.58% |
| `skill_sql` | -0.019 | 0.0262 | 0.4691 | [-0.0704, 0.0324] | -1.88% |
| `skill_viz_bi` | -0.0205 | 0.0231 | 0.3756 | [-0.0658, 0.0248] | -2.03% |
| `skill_big_data` | -0.0471 | 0.0326 | 0.1484 | [-0.1109, 0.0168] | -4.6% |
| `soft_teamwork` | -0.067*** | 0.0214 | 0.0018 | [-0.109, -0.025] | -6.48% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 526, R² = 0.2841, adjusted R² = 0.2631, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.7695*** | 0.1499 | 0.0 | [9.4757, 10.0633] | — |
| `seniority_rank` | 0.0959*** | 0.0213 | 0.0 | [0.054, 0.1377] | 10.06% |
| `yrs_exp_min` | 0.0286*** | 0.0098 | 0.0034 | [0.0095, 0.0477] | 2.9% |
| `yrs_exp_stated` | -0.1289 | 0.0809 | 0.1112 | [-0.2874, 0.0297] | -12.09% |
| `degree_required` | 0.0362 | 0.0825 | 0.6606 | [-0.1255, 0.198] | 3.69% |
| `degree_stem` | 0.2401*** | 0.0639 | 0.0002 | [0.1149, 0.3653] | 27.14% |
| `skill_cloud` | 0.0049 | 0.0728 | 0.9465 | [-0.1377, 0.1475] | 0.49% |
| `skill_ml_ai` | 0.2346* | 0.1217 | 0.0539 | [-0.0039, 0.4731] | 26.44% |
| `remote_eligible` | 0.0158 | 0.11 | 0.8855 | [-0.1998, 0.2315] | 1.6% |
| `hourly_original` | 0.0601 | 0.1045 | 0.5656 | [-0.1448, 0.2649] | 6.19% |
| `mandate_state` | -0.0718 | 0.0868 | 0.4085 | [-0.242, 0.0984] | -6.93% |
| `region_northeast` | 0.0629 | 0.2405 | 0.7936 | [-0.4084, 0.5343] | 6.49% |
| `region_south` | 0.2854** | 0.1164 | 0.0142 | [0.0572, 0.5136] | 33.03% |
| `region_west` | 0.4275*** | 0.0878 | 0.0 | [0.2554, 0.5996] | 53.34% |
| `industry_data_center` | -0.4569*** | 0.1609 | 0.0045 | [-0.7723, -0.1415] | -36.68% |
| `family_ai_ml` | 0.1018 | 0.1303 | 0.4344 | [-0.1535, 0.3572] | 10.72% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 707, R² = 0.3459, adjusted R² = 0.3394, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6527*** | 0.0983 | 0.0 | [0.46, 0.8454] | — |
| `mandate_state` | 0.3838*** | 0.0897 | 0.0 | [0.2079, 0.5597] | 46.78% |
| `seniority_rank` | -0.0052 | 0.0115 | 0.6514 | [-0.0276, 0.0173] | -0.52% |
| `remote_eligible` | 0.0852 | 0.0752 | 0.2573 | [-0.0622, 0.2326] | 8.89% |
| `industry_data_center` | -0.0751 | 0.0948 | 0.4281 | [-0.2609, 0.1107] | -7.24% |
| `region_northeast` | -0.1244 | 0.0921 | 0.1767 | [-0.3048, 0.0561] | -11.7% |
| `region_south` | -0.3254*** | 0.1013 | 0.0013 | [-0.524, -0.1269] | -27.78% |
| `region_west` | -0.0457 | 0.0724 | 0.5283 | [-0.1875, 0.0962] | -4.46% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 79, R² = 0.5092, adjusted R² = 0.4019, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4574*** | 0.1174 | 0.0 | [11.2273, 11.6874] | — |
| `seniority_rank` | 0.0822 | 0.0663 | 0.215 | [-0.0477, 0.2121] | 8.57% |
| `yrs_exp_min` | 0.0213 | 0.0313 | 0.4962 | [-0.0401, 0.0827] | 2.16% |
| `yrs_exp_stated` | -0.036 | 0.0739 | 0.6266 | [-0.1808, 0.1089] | -3.53% |
| `degree_required` | -0.0803 | 0.0506 | 0.1125 | [-0.1795, 0.0189] | -7.72% |
| `degree_stem` | 0.029 | 0.0529 | 0.5836 | [-0.0746, 0.1326] | 2.94% |
| `skill_cloud` | 0.2114* | 0.1116 | 0.0581 | [-0.0073, 0.4301] | 23.54% |
| `skill_ml_ai` | 0.0714 | 0.0984 | 0.4683 | [-0.1215, 0.2643] | 7.4% |
| `remote_eligible` | -0.0003 | 0.075 | 0.9971 | [-0.1473, 0.1468] | -0.03% |
| `mandate_state` | 0.0506 | 0.0617 | 0.4124 | [-0.0703, 0.1714] | 5.19% |
| `region_northeast` | -0.0974* | 0.0587 | 0.0968 | [-0.2124, 0.0176] | -9.28% |
| `region_south` | -0.1141 | 0.0843 | 0.1759 | [-0.2793, 0.0511] | -10.78% |
| `region_west` | 0.0279 | 0.0548 | 0.6112 | [-0.0796, 0.1353] | 2.83% |
| `industry_data_center` | 0.0583 | 0.0909 | 0.521 | [-0.1198, 0.2364] | 6.01% |
| `family_ai_ml` | 0.2211** | 0.105 | 0.0352 | [0.0153, 0.4269] | 24.75% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 487, R² = 0.6015, adjusted R² = 0.5888, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3998*** | 0.0447 | 0.0 | [11.3121, 11.4874] | — |
| `seniority_rank` | 0.1105*** | 0.0073 | 0.0 | [0.0963, 0.1248] | 11.69% |
| `yrs_exp_min` | 0.0244*** | 0.0041 | 0.0 | [0.0164, 0.0323] | 2.47% |
| `yrs_exp_stated` | -0.0715** | 0.031 | 0.0212 | [-0.1324, -0.0107] | -6.9% |
| `degree_required` | -0.0467* | 0.0262 | 0.0742 | [-0.098, 0.0046] | -4.56% |
| `degree_stem` | 0.0519** | 0.0231 | 0.0246 | [0.0066, 0.0971] | 5.32% |
| `skill_cloud` | 0.0867*** | 0.0263 | 0.001 | [0.0351, 0.1382] | 9.05% |
| `skill_ml_ai` | 0.1049*** | 0.0351 | 0.0028 | [0.0361, 0.1737] | 11.06% |
| `remote_eligible` | 0.0107 | 0.0342 | 0.7546 | [-0.0564, 0.0778] | 1.08% |
| `hourly_original` | -0.0588* | 0.0347 | 0.0902 | [-0.1268, 0.0092] | -5.71% |
| `mandate_state` | -0.059* | 0.0331 | 0.075 | [-0.124, 0.0059] | -5.73% |
| `region_northeast` | 0.0135 | 0.0306 | 0.6589 | [-0.0465, 0.0735] | 1.36% |
| `region_south` | 0.0316 | 0.0428 | 0.4596 | [-0.0522, 0.1155] | 3.21% |
| `region_west` | 0.0473 | 0.0338 | 0.1618 | [-0.019, 0.1137] | 4.85% |
| `industry_data_center` | 0.0829 | 0.0629 | 0.1873 | [-0.0403, 0.2061] | 8.64% |
| `family_ai_ml` | 0.0888*** | 0.0336 | 0.0082 | [0.0229, 0.1547] | 9.29% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 99 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1049 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0259 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_stated` | -0.0731 | 0.0191 | 0.0235 | unchanged (significant) |
| `degree_required` | -0.0562 | 0.0373 | 0.0531 | **no longer significant** |
| `degree_stem` | 0.0502 | 0.026 | 0.0352 | unchanged (significant) |
| `skill_cloud` | 0.1123 | 0.0005 | 0.0011 | unchanged (significant) |
| `skill_ml_ai` | 0.0926 | 0.0346 | 0.0666 | **no longer significant** |
| `remote_eligible` | 0.0128 | 0.7113 | 0.7245 | unchanged (null) |
| `hourly_original` | -0.0239 | 0.5383 | 0.6469 | unchanged (null) |
| `mandate_state` | 0.0096 | 0.7584 | 0.7763 | unchanged (null) |
| `region_northeast` | 0.0877 | 0.0034 | 0.0111 | unchanged (significant) |
| `region_south` | 0.0713 | 0.1131 | 0.218 | unchanged (null) |
| `region_west` | 0.1252 | 0.0009 | 0.0127 | unchanged (significant) |
| `industry_data_center` | 0.1026 | 0.1374 | 0.596 | unchanged (null) |
| `family_ai_ml` | 0.0838 | 0.026 | 0.0538 | **no longer significant** |

Conclusions that change once clustering is bootstrapped: `degree_required`, `skill_ml_ai`, `family_ai_ml`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.751** (531 disclosed, 176 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.388 | 3.438 | -0.05 | 0.7037 |
| `yrs_exp_min` | 2.324 | 2.25 | 0.074 | 0.7723 |
| `yrs_exp_stated` | 0.48 | 0.562 | -0.082 | 0.0585 |
| `degree_required` | 0.61 | 0.523 | 0.087 | 0.0443 |
| `degree_stem` | 0.411 | 0.364 | 0.047 | 0.2669 |
| `skill_cloud` | 0.215 | 0.097 | 0.118 | 0.0 |
| `skill_ml_ai` | 0.363 | 0.25 | 0.113 | 0.0037 |
| `remote_eligible` | 0.168 | 0.114 | 0.054 | 0.0632 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.753 | 0.193 | 0.56 | 0.0 |
| `region_northeast` | 0.217 | 0.142 | 0.075 | 0.02 |
| `region_south` | 0.139 | 0.591 | -0.452 | 0.0 |
| `region_west` | 0.407 | 0.074 | 0.333 | 0.0 |
| `industry_data_center` | 0.139 | 0.188 | -0.048 | 0.1472 |
| `family_ai_ml` | 0.102 | 0.068 | 0.034 | 0.1484 |
| `metro_indianapolis` | 0.006 | 0.045 | -0.04 | 0.0142 |


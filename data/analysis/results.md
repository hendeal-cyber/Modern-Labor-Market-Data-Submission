# Results

- Postings in scope: **720**
- With disclosed pay: **536**
- Used in estimation: **536**
- Distinct employers in the estimation sample (**the cluster count**): **99**
- Distinct employers across all postings in scope: **137**

Regressor budget at 20 observations each: **26** (specification used: **extended**).

Minimum detectable standardized effect: **0.1229** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 536, R² = 0.5929, adjusted R² = 0.5812, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3411*** | 0.0435 | 0.0 | [11.256, 11.4263] | — |
| `seniority_rank` | 0.1045*** | 0.0079 | 0.0 | [0.089, 0.12] | 11.02% |
| `yrs_exp_min` | 0.026*** | 0.0043 | 0.0 | [0.0175, 0.0344] | 2.63% |
| `yrs_exp_stated` | -0.0729** | 0.0311 | 0.0189 | [-0.1338, -0.012] | -7.03% |
| `degree_required` | -0.056** | 0.0271 | 0.039 | [-0.1092, -0.0028] | -5.45% |
| `degree_stem` | 0.0508** | 0.0224 | 0.0235 | [0.0068, 0.0947] | 5.21% |
| `skill_cloud` | 0.1133*** | 0.0324 | 0.0005 | [0.0497, 0.1769] | 12.0% |
| `skill_ml_ai` | 0.0919** | 0.0439 | 0.0362 | [0.0059, 0.1778] | 9.62% |
| `remote_eligible` | 0.0141 | 0.0341 | 0.6788 | [-0.0527, 0.0809] | 1.42% |
| `hourly_original` | -0.0239 | 0.0386 | 0.5356 | [-0.0996, 0.0517] | -2.36% |
| `mandate_state` | 0.009 | 0.031 | 0.7708 | [-0.0517, 0.0697] | 0.91% |
| `region_northeast` | 0.0869*** | 0.0305 | 0.0044 | [0.027, 0.1468] | 9.08% |
| `region_south` | 0.0743* | 0.0439 | 0.0906 | [-0.0117, 0.1603] | 7.71% |
| `region_west` | 0.1268*** | 0.0381 | 0.0009 | [0.052, 0.2016] | 13.52% |
| `industry_data_center` | 0.1009 | 0.069 | 0.144 | [-0.0344, 0.2362] | 10.61% |
| `family_ai_ml` | 0.0847** | 0.0377 | 0.0245 | [0.0109, 0.1585] | 8.84% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Extended model

N = 536, R² = 0.6694, adjusted R² = 0.6525, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4753*** | 0.043 | 0.0 | [11.3911, 11.5596] | — |
| `seniority_rank` | 0.0838*** | 0.0081 | 0.0 | [0.0679, 0.0997] | 8.74% |
| `yrs_exp_min` | 0.0231*** | 0.0032 | 0.0 | [0.0168, 0.0294] | 2.34% |
| `yrs_exp_stated` | -0.0672*** | 0.0257 | 0.009 | [-0.1176, -0.0168] | -6.5% |
| `degree_required` | -0.0433* | 0.0226 | 0.0558 | [-0.0876, 0.0011] | -4.24% |
| `degree_stem` | 0.0704*** | 0.0212 | 0.0009 | [0.0288, 0.112] | 7.29% |
| `skill_cloud` | 0.092*** | 0.0323 | 0.0044 | [0.0287, 0.1554] | 9.64% |
| `skill_ml_ai` | 0.0851* | 0.0453 | 0.0605 | [-0.0037, 0.1739] | 8.88% |
| `remote_eligible` | 0.0144 | 0.0306 | 0.6391 | [-0.0456, 0.0743] | 1.45% |
| `hourly_original` | 0.1539*** | 0.0508 | 0.0025 | [0.0543, 0.2536] | 16.64% |
| `mandate_state` | 0.013 | 0.0394 | 0.7423 | [-0.0643, 0.0902] | 1.3% |
| `region_northeast` | 0.0658** | 0.0292 | 0.0241 | [0.0086, 0.123] | 6.8% |
| `region_south` | 0.0862* | 0.047 | 0.0663 | [-0.0058, 0.1782] | 9.0% |
| `region_west` | 0.0958*** | 0.036 | 0.0077 | [0.0254, 0.1663] | 10.06% |
| `industry_data_center` | 0.0936 | 0.06 | 0.1184 | [-0.0239, 0.2112] | 9.82% |
| `family_ai_ml` | 0.0924** | 0.0397 | 0.0199 | [0.0146, 0.1703] | 9.68% |
| `advanced_degree_pref` | 0.0633*** | 0.023 | 0.0059 | [0.0183, 0.1083] | 6.53% |
| `soft_leadership` | 0.0531** | 0.0226 | 0.0186 | [0.0089, 0.0973] | 5.45% |
| `job_level` | -0.0886*** | 0.0126 | 0.0 | [-0.1133, -0.0638] | -8.47% |
| `study_metro` | 0.0324 | 0.0356 | 0.3638 | [-0.0375, 0.1022] | 3.29% |
| `prior_internship_req` | -0.1979*** | 0.0766 | 0.0098 | [-0.3481, -0.0477] | -17.96% |
| `certification_req` | -0.0273 | 0.0365 | 0.454 | [-0.0989, 0.0442] | -2.7% |
| `skill_python_r` | -0.0048 | 0.023 | 0.8336 | [-0.0499, 0.0402] | -0.48% |
| `skill_sql` | -0.0182 | 0.0262 | 0.487 | [-0.0697, 0.0332] | -1.81% |
| `skill_viz_bi` | -0.0213 | 0.0231 | 0.3567 | [-0.0665, 0.024] | -2.1% |
| `skill_big_data` | -0.0474 | 0.0326 | 0.1457 | [-0.1112, 0.0165] | -4.63% |
| `soft_teamwork` | -0.0669*** | 0.0214 | 0.0018 | [-0.1089, -0.025] | -6.47% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 531, R² = 0.2859, adjusted R² = 0.2651, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.774*** | 0.1544 | 0.0 | [9.4714, 10.0766] | — |
| `seniority_rank` | 0.0929*** | 0.0216 | 0.0 | [0.0507, 0.1352] | 9.74% |
| `yrs_exp_min` | 0.0295*** | 0.0098 | 0.0025 | [0.0104, 0.0487] | 3.0% |
| `yrs_exp_stated` | -0.1322 | 0.0808 | 0.1019 | [-0.2905, 0.0262] | -12.38% |
| `degree_required` | 0.0374 | 0.0837 | 0.6546 | [-0.1266, 0.2015] | 3.81% |
| `degree_stem` | 0.2467*** | 0.0647 | 0.0001 | [0.1199, 0.3735] | 27.98% |
| `skill_cloud` | 0.0071 | 0.0738 | 0.9231 | [-0.1376, 0.1519] | 0.72% |
| `skill_ml_ai` | 0.2368* | 0.1217 | 0.0517 | [-0.0017, 0.4753] | 26.72% |
| `remote_eligible` | 0.0188 | 0.1101 | 0.8643 | [-0.197, 0.2346] | 1.9% |
| `hourly_original` | 0.0601 | 0.1039 | 0.5629 | [-0.1436, 0.2638] | 6.2% |
| `mandate_state` | -0.0718 | 0.0873 | 0.4103 | [-0.2429, 0.0992] | -6.93% |
| `region_northeast` | 0.0517 | 0.2445 | 0.8326 | [-0.4276, 0.5309] | 5.3% |
| `region_south` | 0.2957** | 0.1153 | 0.0103 | [0.0697, 0.5217] | 34.41% |
| `region_west` | 0.4243*** | 0.0877 | 0.0 | [0.2524, 0.5962] | 52.86% |
| `industry_data_center` | -0.4708*** | 0.1632 | 0.0039 | [-0.7906, -0.1511] | -37.55% |
| `family_ai_ml` | 0.1032 | 0.1313 | 0.432 | [-0.1542, 0.3605] | 10.87% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 720, R² = 0.3352, adjusted R² = 0.3287, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6529*** | 0.0983 | 0.0 | [0.4603, 0.8455] | — |
| `mandate_state` | 0.3803*** | 0.0897 | 0.0 | [0.2046, 0.5561] | 46.28% |
| `seniority_rank` | -0.0035 | 0.0117 | 0.7685 | [-0.0264, 0.0195] | -0.34% |
| `remote_eligible` | 0.0758 | 0.0745 | 0.3089 | [-0.0702, 0.2218] | 7.88% |
| `industry_data_center` | -0.0652 | 0.0947 | 0.4909 | [-0.2508, 0.1204] | -6.31% |
| `region_northeast` | -0.1353 | 0.0953 | 0.1554 | [-0.3221, 0.0514] | -12.66% |
| `region_south` | -0.3392*** | 0.0996 | 0.0007 | [-0.5344, -0.144] | -28.77% |
| `region_west` | -0.0588 | 0.0726 | 0.4183 | [-0.2011, 0.0836] | -5.71% |

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

N = 492, R² = 0.602, adjusted R² = 0.5895, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4008*** | 0.0439 | 0.0 | [11.3146, 11.4869] | — |
| `seniority_rank` | 0.1094*** | 0.0072 | 0.0 | [0.0953, 0.1235] | 11.56% |
| `yrs_exp_min` | 0.0246*** | 0.004 | 0.0 | [0.0167, 0.0325] | 2.49% |
| `yrs_exp_stated` | -0.0725** | 0.0306 | 0.0177 | [-0.1324, -0.0126] | -6.99% |
| `degree_required` | -0.0454* | 0.0266 | 0.0872 | [-0.0975, 0.0066] | -4.44% |
| `degree_stem` | 0.0505** | 0.0228 | 0.0268 | [0.0058, 0.0953] | 5.18% |
| `skill_cloud` | 0.0878*** | 0.0264 | 0.0009 | [0.0361, 0.1396] | 9.18% |
| `skill_ml_ai` | 0.1051*** | 0.0343 | 0.0022 | [0.0379, 0.1724] | 11.09% |
| `remote_eligible` | 0.012 | 0.0343 | 0.7272 | [-0.0552, 0.0791] | 1.2% |
| `hourly_original` | -0.0605* | 0.0347 | 0.0817 | [-0.1285, 0.0076] | -5.87% |
| `mandate_state` | -0.0597* | 0.0335 | 0.0752 | [-0.1254, 0.0061] | -5.79% |
| `region_northeast` | 0.0132 | 0.0308 | 0.6694 | [-0.0473, 0.0736] | 1.33% |
| `region_south` | 0.0339 | 0.041 | 0.4084 | [-0.0465, 0.1144] | 3.45% |
| `region_west` | 0.0503 | 0.0344 | 0.1441 | [-0.0172, 0.1178] | 5.16% |
| `industry_data_center` | 0.0815 | 0.0625 | 0.1926 | [-0.0411, 0.2041] | 8.49% |
| `family_ai_ml` | 0.0901*** | 0.0335 | 0.0071 | [0.0245, 0.1557] | 9.43% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 99 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1045 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.026 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_stated` | -0.0729 | 0.0189 | 0.0241 | unchanged (significant) |
| `degree_required` | -0.056 | 0.039 | 0.0572 | **no longer significant** |
| `degree_stem` | 0.0508 | 0.0235 | 0.0314 | unchanged (significant) |
| `skill_cloud` | 0.1133 | 0.0005 | 0.0012 | unchanged (significant) |
| `skill_ml_ai` | 0.0919 | 0.0362 | 0.0717 | **no longer significant** |
| `remote_eligible` | 0.0141 | 0.6788 | 0.6934 | unchanged (null) |
| `hourly_original` | -0.0239 | 0.5356 | 0.6475 | unchanged (null) |
| `mandate_state` | 0.009 | 0.7708 | 0.7848 | unchanged (null) |
| `region_northeast` | 0.0869 | 0.0044 | 0.0136 | unchanged (significant) |
| `region_south` | 0.0743 | 0.0906 | 0.1942 | unchanged (null) |
| `region_west` | 0.1268 | 0.0009 | 0.0111 | unchanged (significant) |
| `industry_data_center` | 0.1009 | 0.144 | 0.5993 | unchanged (null) |
| `family_ai_ml` | 0.0847 | 0.0245 | 0.0512 | **no longer significant** |

Conclusions that change once clustering is bootstrapped: `degree_required`, `skill_ml_ai`, `family_ai_ml`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.744** (536 disclosed, 184 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.392 | 3.429 | -0.038 | 0.7697 |
| `yrs_exp_min` | 2.319 | 2.348 | -0.029 | 0.9116 |
| `yrs_exp_stated` | 0.479 | 0.571 | -0.091 | 0.0326 |
| `degree_required` | 0.61 | 0.522 | 0.088 | 0.0386 |
| `degree_stem` | 0.41 | 0.364 | 0.046 | 0.2646 |
| `skill_cloud` | 0.213 | 0.109 | 0.104 | 0.0004 |
| `skill_ml_ai` | 0.362 | 0.272 | 0.09 | 0.021 |
| `remote_eligible` | 0.166 | 0.114 | 0.052 | 0.0692 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.754 | 0.212 | 0.542 | 0.0 |
| `region_northeast` | 0.218 | 0.147 | 0.072 | 0.0245 |
| `region_south` | 0.142 | 0.587 | -0.445 | 0.0 |
| `region_west` | 0.401 | 0.082 | 0.32 | 0.0 |
| `industry_data_center` | 0.14 | 0.179 | -0.039 | 0.2201 |
| `family_ai_ml` | 0.101 | 0.087 | 0.014 | 0.5748 |
| `metro_indianapolis` | 0.006 | 0.043 | -0.038 | 0.0149 |


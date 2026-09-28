# Results

- Postings in scope: **624**
- With disclosed pay: **470**
- Used in estimation: **470**
- Distinct employers in the estimation sample (**the cluster count**): **85**
- Distinct employers across all postings in scope: **115**

Regressor budget at 20 observations each: **23** (specification used: **extended**).

Minimum detectable standardized effect: **0.1315** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 470, R² = 0.6136, adjusted R² = 0.6008, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3255*** | 0.0383 | 0.0 | [11.2504, 11.4005] | — |
| `seniority_rank` | 0.1039*** | 0.0079 | 0.0 | [0.0884, 0.1194] | 10.95% |
| `yrs_exp_min` | 0.0241*** | 0.0043 | 0.0 | [0.0155, 0.0326] | 2.44% |
| `yrs_exp_stated` | -0.0674** | 0.0322 | 0.0361 | [-0.1304, -0.0044] | -6.52% |
| `degree_required` | -0.0389 | 0.0262 | 0.137 | [-0.0903, 0.0124] | -3.82% |
| `degree_stem` | 0.05** | 0.0219 | 0.0227 | [0.007, 0.093] | 5.13% |
| `skill_cloud` | 0.1189*** | 0.0375 | 0.0015 | [0.0454, 0.1925] | 12.63% |
| `skill_ml_ai` | 0.1029** | 0.0466 | 0.0273 | [0.0116, 0.1943] | 10.84% |
| `remote_eligible` | -0.0182 | 0.0359 | 0.6121 | [-0.0884, 0.0521] | -1.8% |
| `hourly_original` | -0.1496** | 0.0618 | 0.0155 | [-0.2707, -0.0285] | -13.89% |
| `mandate_state` | 0.0038 | 0.0311 | 0.9036 | [-0.0572, 0.0648] | 0.38% |
| `region_northeast` | 0.0922*** | 0.0263 | 0.0005 | [0.0406, 0.1437] | 9.66% |
| `region_south` | 0.0761* | 0.0453 | 0.0927 | [-0.0126, 0.1649] | 7.91% |
| `region_west` | 0.1434*** | 0.0455 | 0.0016 | [0.0543, 0.2326] | 15.42% |
| `industry_data_center` | 0.1016 | 0.07 | 0.147 | [-0.0357, 0.2388] | 10.69% |
| `family_ai_ml` | 0.0775** | 0.0392 | 0.0481 | [0.0006, 0.1544] | 8.06% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Extended model

N = 470, R² = 0.6733, adjusted R² = 0.6564, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4171*** | 0.0439 | 0.0 | [11.3311, 11.5032] | — |
| `seniority_rank` | 0.0838*** | 0.0086 | 0.0 | [0.0671, 0.1006] | 8.74% |
| `yrs_exp_min` | 0.0226*** | 0.0037 | 0.0 | [0.0153, 0.0299] | 2.29% |
| `yrs_exp_stated` | -0.0711** | 0.0291 | 0.0144 | [-0.1281, -0.0141] | -6.86% |
| `degree_required` | -0.0327 | 0.0231 | 0.1565 | [-0.0779, 0.0125] | -3.22% |
| `degree_stem` | 0.0714*** | 0.0221 | 0.0013 | [0.028, 0.1148] | 7.4% |
| `skill_cloud` | 0.0868** | 0.0392 | 0.0269 | [0.0099, 0.1637] | 9.07% |
| `skill_ml_ai` | 0.0869* | 0.0483 | 0.0723 | [-0.0079, 0.1816] | 9.08% |
| `remote_eligible` | -0.0143 | 0.0365 | 0.6946 | [-0.0858, 0.0572] | -1.42% |
| `hourly_original` | -0.1286 | 0.1224 | 0.2936 | [-0.3685, 0.1114] | -12.06% |
| `mandate_state` | -0.0042 | 0.0403 | 0.9161 | [-0.0832, 0.0747] | -0.42% |
| `region_northeast` | 0.0563** | 0.0277 | 0.0424 | [0.0019, 0.1107] | 5.79% |
| `region_south` | 0.0844* | 0.0475 | 0.076 | [-0.0088, 0.1775] | 8.8% |
| `region_west` | 0.1224*** | 0.0433 | 0.0047 | [0.0376, 0.2072] | 13.02% |
| `industry_data_center` | 0.0917 | 0.0647 | 0.1563 | [-0.0351, 0.2186] | 9.61% |
| `family_ai_ml` | 0.0748* | 0.0422 | 0.0766 | [-0.008, 0.1575] | 7.76% |
| `advanced_degree_pref` | 0.063*** | 0.0219 | 0.004 | [0.0201, 0.1059] | 6.5% |
| `soft_leadership` | 0.0563*** | 0.021 | 0.0074 | [0.0151, 0.0974] | 5.79% |
| `job_level` | -0.0801*** | 0.0153 | 0.0 | [-0.1101, -0.05] | -7.69% |
| `study_metro` | 0.036 | 0.0357 | 0.3129 | [-0.034, 0.106] | 3.67% |
| `prior_internship_req` | -0.1675** | 0.077 | 0.0296 | [-0.3184, -0.0166] | -15.42% |
| `certification_req` | -0.0422 | 0.0409 | 0.3025 | [-0.1223, 0.038] | -4.13% |
| `skill_python_r` | 0.0099 | 0.0265 | 0.7081 | [-0.042, 0.0618] | 1.0% |
| `skill_sql` | -0.045 | 0.0304 | 0.1387 | [-0.1045, 0.0146] | -4.4% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 465, R² = 0.3036, adjusted R² = 0.2804, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.7315*** | 0.1573 | 0.0 | [9.4231, 10.0399] | — |
| `seniority_rank` | 0.0898*** | 0.0225 | 0.0001 | [0.0457, 0.1339] | 9.39% |
| `yrs_exp_min` | 0.0216** | 0.011 | 0.0481 | [0.0002, 0.0431] | 2.19% |
| `yrs_exp_stated` | -0.0596 | 0.0857 | 0.4868 | [-0.2275, 0.1083] | -5.78% |
| `degree_required` | 0.0763 | 0.0813 | 0.3478 | [-0.083, 0.2356] | 7.93% |
| `degree_stem` | 0.2423*** | 0.061 | 0.0001 | [0.1227, 0.3619] | 27.41% |
| `skill_cloud` | 0.0163 | 0.0738 | 0.8256 | [-0.1285, 0.161] | 1.64% |
| `skill_ml_ai` | 0.2455* | 0.1328 | 0.0644 | [-0.0147, 0.5057] | 27.83% |
| `remote_eligible` | 0.0228 | 0.1208 | 0.8499 | [-0.2138, 0.2595] | 2.31% |
| `hourly_original` | 0.1174 | 0.0989 | 0.2354 | [-0.0765, 0.3112] | 12.45% |
| `mandate_state` | -0.0763 | 0.0901 | 0.3973 | [-0.2528, 0.1003] | -7.34% |
| `region_northeast` | 0.0412 | 0.2359 | 0.8613 | [-0.4212, 0.5036] | 4.21% |
| `region_south` | 0.2818** | 0.1193 | 0.0182 | [0.048, 0.5157] | 32.56% |
| `region_west` | 0.4821*** | 0.0977 | 0.0 | [0.2905, 0.6737] | 61.95% |
| `industry_data_center` | -0.4827*** | 0.1617 | 0.0028 | [-0.7996, -0.1658] | -38.29% |
| `family_ai_ml` | 0.0662 | 0.1394 | 0.6347 | [-0.2069, 0.3394] | 6.85% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 624, R² = 0.3392, adjusted R² = 0.3317, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6472*** | 0.1024 | 0.0 | [0.4465, 0.8479] | — |
| `mandate_state` | 0.3681*** | 0.0923 | 0.0001 | [0.1873, 0.549] | 44.5% |
| `seniority_rank` | -0.003 | 0.012 | 0.8017 | [-0.0265, 0.0205] | -0.3% |
| `remote_eligible` | 0.0567 | 0.0814 | 0.4858 | [-0.1028, 0.2162] | 5.84% |
| `industry_data_center` | -0.0676 | 0.0955 | 0.4788 | [-0.2548, 0.1195] | -6.54% |
| `region_northeast` | -0.1059 | 0.0928 | 0.2538 | [-0.2879, 0.076] | -10.05% |
| `region_south` | -0.3115*** | 0.1017 | 0.0022 | [-0.5108, -0.1121] | -26.76% |
| `region_west` | -0.0018 | 0.0721 | 0.9799 | [-0.143, 0.1394] | -0.18% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 72, R² = 0.5528, adjusted R² = 0.443, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4667*** | 0.1155 | 0.0 | [11.2404, 11.693] | — |
| `seniority_rank` | 0.0557 | 0.0675 | 0.4099 | [-0.0767, 0.1881] | 5.72% |
| `yrs_exp_min` | -0.0148 | 0.0338 | 0.6619 | [-0.0811, 0.0515] | -1.47% |
| `yrs_exp_stated` | 0.0549 | 0.0909 | 0.5459 | [-0.1232, 0.233] | 5.64% |
| `degree_required` | -0.0843* | 0.0507 | 0.0966 | [-0.1838, 0.0151] | -8.09% |
| `degree_stem` | 0.0708 | 0.0463 | 0.1264 | [-0.02, 0.1616] | 7.34% |
| `skill_cloud` | 0.2594** | 0.1008 | 0.0101 | [0.0618, 0.4571] | 29.62% |
| `skill_ml_ai` | 0.041 | 0.0915 | 0.6544 | [-0.1384, 0.2204] | 4.18% |
| `remote_eligible` | -0.0522 | 0.0667 | 0.4337 | [-0.1829, 0.0785] | -5.09% |
| `mandate_state` | 0.053 | 0.0597 | 0.3748 | [-0.0641, 0.1701] | 5.45% |
| `region_northeast` | -0.0863 | 0.062 | 0.1636 | [-0.2078, 0.0351] | -8.27% |
| `region_south` | -0.1168 | 0.0873 | 0.1808 | [-0.2878, 0.0542] | -11.02% |
| `region_west` | 0.0691 | 0.0618 | 0.2635 | [-0.052, 0.1902] | 7.16% |
| `industry_data_center` | 0.0567 | 0.0892 | 0.5251 | [-0.1182, 0.2316] | 5.84% |
| `family_ai_ml` | 0.1391 | 0.0922 | 0.1314 | [-0.0416, 0.3197] | 14.92% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 431, R² = 0.6141, adjusted R² = 0.6002, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3966*** | 0.0454 | 0.0 | [11.3076, 11.4857] | — |
| `seniority_rank` | 0.1074*** | 0.0077 | 0.0 | [0.0923, 0.1225] | 11.34% |
| `yrs_exp_min` | 0.0231*** | 0.0042 | 0.0 | [0.015, 0.0313] | 2.34% |
| `yrs_exp_stated` | -0.0634* | 0.0325 | 0.0509 | [-0.1271, 0.0002] | -6.15% |
| `degree_required` | -0.0305 | 0.0251 | 0.2243 | [-0.0796, 0.0187] | -3.0% |
| `degree_stem` | 0.0437* | 0.0231 | 0.0588 | [-0.0016, 0.0891] | 4.47% |
| `skill_cloud` | 0.0963*** | 0.0309 | 0.0018 | [0.0358, 0.1567] | 10.11% |
| `skill_ml_ai` | 0.109*** | 0.0377 | 0.0038 | [0.0351, 0.183] | 11.52% |
| `remote_eligible` | -0.005 | 0.0372 | 0.8922 | [-0.0779, 0.0678] | -0.5% |
| `hourly_original` | -0.1536*** | 0.056 | 0.0061 | [-0.2633, -0.0439] | -14.24% |
| `mandate_state` | -0.0674** | 0.0339 | 0.0468 | [-0.1338, -0.0009] | -6.51% |
| `region_northeast` | 0.0129 | 0.0264 | 0.6246 | [-0.0389, 0.0647] | 1.3% |
| `region_south` | 0.0321 | 0.0424 | 0.449 | [-0.051, 0.1153] | 3.26% |
| `region_west` | 0.0624 | 0.0385 | 0.1049 | [-0.013, 0.1378] | 6.44% |
| `industry_data_center` | 0.0822 | 0.0657 | 0.2106 | [-0.0465, 0.2109] | 8.57% |
| `family_ai_ml` | 0.0872** | 0.0346 | 0.0118 | [0.0193, 0.1551] | 9.11% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 85 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1039 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0241 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_stated` | -0.0674 | 0.0361 | 0.0363 | unchanged (significant) |
| `degree_required` | -0.0389 | 0.137 | 0.1605 | unchanged (null) |
| `degree_stem` | 0.05 | 0.0227 | 0.0282 | unchanged (significant) |
| `skill_cloud` | 0.1189 | 0.0015 | 0.0014 | unchanged (significant) |
| `skill_ml_ai` | 0.1029 | 0.0273 | 0.0638 | **no longer significant** |
| `remote_eligible` | -0.0182 | 0.6121 | 0.6377 | unchanged (null) |
| `hourly_original` | -0.1496 | 0.0155 | 0.1585 | **no longer significant** |
| `mandate_state` | 0.0038 | 0.9036 | 0.9156 | unchanged (null) |
| `region_northeast` | 0.0922 | 0.0005 | 0.0018 | unchanged (significant) |
| `region_south` | 0.0761 | 0.0927 | 0.1907 | unchanged (null) |
| `region_west` | 0.1434 | 0.0016 | 0.0144 | unchanged (significant) |
| `industry_data_center` | 0.1016 | 0.147 | 0.5446 | unchanged (null) |
| `family_ai_ml` | 0.0775 | 0.0481 | 0.0925 | **no longer significant** |

Conclusions that change once clustering is bootstrapped: `skill_ml_ai`, `hourly_original`, `family_ai_ml`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.753** (470 disclosed, 154 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.398 | 3.429 | -0.031 | 0.8271 |
| `yrs_exp_min` | 2.326 | 2.078 | 0.248 | 0.3603 |
| `yrs_exp_stated` | 0.47 | 0.539 | -0.069 | 0.1399 |
| `degree_required` | 0.623 | 0.532 | 0.091 | 0.0498 |
| `degree_stem` | 0.396 | 0.351 | 0.045 | 0.314 |
| `skill_cloud` | 0.211 | 0.11 | 0.1 | 0.0016 |
| `skill_ml_ai` | 0.391 | 0.221 | 0.171 | 0.0 |
| `remote_eligible` | 0.164 | 0.136 | 0.027 | 0.4 |
| `hourly_original` | 0.011 | 0.0 | 0.011 | 0.0252 |
| `mandate_state` | 0.743 | 0.182 | 0.561 | 0.0 |
| `region_northeast` | 0.223 | 0.149 | 0.074 | 0.0334 |
| `region_south` | 0.153 | 0.597 | -0.444 | 0.0 |
| `region_west` | 0.366 | 0.032 | 0.333 | 0.0 |
| `industry_data_center` | 0.157 | 0.175 | -0.018 | 0.6104 |
| `family_ai_ml` | 0.109 | 0.065 | 0.044 | 0.0769 |
| `metro_indianapolis` | 0.006 | 0.052 | -0.046 | 0.0138 |


# Results

- Postings in scope: **631**
- With disclosed pay: **472**
- Used in estimation: **472**
- Distinct employers in the estimation sample (**the cluster count**): **86**
- Distinct employers across all postings in scope: **118**

Regressor budget at 20 observations each: **23** (specification used: **extended**).

Minimum detectable standardized effect: **0.1312** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 472, R² = 0.6071, adjusted R² = 0.5941, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3141*** | 0.0396 | 0.0 | [11.2366, 11.3917] | — |
| `seniority_rank` | 0.1053*** | 0.0079 | 0.0 | [0.0898, 0.1208] | 11.1% |
| `yrs_exp_min` | 0.0244*** | 0.0043 | 0.0 | [0.0159, 0.0329] | 2.47% |
| `yrs_exp_stated` | -0.0616* | 0.0326 | 0.0589 | [-0.1254, 0.0023] | -5.97% |
| `degree_required` | -0.0373 | 0.0267 | 0.1632 | [-0.0896, 0.0151] | -3.66% |
| `degree_stem` | 0.0512** | 0.0215 | 0.0171 | [0.0091, 0.0932] | 5.25% |
| `skill_cloud` | 0.117*** | 0.0353 | 0.0009 | [0.0478, 0.1863] | 12.42% |
| `skill_ml_ai` | 0.1039** | 0.0458 | 0.0232 | [0.0142, 0.1936] | 10.95% |
| `remote_eligible` | -0.0122 | 0.0368 | 0.7409 | [-0.0843, 0.0599] | -1.21% |
| `hourly_original` | -0.0177 | 0.044 | 0.6872 | [-0.1039, 0.0685] | -1.75% |
| `mandate_state` | 0.0114 | 0.0321 | 0.7227 | [-0.0516, 0.0743] | 1.15% |
| `region_northeast` | 0.0846*** | 0.0259 | 0.0011 | [0.0338, 0.1355] | 8.83% |
| `region_south` | 0.0744 | 0.0455 | 0.102 | [-0.0148, 0.1635] | 7.72% |
| `region_west` | 0.1247*** | 0.0443 | 0.0048 | [0.038, 0.2115] | 13.29% |
| `industry_data_center` | 0.1098 | 0.0702 | 0.1175 | [-0.0277, 0.2474] | 11.61% |
| `family_ai_ml` | 0.0765* | 0.0404 | 0.0586 | [-0.0028, 0.1558] | 7.95% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Extended model

N = 472, R² = 0.6733, adjusted R² = 0.6566, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4129*** | 0.0436 | 0.0 | [11.3275, 11.4983] | — |
| `seniority_rank` | 0.084*** | 0.0085 | 0.0 | [0.0673, 0.1006] | 8.76% |
| `yrs_exp_min` | 0.0223*** | 0.0034 | 0.0 | [0.0155, 0.029] | 2.25% |
| `yrs_exp_stated` | -0.0623** | 0.0283 | 0.0278 | [-0.1178, -0.0068] | -6.04% |
| `degree_required` | -0.0356 | 0.0235 | 0.1294 | [-0.0816, 0.0104] | -3.49% |
| `degree_stem` | 0.0694*** | 0.0214 | 0.0012 | [0.0275, 0.1113] | 7.19% |
| `skill_cloud` | 0.0884** | 0.036 | 0.0142 | [0.0177, 0.159] | 9.24% |
| `skill_ml_ai` | 0.0836* | 0.0469 | 0.0746 | [-0.0083, 0.1754] | 8.72% |
| `remote_eligible` | -0.0025 | 0.0368 | 0.9452 | [-0.0747, 0.0697] | -0.25% |
| `hourly_original` | 0.1509*** | 0.0542 | 0.0053 | [0.0448, 0.2571] | 16.29% |
| `mandate_state` | 0.001 | 0.04 | 0.9798 | [-0.0774, 0.0794] | 0.1% |
| `region_northeast` | 0.0507* | 0.0264 | 0.0551 | [-0.0011, 0.1024] | 5.2% |
| `region_south` | 0.0816* | 0.0492 | 0.0969 | [-0.0147, 0.178] | 8.5% |
| `region_west` | 0.0937** | 0.0395 | 0.0176 | [0.0163, 0.1711] | 9.83% |
| `industry_data_center` | 0.0986 | 0.0651 | 0.13 | [-0.029, 0.2261] | 10.36% |
| `family_ai_ml` | 0.0811* | 0.0442 | 0.0662 | [-0.0054, 0.1676] | 8.45% |
| `advanced_degree_pref` | 0.0688*** | 0.0223 | 0.002 | [0.0251, 0.1125] | 7.13% |
| `soft_leadership` | 0.0541** | 0.0211 | 0.0104 | [0.0127, 0.0955] | 5.56% |
| `job_level` | -0.0865*** | 0.0144 | 0.0 | [-0.1147, -0.0582] | -8.28% |
| `study_metro` | 0.0559 | 0.0341 | 0.1013 | [-0.011, 0.1227] | 5.74% |
| `prior_internship_req` | -0.1818** | 0.0822 | 0.027 | [-0.343, -0.0207] | -16.63% |
| `certification_req` | -0.0427 | 0.041 | 0.2975 | [-0.1231, 0.0377] | -4.18% |
| `skill_python_r` | -0.0006 | 0.0276 | 0.9817 | [-0.0547, 0.0534] | -0.06% |
| `skill_sql` | -0.0419 | 0.0298 | 0.1605 | [-0.1003, 0.0166] | -4.1% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 467, R² = 0.304, adjusted R² = 0.2808, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.7534*** | 0.1549 | 0.0 | [9.4497, 10.0571] | — |
| `seniority_rank` | 0.0872*** | 0.0225 | 0.0001 | [0.0431, 0.1312] | 9.11% |
| `yrs_exp_min` | 0.0241** | 0.0103 | 0.0195 | [0.0039, 0.0444] | 2.44% |
| `yrs_exp_stated` | -0.0793 | 0.0835 | 0.3421 | [-0.2431, 0.0844] | -7.63% |
| `degree_required` | 0.0751 | 0.0817 | 0.3575 | [-0.0849, 0.2352] | 7.8% |
| `degree_stem` | 0.2242*** | 0.0599 | 0.0002 | [0.1067, 0.3416] | 25.13% |
| `skill_cloud` | 0.0148 | 0.0727 | 0.8387 | [-0.1276, 0.1572] | 1.49% |
| `skill_ml_ai` | 0.2603** | 0.1268 | 0.0401 | [0.0117, 0.5088] | 29.73% |
| `remote_eligible` | 0.019 | 0.1229 | 0.8769 | [-0.2218, 0.2599] | 1.92% |
| `hourly_original` | 0.0153 | 0.1211 | 0.8997 | [-0.222, 0.2525] | 1.54% |
| `mandate_state` | -0.087 | 0.0911 | 0.3392 | [-0.2655, 0.0915] | -8.34% |
| `region_northeast` | 0.0455 | 0.2345 | 0.846 | [-0.4141, 0.5051] | 4.66% |
| `region_south` | 0.2925** | 0.1171 | 0.0125 | [0.0629, 0.5221] | 33.98% |
| `region_west` | 0.4901*** | 0.0987 | 0.0 | [0.2966, 0.6836] | 63.25% |
| `industry_data_center` | -0.4911*** | 0.1609 | 0.0023 | [-0.8064, -0.1759] | -38.81% |
| `family_ai_ml` | 0.073 | 0.1387 | 0.5988 | [-0.1989, 0.3449] | 7.57% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 631, R² = 0.323, adjusted R² = 0.3154, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.639*** | 0.1021 | 0.0 | [0.439, 0.839] | — |
| `mandate_state` | 0.3778*** | 0.0924 | 0.0 | [0.1967, 0.5588] | 45.9% |
| `seniority_rank` | -0.002 | 0.0124 | 0.8705 | [-0.0264, 0.0223] | -0.2% |
| `remote_eligible` | 0.07 | 0.0827 | 0.397 | [-0.092, 0.232] | 7.25% |
| `industry_data_center` | -0.057 | 0.0991 | 0.5651 | [-0.2514, 0.1373] | -5.54% |
| `region_northeast` | -0.1093 | 0.0939 | 0.2447 | [-0.2934, 0.0748] | -10.35% |
| `region_south` | -0.3146*** | 0.1019 | 0.002 | [-0.5143, -0.1149] | -26.99% |
| `region_west` | -0.039 | 0.0765 | 0.61 | [-0.189, 0.111] | -3.83% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 71, R² = 0.5502, adjusted R² = 0.4377, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4684*** | 0.1164 | 0.0 | [11.2404, 11.6965] | — |
| `seniority_rank` | 0.0558 | 0.0687 | 0.417 | [-0.0789, 0.1904] | 5.73% |
| `yrs_exp_min` | -0.0119 | 0.0351 | 0.7355 | [-0.0807, 0.057] | -1.18% |
| `yrs_exp_stated` | 0.0492 | 0.0906 | 0.587 | [-0.1283, 0.2268] | 5.04% |
| `degree_required` | -0.0871* | 0.0529 | 0.0994 | [-0.1907, 0.0165] | -8.34% |
| `degree_stem` | 0.0636 | 0.0482 | 0.187 | [-0.0309, 0.1581] | 6.57% |
| `skill_cloud` | 0.2427** | 0.1118 | 0.03 | [0.0235, 0.4619] | 27.47% |
| `skill_ml_ai` | 0.0485 | 0.0962 | 0.6139 | [-0.14, 0.237] | 4.97% |
| `remote_eligible` | -0.0484 | 0.0678 | 0.4754 | [-0.1813, 0.0845] | -4.72% |
| `mandate_state` | 0.054 | 0.0602 | 0.3703 | [-0.0641, 0.172] | 5.54% |
| `region_northeast` | -0.0849 | 0.0621 | 0.1717 | [-0.2067, 0.0368] | -8.14% |
| `region_south` | -0.117 | 0.0866 | 0.1764 | [-0.2867, 0.0527] | -11.04% |
| `region_west` | 0.0746 | 0.0636 | 0.2404 | [-0.05, 0.1992] | 7.75% |
| `industry_data_center` | 0.0495 | 0.0885 | 0.5759 | [-0.1239, 0.2229] | 5.07% |
| `family_ai_ml` | 0.1743 | 0.1103 | 0.1142 | [-0.042, 0.3906] | 19.04% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 434, R² = 0.6098, adjusted R² = 0.5958, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3907*** | 0.0456 | 0.0 | [11.3012, 11.4801] | — |
| `seniority_rank` | 0.1088*** | 0.0076 | 0.0 | [0.0938, 0.1238] | 11.5% |
| `yrs_exp_min` | 0.0234*** | 0.0042 | 0.0 | [0.0152, 0.0316] | 2.37% |
| `yrs_exp_stated` | -0.057* | 0.0329 | 0.0828 | [-0.1214, 0.0074] | -5.54% |
| `degree_required` | -0.0297 | 0.0254 | 0.241 | [-0.0794, 0.02] | -2.93% |
| `degree_stem` | 0.0453** | 0.0224 | 0.043 | [0.0014, 0.0892] | 4.64% |
| `skill_cloud` | 0.0941*** | 0.0285 | 0.0009 | [0.0383, 0.1499] | 9.87% |
| `skill_ml_ai` | 0.1107*** | 0.0366 | 0.0025 | [0.0389, 0.1824] | 11.7% |
| `remote_eligible` | 0.0076 | 0.0373 | 0.8391 | [-0.0655, 0.0806] | 0.76% |
| `hourly_original` | -0.0504 | 0.0381 | 0.1861 | [-0.1251, 0.0243] | -4.91% |
| `mandate_state` | -0.0636* | 0.0341 | 0.0621 | [-0.1304, 0.0032] | -6.16% |
| `region_northeast` | 0.0028 | 0.0265 | 0.9169 | [-0.0491, 0.0547] | 0.28% |
| `region_south` | 0.0271 | 0.0425 | 0.5244 | [-0.0563, 0.1105] | 2.75% |
| `region_west` | 0.0423 | 0.0374 | 0.2583 | [-0.0311, 0.1157] | 4.32% |
| `industry_data_center` | 0.0907 | 0.0653 | 0.1652 | [-0.0374, 0.2187] | 9.49% |
| `family_ai_ml` | 0.0866** | 0.0352 | 0.014 | [0.0176, 0.1556] | 9.04% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 86 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1053 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0244 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_stated` | -0.0616 | 0.0589 | 0.0612 | unchanged (null) |
| `degree_required` | -0.0373 | 0.1632 | 0.1981 | unchanged (null) |
| `degree_stem` | 0.0512 | 0.0171 | 0.024 | unchanged (significant) |
| `skill_cloud` | 0.117 | 0.0009 | 0.0014 | unchanged (significant) |
| `skill_ml_ai` | 0.1039 | 0.0232 | 0.0591 | **no longer significant** |
| `remote_eligible` | -0.0122 | 0.7409 | 0.7646 | unchanged (null) |
| `hourly_original` | -0.0177 | 0.6872 | 0.7351 | unchanged (null) |
| `mandate_state` | 0.0114 | 0.7227 | 0.7392 | unchanged (null) |
| `region_northeast` | 0.0846 | 0.0011 | 0.0061 | unchanged (significant) |
| `region_south` | 0.0744 | 0.102 | 0.2124 | unchanged (null) |
| `region_west` | 0.1247 | 0.0048 | 0.0198 | unchanged (significant) |
| `industry_data_center` | 0.1098 | 0.1175 | 0.5152 | unchanged (null) |
| `family_ai_ml` | 0.0765 | 0.0586 | 0.1032 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `skill_ml_ai`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.748** (472 disclosed, 159 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.381 | 3.396 | -0.015 | 0.9144 |
| `yrs_exp_min` | 2.28 | 2.145 | 0.135 | 0.6174 |
| `yrs_exp_stated` | 0.464 | 0.547 | -0.083 | 0.0703 |
| `degree_required` | 0.625 | 0.528 | 0.097 | 0.0347 |
| `degree_stem` | 0.403 | 0.358 | 0.044 | 0.3213 |
| `skill_cloud` | 0.22 | 0.107 | 0.113 | 0.0003 |
| `skill_ml_ai` | 0.39 | 0.239 | 0.151 | 0.0002 |
| `remote_eligible` | 0.157 | 0.126 | 0.031 | 0.3221 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.746 | 0.201 | 0.545 | 0.0 |
| `region_northeast` | 0.225 | 0.145 | 0.08 | 0.0192 |
| `region_south` | 0.15 | 0.579 | -0.428 | 0.0 |
| `region_west` | 0.375 | 0.069 | 0.306 | 0.0 |
| `industry_data_center` | 0.157 | 0.176 | -0.019 | 0.5773 |
| `family_ai_ml` | 0.108 | 0.063 | 0.045 | 0.0611 |
| `metro_indianapolis` | 0.006 | 0.05 | -0.044 | 0.0143 |


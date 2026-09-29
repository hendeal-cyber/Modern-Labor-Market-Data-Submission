# Results

- Postings in scope: **710**
- With disclosed pay: **531**
- Used in estimation: **531**
- Distinct employers in the estimation sample (**the cluster count**): **99**
- Distinct employers across all postings in scope: **137**

Regressor budget at 20 observations each: **26** (specification used: **extended**).

Minimum detectable standardized effect: **0.1235** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 531, R² = 0.5917, adjusted R² = 0.5798, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3419*** | 0.0441 | 0.0 | [11.2555, 11.4283] | — |
| `seniority_rank` | 0.1052*** | 0.008 | 0.0 | [0.0895, 0.1208] | 11.09% |
| `yrs_exp_min` | 0.0258*** | 0.0043 | 0.0 | [0.0173, 0.0343] | 2.61% |
| `yrs_exp_stated` | -0.0722** | 0.0314 | 0.0216 | [-0.1337, -0.0106] | -6.96% |
| `degree_required` | -0.0566** | 0.0269 | 0.0353 | [-0.1092, -0.0039] | -5.5% |
| `degree_stem` | 0.0512** | 0.0227 | 0.0239 | [0.0068, 0.0956] | 5.25% |
| `skill_cloud` | 0.112*** | 0.0323 | 0.0005 | [0.0487, 0.1752] | 11.85% |
| `skill_ml_ai` | 0.0919** | 0.0437 | 0.0354 | [0.0063, 0.1776] | 9.63% |
| `remote_eligible` | 0.0121 | 0.0346 | 0.7256 | [-0.0556, 0.0799] | 1.22% |
| `hourly_original` | -0.0236 | 0.0388 | 0.5429 | [-0.0997, 0.0525] | -2.33% |
| `mandate_state` | 0.0077 | 0.0314 | 0.8069 | [-0.0538, 0.0692] | 0.77% |
| `region_northeast` | 0.0884*** | 0.03 | 0.0032 | [0.0295, 0.1472] | 9.24% |
| `region_south` | 0.0726* | 0.0438 | 0.0975 | [-0.0133, 0.1584] | 7.53% |
| `region_west` | 0.1261*** | 0.038 | 0.0009 | [0.0517, 0.2005] | 13.44% |
| `industry_data_center` | 0.1026 | 0.0692 | 0.1386 | [-0.0332, 0.2383] | 10.8% |
| `family_ai_ml` | 0.0837** | 0.0377 | 0.0263 | [0.0098, 0.1576] | 8.73% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Extended model

N = 531, R² = 0.6679, adjusted R² = 0.6508, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4752*** | 0.0439 | 0.0 | [11.3892, 11.5611] | — |
| `seniority_rank` | 0.0843*** | 0.0082 | 0.0 | [0.0683, 0.1003] | 8.8% |
| `yrs_exp_min` | 0.023*** | 0.0032 | 0.0 | [0.0167, 0.0293] | 2.32% |
| `yrs_exp_stated` | -0.0662** | 0.0258 | 0.0104 | [-0.1169, -0.0156] | -6.41% |
| `degree_required` | -0.0431* | 0.0226 | 0.0567 | [-0.0875, 0.0012] | -4.22% |
| `degree_stem` | 0.0722*** | 0.0216 | 0.0008 | [0.0299, 0.1144] | 7.48% |
| `skill_cloud` | 0.0907*** | 0.0322 | 0.0048 | [0.0277, 0.1538] | 9.5% |
| `skill_ml_ai` | 0.0863* | 0.045 | 0.0551 | [-0.0019, 0.1746] | 9.02% |
| `remote_eligible` | 0.0123 | 0.0312 | 0.6934 | [-0.0489, 0.0736] | 1.24% |
| `hourly_original` | 0.1552*** | 0.0514 | 0.0025 | [0.0544, 0.2559] | 16.79% |
| `mandate_state` | 0.0125 | 0.0402 | 0.7561 | [-0.0662, 0.0912] | 1.26% |
| `region_northeast` | 0.0642** | 0.0287 | 0.0254 | [0.0079, 0.1204] | 6.63% |
| `region_south` | 0.0836* | 0.0466 | 0.0727 | [-0.0077, 0.1748] | 8.72% |
| `region_west` | 0.0935*** | 0.0355 | 0.0085 | [0.0239, 0.1631] | 9.8% |
| `industry_data_center` | 0.0933 | 0.0603 | 0.1217 | [-0.0248, 0.2114] | 9.78% |
| `family_ai_ml` | 0.0913** | 0.0397 | 0.0214 | [0.0135, 0.169] | 9.56% |
| `advanced_degree_pref` | 0.0631*** | 0.0231 | 0.0064 | [0.0177, 0.1084] | 6.51% |
| `soft_leadership` | 0.0541** | 0.0227 | 0.0171 | [0.0097, 0.0986] | 5.56% |
| `job_level` | -0.0884*** | 0.0129 | 0.0 | [-0.1136, -0.0632] | -8.46% |
| `study_metro` | 0.0331 | 0.036 | 0.3576 | [-0.0374, 0.1037] | 3.37% |
| `prior_internship_req` | -0.1979** | 0.0768 | 0.01 | [-0.3485, -0.0474] | -17.96% |
| `certification_req` | -0.0273 | 0.0368 | 0.4583 | [-0.0994, 0.0448] | -2.69% |
| `skill_python_r` | -0.0056 | 0.0231 | 0.8097 | [-0.0509, 0.0398] | -0.56% |
| `skill_sql` | -0.0195 | 0.0262 | 0.4577 | [-0.0709, 0.0319] | -1.93% |
| `skill_viz_bi` | -0.0203 | 0.0232 | 0.3826 | [-0.0658, 0.0253] | -2.01% |
| `skill_big_data` | -0.0472 | 0.0325 | 0.1472 | [-0.1109, 0.0166] | -4.61% |
| `soft_teamwork` | -0.0671*** | 0.0215 | 0.0018 | [-0.1091, -0.025] | -6.49% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 526, R² = 0.2839, adjusted R² = 0.2628, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.7685*** | 0.1499 | 0.0 | [9.4747, 10.0624] | — |
| `seniority_rank` | 0.0966*** | 0.0213 | 0.0 | [0.0548, 0.1384] | 10.14% |
| `yrs_exp_min` | 0.0284*** | 0.0098 | 0.0038 | [0.0091, 0.0476] | 2.88% |
| `yrs_exp_stated` | -0.1259 | 0.0807 | 0.1187 | [-0.284, 0.0322] | -11.83% |
| `degree_required` | 0.0349 | 0.0821 | 0.6711 | [-0.1261, 0.1958] | 3.55% |
| `degree_stem` | 0.2428*** | 0.0642 | 0.0002 | [0.1169, 0.3686] | 27.48% |
| `skill_cloud` | 0.0049 | 0.0731 | 0.9467 | [-0.1384, 0.1482] | 0.49% |
| `skill_ml_ai` | 0.233* | 0.1214 | 0.055 | [-0.005, 0.4711] | 26.24% |
| `remote_eligible` | 0.0145 | 0.1102 | 0.8954 | [-0.2016, 0.2306] | 1.46% |
| `hourly_original` | 0.0636 | 0.1039 | 0.5408 | [-0.1402, 0.2673] | 6.56% |
| `mandate_state` | -0.0751 | 0.0868 | 0.3872 | [-0.2452, 0.0951] | -7.23% |
| `region_northeast` | 0.0642 | 0.2404 | 0.7895 | [-0.407, 0.5353] | 6.63% |
| `region_south` | 0.2944*** | 0.1135 | 0.0095 | [0.0719, 0.5169] | 34.23% |
| `region_west` | 0.4268*** | 0.0877 | 0.0 | [0.2549, 0.5986] | 53.23% |
| `industry_data_center` | -0.4564*** | 0.1612 | 0.0046 | [-0.7724, -0.1404] | -36.65% |
| `family_ai_ml` | 0.1009 | 0.1306 | 0.4397 | [-0.155, 0.3568] | 10.61% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 710, R² = 0.3369, adjusted R² = 0.3303, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6567*** | 0.0988 | 0.0 | [0.4632, 0.8503] | — |
| `mandate_state` | 0.3858*** | 0.0905 | 0.0 | [0.2085, 0.563] | 47.07% |
| `seniority_rank` | -0.0059 | 0.0116 | 0.6093 | [-0.0286, 0.0168] | -0.59% |
| `remote_eligible` | 0.0772 | 0.075 | 0.303 | [-0.0697, 0.2242] | 8.03% |
| `industry_data_center` | -0.0676 | 0.0962 | 0.4827 | [-0.2562, 0.1211] | -6.53% |
| `region_northeast` | -0.127 | 0.0921 | 0.1678 | [-0.3075, 0.0535] | -11.93% |
| `region_south` | -0.3307*** | 0.1004 | 0.001 | [-0.5274, -0.134] | -28.16% |
| `region_west` | -0.0591 | 0.0735 | 0.4214 | [-0.2031, 0.085] | -5.74% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 79, R² = 0.5083, adjusted R² = 0.4007, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4688*** | 0.1157 | 0.0 | [11.242, 11.6956] | — |
| `seniority_rank` | 0.0782 | 0.0677 | 0.2485 | [-0.0546, 0.2109] | 8.13% |
| `yrs_exp_min` | 0.02 | 0.0315 | 0.525 | [-0.0417, 0.0817] | 2.02% |
| `yrs_exp_stated` | -0.033 | 0.0738 | 0.6547 | [-0.1777, 0.1117] | -3.25% |
| `degree_required` | -0.0817 | 0.0506 | 0.1061 | [-0.1809, 0.0174] | -7.85% |
| `degree_stem` | 0.0317 | 0.0522 | 0.5436 | [-0.0705, 0.1339] | 3.22% |
| `skill_cloud` | 0.2168** | 0.1095 | 0.0477 | [0.0022, 0.4315] | 24.21% |
| `skill_ml_ai` | 0.068 | 0.0978 | 0.4868 | [-0.1237, 0.2597] | 7.04% |
| `remote_eligible` | -0.0013 | 0.0747 | 0.9858 | [-0.1478, 0.1452] | -0.13% |
| `mandate_state` | 0.0429 | 0.0591 | 0.4682 | [-0.073, 0.1587] | 4.38% |
| `region_northeast` | -0.0976 | 0.0594 | 0.1004 | [-0.2141, 0.0188] | -9.3% |
| `region_south` | -0.1186 | 0.084 | 0.1582 | [-0.2833, 0.0461] | -11.19% |
| `region_west` | 0.03 | 0.0566 | 0.5966 | [-0.081, 0.1409] | 3.04% |
| `industry_data_center` | 0.0596 | 0.0911 | 0.5127 | [-0.1189, 0.2382] | 6.15% |
| `family_ai_ml` | 0.2224** | 0.1018 | 0.029 | [0.0228, 0.422] | 24.91% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 487, R² = 0.6016, adjusted R² = 0.5889, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4018*** | 0.0443 | 0.0 | [11.3149, 11.4886] | — |
| `seniority_rank` | 0.1104*** | 0.0073 | 0.0 | [0.0961, 0.1246] | 11.67% |
| `yrs_exp_min` | 0.0243*** | 0.0041 | 0.0 | [0.0163, 0.0323] | 2.46% |
| `yrs_exp_stated` | -0.0715** | 0.031 | 0.0211 | [-0.1322, -0.0107] | -6.9% |
| `degree_required` | -0.0463* | 0.0262 | 0.0769 | [-0.0976, 0.005] | -4.52% |
| `degree_stem` | 0.0513** | 0.0229 | 0.0255 | [0.0063, 0.0962] | 5.26% |
| `skill_cloud` | 0.0863*** | 0.0264 | 0.0011 | [0.0346, 0.138] | 9.01% |
| `skill_ml_ai` | 0.1062*** | 0.0345 | 0.0021 | [0.0385, 0.1739] | 11.2% |
| `remote_eligible` | 0.0108 | 0.0344 | 0.7521 | [-0.0565, 0.0782] | 1.09% |
| `hourly_original` | -0.0591* | 0.0348 | 0.0889 | [-0.1273, 0.009] | -5.74% |
| `mandate_state` | -0.0619* | 0.0332 | 0.0624 | [-0.1269, 0.0032] | -6.0% |
| `region_northeast` | 0.0143 | 0.0307 | 0.6418 | [-0.0459, 0.0744] | 1.44% |
| `region_south` | 0.0313 | 0.0415 | 0.4508 | [-0.05, 0.1125] | 3.18% |
| `region_west` | 0.0487 | 0.0343 | 0.1551 | [-0.0184, 0.1159] | 4.99% |
| `industry_data_center` | 0.0825 | 0.0628 | 0.1892 | [-0.0406, 0.2056] | 8.6% |
| `family_ai_ml` | 0.0883*** | 0.0337 | 0.0087 | [0.0223, 0.1544] | 9.24% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 99 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1052 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0258 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_stated` | -0.0722 | 0.0216 | 0.0276 | unchanged (significant) |
| `degree_required` | -0.0566 | 0.0353 | 0.051 | **no longer significant** |
| `degree_stem` | 0.0512 | 0.0239 | 0.0318 | unchanged (significant) |
| `skill_cloud` | 0.112 | 0.0005 | 0.0013 | unchanged (significant) |
| `skill_ml_ai` | 0.0919 | 0.0354 | 0.0681 | **no longer significant** |
| `remote_eligible` | 0.0121 | 0.7256 | 0.7411 | unchanged (null) |
| `hourly_original` | -0.0236 | 0.5429 | 0.6512 | unchanged (null) |
| `mandate_state` | 0.0077 | 0.8069 | 0.822 | unchanged (null) |
| `region_northeast` | 0.0884 | 0.0032 | 0.0107 | unchanged (significant) |
| `region_south` | 0.0726 | 0.0975 | 0.2006 | unchanged (null) |
| `region_west` | 0.1261 | 0.0009 | 0.0124 | unchanged (significant) |
| `industry_data_center` | 0.1026 | 0.1386 | 0.596 | unchanged (null) |
| `family_ai_ml` | 0.0837 | 0.0263 | 0.0532 | **no longer significant** |

Conclusions that change once clustering is bootstrapped: `degree_required`, `skill_ml_ai`, `family_ai_ml`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.748** (531 disclosed, 179 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.388 | 3.458 | -0.07 | 0.5873 |
| `yrs_exp_min` | 2.324 | 2.307 | 0.017 | 0.9479 |
| `yrs_exp_stated` | 0.48 | 0.57 | -0.09 | 0.0379 |
| `degree_required` | 0.61 | 0.514 | 0.096 | 0.0261 |
| `degree_stem` | 0.411 | 0.358 | 0.053 | 0.2057 |
| `skill_cloud` | 0.215 | 0.106 | 0.109 | 0.0002 |
| `skill_ml_ai` | 0.363 | 0.263 | 0.101 | 0.0102 |
| `remote_eligible` | 0.168 | 0.117 | 0.05 | 0.0845 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.755 | 0.207 | 0.548 | 0.0 |
| `region_northeast` | 0.217 | 0.14 | 0.077 | 0.0153 |
| `region_south` | 0.143 | 0.587 | -0.443 | 0.0 |
| `region_west` | 0.403 | 0.084 | 0.319 | 0.0 |
| `industry_data_center` | 0.139 | 0.184 | -0.045 | 0.1703 |
| `family_ai_ml` | 0.102 | 0.078 | 0.023 | 0.3291 |
| `metro_indianapolis` | 0.006 | 0.045 | -0.039 | 0.0145 |


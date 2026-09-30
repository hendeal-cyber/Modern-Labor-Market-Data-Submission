# Results

- Postings in scope: **729**
- With disclosed pay: **543**
- Used in estimation: **543**
- Distinct employers in the estimation sample (**the cluster count**): **100**
- Distinct employers across all postings in scope: **138**

Regressor budget at 20 observations each: **27** (specification used: **extended**).

Minimum detectable standardized effect: **0.122** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 543, R² = 0.589, adjusted R² = 0.5773, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3343*** | 0.0446 | 0.0 | [11.2469, 11.4217] | — |
| `seniority_rank` | 0.1059*** | 0.0079 | 0.0 | [0.0904, 0.1214] | 11.17% |
| `yrs_exp_min` | 0.0252*** | 0.0043 | 0.0 | [0.0169, 0.0336] | 2.55% |
| `yrs_exp_stated` | -0.0727** | 0.0313 | 0.0203 | [-0.1342, -0.0113] | -7.02% |
| `degree_required` | -0.0517* | 0.027 | 0.0552 | [-0.1046, 0.0011] | -5.04% |
| `degree_stem` | 0.0496** | 0.023 | 0.0308 | [0.0046, 0.0947] | 5.09% |
| `skill_cloud` | 0.1181*** | 0.0328 | 0.0003 | [0.0537, 0.1825] | 12.53% |
| `skill_ml_ai` | 0.0931** | 0.0437 | 0.0332 | [0.0074, 0.1787] | 9.75% |
| `remote_eligible` | 0.01 | 0.0344 | 0.7719 | [-0.0574, 0.0773] | 1.0% |
| `hourly_original` | -0.0252 | 0.0407 | 0.5351 | [-0.105, 0.0545] | -2.49% |
| `mandate_state` | 0.0106 | 0.0307 | 0.7296 | [-0.0496, 0.0708] | 1.07% |
| `region_northeast` | 0.0851*** | 0.0307 | 0.0055 | [0.025, 0.1452] | 8.88% |
| `region_south` | 0.0792* | 0.0426 | 0.0629 | [-0.0042, 0.1626] | 8.24% |
| `region_west` | 0.1269*** | 0.0391 | 0.0012 | [0.0503, 0.2035] | 13.53% |
| `industry_data_center` | 0.0983 | 0.07 | 0.1603 | [-0.0389, 0.2355] | 10.33% |
| `family_ai_ml` | 0.0765** | 0.0386 | 0.0475 | [0.0008, 0.1522] | 7.95% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Extended model

N = 543, R² = 0.6695, adjusted R² = 0.6521, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4769*** | 0.0436 | 0.0 | [11.3914, 11.5624] | — |
| `seniority_rank` | 0.0852*** | 0.0083 | 0.0 | [0.0689, 0.1014] | 8.89% |
| `yrs_exp_min` | 0.0222*** | 0.0033 | 0.0 | [0.0158, 0.0286] | 2.24% |
| `yrs_exp_stated` | -0.0659** | 0.0259 | 0.011 | [-0.1167, -0.0151] | -6.38% |
| `degree_required` | -0.0367* | 0.0221 | 0.0968 | [-0.0801, 0.0066] | -3.61% |
| `degree_stem` | 0.0683*** | 0.022 | 0.0019 | [0.0252, 0.1115] | 7.07% |
| `skill_cloud` | 0.0937*** | 0.0314 | 0.0028 | [0.0322, 0.1551] | 9.82% |
| `skill_ml_ai` | 0.0859** | 0.0438 | 0.0497 | [0.0001, 0.1717] | 8.97% |
| `remote_eligible` | 0.0107 | 0.0296 | 0.7182 | [-0.0474, 0.0688] | 1.07% |
| `hourly_original` | 0.1573*** | 0.0508 | 0.002 | [0.0578, 0.2569] | 17.04% |
| `mandate_state` | 0.0157 | 0.0388 | 0.6854 | [-0.0603, 0.0917] | 1.58% |
| `region_northeast` | 0.0604** | 0.028 | 0.0311 | [0.0055, 0.1153] | 6.22% |
| `region_south` | 0.0854* | 0.045 | 0.0574 | [-0.0027, 0.1736] | 8.92% |
| `region_west` | 0.0916*** | 0.0355 | 0.0098 | [0.0221, 0.1611] | 9.59% |
| `industry_data_center` | 0.0972 | 0.0597 | 0.1034 | [-0.0198, 0.2142] | 10.21% |
| `family_ai_ml` | 0.0811* | 0.0418 | 0.0523 | [-0.0008, 0.1631] | 8.45% |
| `advanced_degree_pref` | 0.0643*** | 0.0227 | 0.0047 | [0.0198, 0.1088] | 6.64% |
| `soft_leadership` | 0.054** | 0.0229 | 0.0184 | [0.0091, 0.0988] | 5.54% |
| `job_level` | -0.0888*** | 0.013 | 0.0 | [-0.1144, -0.0632] | -8.5% |
| `study_metro` | 0.0348 | 0.0353 | 0.3249 | [-0.0345, 0.104] | 3.54% |
| `prior_internship_req` | -0.1847** | 0.0783 | 0.0183 | [-0.3382, -0.0313] | -16.87% |
| `certification_req` | -0.0282 | 0.0354 | 0.426 | [-0.0975, 0.0412] | -2.78% |
| `skill_python_r` | -0.0014 | 0.0235 | 0.9531 | [-0.0474, 0.0447] | -0.14% |
| `skill_sql` | -0.0186 | 0.0262 | 0.478 | [-0.0699, 0.0327] | -1.84% |
| `skill_viz_bi` | -0.0224 | 0.0233 | 0.336 | [-0.0679, 0.0232] | -2.21% |
| `skill_big_data` | -0.0456 | 0.0336 | 0.1749 | [-0.1114, 0.0203] | -4.45% |
| `soft_teamwork` | -0.0661*** | 0.0212 | 0.0018 | [-0.1077, -0.0246] | -6.4% |
| `soft_communication` | -0.0262 | 0.0224 | 0.2436 | [-0.0701, 0.0178] | -2.58% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 538, R² = 0.2898, adjusted R² = 0.2694, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.7335*** | 0.1575 | 0.0 | [9.4249, 10.0421] | — |
| `seniority_rank` | 0.0966*** | 0.0212 | 0.0 | [0.0551, 0.1381] | 10.14% |
| `yrs_exp_min` | 0.0296*** | 0.0097 | 0.0023 | [0.0106, 0.0487] | 3.01% |
| `yrs_exp_stated` | -0.1237 | 0.0816 | 0.1297 | [-0.2836, 0.0363] | -11.63% |
| `degree_required` | 0.047 | 0.0817 | 0.565 | [-0.1132, 0.2073] | 4.82% |
| `degree_stem` | 0.2557*** | 0.0652 | 0.0001 | [0.1279, 0.3834] | 29.13% |
| `skill_cloud` | 0.0048 | 0.0744 | 0.949 | [-0.1411, 0.1507] | 0.48% |
| `skill_ml_ai` | 0.2422** | 0.1217 | 0.0465 | [0.0037, 0.4806] | 27.4% |
| `remote_eligible` | 0.0074 | 0.1148 | 0.949 | [-0.2177, 0.2324] | 0.74% |
| `hourly_original` | 0.0714 | 0.1047 | 0.4954 | [-0.1338, 0.2765] | 7.4% |
| `mandate_state` | -0.0598 | 0.0881 | 0.4971 | [-0.2325, 0.1129] | -5.81% |
| `region_northeast` | 0.0617 | 0.2434 | 0.7999 | [-0.4154, 0.5387] | 6.36% |
| `region_south` | 0.3078*** | 0.1146 | 0.0072 | [0.0831, 0.5325] | 36.05% |
| `region_west` | 0.4201*** | 0.0894 | 0.0 | [0.2449, 0.5954] | 52.21% |
| `industry_data_center` | -0.4708*** | 0.1605 | 0.0034 | [-0.7855, -0.1562] | -37.55% |
| `family_ai_ml` | 0.1084 | 0.1341 | 0.4186 | [-0.1543, 0.3712] | 11.45% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 729, R² = 0.3353, adjusted R² = 0.3288, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.638*** | 0.0993 | 0.0 | [0.4433, 0.8327] | — |
| `mandate_state` | 0.3876*** | 0.0895 | 0.0 | [0.2123, 0.5629] | 47.34% |
| `seniority_rank` | -0.0019 | 0.0116 | 0.8685 | [-0.0246, 0.0208] | -0.19% |
| `remote_eligible` | 0.0825 | 0.0748 | 0.2706 | [-0.0642, 0.2292] | 8.6% |
| `industry_data_center` | -0.0715 | 0.0973 | 0.4629 | [-0.2622, 0.1193] | -6.9% |
| `region_northeast` | -0.1313 | 0.0958 | 0.1703 | [-0.3191, 0.0564] | -12.31% |
| `region_south` | -0.3278*** | 0.0993 | 0.001 | [-0.5225, -0.1332] | -27.95% |
| `region_west` | -0.0545 | 0.0739 | 0.4607 | [-0.1994, 0.0904] | -5.31% |

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

N = 498, R² = 0.5981, adjusted R² = 0.5856, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3938*** | 0.0443 | 0.0 | [11.3069, 11.4807] | — |
| `seniority_rank` | 0.1109*** | 0.0071 | 0.0 | [0.0969, 0.1249] | 11.73% |
| `yrs_exp_min` | 0.0238*** | 0.004 | 0.0 | [0.016, 0.0316] | 2.41% |
| `yrs_exp_stated` | -0.0733** | 0.0308 | 0.0172 | [-0.1337, -0.013] | -7.07% |
| `degree_required` | -0.0416 | 0.0263 | 0.1139 | [-0.0932, 0.01] | -4.08% |
| `degree_stem` | 0.0487** | 0.0233 | 0.0364 | [0.0031, 0.0943] | 4.99% |
| `skill_cloud` | 0.0923*** | 0.027 | 0.0006 | [0.0393, 0.1453] | 9.67% |
| `skill_ml_ai` | 0.105*** | 0.034 | 0.002 | [0.0384, 0.1717] | 11.07% |
| `remote_eligible` | 0.007 | 0.0354 | 0.8439 | [-0.0624, 0.0763] | 0.7% |
| `hourly_original` | -0.063* | 0.037 | 0.0881 | [-0.1355, 0.0094] | -6.11% |
| `mandate_state` | -0.0572* | 0.0333 | 0.0855 | [-0.1224, 0.008] | -5.56% |
| `region_northeast` | 0.0116 | 0.0308 | 0.7058 | [-0.0487, 0.0719] | 1.17% |
| `region_south` | 0.0402 | 0.0393 | 0.3065 | [-0.0368, 0.1172] | 4.1% |
| `region_west` | 0.0515 | 0.0357 | 0.1488 | [-0.0184, 0.1215] | 5.29% |
| `industry_data_center` | 0.0796 | 0.0637 | 0.2117 | [-0.0453, 0.2045] | 8.28% |
| `family_ai_ml` | 0.082** | 0.0348 | 0.0186 | [0.0137, 0.1502] | 8.54% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 100 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1059 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0252 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_stated` | -0.0727 | 0.0203 | 0.0233 | unchanged (significant) |
| `degree_required` | -0.0517 | 0.0552 | 0.0738 | unchanged (null) |
| `degree_stem` | 0.0496 | 0.0308 | 0.0429 | unchanged (significant) |
| `skill_cloud` | 0.1181 | 0.0003 | 0.0006 | unchanged (significant) |
| `skill_ml_ai` | 0.0931 | 0.0332 | 0.0741 | **no longer significant** |
| `remote_eligible` | 0.01 | 0.7719 | 0.787 | unchanged (null) |
| `hourly_original` | -0.0252 | 0.5351 | 0.6443 | unchanged (null) |
| `mandate_state` | 0.0106 | 0.7296 | 0.7435 | unchanged (null) |
| `region_northeast` | 0.0851 | 0.0055 | 0.0188 | unchanged (significant) |
| `region_south` | 0.0792 | 0.0629 | 0.1545 | unchanged (null) |
| `region_west` | 0.1269 | 0.0012 | 0.0109 | unchanged (significant) |
| `industry_data_center` | 0.0983 | 0.1603 | 0.5838 | unchanged (null) |
| `family_ai_ml` | 0.0765 | 0.0475 | 0.0834 | **no longer significant** |

Conclusions that change once clustering is bootstrapped: `skill_ml_ai`, `family_ai_ml`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.745** (543 disclosed, 186 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.403 | 3.419 | -0.016 | 0.8998 |
| `yrs_exp_min` | 2.317 | 2.344 | -0.027 | 0.9153 |
| `yrs_exp_stated` | 0.477 | 0.575 | -0.098 | 0.0205 |
| `degree_required` | 0.606 | 0.522 | 0.084 | 0.0469 |
| `degree_stem` | 0.407 | 0.366 | 0.041 | 0.3159 |
| `skill_cloud` | 0.21 | 0.108 | 0.102 | 0.0004 |
| `skill_ml_ai` | 0.359 | 0.274 | 0.085 | 0.029 |
| `remote_eligible` | 0.168 | 0.113 | 0.055 | 0.0538 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.755 | 0.21 | 0.545 | 0.0 |
| `region_northeast` | 0.217 | 0.145 | 0.072 | 0.022 |
| `region_south` | 0.144 | 0.581 | -0.437 | 0.0 |
| `region_west` | 0.401 | 0.081 | 0.321 | 0.0 |
| `industry_data_center` | 0.14 | 0.183 | -0.043 | 0.1829 |
| `family_ai_ml` | 0.101 | 0.086 | 0.015 | 0.5311 |
| `metro_indianapolis` | 0.006 | 0.043 | -0.037 | 0.0148 |


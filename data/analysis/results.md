# Results

- Postings in scope: **355**
- With disclosed pay: **266**
- Used in estimation: **266**
- Distinct employers in the estimation sample (**the cluster count**): **37**
- Distinct employers across all postings in scope: **49**

Regressor budget at 20 observations each: **13** (specification used: **core**).

Minimum detectable standardized effect: **0.1772** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 266, R² = 0.523, adjusted R² = 0.4944, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3271*** | 0.0348 | 0.0 | [11.2589, 11.3953] | — |
| `seniority_rank` | 0.1083*** | 0.008 | 0.0 | [0.0925, 0.124] | 11.43% |
| `yrs_exp_min` | 0.0159* | 0.0087 | 0.0691 | [-0.0012, 0.0329] | 1.6% |
| `yrs_exp_stated` | -0.0246 | 0.0374 | 0.5115 | [-0.0979, 0.0488] | -2.43% |
| `degree_required` | 0.0012 | 0.0321 | 0.9704 | [-0.0617, 0.0641] | 0.12% |
| `degree_stem` | 0.0194 | 0.0297 | 0.5143 | [-0.0389, 0.0776] | 1.96% |
| `skill_cloud` | 0.1412*** | 0.0334 | 0.0 | [0.0758, 0.2066] | 15.16% |
| `skill_ml_ai` | 0.0201 | 0.039 | 0.6068 | [-0.0563, 0.0965] | 2.03% |
| `remote_eligible` | 0.0531* | 0.0303 | 0.0792 | [-0.0062, 0.1124] | 5.46% |
| `hourly_original` | -0.2661 | 0.3055 | 0.3838 | [-0.8649, 0.3327] | -23.36% |
| `mandate_state` | -0.0246 | 0.0295 | 0.4044 | [-0.0825, 0.0333] | -2.43% |
| `region_northeast` | 0.107*** | 0.0354 | 0.0025 | [0.0376, 0.1764] | 11.29% |
| `region_south` | 0.0706 | 0.0446 | 0.1131 | [-0.0167, 0.158] | 7.32% |
| `region_west` | 0.0513 | 0.038 | 0.177 | [-0.0232, 0.1258] | 5.26% |
| `industry_data_center` | 0.0075 | 0.0587 | 0.8984 | [-0.1075, 0.1225] | 0.75% |
| `family_ai_ml` | 0.0427 | 0.0501 | 0.3943 | [-0.0555, 0.1409] | 4.36% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 260, R² = 0.334, adjusted R² = 0.293, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.6995*** | 0.1831 | 0.0 | [9.3406, 10.0583] | — |
| `seniority_rank` | 0.1124*** | 0.0322 | 0.0005 | [0.0494, 0.1755] | 11.9% |
| `yrs_exp_min` | -0.0129 | 0.0273 | 0.6366 | [-0.0665, 0.0407] | -1.28% |
| `yrs_exp_stated` | 0.0452 | 0.1255 | 0.7184 | [-0.2007, 0.2912] | 4.63% |
| `degree_required` | 0.2492* | 0.1501 | 0.097 | [-0.0451, 0.5434] | 28.3% |
| `degree_stem` | 0.2628** | 0.1075 | 0.0145 | [0.0521, 0.4735] | 30.05% |
| `skill_cloud` | 0.0231 | 0.1231 | 0.8511 | [-0.2182, 0.2644] | 2.34% |
| `skill_ml_ai` | 0.1918 | 0.1366 | 0.1602 | [-0.0759, 0.4595] | 21.14% |
| `remote_eligible` | 0.3259** | 0.1572 | 0.0382 | [0.0177, 0.634] | 38.52% |
| `hourly_original` | 0.0628 | 0.1623 | 0.6989 | [-0.2553, 0.3809] | 6.48% |
| `mandate_state` | -0.1964* | 0.1098 | 0.0738 | [-0.4117, 0.0189] | -17.83% |
| `region_northeast` | 0.0468 | 0.2517 | 0.8526 | [-0.4466, 0.5401] | 4.79% |
| `region_south` | 0.3098*** | 0.1169 | 0.008 | [0.0808, 0.5389] | 36.32% |
| `region_west` | 0.3619*** | 0.1223 | 0.0031 | [0.1221, 0.6017] | 43.61% |
| `industry_data_center` | -0.8843*** | 0.269 | 0.001 | [-1.4116, -0.3571] | -58.7% |
| `family_ai_ml` | 0.111 | 0.2475 | 0.6538 | [-0.374, 0.596] | 11.74% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 355, R² = 0.3474, adjusted R² = 0.3342, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6913*** | 0.1243 | 0.0 | [0.4476, 0.935] | — |
| `mandate_state` | 0.3213*** | 0.1119 | 0.0041 | [0.1019, 0.5407] | 37.89% |
| `seniority_rank` | -0.0033 | 0.0141 | 0.8182 | [-0.031, 0.0245] | -0.32% |
| `remote_eligible` | -0.0551 | 0.1161 | 0.6352 | [-0.2826, 0.1724] | -5.36% |
| `industry_data_center` | -0.1926 | 0.1575 | 0.2214 | [-0.5013, 0.1161] | -17.52% |
| `region_northeast` | -0.0217 | 0.096 | 0.8207 | [-0.2098, 0.1663] | -2.15% |
| `region_south` | -0.2753** | 0.1341 | 0.0401 | [-0.5381, -0.0124] | -24.06% |
| `region_west` | 0.005 | 0.0777 | 0.9482 | [-0.1472, 0.1572] | 0.51% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 55, R² = 0.4771, adjusted R² = 0.2941, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4171*** | 0.1443 | 0.0 | [11.1342, 11.7] | — |
| `seniority_rank` | 0.0771 | 0.0729 | 0.2902 | [-0.0658, 0.22] | 8.01% |
| `yrs_exp_min` | 0.0009 | 0.0364 | 0.9797 | [-0.0705, 0.0723] | 0.09% |
| `yrs_exp_stated` | 0.0091 | 0.1098 | 0.9342 | [-0.2062, 0.2243] | 0.91% |
| `degree_required` | -0.0235 | 0.0421 | 0.5759 | [-0.106, 0.0589] | -2.33% |
| `degree_stem` | 0.0696 | 0.0462 | 0.1321 | [-0.021, 0.1603] | 7.21% |
| `skill_cloud` | 0.3643* | 0.1928 | 0.0588 | [-0.0136, 0.7422] | 43.95% |
| `skill_ml_ai` | -0.151 | 0.1428 | 0.2906 | [-0.4309, 0.129] | -14.01% |
| `remote_eligible` | -0.0339 | 0.0651 | 0.6024 | [-0.1615, 0.0937] | -3.33% |
| `mandate_state` | 0.0363 | 0.0805 | 0.6524 | [-0.1215, 0.1941] | 3.69% |
| `region_northeast` | -0.0474 | 0.0707 | 0.5029 | [-0.1861, 0.0913] | -4.63% |
| `region_south` | -0.0375 | 0.1063 | 0.7245 | [-0.2457, 0.1708] | -3.68% |
| `region_west` | 0.0443 | 0.0707 | 0.531 | [-0.0942, 0.1827] | 4.53% |
| `industry_data_center` | -0.1083 | 0.0743 | 0.1447 | [-0.2539, 0.0372] | -10.27% |
| `family_ai_ml` | 0.5449*** | 0.1672 | 0.0011 | [0.2172, 0.8727] | 72.45% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 254, R² = 0.5301, adjusted R² = 0.5004, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3939*** | 0.0442 | 0.0 | [11.3072, 11.4806] | — |
| `seniority_rank` | 0.1096*** | 0.0075 | 0.0 | [0.095, 0.1243] | 11.59% |
| `yrs_exp_min` | 0.0171** | 0.0085 | 0.0425 | [0.0006, 0.0337] | 1.73% |
| `yrs_exp_stated` | -0.0236 | 0.0384 | 0.5383 | [-0.0989, 0.0516] | -2.34% |
| `degree_required` | -0.0035 | 0.0341 | 0.9187 | [-0.0703, 0.0633] | -0.35% |
| `degree_stem` | 0.0245 | 0.0327 | 0.4535 | [-0.0396, 0.0887] | 2.48% |
| `skill_cloud` | 0.1436*** | 0.0329 | 0.0 | [0.079, 0.2081] | 15.44% |
| `skill_ml_ai` | -0.0053 | 0.0341 | 0.8777 | [-0.0722, 0.0617] | -0.52% |
| `remote_eligible` | 0.0577* | 0.0323 | 0.074 | [-0.0056, 0.1211] | 5.94% |
| `hourly_original` | -0.2992 | 0.2834 | 0.2911 | [-0.8548, 0.2563] | -25.86% |
| `mandate_state` | -0.0801** | 0.036 | 0.0262 | [-0.1507, -0.0095] | -7.69% |
| `region_northeast` | 0.0308 | 0.0384 | 0.4233 | [-0.0445, 0.1061] | 3.12% |
| `region_south` | 0.0483 | 0.0436 | 0.2674 | [-0.0371, 0.1337] | 4.95% |
| `region_west` | -0.0039 | 0.0292 | 0.8925 | [-0.0611, 0.0532] | -0.39% |
| `industry_data_center` | -0.0257 | 0.0573 | 0.6544 | [-0.1381, 0.0867] | -2.53% |
| `family_ai_ml` | 0.0741 | 0.0476 | 0.1198 | [-0.0192, 0.1674] | 7.69% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 37 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1083 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0159 | 0.0691 | 0.2061 | unchanged (null) |
| `yrs_exp_stated` | -0.0246 | 0.5115 | 0.513 | unchanged (null) |
| `degree_required` | 0.0012 | 0.9704 | 0.9733 | unchanged (null) |
| `degree_stem` | 0.0194 | 0.5143 | 0.5333 | unchanged (null) |
| `skill_cloud` | 0.1412 | 0.0 | 0.0022 | unchanged (significant) |
| `skill_ml_ai` | 0.0201 | 0.6068 | 0.624 | unchanged (null) |
| `remote_eligible` | 0.0531 | 0.0792 | 0.0725 | unchanged (null) |
| `hourly_original` | -0.2661 | 0.3838 | 0.8467 | unchanged (null) |
| `mandate_state` | -0.0246 | 0.4044 | 0.4323 | unchanged (null) |
| `region_northeast` | 0.107 | 0.0025 | 0.0058 | unchanged (significant) |
| `region_south` | 0.0706 | 0.1131 | 0.2488 | unchanged (null) |
| `region_west` | 0.0513 | 0.177 | 0.1704 | unchanged (null) |
| `industry_data_center` | 0.0075 | 0.8984 | 0.9025 | unchanged (null) |
| `family_ai_ml` | 0.0427 | 0.3943 | 0.4452 | unchanged (null) |

No variable's significance verdict changes at the 0.05 level. The clustered p-values survive the bootstrap here; that is a result of the check, not a reason to have skipped it.

## Disclosure selection

Disclosure rate: **0.749** (266 disclosed, 89 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.117 | 3.461 | -0.344 | 0.0619 |
| `yrs_exp_min` | 1.417 | 1.854 | -0.437 | 0.1727 |
| `yrs_exp_stated` | 0.368 | 0.494 | -0.126 | 0.0406 |
| `degree_required` | 0.737 | 0.629 | 0.108 | 0.0664 |
| `degree_stem` | 0.305 | 0.404 | -0.1 | 0.0949 |
| `skill_cloud` | 0.12 | 0.079 | 0.042 | 0.2352 |
| `skill_ml_ai` | 0.211 | 0.236 | -0.025 | 0.6238 |
| `remote_eligible` | 0.109 | 0.157 | -0.048 | 0.2666 |
| `hourly_original` | 0.011 | 0.0 | 0.011 | 0.0833 |
| `mandate_state` | 0.707 | 0.146 | 0.561 | 0.0 |
| `region_northeast` | 0.289 | 0.101 | 0.188 | 0.0 |
| `region_south` | 0.165 | 0.629 | -0.464 | 0.0 |
| `region_west` | 0.237 | 0.045 | 0.192 | 0.0 |
| `industry_data_center` | 0.079 | 0.281 | -0.202 | 0.0001 |
| `family_ai_ml` | 0.09 | 0.056 | 0.034 | 0.2611 |
| `metro_indianapolis` | 0.015 | 0.09 | -0.075 | 0.019 |


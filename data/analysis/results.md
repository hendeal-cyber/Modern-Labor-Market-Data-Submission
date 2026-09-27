# Results

- Postings in scope: **353**
- With disclosed pay: **264**
- Used in estimation: **264**
- Distinct employers in the estimation sample (**the cluster count**): **36**
- Distinct employers across all postings in scope: **49**

Regressor budget at 20 observations each: **13** (specification used: **core**).

Minimum detectable standardized effect: **0.1779** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 264, R² = 0.5432, adjusted R² = 0.5155, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3213*** | 0.0351 | 0.0 | [11.2525, 11.39] | — |
| `seniority_rank` | 0.1123*** | 0.0076 | 0.0 | [0.0975, 0.1272] | 11.89% |
| `yrs_exp_min` | 0.0146* | 0.0087 | 0.0932 | [-0.0024, 0.0315] | 1.47% |
| `yrs_exp_stated` | -0.021 | 0.0386 | 0.5866 | [-0.0967, 0.0547] | -2.08% |
| `degree_required` | 0.0033 | 0.0329 | 0.921 | [-0.0612, 0.0677] | 0.33% |
| `degree_stem` | 0.0135 | 0.0302 | 0.6541 | [-0.0457, 0.0728] | 1.36% |
| `skill_cloud` | 0.148*** | 0.0327 | 0.0 | [0.084, 0.2121] | 15.96% |
| `skill_ml_ai` | 0.0149 | 0.0373 | 0.6894 | [-0.0582, 0.088] | 1.5% |
| `remote_eligible` | 0.0573* | 0.0314 | 0.0683 | [-0.0043, 0.1189] | 5.9% |
| `hourly_original` | 0.0662** | 0.0312 | 0.0337 | [0.0051, 0.1273] | 6.85% |
| `mandate_state` | -0.0322 | 0.0283 | 0.2546 | [-0.0876, 0.0232] | -3.17% |
| `region_northeast` | 0.1067*** | 0.0364 | 0.0034 | [0.0353, 0.1781] | 11.26% |
| `region_south` | 0.0818** | 0.0405 | 0.0434 | [0.0024, 0.1612] | 8.53% |
| `region_west` | 0.0414 | 0.0348 | 0.2342 | [-0.0268, 0.1097] | 4.23% |
| `industry_data_center` | 0.0107 | 0.0584 | 0.8544 | [-0.1038, 0.1252] | 1.08% |
| `family_ai_ml` | 0.0421 | 0.0505 | 0.4049 | [-0.057, 0.1411] | 4.3% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 259, R² = 0.3313, adjusted R² = 0.29, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.6982*** | 0.1833 | 0.0 | [9.339, 10.0575] | — |
| `seniority_rank` | 0.1117*** | 0.0322 | 0.0005 | [0.0485, 0.1749] | 11.82% |
| `yrs_exp_min` | -0.0127 | 0.0273 | 0.6422 | [-0.0662, 0.0408] | -1.26% |
| `yrs_exp_stated` | 0.0464 | 0.1259 | 0.7127 | [-0.2004, 0.2932] | 4.75% |
| `degree_required` | 0.2466 | 0.1504 | 0.1011 | [-0.0482, 0.5414] | 27.97% |
| `degree_stem` | 0.2644** | 0.107 | 0.0134 | [0.0548, 0.474] | 30.27% |
| `skill_cloud` | 0.0211 | 0.1235 | 0.8643 | [-0.2209, 0.2631] | 2.13% |
| `skill_ml_ai` | 0.1952 | 0.1377 | 0.1563 | [-0.0747, 0.4651] | 21.56% |
| `remote_eligible` | 0.3145** | 0.1587 | 0.0476 | [0.0034, 0.6256] | 36.95% |
| `hourly_original` | 0.063 | 0.1621 | 0.6973 | [-0.2546, 0.3807] | 6.51% |
| `mandate_state` | -0.1929* | 0.1123 | 0.0859 | [-0.4131, 0.0272] | -17.55% |
| `region_northeast` | 0.0486 | 0.2521 | 0.8471 | [-0.4455, 0.5427] | 4.98% |
| `region_south` | 0.3125*** | 0.1183 | 0.0083 | [0.0806, 0.5444] | 36.68% |
| `region_west` | 0.3627*** | 0.1229 | 0.0032 | [0.1218, 0.6037] | 43.72% |
| `industry_data_center` | -0.8824*** | 0.2688 | 0.001 | [-1.4093, -0.3554] | -58.62% |
| `family_ai_ml` | 0.1121 | 0.2482 | 0.6515 | [-0.3743, 0.5985] | 11.86% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 353, R² = 0.3573, adjusted R² = 0.3443, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6948*** | 0.1245 | 0.0 | [0.4508, 0.9387] | — |
| `mandate_state` | 0.3242*** | 0.1138 | 0.0044 | [0.1012, 0.5472] | 38.3% |
| `seniority_rank` | -0.0048 | 0.0141 | 0.7328 | [-0.0324, 0.0228] | -0.48% |
| `remote_eligible` | -0.0465 | 0.1193 | 0.6964 | [-0.2804, 0.1873] | -4.55% |
| `industry_data_center` | -0.1864 | 0.1574 | 0.2363 | [-0.4949, 0.1221] | -17.0% |
| `region_northeast` | -0.0233 | 0.0967 | 0.8093 | [-0.2129, 0.1662] | -2.31% |
| `region_south` | -0.2864** | 0.1365 | 0.0359 | [-0.5538, -0.0189] | -24.9% |
| `region_west` | 0.0019 | 0.078 | 0.9803 | [-0.1509, 0.1547] | 0.19% |

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

N = 253, R² = 0.5481, adjusted R² = 0.5195, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3891*** | 0.0439 | 0.0 | [11.303, 11.4752] | — |
| `seniority_rank` | 0.1132*** | 0.0071 | 0.0 | [0.0992, 0.1271] | 11.98% |
| `yrs_exp_min` | 0.0159* | 0.0084 | 0.0592 | [-0.0006, 0.0325] | 1.61% |
| `yrs_exp_stated` | -0.0193 | 0.0398 | 0.6272 | [-0.0972, 0.0586] | -1.91% |
| `degree_required` | -0.0029 | 0.0349 | 0.9333 | [-0.0713, 0.0654] | -0.29% |
| `degree_stem` | 0.0194 | 0.0329 | 0.5559 | [-0.0451, 0.0839] | 1.96% |
| `skill_cloud` | 0.1508*** | 0.0327 | 0.0 | [0.0867, 0.215] | 16.28% |
| `skill_ml_ai` | -0.0088 | 0.033 | 0.7904 | [-0.0734, 0.0559] | -0.87% |
| `remote_eligible` | 0.0595* | 0.0332 | 0.0731 | [-0.0056, 0.1245] | 6.13% |
| `hourly_original` | 0.0074 | 0.0286 | 0.7946 | [-0.0486, 0.0635] | 0.75% |
| `mandate_state` | -0.0865** | 0.0344 | 0.0119 | [-0.154, -0.0191] | -8.29% |
| `region_northeast` | 0.0304 | 0.039 | 0.4357 | [-0.0461, 0.1069] | 3.09% |
| `region_south` | 0.0585 | 0.0404 | 0.1477 | [-0.0207, 0.1378] | 6.03% |
| `region_west` | -0.0135 | 0.0255 | 0.5955 | [-0.0634, 0.0364] | -1.34% |
| `industry_data_center` | -0.0205 | 0.0568 | 0.718 | [-0.1319, 0.0908] | -2.03% |
| `family_ai_ml` | 0.0742 | 0.0477 | 0.1195 | [-0.0192, 0.1677] | 7.71% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 36 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1123 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0146 | 0.0932 | 0.2458 | unchanged (null) |
| `yrs_exp_stated` | -0.021 | 0.5866 | 0.5894 | unchanged (null) |
| `degree_required` | 0.0033 | 0.921 | 0.9239 | unchanged (null) |
| `degree_stem` | 0.0135 | 0.6541 | 0.6636 | unchanged (null) |
| `skill_cloud` | 0.148 | 0.0 | 0.0015 | unchanged (significant) |
| `skill_ml_ai` | 0.0149 | 0.6894 | 0.7022 | unchanged (null) |
| `remote_eligible` | 0.0573 | 0.0683 | 0.0867 | unchanged (null) |
| `hourly_original` | 0.0662 | 0.0337 | 0.2712 | **no longer significant** |
| `mandate_state` | -0.0322 | 0.2546 | 0.2848 | unchanged (null) |
| `region_northeast` | 0.1067 | 0.0034 | 0.0101 | unchanged (significant) |
| `region_south` | 0.0818 | 0.0434 | 0.1505 | **no longer significant** |
| `region_west` | 0.0414 | 0.2342 | 0.207 | unchanged (null) |
| `industry_data_center` | 0.0107 | 0.8544 | 0.87 | unchanged (null) |
| `family_ai_ml` | 0.0421 | 0.4049 | 0.4578 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `hourly_original`, `region_south`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.748** (264 disclosed, 89 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.102 | 3.461 | -0.358 | 0.052 |
| `yrs_exp_min` | 1.428 | 1.742 | -0.314 | 0.3071 |
| `yrs_exp_stated` | 0.371 | 0.483 | -0.112 | 0.0687 |
| `degree_required` | 0.735 | 0.629 | 0.106 | 0.0719 |
| `degree_stem` | 0.307 | 0.404 | -0.098 | 0.1031 |
| `skill_cloud` | 0.121 | 0.079 | 0.043 | 0.2262 |
| `skill_ml_ai` | 0.212 | 0.236 | -0.024 | 0.6462 |
| `remote_eligible` | 0.106 | 0.146 | -0.04 | 0.3444 |
| `hourly_original` | 0.008 | 0.0 | 0.008 | 0.1577 |
| `mandate_state` | 0.712 | 0.146 | 0.566 | 0.0 |
| `region_northeast` | 0.292 | 0.101 | 0.191 | 0.0 |
| `region_south` | 0.163 | 0.64 | -0.478 | 0.0 |
| `region_west` | 0.239 | 0.045 | 0.194 | 0.0 |
| `industry_data_center` | 0.08 | 0.281 | -0.201 | 0.0001 |
| `family_ai_ml` | 0.091 | 0.056 | 0.035 | 0.2528 |
| `metro_indianapolis` | 0.015 | 0.09 | -0.075 | 0.0192 |


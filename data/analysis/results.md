# Results

- Postings in scope: **183**
- With disclosed pay: **146**
- Used in estimation: **146**
- Distinct employers in the estimation sample (**the cluster count**): **29**
- Distinct employers across all postings in scope: **37**

> **These estimates are not yet interpretable.**
>
> - 9.7 observations per regressor (146 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - 29 employer clusters, against the 30 pre-registered. Cluster-robust standard errors are biased downward with few clusters, so the asymptotic p-values are anti-conservative. Read the wild cluster bootstrap p-values below, not these.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **7** (specification used: **core**).

Minimum detectable standardized effect: **0.2457** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 146, R² = 0.5714, adjusted R² = 0.522, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.304*** | 0.0726 | 0.0 | [11.1618, 11.4463] | — |
| `seniority_rank` | 0.0614*** | 0.0162 | 0.0002 | [0.0297, 0.0932] | 6.33% |
| `yrs_exp_min` | -0.0046 | 0.014 | 0.7402 | [-0.0321, 0.0228] | -0.46% |
| `yrs_exp_stated` | -0.0601 | 0.0825 | 0.4666 | [-0.2217, 0.1016] | -5.83% |
| `degree_required` | -0.0467 | 0.0621 | 0.4521 | [-0.1684, 0.075] | -4.56% |
| `degree_stem` | 0.0414 | 0.0728 | 0.57 | [-0.1013, 0.184] | 4.22% |
| `skill_cloud` | 0.1628 | 0.1208 | 0.1779 | [-0.074, 0.3996] | 17.68% |
| `skill_ml_ai` | 0.0801 | 0.1001 | 0.4233 | [-0.116, 0.2763] | 8.34% |
| `remote_eligible` | 0.2001** | 0.0781 | 0.0104 | [0.0471, 0.353] | 22.15% |
| `hourly_original` | -0.8256** | 0.3811 | 0.0303 | [-1.5726, -0.0786] | -56.2% |
| `mandate_state` | -0.131 | 0.0863 | 0.129 | [-0.3, 0.0381] | -12.27% |
| `region_northeast` | 0.3068*** | 0.0692 | 0.0 | [0.1712, 0.4424] | 35.91% |
| `region_south` | 0.3211*** | 0.0788 | 0.0 | [0.1666, 0.4757] | 37.87% |
| `region_west` | 0.2156** | 0.0974 | 0.0268 | [0.0248, 0.4065] | 24.07% |
| `industry_data_center` | 0.1074 | 0.0912 | 0.239 | [-0.0714, 0.2863] | 11.34% |
| `family_ai_ml` | -0.0181 | 0.1158 | 0.876 | [-0.2451, 0.209] | -1.79% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 137, R² = 0.1946, adjusted R² = 0.0948, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.425*** | 0.1672 | 0.0 | [10.0972, 10.7528] | — |
| `seniority_rank` | 0.0855 | 0.077 | 0.2672 | [-0.0655, 0.2365] | 8.92% |
| `yrs_exp_min` | 0.0488 | 0.0383 | 0.2022 | [-0.0262, 0.1239] | 5.01% |
| `yrs_exp_stated` | -0.0781 | 0.2427 | 0.7476 | [-0.5538, 0.3976] | -7.51% |
| `degree_required` | -0.151 | 0.1369 | 0.2699 | [-0.4193, 0.1173] | -14.02% |
| `degree_stem` | 0.2157 | 0.1477 | 0.1442 | [-0.0738, 0.5051] | 24.07% |
| `skill_cloud` | 0.0627 | 0.274 | 0.819 | [-0.4743, 0.5997] | 6.47% |
| `skill_ml_ai` | -0.2501 | 0.32 | 0.4343 | [-0.8773, 0.377] | -22.13% |
| `remote_eligible` | 0.1029 | 0.2325 | 0.658 | [-0.3528, 0.5587] | 10.84% |
| `hourly_original` | -0.5544** | 0.279 | 0.0469 | [-1.1012, -0.0076] | -42.56% |
| `mandate_state` | 0.1335 | 0.2005 | 0.5056 | [-0.2595, 0.5265] | 14.28% |
| `region_northeast` | -0.6348** | 0.2904 | 0.0288 | [-1.204, -0.0656] | -47.0% |
| `region_south` | -0.1458 | 0.1866 | 0.4347 | [-0.5116, 0.22] | -13.57% |
| `region_west` | -0.0832 | 0.1751 | 0.6346 | [-0.4264, 0.26] | -7.98% |
| `industry_data_center` | -0.8613** | 0.3887 | 0.0267 | [-1.6231, -0.0995] | -57.74% |
| `family_ai_ml` | 0.4114* | 0.2237 | 0.0659 | [-0.027, 0.8497] | 50.89% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 183, R² = 0.4062, adjusted R² = 0.3824, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.5738*** | 0.1398 | 0.0 | [0.2999, 0.8478] | — |
| `mandate_state` | 0.4033*** | 0.112 | 0.0003 | [0.1839, 0.6227] | 49.68% |
| `seniority_rank` | 0.0148 | 0.018 | 0.4101 | [-0.0204, 0.05] | 1.49% |
| `remote_eligible` | 0.1149 | 0.1063 | 0.2796 | [-0.0934, 0.3232] | 12.18% |
| `industry_data_center` | -0.247* | 0.13 | 0.0575 | [-0.5019, 0.0078] | -21.89% |
| `region_northeast` | -0.0429 | 0.1004 | 0.6689 | [-0.2398, 0.1539] | -4.2% |
| `region_south` | -0.1398 | 0.1648 | 0.3963 | [-0.4629, 0.1833] | -13.05% |
| `region_west` | 0.074 | 0.0761 | 0.3311 | [-0.0752, 0.2232] | 7.68% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 33, R² = 0.715, adjusted R² = 0.4933, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.4735*** | 0.3305 | 0.0 | [9.8257, 11.1212] | — |
| `seniority_rank` | 0.4922*** | 0.1868 | 0.0084 | [0.1261, 0.8583] | 63.59% |
| `yrs_exp_min` | -0.1635** | 0.0757 | 0.0307 | [-0.3118, -0.0152] | -15.08% |
| `yrs_exp_stated` | 0.2115 | 0.2432 | 0.3845 | [-0.2652, 0.6882] | 23.56% |
| `degree_required` | -0.091 | 0.123 | 0.4594 | [-0.3321, 0.1501] | -8.7% |
| `degree_stem` | 0.3238* | 0.1779 | 0.0688 | [-0.0249, 0.6725] | 38.24% |
| `skill_cloud` | -0.0095 | 0.3397 | 0.9778 | [-0.6754, 0.6564] | -0.94% |
| `skill_ml_ai` | 0.0172 | 0.1422 | 0.9036 | [-0.2614, 0.2959] | 1.74% |
| `remote_eligible` | -0.1286 | 0.1313 | 0.3274 | [-0.386, 0.1288] | -12.07% |
| `mandate_state` | 0.2818* | 0.1604 | 0.0789 | [-0.0325, 0.5962] | 32.56% |
| `region_northeast` | 0.1823 | 0.1603 | 0.2556 | [-0.132, 0.4965] | 19.99% |
| `region_south` | 0.1152 | 0.2479 | 0.6421 | [-0.3706, 0.601] | 12.21% |
| `region_west` | 0.1568 | 0.1536 | 0.3073 | [-0.1443, 0.4579] | 16.98% |
| `industry_data_center` | -0.1034 | 0.225 | 0.6457 | [-0.5444, 0.3375] | -9.83% |
| `family_ai_ml` | 0.3337 | 0.3342 | 0.318 | [-0.3213, 0.9888] | 39.62% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 139, R² = 0.5318, adjusted R² = 0.4747, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2849*** | 0.1043 | 0.0 | [11.0803, 11.4894] | — |
| `seniority_rank` | 0.071*** | 0.0168 | 0.0 | [0.0381, 0.1039] | 7.36% |
| `yrs_exp_min` | -0.0079 | 0.0148 | 0.5924 | [-0.0369, 0.0211] | -0.79% |
| `yrs_exp_stated` | -0.0361 | 0.0857 | 0.6738 | [-0.2041, 0.132] | -3.54% |
| `degree_required` | -0.0349 | 0.0682 | 0.6092 | [-0.1686, 0.0989] | -3.43% |
| `degree_stem` | 0.0435 | 0.0808 | 0.5901 | [-0.1149, 0.2019] | 4.45% |
| `skill_cloud` | 0.1473 | 0.1381 | 0.2862 | [-0.1234, 0.418] | 15.87% |
| `skill_ml_ai` | 0.0424 | 0.1297 | 0.7437 | [-0.2117, 0.2965] | 4.33% |
| `remote_eligible` | 0.0668 | 0.0647 | 0.3022 | [-0.0601, 0.1937] | 6.91% |
| `hourly_original` | -0.8068** | 0.3638 | 0.0266 | [-1.5199, -0.0938] | -55.37% |
| `mandate_state` | -0.1468 | 0.1127 | 0.1929 | [-0.3677, 0.0742] | -13.65% |
| `region_northeast` | 0.2796*** | 0.0751 | 0.0002 | [0.1324, 0.4269] | 32.26% |
| `region_south` | 0.3382*** | 0.0991 | 0.0006 | [0.1441, 0.5324] | 40.25% |
| `region_west` | 0.1862* | 0.1083 | 0.0854 | [-0.026, 0.3985] | 20.47% |
| `industry_data_center` | 0.1065 | 0.1158 | 0.3578 | [-0.1204, 0.3334] | 11.23% |
| `family_ai_ml` | 0.0142 | 0.1404 | 0.9193 | [-0.261, 0.2895] | 1.43% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 29 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.0614 | 0.0002 | 0.0753 | **no longer significant** |
| `yrs_exp_min` | -0.0046 | 0.7402 | 0.7427 | unchanged (null) |
| `yrs_exp_stated` | -0.0601 | 0.4666 | 0.467 | unchanged (null) |
| `degree_required` | -0.0467 | 0.4521 | 0.5299 | unchanged (null) |
| `degree_stem` | 0.0414 | 0.57 | 0.6655 | unchanged (null) |
| `skill_cloud` | 0.1628 | 0.1779 | 0.2437 | unchanged (null) |
| `skill_ml_ai` | 0.0801 | 0.4233 | 0.6454 | unchanged (null) |
| `remote_eligible` | 0.2001 | 0.0104 | 0.0129 | unchanged (significant) |
| `hourly_original` | -0.8256 | 0.0303 | 0.3147 | **no longer significant** |
| `mandate_state` | -0.131 | 0.129 | 0.1913 | unchanged (null) |
| `region_northeast` | 0.3068 | 0.0 | 0.0406 | unchanged (significant) |
| `region_south` | 0.3211 | 0.0 | 0.0186 | unchanged (significant) |
| `region_west` | 0.2156 | 0.0268 | 0.0992 | **no longer significant** |
| `industry_data_center` | 0.1074 | 0.239 | 0.323 | unchanged (null) |
| `family_ai_ml` | -0.0181 | 0.876 | 0.8912 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `seniority_rank`, `hourly_original`, `region_west`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.798** (146 disclosed, 37 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.692 | 2.784 | -0.092 | 0.6436 |
| `yrs_exp_min` | 1.377 | 1.703 | -0.326 | 0.4555 |
| `yrs_exp_stated` | 0.384 | 0.486 | -0.103 | 0.2711 |
| `degree_required` | 0.719 | 0.676 | 0.044 | 0.617 |
| `degree_stem` | 0.384 | 0.351 | 0.032 | 0.7195 |
| `skill_cloud` | 0.171 | 0.216 | -0.045 | 0.5534 |
| `skill_ml_ai` | 0.233 | 0.243 | -0.01 | 0.8969 |
| `remote_eligible` | 0.096 | 0.108 | -0.012 | 0.8318 |
| `hourly_original` | 0.062 | 0.0 | 0.062 | 0.0024 |
| `mandate_state` | 0.74 | 0.054 | 0.686 | 0.0 |
| `region_northeast` | 0.185 | 0.108 | 0.077 | 0.2121 |
| `region_south` | 0.171 | 0.568 | -0.396 | 0.0 |
| `region_west` | 0.26 | 0.027 | 0.233 | 0.0 |
| `industry_data_center` | 0.123 | 0.378 | -0.255 | 0.0045 |
| `family_ai_ml` | 0.11 | 0.054 | 0.056 | 0.2287 |
| `metro_indianapolis` | 0.021 | 0.135 | -0.115 | 0.056 |


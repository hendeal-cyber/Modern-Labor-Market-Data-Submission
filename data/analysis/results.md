# Results

- Postings in scope: **183**
- With disclosed pay: **147**
- Used in estimation: **147**
- Distinct employers in the estimation sample (**the cluster count**): **29**
- Distinct employers across all postings in scope: **37**

> **These estimates are not yet interpretable.**
>
> - 9.8 observations per regressor (147 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - 29 employer clusters, against the 30 pre-registered. Cluster-robust standard errors are biased downward with few clusters, so the asymptotic p-values are anti-conservative. Read the wild cluster bootstrap p-values below, not these.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **7** (specification used: **core**).

Minimum detectable standardized effect: **0.2448** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 147, R² = 0.4104, adjusted R² = 0.3429, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4393*** | 0.04 | 0.0 | [11.3609, 11.5177] | — |
| `seniority_rank` | 0.0776*** | 0.0083 | 0.0 | [0.0613, 0.094] | 8.07% |
| `yrs_exp_min` | 0.0045 | 0.0132 | 0.7326 | [-0.0213, 0.0304] | 0.45% |
| `yrs_exp_stated` | -0.0756 | 0.0946 | 0.4241 | [-0.261, 0.1098] | -7.28% |
| `degree_required` | -0.0264 | 0.0355 | 0.4564 | [-0.096, 0.0431] | -2.61% |
| `degree_stem` | 0.0888* | 0.0509 | 0.0808 | [-0.0109, 0.1886] | 9.29% |
| `skill_cloud` | 0.0728 | 0.1104 | 0.5094 | [-0.1435, 0.2892] | 7.55% |
| `skill_ml_ai` | 0.0949 | 0.0913 | 0.2989 | [-0.0841, 0.2738] | 9.95% |
| `remote_eligible` | 0.1008 | 0.0634 | 0.1117 | [-0.0234, 0.225] | 10.6% |
| `hourly_original` | -0.065 | 0.2264 | 0.774 | [-0.5086, 0.3786] | -6.29% |
| `mandate_state` | -0.1784*** | 0.0555 | 0.0013 | [-0.2872, -0.0696] | -16.34% |
| `region_northeast` | 0.125** | 0.0542 | 0.021 | [0.0188, 0.2312] | 13.31% |
| `region_south` | 0.143*** | 0.0502 | 0.0044 | [0.0446, 0.2414] | 15.37% |
| `region_west` | 0.0449 | 0.0388 | 0.2471 | [-0.0311, 0.1209] | 4.59% |
| `industry_data_center` | 0.1165 | 0.0726 | 0.1086 | [-0.0258, 0.2589] | 12.36% |
| `family_ai_ml` | -0.0186 | 0.1345 | 0.8899 | [-0.2821, 0.2449] | -1.84% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 137, R² = 0.225, adjusted R² = 0.129, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.2076*** | 0.1668 | 0.0 | [9.8807, 10.5345] | — |
| `seniority_rank` | 0.1088 | 0.0686 | 0.1125 | [-0.0256, 0.2432] | 11.5% |
| `yrs_exp_min` | 0.0236 | 0.0299 | 0.4305 | [-0.035, 0.0822] | 2.39% |
| `yrs_exp_stated` | 0.1075 | 0.2172 | 0.6206 | [-0.3182, 0.5332] | 11.35% |
| `degree_required` | -0.2772** | 0.1271 | 0.0291 | [-0.5263, -0.0282] | -24.21% |
| `degree_stem` | 0.3097** | 0.1311 | 0.0182 | [0.0528, 0.5667] | 36.31% |
| `skill_cloud` | 0.0309 | 0.2905 | 0.9154 | [-0.5384, 0.6002] | 3.14% |
| `skill_ml_ai` | -0.1925 | 0.3183 | 0.5455 | [-0.8164, 0.4315] | -17.51% |
| `remote_eligible` | 0.1208 | 0.2264 | 0.5937 | [-0.323, 0.5646] | 12.84% |
| `hourly_original` | 0.2324** | 0.1069 | 0.0297 | [0.0229, 0.442] | 26.17% |
| `mandate_state` | -0.0067 | 0.1724 | 0.9691 | [-0.3446, 0.3312] | -0.67% |
| `region_northeast` | -0.3962 | 0.2462 | 0.1076 | [-0.8788, 0.0864] | -32.71% |
| `region_south` | 0.0499 | 0.1384 | 0.7187 | [-0.2215, 0.3212] | 5.11% |
| `region_west` | 0.0046 | 0.1397 | 0.9735 | [-0.2691, 0.2784] | 0.46% |
| `industry_data_center` | -0.75** | 0.3619 | 0.0382 | [-1.4593, -0.0407] | -52.76% |
| `family_ai_ml` | 0.4965* | 0.287 | 0.0836 | [-0.0659, 1.059] | 64.3% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 183, R² = 0.4114, adjusted R² = 0.3879, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.598*** | 0.1382 | 0.0 | [0.3272, 0.8688] | — |
| `mandate_state` | 0.3919*** | 0.1118 | 0.0005 | [0.1727, 0.611] | 47.97% |
| `seniority_rank` | 0.011 | 0.0168 | 0.5108 | [-0.0218, 0.0439] | 1.11% |
| `remote_eligible` | 0.1707 | 0.1047 | 0.1029 | [-0.0345, 0.3759] | 18.62% |
| `industry_data_center` | -0.2627** | 0.1275 | 0.0394 | [-0.5127, -0.0127] | -23.1% |
| `region_northeast` | -0.0539 | 0.101 | 0.5937 | [-0.2518, 0.144] | -5.25% |
| `region_south` | -0.1473 | 0.1646 | 0.3707 | [-0.4699, 0.1753] | -13.7% |
| `region_west` | 0.0713 | 0.0749 | 0.341 | [-0.0754, 0.218] | 7.39% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 34, R² = 0.7625, adjusted R² = 0.5874, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.2541*** | 0.2301 | 0.0 | [9.8032, 10.7049] | — |
| `seniority_rank` | 0.7565*** | 0.1371 | 0.0 | [0.4878, 1.0252] | 113.08% |
| `yrs_exp_min` | -0.1368** | 0.0565 | 0.0155 | [-0.2476, -0.0261] | -12.79% |
| `yrs_exp_stated` | -0.1178 | 0.1431 | 0.4106 | [-0.3983, 0.1628] | -11.11% |
| `degree_required` | 0.0186 | 0.063 | 0.7673 | [-0.1049, 0.1422] | 1.88% |
| `degree_stem` | 0.3253*** | 0.1196 | 0.0065 | [0.0909, 0.5598] | 38.45% |
| `skill_cloud` | -0.1705 | 0.2244 | 0.4475 | [-0.6104, 0.2694] | -15.67% |
| `skill_ml_ai` | 0.0251 | 0.097 | 0.796 | [-0.165, 0.2152] | 2.54% |
| `remote_eligible` | -0.232* | 0.1274 | 0.0686 | [-0.4818, 0.0177] | -20.71% |
| `mandate_state` | 0.441*** | 0.0911 | 0.0 | [0.2624, 0.6196] | 55.43% |
| `region_northeast` | 0.1652* | 0.0898 | 0.0659 | [-0.0108, 0.3412] | 17.96% |
| `region_south` | -0.0088 | 0.1583 | 0.9555 | [-0.3191, 0.3015] | -0.88% |
| `region_west` | 0.0045 | 0.0772 | 0.9538 | [-0.1469, 0.1559] | 0.45% |
| `industry_data_center` | -0.2339 | 0.1649 | 0.156 | [-0.557, 0.0893] | -20.85% |
| `family_ai_ml` | 0.5295** | 0.2104 | 0.0119 | [0.1171, 0.9419] | 69.8% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 139, R² = 0.3891, adjusted R² = 0.3146, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4783*** | 0.0604 | 0.0 | [11.3599, 11.5968] | — |
| `seniority_rank` | 0.086*** | 0.0092 | 0.0 | [0.068, 0.104] | 8.98% |
| `yrs_exp_min` | 0.0041 | 0.0139 | 0.767 | [-0.0232, 0.0315] | 0.41% |
| `yrs_exp_stated` | -0.0698 | 0.1028 | 0.4969 | [-0.2713, 0.1316] | -6.74% |
| `degree_required` | -0.0158 | 0.0415 | 0.7034 | [-0.0972, 0.0655] | -1.57% |
| `degree_stem` | 0.0943* | 0.0573 | 0.0995 | [-0.0179, 0.2066] | 9.89% |
| `skill_cloud` | 0.0492 | 0.1323 | 0.7102 | [-0.2101, 0.3084] | 5.04% |
| `skill_ml_ai` | 0.0901 | 0.1159 | 0.437 | [-0.1371, 0.3174] | 9.43% |
| `remote_eligible` | 0.1012 | 0.0669 | 0.1303 | [-0.0299, 0.2322] | 10.65% |
| `hourly_original` | -0.0909 | 0.2013 | 0.6514 | [-0.4854, 0.3036] | -8.69% |
| `mandate_state` | -0.2388*** | 0.0711 | 0.0008 | [-0.3782, -0.0995] | -21.25% |
| `region_northeast` | 0.063 | 0.0597 | 0.2915 | [-0.054, 0.18] | 6.5% |
| `region_south` | 0.1125* | 0.0613 | 0.0666 | [-0.0077, 0.2326] | 11.9% |
| `region_west` | -0.0111 | 0.039 | 0.7751 | [-0.0875, 0.0652] | -1.11% |
| `industry_data_center` | 0.1334 | 0.0885 | 0.132 | [-0.0402, 0.3069] | 14.27% |
| `family_ai_ml` | -0.0037 | 0.1586 | 0.9813 | [-0.3145, 0.3071] | -0.37% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 29 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.0776 | 0.0 | 0.0003 | unchanged (significant) |
| `yrs_exp_min` | 0.0045 | 0.7326 | 0.7347 | unchanged (null) |
| `yrs_exp_stated` | -0.0756 | 0.4241 | 0.5021 | unchanged (null) |
| `degree_required` | -0.0264 | 0.4564 | 0.4925 | unchanged (null) |
| `degree_stem` | 0.0888 | 0.0808 | 0.212 | unchanged (null) |
| `skill_cloud` | 0.0728 | 0.5094 | 0.5581 | unchanged (null) |
| `skill_ml_ai` | 0.0949 | 0.2989 | 0.4186 | unchanged (null) |
| `remote_eligible` | 0.1008 | 0.1117 | 0.1514 | unchanged (null) |
| `hourly_original` | -0.065 | 0.774 | 0.7851 | unchanged (null) |
| `mandate_state` | -0.1784 | 0.0013 | 0.0478 | unchanged (significant) |
| `region_northeast` | 0.125 | 0.021 | 0.1309 | **no longer significant** |
| `region_south` | 0.143 | 0.0044 | 0.0552 | **no longer significant** |
| `region_west` | 0.0449 | 0.2471 | 0.3455 | unchanged (null) |
| `industry_data_center` | 0.1165 | 0.1086 | 0.1314 | unchanged (null) |
| `family_ai_ml` | -0.0186 | 0.8899 | 0.9159 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `region_northeast`, `region_south`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.803** (147 disclosed, 36 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.687 | 2.806 | -0.118 | 0.5567 |
| `yrs_exp_min` | 1.374 | 1.722 | -0.348 | 0.435 |
| `yrs_exp_stated` | 0.388 | 0.472 | -0.084 | 0.3706 |
| `degree_required` | 0.721 | 0.667 | 0.054 | 0.5386 |
| `degree_stem` | 0.388 | 0.333 | 0.054 | 0.5448 |
| `skill_cloud` | 0.17 | 0.222 | -0.052 | 0.5005 |
| `skill_ml_ai` | 0.231 | 0.25 | -0.019 | 0.8184 |
| `remote_eligible` | 0.102 | 0.083 | 0.019 | 0.7255 |
| `hourly_original` | 0.02 | 0.0 | 0.02 | 0.0833 |
| `mandate_state` | 0.735 | 0.056 | 0.679 | 0.0 |
| `region_northeast` | 0.184 | 0.111 | 0.073 | 0.2466 |
| `region_south` | 0.17 | 0.583 | -0.413 | 0.0 |
| `region_west` | 0.259 | 0.028 | 0.231 | 0.0 |
| `industry_data_center` | 0.122 | 0.389 | -0.266 | 0.0037 |
| `family_ai_ml` | 0.109 | 0.056 | 0.053 | 0.2559 |
| `metro_indianapolis` | 0.02 | 0.139 | -0.118 | 0.0541 |


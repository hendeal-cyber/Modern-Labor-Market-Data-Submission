# Results

- Postings in scope: **156**
- With disclosed pay: **120**
- Used in estimation: **120**
- Distinct employers in the estimation sample (**the cluster count**): **25**
- Distinct employers across all postings in scope: **32**

> **These estimates are not yet interpretable.**
>
> - 8.0 observations per regressor (120 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - 25 employer clusters, against the 30 pre-registered. Cluster-robust standard errors are biased downward with few clusters, so the asymptotic p-values are anti-conservative. Read the wild cluster bootstrap p-values below, not these.
> - Minimum detectable effect is 0.27 log points, roughly a 32% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **6** (specification used: **core**).

Minimum detectable standardized effect: **0.2747** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 120, R² = 0.5497, adjusted R² = 0.4848, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2995*** | 0.0445 | 0.0 | [11.2122, 11.3867] | — |
| `seniority_rank` | 0.0718*** | 0.0087 | 0.0 | [0.0548, 0.0889] | 7.45% |
| `yrs_exp_min` | 0.0021 | 0.0112 | 0.8487 | [-0.0199, 0.0241] | 0.21% |
| `yrs_exp_stated` | -0.0433 | 0.1031 | 0.6747 | [-0.2454, 0.1588] | -4.24% |
| `degree_required` | -0.0892* | 0.0539 | 0.0979 | [-0.1948, 0.0164] | -8.53% |
| `degree_stem` | 0.0964 | 0.0602 | 0.1095 | [-0.0216, 0.2144] | 10.12% |
| `skill_cloud` | 0.1026 | 0.1074 | 0.3395 | [-0.1079, 0.313] | 10.8% |
| `skill_ml_ai` | 0.122 | 0.0948 | 0.1983 | [-0.0639, 0.3078] | 12.97% |
| `remote_eligible` | 0.1808*** | 0.061 | 0.0031 | [0.0611, 0.3004] | 19.81% |
| `hourly_original` | 0.0033 | 0.2387 | 0.989 | [-0.4646, 0.4712] | 0.33% |
| `mandate_state` | -0.1401** | 0.0703 | 0.0465 | [-0.2779, -0.0022] | -13.07% |
| `region_northeast` | 0.1945** | 0.0798 | 0.0148 | [0.0381, 0.3509] | 21.47% |
| `region_south` | 0.2793*** | 0.0567 | 0.0 | [0.1681, 0.3905] | 32.22% |
| `region_west` | 0.1363*** | 0.0444 | 0.0021 | [0.0493, 0.2233] | 14.61% |
| `industry_data_center` | 0.1428* | 0.0802 | 0.075 | [-0.0144, 0.3] | 15.35% |
| `family_ai_ml` | -0.0234 | 0.1162 | 0.8405 | [-0.251, 0.2043] | -2.31% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 111, R² = 0.1965, adjusted R² = 0.0696, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.2699*** | 0.164 | 0.0 | [9.9486, 10.5913] | — |
| `seniority_rank` | 0.0867 | 0.0866 | 0.3167 | [-0.083, 0.2564] | 9.06% |
| `yrs_exp_min` | 0.0621 | 0.0472 | 0.1881 | [-0.0304, 0.1546] | 6.41% |
| `yrs_exp_stated` | -0.1104 | 0.3073 | 0.7193 | [-0.7127, 0.4918] | -10.45% |
| `degree_required` | -0.0933 | 0.1111 | 0.4011 | [-0.311, 0.1245] | -8.91% |
| `degree_stem` | 0.1623 | 0.1253 | 0.1953 | [-0.0833, 0.4079] | 17.62% |
| `skill_cloud` | -0.0793 | 0.2954 | 0.7884 | [-0.6583, 0.4997] | -7.62% |
| `skill_ml_ai` | -0.1949 | 0.3513 | 0.579 | [-0.8834, 0.4936] | -17.71% |
| `remote_eligible` | 0.2065 | 0.231 | 0.3714 | [-0.2463, 0.6592] | 22.93% |
| `hourly_original` | -0.0211 | 0.2295 | 0.9267 | [-0.4709, 0.4287] | -2.09% |
| `mandate_state` | 0.2242 | 0.1882 | 0.2334 | [-0.1446, 0.593] | 25.13% |
| `region_northeast` | -0.726** | 0.3088 | 0.0187 | [-1.3312, -0.1208] | -51.62% |
| `region_south` | -0.1265 | 0.2185 | 0.5625 | [-0.5548, 0.3017] | -11.88% |
| `region_west` | -0.101 | 0.1777 | 0.5697 | [-0.4494, 0.2473] | -9.61% |
| `industry_data_center` | -0.8295** | 0.3862 | 0.0317 | [-1.5864, -0.0727] | -56.37% |
| `family_ai_ml` | 0.6259*** | 0.2332 | 0.0073 | [0.1689, 1.0829] | 86.99% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 156, R² = 0.53, adjusted R² = 0.5078, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.4052*** | 0.1298 | 0.0018 | [0.1508, 0.6596] | — |
| `mandate_state` | 0.5609*** | 0.1115 | 0.0 | [0.3424, 0.7793] | 75.22% |
| `seniority_rank` | 0.001 | 0.0182 | 0.9548 | [-0.0346, 0.0367] | 0.1% |
| `remote_eligible` | 0.2819*** | 0.0878 | 0.0013 | [0.1098, 0.4541] | 32.57% |
| `industry_data_center` | -0.2237* | 0.1269 | 0.0779 | [-0.4725, 0.025] | -20.05% |
| `region_northeast` | -0.1085 | 0.0836 | 0.1944 | [-0.2724, 0.0554] | -10.28% |
| `region_south` | -0.0097 | 0.1432 | 0.9459 | [-0.2904, 0.271] | -0.97% |
| `region_west` | 0.1262* | 0.0734 | 0.0857 | [-0.0177, 0.2701] | 13.45% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 29, R² = 0.7871, adjusted R² = 0.5742, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.5003*** | 0.1991 | 0.0 | [10.1101, 10.8905] | — |
| `seniority_rank` | 0.2935* | 0.1543 | 0.0572 | [-0.0089, 0.5959] | 34.11% |
| `yrs_exp_min` | -0.1631*** | 0.0363 | 0.0 | [-0.2342, -0.0921] | -15.05% |
| `yrs_exp_stated` | 0.2531 | 0.1827 | 0.1659 | [-0.1049, 0.6112] | 28.81% |
| `degree_required` | -0.0999 | 0.1736 | 0.5651 | [-0.4401, 0.2403] | -9.5% |
| `degree_stem` | 0.2524 | 0.1614 | 0.118 | [-0.064, 0.5688] | 28.71% |
| `skill_cloud` | -0.1455 | 0.1859 | 0.4337 | [-0.5098, 0.2188] | -13.54% |
| `skill_ml_ai` | 0.1021 | 0.0734 | 0.1641 | [-0.0417, 0.246] | 10.75% |
| `remote_eligible` | -0.053 | 0.0947 | 0.5756 | [-0.2386, 0.1326] | -5.16% |
| `mandate_state` | 0.4234*** | 0.1057 | 0.0001 | [0.2162, 0.6306] | 52.72% |
| `region_northeast` | 0.4807* | 0.2814 | 0.0876 | [-0.0709, 1.0322] | 61.71% |
| `region_south` | 0.3678* | 0.1931 | 0.0567 | [-0.0106, 0.7462] | 44.46% |
| `region_west` | 0.2287 | 0.1894 | 0.2273 | [-0.1426, 0.6] | 25.7% |
| `industry_data_center` | -0.0015 | 0.1987 | 0.9941 | [-0.3909, 0.3879] | -0.15% |
| `family_ai_ml` | 0.5171** | 0.2189 | 0.0182 | [0.0881, 0.9462] | 67.72% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 113, R² = 0.4953, adjusted R² = 0.4172, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2639*** | 0.0898 | 0.0 | [11.0879, 11.4398] | — |
| `seniority_rank` | 0.0783*** | 0.009 | 0.0 | [0.0608, 0.0959] | 8.15% |
| `yrs_exp_min` | 0.0024 | 0.0111 | 0.8261 | [-0.0194, 0.0243] | 0.25% |
| `yrs_exp_stated` | -0.0293 | 0.1103 | 0.7906 | [-0.2456, 0.1869] | -2.89% |
| `degree_required` | -0.0807 | 0.0593 | 0.1734 | [-0.1968, 0.0355] | -7.75% |
| `degree_stem` | 0.0951 | 0.0693 | 0.1696 | [-0.0406, 0.2309] | 9.98% |
| `skill_cloud` | 0.082 | 0.1202 | 0.4949 | [-0.1536, 0.3177] | 8.55% |
| `skill_ml_ai` | 0.1049 | 0.1261 | 0.4054 | [-0.1422, 0.3521] | 11.06% |
| `remote_eligible` | 0.1049 | 0.0931 | 0.2596 | [-0.0775, 0.2874] | 11.06% |
| `hourly_original` | -0.0346 | 0.216 | 0.8727 | [-0.4579, 0.3887] | -3.4% |
| `mandate_state` | -0.1316 | 0.1108 | 0.2349 | [-0.3488, 0.0855] | -12.33% |
| `region_northeast` | 0.157** | 0.071 | 0.027 | [0.0178, 0.2961] | 17.0% |
| `region_south` | 0.2968*** | 0.0607 | 0.0 | [0.1779, 0.4157] | 34.55% |
| `region_west` | 0.1057** | 0.05 | 0.0346 | [0.0076, 0.2038] | 11.15% |
| `industry_data_center` | 0.1465 | 0.1072 | 0.1718 | [-0.0636, 0.3566] | 15.78% |
| `family_ai_ml` | 0.0118 | 0.1541 | 0.939 | [-0.2902, 0.3138] | 1.19% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 25 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.0718 | 0.0 | 0.009 | unchanged (significant) |
| `yrs_exp_min` | 0.0021 | 0.8487 | 0.8636 | unchanged (null) |
| `yrs_exp_stated` | -0.0433 | 0.6747 | 0.68 | unchanged (null) |
| `degree_required` | -0.0892 | 0.0979 | 0.3568 | unchanged (null) |
| `degree_stem` | 0.0964 | 0.1095 | 0.3368 | unchanged (null) |
| `skill_cloud` | 0.1026 | 0.3395 | 0.3704 | unchanged (null) |
| `skill_ml_ai` | 0.122 | 0.1983 | 0.2702 | unchanged (null) |
| `remote_eligible` | 0.1808 | 0.0031 | 0.0261 | unchanged (significant) |
| `hourly_original` | 0.0033 | 0.989 | 0.9741 | unchanged (null) |
| `mandate_state` | -0.1401 | 0.0465 | 0.1586 | **no longer significant** |
| `region_northeast` | 0.1945 | 0.0148 | 0.1401 | **no longer significant** |
| `region_south` | 0.2793 | 0.0 | 0.0024 | unchanged (significant) |
| `region_west` | 0.1363 | 0.0021 | 0.0559 | **no longer significant** |
| `industry_data_center` | 0.1428 | 0.075 | 0.1315 | unchanged (null) |
| `family_ai_ml` | -0.0234 | 0.8405 | 0.8173 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `mandate_state`, `region_northeast`, `region_west`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.769** (120 disclosed, 36 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.65 | 2.806 | -0.156 | 0.4585 |
| `yrs_exp_min` | 1.35 | 1.75 | -0.4 | 0.3731 |
| `yrs_exp_stated` | 0.383 | 0.5 | -0.117 | 0.2272 |
| `degree_required` | 0.733 | 0.694 | 0.039 | 0.6595 |
| `degree_stem` | 0.392 | 0.361 | 0.031 | 0.7429 |
| `skill_cloud` | 0.183 | 0.222 | -0.039 | 0.6233 |
| `skill_ml_ai` | 0.242 | 0.25 | -0.008 | 0.9204 |
| `remote_eligible` | 0.117 | 0.083 | 0.033 | 0.5481 |
| `hourly_original` | 0.025 | 0.0 | 0.025 | 0.0833 |
| `mandate_state` | 0.817 | 0.056 | 0.761 | 0.0 |
| `region_northeast` | 0.108 | 0.111 | -0.003 | 0.9634 |
| `region_south` | 0.2 | 0.583 | -0.383 | 0.0001 |
| `region_west` | 0.317 | 0.028 | 0.289 | 0.0 |
| `industry_data_center` | 0.15 | 0.389 | -0.239 | 0.0098 |
| `family_ai_ml` | 0.108 | 0.056 | 0.053 | 0.2757 |
| `metro_indianapolis` | 0.025 | 0.139 | -0.114 | 0.0658 |


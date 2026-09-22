# Results

- Postings in scope: **325**
- With disclosed pay: **231**
- Used in estimation: **231**
- Distinct employers in the estimation sample (**the cluster count**): **36**
- Distinct employers across all postings in scope: **47**

Regressor budget at 20 observations each: **11** (specification used: **core**).

Minimum detectable standardized effect: **0.1911** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 231, R² = 0.4405, adjusted R² = 0.4015, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3746*** | 0.0452 | 0.0 | [11.286, 11.4631] | — |
| `seniority_rank` | 0.0915*** | 0.0094 | 0.0 | [0.073, 0.11] | 9.58% |
| `yrs_exp_min` | 0.0145 | 0.0144 | 0.3143 | [-0.0137, 0.0427] | 1.46% |
| `yrs_exp_stated` | -0.0763 | 0.0746 | 0.3065 | [-0.2225, 0.07] | -7.35% |
| `degree_required` | 0.001 | 0.0347 | 0.9767 | [-0.0669, 0.0689] | 0.1% |
| `degree_stem` | 0.0664 | 0.0491 | 0.1768 | [-0.0299, 0.1627] | 6.86% |
| `skill_cloud` | 0.0562 | 0.0748 | 0.453 | [-0.0905, 0.2028] | 5.78% |
| `skill_ml_ai` | 0.0584 | 0.0666 | 0.3811 | [-0.0722, 0.189] | 6.01% |
| `remote_eligible` | 0.0685 | 0.0518 | 0.1862 | [-0.0331, 0.17] | 7.09% |
| `hourly_original` | -0.1166 | 0.2123 | 0.583 | [-0.5328, 0.2996] | -11.0% |
| `mandate_state` | -0.1707*** | 0.0561 | 0.0024 | [-0.2808, -0.0607] | -15.7% |
| `region_northeast` | 0.1929*** | 0.0586 | 0.001 | [0.0781, 0.3077] | 21.28% |
| `region_south` | 0.1889*** | 0.0492 | 0.0001 | [0.0925, 0.2852] | 20.79% |
| `region_west` | 0.1161*** | 0.0356 | 0.0011 | [0.0464, 0.1858] | 12.31% |
| `industry_data_center` | 0.1082* | 0.0625 | 0.0835 | [-0.0143, 0.2306] | 11.42% |
| `family_ai_ml` | -0.0257 | 0.1098 | 0.8153 | [-0.241, 0.1896] | -2.53% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 214, R² = 0.2732, adjusted R² = 0.2181, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.8749*** | 0.1615 | 0.0 | [9.5584, 10.1914] | — |
| `seniority_rank` | 0.1252*** | 0.0445 | 0.0049 | [0.038, 0.2125] | 13.34% |
| `yrs_exp_min` | 0.044 | 0.0312 | 0.1587 | [-0.0172, 0.1052] | 4.5% |
| `yrs_exp_stated` | 0.1263 | 0.1828 | 0.4898 | [-0.232, 0.4846] | 13.46% |
| `degree_required` | 0.0361 | 0.1115 | 0.7463 | [-0.1824, 0.2545] | 3.67% |
| `degree_stem` | 0.2628** | 0.1322 | 0.0468 | [0.0037, 0.5219] | 30.05% |
| `skill_cloud` | 0.0396 | 0.2323 | 0.8646 | [-0.4158, 0.495] | 4.04% |
| `skill_ml_ai` | -0.0133 | 0.2448 | 0.9567 | [-0.493, 0.4664] | -1.32% |
| `remote_eligible` | 0.1059 | 0.2638 | 0.6881 | [-0.4112, 0.623] | 11.17% |
| `hourly_original` | 0.1555 | 0.1329 | 0.2422 | [-0.1051, 0.416] | 16.82% |
| `mandate_state` | 0.08 | 0.1541 | 0.6039 | [-0.2221, 0.3821] | 8.33% |
| `region_northeast` | -0.5165** | 0.244 | 0.0343 | [-0.9947, -0.0383] | -40.34% |
| `region_south` | 0.0924 | 0.1407 | 0.5112 | [-0.1833, 0.3681] | 9.68% |
| `region_west` | 0.005 | 0.1352 | 0.9705 | [-0.26, 0.27] | 0.5% |
| `industry_data_center` | -0.7653** | 0.352 | 0.0297 | [-1.4552, -0.0754] | -53.48% |
| `family_ai_ml` | 0.2913 | 0.2947 | 0.323 | [-0.2864, 0.869] | 33.82% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 325, R² = 0.3993, adjusted R² = 0.386, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6206*** | 0.1257 | 0.0 | [0.3741, 0.867] | — |
| `mandate_state` | 0.4144*** | 0.1037 | 0.0001 | [0.2112, 0.6176] | 51.35% |
| `seniority_rank` | -0.0063 | 0.0138 | 0.6479 | [-0.0334, 0.0208] | -0.63% |
| `remote_eligible` | -0.0957 | 0.1443 | 0.5074 | [-0.3786, 0.1872] | -9.12% |
| `industry_data_center` | -0.2799* | 0.1489 | 0.0601 | [-0.5717, 0.0119] | -24.42% |
| `region_northeast` | -0.0666 | 0.1003 | 0.5066 | [-0.2633, 0.13] | -6.45% |
| `region_south` | -0.17 | 0.1317 | 0.1969 | [-0.4282, 0.0882] | -15.63% |
| `region_west` | 0.0382 | 0.0683 | 0.5761 | [-0.0957, 0.172] | 3.89% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 49, R² = 0.564, adjusted R² = 0.3845, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.9768*** | 0.2897 | 0.0 | [10.4089, 11.5446] | — |
| `seniority_rank` | 0.3489** | 0.1707 | 0.0409 | [0.0144, 0.6835] | 41.75% |
| `yrs_exp_min` | -0.1067* | 0.0636 | 0.0938 | [-0.2314, 0.0181] | -10.12% |
| `yrs_exp_stated` | -0.0154 | 0.0974 | 0.8741 | [-0.2063, 0.1755] | -1.53% |
| `degree_required` | -0.005 | 0.0648 | 0.9383 | [-0.132, 0.122] | -0.5% |
| `degree_stem` | 0.2624*** | 0.1007 | 0.0092 | [0.065, 0.4597] | 30.0% |
| `skill_cloud` | 0.2276 | 0.1893 | 0.2291 | [-0.1433, 0.5986] | 25.56% |
| `skill_ml_ai` | 0.0031 | 0.0644 | 0.9619 | [-0.1231, 0.1293] | 0.31% |
| `remote_eligible` | -0.1523 | 0.1031 | 0.1397 | [-0.3545, 0.0498] | -14.13% |
| `mandate_state` | 0.0996 | 0.1295 | 0.4421 | [-0.1543, 0.3534] | 10.47% |
| `region_northeast` | -0.0406 | 0.1335 | 0.7608 | [-0.3023, 0.2211] | -3.98% |
| `region_south` | -0.0032 | 0.1368 | 0.9812 | [-0.2714, 0.2649] | -0.32% |
| `region_west` | 0.1152 | 0.0825 | 0.1626 | [-0.0465, 0.277] | 12.21% |
| `industry_data_center` | 0.0287 | 0.1503 | 0.8483 | [-0.2658, 0.3233] | 2.92% |
| `family_ai_ml` | -0.0359 | 0.3334 | 0.9142 | [-0.6893, 0.6175] | -3.53% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 222, R² = 0.444, adjusted R² = 0.4035, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4299*** | 0.055 | 0.0 | [11.3221, 11.5377] | — |
| `seniority_rank` | 0.0927*** | 0.0095 | 0.0 | [0.0742, 0.1113] | 9.72% |
| `yrs_exp_min` | 0.0147 | 0.0145 | 0.3103 | [-0.0137, 0.0432] | 1.48% |
| `yrs_exp_stated` | -0.0736 | 0.0774 | 0.3419 | [-0.2253, 0.0781] | -7.09% |
| `degree_required` | 0.0046 | 0.037 | 0.9001 | [-0.0678, 0.0771] | 0.47% |
| `degree_stem` | 0.0733 | 0.054 | 0.1746 | [-0.0325, 0.179] | 7.6% |
| `skill_cloud` | 0.0307 | 0.0846 | 0.7171 | [-0.1352, 0.1966] | 3.11% |
| `skill_ml_ai` | 0.0342 | 0.0746 | 0.6468 | [-0.112, 0.1804] | 3.48% |
| `remote_eligible` | 0.0497 | 0.0573 | 0.3855 | [-0.0625, 0.1619] | 5.1% |
| `hourly_original` | -0.1505 | 0.186 | 0.4184 | [-0.515, 0.214] | -13.97% |
| `mandate_state` | -0.2233*** | 0.0681 | 0.0011 | [-0.3568, -0.0897] | -20.01% |
| `region_northeast` | 0.1311** | 0.0651 | 0.0438 | [0.0036, 0.2586] | 14.01% |
| `region_south` | 0.1689*** | 0.056 | 0.0026 | [0.0591, 0.2788] | 18.41% |
| `region_west` | 0.0633* | 0.035 | 0.0709 | [-0.0054, 0.132] | 6.53% |
| `industry_data_center` | 0.1094 | 0.0702 | 0.1194 | [-0.0283, 0.2471] | 11.56% |
| `family_ai_ml` | 0.0112 | 0.1279 | 0.9305 | [-0.2396, 0.2619] | 1.12% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 36 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.0915 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0145 | 0.3143 | 0.4443 | unchanged (null) |
| `yrs_exp_stated` | -0.0763 | 0.3065 | 0.3551 | unchanged (null) |
| `degree_required` | 0.001 | 0.9767 | 0.9772 | unchanged (null) |
| `degree_stem` | 0.0664 | 0.1768 | 0.3039 | unchanged (null) |
| `skill_cloud` | 0.0562 | 0.453 | 0.4755 | unchanged (null) |
| `skill_ml_ai` | 0.0584 | 0.3811 | 0.4369 | unchanged (null) |
| `remote_eligible` | 0.0685 | 0.1862 | 0.221 | unchanged (null) |
| `hourly_original` | -0.1166 | 0.583 | 0.782 | unchanged (null) |
| `mandate_state` | -0.1707 | 0.0024 | 0.0446 | unchanged (significant) |
| `region_northeast` | 0.1929 | 0.001 | 0.0285 | unchanged (significant) |
| `region_south` | 0.1889 | 0.0001 | 0.0128 | unchanged (significant) |
| `region_west` | 0.1161 | 0.0011 | 0.0384 | unchanged (significant) |
| `industry_data_center` | 0.1082 | 0.0835 | 0.1253 | unchanged (null) |
| `family_ai_ml` | -0.0257 | 0.8153 | 0.8416 | unchanged (null) |

No variable's significance verdict changes at the 0.05 level. The clustered p-values survive the bootstrap here; that is a result of the check, not a reason to have skipped it.

## Disclosure selection

Disclosure rate: **0.711** (231 disclosed, 94 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.043 | 3.5 | -0.457 | 0.0082 |
| `yrs_exp_min` | 1.45 | 1.766 | -0.316 | 0.2957 |
| `yrs_exp_stated` | 0.377 | 0.457 | -0.081 | 0.1851 |
| `degree_required` | 0.697 | 0.606 | 0.091 | 0.1268 |
| `degree_stem` | 0.29 | 0.394 | -0.104 | 0.0802 |
| `skill_cloud` | 0.121 | 0.106 | 0.015 | 0.7009 |
| `skill_ml_ai` | 0.182 | 0.298 | -0.116 | 0.0326 |
| `remote_eligible` | 0.082 | 0.17 | -0.088 | 0.0426 |
| `hourly_original` | 0.013 | 0.0 | 0.013 | 0.0833 |
| `mandate_state` | 0.727 | 0.128 | 0.6 | 0.0 |
| `region_northeast` | 0.251 | 0.106 | 0.145 | 0.0009 |
| `region_south` | 0.195 | 0.564 | -0.369 | 0.0 |
| `region_west` | 0.238 | 0.053 | 0.185 | 0.0 |
| `industry_data_center` | 0.1 | 0.383 | -0.283 | 0.0 |
| `family_ai_ml` | 0.074 | 0.043 | 0.031 | 0.2533 |
| `metro_indianapolis` | 0.013 | 0.096 | -0.083 | 0.0097 |


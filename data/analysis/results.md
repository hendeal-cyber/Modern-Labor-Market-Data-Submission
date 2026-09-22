# Results

- Postings in scope: **204**
- With disclosed pay: **137**
- Used in estimation: **137**
- Distinct employers in the estimation sample (**the cluster count**): **23**
- Distinct employers across all postings in scope: **30**

> **These estimates are not yet interpretable.**
>
> - 9.1 observations per regressor (137 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - 23 employer clusters, against the 30 pre-registered. Cluster-robust standard errors are biased downward with few clusters, so the asymptotic p-values are anti-conservative. Read the wild cluster bootstrap p-values below, not these.
> - Minimum detectable effect is 0.25 log points, roughly a 29% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Minimum detectable standardized effect: **0.2385** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 154, R² = 0.516, adjusted R² = 0.4634, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2984*** | 0.0463 | 0.0 | [11.2076, 11.3892] | — |
| `seniority_rank` | 0.0754*** | 0.0077 | 0.0 | [0.0604, 0.0905] | 7.84% |
| `yrs_exp_min` | 0.0131 | 0.0114 | 0.2506 | [-0.0093, 0.0355] | 1.32% |
| `yrs_exp_stated` | -0.0674 | 0.0751 | 0.3693 | [-0.2146, 0.0798] | -6.52% |
| `degree_required` | -0.102*** | 0.0377 | 0.0069 | [-0.1759, -0.028] | -9.69% |
| `degree_stem` | 0.1008** | 0.0473 | 0.0331 | [0.0081, 0.1935] | 10.6% |
| `skill_cloud` | -0.0304 | 0.0706 | 0.6668 | [-0.1688, 0.108] | -3.0% |
| `skill_ml_ai` | 0.1764*** | 0.063 | 0.0051 | [0.0529, 0.2998] | 19.29% |
| `remote_eligible` | 0.1384*** | 0.0474 | 0.0035 | [0.0455, 0.2314] | 14.85% |
| `hourly_original` | -0.0024 | 0.253 | 0.9924 | [-0.4984, 0.4935] | -0.24% |
| `mandate_state` | -0.1114* | 0.0668 | 0.0953 | [-0.2424, 0.0195] | -10.55% |
| `region_northeast` | 0.2009** | 0.0942 | 0.0329 | [0.0163, 0.3855] | 22.25% |
| `region_south` | 0.2174*** | 0.069 | 0.0016 | [0.0821, 0.3527] | 24.28% |
| `region_west` | 0.1** | 0.0487 | 0.0401 | [0.0045, 0.1956] | 10.52% |
| `industry_data_center` | 0.166** | 0.0784 | 0.0343 | [0.0123, 0.3197] | 18.06% |
| `family_ai_ml` | 0.0498 | 0.076 | 0.5121 | [-0.0991, 0.1988] | 5.11% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 145, R² = 0.2405, adjusted R² = 0.1521, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.337*** | 0.1546 | 0.0 | [10.0341, 10.64] | — |
| `seniority_rank` | 0.0592 | 0.0765 | 0.4389 | [-0.0907, 0.2092] | 6.1% |
| `yrs_exp_min` | 0.0867** | 0.0432 | 0.0447 | [0.002, 0.1713] | 9.05% |
| `yrs_exp_stated` | -0.3222 | 0.2587 | 0.213 | [-0.8292, 0.1849] | -27.54% |
| `degree_required` | -0.0444 | 0.0773 | 0.566 | [-0.1959, 0.1072] | -4.34% |
| `degree_stem` | 0.1593 | 0.1122 | 0.1556 | [-0.0606, 0.3792] | 17.27% |
| `skill_cloud` | -0.0109 | 0.142 | 0.9387 | [-0.2893, 0.2675] | -1.09% |
| `skill_ml_ai` | -0.0338 | 0.2542 | 0.8942 | [-0.5321, 0.4645] | -3.32% |
| `remote_eligible` | 0.2765** | 0.1377 | 0.0446 | [0.0067, 0.5464] | 31.85% |
| `hourly_original` | -0.1189 | 0.2227 | 0.5935 | [-0.5553, 0.3176] | -11.21% |
| `mandate_state` | 0.2323* | 0.1406 | 0.0986 | [-0.0433, 0.5078] | 26.14% |
| `region_northeast` | -0.8039*** | 0.2735 | 0.0033 | [-1.34, -0.2678] | -55.24% |
| `region_south` | 0.0001 | 0.1578 | 0.9997 | [-0.3092, 0.3093] | 0.01% |
| `region_west` | -0.0709 | 0.1625 | 0.6627 | [-0.3895, 0.2477] | -6.84% |
| `industry_data_center` | -0.8654** | 0.3898 | 0.0264 | [-1.6294, -0.1013] | -57.91% |
| `family_ai_ml` | 0.2866 | 0.1805 | 0.1122 | [-0.0671, 0.6403] | 33.19% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 221, R² = 0.3673, adjusted R² = 0.3465, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.5057*** | 0.1428 | 0.0004 | [0.2257, 0.7856] | — |
| `mandate_state` | 0.3572** | 0.1513 | 0.0182 | [0.0606, 0.6538] | 42.93% |
| `seniority_rank` | 0.0135 | 0.015 | 0.3676 | [-0.0159, 0.043] | 1.36% |
| `remote_eligible` | 0.3173*** | 0.1091 | 0.0036 | [0.1034, 0.5312] | 37.34% |
| `industry_data_center` | -0.1669* | 0.0989 | 0.0915 | [-0.3607, 0.0269] | -15.37% |
| `region_northeast` | -0.081 | 0.1122 | 0.4701 | [-0.301, 0.1389] | -7.79% |
| `region_south` | -0.2764** | 0.1316 | 0.0357 | [-0.5343, -0.0185] | -24.15% |
| `region_west` | 0.1527 | 0.1012 | 0.1312 | [-0.0456, 0.351] | 16.5% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 33, R² = 0.7108, adjusted R² = 0.4859, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.1599*** | 0.3139 | 0.0 | [10.5446, 11.7751] | — |
| `seniority_rank` | 0.1139 | 0.2415 | 0.637 | [-0.3594, 0.5873] | 12.07% |
| `yrs_exp_min` | -0.0592 | 0.0938 | 0.5277 | [-0.243, 0.1246] | -5.75% |
| `yrs_exp_stated` | -0.0037 | 0.3476 | 0.9916 | [-0.685, 0.6776] | -0.37% |
| `degree_required` | -0.1852** | 0.0799 | 0.0205 | [-0.3418, -0.0286] | -16.91% |
| `degree_stem` | 0.2113 | 0.1702 | 0.2145 | [-0.1224, 0.545] | 23.53% |
| `skill_cloud` | -0.0031 | 0.1044 | 0.976 | [-0.2077, 0.2014] | -0.31% |
| `skill_ml_ai` | 0.2174* | 0.1125 | 0.0533 | [-0.0031, 0.4378] | 24.28% |
| `remote_eligible` | -0.0915 | 0.1805 | 0.6124 | [-0.4453, 0.2624] | -8.74% |
| `mandate_state` | 0.0158 | 0.137 | 0.9084 | [-0.2527, 0.2842] | 1.59% |
| `region_northeast` | 0.3614* | 0.2047 | 0.0776 | [-0.0399, 0.7627] | 43.53% |
| `region_south` | 0.2363* | 0.1383 | 0.0875 | [-0.0347, 0.5074] | 26.66% |
| `region_west` | 0.2589 | 0.1791 | 0.1484 | [-0.0922, 0.61] | 29.55% |
| `industry_data_center` | 0.4019 | 0.2791 | 0.1499 | [-0.1452, 0.949] | 49.47% |
| `family_ai_ml` | -0.1961 | 0.2108 | 0.3521 | [-0.6093, 0.217] | -17.81% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 143, R² = 0.4974, adjusted R² = 0.438, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.1618*** | 0.1027 | 0.0 | [10.9606, 11.363] | — |
| `seniority_rank` | 0.0857*** | 0.0126 | 0.0 | [0.0611, 0.1104] | 8.95% |
| `yrs_exp_min` | 0.0135 | 0.0113 | 0.2322 | [-0.0086, 0.0356] | 1.36% |
| `yrs_exp_stated` | -0.042 | 0.0735 | 0.567 | [-0.186, 0.1019] | -4.12% |
| `degree_required` | -0.0826* | 0.0426 | 0.0527 | [-0.1661, 0.001] | -7.92% |
| `degree_stem` | 0.1083** | 0.053 | 0.0411 | [0.0044, 0.2123] | 11.44% |
| `skill_cloud` | -0.0344 | 0.0688 | 0.6171 | [-0.1693, 0.1005] | -3.38% |
| `skill_ml_ai` | 0.1298* | 0.0727 | 0.0743 | [-0.0127, 0.2723] | 13.86% |
| `remote_eligible` | 0.0432 | 0.0559 | 0.4397 | [-0.0664, 0.1527] | 4.41% |
| `hourly_original` | -0.0486 | 0.2222 | 0.8269 | [-0.4841, 0.3869] | -4.74% |
| `mandate_state` | -0.0464 | 0.1085 | 0.6687 | [-0.259, 0.1662] | -4.54% |
| `region_northeast` | 0.1931** | 0.0765 | 0.0115 | [0.0433, 0.343] | 21.3% |
| `region_south` | 0.294*** | 0.042 | 0.0 | [0.2117, 0.3762] | 34.17% |
| `region_west` | 0.1069** | 0.0502 | 0.0332 | [0.0085, 0.2053] | 11.28% |
| `industry_data_center` | 0.1599 | 0.1 | 0.11 | [-0.0362, 0.3559] | 17.34% |
| `family_ai_ml` | 0.0524 | 0.0832 | 0.5288 | [-0.1107, 0.2156] | 5.38% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 23 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.0679 | 0.0 | 0.0053 | unchanged (significant) |
| `yrs_exp_min` | 0.0095 | 0.5673 | 0.6197 | unchanged (null) |
| `yrs_exp_stated` | -0.091 | 0.4682 | 0.4719 | unchanged (null) |
| `degree_required` | -0.1143 | 0.0027 | 0.0693 | **no longer significant** |
| `degree_stem` | 0.1007 | 0.0396 | 0.1603 | **no longer significant** |
| `skill_cloud` | -0.0324 | 0.5737 | 0.6528 | unchanged (null) |
| `skill_ml_ai` | 0.2364 | 0.0001 | 0.0028 | unchanged (significant) |
| `remote_eligible` | 0.1539 | 0.0015 | 0.1017 | **no longer significant** |
| `hourly_original` | -0.0431 | 0.8756 | 0.7225 | unchanged (null) |
| `mandate_state` | -0.0385 | 0.5223 | 0.6351 | unchanged (null) |
| `region_northeast` | 0.2602 | 0.0184 | 0.2529 | **no longer significant** |
| `region_south` | 0.1753 | 0.0125 | 0.2117 | **no longer significant** |
| `region_west` | 0.1065 | 0.0442 | 0.2206 | **no longer significant** |
| `industry_data_center` | 0.1643 | 0.0349 | 0.102 | **no longer significant** |
| `family_ai_ml` | 0.0169 | 0.8376 | 0.8339 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `degree_required`, `degree_stem`, `remote_eligible`, `region_northeast`, `region_south`, `region_west`, `industry_data_center`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.697** (154 disclosed, 67 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 2.597 | 2.537 | 0.06 | 0.7042 |
| `yrs_exp_min` | 1.13 | 0.94 | 0.19 | 0.5171 |
| `yrs_exp_stated` | 0.325 | 0.269 | 0.056 | 0.4005 |
| `degree_required` | 0.753 | 0.821 | -0.068 | 0.2509 |
| `degree_stem` | 0.481 | 0.537 | -0.057 | 0.441 |
| `skill_cloud` | 0.286 | 0.239 | 0.047 | 0.4645 |
| `skill_ml_ai` | 0.357 | 0.358 | -0.001 | 0.988 |
| `remote_eligible` | 0.188 | 0.045 | 0.144 | 0.0005 |
| `hourly_original` | 0.019 | 0.0 | 0.019 | 0.0833 |
| `mandate_state` | 0.805 | 0.388 | 0.417 | 0.0 |
| `region_northeast` | 0.104 | 0.06 | 0.044 | 0.249 |
| `region_south` | 0.325 | 0.776 | -0.451 | 0.0 |
| `region_west` | 0.247 | 0.015 | 0.232 | 0.0 |
| `industry_data_center` | 0.117 | 0.209 | -0.092 | 0.1055 |
| `family_ai_ml` | 0.188 | 0.194 | -0.006 | 0.9217 |
| `metro_indianapolis` | 0.019 | 0.075 | -0.055 | 0.1109 |


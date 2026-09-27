# Results

- Postings in scope: **497**
- With disclosed pay: **377**
- Used in estimation: **377**
- Distinct employers in the estimation sample (**the cluster count**): **52**
- Distinct employers across all postings in scope: **73**

Regressor budget at 20 observations each: **18** (specification used: **core**).

Minimum detectable standardized effect: **0.1475** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 377, R² = 0.6547, adjusted R² = 0.6404, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2972*** | 0.0397 | 0.0 | [11.2194, 11.3751] | — |
| `seniority_rank` | 0.1136*** | 0.0093 | 0.0 | [0.0954, 0.1317] | 12.03% |
| `yrs_exp_min` | 0.0229*** | 0.0062 | 0.0002 | [0.0107, 0.0351] | 2.32% |
| `yrs_exp_stated` | -0.0436 | 0.0352 | 0.2153 | [-0.1127, 0.0254] | -4.27% |
| `degree_required` | -0.0291 | 0.0252 | 0.2476 | [-0.0785, 0.0202] | -2.87% |
| `degree_stem` | 0.0416* | 0.0245 | 0.0899 | [-0.0065, 0.0897] | 4.25% |
| `skill_cloud` | 0.0831*** | 0.0292 | 0.0045 | [0.0258, 0.1404] | 8.66% |
| `skill_ml_ai` | 0.0946** | 0.0414 | 0.0223 | [0.0135, 0.1757] | 9.92% |
| `remote_eligible` | 0.0381 | 0.0381 | 0.3166 | [-0.0365, 0.1128] | 3.89% |
| `hourly_original` | 0.0422 | 0.0385 | 0.2728 | [-0.0332, 0.1176] | 4.31% |
| `mandate_state` | 0.0006 | 0.0324 | 0.9849 | [-0.0628, 0.064] | 0.06% |
| `region_northeast` | 0.0968*** | 0.0282 | 0.0006 | [0.0415, 0.152] | 10.16% |
| `region_south` | 0.0509 | 0.0485 | 0.2939 | [-0.0442, 0.146] | 5.23% |
| `region_west` | 0.0725* | 0.0413 | 0.0793 | [-0.0085, 0.1536] | 7.52% |
| `industry_data_center` | 0.1684** | 0.0725 | 0.0202 | [0.0263, 0.3105] | 18.34% |
| `family_ai_ml` | 0.0562 | 0.0376 | 0.1345 | [-0.0174, 0.1298] | 5.78% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 372, R² = 0.3216, adjusted R² = 0.293, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.7054*** | 0.1606 | 0.0 | [9.3907, 10.0202] | — |
| `seniority_rank` | 0.1147*** | 0.0255 | 0.0 | [0.0647, 0.1648] | 12.16% |
| `yrs_exp_min` | 0.0097 | 0.0146 | 0.5072 | [-0.0189, 0.0382] | 0.97% |
| `yrs_exp_stated` | -0.035 | 0.0961 | 0.7154 | [-0.2234, 0.1533] | -3.44% |
| `degree_required` | 0.0958 | 0.0926 | 0.3007 | [-0.0856, 0.2773] | 10.06% |
| `degree_stem` | 0.228*** | 0.0774 | 0.0032 | [0.0764, 0.3797] | 25.61% |
| `skill_cloud` | -0.047 | 0.0728 | 0.5186 | [-0.1896, 0.0956] | -4.59% |
| `skill_ml_ai` | 0.3927*** | 0.1442 | 0.0065 | [0.11, 0.6754] | 48.1% |
| `remote_eligible` | 0.0449 | 0.1371 | 0.7435 | [-0.2238, 0.3135] | 4.59% |
| `hourly_original` | 0.0922 | 0.1349 | 0.4946 | [-0.1723, 0.3566] | 9.65% |
| `mandate_state` | -0.092 | 0.0955 | 0.3352 | [-0.2791, 0.0951] | -8.79% |
| `region_northeast` | -0.036 | 0.2533 | 0.887 | [-0.5325, 0.4605] | -3.54% |
| `region_south` | 0.3209*** | 0.1072 | 0.0028 | [0.1107, 0.5311] | 37.83% |
| `region_west` | 0.3884*** | 0.0956 | 0.0 | [0.201, 0.5758] | 47.46% |
| `industry_data_center` | -0.5229*** | 0.1875 | 0.0053 | [-0.8905, -0.1554] | -40.72% |
| `family_ai_ml` | 0.0736 | 0.1623 | 0.6503 | [-0.2446, 0.3917] | 7.64% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 497, R² = 0.3846, adjusted R² = 0.3758, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6958*** | 0.107 | 0.0 | [0.486, 0.9055] | — |
| `mandate_state` | 0.3352*** | 0.0985 | 0.0007 | [0.1421, 0.5283] | 39.82% |
| `seniority_rank` | 0.0018 | 0.0123 | 0.8801 | [-0.0222, 0.0259] | 0.19% |
| `remote_eligible` | 0.0008 | 0.0887 | 0.9926 | [-0.173, 0.1746] | 0.08% |
| `industry_data_center` | -0.0627 | 0.1042 | 0.5471 | [-0.2669, 0.1415] | -6.08% |
| `region_northeast` | -0.0884 | 0.0913 | 0.3327 | [-0.2672, 0.0905] | -8.46% |
| `region_south` | -0.3784*** | 0.1115 | 0.0007 | [-0.5969, -0.1599] | -31.51% |
| `region_west` | -0.0243 | 0.0827 | 0.7686 | [-0.1863, 0.1377] | -2.4% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 64, R² = 0.4526, adjusted R² = 0.2961, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4332*** | 0.1254 | 0.0 | [11.1875, 11.6789] | — |
| `seniority_rank` | 0.0665 | 0.0706 | 0.3462 | [-0.0719, 0.2049] | 6.88% |
| `yrs_exp_min` | -0.0077 | 0.0398 | 0.8469 | [-0.0857, 0.0703] | -0.77% |
| `yrs_exp_stated` | 0.0372 | 0.0983 | 0.7054 | [-0.1556, 0.2299] | 3.79% |
| `degree_required` | -0.0821 | 0.0524 | 0.1173 | [-0.1849, 0.0206] | -7.88% |
| `degree_stem` | 0.0505 | 0.047 | 0.2823 | [-0.0416, 0.1426] | 5.18% |
| `skill_cloud` | 0.1981 | 0.1613 | 0.2193 | [-0.118, 0.5143] | 21.91% |
| `skill_ml_ai` | 0.0314 | 0.1281 | 0.8061 | [-0.2196, 0.2825] | 3.19% |
| `remote_eligible` | 0.0007 | 0.0729 | 0.9918 | [-0.1421, 0.1436] | 0.07% |
| `mandate_state` | 0.0823 | 0.0682 | 0.2275 | [-0.0514, 0.216] | 8.58% |
| `region_northeast` | -0.0772 | 0.0664 | 0.2453 | [-0.2073, 0.053] | -7.43% |
| `region_south` | -0.0862 | 0.1028 | 0.4018 | [-0.2877, 0.1153] | -8.26% |
| `region_west` | 0.0383 | 0.0647 | 0.5539 | [-0.0886, 0.1652] | 3.91% |
| `industry_data_center` | 0.0575 | 0.1262 | 0.6483 | [-0.1897, 0.3048] | 5.92% |
| `family_ai_ml` | 0.3946*** | 0.1053 | 0.0002 | [0.1881, 0.6011] | 48.38% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 353, R² = 0.6362, adjusted R² = 0.62, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3758*** | 0.0487 | 0.0 | [11.2802, 11.4713] | — |
| `seniority_rank` | 0.1144*** | 0.009 | 0.0 | [0.0967, 0.1322] | 12.12% |
| `yrs_exp_min` | 0.0216*** | 0.0058 | 0.0002 | [0.0103, 0.0329] | 2.19% |
| `yrs_exp_stated` | -0.038 | 0.0338 | 0.261 | [-0.1042, 0.0283] | -3.73% |
| `degree_required` | -0.0251 | 0.0266 | 0.3453 | [-0.0771, 0.027] | -2.48% |
| `degree_stem` | 0.0375 | 0.0259 | 0.1473 | [-0.0132, 0.0883] | 3.82% |
| `skill_cloud` | 0.0871*** | 0.0274 | 0.0015 | [0.0334, 0.1408] | 9.1% |
| `skill_ml_ai` | 0.0835** | 0.0386 | 0.0306 | [0.0078, 0.1593] | 8.71% |
| `remote_eligible` | 0.0503 | 0.0429 | 0.241 | [-0.0338, 0.1345] | 5.16% |
| `hourly_original` | 0.0027 | 0.0313 | 0.9309 | [-0.0586, 0.0641] | 0.27% |
| `mandate_state` | -0.0665* | 0.0368 | 0.0708 | [-0.1386, 0.0056] | -6.43% |
| `region_northeast` | 0.0183 | 0.0297 | 0.5384 | [-0.04, 0.0766] | 1.85% |
| `region_south` | 0.0139 | 0.0462 | 0.7631 | [-0.0766, 0.1045] | 1.4% |
| `region_west` | -0.005 | 0.0305 | 0.87 | [-0.0647, 0.0547] | -0.5% |
| `industry_data_center` | 0.1545** | 0.0665 | 0.0202 | [0.0241, 0.2848] | 16.7% |
| `family_ai_ml` | 0.0704* | 0.036 | 0.0507 | [-0.0002, 0.141] | 7.29% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 52 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1136 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0229 | 0.0002 | 0.0021 | unchanged (significant) |
| `yrs_exp_stated` | -0.0436 | 0.2153 | 0.2233 | unchanged (null) |
| `degree_required` | -0.0291 | 0.2476 | 0.3003 | unchanged (null) |
| `degree_stem` | 0.0416 | 0.0899 | 0.1043 | unchanged (null) |
| `skill_cloud` | 0.0831 | 0.0045 | 0.034 | unchanged (significant) |
| `skill_ml_ai` | 0.0946 | 0.0223 | 0.0523 | **no longer significant** |
| `remote_eligible` | 0.0381 | 0.3166 | 0.4673 | unchanged (null) |
| `hourly_original` | 0.0422 | 0.2728 | 0.4202 | unchanged (null) |
| `mandate_state` | 0.0006 | 0.9849 | 0.9868 | unchanged (null) |
| `region_northeast` | 0.0968 | 0.0006 | 0.0006 | unchanged (significant) |
| `region_south` | 0.0509 | 0.2939 | 0.427 | unchanged (null) |
| `region_west` | 0.0725 | 0.0793 | 0.0935 | unchanged (null) |
| `industry_data_center` | 0.1684 | 0.0202 | 0.1914 | **no longer significant** |
| `family_ai_ml` | 0.0562 | 0.1345 | 0.1972 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `skill_ml_ai`, `industry_data_center`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.759** (377 disclosed, 120 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.316 | 3.375 | -0.059 | 0.7024 |
| `yrs_exp_min` | 2.101 | 1.775 | 0.326 | 0.2489 |
| `yrs_exp_stated` | 0.44 | 0.483 | -0.043 | 0.4134 |
| `degree_required` | 0.637 | 0.575 | 0.062 | 0.2345 |
| `degree_stem` | 0.371 | 0.367 | 0.005 | 0.9265 |
| `skill_cloud` | 0.194 | 0.108 | 0.085 | 0.0156 |
| `skill_ml_ai` | 0.347 | 0.208 | 0.139 | 0.002 |
| `remote_eligible` | 0.141 | 0.133 | 0.007 | 0.8404 |
| `hourly_original` | 0.005 | 0.0 | 0.005 | 0.1576 |
| `mandate_state` | 0.735 | 0.142 | 0.593 | 0.0 |
| `region_northeast` | 0.249 | 0.117 | 0.133 | 0.0004 |
| `region_south` | 0.143 | 0.683 | -0.54 | 0.0 |
| `region_west` | 0.342 | 0.033 | 0.309 | 0.0 |
| `industry_data_center` | 0.196 | 0.208 | -0.012 | 0.7771 |
| `family_ai_ml` | 0.098 | 0.058 | 0.04 | 0.1328 |
| `metro_indianapolis` | 0.011 | 0.067 | -0.056 | 0.0183 |


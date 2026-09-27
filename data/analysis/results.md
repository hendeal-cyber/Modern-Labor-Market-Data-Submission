# Results

- Postings in scope: **484**
- With disclosed pay: **365**
- Used in estimation: **365**
- Distinct employers in the estimation sample (**the cluster count**): **52**
- Distinct employers across all postings in scope: **73**

Regressor budget at 20 observations each: **18** (specification used: **core**).

Minimum detectable standardized effect: **0.15** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 365, R² = 0.6534, adjusted R² = 0.6385, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.2994*** | 0.0397 | 0.0 | [11.2216, 11.3772] | — |
| `seniority_rank` | 0.1128*** | 0.0096 | 0.0 | [0.094, 0.1317] | 11.94% |
| `yrs_exp_min` | 0.0229*** | 0.0064 | 0.0003 | [0.0104, 0.0353] | 2.31% |
| `yrs_exp_stated` | -0.0447 | 0.0361 | 0.2161 | [-0.1154, 0.0261] | -4.37% |
| `degree_required` | -0.0291 | 0.026 | 0.262 | [-0.08, 0.0218] | -2.87% |
| `degree_stem` | 0.0465** | 0.0237 | 0.0495 | [0.0001, 0.0929] | 4.76% |
| `skill_cloud` | 0.0807*** | 0.0293 | 0.0059 | [0.0233, 0.1381] | 8.4% |
| `skill_ml_ai` | 0.0956** | 0.0421 | 0.0232 | [0.013, 0.1781] | 10.03% |
| `remote_eligible` | 0.0387 | 0.0384 | 0.3143 | [-0.0366, 0.114] | 3.94% |
| `hourly_original` | 0.0398 | 0.0391 | 0.3084 | [-0.0368, 0.1164] | 4.06% |
| `mandate_state` | -0.0016 | 0.0326 | 0.9619 | [-0.0655, 0.0624] | -0.16% |
| `region_northeast` | 0.0946*** | 0.032 | 0.0032 | [0.0318, 0.1573] | 9.92% |
| `region_south` | 0.0512 | 0.0486 | 0.2924 | [-0.0441, 0.1464] | 5.25% |
| `region_west` | 0.074* | 0.0419 | 0.077 | [-0.008, 0.1561] | 7.68% |
| `industry_data_center` | 0.1684** | 0.0725 | 0.0202 | [0.0263, 0.3105] | 18.34% |
| `family_ai_ml` | 0.0551 | 0.0374 | 0.1408 | [-0.0182, 0.1284] | 5.66% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 360, R² = 0.3023, adjusted R² = 0.2719, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 9.7081*** | 0.1585 | 0.0 | [9.3975, 10.0187] | — |
| `seniority_rank` | 0.1107*** | 0.0275 | 0.0001 | [0.0567, 0.1646] | 11.7% |
| `yrs_exp_min` | 0.0103 | 0.0146 | 0.4833 | [-0.0184, 0.039] | 1.03% |
| `yrs_exp_stated` | -0.0237 | 0.1024 | 0.8173 | [-0.2244, 0.1771] | -2.34% |
| `degree_required` | 0.1082 | 0.1003 | 0.2804 | [-0.0883, 0.3048] | 11.43% |
| `degree_stem` | 0.2306*** | 0.0792 | 0.0036 | [0.0753, 0.3859] | 25.93% |
| `skill_cloud` | -0.0491 | 0.0732 | 0.5025 | [-0.1925, 0.0944] | -4.79% |
| `skill_ml_ai` | 0.3719*** | 0.1417 | 0.0087 | [0.0941, 0.6496] | 45.04% |
| `remote_eligible` | 0.0357 | 0.1324 | 0.7872 | [-0.2238, 0.2953] | 3.64% |
| `hourly_original` | 0.0794 | 0.1368 | 0.5618 | [-0.1888, 0.3476] | 8.26% |
| `mandate_state` | -0.0868 | 0.0982 | 0.3765 | [-0.2792, 0.1056] | -8.31% |
| `region_northeast` | 0.0415 | 0.2362 | 0.8606 | [-0.4214, 0.5043] | 4.24% |
| `region_south` | 0.3192*** | 0.1075 | 0.003 | [0.1085, 0.5299] | 37.6% |
| `region_west` | 0.3877*** | 0.0956 | 0.0001 | [0.2002, 0.5752] | 47.36% |
| `industry_data_center` | -0.5109*** | 0.1866 | 0.0062 | [-0.8767, -0.1452] | -40.01% |
| `family_ai_ml` | 0.0627 | 0.1561 | 0.6876 | [-0.2431, 0.3686] | 6.48% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 3: pay disclosed (linear probability)

N = 484, R² = 0.388, adjusted R² = 0.379, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 0.6865*** | 0.1071 | 0.0 | [0.4767, 0.8963] | — |
| `mandate_state` | 0.3404*** | 0.0986 | 0.0006 | [0.1471, 0.5338] | 40.56% |
| `seniority_rank` | 0.0042 | 0.0122 | 0.7283 | [-0.0197, 0.0282] | 0.43% |
| `remote_eligible` | -0.0001 | 0.0892 | 0.9992 | [-0.1749, 0.1747] | -0.01% |
| `industry_data_center` | -0.0633 | 0.1042 | 0.5437 | [-0.2675, 0.141] | -6.13% |
| `region_northeast` | -0.0907 | 0.096 | 0.3446 | [-0.2787, 0.0974] | -8.67% |
| `region_south` | -0.3786*** | 0.1116 | 0.0007 | [-0.5972, -0.1599] | -31.51% |
| `region_west` | -0.0282 | 0.0828 | 0.7333 | [-0.1905, 0.1341] | -2.78% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Model 4: early-career subsample (original question)

N = 61, R² = 0.46, adjusted R² = 0.2957, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4309*** | 0.126 | 0.0 | [11.1839, 11.6778] | — |
| `seniority_rank` | 0.0616 | 0.0689 | 0.3715 | [-0.0735, 0.1966] | 6.35% |
| `yrs_exp_min` | -0.0187 | 0.0438 | 0.669 | [-0.1046, 0.0671] | -1.86% |
| `yrs_exp_stated` | 0.0494 | 0.1192 | 0.6786 | [-0.1842, 0.2829] | 5.06% |
| `degree_required` | -0.0796 | 0.056 | 0.155 | [-0.1893, 0.0301] | -7.65% |
| `degree_stem` | 0.0775* | 0.0415 | 0.0616 | [-0.0038, 0.1588] | 8.06% |
| `skill_cloud` | 0.1908 | 0.1631 | 0.242 | [-0.1288, 0.5104] | 21.02% |
| `skill_ml_ai` | 0.0323 | 0.1262 | 0.798 | [-0.215, 0.2796] | 3.28% |
| `remote_eligible` | -0.0047 | 0.0726 | 0.9487 | [-0.147, 0.1377] | -0.47% |
| `mandate_state` | 0.0954 | 0.0718 | 0.1836 | [-0.0452, 0.2361] | 10.02% |
| `region_northeast` | -0.0642 | 0.0738 | 0.3843 | [-0.209, 0.0805] | -6.22% |
| `region_south` | -0.0923 | 0.1114 | 0.4075 | [-0.3108, 0.1261] | -8.82% |
| `region_west` | 0.0349 | 0.0678 | 0.6066 | [-0.098, 0.1678] | 3.55% |
| `industry_data_center` | 0.0531 | 0.1232 | 0.6666 | [-0.1883, 0.2945] | 5.45% |
| `family_ai_ml` | 0.3884*** | 0.1112 | 0.0005 | [0.1705, 0.6063] | 47.47% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Robustness: log(pay), BEA price-adjusted

N = 341, R² = 0.6345, adjusted R² = 0.6176, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.3798*** | 0.0484 | 0.0 | [11.285, 11.4746] | — |
| `seniority_rank` | 0.1135*** | 0.0094 | 0.0 | [0.095, 0.1319] | 12.02% |
| `yrs_exp_min` | 0.0215*** | 0.0059 | 0.0003 | [0.01, 0.033] | 2.17% |
| `yrs_exp_stated` | -0.0386 | 0.0347 | 0.2657 | [-0.1065, 0.0294] | -3.78% |
| `degree_required` | -0.0251 | 0.0274 | 0.3597 | [-0.0788, 0.0286] | -2.48% |
| `degree_stem` | 0.0427* | 0.025 | 0.0868 | [-0.0062, 0.0916] | 4.37% |
| `skill_cloud` | 0.0846*** | 0.0275 | 0.0021 | [0.0308, 0.1385] | 8.83% |
| `skill_ml_ai` | 0.0853** | 0.0395 | 0.0309 | [0.0079, 0.1627] | 8.9% |
| `remote_eligible` | 0.0525 | 0.0436 | 0.2286 | [-0.033, 0.138] | 5.39% |
| `hourly_original` | 0.0006 | 0.032 | 0.9853 | [-0.0621, 0.0633] | 0.06% |
| `mandate_state` | -0.0706* | 0.0363 | 0.0521 | [-0.1418, 0.0006] | -6.82% |
| `region_northeast` | 0.0146 | 0.034 | 0.6667 | [-0.052, 0.0812] | 1.47% |
| `region_south` | 0.0134 | 0.0463 | 0.772 | [-0.0773, 0.1041] | 1.35% |
| `region_west` | -0.0034 | 0.0307 | 0.9121 | [-0.0636, 0.0568] | -0.34% |
| `industry_data_center` | 0.1545** | 0.0664 | 0.02 | [0.0243, 0.2846] | 16.7% |
| `family_ai_ml` | 0.0692* | 0.0356 | 0.0522 | [-0.0007, 0.139] | 7.16% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Wild cluster bootstrap

Restricted wild cluster bootstrap, rademacher weights, 9999 replications over 52 employer clusters (Cameron, Gelbach & Miller (2008), seed 20260922).

**These are the p-values to read.** The asymptotic clustered p-values in the table above are anti-conservative at this cluster count, and the pre-registration requires the bootstrap before any significance claim while clusters stay under 30.

| Variable | Coef | Clustered p | Bootstrap p | Verdict at 0.05 |
|---|---|---|---|---|
| `seniority_rank` | 0.1128 | 0.0 | 0.0001 | unchanged (significant) |
| `yrs_exp_min` | 0.0229 | 0.0003 | 0.0023 | unchanged (significant) |
| `yrs_exp_stated` | -0.0447 | 0.2161 | 0.2237 | unchanged (null) |
| `degree_required` | -0.0291 | 0.262 | 0.3215 | unchanged (null) |
| `degree_stem` | 0.0465 | 0.0495 | 0.0641 | **no longer significant** |
| `skill_cloud` | 0.0807 | 0.0059 | 0.0367 | unchanged (significant) |
| `skill_ml_ai` | 0.0956 | 0.0232 | 0.0534 | **no longer significant** |
| `remote_eligible` | 0.0387 | 0.3143 | 0.4646 | unchanged (null) |
| `hourly_original` | 0.0398 | 0.3084 | 0.4342 | unchanged (null) |
| `mandate_state` | -0.0016 | 0.9619 | 0.9648 | unchanged (null) |
| `region_northeast` | 0.0946 | 0.0032 | 0.0058 | unchanged (significant) |
| `region_south` | 0.0512 | 0.2924 | 0.4254 | unchanged (null) |
| `region_west` | 0.074 | 0.077 | 0.0906 | unchanged (null) |
| `industry_data_center` | 0.1684 | 0.0202 | 0.1898 | **no longer significant** |
| `family_ai_ml` | 0.0551 | 0.1408 | 0.2046 | unchanged (null) |

Conclusions that change once clustering is bootstrapped: `degree_stem`, `skill_ml_ai`, `industry_data_center`. Any claim about these rests on the bootstrap column, not the clustered one.

## Disclosure selection

Disclosure rate: **0.754** (365 disclosed, 119 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `seniority_rank` | 3.329 | 3.361 | -0.033 | 0.8351 |
| `yrs_exp_min` | 2.107 | 1.79 | 0.317 | 0.2674 |
| `yrs_exp_stated` | 0.438 | 0.487 | -0.049 | 0.3546 |
| `degree_required` | 0.633 | 0.58 | 0.053 | 0.3088 |
| `degree_stem` | 0.381 | 0.37 | 0.011 | 0.829 |
| `skill_cloud` | 0.2 | 0.109 | 0.091 | 0.0113 |
| `skill_ml_ai` | 0.359 | 0.21 | 0.149 | 0.0011 |
| `remote_eligible` | 0.145 | 0.134 | 0.011 | 0.7682 |
| `hourly_original` | 0.005 | 0.0 | 0.005 | 0.1576 |
| `mandate_state` | 0.729 | 0.134 | 0.594 | 0.0 |
| `region_northeast` | 0.225 | 0.109 | 0.115 | 0.0016 |
| `region_south` | 0.148 | 0.689 | -0.541 | 0.0 |
| `region_west` | 0.353 | 0.034 | 0.32 | 0.0 |
| `industry_data_center` | 0.203 | 0.21 | -0.007 | 0.8646 |
| `family_ai_ml` | 0.101 | 0.059 | 0.043 | 0.1139 |
| `metro_indianapolis` | 0.011 | 0.067 | -0.056 | 0.019 |


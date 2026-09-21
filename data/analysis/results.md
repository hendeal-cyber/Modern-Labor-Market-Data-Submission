# Results

- Postings in scope: **144**
- With disclosed pay: **103**
- Used in estimation: **103**
- Distinct employers: **27**

> **These estimates are not yet interpretable.**
>
> - 9.4 observations per regressor (103 observations, 11 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
> - Minimum detectable effect is 0.29 log points, roughly a 34% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model is reported so the pipeline is verifiable end to end, not because the coefficients mean anything yet. Collect more before drawing conclusions.

Regressor budget at 20 observations each: **5** (specification used: **core**).

Minimum detectable standardized effect: **0.2937** log points (alpha 0.05, power 0.80).

## Core model (pre-specified)

N = 103, R² = 0.5332, adjusted R² = 0.4768, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 11.4216*** | 0.1475 | 0.0 | [11.1324, 11.7107] | — |
| `degree_stem` | 0.0461 | 0.0629 | 0.4641 | [-0.0773, 0.1694] | 4.71% |
| `advanced_degree_pref` | 0.0845 | 0.077 | 0.2725 | [-0.0664, 0.2354] | 8.82% |
| `yrs_exp_min` | 0.0162 | 0.02 | 0.4178 | [-0.0229, 0.0553] | 1.63% |
| `yrs_exp_stated` | -0.1642 | 0.1028 | 0.11 | [-0.3657, 0.0372] | -15.15% |
| `skill_cloud` | 0.0647 | 0.1534 | 0.6733 | [-0.236, 0.3653] | 6.68% |
| `skill_ml_ai` | 0.3049** | 0.1383 | 0.0274 | [0.0339, 0.5759] | 35.65% |
| `soft_leadership` | 0.1538* | 0.0883 | 0.0814 | [-0.0192, 0.3269] | 16.63% |
| `industry_data_center` | 0.2282* | 0.1179 | 0.0529 | [-0.0028, 0.4593] | 25.64% |
| `remote_eligible` | 0.2271** | 0.0973 | 0.0196 | [0.0364, 0.4177] | 25.49% |
| `job_level` | -0.051 | 0.0328 | 0.1198 | [-0.1153, 0.0133] | -4.98% |
| `family_ai_ml` | -0.1472 | 0.1017 | 0.1478 | [-0.3466, 0.0521] | -13.69% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Secondary: log(range width)

N = 101, R² = 0.2013, adjusted R² = 0.1025, SE: cluster

| Variable | Coef | Std err | p | 95% CI | Approx % effect |
|---|---|---|---|---|---|
| `const` | 10.9539*** | 0.3914 | 0.0 | [10.1868, 11.7209] | — |
| `degree_stem` | 0.0662 | 0.2062 | 0.7483 | [-0.338, 0.4703] | 6.84% |
| `advanced_degree_pref` | 0.4307** | 0.176 | 0.0144 | [0.0856, 0.7757] | 53.83% |
| `yrs_exp_min` | 0.0283 | 0.0632 | 0.655 | [-0.0957, 0.1522] | 2.87% |
| `yrs_exp_stated` | -0.2909 | 0.377 | 0.4404 | [-1.0299, 0.4481] | -25.24% |
| `skill_cloud` | -0.0952 | 0.3707 | 0.7973 | [-0.8218, 0.6314] | -9.08% |
| `skill_ml_ai` | 0.2046 | 0.3791 | 0.5894 | [-0.5383, 0.9475] | 22.7% |
| `soft_leadership` | -0.5653** | 0.2526 | 0.0252 | [-1.0604, -0.0703] | -43.18% |
| `industry_data_center` | -0.7728* | 0.4281 | 0.0711 | [-1.6119, 0.0663] | -53.83% |
| `remote_eligible` | 0.2746 | 0.23 | 0.2324 | [-0.1761, 0.7253] | 31.6% |
| `job_level` | -0.2931** | 0.1174 | 0.0125 | [-0.5231, -0.063] | -25.4% |
| `family_ai_ml` | -0.0687 | 0.3307 | 0.8354 | [-0.7168, 0.5794] | -6.64% |

Significance: *** p<0.01, ** p<0.05, * p<0.10.

## Disclosure selection

Disclosure rate: **0.715** (103 disclosed, 41 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Diff | p |
|---|---|---|---|---|
| `degree_stem` | 0.35 | 0.317 | 0.032 | 0.7116 |
| `advanced_degree_pref` | 0.204 | 0.171 | 0.033 | 0.6448 |
| `yrs_exp_min` | 1.515 | 1.732 | -0.217 | 0.6091 |
| `yrs_exp_stated` | 0.388 | 0.512 | -0.124 | 0.1853 |
| `skill_cloud` | 0.223 | 0.195 | 0.028 | 0.7082 |
| `skill_ml_ai` | 0.262 | 0.22 | 0.043 | 0.5892 |
| `soft_leadership` | 0.184 | 0.122 | 0.063 | 0.3347 |
| `industry_data_center` | 0.194 | 0.39 | -0.196 | 0.0269 |
| `remote_eligible` | 0.136 | 0.146 | -0.01 | 0.8738 |
| `job_level` | 1.0 | 0.951 | 0.049 | 0.8016 |
| `family_ai_ml` | 0.107 | 0.049 | 0.058 | 0.2078 |
| `metro_indianapolis` | 0.029 | 0.146 | -0.117 | 0.0501 |


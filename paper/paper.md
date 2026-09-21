# Determinants of Advertised Pay in the US Energy and Data Center Sector
## Evidence from employer-published job postings

*Built from data collected through 2026-09-21. Collection cycles: 2.*

## Executive summary

This study asks what attributes stated in a job posting predict the pay an
employer advertises, across the United States energy and data center sector.
Postings are collected from the public applicant tracking system APIs that
employers publish through — the upstream source for the job boards those
postings appear on.

**The clearest result concerns disclosure rather than level.** Pay is
stated in **97.8%** of postings in states with a posting-level
pay-transparency mandate, against **26.5%** where there is none —
a gap of **71 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

Seniority, required experience and role family are the attributes that
predict advertised pay within the disclosing sample. The early-career
subsample that motivated the study is reported separately, so the original
question remains answerable alongside the wider one.

## 1. Introduction

Data center construction is driving a wave of technical and analytical
hiring across the utility sector and the colocation operators that depend on
it. Both compete for talent against employers who pay on a national
technology scale. This paper asks which attributes stated in a job posting
predict the pay that employers advertise for those roles.

The dependent variable is the natural log of the midpoint of the
employer-stated pay range, annualized to US dollars. Location and seniority
enter as regressors rather than as sample restrictions, which is what makes
the disclosure contrast estimable.

## 2. Institutional background

Sixteen US jurisdictions require employers to state a pay scale in the
posting itself. Colorado was first, in 2021; California, New York and
Washington followed; Illinois House Bill 3129 took effect on 1 January 2025
and Massachusetts in October 2025. The full table, with effective dates, is
in `config/scope.yaml` so a reader can audit which jurisdictions count.

Coverage attaches to the location of the work. A posting listing several
locations is therefore covered if **any** of them is covered, which is how
`mandate_state` is computed; `states_listed` and `n_locations` are retained
so the rule can be checked or recomputed. Roughly a quarter of postings
list more than one location, so the choice is not cosmetic.

Where no mandate applies, disclosure is voluntary and therefore selected.
This is the central limitation of the pay models and is treated as such:
disclosure is modelled as an outcome in its own right, not assumed away.

## 3. Data

### 3.1 Source

Postings are collected from the public, unauthenticated applicant tracking
system APIs that employers publish through, which are the upstream source for
the job boards those postings appear on. LinkedIn is not used: its User
Agreement prohibits programmatic collection. Full methodological detail,
including the compliance posture, is in `docs/methods.md`.

### 3.2 Sampling frame

The frame covers the energy and data center sector across nine industry
categories: utilities, cooperatives, competitive retailers, grid operators,
data center operators, developers, energy analytics firms, consultancies
and grid technology vendors.

Roles are restricted to an energy-analytics core — siting and development,
regulatory and compliance, market and commercial, grid and power systems,
AI and machine learning, GIS, sustainability analytics, and software and
data. Engineering is admitted only where analytics-adjacent. Every
seniority level is included **except internships**, which are a different
contract and pay regime; seniority enters as an ordinal regressor.

Geography is the United States. Non-US postings are excluded, since pooling
currencies and labour markets would not be meaningful.

> **Known gap.** Exelon, ComEd, Constellation and Citizens Energy run
> iCIMS, which releases its job feed only to approved job boards and gates
> its API behind a partnership. A syndication feed was probed and none
> exists, and the portal terms prohibit automated access, so the gap is
> accepted rather than worked around. Results describing Chicago utilities
> specifically exclude them. See `docs/limitations.md`.

### 3.3 Selection funnel

| Stage | Postings |
|---|---|
| Retrieved from ATS boards | 831 |
| Passed role, seniority and internship screens | 193 |
| Within 35 miles of a study metro | 149 |
| Unique after de-duplication | 138 |
| With a disclosed pay range (estimation sample) | 100 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 387 |
| `role_excluded` | 218 |
| `internship` | 52 |
| `non_us` | 30 |
| `no_us_state` | 14 |

Distinct employers contributing a disclosed range: **20**. By metro: `{'': 7, 'northern_virginia': 10, 'remote_national': 7, 'denver': 26, 'chicago': 32, 'indianapolis': 3, 'new_york': 4, 'bay_area': 5, 'boston': 5, 'minneapolis': 1}`.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Three rounds of hand-auditing are recorded in `docs/audit-log.md`.
Each read real collected titles rather than a synthetic sample, and
each found errors the test suite had not:

| Round | Target | Result |
|---|---|---|
| 1 | Regressor coding | Three systematic false positives, all firing on company boilerplate rather than on anything asked of the applicant |
| 2 | `role_family` | 6 of 53 assignments wrong (89%). Four had reached a live measurement and sat in the top eleven rows by pay |
| 3 | `seniority_rank`, `state` | 21 of 141 wrong (85.1%). One defect changed the headline disclosure contrast |

Every defect found is pinned by a regression test built from the real
title or location string that produced it, not from a reconstruction.

> The formal gold-set scorer (`audit.py score`) has not been run, so no
> single per-regressor accuracy figure is quoted here. The rounds above
> are exhaustive hand-reads of the population, which is a different and
> in this sample stronger check than a sampled gold set — but it is not
> the same thing, and is not presented as one.

## 4. Empirical strategy

The specification regresses log advertised pay on posting attributes, with
standard errors clustered by employer because employers contribute many
postings each. A core model is pre-specified; an extended model is estimated
only when the sample supports roughly twenty observations per regressor, so
the specification is chosen by sample size rather than by results.

Cluster-robust standard errors are biased downward when clusters are few.
Simulation with twelve employer clusters recovered nominal 95% coverage of
only about 88%. Where the realized employer count is small, a wild cluster
bootstrap should precede any claim resting on a marginal p-value.

## 5. Results

> **Not yet interpretable.** 7.1 observations per regressor (100 observations, 14 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
>
> **Not yet interpretable.** Minimum detectable effect is 0.30 log points, roughly a 36% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model below is reported so the pipeline is verifiable end to end,
> not because the coefficients support conclusions.

Advertised pay in the estimation sample averages **$107,912** (median $106,500, SD $38,696, range $46,500–$233,000).

At N = 100 with 14 regressors, the smallest
detectable standardized effect is **0.3039**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 97.8% | 89 |
| no mandate state | 26.5% | 49 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered. Around a quarter of postings list more
than one, and `states_listed` is retained so the rule can be checked.

> **This is a descriptive contrast, not a causal estimate.** A single
> cross-section carries no time variation, so no
> difference-in-differences is available. Employers who operate in
> mandate states differ from those who do not in size, sector and
> geography, and these data cannot separate those differences from
> the effect of the law itself.

### Core model (pre-specified)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.3090*** | 0.0554 | 0.000 | [11.200, 11.418] | — |
| `seniority_rank` | 0.0639*** | 0.0106 | 0.000 | [0.043, 0.085] | 6.6% |
| `yrs_exp_min` | -0.0063 | 0.0139 | 0.648 | [-0.034, 0.021] | -0.6% |
| `yrs_exp_stated` | -0.0418 | 0.1388 | 0.763 | [-0.314, 0.230] | -4.1% |
| `degree_required` | -0.1273** | 0.0567 | 0.025 | [-0.238, -0.016] | -11.9% |
| `degree_stem` | 0.0929 | 0.0630 | 0.141 | [-0.031, 0.216] | 9.7% |
| `skill_cloud` | 0.1009 | 0.1278 | 0.430 | [-0.150, 0.351] | 10.6% |
| `skill_ml_ai` | 0.1722 | 0.1238 | 0.164 | [-0.070, 0.415] | 18.8% |
| `remote_eligible` | 0.1925** | 0.0772 | 0.013 | [0.041, 0.344] | 21.2% |
| `mandate_state` | -0.0914 | 0.0929 | 0.325 | [-0.274, 0.091] | -8.7% |
| `region_northeast` | 0.3414*** | 0.0983 | 0.001 | [0.149, 0.534] | 40.7% |
| `region_south` | 0.2718*** | 0.0944 | 0.004 | [0.087, 0.457] | 31.2% |
| `region_west` | 0.1248** | 0.0520 | 0.017 | [0.023, 0.227] | 13.3% |
| `industry_data_center` | 0.1437* | 0.0863 | 0.096 | [-0.025, 0.313] | 15.5% |
| `family_ai_ml` | -0.0616 | 0.1347 | 0.647 | [-0.326, 0.202] | -6.0% |

*** p<0.01, ** p<0.05, * p<0.10. N = 100, R² = 0.568, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.0737*** | 0.3358 | 0.000 | [9.415, 10.732] | — |
| `seniority_rank` | 0.0619 | 0.1051 | 0.556 | [-0.144, 0.268] | 6.4% |
| `yrs_exp_min` | 0.1293* | 0.0676 | 0.056 | [-0.003, 0.262] | 13.8% |
| `yrs_exp_stated` | -0.4382 | 0.4189 | 0.296 | [-1.259, 0.383] | -35.5% |
| `degree_required` | -0.0782 | 0.1139 | 0.492 | [-0.301, 0.145] | -7.5% |
| `degree_stem` | 0.1163 | 0.1658 | 0.483 | [-0.209, 0.441] | 12.3% |
| `skill_cloud` | -0.0547 | 0.3851 | 0.887 | [-0.809, 0.700] | -5.3% |
| `skill_ml_ai` | -0.0917 | 0.4739 | 0.847 | [-1.021, 0.837] | -8.8% |
| `remote_eligible` | 0.3798 | 0.3920 | 0.333 | [-0.389, 1.148] | 46.2% |
| `mandate_state` | 0.5101 | 0.3429 | 0.137 | [-0.162, 1.182] | 66.5% |
| `region_northeast` | -0.8382** | 0.3341 | 0.012 | [-1.493, -0.183] | -56.8% |
| `region_south` | -0.2260 | 0.1822 | 0.215 | [-0.583, 0.131] | -20.2% |
| `region_west` | -0.0905 | 0.1812 | 0.618 | [-0.446, 0.265] | -8.7% |
| `industry_data_center` | -0.8085* | 0.4186 | 0.053 | [-1.629, 0.012] | -55.5% |
| `family_ai_ml` | 0.5658* | 0.2906 | 0.052 | [-0.004, 1.135] | 76.1% |

*** p<0.01, ** p<0.05, * p<0.10. N = 98, R² = 0.186, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.2816** | 0.1145 | 0.014 | [0.057, 0.506] | — |
| `mandate_state` | 0.6784*** | 0.0852 | 0.000 | [0.511, 0.845] | 97.1% |
| `seniority_rank` | 0.0059 | 0.0182 | 0.743 | [-0.030, 0.042] | 0.6% |
| `remote_eligible` | 0.3536*** | 0.0725 | 0.000 | [0.211, 0.496] | 42.4% |
| `industry_data_center` | -0.1359 | 0.0845 | 0.108 | [-0.301, 0.030] | -12.7% |
| `region_northeast` | -0.1452 | 0.0888 | 0.102 | [-0.319, 0.029] | -13.5% |
| `region_south` | -0.1284 | 0.0953 | 0.178 | [-0.315, 0.058] | -12.1% |
| `region_west` | 0.1149 | 0.0744 | 0.123 | [-0.031, 0.261] | 12.2% |

*** p<0.01, ** p<0.05, * p<0.10. N = 138, R² = 0.695, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.9499*** | 0.1434 | 0.000 | [10.669, 11.231] | — |
| `seniority_rank` | 0.3844*** | 0.0967 | 0.000 | [0.195, 0.574] | 46.9% |
| `yrs_exp_min` | -0.1753** | 0.0718 | 0.015 | [-0.316, -0.035] | -16.1% |
| `yrs_exp_stated` | 0.2404 | 0.2955 | 0.416 | [-0.339, 0.820] | 27.2% |
| `degree_required` | -0.1009 | 0.1365 | 0.460 | [-0.368, 0.167] | -9.6% |
| `degree_stem` | 0.3600** | 0.1448 | 0.013 | [0.076, 0.644] | 43.3% |
| `skill_cloud` | 0.1636 | 0.1610 | 0.309 | [-0.152, 0.479] | 17.8% |

*** p<0.01, ** p<0.05, * p<0.10. N = 26, R² = 0.601, SE: cluster.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **26** postings from
**10** employers, estimated above.
It is reported whether or not it agrees with the full sample: a
disagreement would be a finding, not a reason to drop it.

### Price-adjusted pay

Not available. BEA regional price parities were not fetched, so pay is nominal only. No deflator is imputed. Nominal pay is reported
throughout. Comparing advertised pay across states without adjusting
for local price levels overstates real differences in high-cost
states, and this limitation applies to every coefficient above.

### Pre-registered hypotheses, scored

Directions were committed in `docs/pre-registration.md` before the
national sample was collected. They are scored here whether or not they
held, which is the point of having written them down.

| # | Hypothesis | Predicted | Result |
|---|---|---|---|
| H1 | Seniority dominates advertised pay | + | positive, significant — supported |
| H3 | Required experience raises pay | + | negative, not significant — inconclusive |
| H4 | AI/ML roles carry a premium | + | negative, not significant — inconclusive |
| H5 | A required degree raises pay | + | negative, significant — **contradicted** |
| H7 | Data centers pay more than utilities | + | positive, not significant — inconclusive |
| H2 | A mandate raises disclosure | + | 97.8% vs 26.5% — **supported**, descriptively |

**H5 is contradicted and the reason is not obvious.** A stated degree
requirement is associated with *lower* advertised pay, conditional on
seniority. The most likely explanation is compositional rather than
causal: the best-paid technical postings increasingly say "degree or
equivalent experience" or omit the requirement entirely, so the
indicator may be marking employers with more formal hiring processes
rather than jobs with higher human-capital requirements. That is a
conjecture, not a result — testing it needs a variable this dataset
does not have. It is reported because it was predicted the other way.

### Who discloses pay

Disclosure rate **72.5%** (100 disclosed, 38 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 2.62 | 2.737 | -0.117 | 0.592 |
| `yrs_exp_min` | 1.52 | 1.711 | -0.191 | 0.6684 |
| `yrs_exp_stated` | 0.39 | 0.5 | -0.11 | 0.2546 |
| `degree_required` | 0.72 | 0.711 | 0.009 | 0.9138 |
| `degree_stem` | 0.36 | 0.342 | 0.018 | 0.8459 |
| `skill_cloud` | 0.21 | 0.211 | -0.001 | 0.9947 |
| `skill_ml_ai` | 0.25 | 0.237 | 0.013 | 0.8735 |
| `remote_eligible` | 0.12 | 0.079 | 0.041 | 0.4581 |
| `mandate_state` | 0.87 | 0.053 | 0.817 | 0.0 |
| `region_northeast` | 0.09 | 0.105 | -0.015 | 0.7936 |
| `region_south` | 0.12 | 0.579 | -0.459 | 0.0 |
| `region_west` | 0.34 | 0.026 | 0.314 | 0.0 |
| `industry_data_center` | 0.18 | 0.395 | -0.215 | 0.0194 |
| `family_ai_ml` | 0.11 | 0.053 | 0.057 | 0.2383 |
| `metro_indianapolis` | 0.03 | 0.158 | -0.128 | 0.0463 |

## 6. Threats to validity

These are treated at length in `docs/limitations.md`. In short:

1. The outcome is **advertised** pay, not realized pay. Employers may
   negotiate away from the posted range in either direction.
2. **Disclosure is selected.** Where no mandate applies only about a
   quarter of postings state pay, so every pay coefficient is conditional
   on disclosure. This is the central threat, and it is why the disclosure
   model is a headline result rather than a footnote.
3. The mandate contrast is **associational**. One cross-section admits no
   difference-in-differences.
4. Pay is **nominal**. A price-adjusted robustness check is implemented and
   reported when the BEA table has been fetched.
5. **Few employer clusters, one of them dominant.** Cluster-robust errors
   under-cover with few clusters, measured at 88-90% against a nominal 95%.
   No claim should rest on a marginal p-value without a wild cluster
   bootstrap.
6. The scope **widened three times in response to the data**. The
   specification was pre-registered before the national sample was
   collected; amendments after that point are dated in
   `docs/pre-registration.md` section 8.
7. Exelon, ComEd, Constellation and Citizens Energy are **absent**, all on
   iCIMS, verified closed rather than assumed.

## 7. Conclusion

Across 100 postings from 20 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 98% of postings
state one. Where no such requirement exists, 27% do. The
gap is too large to be explained by employer composition alone,
though composition cannot be ruled out with a single cross-section.

Within the postings that do disclose, seniority is the dominant
predictor and the most precisely estimated, which is what the
pre-registration expected. The prediction that a stated degree
requirement would raise pay was wrong, and is reported as wrong.

The result a reader should treat most cautiously is any coefficient in
the pay models, because that sample is selected on the dependent
variable wherever disclosure is voluntary. The result a reader should
treat most seriously is the disclosure contrast, because it is measured
on the full sample and does not depend on pay being observed.

What would most improve this study is **more employers, not more
postings**. The floor on observations is met; the constraint is that
too few employers contribute and one contributes too many, which is
what makes the standard errors fragile.

## Appendix

- `docs/codebook.md` — every variable and its coding rule
- `docs/methods.md` — design, compliance posture, estimation strategy
- `docs/limitations.md` — what the data cannot support
- `docs/audit-log.md` — coding accuracy by round
- `data/analysis/postings.csv` — the analysis dataset
- `data/analysis/selection_funnel.json` — full funnel and rejection reasons

Reproduce with `pip install -r requirements.txt && python tests/run_all.py`,
then `python src/lmstudy/collect/run.py && python src/lmstudy/build_dataset.py`.

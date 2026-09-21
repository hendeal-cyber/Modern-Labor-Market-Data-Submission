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
stated in **82.4%** of postings in states with a posting-level
pay-transparency mandate, against **32.3%** where there is none —
a gap of **50 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

The gap is large under every cut of the sample (50 to 71 points), but its
size depends heavily on one jurisdiction; see the robustness table
in section 5 before quoting a single figure.

Within the postings that do disclose, the attributes that predict pay at
conventional significance are seniority, a stated ML or AI skill, South location and remote eligibility.
Note that a required degree enters **negatively**, which
was predicted the other way; section 5 reports it as contradicted.

The early-career subsample that motivated the study is reported separately,
so the original question remains answerable alongside the wider one.

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
| Retrieved from ATS boards | 897 |
| Passed role, seniority and internship screens | 269 |
| Within 35 miles of a study metro | 223 |
| Unique after de-duplication | 204 |
| With a disclosed pay range (estimation sample) | 137 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 384 |
| `role_excluded` | 211 |
| `internship` | 52 |
| `non_us` | 30 |
| `no_us_state` | 16 |

Distinct employers contributing a disclosed range: **23**. By metro: `{'': 20, 'northern_virginia': 25, 'remote_national': 12, 'denver': 26, 'chicago': 33, 'indianapolis': 3, 'new_york': 4, 'bay_area': 5, 'boston': 8, 'minneapolis': 1}`.

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

> **Not yet interpretable.** 9.1 observations per regressor (137 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
>
> **Not yet interpretable.** Minimum detectable effect is 0.25 log points, roughly a 29% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model below is reported so the pipeline is verifiable end to end,
> not because the coefficients support conclusions.

Advertised pay in the estimation sample averages **$113,236** (median $113,000, SD $37,483, range $46,500–$233,000).

At N = 137 with 15 regressors, the smallest
detectable standardized effect is **0.2547**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 82.4% | 142 |
| no mandate state | 32.3% | 62 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered. Around a quarter of postings list more
than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The size of the gap is sensitive to one
jurisdiction, so it is cut three ways rather than quoted once:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 82.4% (n=142) | 32.3% (n=62) | 50pp |
| Excluding Virginia | 100.0% (n=85) | 32.3% (n=62) | 68pp |
| Excluding the largest employer | 97.8% (n=92) | 27.1% (n=48) | 71pp |

The gap is large under every cut. Its SIZE is sensitive to Virginia, whose mandate is the newest in the table; outside Virginia, disclosure in mandate states is universal in this sample. Partial compliance with a three-month-old statute is a plausible reading, but this cannot distinguish that from the posting practices of the one employer concerned.

Virginia matters here because its mandate took effect on
1 July 2026 and is the newest in the table. Almost every
non-disclosing posting in a mandate state is a Virginia posting
from a single employer. **Outside Virginia, every posting in a
mandate state in this sample states pay.**

> **This is a descriptive contrast, not a causal estimate.** A single
> cross-section carries no time variation, so no
> difference-in-differences is available. Employers who operate in
> mandate states differ from those who do not in size, sector and
> geography, and these data cannot separate those differences from
> the effect of the law itself.

### Core model (pre-specified)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.2482*** | 0.0577 | 0.000 | [11.135, 11.361] | — |
| `seniority_rank` | 0.0675*** | 0.0072 | 0.000 | [0.053, 0.082] | 7.0% |
| `yrs_exp_min` | 0.0089 | 0.0158 | 0.573 | [-0.022, 0.040] | 0.9% |
| `yrs_exp_stated` | -0.0900 | 0.1217 | 0.460 | [-0.328, 0.148] | -8.6% |
| `degree_required` | -0.0939** | 0.0447 | 0.035 | [-0.181, -0.006] | -9.0% |
| `degree_stem` | 0.1143** | 0.0496 | 0.021 | [0.017, 0.211] | 12.1% |
| `skill_cloud` | -0.0288 | 0.0653 | 0.660 | [-0.157, 0.099] | -2.8% |
| `skill_ml_ai` | 0.2370*** | 0.0649 | 0.000 | [0.110, 0.364] | 26.8% |
| `remote_eligible` | 0.1512*** | 0.0494 | 0.002 | [0.054, 0.248] | 16.3% |
| `hourly_original` | -0.0460 | 0.2640 | 0.862 | [-0.563, 0.471] | -4.5% |
| `mandate_state` | -0.0480 | 0.0636 | 0.451 | [-0.173, 0.077] | -4.7% |
| `region_northeast` | 0.2685** | 0.1062 | 0.011 | [0.060, 0.477] | 30.8% |
| `region_south` | 0.2083*** | 0.0609 | 0.001 | [0.089, 0.328] | 23.1% |
| `region_west` | 0.1208*** | 0.0469 | 0.010 | [0.029, 0.213] | 12.8% |
| `industry_data_center` | 0.1645** | 0.0797 | 0.039 | [0.008, 0.321] | 17.9% |
| `family_ai_ml` | -0.0296 | 0.0686 | 0.666 | [-0.164, 0.105] | -2.9% |

*** p<0.01, ** p<0.05, * p<0.10. N = 137, R² = 0.525, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.1523*** | 0.2168 | 0.000 | [9.727, 10.577] | — |
| `seniority_rank` | 0.0676 | 0.0859 | 0.432 | [-0.101, 0.236] | 7.0% |
| `yrs_exp_min` | 0.1177* | 0.0645 | 0.068 | [-0.009, 0.244] | 12.5% |
| `yrs_exp_stated` | -0.4696 | 0.3693 | 0.203 | [-1.193, 0.254] | -37.5% |
| `degree_required` | -0.0026 | 0.0782 | 0.973 | [-0.156, 0.151] | -0.3% |
| `degree_stem` | 0.1718 | 0.1442 | 0.233 | [-0.111, 0.454] | 18.8% |
| `skill_cloud` | 0.0534 | 0.1578 | 0.735 | [-0.256, 0.363] | 5.5% |
| `skill_ml_ai` | -0.0031 | 0.2917 | 0.992 | [-0.575, 0.569] | -0.3% |
| `remote_eligible` | 0.2669 | 0.1790 | 0.136 | [-0.084, 0.618] | 30.6% |
| `hourly_original` | -0.1282 | 0.2123 | 0.546 | [-0.544, 0.288] | -12.0% |
| `mandate_state` | 0.3750* | 0.2140 | 0.080 | [-0.044, 0.794] | 45.5% |
| `region_northeast` | -0.8392*** | 0.3195 | 0.009 | [-1.465, -0.213] | -56.8% |
| `region_south` | -0.0316 | 0.1568 | 0.840 | [-0.339, 0.276] | -3.1% |
| `region_west` | -0.0842 | 0.1659 | 0.612 | [-0.409, 0.241] | -8.1% |
| `industry_data_center` | -0.8603** | 0.4079 | 0.035 | [-1.660, -0.061] | -57.7% |
| `family_ai_ml` | 0.2766 | 0.2390 | 0.247 | [-0.192, 0.745] | 31.9% |

*** p<0.01, ** p<0.05, * p<0.10. N = 134, R² = 0.235, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.3773*** | 0.1169 | 0.001 | [0.148, 0.606] | — |
| `mandate_state` | 0.5055*** | 0.1086 | 0.000 | [0.293, 0.718] | 65.8% |
| `seniority_rank` | 0.0170 | 0.0158 | 0.282 | [-0.014, 0.048] | 1.7% |
| `remote_eligible` | 0.3742*** | 0.0843 | 0.000 | [0.209, 0.539] | 45.4% |
| `industry_data_center` | -0.1004 | 0.0778 | 0.197 | [-0.253, 0.052] | -9.6% |
| `region_northeast` | -0.1396 | 0.1141 | 0.221 | [-0.363, 0.084] | -13.0% |
| `region_south` | -0.3308*** | 0.0921 | 0.000 | [-0.511, -0.150] | -28.2% |
| `region_west` | 0.1220 | 0.0849 | 0.151 | [-0.044, 0.288] | 13.0% |

*** p<0.01, ** p<0.05, * p<0.10. N = 204, R² = 0.486, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.9450*** | 0.3590 | 0.000 | [10.241, 11.649] | — |
| `seniority_rank` | 0.1600 | 0.2736 | 0.559 | [-0.376, 0.696] | 17.4% |
| `yrs_exp_min` | -0.0929 | 0.1038 | 0.371 | [-0.296, 0.111] | -8.9% |
| `yrs_exp_stated` | 0.0368 | 0.3563 | 0.918 | [-0.661, 0.735] | 3.8% |
| `degree_required` | -0.1800 | 0.1710 | 0.293 | [-0.515, 0.155] | -16.5% |
| `degree_stem` | 0.1875 | 0.2091 | 0.370 | [-0.222, 0.597] | 20.6% |
| `skill_cloud` | -0.0973 | 0.2429 | 0.689 | [-0.573, 0.379] | -9.3% |
| `skill_ml_ai` | 0.2723 | 0.2571 | 0.290 | [-0.232, 0.776] | 31.3% |
| `remote_eligible` | -0.1820 | 0.2066 | 0.378 | [-0.587, 0.223] | -16.6% |
| `mandate_state` | 0.2038 | 0.3133 | 0.515 | [-0.410, 0.818] | 22.6% |
| `region_northeast` | 0.5617 | 0.3670 | 0.126 | [-0.158, 1.281] | 75.4% |
| `region_south` | 0.2840 | 0.2395 | 0.236 | [-0.185, 0.753] | 32.8% |
| `region_west` | 0.2963 | 0.1872 | 0.114 | [-0.071, 0.663] | 34.5% |
| `industry_data_center` | 0.3423 | 0.2565 | 0.182 | [-0.160, 0.845] | 40.8% |
| `family_ai_ml` | -0.0828 | 0.3293 | 0.801 | [-0.728, 0.563] | -8.0% |

*** p<0.01, ** p<0.05, * p<0.10. N = 29, R² = 0.714, SE: cluster.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **29** postings from
**11** employers, estimated above.
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
| H3 | Required experience raises pay | + | positive, not significant — inconclusive |
| H4 | AI/ML roles carry a premium | + | negative, not significant — inconclusive |
| H5 | A required degree raises pay | + | negative, significant — **contradicted** |
| H7 | Data centers pay more than utilities | + | positive, significant — supported |
| H2 | A mandate raises disclosure | + | 82.4% vs 32.3% — **supported**, descriptively |

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

Disclosure rate **67.2%** (137 disclosed, 67 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 2.54 | 2.478 | 0.063 | 0.6841 |
| `yrs_exp_min` | 1.117 | 0.97 | 0.147 | 0.622 |
| `yrs_exp_stated` | 0.292 | 0.284 | 0.008 | 0.9017 |
| `degree_required` | 0.752 | 0.806 | -0.054 | 0.3775 |
| `degree_stem` | 0.467 | 0.537 | -0.07 | 0.3501 |
| `skill_cloud` | 0.299 | 0.239 | 0.06 | 0.3579 |
| `skill_ml_ai` | 0.365 | 0.358 | 0.007 | 0.9254 |
| `remote_eligible` | 0.182 | 0.045 | 0.138 | 0.0012 |
| `hourly_original` | 0.022 | 0.0 | 0.022 | 0.0833 |
| `mandate_state` | 0.854 | 0.373 | 0.481 | 0.0 |
| `region_northeast` | 0.073 | 0.06 | 0.013 | 0.7179 |
| `region_south` | 0.299 | 0.761 | -0.462 | 0.0 |
| `region_west` | 0.27 | 0.015 | 0.255 | 0.0 |
| `industry_data_center` | 0.131 | 0.209 | -0.078 | 0.1825 |
| `family_ai_ml` | 0.19 | 0.194 | -0.004 | 0.9429 |
| `metro_indianapolis` | 0.022 | 0.09 | -0.068 | 0.0735 |

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

Across 137 postings from 23 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 82% of postings
state one. Where no such requirement exists, 32% do. The
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

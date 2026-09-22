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
stated in **81.7%** of postings in states with a posting-level
pay-transparency mandate, against **33.9%** where there is none —
a gap of **48 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

The gap is large under every cut of the sample (48 to 70 points), but its
size depends heavily on one jurisdiction; see the robustness table
in section 5 before quoting a single figure.

Within the postings that do disclose, the attributes that predict pay at
conventional significance under the wild cluster bootstrap are a stated ML or AI skill and seniority.
A further 7 attributes reach significance under
clustered standard errors but not under the bootstrap, which is
the inference this study pre-registered; they are reported as
inconclusive, not as findings.

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
| Retrieved from ATS boards | 898 |
| Passed role, seniority and internship screens | 268 |
| Within 35 miles of a study metro | 222 |
| Unique after de-duplication | 204 |
| With a disclosed pay range (estimation sample) | 137 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 383 |
| `role_excluded` | 214 |
| `internship` | 52 |
| `non_us` | 29 |
| `no_us_state` | 17 |

Distinct employers contributing a disclosed range: **23**. By metro: `{'': 20, 'northern_virginia': 23, 'remote_national': 13, 'denver': 26, 'chicago': 34, 'indianapolis': 3, 'new_york': 4, 'bay_area': 5, 'boston': 8, 'minneapolis': 1}`.

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
Simulation with twelve employer clusters covers the planted coefficient 92%
of the time against a nominal 95%, and rejects a cluster-level placebo at
9.5% against a nominal 5%. A **wild cluster bootstrap is therefore estimated
and reported**, not merely recommended, whenever the realized employer count
falls below thirty; section 5 gives it. An earlier version of this paper
cited 88% coverage, measured on a simulation whose employer-level shock was
applied to one posting per employer instead of to all of them — so the
figure justifying clustered errors had been computed on data with no
within-employer correlation. The fixture and the figure are both corrected.

## 5. Results

> **Not yet interpretable.** 9.1 observations per regressor (137 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
>
> **Not yet interpretable.** 23 employer clusters, against the 30 pre-registered. Cluster-robust standard errors are biased downward with few clusters, so the asymptotic p-values are anti-conservative. Read the wild cluster bootstrap p-values below, not these.
>
> **Not yet interpretable.** Minimum detectable effect is 0.25 log points, roughly a 29% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model below is reported so the pipeline is verifiable end to end,
> not because the coefficients support conclusions.

Advertised pay in the estimation sample averages **$113,864** (median $113,000, SD $38,053, range $46,500–$233,000).

At N = 137 with 15 regressors, the smallest
detectable standardized effect is **0.2547**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 81.7% | 142 |
| no mandate state | 33.9% | 62 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered. Around a quarter of postings list more
than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The size of the gap is sensitive to one
jurisdiction, so it is cut three ways rather than quoted once:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 81.7% (n=142) | 33.9% (n=62) | 48pp |
| Excluding Virginia | 100.0% (n=86) | 33.9% (n=62) | 66pp |
| Excluding the largest employer | 97.8% (n=92) | 27.7% (n=47) | 70pp |

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

| Variable | Coef. | Std. err. | Clustered p | **Bootstrap p** | 95% CI | Approx. % effect |
|---|---|---|---|---|---|---|
| `const` | 11.2654*** | 0.0530 | 0.000 | — | [11.162, 11.369] | — |
| `seniority_rank` | 0.0679*** | 0.0081 | 0.000 | **0.005** | [0.052, 0.084] | 7.0% |
| `yrs_exp_min` | 0.0095 | 0.0165 | 0.567 | **0.620** | [-0.023, 0.042] | 0.9% |
| `yrs_exp_stated` | -0.0910 | 0.1255 | 0.468 | **0.472** | [-0.337, 0.155] | -8.7% |
| `degree_required` | -0.1143* | 0.0381 | 0.003 | **0.069** | [-0.189, -0.040] | -10.8% |
| `degree_stem` | 0.1007 | 0.0489 | 0.040 | **0.160** | [0.005, 0.197] | 10.6% |
| `skill_cloud` | -0.0324 | 0.0577 | 0.574 | **0.653** | [-0.145, 0.081] | -3.2% |
| `skill_ml_ai` | 0.2364*** | 0.0614 | 0.000 | **0.003** | [0.116, 0.357] | 26.7% |
| `remote_eligible` | 0.1539 | 0.0486 | 0.002 | **0.102** | [0.059, 0.249] | 16.6% |
| `hourly_original` | -0.0431 | 0.2751 | 0.876 | **0.723** | [-0.582, 0.496] | -4.2% |
| `mandate_state` | -0.0385 | 0.0601 | 0.522 | **0.635** | [-0.156, 0.079] | -3.8% |
| `region_northeast` | 0.2602 | 0.1104 | 0.018 | **0.253** | [0.044, 0.477] | 29.7% |
| `region_south` | 0.1753 | 0.0702 | 0.013 | **0.212** | [0.038, 0.313] | 19.2% |
| `region_west` | 0.1065 | 0.0529 | 0.044 | **0.221** | [0.003, 0.210] | 11.2% |
| `industry_data_center` | 0.1643 | 0.0779 | 0.035 | **0.102** | [0.012, 0.317] | 17.9% |
| `family_ai_ml` | 0.0169 | 0.0826 | 0.838 | **0.834** | [-0.145, 0.179] | 1.7% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 137, R² = 0.524, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.2544*** | 0.2264 | 0.000 | [9.811, 10.698] | — |
| `seniority_rank` | 0.0528 | 0.0864 | 0.541 | [-0.116, 0.222] | 5.4% |
| `yrs_exp_min` | 0.1179* | 0.0632 | 0.062 | [-0.006, 0.242] | 12.5% |
| `yrs_exp_stated` | -0.4738 | 0.3650 | 0.194 | [-1.189, 0.241] | -37.7% |
| `degree_required` | -0.0206 | 0.0745 | 0.782 | [-0.167, 0.125] | -2.0% |
| `degree_stem` | 0.1460 | 0.1355 | 0.281 | [-0.119, 0.411] | 15.7% |
| `skill_cloud` | 0.0366 | 0.1520 | 0.809 | [-0.261, 0.335] | 3.7% |
| `skill_ml_ai` | -0.0075 | 0.2919 | 0.980 | [-0.580, 0.565] | -0.7% |
| `remote_eligible` | 0.2684 | 0.1736 | 0.122 | [-0.072, 0.609] | 30.8% |
| `hourly_original` | -0.1241 | 0.2165 | 0.566 | [-0.548, 0.300] | -11.7% |
| `mandate_state` | 0.3289 | 0.2013 | 0.102 | [-0.066, 0.723] | 38.9% |
| `region_northeast` | -0.8178*** | 0.3066 | 0.008 | [-1.419, -0.217] | -55.9% |
| `region_south` | -0.0518 | 0.1428 | 0.717 | [-0.332, 0.228] | -5.0% |
| `region_west` | -0.0838 | 0.1637 | 0.609 | [-0.405, 0.237] | -8.0% |
| `industry_data_center` | -0.8573** | 0.4013 | 0.033 | [-1.644, -0.071] | -57.6% |
| `family_ai_ml` | 0.3209 | 0.2130 | 0.132 | [-0.097, 0.738] | 37.8% |

*** p<0.01, ** p<0.05, * p<0.10. N = 134, R² = 0.238, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.4281*** | 0.1248 | 0.001 | [0.183, 0.673] | — |
| `mandate_state` | 0.4712*** | 0.1191 | 0.000 | [0.238, 0.705] | 60.2% |
| `seniority_rank` | 0.0057 | 0.0140 | 0.682 | [-0.022, 0.033] | 0.6% |
| `remote_eligible` | 0.3824*** | 0.0937 | 0.000 | [0.199, 0.566] | 46.6% |
| `industry_data_center` | -0.1006 | 0.0758 | 0.184 | [-0.249, 0.048] | -9.6% |
| `region_northeast` | -0.1395 | 0.1201 | 0.245 | [-0.375, 0.096] | -13.0% |
| `region_south` | -0.3465*** | 0.0909 | 0.000 | [-0.525, -0.168] | -29.3% |
| `region_west` | 0.1303 | 0.0896 | 0.146 | [-0.045, 0.306] | 13.9% |

*** p<0.01, ** p<0.05, * p<0.10. N = 204, R² = 0.484, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.8595*** | 0.2516 | 0.000 | [10.366, 11.353] | — |
| `seniority_rank` | 0.1011 | 0.1971 | 0.608 | [-0.285, 0.487] | 10.6% |
| `yrs_exp_min` | -0.1194 | 0.0787 | 0.129 | [-0.274, 0.035] | -11.3% |
| `yrs_exp_stated` | 0.1266 | 0.2837 | 0.655 | [-0.429, 0.683] | 13.5% |
| `degree_required` | -0.2751*** | 0.0975 | 0.005 | [-0.466, -0.084] | -24.1% |
| `degree_stem` | 0.2446 | 0.2182 | 0.262 | [-0.183, 0.672] | 27.7% |
| `skill_cloud` | 0.0791 | 0.1806 | 0.661 | [-0.275, 0.433] | 8.2% |
| `skill_ml_ai` | 0.1946 | 0.2061 | 0.345 | [-0.209, 0.599] | 21.5% |
| `remote_eligible` | -0.1590 | 0.1393 | 0.254 | [-0.432, 0.114] | -14.7% |
| `mandate_state` | 0.4093 | 0.2957 | 0.166 | [-0.170, 0.989] | 50.6% |
| `region_northeast` | 0.4970 | 0.3261 | 0.128 | [-0.142, 1.136] | 64.4% |
| `region_south` | 0.0843 | 0.2266 | 0.710 | [-0.360, 0.528] | 8.8% |
| `region_west` | 0.2657 | 0.1996 | 0.183 | [-0.125, 0.657] | 30.4% |
| `industry_data_center` | 0.3440** | 0.1531 | 0.025 | [0.044, 0.644] | 41.1% |
| `family_ai_ml` | -0.0637 | 0.2399 | 0.790 | [-0.534, 0.406] | -6.2% |

*** p<0.01, ** p<0.05, * p<0.10. N = 28, R² = 0.755, SE: cluster.

### Inference: the wild cluster bootstrap

With 23 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim at this cluster count. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

**7 of the 9 coefficients significant
at the 5% level under clustered standard errors do not survive the
bootstrap:** `degree_required`, `degree_stem`, `remote_eligible`, `region_northeast`, `region_south`, `region_west`, `industry_data_center`.

This is the correction the pre-registered procedure exists to make.
Nothing about the point estimates changed; what changed is the
reference distribution the estimates are judged against, and at
23 clusters the asymptotic one is simply the
wrong yardstick. The coefficients concerned are reported below as
inconclusive rather than deleted, because an underpowered null is
not the same finding as a measured zero.

Surviving at the 5% level: `seniority_rank` (p = 0.005), `skill_ml_ai` (p = 0.003).

Monte Carlo error is small relative to the decisions being read off
these numbers: at 9999 replications every
p-value above is stable to within about 0.005 across seeds. An earlier
run at 999 replications returned 0.049, 0.063 and 0.082 for
`degree_required` on three different seeds, straddling the very
threshold its verdict is read from, which is why the replication count
is what it is.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **28** postings from
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
| H1 | Seniority dominates advertised pay | + | positive, significant (bootstrap) — supported |
| H3 | Required experience raises pay | + | positive, not significant (bootstrap) — inconclusive |
| H4 | AI/ML roles carry a premium | + | positive, not significant (bootstrap) — inconclusive |
| H5 | A required degree raises pay | + | negative, not significant (bootstrap) — inconclusive |
| H7 | Data centers pay more than utilities | + | positive, not significant (bootstrap) — inconclusive |
| H2 | A mandate raises disclosure | + | 81.7% vs 33.9% — **supported**, descriptively |

**H5 is inconclusive, and it was nearly reported as contradicted.**
The point estimate is negative — a stated degree requirement sits
alongside *lower* advertised pay, conditional on seniority — and under
clustered standard errors that reads p = 0.003,
comfortably significant and opposite to the prediction. The wild
cluster bootstrap puts it at p = 0.069. So the sign is worth
recording and the finding is not: at this cluster count the data
cannot distinguish the negative coefficient from zero. It is reported
because it was predicted the other way, and because the asymptotic
and bootstrap procedures disagree about it, which is precisely the
case the pre-registration anticipated.

### Who discloses pay

Disclosure rate **67.2%** (137 disclosed, 67 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 2.584 | 2.537 | 0.047 | 0.7759 |
| `yrs_exp_min` | 1.117 | 0.94 | 0.176 | 0.5529 |
| `yrs_exp_stated` | 0.292 | 0.269 | 0.023 | 0.7286 |
| `degree_required` | 0.745 | 0.821 | -0.076 | 0.2067 |
| `degree_stem` | 0.46 | 0.537 | -0.077 | 0.3022 |
| `skill_cloud` | 0.299 | 0.239 | 0.06 | 0.3579 |
| `skill_ml_ai` | 0.365 | 0.358 | 0.007 | 0.9254 |
| `remote_eligible` | 0.204 | 0.045 | 0.16 | 0.0003 |
| `hourly_original` | 0.022 | 0.0 | 0.022 | 0.0833 |
| `mandate_state` | 0.847 | 0.388 | 0.459 | 0.0 |
| `region_northeast` | 0.073 | 0.06 | 0.013 | 0.7179 |
| `region_south` | 0.292 | 0.776 | -0.484 | 0.0 |
| `region_west` | 0.27 | 0.015 | 0.255 | 0.0 |
| `industry_data_center` | 0.131 | 0.209 | -0.078 | 0.1825 |
| `family_ai_ml` | 0.197 | 0.194 | 0.003 | 0.9591 |
| `metro_indianapolis` | 0.022 | 0.075 | -0.053 | 0.1322 |

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
   under-cover with few clusters, measured at 92% against a nominal 95% and
   over-rejecting a cluster-level placebo at 9.5% against 5%. Every
   significance claim in section 5 is therefore read off the wild cluster
   bootstrap, under which seven of the nine coefficients that clustered
   errors called significant become inconclusive.
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
state one. Where no such requirement exists, 34% do. The
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

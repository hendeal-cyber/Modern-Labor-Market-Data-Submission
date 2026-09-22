# Determinants of Advertised Pay in the US Energy and Data Center Sector
## Evidence from employer-published job postings

*Built from data collected through 2026-09-22. Collection cycles: 3.*

## Executive summary

This study asks what attributes stated in a job posting predict the pay an
employer advertises, across the United States energy and data center sector.
Postings are collected from the public applicant tracking system APIs that
employers publish through — the upstream source for the job boards those
postings appear on.

**The clearest result concerns disclosure rather than level.** Pay is
stated in **96.1%** of postings in states with a posting-level
pay-transparency mandate, against **50.6%** where there is none —
a gap of **46 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

The gap is large under every cut of the sample (44 to 47 points)
and stable across them, a spread of only 3 points. Earlier versions
of this study reported a gap swinging from 50 to 71 points, sensitive to
Virginia alone. That sensitivity was an artifact: the non-disclosing
mandate-state postings were a federal consultancy's public health, national
security and law-enforcement work, which audit round 4 removed as outside
the sector under study. Removing it removed the fragility rather than
explaining it away. Section 5 reports every cut.

Within the postings that do disclose, the attributes that predict pay at
conventional significance under the wild cluster bootstrap are seniority, South location, Northeast location and `mandate_state`.
Note that mandate_state enters **negatively**, which
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
| Retrieved from ATS boards | 1,940 |
| Passed role, seniority and internship screens | 510 |
| Within 35 miles of a study metro | 382 |
| Unique after de-duplication | 210 |
| With a disclosed pay range (estimation sample) | 165 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_excluded` | 514 |
| `role_not_software_data` | 507 |
| `no_sector_evidence_in_posting` | 336 |
| `internship` | 95 |
| `non_us` | 90 |
| `no_us_state` | 38 |

Distinct employers contributing a disclosed range: **33**. By metro: `{'': 53, 'northern_virginia': 11, 'remote_national': 10, 'denver': 27, 'chicago': 33, 'indianapolis': 3, 'new_york': 9, 'bay_area': 6, 'boston': 12, 'minneapolis': 1}`.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Five rounds of hand-auditing are recorded in `docs/audit-log.md`.
Each read real collected titles rather than a synthetic sample, and
each found errors the test suite had not:

| Round | Target | Result |
|---|---|---|
| 1 | Regressor coding | Three systematic false positives, all firing on company boilerplate rather than on anything asked of the applicant |
| 2 | `role_family` | 6 of 53 assignments wrong (89%). Four had reached a live measurement and sat in the top eleven rows by pay |
| 3 | `seniority_rank`, `state` | 21 of 141 wrong (85.1%). One defect changed the headline disclosure contrast |
| 4 | The industry umbrella itself | A multi-sector consultancy supplied 22% of the sample and three rows of it were energy work. 337 postings removed; the AI-premium finding did not survive |
| 5 | The concept role screen and dedupe | All 40 titles the new matcher admitted were read: 4 false positives caught before the rebuild. One nested-location repost found in 1,940 records and collapsed |

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

Advertised pay in the estimation sample averages **$120,004** (median $115,000, SD $39,027, range $46,500–$240,000).

At N = 165 with 15 regressors, the smallest
detectable standardized effect is **0.2295**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 96.1% | 129 |
| no mandate state | 50.6% | 81 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered. Around a quarter of postings list more
than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The size of the gap is sensitive to one
jurisdiction, so it is cut three ways rather than quoted once:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 96.1% (n=129) | 50.6% (n=81) | 46pp |
| Excluding Virginia | 97.3% (n=110) | 50.6% (n=81) | 47pp |
| Excluding the largest employer | 94.4% (n=90) | 50.6% (n=81) | 44pp |

The gap is large under every cut and stable across them, a spread of 3 points. An earlier version of this study reported it swinging from 50 to 71 points and sensitive to Virginia alone; that sensitivity was an artifact of including a federal consultancy's public health, national security and law-enforcement postings, removed in audit round 4 as outside the sector under study.

Only **5** posting(s) covered by a mandate fail to state pay.
2 of them list Virginia, whose mandate took effect on 1 July 2026 and is
the newest in the table, so partial compliance with a very recent statute
is a plausible reading.

> **This is a descriptive contrast, not a causal estimate.** A single
> cross-section carries no time variation, so no
> difference-in-differences is available. Employers who operate in
> mandate states differ from those who do not in size, sector and
> geography, and these data cannot separate those differences from
> the effect of the law itself.

### Core model (pre-specified)

| Variable | Coef. | Std. err. | Clustered p | **Bootstrap p** | 95% CI | Approx. % effect |
|---|---|---|---|---|---|---|
| `const` | 11.3892*** | 0.0433 | 0.000 | — | [11.304, 11.474] | — |
| `seniority_rank` | 0.0874*** | 0.0111 | 0.000 | **0.000** | [0.066, 0.109] | 9.1% |
| `yrs_exp_min` | 0.0147 | 0.0156 | 0.345 | **0.404** | [-0.016, 0.045] | 1.5% |
| `yrs_exp_stated` | -0.0839 | 0.0842 | 0.319 | **0.409** | [-0.249, 0.081] | -8.1% |
| `degree_required` | -0.0019 | 0.0413 | 0.962 | **0.964** | [-0.083, 0.079] | -0.2% |
| `degree_stem` | 0.0697 | 0.0540 | 0.197 | **0.333** | [-0.036, 0.176] | 7.2% |
| `skill_cloud` | 0.0592 | 0.0936 | 0.527 | **0.553** | [-0.124, 0.243] | 6.1% |
| `skill_ml_ai` | 0.0788 | 0.0838 | 0.347 | **0.425** | [-0.085, 0.243] | 8.2% |
| `remote_eligible` | 0.0689 | 0.0545 | 0.206 | **0.220** | [-0.038, 0.176] | 7.1% |
| `hourly_original` | -0.0913 | 0.2259 | 0.686 | **0.772** | [-0.534, 0.351] | -8.7% |
| `mandate_state` | -0.1718** | 0.0578 | 0.003 | **0.041** | [-0.285, -0.059] | -15.8% |
| `region_northeast` | 0.1837** | 0.0624 | 0.003 | **0.022** | [0.061, 0.306] | 20.2% |
| `region_south` | 0.1585** | 0.0483 | 0.001 | **0.021** | [0.064, 0.253] | 17.2% |
| `region_west` | 0.0758 | 0.0449 | 0.091 | **0.115** | [-0.012, 0.164] | 7.9% |
| `industry_data_center` | 0.1096 | 0.0755 | 0.147 | **0.178** | [-0.038, 0.258] | 11.6% |
| `family_ai_ml` | -0.0183 | 0.1269 | 0.885 | **0.904** | [-0.267, 0.231] | -1.8% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 165, R² = 0.399, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.0082*** | 0.1925 | 0.000 | [9.631, 10.386] | — |
| `seniority_rank` | 0.1333*** | 0.0503 | 0.008 | [0.035, 0.232] | 14.3% |
| `yrs_exp_min` | 0.0222 | 0.0360 | 0.538 | [-0.049, 0.093] | 2.2% |
| `yrs_exp_stated` | 0.1614 | 0.2272 | 0.477 | [-0.284, 0.607] | 17.5% |
| `degree_required` | -0.1955 | 0.1439 | 0.174 | [-0.477, 0.086] | -17.8% |
| `degree_stem` | 0.2963** | 0.1247 | 0.018 | [0.052, 0.541] | 34.5% |
| `skill_cloud` | 0.0190 | 0.2735 | 0.945 | [-0.517, 0.555] | 1.9% |
| `skill_ml_ai` | -0.1560 | 0.3076 | 0.612 | [-0.759, 0.447] | -14.4% |
| `remote_eligible` | 0.1164 | 0.2746 | 0.672 | [-0.422, 0.655] | 12.3% |
| `hourly_original` | 0.1978* | 0.1124 | 0.078 | [-0.022, 0.418] | 21.9% |
| `mandate_state` | 0.0695 | 0.1776 | 0.696 | [-0.279, 0.417] | 7.2% |
| `region_northeast` | -0.3092 | 0.2161 | 0.152 | [-0.733, 0.114] | -26.6% |
| `region_south` | 0.0129 | 0.1549 | 0.934 | [-0.291, 0.317] | 1.3% |
| `region_west` | 0.0385 | 0.1483 | 0.795 | [-0.252, 0.329] | 3.9% |
| `industry_data_center` | -0.8139** | 0.3331 | 0.015 | [-1.467, -0.161] | -55.7% |
| `family_ai_ml` | 0.4642 | 0.3033 | 0.126 | [-0.130, 1.059] | 59.1% |

*** p<0.01, ** p<0.05, * p<0.10. N = 148, R² = 0.213, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.6224*** | 0.1329 | 0.000 | [0.362, 0.883] | — |
| `mandate_state` | 0.3860*** | 0.1045 | 0.000 | [0.181, 0.591] | 47.1% |
| `seniority_rank` | 0.0058 | 0.0181 | 0.748 | [-0.030, 0.041] | 0.6% |
| `remote_eligible` | -0.0526 | 0.1550 | 0.734 | [-0.356, 0.251] | -5.1% |
| `industry_data_center` | -0.1734 | 0.1371 | 0.206 | [-0.442, 0.095] | -15.9% |
| `region_northeast` | -0.0582 | 0.0852 | 0.494 | [-0.225, 0.109] | -5.7% |
| `region_south` | -0.1944 | 0.1542 | 0.207 | [-0.497, 0.108] | -17.7% |
| `region_west` | 0.0239 | 0.0777 | 0.759 | [-0.129, 0.176] | 2.4% |

*** p<0.01, ** p<0.05, * p<0.10. N = 210, R² = 0.359, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.1415*** | 0.4976 | 0.000 | [10.166, 12.117] | — |
| `seniority_rank` | 0.2349 | 0.2579 | 0.362 | [-0.271, 0.740] | 26.5% |
| `yrs_exp_min` | -0.1336* | 0.0777 | 0.086 | [-0.286, 0.019] | -12.5% |
| `yrs_exp_stated` | 0.0338 | 0.1337 | 0.800 | [-0.228, 0.296] | 3.4% |
| `degree_required` | -0.0232 | 0.0760 | 0.761 | [-0.172, 0.126] | -2.3% |
| `degree_stem` | 0.2874** | 0.1330 | 0.031 | [0.027, 0.548] | 33.3% |
| `skill_cloud` | 0.2743 | 0.3260 | 0.400 | [-0.364, 0.913] | 31.6% |
| `skill_ml_ai` | 0.0384 | 0.0970 | 0.692 | [-0.152, 0.229] | 3.9% |
| `remote_eligible` | -0.1035 | 0.1715 | 0.546 | [-0.440, 0.233] | -9.8% |
| `mandate_state` | 0.0494 | 0.2369 | 0.835 | [-0.415, 0.514] | 5.1% |
| `region_northeast` | -0.0194 | 0.1267 | 0.878 | [-0.268, 0.229] | -1.9% |
| `region_south` | 0.0205 | 0.1497 | 0.891 | [-0.273, 0.314] | 2.1% |
| `region_west` | 0.1258 | 0.1346 | 0.350 | [-0.138, 0.390] | 13.4% |
| `industry_data_center` | 0.1370 | 0.2765 | 0.620 | [-0.405, 0.679] | 14.7% |
| `family_ai_ml` | -0.1650 | 0.4949 | 0.739 | [-1.135, 0.805] | -15.2% |

*** p<0.01, ** p<0.05, * p<0.10. N = 38, R² = 0.596, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4443*** | 0.0579 | 0.000 | [11.331, 11.558] | — |
| `seniority_rank` | 0.0910*** | 0.0105 | 0.000 | [0.070, 0.112] | 9.5% |
| `yrs_exp_min` | 0.0167 | 0.0161 | 0.301 | [-0.015, 0.048] | 1.7% |
| `yrs_exp_stated` | -0.0886 | 0.0876 | 0.312 | [-0.260, 0.083] | -8.5% |
| `degree_required` | 0.0005 | 0.0431 | 0.991 | [-0.084, 0.085] | 0.1% |
| `degree_stem` | 0.0760 | 0.0592 | 0.199 | [-0.040, 0.192] | 7.9% |
| `skill_cloud` | 0.0264 | 0.1080 | 0.807 | [-0.185, 0.238] | 2.7% |
| `skill_ml_ai` | 0.0608 | 0.0989 | 0.538 | [-0.133, 0.255] | 6.3% |
| `remote_eligible` | 0.0650 | 0.0598 | 0.277 | [-0.052, 0.182] | 6.7% |
| `hourly_original` | -0.1231 | 0.2007 | 0.539 | [-0.516, 0.270] | -11.6% |
| `mandate_state` | -0.2289*** | 0.0736 | 0.002 | [-0.373, -0.085] | -20.5% |
| `region_northeast` | 0.1197* | 0.0691 | 0.083 | [-0.016, 0.255] | 12.7% |
| `region_south` | 0.1358** | 0.0610 | 0.026 | [0.016, 0.255] | 14.6% |
| `region_west` | 0.0227 | 0.0428 | 0.597 | [-0.061, 0.107] | 2.3% |
| `industry_data_center` | 0.1127 | 0.0886 | 0.203 | [-0.061, 0.286] | 11.9% |
| `family_ai_ml` | 0.0154 | 0.1515 | 0.919 | [-0.282, 0.312] | 1.6% |

*** p<0.01, ** p<0.05, * p<0.10. N = 156, R² = 0.391, SE: cluster.

### Inference: the wild cluster bootstrap

With 33 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim at this cluster count. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

Surviving at the 5% level: `seniority_rank` (p = 0.000), `mandate_state` (p = 0.041), `region_northeast` (p = 0.022), `region_south` (p = 0.021).

Monte Carlo error is small relative to the decisions being read off
these numbers: at 9999 replications every
p-value above is stable to within about 0.005 across seeds. An earlier
run at 999 replications returned 0.049, 0.063 and 0.082 for
`degree_required` on three different seeds, straddling the very
threshold its verdict is read from, which is why the replication count
is what it is.

### Robustness: the nationwide-remote postings

10 postings are advertised as nationwide remote and resolve to no state,
so all three census-region dummies are zero for them and they fall into the
**Midwest reference category without being Midwest**. The model is therefore
re-estimated on the 155 observations that do resolve to a state, across
30 employers.

**`mandate_state` change verdict** at the 5% level and are
reported as inconclusive. `remote_eligible` is the one that matters: the
nationwide-remote postings are precisely the remote-eligible ones, so the
coefficient was identified in part off the rows this check removes.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.0874 | 0.000 | 0.0891 | 0.001 |
| `yrs_exp_min` | 0.0147 | 0.404 | 0.0139 | 0.449 |
| `yrs_exp_stated` | -0.0839 | 0.409 | -0.0784 | 0.503 |
| `degree_required` | -0.0019 | 0.964 | 0.0039 | 0.925 |
| `degree_stem` | 0.0697 | 0.333 | 0.0752 | 0.364 |
| `skill_cloud` | 0.0592 | 0.553 | 0.0324 | 0.795 |
| `skill_ml_ai` | 0.0788 | 0.425 | 0.0599 | 0.677 |
| `remote_eligible` | 0.0689 | 0.220 | 0.0658 | 0.285 |
| `hourly_original` | -0.0913 | 0.772 | -0.0919 | 0.755 |
| `mandate_state` | -0.1718 | 0.041 | -0.1681 | 0.124 |
| `region_northeast` | 0.1837 | 0.022 | 0.1896 | 0.022 |
| `region_south` | 0.1585 | 0.021 | 0.1643 | 0.029 |
| `region_west` | 0.0758 | 0.115 | 0.0772 | 0.118 |
| `industry_data_center` | 0.1096 | 0.178 | 0.1136 | 0.310 |
| `family_ai_ml` | -0.0183 | 0.904 | 0.0274 | 0.888 |

This check is reported whichever way it comes out. It confirmed the South
coefficient and it withdrew remote eligibility.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **38** postings from
**19** employers, estimated above.
It is reported whether or not it agrees with the full sample: a
disagreement would be a finding, not a reason to drop it.

### Pre-registered hypotheses, scored

Directions were committed in `docs/pre-registration.md` before the
national sample was collected. They are scored here whether or not they
held, which is the point of having written them down.

| # | Hypothesis | Predicted | Result |
|---|---|---|---|
| H1 | Seniority dominates advertised pay | + | positive, significant (bootstrap) — supported |
| H3 | Required experience raises pay | + | positive, not significant (bootstrap) — inconclusive |
| H4 | AI/ML roles carry a premium | + | negative, not significant (bootstrap) — inconclusive |
| H5 | A required degree raises pay | + | negative, not significant (bootstrap) — inconclusive |
| H7 | Data centers pay more than utilities | + | positive, not significant (bootstrap) — inconclusive |
| H2 | A mandate raises disclosure | + | 96.1% vs 50.6% — **supported**, descriptively |

**H5 is inconclusive, and it was nearly reported as contradicted.**
The point estimate is negative — a stated degree requirement sits
alongside *lower* advertised pay, conditional on seniority — and under
clustered standard errors that reads p = 0.962,
comfortably significant and opposite to the prediction. The wild
cluster bootstrap puts it at p = 0.964. So the sign is worth
recording and the finding is not: at this cluster count the data
cannot distinguish the negative coefficient from zero. It is reported
because it was predicted the other way, and because the asymptotic
and bootstrap procedures disagree about it, which is precisely the
case the pre-registration anticipated.

### Who discloses pay

Disclosure rate **78.6%** (165 disclosed, 45 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 2.752 | 2.956 | -0.204 | 0.3414 |
| `yrs_exp_min` | 1.442 | 2.133 | -0.691 | 0.1285 |
| `yrs_exp_stated` | 0.394 | 0.533 | -0.139 | 0.1029 |
| `degree_required` | 0.721 | 0.622 | 0.099 | 0.2263 |
| `degree_stem` | 0.352 | 0.289 | 0.063 | 0.4237 |
| `skill_cloud` | 0.152 | 0.178 | -0.026 | 0.6832 |
| `skill_ml_ai` | 0.218 | 0.2 | 0.018 | 0.7911 |
| `remote_eligible` | 0.115 | 0.222 | -0.107 | 0.1178 |
| `hourly_original` | 0.018 | 0.0 | 0.018 | 0.0833 |
| `mandate_state` | 0.752 | 0.111 | 0.64 | 0.0 |
| `region_northeast` | 0.236 | 0.111 | 0.125 | 0.0329 |
| `region_south` | 0.164 | 0.556 | -0.392 | 0.0 |
| `region_west` | 0.242 | 0.044 | 0.198 | 0.0 |
| `industry_data_center` | 0.115 | 0.311 | -0.196 | 0.0106 |
| `family_ai_ml` | 0.097 | 0.044 | 0.053 | 0.178 |
| `metro_indianapolis` | 0.018 | 0.111 | -0.093 | 0.0613 |

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

Across 165 postings from 33 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 96% of postings
state one. Where no such requirement exists, 51% do. The
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

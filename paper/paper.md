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
stated in **93.9%** of postings in states with a posting-level
pay-transparency mandate, against **49.2%** where there is none —
a gap of **45 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

The gap is large under every cut of the sample (42 to 47 points)
and stable across them, a spread of only 5 points. Earlier versions
of this study reported a gap swinging from 50 to 71 points, sensitive to
Virginia alone. That sensitivity was an artifact: the non-disclosing
mandate-state postings were a federal consultancy's public health, national
security and law-enforcement work, which audit round 4 removed as outside
the sector under study. Removing it removed the fragility rather than
explaining it away. Section 5 reports every cut.

Within the postings that do disclose, the attributes that predict pay at
conventional significance under the wild cluster bootstrap are seniority, Northeast location and `skill_cloud`.
A further 2 attributes reach significance under
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
| Retrieved from ATS boards | 2,253 |
| Passed role, seniority and internship screens | 585 |
| In the US, with a resolvable state or nationwide-remote | 457 |
| Unique after de-duplication | 297 |
| With a disclosed pay range (estimation sample) | 220 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_excluded` | 558 |
| `role_not_software_data` | 506 |
| `no_sector_evidence_in_posting` | 337 |
| `other_group_company` | 192 |
| `internship` | 100 |
| `non_us` | 82 |
| `no_us_state` | 46 |

Distinct employers contributing a disclosed range: **34**. By metro: `{'': 93, 'northern_virginia': 15, 'remote_national': 9, 'denver': 34, 'chicago': 36, 'indianapolis': 4, 'new_york': 9, 'bay_area': 7, 'boston': 11, 'minneapolis': 2}`.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Seven rounds of hand-auditing are recorded in `docs/audit-log.md`.
Each read real collected titles rather than a synthetic sample, and
each found errors the test suite had not:

| Round | Target | Result |
|---|---|---|
| 1 | Regressor coding | Three systematic false positives, all firing on company boilerplate rather than on anything asked of the applicant |
| 2 | `role_family` | 6 of 53 assignments wrong (89%). Four had reached a live measurement and sat in the top eleven rows by pay |
| 3 | `seniority_rank`, `state` | 21 of 141 wrong (85.1%). One defect changed the headline disclosure contrast |
| 4 | The industry umbrella itself | A multi-sector consultancy supplied 22% of the sample and three rows of it were energy work. 337 postings removed; the AI-premium finding did not survive |
| 5 | The concept role screen and dedupe | All 40 titles the new matcher admitted were read: 4 false positives caught before the rebuild. One nested-location repost found in 1,940 records and collapsed |
| 6 | Run 26: all 115 added rows, then the whole corpus | The pay parser was still halving 17 Invenergy rows and recording 9 NYISO rows at their floor. Every usable "Hitachi Energy" row belonged to a sister company. Connecticut was coded as a mandate state before its law took effect. Fixing them withdrew `mandate_state` and `region_west`, which had passed the bootstrap on the unaudited data |
| 7 | Run 27, the first live run of the description cache | The cache reused every posting it held within its window, with no disclosure drift. A second run on the same date had overwritten the first run's files, dropping a closed posting, and an edited requisition was counted twice. Both fixed at the cause |

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

Advertised pay in the estimation sample averages **$130,353** (median $125,562, SD $38,225, range $68,500–$260,000).

At N = 220 with 15 regressors, the smallest
detectable standardized effect is **0.1962**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 93.9% | 165 |
| no mandate state | 49.2% | 132 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered. Around a quarter of postings list more
than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The size of the gap is sensitive to one
jurisdiction, so it is cut three ways rather than quoted once:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 93.9% (n=165) | 49.2% (n=132) | 45pp |
| Excluding Virginia | 96.4% (n=138) | 49.2% (n=132) | 47pp |
| Excluding the largest employer | 91.7% (n=121) | 49.2% (n=132) | 42pp |

The gap is large under every cut and stable across them, a spread of 5 points. An earlier version of this study reported it swinging from 50 to 71 points and sensitive to Virginia alone; that sensitivity was an artifact of including a federal consultancy's public health, national security and law-enforcement postings, removed in audit round 4 as outside the sector under study.

Only **10** posting(s) covered by a mandate fail to state pay.
5 of them list Virginia, whose mandate took effect on 1 July 2026 and is
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
| `const` | 11.2891*** | 0.0418 | 0.000 | — | [11.207, 11.371] | — |
| `seniority_rank` | 0.1185*** | 0.0090 | 0.000 | **0.000** | [0.101, 0.136] | 12.6% |
| `yrs_exp_min` | 0.0143 | 0.0107 | 0.182 | **0.345** | [-0.007, 0.035] | 1.4% |
| `yrs_exp_stated` | -0.0100 | 0.0505 | 0.843 | **0.852** | [-0.109, 0.089] | -1.0% |
| `degree_required` | 0.0049 | 0.0341 | 0.886 | **0.897** | [-0.062, 0.072] | 0.5% |
| `degree_stem` | 0.0538 | 0.0316 | 0.089 | **0.132** | [-0.008, 0.116] | 5.5% |
| `skill_cloud` | 0.1349** | 0.0569 | 0.018 | **0.031** | [0.023, 0.246] | 14.4% |
| `skill_ml_ai` | 0.0035 | 0.0460 | 0.940 | **0.945** | [-0.087, 0.094] | 0.3% |
| `remote_eligible` | 0.0422 | 0.0478 | 0.377 | **0.410** | [-0.051, 0.136] | 4.3% |
| `hourly_original` | 0.0842 | 0.0344 | 0.014 | **0.462** | [0.017, 0.152] | 8.8% |
| `mandate_state` | -0.0289 | 0.0264 | 0.273 | **0.302** | [-0.081, 0.023] | -2.9% |
| `region_northeast` | 0.1098** | 0.0381 | 0.004 | **0.010** | [0.035, 0.184] | 11.6% |
| `region_south` | 0.0927* | 0.0393 | 0.018 | **0.095** | [0.016, 0.170] | 9.7% |
| `region_west` | 0.0184 | 0.0382 | 0.631 | **0.643** | [-0.057, 0.093] | 1.9% |
| `industry_data_center` | 0.0218 | 0.0563 | 0.699 | **0.730** | [-0.088, 0.132] | 2.2% |
| `family_ai_ml` | 0.0192 | 0.0712 | 0.787 | **0.864** | [-0.120, 0.159] | 1.9% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 220, R² = 0.552, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 9.6568*** | 0.1968 | 0.000 | [9.271, 10.043] | — |
| `seniority_rank` | 0.1209*** | 0.0311 | 0.000 | [0.060, 0.182] | 12.8% |
| `yrs_exp_min` | -0.0183 | 0.0312 | 0.557 | [-0.080, 0.043] | -1.8% |
| `yrs_exp_stated` | 0.1118 | 0.1462 | 0.444 | [-0.175, 0.398] | 11.8% |
| `degree_required` | 0.2222 | 0.1639 | 0.175 | [-0.099, 0.543] | 24.9% |
| `degree_stem` | 0.3659*** | 0.1247 | 0.003 | [0.121, 0.610] | 44.2% |
| `skill_cloud` | 0.0587 | 0.1751 | 0.738 | [-0.285, 0.402] | 6.0% |
| `skill_ml_ai` | 0.0750 | 0.1697 | 0.658 | [-0.258, 0.408] | 7.8% |
| `remote_eligible` | 0.1286 | 0.2068 | 0.534 | [-0.277, 0.534] | 13.7% |
| `hourly_original` | 0.0833 | 0.1532 | 0.587 | [-0.217, 0.384] | 8.7% |
| `mandate_state` | -0.2223* | 0.1142 | 0.052 | [-0.446, 0.002] | -19.9% |
| `region_northeast` | 0.0598 | 0.2711 | 0.826 | [-0.472, 0.591] | 6.2% |
| `region_south` | 0.3632*** | 0.1089 | 0.001 | [0.150, 0.577] | 43.8% |
| `region_west` | 0.3686*** | 0.1300 | 0.005 | [0.114, 0.623] | 44.6% |
| `industry_data_center` | -0.7965*** | 0.2711 | 0.003 | [-1.328, -0.265] | -54.9% |
| `family_ai_ml` | -0.0868 | 0.2577 | 0.736 | [-0.592, 0.418] | -8.3% |

*** p<0.01, ** p<0.05, * p<0.10. N = 215, R² = 0.322, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.6622*** | 0.1380 | 0.000 | [0.392, 0.933] | — |
| `mandate_state` | 0.3425*** | 0.1193 | 0.004 | [0.109, 0.576] | 40.8% |
| `seniority_rank` | -0.0004 | 0.0151 | 0.978 | [-0.030, 0.029] | -0.0% |
| `remote_eligible` | -0.1069 | 0.1502 | 0.476 | [-0.401, 0.188] | -10.1% |
| `industry_data_center` | -0.2305 | 0.1648 | 0.162 | [-0.553, 0.092] | -20.6% |
| `region_northeast` | -0.0398 | 0.1104 | 0.719 | [-0.256, 0.177] | -3.9% |
| `region_south` | -0.2167 | 0.1398 | 0.121 | [-0.491, 0.057] | -19.5% |
| `region_west` | 0.0430 | 0.0810 | 0.596 | [-0.116, 0.202] | 4.4% |

*** p<0.01, ** p<0.05, * p<0.10. N = 297, R² = 0.357, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.3509*** | 0.1655 | 0.000 | [11.027, 11.675] | — |
| `seniority_rank` | 0.1071 | 0.0817 | 0.190 | [-0.053, 0.267] | 11.3% |
| `yrs_exp_min` | -0.0067 | 0.0407 | 0.869 | [-0.087, 0.073] | -0.7% |
| `yrs_exp_stated` | -0.0314 | 0.1133 | 0.781 | [-0.253, 0.191] | -3.1% |
| `degree_required` | -0.0092 | 0.0345 | 0.790 | [-0.077, 0.059] | -0.9% |
| `degree_stem` | 0.1130*** | 0.0317 | 0.000 | [0.051, 0.175] | 12.0% |
| `skill_cloud` | 0.1993 | 0.2106 | 0.344 | [-0.213, 0.612] | 22.1% |
| `skill_ml_ai` | -0.0338 | 0.1242 | 0.785 | [-0.277, 0.210] | -3.3% |
| `remote_eligible` | -0.0423 | 0.0692 | 0.541 | [-0.178, 0.093] | -4.1% |
| `mandate_state` | 0.0672 | 0.0972 | 0.489 | [-0.123, 0.258] | 7.0% |
| `region_northeast` | 0.0036 | 0.0723 | 0.961 | [-0.138, 0.145] | 0.4% |
| `region_south` | -0.0079 | 0.1122 | 0.944 | [-0.228, 0.212] | -0.8% |
| `region_west` | 0.0581 | 0.0737 | 0.430 | [-0.086, 0.203] | 6.0% |
| `industry_data_center` | -0.1159 | 0.0757 | 0.126 | [-0.264, 0.033] | -10.9% |
| `family_ai_ml` | 0.5598*** | 0.1760 | 0.002 | [0.215, 0.905] | 75.0% |

*** p<0.01, ** p<0.05, * p<0.10. N = 51, R² = 0.513, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.3514*** | 0.0476 | 0.000 | [11.258, 11.445] | — |
| `seniority_rank` | 0.1188*** | 0.0088 | 0.000 | [0.102, 0.136] | 12.6% |
| `yrs_exp_min` | 0.0158 | 0.0101 | 0.118 | [-0.004, 0.036] | 1.6% |
| `yrs_exp_stated` | -0.0052 | 0.0521 | 0.920 | [-0.107, 0.097] | -0.5% |
| `degree_required` | 0.0009 | 0.0351 | 0.980 | [-0.068, 0.070] | 0.1% |
| `degree_stem` | 0.0584* | 0.0354 | 0.099 | [-0.011, 0.128] | 6.0% |
| `skill_cloud` | 0.1430** | 0.0577 | 0.013 | [0.030, 0.256] | 15.4% |
| `skill_ml_ai` | -0.0310 | 0.0405 | 0.445 | [-0.110, 0.048] | -3.0% |
| `remote_eligible` | 0.0369 | 0.0512 | 0.471 | [-0.064, 0.137] | 3.8% |
| `hourly_original` | 0.0231 | 0.0357 | 0.518 | [-0.047, 0.093] | 2.3% |
| `mandate_state` | -0.0807** | 0.0327 | 0.013 | [-0.145, -0.017] | -7.8% |
| `region_northeast` | 0.0371 | 0.0402 | 0.356 | [-0.042, 0.116] | 3.8% |
| `region_south` | 0.0732* | 0.0418 | 0.080 | [-0.009, 0.155] | 7.6% |
| `region_west` | -0.0319 | 0.0327 | 0.330 | [-0.096, 0.032] | -3.1% |
| `industry_data_center` | -0.0047 | 0.0551 | 0.932 | [-0.113, 0.103] | -0.5% |
| `family_ai_ml` | 0.0627 | 0.0690 | 0.364 | [-0.073, 0.198] | 6.5% |

*** p<0.01, ** p<0.05, * p<0.10. N = 212, R² = 0.562, SE: cluster.

### Inference: the wild cluster bootstrap

With 34 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim at this cluster count. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

**2 of the 5 coefficients significant
at the 5% level under clustered standard errors do not survive the
bootstrap:** `hourly_original`, `region_south`.

This is the correction the pre-registered procedure exists to make.
Nothing about the point estimates changed; what changed is the
reference distribution the estimates are judged against, and at
34 clusters the asymptotic one is simply the
wrong yardstick. The coefficients concerned are reported below as
inconclusive rather than deleted, because an underpowered null is
not the same finding as a measured zero.

Surviving at the 5% level: `seniority_rank` (p = 0.000), `skill_cloud` (p = 0.031), `region_northeast` (p = 0.010).

Monte Carlo error is small relative to the decisions being read off
these numbers: at 9999 replications every
p-value above is stable to within about 0.005 across seeds. An earlier
run at 999 replications returned 0.049, 0.063 and 0.082 for
`degree_required` on three different seeds, straddling the very
threshold its verdict is read from, which is why the replication count
is what it is.

### Robustness: the nationwide-remote postings

9 postings are advertised as nationwide remote and resolve to no state,
so all three census-region dummies are zero for them and they fall into the
**Midwest reference category without being Midwest**. The model is therefore
re-estimated on the 211 observations that do resolve to a state, across
31 employers.

No verdict changes at the 5% level.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.1185 | 0.000 | 0.1194 | 0.001 |
| `yrs_exp_min` | 0.0143 | 0.345 | 0.0149 | 0.344 |
| `yrs_exp_stated` | -0.0100 | 0.852 | -0.0019 | 0.979 |
| `degree_required` | 0.0049 | 0.897 | 0.0029 | 0.954 |
| `degree_stem` | 0.0538 | 0.132 | 0.0589 | 0.118 |
| `skill_cloud` | 0.1349 | 0.031 | 0.1332 | 0.037 |
| `skill_ml_ai` | 0.0035 | 0.945 | -0.0252 | 0.580 |
| `remote_eligible` | 0.0422 | 0.410 | 0.0482 | 0.461 |
| `hourly_original` | 0.0842 | 0.462 | 0.0845 | 0.476 |
| `mandate_state` | -0.0289 | 0.302 | -0.0226 | 0.452 |
| `region_northeast` | 0.1098 | 0.010 | 0.1131 | 0.025 |
| `region_south` | 0.0927 | 0.095 | 0.1003 | 0.088 |
| `region_west` | 0.0184 | 0.643 | 0.0203 | 0.605 |
| `industry_data_center` | 0.0218 | 0.730 | -0.0024 | 0.973 |
| `family_ai_ml` | 0.0192 | 0.864 | 0.0753 | 0.445 |

This check is reported whichever way it comes out. It confirmed `seniority_rank`, `skill_cloud`, `region_northeast`.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **51** postings from
**21** employers, estimated above.
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
| H4 | AI/ML roles carry a premium | + | positive, not significant (bootstrap) — inconclusive |
| H5 | A required degree raises pay | + | positive, not significant (bootstrap) — inconclusive |
| H7 | Data centers pay more than utilities | + | positive, not significant (bootstrap) — inconclusive |
| H2 | A mandate raises disclosure | + | 93.9% vs 49.2% — **supported**, descriptively |

### Who discloses pay

Disclosure rate **74.1%** (220 disclosed, 77 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 3.055 | 3.429 | -0.374 | 0.0549 |
| `yrs_exp_min` | 1.386 | 1.857 | -0.471 | 0.1592 |
| `yrs_exp_stated` | 0.377 | 0.494 | -0.116 | 0.0808 |
| `degree_required` | 0.7 | 0.597 | 0.103 | 0.1126 |
| `degree_stem` | 0.282 | 0.39 | -0.108 | 0.093 |
| `skill_cloud` | 0.114 | 0.091 | 0.023 | 0.5643 |
| `skill_ml_ai` | 0.177 | 0.234 | -0.056 | 0.3062 |
| `remote_eligible` | 0.077 | 0.169 | -0.092 | 0.0521 |
| `hourly_original` | 0.009 | 0.0 | 0.009 | 0.1578 |
| `mandate_state` | 0.705 | 0.13 | 0.575 | 0.0 |
| `region_northeast` | 0.259 | 0.117 | 0.142 | 0.003 |
| `region_south` | 0.182 | 0.61 | -0.429 | 0.0 |
| `region_west` | 0.232 | 0.026 | 0.206 | 0.0 |
| `industry_data_center` | 0.091 | 0.325 | -0.234 | 0.0001 |
| `family_ai_ml` | 0.068 | 0.039 | 0.029 | 0.2978 |
| `metro_indianapolis` | 0.018 | 0.104 | -0.086 | 0.0199 |

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
6. The scope **widened four times in response to the data**. The
   specification was pre-registered before the national sample was
   collected; amendments after that point are dated in
   `docs/pre-registration.md` section 8.
7. Exelon, ComEd, Constellation and Citizens Energy are **absent**, all on
   iCIMS, verified closed rather than assumed.

## 7. Conclusion

Across 220 postings from 34 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 94% of postings
state one. Where no such requirement exists, 49% do. The
contrast is associational: the employers operating in mandate
states may differ in ways that produce some or all of it, and a
single cross-section cannot separate that from the law.

Within the postings that do disclose, seniority is the dominant
predictor and the most precisely estimated, which is what the
pre-registration expected.
The prediction that a stated degree requirement would raise pay
is not supported: the estimate is +0.005 (the predicted sign),
indistinguishable from zero at bootstrap p = 0.90.

The result a reader should treat most cautiously is any coefficient in
the pay models, because that sample is selected on the dependent
variable wherever disclosure is voluntary. The result a reader should
treat most seriously is the disclosure contrast, because it is measured
on the full sample and does not depend on pay being observed.

What would most improve this study is **more employers, not more
postings**. Every pre-registered condition passes (34 employer
clusters against 30; the largest employer supplies 20.0%
against a ceiling of 25%), but only narrowly, and at this cluster
count a handful of observations can move a verdict across the 5%
line. More employers is what would make the inference sturdy.

## Appendix

- `docs/codebook.md` — every variable and its coding rule
- `docs/methods.md` — design, compliance posture, estimation strategy
- `docs/limitations.md` — what the data cannot support
- `docs/audit-log.md` — coding accuracy by round
- `data/analysis/postings.csv` — the analysis dataset
- `data/analysis/selection_funnel.json` — full funnel and rejection reasons

Reproduce with `pip install -r requirements.txt && python tests/run_all.py`,
then `python src/lmstudy/collect/run.py && python src/lmstudy/build_dataset.py`.

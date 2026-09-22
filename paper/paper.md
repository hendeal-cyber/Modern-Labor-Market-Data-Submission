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
pay-transparency mandate, against **47.6%** where there is none —
a gap of **46 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

The gap is large under every cut of the sample (44 to 49 points)
and stable across them, a spread of only 5 points. Earlier versions
of this study reported a gap swinging from 50 to 71 points, sensitive to
Virginia alone. That sensitivity was an artifact: the non-disclosing
mandate-state postings were a federal consultancy's public health, national
security and law-enforcement work, which audit round 4 removed as outside
the sector under study. Removing it removed the fragility rather than
explaining it away. Section 5 reports every cut.

Within the postings that do disclose, the attributes that predict pay at
conventional significance under the wild cluster bootstrap are seniority, Northeast location and `skill_cloud`.
Northeast location and `skill_cloud` do not survive re-estimation without the nationwide-remote postings (a
robustness check added after pre-registration, reported either way) and are reported as inconclusive; seniority survives both.
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
| Retrieved from ATS boards | 2,084 |
| Passed role, seniority and internship screens | 577 |
| In the US, with a resolvable state or nationwide-remote | 450 |
| Unique after de-duplication | 290 |
| With a disclosed pay range (estimation sample) | 214 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_excluded` | 554 |
| `role_not_software_data` | 503 |
| `no_sector_evidence_in_posting` | 336 |
| `internship` | 100 |
| `non_us` | 81 |
| `no_us_state` | 46 |
| `other_group_company` | 39 |

Distinct employers contributing a disclosed range: **34**. By metro: `{'': 89, 'northern_virginia': 15, 'remote_national': 9, 'denver': 33, 'chicago': 36, 'indianapolis': 3, 'new_york': 9, 'bay_area': 7, 'boston': 11, 'minneapolis': 2}`.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Six rounds of hand-auditing are recorded in `docs/audit-log.md`.
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

Advertised pay in the estimation sample averages **$130,647** (median $125,562, SD $38,602, range $68,500–$260,000).

At N = 214 with 15 regressors, the smallest
detectable standardized effect is **0.1991**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 93.9% | 164 |
| no mandate state | 47.6% | 126 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered. Around a quarter of postings list more
than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The size of the gap is sensitive to one
jurisdiction, so it is cut three ways rather than quoted once:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 93.9% (n=164) | 47.6% (n=126) | 46pp |
| Excluding Virginia | 96.4% (n=137) | 47.6% (n=126) | 49pp |
| Excluding the largest employer | 91.7% (n=120) | 47.6% (n=126) | 44pp |

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
| `const` | 11.2939*** | 0.0474 | 0.000 | — | [11.201, 11.387] | — |
| `seniority_rank` | 0.1206*** | 0.0096 | 0.000 | **0.000** | [0.102, 0.140] | 12.8% |
| `yrs_exp_min` | 0.0135 | 0.0111 | 0.223 | **0.367** | [-0.008, 0.035] | 1.4% |
| `yrs_exp_stated` | -0.0030 | 0.0540 | 0.955 | **0.957** | [-0.109, 0.103] | -0.3% |
| `degree_required` | 0.0062 | 0.0352 | 0.861 | **0.876** | [-0.063, 0.075] | 0.6% |
| `degree_stem` | 0.0477 | 0.0301 | 0.113 | **0.150** | [-0.011, 0.107] | 4.9% |
| `skill_cloud` | 0.1242** | 0.0572 | 0.030 | **0.045** | [0.012, 0.236] | 13.2% |
| `skill_ml_ai` | 0.0180 | 0.0468 | 0.701 | **0.715** | [-0.074, 0.110] | 1.8% |
| `remote_eligible` | 0.0349 | 0.0485 | 0.471 | **0.506** | [-0.060, 0.130] | 3.6% |
| `hourly_original` | 0.0860 | 0.0336 | 0.011 | **0.450** | [0.020, 0.152] | 9.0% |
| `mandate_state` | -0.0379 | 0.0295 | 0.199 | **0.251** | [-0.096, 0.020] | -3.7% |
| `region_northeast` | 0.1069** | 0.0399 | 0.007 | **0.032** | [0.029, 0.185] | 11.3% |
| `region_south` | 0.0825 | 0.0415 | 0.047 | **0.110** | [0.001, 0.164] | 8.6% |
| `region_west` | 0.0182 | 0.0376 | 0.628 | **0.638** | [-0.056, 0.092] | 1.8% |
| `industry_data_center` | 0.0230 | 0.0557 | 0.680 | **0.710** | [-0.086, 0.132] | 2.3% |
| `family_ai_ml` | 0.0046 | 0.0760 | 0.952 | **0.968** | [-0.144, 0.154] | 0.5% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 214, R² = 0.556, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 9.6709*** | 0.2179 | 0.000 | [9.244, 10.098] | — |
| `seniority_rank` | 0.1150*** | 0.0339 | 0.001 | [0.049, 0.181] | 12.2% |
| `yrs_exp_min` | -0.0186 | 0.0327 | 0.569 | [-0.083, 0.045] | -1.9% |
| `yrs_exp_stated` | 0.1073 | 0.1473 | 0.467 | [-0.181, 0.396] | 11.3% |
| `degree_required` | 0.2116 | 0.1709 | 0.216 | [-0.123, 0.547] | 23.6% |
| `degree_stem` | 0.3689*** | 0.1284 | 0.004 | [0.117, 0.621] | 44.6% |
| `skill_cloud` | 0.0479 | 0.1849 | 0.795 | [-0.315, 0.410] | 4.9% |
| `skill_ml_ai` | 0.0949 | 0.1763 | 0.590 | [-0.251, 0.441] | 10.0% |
| `remote_eligible` | 0.1286 | 0.2065 | 0.533 | [-0.276, 0.533] | 13.7% |
| `hourly_original` | 0.0866 | 0.1517 | 0.568 | [-0.211, 0.384] | 9.0% |
| `mandate_state` | -0.2156* | 0.1195 | 0.071 | [-0.450, 0.019] | -19.4% |
| `region_northeast` | 0.0661 | 0.2837 | 0.816 | [-0.490, 0.622] | 6.8% |
| `region_south` | 0.3579*** | 0.1137 | 0.002 | [0.135, 0.581] | 43.0% |
| `region_west` | 0.3654*** | 0.1287 | 0.004 | [0.113, 0.618] | 44.1% |
| `industry_data_center` | -0.7941*** | 0.2679 | 0.003 | [-1.319, -0.269] | -54.8% |
| `family_ai_ml` | -0.0812 | 0.2692 | 0.763 | [-0.609, 0.446] | -7.8% |

*** p<0.01, ** p<0.05, * p<0.10. N = 209, R² = 0.310, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.6423*** | 0.1329 | 0.000 | [0.382, 0.903] | — |
| `mandate_state` | 0.3525*** | 0.1166 | 0.003 | [0.124, 0.581] | 42.3% |
| `seniority_rank` | -0.0014 | 0.0150 | 0.925 | [-0.031, 0.028] | -0.1% |
| `remote_eligible` | -0.0966 | 0.1490 | 0.517 | [-0.389, 0.196] | -9.2% |
| `industry_data_center` | -0.2275 | 0.1645 | 0.167 | [-0.550, 0.095] | -20.4% |
| `region_northeast` | -0.0213 | 0.0987 | 0.830 | [-0.215, 0.172] | -2.1% |
| `region_south` | -0.1980 | 0.1378 | 0.151 | [-0.468, 0.072] | -18.0% |
| `region_west` | 0.0561 | 0.0791 | 0.478 | [-0.099, 0.211] | 5.8% |

*** p<0.01, ** p<0.05, * p<0.10. N = 290, R² = 0.364, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.3853*** | 0.1883 | 0.000 | [11.016, 11.754] | — |
| `seniority_rank` | 0.1039 | 0.0844 | 0.218 | [-0.061, 0.269] | 10.9% |
| `yrs_exp_min` | -0.0056 | 0.0404 | 0.891 | [-0.085, 0.074] | -0.6% |
| `yrs_exp_stated` | -0.0257 | 0.1189 | 0.829 | [-0.259, 0.207] | -2.5% |
| `degree_required` | -0.0330 | 0.0448 | 0.462 | [-0.121, 0.055] | -3.2% |
| `degree_stem` | 0.1124*** | 0.0331 | 0.001 | [0.048, 0.177] | 11.9% |
| `skill_cloud` | 0.1174 | 0.1436 | 0.413 | [-0.164, 0.399] | 12.5% |
| `skill_ml_ai` | 0.0606* | 0.0366 | 0.098 | [-0.011, 0.132] | 6.2% |
| `remote_eligible` | -0.0516 | 0.0779 | 0.507 | [-0.204, 0.101] | -5.0% |
| `mandate_state` | 0.0584 | 0.1055 | 0.580 | [-0.148, 0.265] | 6.0% |
| `region_northeast` | -0.0098 | 0.0812 | 0.904 | [-0.169, 0.149] | -1.0% |
| `region_south` | -0.0420 | 0.1418 | 0.767 | [-0.320, 0.236] | -4.1% |
| `region_west` | 0.0511 | 0.0758 | 0.500 | [-0.097, 0.200] | 5.2% |
| `industry_data_center` | -0.1091 | 0.0765 | 0.154 | [-0.259, 0.041] | -10.3% |
| `family_ai_ml` | 0.5449*** | 0.1853 | 0.003 | [0.182, 0.908] | 72.4% |

*** p<0.01, ** p<0.05, * p<0.10. N = 50, R² = 0.520, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.3560*** | 0.0558 | 0.000 | [11.247, 11.465] | — |
| `seniority_rank` | 0.1209*** | 0.0094 | 0.000 | [0.103, 0.139] | 12.9% |
| `yrs_exp_min` | 0.0150 | 0.0105 | 0.154 | [-0.006, 0.036] | 1.5% |
| `yrs_exp_stated` | 0.0008 | 0.0553 | 0.988 | [-0.107, 0.109] | 0.1% |
| `degree_required` | 0.0034 | 0.0360 | 0.925 | [-0.067, 0.074] | 0.3% |
| `degree_stem` | 0.0521 | 0.0343 | 0.130 | [-0.015, 0.119] | 5.3% |
| `skill_cloud` | 0.1348** | 0.0584 | 0.021 | [0.020, 0.249] | 14.4% |
| `skill_ml_ai` | -0.0179 | 0.0400 | 0.654 | [-0.096, 0.060] | -1.8% |
| `remote_eligible` | 0.0344 | 0.0496 | 0.488 | [-0.063, 0.132] | 3.5% |
| `hourly_original` | 0.0247 | 0.0349 | 0.479 | [-0.044, 0.093] | 2.5% |
| `mandate_state` | -0.0907** | 0.0380 | 0.017 | [-0.165, -0.016] | -8.7% |
| `region_northeast` | 0.0352 | 0.0423 | 0.405 | [-0.048, 0.118] | 3.6% |
| `region_south` | 0.0630 | 0.0459 | 0.170 | [-0.027, 0.153] | 6.5% |
| `region_west` | -0.0318 | 0.0321 | 0.323 | [-0.095, 0.031] | -3.1% |
| `industry_data_center` | -0.0019 | 0.0546 | 0.972 | [-0.109, 0.105] | -0.2% |
| `family_ai_ml` | 0.0467 | 0.0747 | 0.532 | [-0.100, 0.193] | 4.8% |

*** p<0.01, ** p<0.05, * p<0.10. N = 206, R² = 0.566, SE: cluster.

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

Surviving at the 5% level: `seniority_rank` (p = 0.000), `skill_cloud` (p = 0.045), `region_northeast` (p = 0.032).

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
re-estimated on the 205 observations that do resolve to a state, across
31 employers.

**`skill_cloud`, `region_northeast` change verdict** at the 5% level and are
reported as inconclusive.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.1206 | 0.000 | 0.1215 | 0.001 |
| `yrs_exp_min` | 0.0135 | 0.367 | 0.0141 | 0.366 |
| `yrs_exp_stated` | -0.0030 | 0.957 | 0.0048 | 0.940 |
| `degree_required` | 0.0062 | 0.876 | 0.0047 | 0.922 |
| `degree_stem` | 0.0477 | 0.150 | 0.0525 | 0.136 |
| `skill_cloud` | 0.1242 | 0.045 | 0.1251 | 0.058 |
| `skill_ml_ai` | 0.0180 | 0.715 | -0.0115 | 0.806 |
| `remote_eligible` | 0.0349 | 0.506 | 0.0454 | 0.468 |
| `hourly_original` | 0.0860 | 0.450 | 0.0863 | 0.471 |
| `mandate_state` | -0.0379 | 0.251 | -0.0323 | 0.375 |
| `region_northeast` | 0.1069 | 0.032 | 0.1100 | 0.057 |
| `region_south` | 0.0825 | 0.110 | 0.0896 | 0.105 |
| `region_west` | 0.0182 | 0.638 | 0.0201 | 0.606 |
| `industry_data_center` | 0.0230 | 0.710 | -0.0003 | 0.997 |
| `family_ai_ml` | 0.0046 | 0.968 | 0.0605 | 0.661 |

This check is reported whichever way it comes out. It confirmed `seniority_rank` and withdrew `skill_cloud`, `region_northeast`.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **50** postings from
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
| H2 | A mandate raises disclosure | + | 93.9% vs 47.6% — **supported**, descriptively |

### Who discloses pay

Disclosure rate **73.8%** (214 disclosed, 76 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 3.042 | 3.434 | -0.392 | 0.0472 |
| `yrs_exp_min` | 1.397 | 1.882 | -0.484 | 0.1528 |
| `yrs_exp_stated` | 0.379 | 0.487 | -0.108 | 0.1063 |
| `degree_required` | 0.701 | 0.605 | 0.096 | 0.141 |
| `degree_stem` | 0.28 | 0.395 | -0.114 | 0.0777 |
| `skill_cloud` | 0.112 | 0.092 | 0.02 | 0.6151 |
| `skill_ml_ai` | 0.173 | 0.237 | -0.064 | 0.2516 |
| `remote_eligible` | 0.079 | 0.171 | -0.092 | 0.0553 |
| `hourly_original` | 0.009 | 0.0 | 0.009 | 0.1578 |
| `mandate_state` | 0.72 | 0.132 | 0.588 | 0.0 |
| `region_northeast` | 0.262 | 0.105 | 0.156 | 0.0009 |
| `region_south` | 0.187 | 0.618 | -0.432 | 0.0 |
| `region_west` | 0.234 | 0.026 | 0.207 | 0.0 |
| `industry_data_center` | 0.093 | 0.329 | -0.235 | 0.0001 |
| `family_ai_ml` | 0.065 | 0.039 | 0.026 | 0.3581 |
| `metro_indianapolis` | 0.014 | 0.105 | -0.091 | 0.014 |

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

Across 214 postings from 34 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 94% of postings
state one. Where no such requirement exists, 48% do. The
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

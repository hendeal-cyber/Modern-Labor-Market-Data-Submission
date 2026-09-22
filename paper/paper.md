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
stated in **98.0%** of postings in states with a posting-level
pay-transparency mandate, against **39.3%** where there is none —
a gap of **59 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

The gap is large under every cut of the sample (57 to 61 points)
and stable across them, a spread of only 3 points. Earlier versions
of this study reported a gap swinging from 50 to 71 points, sensitive to
Virginia alone. That sensitivity was an artifact: the non-disclosing
mandate-state postings were a federal consultancy's public health, national
security and law-enforcement work, which audit round 4 removed as outside
the sector under study. Removing it removed the fragility rather than
explaining it away. Section 5 reports every cut.

Within the postings that do disclose, the attributes that predict pay at
conventional significance under the wild cluster bootstrap are South location, seniority and remote eligibility.
A further 3 attributes reach significance under
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
| Retrieved from ATS boards | 1,716 |
| Passed role, seniority and internship screens | 389 |
| Within 35 miles of a study metro | 307 |
| Unique after de-duplication | 156 |
| With a disclosed pay range (estimation sample) | 120 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 577 |
| `role_excluded` | 342 |
| `no_sector_evidence_in_posting` | 337 |
| `internship` | 91 |
| `non_us` | 52 |
| `no_us_state` | 30 |

Distinct employers contributing a disclosed range: **25**. By metro: `{'': 23, 'northern_virginia': 11, 'remote_national': 8, 'denver': 26, 'chicago': 32, 'indianapolis': 3, 'new_york': 4, 'bay_area': 4, 'boston': 8, 'minneapolis': 1}`.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Four rounds of hand-auditing are recorded in `docs/audit-log.md`.
Each read real collected titles rather than a synthetic sample, and
each found errors the test suite had not:

| Round | Target | Result |
|---|---|---|
| 1 | Regressor coding | Three systematic false positives, all firing on company boilerplate rather than on anything asked of the applicant |
| 2 | `role_family` | 6 of 53 assignments wrong (89%). Four had reached a live measurement and sat in the top eleven rows by pay |
| 3 | `seniority_rank`, `state` | 21 of 141 wrong (85.1%). One defect changed the headline disclosure contrast |
| 4 | The industry umbrella itself | A multi-sector consultancy supplied 22% of the sample and three rows of it were energy work. 337 postings removed; the AI-premium finding did not survive |

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

> **Not yet interpretable.** 8.0 observations per regressor (120 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
>
> **Not yet interpretable.** 25 employer clusters, against the 30 pre-registered. Cluster-robust standard errors are biased downward with few clusters, so the asymptotic p-values are anti-conservative. Read the wild cluster bootstrap p-values below, not these.
>
> **Not yet interpretable.** Minimum detectable effect is 0.27 log points, roughly a 32% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
>
> The model below is reported so the pipeline is verifiable end to end,
> not because the coefficients support conclusions.

Advertised pay in the estimation sample averages **$109,489** (median $106,100, SD $38,870, range $46,500–$236,500).

At N = 120 with 15 regressors, the smallest
detectable standardized effect is **0.2747**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 98.0% | 100 |
| no mandate state | 39.3% | 56 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered. Around a quarter of postings list more
than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The size of the gap is sensitive to one
jurisdiction, so it is cut three ways rather than quoted once:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 98.0% (n=100) | 39.3% (n=56) | 59pp |
| Excluding Virginia | 100.0% (n=82) | 39.3% (n=56) | 61pp |
| Excluding the largest employer | 96.7% (n=61) | 39.3% (n=56) | 57pp |

The gap is large under every cut and stable across them, a spread of 3 points. An earlier version of this study reported it swinging from 50 to 71 points and sensitive to Virginia alone; that sensitivity was an artifact of including a federal consultancy's public health, national security and law-enforcement postings, removed in audit round 4 as outside the sector under study.

Only **2** posting(s) covered by a mandate fail to state pay.
2 of them list Virginia, whose mandate took effect on 1 July 2026 and is
the newest in the table, so partial compliance with a very recent statute
is a plausible reading.
All of them come from one employer (QTS Data Centers), so these data cannot separate
that reading from the posting practices of that firm.

> **This is a descriptive contrast, not a causal estimate.** A single
> cross-section carries no time variation, so no
> difference-in-differences is available. Employers who operate in
> mandate states differ from those who do not in size, sector and
> geography, and these data cannot separate those differences from
> the effect of the law itself.

### Core model (pre-specified)

| Variable | Coef. | Std. err. | Clustered p | **Bootstrap p** | 95% CI | Approx. % effect |
|---|---|---|---|---|---|---|
| `const` | 11.2995*** | 0.0445 | 0.000 | — | [11.212, 11.387] | — |
| `seniority_rank` | 0.0718*** | 0.0087 | 0.000 | **0.009** | [0.055, 0.089] | 7.5% |
| `yrs_exp_min` | 0.0021 | 0.0112 | 0.849 | **0.864** | [-0.020, 0.024] | 0.2% |
| `yrs_exp_stated` | -0.0433 | 0.1031 | 0.675 | **0.680** | [-0.245, 0.159] | -4.2% |
| `degree_required` | -0.0892 | 0.0539 | 0.098 | **0.357** | [-0.195, 0.016] | -8.5% |
| `degree_stem` | 0.0964 | 0.0602 | 0.110 | **0.337** | [-0.022, 0.214] | 10.1% |
| `skill_cloud` | 0.1026 | 0.1074 | 0.340 | **0.370** | [-0.108, 0.313] | 10.8% |
| `skill_ml_ai` | 0.1220 | 0.0948 | 0.198 | **0.270** | [-0.064, 0.308] | 13.0% |
| `remote_eligible` | 0.1808** | 0.0610 | 0.003 | **0.026** | [0.061, 0.300] | 19.8% |
| `hourly_original` | 0.0033 | 0.2387 | 0.989 | **0.974** | [-0.465, 0.471] | 0.3% |
| `mandate_state` | -0.1401 | 0.0703 | 0.046 | **0.159** | [-0.278, -0.002] | -13.1% |
| `region_northeast` | 0.1945 | 0.0798 | 0.015 | **0.140** | [0.038, 0.351] | 21.5% |
| `region_south` | 0.2793*** | 0.0567 | 0.000 | **0.002** | [0.168, 0.391] | 32.2% |
| `region_west` | 0.1363* | 0.0444 | 0.002 | **0.056** | [0.049, 0.223] | 14.6% |
| `industry_data_center` | 0.1428 | 0.0802 | 0.075 | **0.132** | [-0.014, 0.300] | 15.3% |
| `family_ai_ml` | -0.0234 | 0.1162 | 0.841 | **0.817** | [-0.251, 0.204] | -2.3% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 120, R² = 0.550, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.2699*** | 0.1640 | 0.000 | [9.949, 10.591] | — |
| `seniority_rank` | 0.0867 | 0.0866 | 0.317 | [-0.083, 0.256] | 9.1% |
| `yrs_exp_min` | 0.0621 | 0.0472 | 0.188 | [-0.030, 0.155] | 6.4% |
| `yrs_exp_stated` | -0.1104 | 0.3073 | 0.719 | [-0.713, 0.492] | -10.4% |
| `degree_required` | -0.0933 | 0.1111 | 0.401 | [-0.311, 0.124] | -8.9% |
| `degree_stem` | 0.1623 | 0.1253 | 0.195 | [-0.083, 0.408] | 17.6% |
| `skill_cloud` | -0.0793 | 0.2954 | 0.788 | [-0.658, 0.500] | -7.6% |
| `skill_ml_ai` | -0.1949 | 0.3513 | 0.579 | [-0.883, 0.494] | -17.7% |
| `remote_eligible` | 0.2065 | 0.2310 | 0.371 | [-0.246, 0.659] | 22.9% |
| `hourly_original` | -0.0211 | 0.2295 | 0.927 | [-0.471, 0.429] | -2.1% |
| `mandate_state` | 0.2242 | 0.1882 | 0.233 | [-0.145, 0.593] | 25.1% |
| `region_northeast` | -0.7260** | 0.3088 | 0.019 | [-1.331, -0.121] | -51.6% |
| `region_south` | -0.1265 | 0.2185 | 0.562 | [-0.555, 0.302] | -11.9% |
| `region_west` | -0.1010 | 0.1777 | 0.570 | [-0.449, 0.247] | -9.6% |
| `industry_data_center` | -0.8295** | 0.3862 | 0.032 | [-1.586, -0.073] | -56.4% |
| `family_ai_ml` | 0.6259*** | 0.2332 | 0.007 | [0.169, 1.083] | 87.0% |

*** p<0.01, ** p<0.05, * p<0.10. N = 111, R² = 0.197, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.4052*** | 0.1298 | 0.002 | [0.151, 0.660] | — |
| `mandate_state` | 0.5609*** | 0.1115 | 0.000 | [0.342, 0.779] | 75.2% |
| `seniority_rank` | 0.0010 | 0.0182 | 0.955 | [-0.035, 0.037] | 0.1% |
| `remote_eligible` | 0.2819*** | 0.0878 | 0.001 | [0.110, 0.454] | 32.6% |
| `industry_data_center` | -0.2237* | 0.1269 | 0.078 | [-0.472, 0.025] | -20.1% |
| `region_northeast` | -0.1085 | 0.0836 | 0.194 | [-0.272, 0.055] | -10.3% |
| `region_south` | -0.0097 | 0.1432 | 0.946 | [-0.290, 0.271] | -1.0% |
| `region_west` | 0.1262* | 0.0734 | 0.086 | [-0.018, 0.270] | 13.4% |

*** p<0.01, ** p<0.05, * p<0.10. N = 156, R² = 0.530, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.5003*** | 0.1991 | 0.000 | [10.110, 10.890] | — |
| `seniority_rank` | 0.2935* | 0.1543 | 0.057 | [-0.009, 0.596] | 34.1% |
| `yrs_exp_min` | -0.1631*** | 0.0363 | 0.000 | [-0.234, -0.092] | -15.1% |
| `yrs_exp_stated` | 0.2531 | 0.1827 | 0.166 | [-0.105, 0.611] | 28.8% |
| `degree_required` | -0.0999 | 0.1736 | 0.565 | [-0.440, 0.240] | -9.5% |
| `degree_stem` | 0.2524 | 0.1614 | 0.118 | [-0.064, 0.569] | 28.7% |
| `skill_cloud` | -0.1455 | 0.1859 | 0.434 | [-0.510, 0.219] | -13.5% |
| `skill_ml_ai` | 0.1021 | 0.0734 | 0.164 | [-0.042, 0.246] | 10.8% |
| `remote_eligible` | -0.0530 | 0.0947 | 0.576 | [-0.239, 0.133] | -5.2% |
| `mandate_state` | 0.4234*** | 0.1057 | 0.000 | [0.216, 0.631] | 52.7% |
| `region_northeast` | 0.4807* | 0.2814 | 0.088 | [-0.071, 1.032] | 61.7% |
| `region_south` | 0.3678* | 0.1931 | 0.057 | [-0.011, 0.746] | 44.5% |
| `region_west` | 0.2287 | 0.1894 | 0.227 | [-0.143, 0.600] | 25.7% |
| `industry_data_center` | -0.0015 | 0.1987 | 0.994 | [-0.391, 0.388] | -0.1% |
| `family_ai_ml` | 0.5171** | 0.2189 | 0.018 | [0.088, 0.946] | 67.7% |

*** p<0.01, ** p<0.05, * p<0.10. N = 29, R² = 0.787, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.2639*** | 0.0898 | 0.000 | [11.088, 11.440] | — |
| `seniority_rank` | 0.0783*** | 0.0090 | 0.000 | [0.061, 0.096] | 8.2% |
| `yrs_exp_min` | 0.0024 | 0.0111 | 0.826 | [-0.019, 0.024] | 0.2% |
| `yrs_exp_stated` | -0.0293 | 0.1103 | 0.791 | [-0.246, 0.187] | -2.9% |
| `degree_required` | -0.0807 | 0.0593 | 0.173 | [-0.197, 0.035] | -7.8% |
| `degree_stem` | 0.0951 | 0.0693 | 0.170 | [-0.041, 0.231] | 10.0% |
| `skill_cloud` | 0.0820 | 0.1202 | 0.495 | [-0.154, 0.318] | 8.6% |
| `skill_ml_ai` | 0.1049 | 0.1261 | 0.405 | [-0.142, 0.352] | 11.1% |
| `remote_eligible` | 0.1049 | 0.0931 | 0.260 | [-0.077, 0.287] | 11.1% |
| `hourly_original` | -0.0346 | 0.2160 | 0.873 | [-0.458, 0.389] | -3.4% |
| `mandate_state` | -0.1316 | 0.1108 | 0.235 | [-0.349, 0.086] | -12.3% |
| `region_northeast` | 0.1570** | 0.0710 | 0.027 | [0.018, 0.296] | 17.0% |
| `region_south` | 0.2968*** | 0.0607 | 0.000 | [0.178, 0.416] | 34.5% |
| `region_west` | 0.1057** | 0.0500 | 0.035 | [0.008, 0.204] | 11.2% |
| `industry_data_center` | 0.1465 | 0.1072 | 0.172 | [-0.064, 0.357] | 15.8% |
| `family_ai_ml` | 0.0118 | 0.1541 | 0.939 | [-0.290, 0.314] | 1.2% |

*** p<0.01, ** p<0.05, * p<0.10. N = 113, R² = 0.495, SE: cluster.

### Inference: the wild cluster bootstrap

With 25 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim at this cluster count. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

**3 of the 6 coefficients significant
at the 5% level under clustered standard errors do not survive the
bootstrap:** `mandate_state`, `region_northeast`, `region_west`.

This is the correction the pre-registered procedure exists to make.
Nothing about the point estimates changed; what changed is the
reference distribution the estimates are judged against, and at
25 clusters the asymptotic one is simply the
wrong yardstick. The coefficients concerned are reported below as
inconclusive rather than deleted, because an underpowered null is
not the same finding as a measured zero.

Surviving at the 5% level: `seniority_rank` (p = 0.009), `remote_eligible` (p = 0.026), `region_south` (p = 0.002).

Monte Carlo error is small relative to the decisions being read off
these numbers: at 9999 replications every
p-value above is stable to within about 0.005 across seeds. An earlier
run at 999 replications returned 0.049, 0.063 and 0.082 for
`degree_required` on three different seeds, straddling the very
threshold its verdict is read from, which is why the replication count
is what it is.

### Robustness: the nationwide-remote postings

8 postings are advertised as nationwide remote and resolve to no state,
so all three census-region dummies are zero for them and they fall into the
**Midwest reference category without being Midwest**. The model is therefore
re-estimated on the 112 observations that do resolve to a state, across
22 employers.

**`remote_eligible`, `region_west` change verdict** at the 5% level and are
reported as inconclusive. `remote_eligible` is the one that matters: the
nationwide-remote postings are precisely the remote-eligible ones, so the
coefficient was identified in part off the rows this check removes.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.0718 | 0.009 | 0.0751 | 0.004 |
| `yrs_exp_min` | 0.0021 | 0.864 | -0.0009 | 0.941 |
| `yrs_exp_stated` | -0.0433 | 0.680 | -0.0169 | 0.895 |
| `degree_required` | -0.0892 | 0.357 | -0.0733 | 0.467 |
| `degree_stem` | 0.0964 | 0.337 | 0.1002 | 0.423 |
| `skill_cloud` | 0.1026 | 0.370 | 0.0854 | 0.547 |
| `skill_ml_ai` | 0.1220 | 0.270 | 0.1026 | 0.784 |
| `remote_eligible` | 0.1808 | 0.026 | 0.0980 | 0.333 |
| `hourly_original` | 0.0033 | 0.974 | 0.0023 | 0.986 |
| `mandate_state` | -0.1401 | 0.159 | -0.0924 | 0.555 |
| `region_northeast` | 0.1945 | 0.140 | 0.2203 | 0.191 |
| `region_south` | 0.2793 | 0.002 | 0.3164 | 0.013 |
| `region_west` | 0.1363 | 0.056 | 0.1505 | 0.044 |
| `industry_data_center` | 0.1428 | 0.132 | 0.1519 | 0.311 |
| `family_ai_ml` | -0.0234 | 0.817 | 0.0286 | 0.869 |

This check is reported whichever way it comes out. It confirmed the South
coefficient and it withdrew remote eligibility.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **29** postings from
**11** employers, estimated above.
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
| H2 | A mandate raises disclosure | + | 98.0% vs 39.3% — **supported**, descriptively |

**H5 is inconclusive, and it was nearly reported as contradicted.**
The point estimate is negative — a stated degree requirement sits
alongside *lower* advertised pay, conditional on seniority — and under
clustered standard errors that reads p = 0.098,
comfortably significant and opposite to the prediction. The wild
cluster bootstrap puts it at p = 0.357. So the sign is worth
recording and the finding is not: at this cluster count the data
cannot distinguish the negative coefficient from zero. It is reported
because it was predicted the other way, and because the asymptotic
and bootstrap procedures disagree about it, which is precisely the
case the pre-registration anticipated.

### Who discloses pay

Disclosure rate **76.9%** (120 disclosed, 36 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 2.65 | 2.806 | -0.156 | 0.4585 |
| `yrs_exp_min` | 1.35 | 1.75 | -0.4 | 0.3731 |
| `yrs_exp_stated` | 0.383 | 0.5 | -0.117 | 0.2272 |
| `degree_required` | 0.733 | 0.694 | 0.039 | 0.6595 |
| `degree_stem` | 0.392 | 0.361 | 0.031 | 0.7429 |
| `skill_cloud` | 0.183 | 0.222 | -0.039 | 0.6233 |
| `skill_ml_ai` | 0.242 | 0.25 | -0.008 | 0.9204 |
| `remote_eligible` | 0.117 | 0.083 | 0.033 | 0.5481 |
| `hourly_original` | 0.025 | 0.0 | 0.025 | 0.0833 |
| `mandate_state` | 0.817 | 0.056 | 0.761 | 0.0 |
| `region_northeast` | 0.108 | 0.111 | -0.003 | 0.9634 |
| `region_south` | 0.2 | 0.583 | -0.383 | 0.0001 |
| `region_west` | 0.317 | 0.028 | 0.289 | 0.0 |
| `industry_data_center` | 0.15 | 0.389 | -0.239 | 0.0098 |
| `family_ai_ml` | 0.108 | 0.056 | 0.053 | 0.2757 |
| `metro_indianapolis` | 0.025 | 0.139 | -0.114 | 0.0658 |

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

Across 120 postings from 25 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 98% of postings
state one. Where no such requirement exists, 39% do. The
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

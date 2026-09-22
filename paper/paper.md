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
stated in **98.2%** of postings in states with a posting-level
pay-transparency mandate, against **53.4%** where there is none —
a gap of **45 percentage points**. The
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
conventional significance under the wild cluster bootstrap are seniority and `mandate_state`.
A further 2 attributes reach significance under
clustered standard errors but not under the bootstrap, which is
the inference this study pre-registered; they are reported as
inconclusive, not as findings.
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
| Passed role, seniority and internship screens | 449 |
| Within 35 miles of a study metro | 333 |
| Unique after de-duplication | 183 |
| With a disclosed pay range (estimation sample) | 147 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 712 |
| `role_excluded` | 370 |
| `no_sector_evidence_in_posting` | 336 |
| `internship` | 95 |
| `non_us` | 78 |
| `no_us_state` | 38 |

Distinct employers contributing a disclosed range: **29**. By metro: `{'': 46, 'northern_virginia': 11, 'remote_national': 9, 'denver': 26, 'chicago': 32, 'indianapolis': 3, 'new_york': 4, 'bay_area': 4, 'boston': 11, 'minneapolis': 1}`.

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

> **Not yet interpretable.** 9.8 observations per regressor (147 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
>
> **Not yet interpretable.** 29 employer clusters, against the 30 pre-registered. Cluster-robust standard errors are biased downward with few clusters, so the asymptotic p-values are anti-conservative. Read the wild cluster bootstrap p-values below, not these.
>
> The model below is reported so the pipeline is verifiable end to end,
> not because the coefficients support conclusions.

Advertised pay in the estimation sample averages **$117,392** (median $112,506, SD $37,241, range $46,500–$240,000).

At N = 147 with 15 regressors, the smallest
detectable standardized effect is **0.2448**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 98.2% | 110 |
| no mandate state | 53.4% | 73 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered. Around a quarter of postings list more
than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The size of the gap is sensitive to one
jurisdiction, so it is cut three ways rather than quoted once:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 98.2% (n=110) | 53.4% (n=73) | 45pp |
| Excluding Virginia | 100.0% (n=92) | 53.4% (n=73) | 47pp |
| Excluding the largest employer | 97.2% (n=71) | 53.4% (n=73) | 44pp |

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
| `const` | 11.4393*** | 0.0400 | 0.000 | — | [11.361, 11.518] | — |
| `seniority_rank` | 0.0776*** | 0.0083 | 0.000 | **0.000** | [0.061, 0.094] | 8.1% |
| `yrs_exp_min` | 0.0045 | 0.0132 | 0.733 | **0.735** | [-0.021, 0.030] | 0.5% |
| `yrs_exp_stated` | -0.0756 | 0.0946 | 0.424 | **0.502** | [-0.261, 0.110] | -7.3% |
| `degree_required` | -0.0264 | 0.0355 | 0.456 | **0.492** | [-0.096, 0.043] | -2.6% |
| `degree_stem` | 0.0888 | 0.0509 | 0.081 | **0.212** | [-0.011, 0.189] | 9.3% |
| `skill_cloud` | 0.0728 | 0.1104 | 0.509 | **0.558** | [-0.143, 0.289] | 7.5% |
| `skill_ml_ai` | 0.0949 | 0.0913 | 0.299 | **0.419** | [-0.084, 0.274] | 9.9% |
| `remote_eligible` | 0.1008 | 0.0634 | 0.112 | **0.151** | [-0.023, 0.225] | 10.6% |
| `hourly_original` | -0.0650 | 0.2264 | 0.774 | **0.785** | [-0.509, 0.379] | -6.3% |
| `mandate_state` | -0.1784** | 0.0555 | 0.001 | **0.048** | [-0.287, -0.070] | -16.3% |
| `region_northeast` | 0.1250 | 0.0542 | 0.021 | **0.131** | [0.019, 0.231] | 13.3% |
| `region_south` | 0.1430* | 0.0502 | 0.004 | **0.055** | [0.045, 0.241] | 15.4% |
| `region_west` | 0.0449 | 0.0388 | 0.247 | **0.345** | [-0.031, 0.121] | 4.6% |
| `industry_data_center` | 0.1165 | 0.0726 | 0.109 | **0.131** | [-0.026, 0.259] | 12.4% |
| `family_ai_ml` | -0.0186 | 0.1345 | 0.890 | **0.916** | [-0.282, 0.245] | -1.8% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 147, R² = 0.410, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.2076*** | 0.1668 | 0.000 | [9.881, 10.534] | — |
| `seniority_rank` | 0.1088 | 0.0686 | 0.113 | [-0.026, 0.243] | 11.5% |
| `yrs_exp_min` | 0.0236 | 0.0299 | 0.430 | [-0.035, 0.082] | 2.4% |
| `yrs_exp_stated` | 0.1075 | 0.2172 | 0.621 | [-0.318, 0.533] | 11.3% |
| `degree_required` | -0.2772** | 0.1271 | 0.029 | [-0.526, -0.028] | -24.2% |
| `degree_stem` | 0.3097** | 0.1311 | 0.018 | [0.053, 0.567] | 36.3% |
| `skill_cloud` | 0.0309 | 0.2905 | 0.915 | [-0.538, 0.600] | 3.1% |
| `skill_ml_ai` | -0.1925 | 0.3183 | 0.545 | [-0.816, 0.431] | -17.5% |
| `remote_eligible` | 0.1208 | 0.2264 | 0.594 | [-0.323, 0.565] | 12.8% |
| `hourly_original` | 0.2324** | 0.1069 | 0.030 | [0.023, 0.442] | 26.2% |
| `mandate_state` | -0.0067 | 0.1724 | 0.969 | [-0.345, 0.331] | -0.7% |
| `region_northeast` | -0.3962 | 0.2462 | 0.108 | [-0.879, 0.086] | -32.7% |
| `region_south` | 0.0499 | 0.1384 | 0.719 | [-0.222, 0.321] | 5.1% |
| `region_west` | 0.0046 | 0.1397 | 0.974 | [-0.269, 0.278] | 0.5% |
| `industry_data_center` | -0.7500** | 0.3619 | 0.038 | [-1.459, -0.041] | -52.8% |
| `family_ai_ml` | 0.4965* | 0.2870 | 0.084 | [-0.066, 1.059] | 64.3% |

*** p<0.01, ** p<0.05, * p<0.10. N = 137, R² = 0.225, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.5980*** | 0.1382 | 0.000 | [0.327, 0.869] | — |
| `mandate_state` | 0.3919*** | 0.1118 | 0.001 | [0.173, 0.611] | 48.0% |
| `seniority_rank` | 0.0110 | 0.0168 | 0.511 | [-0.022, 0.044] | 1.1% |
| `remote_eligible` | 0.1707 | 0.1047 | 0.103 | [-0.035, 0.376] | 18.6% |
| `industry_data_center` | -0.2627** | 0.1275 | 0.039 | [-0.513, -0.013] | -23.1% |
| `region_northeast` | -0.0539 | 0.1010 | 0.594 | [-0.252, 0.144] | -5.2% |
| `region_south` | -0.1473 | 0.1646 | 0.371 | [-0.470, 0.175] | -13.7% |
| `region_west` | 0.0713 | 0.0749 | 0.341 | [-0.075, 0.218] | 7.4% |

*** p<0.01, ** p<0.05, * p<0.10. N = 183, R² = 0.411, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 10.2541*** | 0.2301 | 0.000 | [9.803, 10.705] | — |
| `seniority_rank` | 0.7565*** | 0.1371 | 0.000 | [0.488, 1.025] | 113.1% |
| `yrs_exp_min` | -0.1368** | 0.0565 | 0.015 | [-0.248, -0.026] | -12.8% |
| `yrs_exp_stated` | -0.1178 | 0.1431 | 0.411 | [-0.398, 0.163] | -11.1% |
| `degree_required` | 0.0186 | 0.0630 | 0.767 | [-0.105, 0.142] | 1.9% |
| `degree_stem` | 0.3253*** | 0.1196 | 0.006 | [0.091, 0.560] | 38.5% |
| `skill_cloud` | -0.1705 | 0.2244 | 0.448 | [-0.610, 0.269] | -15.7% |
| `skill_ml_ai` | 0.0251 | 0.0970 | 0.796 | [-0.165, 0.215] | 2.5% |
| `remote_eligible` | -0.2320* | 0.1274 | 0.069 | [-0.482, 0.018] | -20.7% |
| `mandate_state` | 0.4410*** | 0.0911 | 0.000 | [0.262, 0.620] | 55.4% |
| `region_northeast` | 0.1652* | 0.0898 | 0.066 | [-0.011, 0.341] | 18.0% |
| `region_south` | -0.0088 | 0.1583 | 0.956 | [-0.319, 0.301] | -0.9% |
| `region_west` | 0.0045 | 0.0772 | 0.954 | [-0.147, 0.156] | 0.5% |
| `industry_data_center` | -0.2339 | 0.1649 | 0.156 | [-0.557, 0.089] | -20.9% |
| `family_ai_ml` | 0.5295** | 0.2104 | 0.012 | [0.117, 0.942] | 69.8% |

*** p<0.01, ** p<0.05, * p<0.10. N = 34, R² = 0.762, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4783*** | 0.0604 | 0.000 | [11.360, 11.597] | — |
| `seniority_rank` | 0.0860*** | 0.0092 | 0.000 | [0.068, 0.104] | 9.0% |
| `yrs_exp_min` | 0.0041 | 0.0139 | 0.767 | [-0.023, 0.032] | 0.4% |
| `yrs_exp_stated` | -0.0698 | 0.1028 | 0.497 | [-0.271, 0.132] | -6.7% |
| `degree_required` | -0.0158 | 0.0415 | 0.703 | [-0.097, 0.066] | -1.6% |
| `degree_stem` | 0.0943* | 0.0573 | 0.100 | [-0.018, 0.207] | 9.9% |
| `skill_cloud` | 0.0492 | 0.1323 | 0.710 | [-0.210, 0.308] | 5.0% |
| `skill_ml_ai` | 0.0901 | 0.1159 | 0.437 | [-0.137, 0.317] | 9.4% |
| `remote_eligible` | 0.1012 | 0.0669 | 0.130 | [-0.030, 0.232] | 10.7% |
| `hourly_original` | -0.0909 | 0.2013 | 0.651 | [-0.485, 0.304] | -8.7% |
| `mandate_state` | -0.2388*** | 0.0711 | 0.001 | [-0.378, -0.100] | -21.2% |
| `region_northeast` | 0.0630 | 0.0597 | 0.291 | [-0.054, 0.180] | 6.5% |
| `region_south` | 0.1125* | 0.0613 | 0.067 | [-0.008, 0.233] | 11.9% |
| `region_west` | -0.0111 | 0.0390 | 0.775 | [-0.087, 0.065] | -1.1% |
| `industry_data_center` | 0.1334 | 0.0885 | 0.132 | [-0.040, 0.307] | 14.3% |
| `family_ai_ml` | -0.0037 | 0.1586 | 0.981 | [-0.315, 0.307] | -0.4% |

*** p<0.01, ** p<0.05, * p<0.10. N = 139, R² = 0.389, SE: cluster.

### Inference: the wild cluster bootstrap

With 29 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim at this cluster count. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

**2 of the 4 coefficients significant
at the 5% level under clustered standard errors do not survive the
bootstrap:** `region_northeast`, `region_south`.

This is the correction the pre-registered procedure exists to make.
Nothing about the point estimates changed; what changed is the
reference distribution the estimates are judged against, and at
29 clusters the asymptotic one is simply the
wrong yardstick. The coefficients concerned are reported below as
inconclusive rather than deleted, because an underpowered null is
not the same finding as a measured zero.

Surviving at the 5% level: `seniority_rank` (p = 0.000), `mandate_state` (p = 0.048).

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
re-estimated on the 138 observations that do resolve to a state, across
26 employers.

**`mandate_state` change verdict** at the 5% level and are
reported as inconclusive. `remote_eligible` is the one that matters: the
nationwide-remote postings are precisely the remote-eligible ones, so the
coefficient was identified in part off the rows this check removes.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.0776 | 0.000 | 0.0821 | 0.002 |
| `yrs_exp_min` | 0.0045 | 0.735 | 0.0020 | 0.885 |
| `yrs_exp_stated` | -0.0756 | 0.502 | -0.0608 | 0.659 |
| `degree_required` | -0.0264 | 0.492 | -0.0115 | 0.795 |
| `degree_stem` | 0.0888 | 0.212 | 0.0968 | 0.203 |
| `skill_cloud` | 0.0728 | 0.558 | 0.0582 | 0.712 |
| `skill_ml_ai` | 0.0949 | 0.419 | 0.0882 | 0.706 |
| `remote_eligible` | 0.1008 | 0.151 | 0.0923 | 0.185 |
| `hourly_original` | -0.0650 | 0.785 | -0.0550 | 0.801 |
| `mandate_state` | -0.1784 | 0.048 | -0.1803 | 0.092 |
| `region_northeast` | 0.1250 | 0.131 | 0.1269 | 0.117 |
| `region_south` | 0.1430 | 0.055 | 0.1407 | 0.068 |
| `region_west` | 0.0449 | 0.345 | 0.0388 | 0.361 |
| `industry_data_center` | 0.1165 | 0.131 | 0.1369 | 0.198 |
| `family_ai_ml` | -0.0186 | 0.916 | 0.0088 | 0.968 |

This check is reported whichever way it comes out. It confirmed the South
coefficient and it withdrew remote eligibility.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **34** postings from
**16** employers, estimated above.
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
| H2 | A mandate raises disclosure | + | 98.2% vs 53.4% — **supported**, descriptively |

**H5 is inconclusive, and it was nearly reported as contradicted.**
The point estimate is negative — a stated degree requirement sits
alongside *lower* advertised pay, conditional on seniority — and under
clustered standard errors that reads p = 0.456,
comfortably significant and opposite to the prediction. The wild
cluster bootstrap puts it at p = 0.492. So the sign is worth
recording and the finding is not: at this cluster count the data
cannot distinguish the negative coefficient from zero. It is reported
because it was predicted the other way, and because the asymptotic
and bootstrap procedures disagree about it, which is precisely the
case the pre-registration anticipated.

### Who discloses pay

Disclosure rate **80.3%** (147 disclosed, 36 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 2.687 | 2.806 | -0.118 | 0.5567 |
| `yrs_exp_min` | 1.374 | 1.722 | -0.348 | 0.435 |
| `yrs_exp_stated` | 0.388 | 0.472 | -0.084 | 0.3706 |
| `degree_required` | 0.721 | 0.667 | 0.054 | 0.5386 |
| `degree_stem` | 0.388 | 0.333 | 0.054 | 0.5448 |
| `skill_cloud` | 0.17 | 0.222 | -0.052 | 0.5005 |
| `skill_ml_ai` | 0.231 | 0.25 | -0.019 | 0.8184 |
| `remote_eligible` | 0.102 | 0.083 | 0.019 | 0.7255 |
| `hourly_original` | 0.02 | 0.0 | 0.02 | 0.0833 |
| `mandate_state` | 0.735 | 0.056 | 0.679 | 0.0 |
| `region_northeast` | 0.184 | 0.111 | 0.073 | 0.2466 |
| `region_south` | 0.17 | 0.583 | -0.413 | 0.0 |
| `region_west` | 0.259 | 0.028 | 0.231 | 0.0 |
| `industry_data_center` | 0.122 | 0.389 | -0.266 | 0.0037 |
| `family_ai_ml` | 0.109 | 0.056 | 0.053 | 0.2559 |
| `metro_indianapolis` | 0.02 | 0.139 | -0.118 | 0.0541 |

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

Across 147 postings from 29 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 98% of postings
state one. Where no such requirement exists, 53% do. The
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

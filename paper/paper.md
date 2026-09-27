# Determinants of Advertised Pay in the US Energy and Data Center Sector
## Evidence from employer-published job postings

*Built from data collected through 2026-09-27. Collection cycles: 4.*

## Executive summary

This study asks what attributes stated in a job posting predict the pay an
employer advertises, across the United States energy and data center sector.
Postings are collected from the public applicant tracking system APIs that
employers publish through — the upstream source for the job boards those
postings appear on.

**The clearest result concerns disclosure rather than level.** Pay is
stated in **94.3%** of postings in states with a posting-level
pay-transparency mandate, against **49.0%** where there is none —
a gap of **45 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

The gap is large under every cut of the sample (45 to 48 points)
and stable across them, a spread of only 3 points. Earlier versions
of this study reported a gap swinging from 50 to 71 points, sensitive to
Virginia alone. That sensitivity was an artifact: the non-disclosing
mandate-state postings were a federal consultancy's public health, national
security and law-enforcement work, which audit round 4 removed as outside
the sector under study. Removing it removed the fragility rather than
explaining it away. Section 5 reports every cut.

Within the postings that do disclose, the attributes that predict pay at
conventional significance under the wild cluster bootstrap are seniority, required experience, Northeast location and a stated cloud skill.
Read Northeast location and a stated cloud skill as **tentative**: each passes both checks with a p-value above 0.02 on
at least one, and verdicts this close to 0.05 have moved between collection runs.
Northeast location does not survive adjusting pay for regional price levels (section 5).
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

At the last snapshot, 13 US jurisdictions required employers to state a pay
scale in the posting itself (CA, CO, DC, HI, IL, MA, MD, MN, NJ, NY, VA, VT, WA). Colorado was first, in 2021;
California, New York and Washington followed; Illinois House Bill 3129
took effect on 1 January 2025, Massachusetts in October 2025 and Virginia
on 1 July 2026. Connecticut's posting requirement takes effect on 1 October
2026, after the snapshots used here, so no posting in this study counts as
covered by it. The full table, with effective dates, is in
`config/scope.yaml`, and each snapshot is coded against the laws in force
on its date.

Coverage attaches to the location of the work. A posting listing several
locations is therefore covered if **any** of them is covered, which is how
`mandate_state` is computed; `states_listed` and `n_locations` are retained
so the rule can be checked or recomputed.
Of the in-scope postings, 15% list more than one location, so the choice is not cosmetic.

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
| Retrieved from ATS boards | 4,589 |
| Passed role, seniority and internship screens | 1,225 |
| In the US, with a resolvable state or nationwide-remote | 906 |
| Unique after de-duplication | 484 |
| With a disclosed pay range (estimation sample) | 365 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 1,276 |
| `role_excluded` | 1,068 |
| `no_sector_evidence_in_posting` | 627 |
| `other_group_company` | 267 |
| `internship` | 192 |
| `no_us_state` | 161 |
| `non_us` | 158 |

Distinct employers contributing a disclosed range: **52**. Disclosed ranges by metro: outside the named metros 122, bay area 67, denver 43, chicago 39, remote national 25, boston 25, northern virginia 17, new york 13, minneapolis 6, indianapolis 4, seattle 3, los angeles 1.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Nine rounds of hand-auditing are recorded in `docs/audit-log.md`.
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
| 8 | Run 28 (cancelled at employer 209 of 269): all 58 added rows | GE Vernova's first collection added 18 rows and a cluster; two were off-taxonomy (packaging compliance, sales). "$1M to $30M" project sizes were read as $30 an hour, the only usable row of a phantom Duke cluster. The Ashby adapter had crashed on every board since the cache commit. The first next-day cache read reused 352 descriptions with no disclosure drift |
| 9 | Run 29, the national frame expansion (133 added rows) | Crusoe's salaries were read as monthly because a "$300 per month" commuter benefit sat above them: nine rows at their ceiling or missing. Austin Energy's postings, labelled with facility names, were rejected as having no state. Six off-taxonomy roles at new employers. Crusoe alone supplied 45 usable rows, reported with a sensitivity check |

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
and reported** on every run, and every significance claim is read from it.
The pre-registration requires it below thirty employer clusters; it is kept
above thirty as well, because thirty-odd clusters are still few (amendment
of 2026-09-22). Section 5 gives it. An earlier version of this paper
cited 88% coverage, measured on a simulation whose employer-level shock was
applied to one posting per employer instead of to all of them — so the
figure justifying clustered errors had been computed on data with no
within-employer correlation. The fixture and the figure are both corrected.

## 5. Results

Advertised pay in the estimation sample averages **$148,701** (median $141,050, SD $51,859, range $65,000–$365,000).

At N = 365 with 15 regressors, the smallest
detectable standardized effect is **0.15**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 94.3% | 282 |
| no mandate state | 49.0% | 202 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered; 15% of postings list more than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The gap is cut three ways rather than quoted once, because it was
once sensitive to a single jurisdiction:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 94.3% (n=282) | 49.0% (n=202) | 45pp |
| Excluding Virginia | 97.1% (n=245) | 49.0% (n=202) | 48pp |
| Excluding the largest employer | 93.2% (n=235) | 48.5% (n=200) | 45pp |

The gap is large under every cut and stable across them, a spread of 3 points. An earlier version of this study reported it swinging from 50 to 71 points and sensitive to Virginia alone; that sensitivity was an artifact of including a federal consultancy's public health, national security and law-enforcement postings, removed in audit round 4 as outside the sector under study.

Only **16** postings covered by a mandate fail to state pay.
9 of them list Virginia, whose mandate took effect on 1 July 2026 and is
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
| `const` | 11.2994*** | 0.0397 | 0.000 | — | [11.222, 11.377] | — |
| `seniority_rank` | 0.1128*** | 0.0096 | 0.000 | **0.000** | [0.094, 0.132] | 11.9% |
| `yrs_exp_min` | 0.0229*** | 0.0064 | 0.000 | **0.002** | [0.010, 0.035] | 2.3% |
| `yrs_exp_stated` | -0.0447 | 0.0361 | 0.216 | **0.224** | [-0.115, 0.026] | -4.4% |
| `degree_required` | -0.0291 | 0.0260 | 0.262 | **0.322** | [-0.080, 0.022] | -2.9% |
| `degree_stem` | 0.0465* | 0.0237 | 0.050 | **0.064** | [0.000, 0.093] | 4.8% |
| `skill_cloud` | 0.0807** | 0.0293 | 0.006 | **0.037** | [0.023, 0.138] | 8.4% |
| `skill_ml_ai` | 0.0956* | 0.0421 | 0.023 | **0.053** | [0.013, 0.178] | 10.0% |
| `remote_eligible` | 0.0387 | 0.0384 | 0.314 | **0.465** | [-0.037, 0.114] | 3.9% |
| `hourly_original` | 0.0398 | 0.0391 | 0.308 | **0.434** | [-0.037, 0.116] | 4.1% |
| `mandate_state` | -0.0016 | 0.0326 | 0.962 | **0.965** | [-0.066, 0.062] | -0.2% |
| `region_northeast` | 0.0946*** | 0.0320 | 0.003 | **0.006** | [0.032, 0.157] | 9.9% |
| `region_south` | 0.0512 | 0.0486 | 0.292 | **0.425** | [-0.044, 0.146] | 5.2% |
| `region_west` | 0.0740* | 0.0419 | 0.077 | **0.091** | [-0.008, 0.156] | 7.7% |
| `industry_data_center` | 0.1684 | 0.0725 | 0.020 | **0.190** | [0.026, 0.310] | 18.3% |
| `family_ai_ml` | 0.0551 | 0.0374 | 0.141 | **0.205** | [-0.018, 0.128] | 5.7% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 365, R² = 0.653, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 9.7081*** | 0.1585 | 0.000 | [9.398, 10.019] | — |
| `seniority_rank` | 0.1107*** | 0.0275 | 0.000 | [0.057, 0.165] | 11.7% |
| `yrs_exp_min` | 0.0103 | 0.0146 | 0.483 | [-0.018, 0.039] | 1.0% |
| `yrs_exp_stated` | -0.0237 | 0.1024 | 0.817 | [-0.224, 0.177] | -2.3% |
| `degree_required` | 0.1082 | 0.1003 | 0.280 | [-0.088, 0.305] | 11.4% |
| `degree_stem` | 0.2306*** | 0.0792 | 0.004 | [0.075, 0.386] | 25.9% |
| `skill_cloud` | -0.0491 | 0.0732 | 0.502 | [-0.193, 0.094] | -4.8% |
| `skill_ml_ai` | 0.3719*** | 0.1417 | 0.009 | [0.094, 0.650] | 45.0% |
| `remote_eligible` | 0.0357 | 0.1324 | 0.787 | [-0.224, 0.295] | 3.6% |
| `hourly_original` | 0.0794 | 0.1368 | 0.562 | [-0.189, 0.348] | 8.3% |
| `mandate_state` | -0.0868 | 0.0982 | 0.377 | [-0.279, 0.106] | -8.3% |
| `region_northeast` | 0.0415 | 0.2362 | 0.861 | [-0.421, 0.504] | 4.2% |
| `region_south` | 0.3192*** | 0.1075 | 0.003 | [0.108, 0.530] | 37.6% |
| `region_west` | 0.3877*** | 0.0956 | 0.000 | [0.200, 0.575] | 47.4% |
| `industry_data_center` | -0.5109*** | 0.1866 | 0.006 | [-0.877, -0.145] | -40.0% |
| `family_ai_ml` | 0.0627 | 0.1561 | 0.688 | [-0.243, 0.369] | 6.5% |

*** p<0.01, ** p<0.05, * p<0.10. N = 360, R² = 0.302, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.6865*** | 0.1071 | 0.000 | [0.477, 0.896] | — |
| `mandate_state` | 0.3404*** | 0.0986 | 0.001 | [0.147, 0.534] | 40.6% |
| `seniority_rank` | 0.0042 | 0.0122 | 0.728 | [-0.020, 0.028] | 0.4% |
| `remote_eligible` | -0.0001 | 0.0892 | 0.999 | [-0.175, 0.175] | -0.0% |
| `industry_data_center` | -0.0633 | 0.1042 | 0.544 | [-0.268, 0.141] | -6.1% |
| `region_northeast` | -0.0907 | 0.0960 | 0.345 | [-0.279, 0.097] | -8.7% |
| `region_south` | -0.3786*** | 0.1116 | 0.001 | [-0.597, -0.160] | -31.5% |
| `region_west` | -0.0282 | 0.0828 | 0.733 | [-0.191, 0.134] | -2.8% |

*** p<0.01, ** p<0.05, * p<0.10. N = 484, R² = 0.388, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4309*** | 0.1260 | 0.000 | [11.184, 11.678] | — |
| `seniority_rank` | 0.0616 | 0.0689 | 0.371 | [-0.073, 0.197] | 6.3% |
| `yrs_exp_min` | -0.0187 | 0.0438 | 0.669 | [-0.105, 0.067] | -1.9% |
| `yrs_exp_stated` | 0.0494 | 0.1192 | 0.679 | [-0.184, 0.283] | 5.1% |
| `degree_required` | -0.0796 | 0.0560 | 0.155 | [-0.189, 0.030] | -7.7% |
| `degree_stem` | 0.0775* | 0.0415 | 0.062 | [-0.004, 0.159] | 8.1% |
| `skill_cloud` | 0.1908 | 0.1631 | 0.242 | [-0.129, 0.510] | 21.0% |
| `skill_ml_ai` | 0.0323 | 0.1262 | 0.798 | [-0.215, 0.280] | 3.3% |
| `remote_eligible` | -0.0047 | 0.0726 | 0.949 | [-0.147, 0.138] | -0.5% |
| `mandate_state` | 0.0954 | 0.0718 | 0.184 | [-0.045, 0.236] | 10.0% |
| `region_northeast` | -0.0642 | 0.0738 | 0.384 | [-0.209, 0.081] | -6.2% |
| `region_south` | -0.0923 | 0.1114 | 0.407 | [-0.311, 0.126] | -8.8% |
| `region_west` | 0.0349 | 0.0678 | 0.607 | [-0.098, 0.168] | 3.5% |
| `industry_data_center` | 0.0531 | 0.1232 | 0.667 | [-0.188, 0.294] | 5.5% |
| `family_ai_ml` | 0.3884*** | 0.1112 | 0.001 | [0.171, 0.606] | 47.5% |

*** p<0.01, ** p<0.05, * p<0.10. N = 61, R² = 0.460, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.3798*** | 0.0484 | 0.000 | [11.285, 11.475] | — |
| `seniority_rank` | 0.1135*** | 0.0094 | 0.000 | [0.095, 0.132] | 12.0% |
| `yrs_exp_min` | 0.0215*** | 0.0059 | 0.000 | [0.010, 0.033] | 2.2% |
| `yrs_exp_stated` | -0.0386 | 0.0347 | 0.266 | [-0.106, 0.029] | -3.8% |
| `degree_required` | -0.0251 | 0.0274 | 0.360 | [-0.079, 0.029] | -2.5% |
| `degree_stem` | 0.0427* | 0.0250 | 0.087 | [-0.006, 0.092] | 4.4% |
| `skill_cloud` | 0.0846*** | 0.0275 | 0.002 | [0.031, 0.139] | 8.8% |
| `skill_ml_ai` | 0.0853** | 0.0395 | 0.031 | [0.008, 0.163] | 8.9% |
| `remote_eligible` | 0.0525 | 0.0436 | 0.229 | [-0.033, 0.138] | 5.4% |
| `hourly_original` | 0.0006 | 0.0320 | 0.985 | [-0.062, 0.063] | 0.1% |
| `mandate_state` | -0.0706* | 0.0363 | 0.052 | [-0.142, 0.001] | -6.8% |
| `region_northeast` | 0.0146 | 0.0340 | 0.667 | [-0.052, 0.081] | 1.5% |
| `region_south` | 0.0134 | 0.0463 | 0.772 | [-0.077, 0.104] | 1.4% |
| `region_west` | -0.0034 | 0.0307 | 0.912 | [-0.064, 0.057] | -0.3% |
| `industry_data_center` | 0.1545** | 0.0664 | 0.020 | [0.024, 0.285] | 16.7% |
| `family_ai_ml` | 0.0692* | 0.0356 | 0.052 | [-0.001, 0.139] | 7.2% |

*** p<0.01, ** p<0.05, * p<0.10. N = 341, R² = 0.634, SE: cluster.

**What price adjustment changes.** `region_northeast` passes the bootstrap on nominal pay but is not significant once pay is deflated by regional price parities (clustered p 0.667).
That is consistent with the nominal Northeast premium reflecting price levels rather than real pay.
Conversely, `skill_ml_ai` (+0.085, clustered p 0.031), `industry_data_center` (+0.154, clustered p 0.020) reach clustered significance only in real terms. No bootstrap is run on this model, so under the pre-registered procedure they are not a finding.

### Inference: the wild cluster bootstrap

With 52 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim below thirty clusters, a line this sample clears only narrowly. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

**3 of the 7 coefficients significant
at the 5% level under clustered standard errors do not survive the
bootstrap:** `degree_stem`, `skill_ml_ai`, `industry_data_center`.

This is the correction the pre-registered procedure exists to make.
Nothing about the point estimates changed; what changed is the
reference distribution the estimates are judged against, and at
52 clusters the asymptotic one is simply the
wrong yardstick. The coefficients concerned are reported below as
inconclusive rather than deleted, because an underpowered null is
not the same finding as a measured zero.

Surviving at the 5% level: `seniority_rank` (p = 0.000), `yrs_exp_min` (p = 0.002), `skill_cloud` (p = 0.037), `region_northeast` (p = 0.006).

Monte Carlo error is small relative to the decisions being read off
these numbers: at 9999 replications every
p-value above is stable to within about 0.005 across seeds. An earlier
run at 999 replications returned 0.049, 0.063 and 0.082 for
`degree_required` on three different seeds, straddling the very
threshold its verdict is read from, which is why the replication count
is what it is.

### Robustness: the nationwide-remote postings

25 postings are advertised as nationwide remote and resolve to no state,
so all three census-region dummies are zero for them and they fall into the
**Midwest reference category without being Midwest**. The model is therefore
re-estimated on the 340 observations that do resolve to a state, across
46 employers.

No verdict changes at the 5% level.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.1128 | 0.000 | 0.1138 | 0.001 |
| `yrs_exp_min` | 0.0229 | 0.002 | 0.0216 | 0.003 |
| `yrs_exp_stated` | -0.0447 | 0.224 | -0.0384 | 0.314 |
| `degree_required` | -0.0291 | 0.322 | -0.0331 | 0.285 |
| `degree_stem` | 0.0465 | 0.064 | 0.0451 | 0.076 |
| `skill_cloud` | 0.0807 | 0.037 | 0.0925 | 0.019 |
| `skill_ml_ai` | 0.0956 | 0.053 | 0.0926 | 0.063 |
| `remote_eligible` | 0.0387 | 0.465 | 0.0677 | 0.374 |
| `hourly_original` | 0.0398 | 0.434 | 0.0517 | 0.376 |
| `mandate_state` | -0.0016 | 0.965 | -0.0115 | 0.756 |
| `region_northeast` | 0.0946 | 0.006 | 0.0847 | 0.032 |
| `region_south` | 0.0512 | 0.425 | 0.0403 | 0.511 |
| `region_west` | 0.0740 | 0.091 | 0.0624 | 0.114 |
| `industry_data_center` | 0.1684 | 0.190 | 0.1698 | 0.204 |
| `family_ai_ml` | 0.0551 | 0.205 | 0.0688 | 0.147 |

This check is reported whichever way it comes out. It confirmed `seniority_rank`, `yrs_exp_min`, `skill_cloud`, `region_northeast`.

### Robustness: without the largest employer

The largest employer, Crusoe, supplies 49 observations. The core model is re-estimated without it, on 316 observations across 51 employers, with the same bootstrap at 1,999 replications (as for the region check), so a p-value within about 0.01 of 0.05 is on the line. Pre-registration section 7 treats one employer carrying a result as a threat regardless of N.

| Variable | Bootstrap p (full) | Coef (without) | Bootstrap p (without) |
|---|---|---|---|
| `seniority_rank` | 0.000 | 0.1055 | 0.001 |
| `yrs_exp_min` | 0.002 | 0.0266 | 0.004 |
| `yrs_exp_stated` | 0.224 | -0.0722 | 0.085 |
| `degree_required` | 0.322 | -0.0072 | 0.814 |
| `degree_stem` | 0.064 | 0.0371 | 0.206 |
| `skill_cloud` | 0.037 | 0.0923 | 0.054 |
| `skill_ml_ai` | 0.053 | 0.0363 | 0.269 |
| `remote_eligible` | 0.465 | 0.0873 | 0.040 |
| `hourly_original` | 0.434 | 0.0359 | 0.447 |
| `mandate_state` | 0.965 | -0.0109 | 0.739 |
| `region_northeast` | 0.006 | 0.0999 | 0.009 |
| `region_south` | 0.425 | 0.0798 | 0.173 |
| `region_west` | 0.091 | 0.0597 | 0.132 |
| `industry_data_center` | 0.190 | -0.0021 | 0.968 |
| `family_ai_ml` | 0.205 | 0.0676 | 0.232 |

Verdicts that change at the 5% level: `skill_cloud`, `remote_eligible`.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **61** postings from
**26** employers, estimated above.
It is reported whether or not it agrees with the full sample: a
disagreement would be a finding, not a reason to drop it.

### Pre-registered hypotheses, scored

Directions were committed in `docs/pre-registration.md` before the
national sample was collected. They are scored here whether or not they
held, which is the point of having written them down.

| # | Hypothesis | Predicted | Result |
|---|---|---|---|
| H1 | Seniority dominates advertised pay | + | positive, significant (bootstrap) — supported |
| H3 | Required experience raises pay | + | positive, significant (bootstrap) — supported |
| H4 | AI/ML roles carry a premium | + | positive, not significant (bootstrap) — inconclusive |
| H5 | A required degree raises pay | + | negative, not significant (bootstrap) — inconclusive |
| H7 | Data centers pay more than utilities | + | positive, not significant (bootstrap) — inconclusive |
| H2 | A mandate raises disclosure | + | 94.3% vs 49.0% — **supported**, descriptively |
| H6 | Mandate states advertise wider ranges | + | narrower (-0.087 log points), p = 0.377 clustered, no bootstrap on this model — inconclusive |

**H5 is inconclusive, and it was nearly reported as contradicted.**
The point estimate is negative — a stated degree requirement sits
alongside *lower* advertised pay, conditional on seniority — and under
clustered standard errors that reads p = 0.262,
comfortably significant and opposite to the prediction. The wild
cluster bootstrap puts it at p = 0.322. So the sign is worth
recording and the finding is not: at this cluster count the data
cannot distinguish the negative coefficient from zero. It is reported
because it was predicted the other way, and because the asymptotic
and bootstrap procedures disagree about it, which is precisely the
case the pre-registration anticipated.

### Who discloses pay

Disclosure rate **75.4%** (365 disclosed, 119 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
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

## 6. Threats to validity

These are treated at length in `docs/limitations.md`. In short:

1. The outcome is **advertised** pay, not realized pay. Employers may
   negotiate away from the posted range in either direction.
2. **Disclosure is selected.** Where no mandate applies, 49% of postings
   state pay, so every pay coefficient is conditional
   on disclosure. This is the central threat, and it is why the disclosure
   model is a headline result rather than a footnote.
3. The mandate contrast is **associational**. One cross-section admits no
   difference-in-differences.
4. Pay is **nominal** in the headline model. The BEA price-adjusted
   re-estimate (N = 341) is in section 5; its note says which
   verdicts depend on nominal pay.
5. **Few employer clusters.** 52 employers, the largest supplying 13.4% of observations.
   Cluster-robust errors under-cover with few clusters, measured at 92%
   against a nominal 95% and over-rejecting a cluster-level placebo at 9.5%
   against 5%. Every significance claim in section 5 is therefore read off
   the wild cluster bootstrap, under which 3 of the 7 coefficients that clustered errors call significant become inconclusive.
6. The scope **widened four times in response to the data**. The
   specification was pre-registered before the national sample was
   collected; amendments after that point are dated in
   `docs/pre-registration.md` section 8.
7. Exelon, ComEd, Constellation and Citizens Energy are **absent**, all on
   iCIMS, verified closed rather than assumed.

## 7. Conclusion

Across 365 postings from 52 employers in the US energy and
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
is not supported: the estimate is -0.029 (the wrong sign),
indistinguishable from zero at bootstrap p = 0.32.

The result a reader should treat most cautiously is any coefficient in
the pay models, because that sample is selected on the dependent
variable wherever disclosure is voluntary. The result a reader should
treat most seriously is the disclosure contrast, because it is measured
on the full sample and does not depend on pay being observed.

What would most improve this study is **more employers, not more
postings**. Every pre-registered condition passes (52 employer
clusters against 30; the largest employer supplies 13.4%
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

Reproduce with `pip install -r requirements.txt && python3 tests/run_all.py`,
then `PYTHONPATH=src python3 -m lmstudy.build_dataset && PYTHONPATH=src python3 -m lmstudy.analyze`
on the committed snapshots in `data/raw/`. Collection itself runs only in
GitHub Actions (`.github/workflows/collect.yml`).

# Determinants of Advertised Pay in the US Energy and Data Center Sector
## Evidence from employer-published job postings

*Built from data collected through 2026-09-28. Collection cycles: 5.*

## Executive summary

This study asks what attributes stated in a job posting predict the pay an
employer advertises, across the United States energy and data center sector.
Postings are collected from the public applicant tracking system APIs that
employers publish through — the upstream source for the job boards those
postings appear on.

**The clearest result concerns disclosure rather than level.** Pay is
stated in **91.7%** of postings in states with a posting-level
pay-transparency mandate, against **48.6%** where there is none —
a gap of **43 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

The gap is large under every cut of the sample (42 to 45 points)
and stable across them, a spread of only 2 points. Earlier versions
of this study reported a gap swinging from 50 to 71 points, sensitive to
Virginia alone. That sensitivity was an artifact: the non-disclosing
mandate-state postings were a federal consultancy's public health, national
security and law-enforcement work, which audit round 4 removed as outside
the sector under study. Removing it removed the fragility rather than
explaining it away. Section 5 reports every cut.

Within the postings that do disclose, the attributes that predict pay at
conventional significance under the wild cluster bootstrap are seniority, required experience, a stated cloud skill and Northeast location.
Read West location and a STEM degree as **tentative**: each passes both checks with a p-value above 0.02 on
at least one, and verdicts this close to 0.05 have moved between collection runs.
A stated cloud skill and Northeast location carried no directional prediction in the pre-registration, so they are reported as exploratory.
Northeast location and West location do not survive adjusting pay for regional price levels (section 5).
A further 1 attributes reach significance under
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
| Retrieved from ATS boards | 8,226 |
| Passed role, seniority and internship screens | 2,044 |
| In the US, with a resolvable state or nationwide-remote | 1,530 |
| Unique after de-duplication | 631 |
| With a disclosed pay range (estimation sample) | 472 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 2,684 |
| `role_excluded` | 2,014 |
| `no_sector_evidence_in_posting` | 955 |
| `other_group_company` | 341 |
| `internship` | 318 |
| `no_us_state` | 295 |
| `non_us` | 219 |

Distinct employers contributing a disclosed range: **86**. Disclosed ranges by metro: outside the named metros 166, bay area 95, denver 47, chicago 41, remote national 39, boston 28, new york 19, northern virginia 18, seattle 9, minneapolis 6, indianapolis 3, los angeles 1.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Ten rounds of hand-auditing are recorded in `docs/audit-log.md`.
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
| 9 | Run 29, the national frame expansion (133 added rows) | Crusoe's salaries were read as monthly because a "$300 per month" commuter benefit sat above them: nine rows at their ceiling or missing. Austin Energy's postings, labelled with facility names, were rejected as having no state. Six off-taxonomy roles at new employers. Crusoe alone supplied 49 usable rows, reported with a sensitivity check |
| 10 | Run 30 (28 Sep, dispatched early at the owner's request), the first collection of batches 5-12 and USAJOBS | US towns named after foreign cities read as non-US (Eversource's Berlin, CT), and a repost differing by one full stop, both fixed between runs. Location forms never met before ("Tucson, AZ - Downtown", "Washington - Pullman", "San Francisco Bay Area") rejected every posting of a newly confirmed employer (SEL) on its first collection. Eleven off-taxonomy postings at new employers (HR, labour compliance, construction, manufacturing quality, product engineering) |

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

Advertised pay in the estimation sample averages **$150,948** (median $141,150, SD $51,253, range $65,000–$365,000).

At N = 472 with 15 regressors, the smallest
detectable standardized effect is **0.1312**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 91.7% | 384 |
| no mandate state | 48.6% | 247 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered; 15% of postings list more than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The gap is cut three ways rather than quoted once, because it was
once sensitive to a single jurisdiction:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 91.7% (n=384) | 48.6% (n=247) | 43pp |
| Excluding Virginia | 93.4% (n=347) | 48.6% (n=247) | 45pp |
| Excluding the largest employer | 90.5% (n=337) | 48.2% (n=245) | 42pp |

The gap is large under every cut and stable across them, a spread of 2 points. An earlier version of this study reported it swinging from 50 to 71 points and sensitive to Virginia alone; that sensitivity was an artifact of including a federal consultancy's public health, national security and law-enforcement postings, removed in audit round 4 as outside the sector under study.

Only **32** postings covered by a mandate fail to state pay.
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
| `const` | 11.3141*** | 0.0396 | 0.000 | — | [11.237, 11.392] | — |
| `seniority_rank` | 0.1053*** | 0.0079 | 0.000 | **0.000** | [0.090, 0.121] | 11.1% |
| `yrs_exp_min` | 0.0244*** | 0.0043 | 0.000 | **0.000** | [0.016, 0.033] | 2.5% |
| `yrs_exp_stated` | -0.0616* | 0.0326 | 0.059 | **0.061** | [-0.125, 0.002] | -6.0% |
| `degree_required` | -0.0373 | 0.0267 | 0.163 | **0.198** | [-0.090, 0.015] | -3.7% |
| `degree_stem` | 0.0512** | 0.0215 | 0.017 | **0.024** | [0.009, 0.093] | 5.2% |
| `skill_cloud` | 0.1170*** | 0.0353 | 0.001 | **0.001** | [0.048, 0.186] | 12.4% |
| `skill_ml_ai` | 0.1039* | 0.0458 | 0.023 | **0.059** | [0.014, 0.194] | 10.9% |
| `remote_eligible` | -0.0122 | 0.0368 | 0.741 | **0.765** | [-0.084, 0.060] | -1.2% |
| `hourly_original` | -0.0177 | 0.0440 | 0.687 | **0.735** | [-0.104, 0.069] | -1.8% |
| `mandate_state` | 0.0114 | 0.0321 | 0.723 | **0.739** | [-0.052, 0.074] | 1.1% |
| `region_northeast` | 0.0846*** | 0.0259 | 0.001 | **0.006** | [0.034, 0.136] | 8.8% |
| `region_south` | 0.0744 | 0.0455 | 0.102 | **0.212** | [-0.015, 0.164] | 7.7% |
| `region_west` | 0.1247** | 0.0443 | 0.005 | **0.020** | [0.038, 0.211] | 13.3% |
| `industry_data_center` | 0.1098 | 0.0702 | 0.117 | **0.515** | [-0.028, 0.247] | 11.6% |
| `family_ai_ml` | 0.0765 | 0.0404 | 0.059 | **0.103** | [-0.003, 0.156] | 8.0% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 472, R² = 0.607, SE: cluster.

### Extended model

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4129*** | 0.0436 | 0.000 | [11.328, 11.498] | — |
| `seniority_rank` | 0.0840*** | 0.0085 | 0.000 | [0.067, 0.101] | 8.8% |
| `yrs_exp_min` | 0.0223*** | 0.0034 | 0.000 | [0.015, 0.029] | 2.2% |
| `yrs_exp_stated` | -0.0623** | 0.0283 | 0.028 | [-0.118, -0.007] | -6.0% |
| `degree_required` | -0.0356 | 0.0235 | 0.129 | [-0.082, 0.010] | -3.5% |
| `degree_stem` | 0.0694*** | 0.0214 | 0.001 | [0.028, 0.111] | 7.2% |
| `skill_cloud` | 0.0884** | 0.0360 | 0.014 | [0.018, 0.159] | 9.2% |
| `skill_ml_ai` | 0.0836* | 0.0469 | 0.075 | [-0.008, 0.175] | 8.7% |
| `remote_eligible` | -0.0025 | 0.0368 | 0.945 | [-0.075, 0.070] | -0.2% |
| `hourly_original` | 0.1509*** | 0.0542 | 0.005 | [0.045, 0.257] | 16.3% |
| `mandate_state` | 0.0010 | 0.0400 | 0.980 | [-0.077, 0.079] | 0.1% |
| `region_northeast` | 0.0507* | 0.0264 | 0.055 | [-0.001, 0.102] | 5.2% |
| `region_south` | 0.0816* | 0.0492 | 0.097 | [-0.015, 0.178] | 8.5% |
| `region_west` | 0.0937** | 0.0395 | 0.018 | [0.016, 0.171] | 9.8% |
| `industry_data_center` | 0.0986 | 0.0651 | 0.130 | [-0.029, 0.226] | 10.4% |
| `family_ai_ml` | 0.0811* | 0.0442 | 0.066 | [-0.005, 0.168] | 8.4% |
| `advanced_degree_pref` | 0.0688*** | 0.0223 | 0.002 | [0.025, 0.113] | 7.1% |
| `soft_leadership` | 0.0541** | 0.0211 | 0.010 | [0.013, 0.096] | 5.6% |
| `job_level` | -0.0865*** | 0.0144 | 0.000 | [-0.115, -0.058] | -8.3% |
| `study_metro` | 0.0559 | 0.0341 | 0.101 | [-0.011, 0.123] | 5.7% |
| `prior_internship_req` | -0.1818** | 0.0822 | 0.027 | [-0.343, -0.021] | -16.6% |
| `certification_req` | -0.0427 | 0.0410 | 0.297 | [-0.123, 0.038] | -4.2% |
| `skill_python_r` | -0.0006 | 0.0276 | 0.982 | [-0.055, 0.053] | -0.1% |
| `skill_sql` | -0.0419 | 0.0298 | 0.161 | [-0.100, 0.017] | -4.1% |

*** p<0.01, ** p<0.05, * p<0.10. N = 472, R² = 0.673, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 9.7534*** | 0.1549 | 0.000 | [9.450, 10.057] | — |
| `seniority_rank` | 0.0872*** | 0.0225 | 0.000 | [0.043, 0.131] | 9.1% |
| `yrs_exp_min` | 0.0241** | 0.0103 | 0.019 | [0.004, 0.044] | 2.4% |
| `yrs_exp_stated` | -0.0793 | 0.0835 | 0.342 | [-0.243, 0.084] | -7.6% |
| `degree_required` | 0.0751 | 0.0817 | 0.357 | [-0.085, 0.235] | 7.8% |
| `degree_stem` | 0.2242*** | 0.0599 | 0.000 | [0.107, 0.342] | 25.1% |
| `skill_cloud` | 0.0148 | 0.0727 | 0.839 | [-0.128, 0.157] | 1.5% |
| `skill_ml_ai` | 0.2603** | 0.1268 | 0.040 | [0.012, 0.509] | 29.7% |
| `remote_eligible` | 0.0190 | 0.1229 | 0.877 | [-0.222, 0.260] | 1.9% |
| `hourly_original` | 0.0153 | 0.1211 | 0.900 | [-0.222, 0.253] | 1.5% |
| `mandate_state` | -0.0870 | 0.0911 | 0.339 | [-0.266, 0.091] | -8.3% |
| `region_northeast` | 0.0455 | 0.2345 | 0.846 | [-0.414, 0.505] | 4.7% |
| `region_south` | 0.2925** | 0.1171 | 0.013 | [0.063, 0.522] | 34.0% |
| `region_west` | 0.4901*** | 0.0987 | 0.000 | [0.297, 0.684] | 63.2% |
| `industry_data_center` | -0.4911*** | 0.1609 | 0.002 | [-0.806, -0.176] | -38.8% |
| `family_ai_ml` | 0.0730 | 0.1387 | 0.599 | [-0.199, 0.345] | 7.6% |

*** p<0.01, ** p<0.05, * p<0.10. N = 467, R² = 0.304, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.6390*** | 0.1021 | 0.000 | [0.439, 0.839] | — |
| `mandate_state` | 0.3778*** | 0.0924 | 0.000 | [0.197, 0.559] | 45.9% |
| `seniority_rank` | -0.0020 | 0.0124 | 0.871 | [-0.026, 0.022] | -0.2% |
| `remote_eligible` | 0.0700 | 0.0827 | 0.397 | [-0.092, 0.232] | 7.2% |
| `industry_data_center` | -0.0570 | 0.0991 | 0.565 | [-0.251, 0.137] | -5.5% |
| `region_northeast` | -0.1093 | 0.0939 | 0.245 | [-0.293, 0.075] | -10.3% |
| `region_south` | -0.3146*** | 0.1019 | 0.002 | [-0.514, -0.115] | -27.0% |
| `region_west` | -0.0390 | 0.0765 | 0.610 | [-0.189, 0.111] | -3.8% |

*** p<0.01, ** p<0.05, * p<0.10. N = 631, R² = 0.323, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4684*** | 0.1164 | 0.000 | [11.240, 11.697] | — |
| `seniority_rank` | 0.0558 | 0.0687 | 0.417 | [-0.079, 0.190] | 5.7% |
| `yrs_exp_min` | -0.0119 | 0.0351 | 0.736 | [-0.081, 0.057] | -1.2% |
| `yrs_exp_stated` | 0.0492 | 0.0906 | 0.587 | [-0.128, 0.227] | 5.0% |
| `degree_required` | -0.0871* | 0.0529 | 0.099 | [-0.191, 0.017] | -8.3% |
| `degree_stem` | 0.0636 | 0.0482 | 0.187 | [-0.031, 0.158] | 6.6% |
| `skill_cloud` | 0.2427** | 0.1118 | 0.030 | [0.024, 0.462] | 27.5% |
| `skill_ml_ai` | 0.0485 | 0.0962 | 0.614 | [-0.140, 0.237] | 5.0% |
| `remote_eligible` | -0.0484 | 0.0678 | 0.475 | [-0.181, 0.085] | -4.7% |
| `mandate_state` | 0.0540 | 0.0602 | 0.370 | [-0.064, 0.172] | 5.5% |
| `region_northeast` | -0.0849 | 0.0621 | 0.172 | [-0.207, 0.037] | -8.1% |
| `region_south` | -0.1170 | 0.0866 | 0.176 | [-0.287, 0.053] | -11.0% |
| `region_west` | 0.0746 | 0.0636 | 0.240 | [-0.050, 0.199] | 7.8% |
| `industry_data_center` | 0.0495 | 0.0885 | 0.576 | [-0.124, 0.223] | 5.1% |
| `family_ai_ml` | 0.1743 | 0.1103 | 0.114 | [-0.042, 0.391] | 19.0% |

*** p<0.01, ** p<0.05, * p<0.10. N = 71, R² = 0.550, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.3907*** | 0.0456 | 0.000 | [11.301, 11.480] | — |
| `seniority_rank` | 0.1088*** | 0.0076 | 0.000 | [0.094, 0.124] | 11.5% |
| `yrs_exp_min` | 0.0234*** | 0.0042 | 0.000 | [0.015, 0.032] | 2.4% |
| `yrs_exp_stated` | -0.0570* | 0.0329 | 0.083 | [-0.121, 0.007] | -5.5% |
| `degree_required` | -0.0297 | 0.0254 | 0.241 | [-0.079, 0.020] | -2.9% |
| `degree_stem` | 0.0453** | 0.0224 | 0.043 | [0.001, 0.089] | 4.6% |
| `skill_cloud` | 0.0941*** | 0.0285 | 0.001 | [0.038, 0.150] | 9.9% |
| `skill_ml_ai` | 0.1107*** | 0.0366 | 0.003 | [0.039, 0.182] | 11.7% |
| `remote_eligible` | 0.0076 | 0.0373 | 0.839 | [-0.066, 0.081] | 0.8% |
| `hourly_original` | -0.0504 | 0.0381 | 0.186 | [-0.125, 0.024] | -4.9% |
| `mandate_state` | -0.0636* | 0.0341 | 0.062 | [-0.130, 0.003] | -6.2% |
| `region_northeast` | 0.0028 | 0.0265 | 0.917 | [-0.049, 0.055] | 0.3% |
| `region_south` | 0.0271 | 0.0425 | 0.524 | [-0.056, 0.111] | 2.8% |
| `region_west` | 0.0423 | 0.0374 | 0.258 | [-0.031, 0.116] | 4.3% |
| `industry_data_center` | 0.0907 | 0.0653 | 0.165 | [-0.037, 0.219] | 9.5% |
| `family_ai_ml` | 0.0866** | 0.0352 | 0.014 | [0.018, 0.156] | 9.0% |

*** p<0.01, ** p<0.05, * p<0.10. N = 434, R² = 0.610, SE: cluster.

**What price adjustment changes.** `region_northeast`, `region_west` pass the bootstrap on nominal pay but are not significant once pay is deflated by regional price parities (clustered p 0.917, clustered p 0.258).
That is consistent with the nominal Northeast premium reflecting price levels rather than real pay.
Conversely, `skill_ml_ai` (+0.111, clustered p 0.003), `family_ai_ml` (+0.087, clustered p 0.014) reach clustered significance only in real terms. No bootstrap is run on this model, so under the pre-registered procedure they are not a finding.

### Inference: the wild cluster bootstrap

With 86 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim below thirty clusters, a line this sample clears only narrowly. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

**1 of the 7 coefficients significant
at the 5% level under clustered standard errors do not survive the
bootstrap:** `skill_ml_ai`.

This is the correction the pre-registered procedure exists to make.
Nothing about the point estimates changed; what changed is the
reference distribution the estimates are judged against, and at
86 clusters the asymptotic one is simply the
wrong yardstick. The coefficients concerned are reported below as
inconclusive rather than deleted, because an underpowered null is
not the same finding as a measured zero.

Surviving at the 5% level: `seniority_rank` (p = 0.000), `yrs_exp_min` (p = 0.000), `degree_stem` (p = 0.024), `skill_cloud` (p = 0.001), `region_northeast` (p = 0.006), `region_west` (p = 0.020).

Monte Carlo error is small relative to the decisions being read off
these numbers: at 9999 replications every
p-value above is stable to within about 0.005 across seeds. An earlier
run at 999 replications returned 0.049, 0.063 and 0.082 for
`degree_required` on three different seeds, straddling the very
threshold its verdict is read from, which is why the replication count
is what it is.

### Robustness: the nationwide-remote postings

39 postings are advertised as nationwide remote and resolve to no state,
so all three census-region dummies are zero for them and they fall into the
**Midwest reference category without being Midwest**. The model is therefore
re-estimated on the 433 observations that do resolve to a state, across
77 employers.

**`skill_ml_ai` change verdict** at the 5% level and are
reported as inconclusive.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.1053 | 0.000 | 0.1099 | 0.001 |
| `yrs_exp_min` | 0.0244 | 0.000 | 0.0229 | 0.001 |
| `yrs_exp_stated` | -0.0616 | 0.061 | -0.0514 | 0.132 |
| `degree_required` | -0.0373 | 0.198 | -0.0354 | 0.211 |
| `degree_stem` | 0.0512 | 0.024 | 0.0512 | 0.034 |
| `skill_cloud` | 0.1170 | 0.001 | 0.1015 | 0.002 |
| `skill_ml_ai` | 0.1039 | 0.059 | 0.1223 | 0.013 |
| `remote_eligible` | -0.0122 | 0.765 | 0.0102 | 0.867 |
| `hourly_original` | -0.0177 | 0.735 | -0.0072 | 0.884 |
| `mandate_state` | 0.0114 | 0.739 | -0.0019 | 0.950 |
| `region_northeast` | 0.0846 | 0.006 | 0.0715 | 0.019 |
| `region_south` | 0.0744 | 0.212 | 0.0552 | 0.300 |
| `region_west` | 0.1247 | 0.020 | 0.1156 | 0.026 |
| `industry_data_center` | 0.1098 | 0.515 | 0.0952 | 0.608 |
| `family_ai_ml` | 0.0765 | 0.103 | 0.0873 | 0.059 |

This check is reported whichever way it comes out. It confirmed `seniority_rank`, `yrs_exp_min`, `degree_stem`, `skill_cloud`, `region_northeast`, `region_west` and withdrew `skill_ml_ai`.

### Robustness: without the largest employer

The largest employer, Crusoe, supplies 49 observations. The core model is re-estimated without it, on 423 observations across 85 employers, with the same bootstrap at 1,999 replications (as for the region check), so a p-value within about 0.01 of 0.05 is on the line. Pre-registration section 7 treats one employer carrying a result as a threat regardless of N.

| Variable | Bootstrap p (full) | Coef (without) | Bootstrap p (without) |
|---|---|---|---|
| `seniority_rank` | 0.000 | 0.1012 | 0.001 |
| `yrs_exp_min` | 0.000 | 0.0256 | 0.001 |
| `yrs_exp_stated` | 0.061 | -0.0704 | 0.061 |
| `degree_required` | 0.198 | -0.0292 | 0.356 |
| `degree_stem` | 0.024 | 0.0480 | 0.064 |
| `skill_cloud` | 0.001 | 0.1345 | 0.003 |
| `skill_ml_ai` | 0.059 | 0.0688 | 0.193 |
| `remote_eligible` | 0.765 | 0.0079 | 0.884 |
| `hourly_original` | 0.735 | -0.0245 | 0.682 |
| `mandate_state` | 0.739 | 0.0074 | 0.820 |
| `region_northeast` | 0.006 | 0.0844 | 0.011 |
| `region_south` | 0.212 | 0.0941 | 0.090 |
| `region_west` | 0.020 | 0.1215 | 0.025 |
| `industry_data_center` | 0.515 | -0.0416 | 0.512 |
| `family_ai_ml` | 0.103 | 0.0831 | 0.146 |

Verdicts that change at the 5% level: `degree_stem`.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **71** postings from
**31** employers, estimated above.
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
| H2 | A mandate raises disclosure | + | 91.7% vs 48.6% — **supported**, descriptively |
| H6 | Mandate states advertise wider ranges | + | narrower (-0.087 log points), p = 0.339 clustered, no bootstrap on this model — inconclusive |

**H5 is inconclusive, and it was nearly reported as contradicted.**
The point estimate is negative — a stated degree requirement sits
alongside *lower* advertised pay, conditional on seniority — and under
clustered standard errors that reads p = 0.163,
comfortably significant and opposite to the prediction. The wild
cluster bootstrap puts it at p = 0.198. So the sign is worth
recording and the finding is not: at this cluster count the data
cannot distinguish the negative coefficient from zero. It is reported
because it was predicted the other way, and because the asymptotic
and bootstrap procedures disagree about it, which is precisely the
case the pre-registration anticipated.

### Who discloses pay

Disclosure rate **74.8%** (472 disclosed, 159 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 3.381 | 3.396 | -0.015 | 0.9144 |
| `yrs_exp_min` | 2.28 | 2.145 | 0.135 | 0.6174 |
| `yrs_exp_stated` | 0.464 | 0.547 | -0.083 | 0.0703 |
| `degree_required` | 0.625 | 0.528 | 0.097 | 0.0347 |
| `degree_stem` | 0.403 | 0.358 | 0.044 | 0.3213 |
| `skill_cloud` | 0.22 | 0.107 | 0.113 | 0.0003 |
| `skill_ml_ai` | 0.39 | 0.239 | 0.151 | 0.0002 |
| `remote_eligible` | 0.157 | 0.126 | 0.031 | 0.3221 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.746 | 0.201 | 0.545 | 0.0 |
| `region_northeast` | 0.225 | 0.145 | 0.08 | 0.0192 |
| `region_south` | 0.15 | 0.579 | -0.428 | 0.0 |
| `region_west` | 0.375 | 0.069 | 0.306 | 0.0 |
| `industry_data_center` | 0.157 | 0.176 | -0.019 | 0.5773 |
| `family_ai_ml` | 0.108 | 0.063 | 0.045 | 0.0611 |
| `metro_indianapolis` | 0.006 | 0.05 | -0.044 | 0.0143 |

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
   re-estimate (N = 434) is in section 5; its note says which
   verdicts depend on nominal pay.
5. **Few employer clusters.** 86 employers, the largest supplying 10.4% of observations.
   Cluster-robust errors under-cover with few clusters, measured at 92%
   against a nominal 95% and over-rejecting a cluster-level placebo at 9.5%
   against 5%. Every significance claim in section 5 is therefore read off
   the wild cluster bootstrap, under which 1 of the 7 coefficients that clustered errors call significant become inconclusive.
6. The scope **widened five times in response to the data**. The
   specification was pre-registered before the national sample was
   collected; amendments after that point are dated in
   `docs/pre-registration.md` section 8.
7. Exelon, ComEd, Constellation and Citizens Energy are **absent**, all on
   iCIMS, verified closed rather than assumed.

## 7. Conclusion

Across 472 postings from 86 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 92% of postings
state one. Where no such requirement exists, 49% do. The
contrast is associational: the employers operating in mandate
states may differ in ways that produce some or all of it, and a
single cross-section cannot separate that from the law.

Within the postings that do disclose, seniority is the dominant
predictor and the most precisely estimated, which is what the
pre-registration expected.
The prediction that a stated degree requirement would raise pay
is not supported: the estimate is -0.037 (the wrong sign),
indistinguishable from zero at bootstrap p = 0.20.

The result a reader should treat most cautiously is any coefficient in
the pay models, because that sample is selected on the dependent
variable wherever disclosure is voluntary. The result a reader should
treat most seriously is the disclosure contrast, because it is measured
on the full sample and does not depend on pay being observed.

What would most improve this study is **more employers, not more
postings**. Every pre-registered condition passes (86 employer
clusters against 30; the largest employer supplies 10.4%
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

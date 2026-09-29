# Determinants of Advertised Pay in the US Energy and Data Center Sector
## Evidence from employer-published job postings

*Built from data collected through 2026-09-29. Collection cycles: 6.*

## Executive summary

This study asks what attributes stated in a job posting predict the pay an
employer advertises, across the United States energy and data center sector.
Postings are collected from the public applicant tracking system APIs that
employers publish through — the upstream source for the job boards those
postings appear on.

**The clearest result concerns disclosure rather than level.** Pay is
stated in **91.5%** of postings in states with a posting-level
pay-transparency mandate, against **47.8%** where there is none —
a gap of **44 percentage points**. The
contrast is descriptive, not causal: this is a single cross-section with
no time variation, so no difference-in-differences is available, and
employers operating in mandate states differ from those that do not in
ways these data cannot control for.

The gap is large under every cut of the sample (43 to 45 points)
and stable across them, a spread of only 2 points. Earlier versions
of this study reported a gap swinging from 50 to 71 points, sensitive to
Virginia alone. That sensitivity was an artifact: the non-disclosing
mandate-state postings were a federal consultancy's public health, national
security and law-enforcement work, which audit round 4 removed as outside
the sector under study. Removing it removed the fragility rather than
explaining it away. Section 5 reports every cut.

Within the postings that do disclose, the attributes that predict pay at
conventional significance under the wild cluster bootstrap are seniority, required experience, a stated cloud skill and a Northeast location.
Read a West location, stating an experience minimum and a STEM degree as **tentative**: each passes both checks with a p-value above 0.02 on
at least one, and verdicts this close to 0.05 have moved between collection runs.
A stated cloud skill and a Northeast location carried no directional prediction in the pre-registration, so they are reported as exploratory.
A Northeast location and a West location do not survive adjusting pay for regional price levels (section 5).
A further 3 attributes reach significance under
clustered standard errors but not under the bootstrap, which is
the inference this study pre-registered; they are reported as
inconclusive, not as findings.
Note that stating an experience minimum enters **negatively**, which
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
Of the in-scope postings, 14% list more than one location, so the choice is not cosmetic.

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
| Retrieved from ATS boards | 12,441 |
| Passed role, seniority and internship screens | 2,923 |
| In the US, with a resolvable state or nationwide-remote | 2,183 |
| Unique after de-duplication | 710 |
| With a disclosed pay range (estimation sample) | 531 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 4,457 |
| `role_excluded` | 3,121 |
| `no_sector_evidence_in_posting` | 1,329 |
| `internship` | 463 |
| `no_us_state` | 433 |
| `other_group_company` | 362 |
| `non_us` | 307 |

Distinct employers contributing a disclosed range: **99**. Disclosed ranges by metro: outside the named metros 184, bay area 97, denver 62, remote national 46, chicago 42, boston 29, new york 19, northern virginia 18, los angeles 15, seattle 10, minneapolis 6, indianapolis 3.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Eleven rounds of hand-auditing are recorded in `docs/audit-log.md`.
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
| 11 | Run 31 (29 Sep, dispatched by hand when the cron did not fire), the first collection of the federal energy agencies and batches 13-15 | The dotted "Washington, D.C." read as Washington State, which put two rows in the West and cost a two-site posting its DC mandate site. A retitled Workday posting lost its posting date, a Model 2 regressor. Generated lists of three names read as one phrase in the summary, paper and deck |

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

Advertised pay in the estimation sample averages **$151,993** (median $144,000, SD $50,632, range $65,000–$365,000).

At N = 531 with 15 regressors, the smallest
detectable standardized effect is **0.1235**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 91.5% | 438 |
| no mandate state | 47.8% | 272 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered; 14% of postings list more than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The gap is cut three ways rather than quoted once, because it was
once sensitive to a single jurisdiction:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 91.5% (n=438) | 47.8% (n=272) | 44pp |
| Excluding Virginia | 93.0% (n=401) | 47.8% (n=272) | 45pp |
| Excluding the largest employer | 90.5% (n=391) | 47.4% (n=270) | 43pp |

The gap is large under every cut and stable across them, a spread of 2 points. An earlier version of this study reported it swinging from 50 to 71 points and sensitive to Virginia alone; that sensitivity was an artifact of including a federal consultancy's public health, national security and law-enforcement postings, removed in audit round 4 as outside the sector under study.

Only **37** postings covered by a mandate fail to state pay.
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
| `const` | 11.3419*** | 0.0441 | 0.000 | — | [11.255, 11.428] | — |
| `seniority_rank` | 0.1052*** | 0.0080 | 0.000 | **0.000** | [0.089, 0.121] | 11.1% |
| `yrs_exp_min` | 0.0258*** | 0.0043 | 0.000 | **0.000** | [0.017, 0.034] | 2.6% |
| `yrs_exp_stated` | -0.0722** | 0.0314 | 0.022 | **0.028** | [-0.134, -0.011] | -7.0% |
| `degree_required` | -0.0566* | 0.0269 | 0.035 | **0.051** | [-0.109, -0.004] | -5.5% |
| `degree_stem` | 0.0512** | 0.0227 | 0.024 | **0.032** | [0.007, 0.096] | 5.2% |
| `skill_cloud` | 0.1120*** | 0.0323 | 0.001 | **0.001** | [0.049, 0.175] | 11.8% |
| `skill_ml_ai` | 0.0919* | 0.0437 | 0.035 | **0.068** | [0.006, 0.178] | 9.6% |
| `remote_eligible` | 0.0121 | 0.0346 | 0.726 | **0.741** | [-0.056, 0.080] | 1.2% |
| `hourly_original` | -0.0236 | 0.0388 | 0.543 | **0.651** | [-0.100, 0.052] | -2.3% |
| `mandate_state` | 0.0077 | 0.0314 | 0.807 | **0.822** | [-0.054, 0.069] | 0.8% |
| `region_northeast` | 0.0884** | 0.0300 | 0.003 | **0.011** | [0.029, 0.147] | 9.2% |
| `region_south` | 0.0726 | 0.0438 | 0.098 | **0.201** | [-0.013, 0.158] | 7.5% |
| `region_west` | 0.1261** | 0.0380 | 0.001 | **0.012** | [0.052, 0.201] | 13.4% |
| `industry_data_center` | 0.1026 | 0.0692 | 0.139 | **0.596** | [-0.033, 0.238] | 10.8% |
| `family_ai_ml` | 0.0837* | 0.0377 | 0.026 | **0.053** | [0.010, 0.158] | 8.7% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 531, R² = 0.592, SE: cluster.

### Extended model

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4752*** | 0.0439 | 0.000 | [11.389, 11.561] | — |
| `seniority_rank` | 0.0843*** | 0.0082 | 0.000 | [0.068, 0.100] | 8.8% |
| `yrs_exp_min` | 0.0230*** | 0.0032 | 0.000 | [0.017, 0.029] | 2.3% |
| `yrs_exp_stated` | -0.0662** | 0.0258 | 0.010 | [-0.117, -0.016] | -6.4% |
| `degree_required` | -0.0431* | 0.0226 | 0.057 | [-0.087, 0.001] | -4.2% |
| `degree_stem` | 0.0722*** | 0.0216 | 0.001 | [0.030, 0.114] | 7.5% |
| `skill_cloud` | 0.0907*** | 0.0322 | 0.005 | [0.028, 0.154] | 9.5% |
| `skill_ml_ai` | 0.0863* | 0.0450 | 0.055 | [-0.002, 0.175] | 9.0% |
| `remote_eligible` | 0.0123 | 0.0312 | 0.693 | [-0.049, 0.074] | 1.2% |
| `hourly_original` | 0.1552*** | 0.0514 | 0.003 | [0.054, 0.256] | 16.8% |
| `mandate_state` | 0.0125 | 0.0402 | 0.756 | [-0.066, 0.091] | 1.3% |
| `region_northeast` | 0.0642** | 0.0287 | 0.025 | [0.008, 0.120] | 6.6% |
| `region_south` | 0.0836* | 0.0466 | 0.073 | [-0.008, 0.175] | 8.7% |
| `region_west` | 0.0935*** | 0.0355 | 0.009 | [0.024, 0.163] | 9.8% |
| `industry_data_center` | 0.0933 | 0.0603 | 0.122 | [-0.025, 0.211] | 9.8% |
| `family_ai_ml` | 0.0913** | 0.0397 | 0.021 | [0.013, 0.169] | 9.6% |
| `advanced_degree_pref` | 0.0631*** | 0.0231 | 0.006 | [0.018, 0.108] | 6.5% |
| `soft_leadership` | 0.0541** | 0.0227 | 0.017 | [0.010, 0.099] | 5.6% |
| `job_level` | -0.0884*** | 0.0129 | 0.000 | [-0.114, -0.063] | -8.5% |
| `study_metro` | 0.0331 | 0.0360 | 0.358 | [-0.037, 0.104] | 3.4% |
| `prior_internship_req` | -0.1979** | 0.0768 | 0.010 | [-0.348, -0.047] | -18.0% |
| `certification_req` | -0.0273 | 0.0368 | 0.458 | [-0.099, 0.045] | -2.7% |
| `skill_python_r` | -0.0056 | 0.0231 | 0.810 | [-0.051, 0.040] | -0.6% |
| `skill_sql` | -0.0195 | 0.0262 | 0.458 | [-0.071, 0.032] | -1.9% |
| `skill_viz_bi` | -0.0203 | 0.0232 | 0.383 | [-0.066, 0.025] | -2.0% |
| `skill_big_data` | -0.0472 | 0.0325 | 0.147 | [-0.111, 0.017] | -4.6% |
| `soft_teamwork` | -0.0671*** | 0.0215 | 0.002 | [-0.109, -0.025] | -6.5% |

*** p<0.01, ** p<0.05, * p<0.10. N = 531, R² = 0.668, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 9.7685*** | 0.1499 | 0.000 | [9.475, 10.062] | — |
| `seniority_rank` | 0.0966*** | 0.0213 | 0.000 | [0.055, 0.138] | 10.1% |
| `yrs_exp_min` | 0.0284*** | 0.0098 | 0.004 | [0.009, 0.048] | 2.9% |
| `yrs_exp_stated` | -0.1259 | 0.0807 | 0.119 | [-0.284, 0.032] | -11.8% |
| `degree_required` | 0.0349 | 0.0821 | 0.671 | [-0.126, 0.196] | 3.5% |
| `degree_stem` | 0.2428*** | 0.0642 | 0.000 | [0.117, 0.369] | 27.5% |
| `skill_cloud` | 0.0049 | 0.0731 | 0.947 | [-0.138, 0.148] | 0.5% |
| `skill_ml_ai` | 0.2330* | 0.1214 | 0.055 | [-0.005, 0.471] | 26.2% |
| `remote_eligible` | 0.0145 | 0.1102 | 0.895 | [-0.202, 0.231] | 1.5% |
| `hourly_original` | 0.0636 | 0.1039 | 0.541 | [-0.140, 0.267] | 6.6% |
| `mandate_state` | -0.0751 | 0.0868 | 0.387 | [-0.245, 0.095] | -7.2% |
| `region_northeast` | 0.0642 | 0.2404 | 0.789 | [-0.407, 0.535] | 6.6% |
| `region_south` | 0.2944*** | 0.1135 | 0.009 | [0.072, 0.517] | 34.2% |
| `region_west` | 0.4268*** | 0.0877 | 0.000 | [0.255, 0.599] | 53.2% |
| `industry_data_center` | -0.4564*** | 0.1612 | 0.005 | [-0.772, -0.140] | -36.6% |
| `family_ai_ml` | 0.1009 | 0.1306 | 0.440 | [-0.155, 0.357] | 10.6% |

*** p<0.01, ** p<0.05, * p<0.10. N = 526, R² = 0.284, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.6567*** | 0.0988 | 0.000 | [0.463, 0.850] | — |
| `mandate_state` | 0.3858*** | 0.0905 | 0.000 | [0.208, 0.563] | 47.1% |
| `seniority_rank` | -0.0059 | 0.0116 | 0.609 | [-0.029, 0.017] | -0.6% |
| `remote_eligible` | 0.0772 | 0.0750 | 0.303 | [-0.070, 0.224] | 8.0% |
| `industry_data_center` | -0.0676 | 0.0962 | 0.483 | [-0.256, 0.121] | -6.5% |
| `region_northeast` | -0.1270 | 0.0921 | 0.168 | [-0.307, 0.053] | -11.9% |
| `region_south` | -0.3307*** | 0.1004 | 0.001 | [-0.527, -0.134] | -28.2% |
| `region_west` | -0.0591 | 0.0735 | 0.421 | [-0.203, 0.085] | -5.7% |

*** p<0.01, ** p<0.05, * p<0.10. N = 710, R² = 0.337, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4688*** | 0.1157 | 0.000 | [11.242, 11.696] | — |
| `seniority_rank` | 0.0782 | 0.0677 | 0.248 | [-0.055, 0.211] | 8.1% |
| `yrs_exp_min` | 0.0200 | 0.0315 | 0.525 | [-0.042, 0.082] | 2.0% |
| `yrs_exp_stated` | -0.0330 | 0.0738 | 0.655 | [-0.178, 0.112] | -3.2% |
| `degree_required` | -0.0817 | 0.0506 | 0.106 | [-0.181, 0.017] | -7.8% |
| `degree_stem` | 0.0317 | 0.0522 | 0.544 | [-0.070, 0.134] | 3.2% |
| `skill_cloud` | 0.2168** | 0.1095 | 0.048 | [0.002, 0.431] | 24.2% |
| `skill_ml_ai` | 0.0680 | 0.0978 | 0.487 | [-0.124, 0.260] | 7.0% |
| `remote_eligible` | -0.0013 | 0.0747 | 0.986 | [-0.148, 0.145] | -0.1% |
| `mandate_state` | 0.0429 | 0.0591 | 0.468 | [-0.073, 0.159] | 4.4% |
| `region_northeast` | -0.0976 | 0.0594 | 0.100 | [-0.214, 0.019] | -9.3% |
| `region_south` | -0.1186 | 0.0840 | 0.158 | [-0.283, 0.046] | -11.2% |
| `region_west` | 0.0300 | 0.0566 | 0.597 | [-0.081, 0.141] | 3.0% |
| `industry_data_center` | 0.0596 | 0.0911 | 0.513 | [-0.119, 0.238] | 6.2% |
| `family_ai_ml` | 0.2224** | 0.1018 | 0.029 | [0.023, 0.422] | 24.9% |

*** p<0.01, ** p<0.05, * p<0.10. N = 79, R² = 0.508, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4018*** | 0.0443 | 0.000 | [11.315, 11.489] | — |
| `seniority_rank` | 0.1104*** | 0.0073 | 0.000 | [0.096, 0.125] | 11.7% |
| `yrs_exp_min` | 0.0243*** | 0.0041 | 0.000 | [0.016, 0.032] | 2.5% |
| `yrs_exp_stated` | -0.0715** | 0.0310 | 0.021 | [-0.132, -0.011] | -6.9% |
| `degree_required` | -0.0463* | 0.0262 | 0.077 | [-0.098, 0.005] | -4.5% |
| `degree_stem` | 0.0513** | 0.0229 | 0.025 | [0.006, 0.096] | 5.3% |
| `skill_cloud` | 0.0863*** | 0.0264 | 0.001 | [0.035, 0.138] | 9.0% |
| `skill_ml_ai` | 0.1062*** | 0.0345 | 0.002 | [0.038, 0.174] | 11.2% |
| `remote_eligible` | 0.0108 | 0.0344 | 0.752 | [-0.057, 0.078] | 1.1% |
| `hourly_original` | -0.0591* | 0.0348 | 0.089 | [-0.127, 0.009] | -5.7% |
| `mandate_state` | -0.0619* | 0.0332 | 0.062 | [-0.127, 0.003] | -6.0% |
| `region_northeast` | 0.0143 | 0.0307 | 0.642 | [-0.046, 0.074] | 1.4% |
| `region_south` | 0.0313 | 0.0415 | 0.451 | [-0.050, 0.113] | 3.2% |
| `region_west` | 0.0487 | 0.0343 | 0.155 | [-0.018, 0.116] | 5.0% |
| `industry_data_center` | 0.0825 | 0.0628 | 0.189 | [-0.041, 0.206] | 8.6% |
| `family_ai_ml` | 0.0883*** | 0.0337 | 0.009 | [0.022, 0.154] | 9.2% |

*** p<0.01, ** p<0.05, * p<0.10. N = 487, R² = 0.602, SE: cluster.

**What price adjustment changes.** `region_northeast`, `region_west` pass the bootstrap on nominal pay but are not significant once pay is deflated by regional price parities (clustered p 0.642, clustered p 0.155).
That is consistent with the nominal Northeast premium reflecting price levels rather than real pay.
Conversely, `skill_ml_ai` (+0.106, clustered p 0.002), `family_ai_ml` (+0.088, clustered p 0.009) reach clustered significance only in real terms. No bootstrap is run on this model, so under the pre-registered procedure they are not a finding.

### Inference: the wild cluster bootstrap

With 99 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim below thirty clusters, a line this sample clears only narrowly. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

**3 of the 10 coefficients significant
at the 5% level under clustered standard errors do not survive the
bootstrap:** `degree_required`, `skill_ml_ai`, `family_ai_ml`.

This is the correction the pre-registered procedure exists to make.
Nothing about the point estimates changed; what changed is the
reference distribution the estimates are judged against, and at
99 clusters the asymptotic one is simply the
wrong yardstick. The coefficients concerned are reported below as
inconclusive rather than deleted, because an underpowered null is
not the same finding as a measured zero.

Surviving at the 5% level: `seniority_rank` (p = 0.000), `yrs_exp_min` (p = 0.000), `yrs_exp_stated` (p = 0.028), `degree_stem` (p = 0.032), `skill_cloud` (p = 0.001), `region_northeast` (p = 0.011), `region_west` (p = 0.012).

Monte Carlo error is small relative to the decisions being read off
these numbers: at 9999 replications every
p-value above is stable to within about 0.005 across seeds. An earlier
run at 999 replications returned 0.049, 0.063 and 0.082 for
`degree_required` on three different seeds, straddling the very
threshold its verdict is read from, which is why the replication count
is what it is.

### Robustness: the nationwide-remote postings

46 postings are advertised as nationwide remote and resolve to no state,
so all three census-region dummies are zero for them and they fall into the
**Midwest reference category without being Midwest**. The model is therefore
re-estimated on the 485 observations that do resolve to a state, across
89 employers.

**`skill_ml_ai`, `family_ai_ml` change verdict** at the 5% level and are
reported as inconclusive.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.1052 | 0.000 | 0.1118 | 0.001 |
| `yrs_exp_min` | 0.0258 | 0.000 | 0.0236 | 0.001 |
| `yrs_exp_stated` | -0.0722 | 0.028 | -0.0654 | 0.045 |
| `degree_required` | -0.0566 | 0.051 | -0.0520 | 0.078 |
| `degree_stem` | 0.0512 | 0.032 | 0.0612 | 0.013 |
| `skill_cloud` | 0.1120 | 0.001 | 0.0952 | 0.003 |
| `skill_ml_ai` | 0.0919 | 0.068 | 0.1140 | 0.012 |
| `remote_eligible` | 0.0121 | 0.741 | 0.0235 | 0.602 |
| `hourly_original` | -0.0236 | 0.651 | -0.0173 | 0.726 |
| `mandate_state` | 0.0077 | 0.822 | -0.0005 | 0.987 |
| `region_northeast` | 0.0884 | 0.011 | 0.0823 | 0.017 |
| `region_south` | 0.0726 | 0.201 | 0.0599 | 0.259 |
| `region_west` | 0.1261 | 0.012 | 0.1227 | 0.022 |
| `industry_data_center` | 0.1026 | 0.596 | 0.0875 | 0.660 |
| `family_ai_ml` | 0.0837 | 0.053 | 0.0867 | 0.036 |

This check is reported whichever way it comes out. It confirmed `seniority_rank`, `yrs_exp_min`, `yrs_exp_stated`, `degree_stem`, `skill_cloud`, `region_northeast`, `region_west` and withdrew `skill_ml_ai`, `family_ai_ml`.

### Robustness: without the largest employer

The largest employer, Crusoe, supplies 49 observations. The core model is re-estimated without it, on 482 observations across 98 employers, with the same bootstrap at 1,999 replications (as for the region check), so a p-value within about 0.01 of 0.05 is on the line. Pre-registration section 7 treats one employer carrying a result as a threat regardless of N.

| Variable | Bootstrap p (full) | Coef (without) | Bootstrap p (without) |
|---|---|---|---|
| `seniority_rank` | 0.000 | 0.1014 | 0.001 |
| `yrs_exp_min` | 0.000 | 0.0272 | 0.001 |
| `yrs_exp_stated` | 0.028 | -0.0814 | 0.029 |
| `degree_required` | 0.051 | -0.0509 | 0.111 |
| `degree_stem` | 0.032 | 0.0473 | 0.081 |
| `skill_cloud` | 0.001 | 0.1249 | 0.003 |
| `skill_ml_ai` | 0.068 | 0.0596 | 0.225 |
| `remote_eligible` | 0.741 | 0.0290 | 0.475 |
| `hourly_original` | 0.651 | -0.0287 | 0.602 |
| `mandate_state` | 0.822 | 0.0046 | 0.871 |
| `region_northeast` | 0.011 | 0.0874 | 0.018 |
| `region_south` | 0.201 | 0.0906 | 0.104 |
| `region_west` | 0.012 | 0.1214 | 0.017 |
| `industry_data_center` | 0.596 | -0.0527 | 0.398 |
| `family_ai_ml` | 0.053 | 0.0932 | 0.067 |

Verdicts that change at the 5% level: `degree_stem`.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **79** postings from
**35** employers, estimated above.
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
| H2 | A mandate raises disclosure | + | 91.5% vs 47.8% — **supported**, descriptively |
| H6 | Mandate states advertise wider ranges | + | narrower (-0.075 log points), p = 0.387 clustered, no bootstrap on this model — inconclusive |

**H5 is inconclusive, and it was nearly reported as contradicted.**
The point estimate is negative — a stated degree requirement sits
alongside *lower* advertised pay, conditional on seniority — and under
clustered standard errors that reads p = 0.035,
comfortably significant and opposite to the prediction. The wild
cluster bootstrap puts it at p = 0.051. So the sign is worth
recording and the finding is not: at this cluster count the data
cannot distinguish the negative coefficient from zero. It is reported
because it was predicted the other way, and because the asymptotic
and bootstrap procedures disagree about it, which is precisely the
case the pre-registration anticipated.

### Who discloses pay

Disclosure rate **74.8%** (531 disclosed, 179 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 3.388 | 3.458 | -0.07 | 0.5873 |
| `yrs_exp_min` | 2.324 | 2.307 | 0.017 | 0.9479 |
| `yrs_exp_stated` | 0.48 | 0.57 | -0.09 | 0.0379 |
| `degree_required` | 0.61 | 0.514 | 0.096 | 0.0261 |
| `degree_stem` | 0.411 | 0.358 | 0.053 | 0.2057 |
| `skill_cloud` | 0.215 | 0.106 | 0.109 | 0.0002 |
| `skill_ml_ai` | 0.363 | 0.263 | 0.101 | 0.0102 |
| `remote_eligible` | 0.168 | 0.117 | 0.05 | 0.0845 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.755 | 0.207 | 0.548 | 0.0 |
| `region_northeast` | 0.217 | 0.14 | 0.077 | 0.0153 |
| `region_south` | 0.143 | 0.587 | -0.443 | 0.0 |
| `region_west` | 0.403 | 0.084 | 0.319 | 0.0 |
| `industry_data_center` | 0.139 | 0.184 | -0.045 | 0.1703 |
| `family_ai_ml` | 0.102 | 0.078 | 0.023 | 0.3291 |
| `metro_indianapolis` | 0.006 | 0.045 | -0.039 | 0.0145 |

## 6. Threats to validity

These are treated at length in `docs/limitations.md`. In short:

1. The outcome is **advertised** pay, not realized pay. Employers may
   negotiate away from the posted range in either direction.
2. **Disclosure is selected.** Where no mandate applies, 48% of postings
   state pay, so every pay coefficient is conditional
   on disclosure. This is the central threat, and it is why the disclosure
   model is a headline result rather than a footnote.
3. The mandate contrast is **associational**. One cross-section admits no
   difference-in-differences.
4. Pay is **nominal** in the headline model. The BEA price-adjusted
   re-estimate (N = 487) is in section 5; its note says which
   verdicts depend on nominal pay.
5. **Few employer clusters.** 99 employers, the largest supplying 9.2% of observations.
   Cluster-robust errors under-cover with few clusters, measured at 92%
   against a nominal 95% and over-rejecting a cluster-level placebo at 9.5%
   against 5%. Every significance claim in section 5 is therefore read off
   the wild cluster bootstrap, under which 3 of the 10 coefficients that clustered errors call significant become inconclusive.
6. The scope **widened five times in response to the data**. The
   specification was pre-registered before the national sample was
   collected; amendments after that point are dated in
   `docs/pre-registration.md` section 8.
7. Exelon, ComEd, Constellation and Citizens Energy are **absent**, all on
   iCIMS, verified closed rather than assumed.

## 7. Conclusion

Across 531 postings from 99 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 92% of postings
state one. Where no such requirement exists, 48% do. The
contrast is associational: the employers operating in mandate
states may differ in ways that produce some or all of it, and a
single cross-section cannot separate that from the law.

Within the postings that do disclose, seniority is the dominant
predictor and the most precisely estimated, which is what the
pre-registration expected.
The prediction that a stated degree requirement would raise pay
is not supported: the estimate is -0.057 (the wrong sign),
indistinguishable from zero at bootstrap p = 0.05.

The result a reader should treat most cautiously is any coefficient in
the pay models, because that sample is selected on the dependent
variable wherever disclosure is voluntary. The result a reader should
treat most seriously is the disclosure contrast, because it is measured
on the full sample and does not depend on pay being observed.

What would most improve this study is **more employers, not more
postings**. Every pre-registered condition passes (99 employer
clusters against 30; the largest employer supplies 9.2%
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

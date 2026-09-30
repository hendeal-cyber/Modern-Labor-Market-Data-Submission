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
stated in **91.2%** of postings in states with a posting-level
pay-transparency mandate, against **47.6%** where there is none —
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
conventional significance under the wild cluster bootstrap are seniority, required experience, a stated cloud skill and a West location.
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
| Retrieved from ATS boards | 12,680 |
| Passed role, seniority and internship screens | 3,081 |
| In the US, with a resolvable state or nationwide-remote | 2,338 |
| Unique after de-duplication | 720 |
| With a disclosed pay range (estimation sample) | 536 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 4,474 |
| `role_excluded` | 3,129 |
| `no_sector_evidence_in_posting` | 1,333 |
| `internship` | 465 |
| `no_us_state` | 434 |
| `other_group_company` | 413 |
| `non_us` | 309 |

Distinct employers contributing a disclosed range: **99**. Disclosed ranges by metro: outside the named metros 187, bay area 97, denver 63, remote national 46, chicago 43, boston 29, new york 19, northern virginia 18, los angeles 15, seattle 10, minneapolis 6, indianapolis 3.

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

Advertised pay in the estimation sample averages **$151,765** (median $144,000, SD $50,526, range $65,000–$365,000).

At N = 536 with 15 regressors, the smallest
detectable standardized effect is **0.1229**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 91.2% | 443 |
| no mandate state | 47.6% | 277 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered; 14% of postings list more than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The gap is cut three ways rather than quoted once, because it was
once sensitive to a single jurisdiction:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 91.2% (n=443) | 47.6% (n=277) | 44pp |
| Excluding Virginia | 92.6% (n=406) | 47.6% (n=277) | 45pp |
| Excluding the largest employer | 90.1% (n=396) | 47.3% (n=275) | 43pp |

The gap is large under every cut and stable across them, a spread of 2 points. An earlier version of this study reported it swinging from 50 to 71 points and sensitive to Virginia alone; that sensitivity was an artifact of including a federal consultancy's public health, national security and law-enforcement postings, removed in audit round 4 as outside the sector under study.

Only **39** postings covered by a mandate fail to state pay.
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
| `const` | 11.3411*** | 0.0435 | 0.000 | — | [11.256, 11.426] | — |
| `seniority_rank` | 0.1045*** | 0.0079 | 0.000 | **0.000** | [0.089, 0.120] | 11.0% |
| `yrs_exp_min` | 0.0260*** | 0.0043 | 0.000 | **0.000** | [0.018, 0.034] | 2.6% |
| `yrs_exp_stated` | -0.0729** | 0.0311 | 0.019 | **0.024** | [-0.134, -0.012] | -7.0% |
| `degree_required` | -0.0560* | 0.0271 | 0.039 | **0.057** | [-0.109, -0.003] | -5.5% |
| `degree_stem` | 0.0508** | 0.0224 | 0.024 | **0.031** | [0.007, 0.095] | 5.2% |
| `skill_cloud` | 0.1133*** | 0.0324 | 0.001 | **0.001** | [0.050, 0.177] | 12.0% |
| `skill_ml_ai` | 0.0919* | 0.0439 | 0.036 | **0.072** | [0.006, 0.178] | 9.6% |
| `remote_eligible` | 0.0141 | 0.0341 | 0.679 | **0.693** | [-0.053, 0.081] | 1.4% |
| `hourly_original` | -0.0239 | 0.0386 | 0.536 | **0.647** | [-0.100, 0.052] | -2.4% |
| `mandate_state` | 0.0090 | 0.0310 | 0.771 | **0.785** | [-0.052, 0.070] | 0.9% |
| `region_northeast` | 0.0869** | 0.0305 | 0.004 | **0.014** | [0.027, 0.147] | 9.1% |
| `region_south` | 0.0743 | 0.0439 | 0.091 | **0.194** | [-0.012, 0.160] | 7.7% |
| `region_west` | 0.1268** | 0.0381 | 0.001 | **0.011** | [0.052, 0.202] | 13.5% |
| `industry_data_center` | 0.1009 | 0.0690 | 0.144 | **0.599** | [-0.034, 0.236] | 10.6% |
| `family_ai_ml` | 0.0847* | 0.0377 | 0.025 | **0.051** | [0.011, 0.159] | 8.8% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 536, R² = 0.593, SE: cluster.

### Extended model

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4753*** | 0.0430 | 0.000 | [11.391, 11.560] | — |
| `seniority_rank` | 0.0838*** | 0.0081 | 0.000 | [0.068, 0.100] | 8.7% |
| `yrs_exp_min` | 0.0231*** | 0.0032 | 0.000 | [0.017, 0.029] | 2.3% |
| `yrs_exp_stated` | -0.0672*** | 0.0257 | 0.009 | [-0.118, -0.017] | -6.5% |
| `degree_required` | -0.0433* | 0.0226 | 0.056 | [-0.088, 0.001] | -4.2% |
| `degree_stem` | 0.0704*** | 0.0212 | 0.001 | [0.029, 0.112] | 7.3% |
| `skill_cloud` | 0.0920*** | 0.0323 | 0.004 | [0.029, 0.155] | 9.6% |
| `skill_ml_ai` | 0.0851* | 0.0453 | 0.060 | [-0.004, 0.174] | 8.9% |
| `remote_eligible` | 0.0144 | 0.0306 | 0.639 | [-0.046, 0.074] | 1.4% |
| `hourly_original` | 0.1539*** | 0.0508 | 0.003 | [0.054, 0.254] | 16.6% |
| `mandate_state` | 0.0130 | 0.0394 | 0.742 | [-0.064, 0.090] | 1.3% |
| `region_northeast` | 0.0658** | 0.0292 | 0.024 | [0.009, 0.123] | 6.8% |
| `region_south` | 0.0862* | 0.0470 | 0.066 | [-0.006, 0.178] | 9.0% |
| `region_west` | 0.0958*** | 0.0360 | 0.008 | [0.025, 0.166] | 10.1% |
| `industry_data_center` | 0.0936 | 0.0600 | 0.118 | [-0.024, 0.211] | 9.8% |
| `family_ai_ml` | 0.0924** | 0.0397 | 0.020 | [0.015, 0.170] | 9.7% |
| `advanced_degree_pref` | 0.0633*** | 0.0230 | 0.006 | [0.018, 0.108] | 6.5% |
| `soft_leadership` | 0.0531** | 0.0226 | 0.019 | [0.009, 0.097] | 5.5% |
| `job_level` | -0.0886*** | 0.0126 | 0.000 | [-0.113, -0.064] | -8.5% |
| `study_metro` | 0.0324 | 0.0356 | 0.364 | [-0.037, 0.102] | 3.3% |
| `prior_internship_req` | -0.1979*** | 0.0766 | 0.010 | [-0.348, -0.048] | -18.0% |
| `certification_req` | -0.0273 | 0.0365 | 0.454 | [-0.099, 0.044] | -2.7% |
| `skill_python_r` | -0.0048 | 0.0230 | 0.834 | [-0.050, 0.040] | -0.5% |
| `skill_sql` | -0.0182 | 0.0262 | 0.487 | [-0.070, 0.033] | -1.8% |
| `skill_viz_bi` | -0.0213 | 0.0231 | 0.357 | [-0.067, 0.024] | -2.1% |
| `skill_big_data` | -0.0474 | 0.0326 | 0.146 | [-0.111, 0.017] | -4.6% |
| `soft_teamwork` | -0.0669*** | 0.0214 | 0.002 | [-0.109, -0.025] | -6.5% |

*** p<0.01, ** p<0.05, * p<0.10. N = 536, R² = 0.669, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 9.7740*** | 0.1544 | 0.000 | [9.471, 10.077] | — |
| `seniority_rank` | 0.0929*** | 0.0216 | 0.000 | [0.051, 0.135] | 9.7% |
| `yrs_exp_min` | 0.0295*** | 0.0098 | 0.003 | [0.010, 0.049] | 3.0% |
| `yrs_exp_stated` | -0.1322 | 0.0808 | 0.102 | [-0.290, 0.026] | -12.4% |
| `degree_required` | 0.0374 | 0.0837 | 0.655 | [-0.127, 0.202] | 3.8% |
| `degree_stem` | 0.2467*** | 0.0647 | 0.000 | [0.120, 0.373] | 28.0% |
| `skill_cloud` | 0.0071 | 0.0738 | 0.923 | [-0.138, 0.152] | 0.7% |
| `skill_ml_ai` | 0.2368* | 0.1217 | 0.052 | [-0.002, 0.475] | 26.7% |
| `remote_eligible` | 0.0188 | 0.1101 | 0.864 | [-0.197, 0.235] | 1.9% |
| `hourly_original` | 0.0601 | 0.1039 | 0.563 | [-0.144, 0.264] | 6.2% |
| `mandate_state` | -0.0718 | 0.0873 | 0.410 | [-0.243, 0.099] | -6.9% |
| `region_northeast` | 0.0517 | 0.2445 | 0.833 | [-0.428, 0.531] | 5.3% |
| `region_south` | 0.2957** | 0.1153 | 0.010 | [0.070, 0.522] | 34.4% |
| `region_west` | 0.4243*** | 0.0877 | 0.000 | [0.252, 0.596] | 52.9% |
| `industry_data_center` | -0.4708*** | 0.1632 | 0.004 | [-0.791, -0.151] | -37.5% |
| `family_ai_ml` | 0.1032 | 0.1313 | 0.432 | [-0.154, 0.360] | 10.9% |

*** p<0.01, ** p<0.05, * p<0.10. N = 531, R² = 0.286, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.6529*** | 0.0983 | 0.000 | [0.460, 0.846] | — |
| `mandate_state` | 0.3803*** | 0.0897 | 0.000 | [0.205, 0.556] | 46.3% |
| `seniority_rank` | -0.0035 | 0.0117 | 0.768 | [-0.026, 0.019] | -0.3% |
| `remote_eligible` | 0.0758 | 0.0745 | 0.309 | [-0.070, 0.222] | 7.9% |
| `industry_data_center` | -0.0652 | 0.0947 | 0.491 | [-0.251, 0.120] | -6.3% |
| `region_northeast` | -0.1353 | 0.0953 | 0.155 | [-0.322, 0.051] | -12.7% |
| `region_south` | -0.3392*** | 0.0996 | 0.001 | [-0.534, -0.144] | -28.8% |
| `region_west` | -0.0588 | 0.0726 | 0.418 | [-0.201, 0.084] | -5.7% |

*** p<0.01, ** p<0.05, * p<0.10. N = 720, R² = 0.335, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4565*** | 0.1118 | 0.000 | [11.237, 11.676] | — |
| `seniority_rank` | 0.0810 | 0.0687 | 0.238 | [-0.054, 0.216] | 8.4% |
| `yrs_exp_min` | 0.0204 | 0.0315 | 0.519 | [-0.042, 0.082] | 2.1% |
| `yrs_exp_stated` | -0.0311 | 0.0733 | 0.671 | [-0.175, 0.113] | -3.1% |
| `degree_required` | -0.0834* | 0.0499 | 0.094 | [-0.181, 0.014] | -8.0% |
| `degree_stem` | 0.0258 | 0.0490 | 0.599 | [-0.070, 0.122] | 2.6% |
| `skill_cloud` | 0.2162** | 0.1097 | 0.049 | [0.001, 0.431] | 24.1% |
| `skill_ml_ai` | 0.0685 | 0.0973 | 0.482 | [-0.122, 0.259] | 7.1% |
| `remote_eligible` | 0.0014 | 0.0745 | 0.986 | [-0.145, 0.147] | 0.1% |
| `mandate_state` | 0.0510 | 0.0542 | 0.347 | [-0.055, 0.157] | 5.2% |
| `region_northeast` | -0.0952 | 0.0587 | 0.105 | [-0.210, 0.020] | -9.1% |
| `region_south` | -0.1142 | 0.0839 | 0.174 | [-0.279, 0.050] | -10.8% |
| `region_west` | 0.0309 | 0.0569 | 0.588 | [-0.081, 0.142] | 3.1% |
| `industry_data_center` | 0.0606 | 0.0907 | 0.504 | [-0.117, 0.238] | 6.2% |
| `family_ai_ml` | 0.2229** | 0.1027 | 0.030 | [0.022, 0.424] | 25.0% |

*** p<0.01, ** p<0.05, * p<0.10. N = 80, R² = 0.510, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4008*** | 0.0439 | 0.000 | [11.315, 11.487] | — |
| `seniority_rank` | 0.1094*** | 0.0072 | 0.000 | [0.095, 0.123] | 11.6% |
| `yrs_exp_min` | 0.0246*** | 0.0040 | 0.000 | [0.017, 0.033] | 2.5% |
| `yrs_exp_stated` | -0.0725** | 0.0306 | 0.018 | [-0.132, -0.013] | -7.0% |
| `degree_required` | -0.0454* | 0.0266 | 0.087 | [-0.098, 0.007] | -4.4% |
| `degree_stem` | 0.0505** | 0.0228 | 0.027 | [0.006, 0.095] | 5.2% |
| `skill_cloud` | 0.0878*** | 0.0264 | 0.001 | [0.036, 0.140] | 9.2% |
| `skill_ml_ai` | 0.1051*** | 0.0343 | 0.002 | [0.038, 0.172] | 11.1% |
| `remote_eligible` | 0.0120 | 0.0343 | 0.727 | [-0.055, 0.079] | 1.2% |
| `hourly_original` | -0.0605* | 0.0347 | 0.082 | [-0.129, 0.008] | -5.9% |
| `mandate_state` | -0.0597* | 0.0335 | 0.075 | [-0.125, 0.006] | -5.8% |
| `region_northeast` | 0.0132 | 0.0308 | 0.669 | [-0.047, 0.074] | 1.3% |
| `region_south` | 0.0339 | 0.0410 | 0.408 | [-0.046, 0.114] | 3.5% |
| `region_west` | 0.0503 | 0.0344 | 0.144 | [-0.017, 0.118] | 5.2% |
| `industry_data_center` | 0.0815 | 0.0625 | 0.193 | [-0.041, 0.204] | 8.5% |
| `family_ai_ml` | 0.0901*** | 0.0335 | 0.007 | [0.025, 0.156] | 9.4% |

*** p<0.01, ** p<0.05, * p<0.10. N = 492, R² = 0.602, SE: cluster.

**What price adjustment changes.** `region_northeast`, `region_west` pass the bootstrap on nominal pay but are not significant once pay is deflated by regional price parities (clustered p 0.669, clustered p 0.144).
That is consistent with the nominal Northeast premium reflecting price levels rather than real pay.
Conversely, `skill_ml_ai` (+0.105, clustered p 0.002), `family_ai_ml` (+0.090, clustered p 0.007) reach clustered significance only in real terms. No bootstrap is run on this model, so under the pre-registered procedure they are not a finding.

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

Surviving at the 5% level: `seniority_rank` (p = 0.000), `yrs_exp_min` (p = 0.000), `yrs_exp_stated` (p = 0.024), `degree_stem` (p = 0.031), `skill_cloud` (p = 0.001), `region_northeast` (p = 0.014), `region_west` (p = 0.011).

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
re-estimated on the 490 observations that do resolve to a state, across
89 employers.

**`skill_ml_ai`, `family_ai_ml` change verdict** at the 5% level and are
reported as inconclusive.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.1045 | 0.000 | 0.1108 | 0.001 |
| `yrs_exp_min` | 0.0260 | 0.000 | 0.0239 | 0.001 |
| `yrs_exp_stated` | -0.0729 | 0.024 | -0.0667 | 0.040 |
| `degree_required` | -0.0560 | 0.057 | -0.0516 | 0.086 |
| `degree_stem` | 0.0508 | 0.031 | 0.0603 | 0.014 |
| `skill_cloud` | 0.1133 | 0.001 | 0.0970 | 0.003 |
| `skill_ml_ai` | 0.0919 | 0.072 | 0.1131 | 0.012 |
| `remote_eligible` | 0.0141 | 0.693 | 0.0247 | 0.577 |
| `hourly_original` | -0.0239 | 0.647 | -0.0183 | 0.709 |
| `mandate_state` | 0.0090 | 0.785 | 0.0013 | 0.973 |
| `region_northeast` | 0.0869 | 0.014 | 0.0819 | 0.015 |
| `region_south` | 0.0743 | 0.194 | 0.0629 | 0.242 |
| `region_west` | 0.1268 | 0.011 | 0.1246 | 0.020 |
| `industry_data_center` | 0.1009 | 0.599 | 0.0858 | 0.663 |
| `family_ai_ml` | 0.0847 | 0.051 | 0.0885 | 0.032 |

This check is reported whichever way it comes out. It confirmed `seniority_rank`, `yrs_exp_min`, `yrs_exp_stated`, `degree_stem`, `skill_cloud`, `region_northeast`, `region_west` and withdrew `skill_ml_ai`, `family_ai_ml`.

### Robustness: without the largest employer

The largest employer, Crusoe, supplies 49 observations. The core model is re-estimated without it, on 487 observations across 98 employers, with the same bootstrap at 1,999 replications (as for the region check), so a p-value within about 0.01 of 0.05 is on the line. Pre-registration section 7 treats one employer carrying a result as a threat regardless of N.

| Variable | Bootstrap p (full) | Coef (without) | Bootstrap p (without) |
|---|---|---|---|
| `seniority_rank` | 0.000 | 0.1012 | 0.001 |
| `yrs_exp_min` | 0.000 | 0.0272 | 0.001 |
| `yrs_exp_stated` | 0.024 | -0.0807 | 0.029 |
| `degree_required` | 0.057 | -0.0495 | 0.126 |
| `degree_stem` | 0.031 | 0.0468 | 0.081 |
| `skill_cloud` | 0.001 | 0.1259 | 0.003 |
| `skill_ml_ai` | 0.072 | 0.0590 | 0.230 |
| `remote_eligible` | 0.693 | 0.0306 | 0.445 |
| `hourly_original` | 0.647 | -0.0290 | 0.597 |
| `mandate_state` | 0.785 | 0.0065 | 0.820 |
| `region_northeast` | 0.014 | 0.0854 | 0.024 |
| `region_south` | 0.194 | 0.0917 | 0.098 |
| `region_west` | 0.011 | 0.1219 | 0.015 |
| `industry_data_center` | 0.599 | -0.0514 | 0.394 |
| `family_ai_ml` | 0.051 | 0.0941 | 0.065 |

Verdicts that change at the 5% level: `degree_stem`.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **80** postings from
**36** employers, estimated above.
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
| H2 | A mandate raises disclosure | + | 91.2% vs 47.6% — **supported**, descriptively |
| H6 | Mandate states advertise wider ranges | + | narrower (-0.072 log points), p = 0.410 clustered, no bootstrap on this model — inconclusive |

**H5 is inconclusive, and it was nearly reported as contradicted.**
The point estimate is negative — a stated degree requirement sits
alongside *lower* advertised pay, conditional on seniority — and under
clustered standard errors that reads p = 0.039,
comfortably significant and opposite to the prediction. The wild
cluster bootstrap puts it at p = 0.057. So the sign is worth
recording and the finding is not: at this cluster count the data
cannot distinguish the negative coefficient from zero. It is reported
because it was predicted the other way, and because the asymptotic
and bootstrap procedures disagree about it, which is precisely the
case the pre-registration anticipated.

### Who discloses pay

Disclosure rate **74.4%** (536 disclosed, 184 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 3.392 | 3.429 | -0.038 | 0.7697 |
| `yrs_exp_min` | 2.319 | 2.348 | -0.029 | 0.9116 |
| `yrs_exp_stated` | 0.479 | 0.571 | -0.091 | 0.0326 |
| `degree_required` | 0.61 | 0.522 | 0.088 | 0.0386 |
| `degree_stem` | 0.41 | 0.364 | 0.046 | 0.2646 |
| `skill_cloud` | 0.213 | 0.109 | 0.104 | 0.0004 |
| `skill_ml_ai` | 0.362 | 0.272 | 0.09 | 0.021 |
| `remote_eligible` | 0.166 | 0.114 | 0.052 | 0.0692 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.754 | 0.212 | 0.542 | 0.0 |
| `region_northeast` | 0.218 | 0.147 | 0.072 | 0.0245 |
| `region_south` | 0.142 | 0.587 | -0.445 | 0.0 |
| `region_west` | 0.401 | 0.082 | 0.32 | 0.0 |
| `industry_data_center` | 0.14 | 0.179 | -0.039 | 0.2201 |
| `family_ai_ml` | 0.101 | 0.087 | 0.014 | 0.5748 |
| `metro_indianapolis` | 0.006 | 0.043 | -0.038 | 0.0149 |

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
   re-estimate (N = 492) is in section 5; its note says which
   verdicts depend on nominal pay.
5. **Few employer clusters.** 99 employers, the largest supplying 9.1% of observations.
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

Across 536 postings from 99 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 91% of postings
state one. Where no such requirement exists, 48% do. The
contrast is associational: the employers operating in mandate
states may differ in ways that produce some or all of it, and a
single cross-section cannot separate that from the law.

Within the postings that do disclose, seniority is the dominant
predictor and the most precisely estimated, which is what the
pre-registration expected.
The prediction that a stated degree requirement would raise pay
is not supported: the estimate is -0.056 (the wrong sign),
indistinguishable from zero at bootstrap p = 0.06.

The result a reader should treat most cautiously is any coefficient in
the pay models, because that sample is selected on the dependent
variable wherever disclosure is voluntary. The result a reader should
treat most seriously is the disclosure contrast, because it is measured
on the full sample and does not depend on pay being observed.

What would most improve this study is **more employers, not more
postings**. Every pre-registered condition passes (99 employer
clusters against 30; the largest employer supplies 9.1%
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

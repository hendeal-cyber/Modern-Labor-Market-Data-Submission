# Determinants of Advertised Pay in the US Energy and Data Center Sector
## Evidence from employer-published job postings

*Built from data collected through 2026-09-30. Collection cycles: 7.*

## Executive summary

This study asks what attributes stated in a job posting predict the pay an
employer advertises, across the United States energy and data center sector.
Postings are collected from the public applicant tracking system APIs that
employers publish through — the upstream source for the job boards those
postings appear on.

**The clearest result concerns disclosure rather than level.** Pay is
stated in **91.3%** of postings in states with a posting-level
pay-transparency mandate, against **47.5%** where there is none —
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
conventional significance under the wild cluster bootstrap are seniority, required experience, a stated cloud skill, a West location, a Northeast location, stating an experience minimum and a STEM degree.
Read a West location, a Northeast location, stating an experience minimum and a STEM degree as **tentative**: each passes both checks with a p-value above 0.02 on
at least one, and verdicts this close to 0.05 have moved between collection runs.
A stated cloud skill carried no directional prediction in the pre-registration, so it is reported as exploratory.
A Northeast location and a West location do not survive adjusting pay for regional price levels (section 5).
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
| Retrieved from ATS boards | 17,495 |
| Passed role, seniority and internship screens | 4,395 |
| In the US, with a resolvable state or nationwide-remote | 3,427 |
| Unique after de-duplication | 729 |
| With a disclosed pay range (estimation sample) | 543 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 6,255 |
| `role_excluded` | 4,238 |
| `no_sector_evidence_in_posting` | 1,713 |
| `internship` | 760 |
| `no_us_state` | 572 |
| `other_group_company` | 435 |
| `non_us` | 396 |

Distinct employers contributing a disclosed range: **100**. Disclosed ranges by metro: outside the named metros 188, bay area 98, denver 65, remote national 47, chicago 43, boston 30, northern virginia 19, new york 19, los angeles 15, seattle 10, minneapolis 6, indianapolis 3.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Twelve rounds of hand-auditing are recorded in `docs/audit-log.md`.
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
| 12 | Runs 32 (the 29 Sep cron, 6.5 hours late) and 34 (30 Sep, the last collection) | A lawyer admitted on "commercial development" (Bloom Energy). A pre-registered robustness check, the pay model without federal rows, computed on every run but reported nowhere; in the final data it changes a verdict. Two generated sentences overstated: a list of survivors cut at four, and a control variable described as contradicting a prediction it never had |

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

Advertised pay in the estimation sample averages **$151,839** (median $144,360, SD $50,497, range $65,000–$365,000).

At N = 543 with 15 regressors, the smallest
detectable standardized effect is **0.122**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 91.3% | 449 |
| no mandate state | 47.5% | 280 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered; 14% of postings list more than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The gap is cut three ways rather than quoted once, because it was
once sensitive to a single jurisdiction:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 91.3% (n=449) | 47.5% (n=280) | 44pp |
| Excluding Virginia | 92.7% (n=411) | 47.5% (n=280) | 45pp |
| Excluding the largest employer | 90.3% (n=402) | 47.1% (n=278) | 43pp |

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
| `const` | 11.3343*** | 0.0446 | 0.000 | — | [11.247, 11.422] | — |
| `seniority_rank` | 0.1059*** | 0.0079 | 0.000 | **0.000** | [0.090, 0.121] | 11.2% |
| `yrs_exp_min` | 0.0252*** | 0.0043 | 0.000 | **0.000** | [0.017, 0.034] | 2.5% |
| `yrs_exp_stated` | -0.0727** | 0.0313 | 0.020 | **0.023** | [-0.134, -0.011] | -7.0% |
| `degree_required` | -0.0517* | 0.0270 | 0.055 | **0.074** | [-0.105, 0.001] | -5.0% |
| `degree_stem` | 0.0496** | 0.0230 | 0.031 | **0.043** | [0.005, 0.095] | 5.1% |
| `skill_cloud` | 0.1181*** | 0.0328 | 0.000 | **0.001** | [0.054, 0.182] | 12.5% |
| `skill_ml_ai` | 0.0931* | 0.0437 | 0.033 | **0.074** | [0.007, 0.179] | 9.8% |
| `remote_eligible` | 0.0100 | 0.0344 | 0.772 | **0.787** | [-0.057, 0.077] | 1.0% |
| `hourly_original` | -0.0252 | 0.0407 | 0.535 | **0.644** | [-0.105, 0.054] | -2.5% |
| `mandate_state` | 0.0106 | 0.0307 | 0.730 | **0.744** | [-0.050, 0.071] | 1.1% |
| `region_northeast` | 0.0851** | 0.0307 | 0.005 | **0.019** | [0.025, 0.145] | 8.9% |
| `region_south` | 0.0792 | 0.0426 | 0.063 | **0.154** | [-0.004, 0.163] | 8.2% |
| `region_west` | 0.1269** | 0.0391 | 0.001 | **0.011** | [0.050, 0.203] | 13.5% |
| `industry_data_center` | 0.0983 | 0.0700 | 0.160 | **0.584** | [-0.039, 0.235] | 10.3% |
| `family_ai_ml` | 0.0765* | 0.0386 | 0.048 | **0.083** | [0.001, 0.152] | 8.0% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 543, R² = 0.589, SE: cluster.

### Extended model

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4769*** | 0.0436 | 0.000 | [11.391, 11.562] | — |
| `seniority_rank` | 0.0852*** | 0.0083 | 0.000 | [0.069, 0.101] | 8.9% |
| `yrs_exp_min` | 0.0222*** | 0.0033 | 0.000 | [0.016, 0.029] | 2.2% |
| `yrs_exp_stated` | -0.0659** | 0.0259 | 0.011 | [-0.117, -0.015] | -6.4% |
| `degree_required` | -0.0367* | 0.0221 | 0.097 | [-0.080, 0.007] | -3.6% |
| `degree_stem` | 0.0683*** | 0.0220 | 0.002 | [0.025, 0.112] | 7.1% |
| `skill_cloud` | 0.0937*** | 0.0314 | 0.003 | [0.032, 0.155] | 9.8% |
| `skill_ml_ai` | 0.0859** | 0.0438 | 0.050 | [0.000, 0.172] | 9.0% |
| `remote_eligible` | 0.0107 | 0.0296 | 0.718 | [-0.047, 0.069] | 1.1% |
| `hourly_original` | 0.1573*** | 0.0508 | 0.002 | [0.058, 0.257] | 17.0% |
| `mandate_state` | 0.0157 | 0.0388 | 0.685 | [-0.060, 0.092] | 1.6% |
| `region_northeast` | 0.0604** | 0.0280 | 0.031 | [0.005, 0.115] | 6.2% |
| `region_south` | 0.0854* | 0.0450 | 0.057 | [-0.003, 0.174] | 8.9% |
| `region_west` | 0.0916*** | 0.0355 | 0.010 | [0.022, 0.161] | 9.6% |
| `industry_data_center` | 0.0972 | 0.0597 | 0.103 | [-0.020, 0.214] | 10.2% |
| `family_ai_ml` | 0.0811* | 0.0418 | 0.052 | [-0.001, 0.163] | 8.4% |
| `advanced_degree_pref` | 0.0643*** | 0.0227 | 0.005 | [0.020, 0.109] | 6.6% |
| `soft_leadership` | 0.0540** | 0.0229 | 0.018 | [0.009, 0.099] | 5.5% |
| `job_level` | -0.0888*** | 0.0130 | 0.000 | [-0.114, -0.063] | -8.5% |
| `study_metro` | 0.0348 | 0.0353 | 0.325 | [-0.035, 0.104] | 3.5% |
| `prior_internship_req` | -0.1847** | 0.0783 | 0.018 | [-0.338, -0.031] | -16.9% |
| `certification_req` | -0.0282 | 0.0354 | 0.426 | [-0.098, 0.041] | -2.8% |
| `skill_python_r` | -0.0014 | 0.0235 | 0.953 | [-0.047, 0.045] | -0.1% |
| `skill_sql` | -0.0186 | 0.0262 | 0.478 | [-0.070, 0.033] | -1.8% |
| `skill_viz_bi` | -0.0224 | 0.0233 | 0.336 | [-0.068, 0.023] | -2.2% |
| `skill_big_data` | -0.0456 | 0.0336 | 0.175 | [-0.111, 0.020] | -4.5% |
| `soft_teamwork` | -0.0661*** | 0.0212 | 0.002 | [-0.108, -0.025] | -6.4% |
| `soft_communication` | -0.0262 | 0.0224 | 0.244 | [-0.070, 0.018] | -2.6% |

*** p<0.01, ** p<0.05, * p<0.10. N = 543, R² = 0.669, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 9.7335*** | 0.1575 | 0.000 | [9.425, 10.042] | — |
| `seniority_rank` | 0.0966*** | 0.0212 | 0.000 | [0.055, 0.138] | 10.1% |
| `yrs_exp_min` | 0.0296*** | 0.0097 | 0.002 | [0.011, 0.049] | 3.0% |
| `yrs_exp_stated` | -0.1237 | 0.0816 | 0.130 | [-0.284, 0.036] | -11.6% |
| `degree_required` | 0.0470 | 0.0817 | 0.565 | [-0.113, 0.207] | 4.8% |
| `degree_stem` | 0.2557*** | 0.0652 | 0.000 | [0.128, 0.383] | 29.1% |
| `skill_cloud` | 0.0048 | 0.0744 | 0.949 | [-0.141, 0.151] | 0.5% |
| `skill_ml_ai` | 0.2422** | 0.1217 | 0.046 | [0.004, 0.481] | 27.4% |
| `remote_eligible` | 0.0074 | 0.1148 | 0.949 | [-0.218, 0.232] | 0.7% |
| `hourly_original` | 0.0714 | 0.1047 | 0.495 | [-0.134, 0.277] | 7.4% |
| `mandate_state` | -0.0598 | 0.0881 | 0.497 | [-0.233, 0.113] | -5.8% |
| `region_northeast` | 0.0617 | 0.2434 | 0.800 | [-0.415, 0.539] | 6.4% |
| `region_south` | 0.3078*** | 0.1146 | 0.007 | [0.083, 0.532] | 36.0% |
| `region_west` | 0.4201*** | 0.0894 | 0.000 | [0.245, 0.595] | 52.2% |
| `industry_data_center` | -0.4708*** | 0.1605 | 0.003 | [-0.785, -0.156] | -37.5% |
| `family_ai_ml` | 0.1084 | 0.1341 | 0.419 | [-0.154, 0.371] | 11.4% |

*** p<0.01, ** p<0.05, * p<0.10. N = 538, R² = 0.290, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.6380*** | 0.0993 | 0.000 | [0.443, 0.833] | — |
| `mandate_state` | 0.3876*** | 0.0895 | 0.000 | [0.212, 0.563] | 47.3% |
| `seniority_rank` | -0.0019 | 0.0116 | 0.869 | [-0.025, 0.021] | -0.2% |
| `remote_eligible` | 0.0825 | 0.0748 | 0.271 | [-0.064, 0.229] | 8.6% |
| `industry_data_center` | -0.0715 | 0.0973 | 0.463 | [-0.262, 0.119] | -6.9% |
| `region_northeast` | -0.1313 | 0.0958 | 0.170 | [-0.319, 0.056] | -12.3% |
| `region_south` | -0.3278*** | 0.0993 | 0.001 | [-0.522, -0.133] | -27.9% |
| `region_west` | -0.0545 | 0.0739 | 0.461 | [-0.199, 0.090] | -5.3% |

*** p<0.01, ** p<0.05, * p<0.10. N = 729, R² = 0.335, SE: cluster.

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
| `const` | 11.3938*** | 0.0443 | 0.000 | [11.307, 11.481] | — |
| `seniority_rank` | 0.1109*** | 0.0071 | 0.000 | [0.097, 0.125] | 11.7% |
| `yrs_exp_min` | 0.0238*** | 0.0040 | 0.000 | [0.016, 0.032] | 2.4% |
| `yrs_exp_stated` | -0.0733** | 0.0308 | 0.017 | [-0.134, -0.013] | -7.1% |
| `degree_required` | -0.0416 | 0.0263 | 0.114 | [-0.093, 0.010] | -4.1% |
| `degree_stem` | 0.0487** | 0.0233 | 0.036 | [0.003, 0.094] | 5.0% |
| `skill_cloud` | 0.0923*** | 0.0270 | 0.001 | [0.039, 0.145] | 9.7% |
| `skill_ml_ai` | 0.1050*** | 0.0340 | 0.002 | [0.038, 0.172] | 11.1% |
| `remote_eligible` | 0.0070 | 0.0354 | 0.844 | [-0.062, 0.076] | 0.7% |
| `hourly_original` | -0.0630* | 0.0370 | 0.088 | [-0.136, 0.009] | -6.1% |
| `mandate_state` | -0.0572* | 0.0333 | 0.086 | [-0.122, 0.008] | -5.6% |
| `region_northeast` | 0.0116 | 0.0308 | 0.706 | [-0.049, 0.072] | 1.2% |
| `region_south` | 0.0402 | 0.0393 | 0.306 | [-0.037, 0.117] | 4.1% |
| `region_west` | 0.0515 | 0.0357 | 0.149 | [-0.018, 0.121] | 5.3% |
| `industry_data_center` | 0.0796 | 0.0637 | 0.212 | [-0.045, 0.204] | 8.3% |
| `family_ai_ml` | 0.0820** | 0.0348 | 0.019 | [0.014, 0.150] | 8.5% |

*** p<0.01, ** p<0.05, * p<0.10. N = 498, R² = 0.598, SE: cluster.

**What price adjustment changes.** `region_northeast`, `region_west` pass the bootstrap on nominal pay but are not significant once pay is deflated by regional price parities (clustered p 0.706, clustered p 0.149).
That is consistent with the nominal Northeast premium reflecting price levels rather than real pay.
Conversely, `skill_ml_ai` (+0.105, clustered p 0.002), `family_ai_ml` (+0.082, clustered p 0.019) reach clustered significance only in real terms. No bootstrap is run on this model, so under the pre-registered procedure they are not a finding.

### Inference: the wild cluster bootstrap

With 100 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim below thirty clusters, a line this sample clears only narrowly. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

**2 of the 9 coefficients significant
at the 5% level under clustered standard errors do not survive the
bootstrap:** `skill_ml_ai`, `family_ai_ml`.

This is the correction the pre-registered procedure exists to make.
Nothing about the point estimates changed; what changed is the
reference distribution the estimates are judged against, and at
100 clusters the asymptotic one is simply the
wrong yardstick. The coefficients concerned are reported below as
inconclusive rather than deleted, because an underpowered null is
not the same finding as a measured zero.

Surviving at the 5% level: `seniority_rank` (p = 0.000), `yrs_exp_min` (p = 0.000), `yrs_exp_stated` (p = 0.023), `degree_stem` (p = 0.043), `skill_cloud` (p = 0.001), `region_northeast` (p = 0.019), `region_west` (p = 0.011).

Monte Carlo error is small relative to the decisions being read off
these numbers: at 9999 replications every
p-value above is stable to within about 0.005 across seeds. An earlier
run at 999 replications returned 0.049, 0.063 and 0.082 for
`degree_required` on three different seeds, straddling the very
threshold its verdict is read from, which is why the replication count
is what it is.

### Robustness: the nationwide-remote postings

47 postings are advertised as nationwide remote and resolve to no state,
so all three census-region dummies are zero for them and they fall into the
**Midwest reference category without being Midwest**. The model is therefore
re-estimated on the 496 observations that do resolve to a state, across
90 employers.

**`skill_ml_ai` change verdict** at the 5% level and are
reported as inconclusive.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.1059 | 0.000 | 0.1122 | 0.001 |
| `yrs_exp_min` | 0.0252 | 0.000 | 0.0231 | 0.001 |
| `yrs_exp_stated` | -0.0727 | 0.023 | -0.0676 | 0.039 |
| `degree_required` | -0.0517 | 0.074 | -0.0475 | 0.104 |
| `degree_stem` | 0.0496 | 0.043 | 0.0584 | 0.028 |
| `skill_cloud` | 0.1181 | 0.001 | 0.1017 | 0.003 |
| `skill_ml_ai` | 0.0931 | 0.074 | 0.1136 | 0.011 |
| `remote_eligible` | 0.0100 | 0.787 | 0.0189 | 0.675 |
| `hourly_original` | -0.0252 | 0.644 | -0.0213 | 0.684 |
| `mandate_state` | 0.0106 | 0.744 | 0.0033 | 0.923 |
| `region_northeast` | 0.0851 | 0.019 | 0.0803 | 0.023 |
| `region_south` | 0.0792 | 0.154 | 0.0686 | 0.189 |
| `region_west` | 0.1269 | 0.011 | 0.1262 | 0.022 |
| `industry_data_center` | 0.0983 | 0.584 | 0.0832 | 0.677 |
| `family_ai_ml` | 0.0765 | 0.083 | 0.0795 | 0.070 |

This check is reported whichever way it comes out. It confirmed `seniority_rank`, `yrs_exp_min`, `yrs_exp_stated`, `degree_stem`, `skill_cloud`, `region_northeast`, `region_west` and withdrew `skill_ml_ai`.

### Robustness: without the largest employer

The largest employer, Crusoe, supplies 49 observations. The core model is re-estimated without it, on 494 observations across 99 employers, with the same bootstrap at 1,999 replications (as for the region check), so a p-value within about 0.01 of 0.05 is on the line. Pre-registration section 7 treats one employer carrying a result as a threat regardless of N.

| Variable | Bootstrap p (full) | Coef (without) | Bootstrap p (without) |
|---|---|---|---|
| `seniority_rank` | 0.000 | 0.1027 | 0.001 |
| `yrs_exp_min` | 0.000 | 0.0265 | 0.001 |
| `yrs_exp_stated` | 0.023 | -0.0800 | 0.033 |
| `degree_required` | 0.074 | -0.0456 | 0.156 |
| `degree_stem` | 0.043 | 0.0457 | 0.086 |
| `skill_cloud` | 0.001 | 0.1310 | 0.002 |
| `skill_ml_ai` | 0.074 | 0.0588 | 0.207 |
| `remote_eligible` | 0.787 | 0.0263 | 0.507 |
| `hourly_original` | 0.644 | -0.0302 | 0.623 |
| `mandate_state` | 0.744 | 0.0082 | 0.811 |
| `region_northeast` | 0.019 | 0.0838 | 0.031 |
| `region_south` | 0.154 | 0.0963 | 0.072 |
| `region_west` | 0.011 | 0.1221 | 0.012 |
| `industry_data_center` | 0.584 | -0.0529 | 0.365 |
| `family_ai_ml` | 0.083 | 0.0858 | 0.087 |

Verdicts that change at the 5% level: `degree_stem`.

### Robustness: without the federal employers

Federal postings (Bonneville Power Administration, Western Area Power Administration) are set by a separate pay regime, the GS and agency pay plans, and always state pay. They supply 3 observations. The core model is re-estimated without them, on 540 observations across 98 employers, with the same bootstrap as the check above.

| Variable | Bootstrap p (full) | Coef (without) | Bootstrap p (without) |
|---|---|---|---|
| `seniority_rank` | 0.000 | 0.1060 | 0.001 |
| `yrs_exp_min` | 0.000 | 0.0252 | 0.001 |
| `yrs_exp_stated` | 0.023 | -0.0722 | 0.030 |
| `degree_required` | 0.074 | -0.0510 | 0.078 |
| `degree_stem` | 0.043 | 0.0499 | 0.051 |
| `skill_cloud` | 0.001 | 0.1188 | 0.001 |
| `skill_ml_ai` | 0.074 | 0.0926 | 0.069 |
| `remote_eligible` | 0.787 | 0.0139 | 0.719 |
| `hourly_original` | 0.644 | -0.0236 | 0.661 |
| `mandate_state` | 0.744 | 0.0131 | 0.692 |
| `region_northeast` | 0.019 | 0.0851 | 0.018 |
| `region_south` | 0.154 | 0.0799 | 0.141 |
| `region_west` | 0.011 | 0.1253 | 0.015 |
| `industry_data_center` | 0.584 | 0.0993 | 0.589 |
| `family_ai_ml` | 0.083 | 0.0764 | 0.080 |

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
| H2 | A mandate raises disclosure | + | 91.3% vs 47.5% — **supported**, descriptively |
| H6 | Mandate states advertise wider ranges | + | narrower (-0.060 log points), p = 0.497 clustered, no bootstrap on this model — inconclusive |

**H5 is inconclusive, and it was nearly reported as contradicted.**
The point estimate is negative — a stated degree requirement sits
alongside *lower* advertised pay, conditional on seniority — and under
clustered standard errors that reads p = 0.055,
comfortably significant and opposite to the prediction. The wild
cluster bootstrap puts it at p = 0.074. So the sign is worth
recording and the finding is not: at this cluster count the data
cannot distinguish the negative coefficient from zero. It is reported
because it was predicted the other way, and because the asymptotic
and bootstrap procedures disagree about it, which is precisely the
case the pre-registration anticipated.

### Who discloses pay

Disclosure rate **74.5%** (543 disclosed, 186 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 3.403 | 3.419 | -0.016 | 0.8998 |
| `yrs_exp_min` | 2.317 | 2.344 | -0.027 | 0.9153 |
| `yrs_exp_stated` | 0.477 | 0.575 | -0.098 | 0.0205 |
| `degree_required` | 0.606 | 0.522 | 0.084 | 0.0469 |
| `degree_stem` | 0.407 | 0.366 | 0.041 | 0.3159 |
| `skill_cloud` | 0.21 | 0.108 | 0.102 | 0.0004 |
| `skill_ml_ai` | 0.359 | 0.274 | 0.085 | 0.029 |
| `remote_eligible` | 0.168 | 0.113 | 0.055 | 0.0538 |
| `hourly_original` | 0.004 | 0.0 | 0.004 | 0.1575 |
| `mandate_state` | 0.755 | 0.21 | 0.545 | 0.0 |
| `region_northeast` | 0.217 | 0.145 | 0.072 | 0.022 |
| `region_south` | 0.144 | 0.581 | -0.437 | 0.0 |
| `region_west` | 0.401 | 0.081 | 0.321 | 0.0 |
| `industry_data_center` | 0.14 | 0.183 | -0.043 | 0.1829 |
| `family_ai_ml` | 0.101 | 0.086 | 0.015 | 0.5311 |
| `metro_indianapolis` | 0.006 | 0.043 | -0.037 | 0.0148 |

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
   re-estimate (N = 498) is in section 5; its note says which
   verdicts depend on nominal pay.
5. **Few employer clusters.** 100 employers, the largest supplying 9.0% of observations.
   Cluster-robust errors under-cover with few clusters, measured at 92%
   against a nominal 95% and over-rejecting a cluster-level placebo at 9.5%
   against 5%. Every significance claim in section 5 is therefore read off
   the wild cluster bootstrap, under which 2 of the 9 coefficients that clustered errors call significant become inconclusive.
6. The scope **widened five times in response to the data**. The
   specification was pre-registered before the national sample was
   collected; amendments after that point are dated in
   `docs/pre-registration.md` section 8.
7. Exelon, ComEd, Constellation and Citizens Energy are **absent**, all on
   iCIMS, verified closed rather than assumed.

## 7. Conclusion

Across 543 postings from 100 employers in the US energy and
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
is not supported: the estimate is -0.052 (the wrong sign),
indistinguishable from zero at bootstrap p = 0.07.

The result a reader should treat most cautiously is any coefficient in
the pay models, because that sample is selected on the dependent
variable wherever disclosure is voluntary. The result a reader should
treat most seriously is the disclosure contrast, because it is measured
on the full sample and does not depend on pay being observed.

What would most improve this study is **more employers, not more
postings**. Every pre-registered condition passes (100 employer
clusters against 30; the largest employer supplies 9.0%
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

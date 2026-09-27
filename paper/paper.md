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
stated in **93.5%** of postings in states with a posting-level
pay-transparency mandate, against **50.0%** where there is none —
a gap of **44 percentage points**. The
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
conventional significance under the wild cluster bootstrap are seniority, a stated cloud skill and Northeast location.
Read Northeast location as **tentative**: it passes both checks with a p-value above 0.02 on
at least one, and verdicts this close to 0.05 have moved between collection runs.
A stated cloud skill carried no directional prediction in the pre-registration, so it is reported as exploratory.
Northeast location does not survive adjusting pay for regional price levels (section 5).
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
Of the in-scope postings, 19% list more than one location, so the choice is not cosmetic.

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
| Retrieved from ATS boards | 3,973 |
| Passed role, seniority and internship screens | 1,320 |
| In the US, with a resolvable state or nationwide-remote | 1,025 |
| Unique after de-duplication | 353 |
| With a disclosed pay range (estimation sample) | 264 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_excluded` | 798 |
| `role_not_software_data` | 786 |
| `no_sector_evidence_in_posting` | 683 |
| `other_group_company` | 264 |
| `internship` | 157 |
| `non_us` | 152 |
| `no_us_state` | 143 |

Distinct employers contributing a disclosed range: **36**. Disclosed ranges by metro: outside the named metros 109, chicago 38, denver 37, boston 23, northern virginia 15, remote national 12, new york 10, bay area 7, minneapolis 5, indianapolis 4, seattle 3, los angeles 1.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

Eight rounds of hand-auditing are recorded in `docs/audit-log.md`.
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

Advertised pay in the estimation sample averages **$132,144** (median $127,500, SD $37,403, range $68,000–$260,000).

At N = 264 with 15 regressors, the smallest
detectable standardized effect is **0.1779**
log points at 5% significance and 80% power.

### Disclosure and pay-transparency mandates

| Posting is in | Share stating pay | Postings |
|---|---|---|
| a mandate state | 93.5% | 201 |
| no mandate state | 50.0% | 152 |

Coverage follows the job's location, so a posting listing any covered
location counts as covered; 19% of postings list more than one, and `states_listed` is retained so the rule can be checked.

**Robustness.** The gap is cut three ways rather than quoted once, because it was
once sensitive to a single jurisdiction:

| Sample | Mandate states | No mandate | Gap |
|---|---|---|---|
| All postings | 93.5% (n=201) | 50.0% (n=152) | 44pp |
| Excluding Virginia | 97.0% (n=169) | 50.0% (n=152) | 47pp |
| Excluding the largest employer | 91.6% (n=154) | 50.0% (n=152) | 42pp |

The gap is large under every cut and stable across them, a spread of 5 points. An earlier version of this study reported it swinging from 50 to 71 points and sensitive to Virginia alone; that sensitivity was an artifact of including a federal consultancy's public health, national security and law-enforcement postings, removed in audit round 4 as outside the sector under study.

Only **13** postings covered by a mandate fail to state pay.
8 of them list Virginia, whose mandate took effect on 1 July 2026 and is
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
| `const` | 11.3213*** | 0.0351 | 0.000 | — | [11.252, 11.390] | — |
| `seniority_rank` | 0.1123*** | 0.0076 | 0.000 | **0.000** | [0.098, 0.127] | 11.9% |
| `yrs_exp_min` | 0.0146 | 0.0087 | 0.093 | **0.246** | [-0.002, 0.032] | 1.5% |
| `yrs_exp_stated` | -0.0210 | 0.0386 | 0.587 | **0.589** | [-0.097, 0.055] | -2.1% |
| `degree_required` | 0.0033 | 0.0329 | 0.921 | **0.924** | [-0.061, 0.068] | 0.3% |
| `degree_stem` | 0.0135 | 0.0302 | 0.654 | **0.664** | [-0.046, 0.073] | 1.4% |
| `skill_cloud` | 0.1480*** | 0.0327 | 0.000 | **0.002** | [0.084, 0.212] | 16.0% |
| `skill_ml_ai` | 0.0149 | 0.0373 | 0.689 | **0.702** | [-0.058, 0.088] | 1.5% |
| `remote_eligible` | 0.0573* | 0.0314 | 0.068 | **0.087** | [-0.004, 0.119] | 5.9% |
| `hourly_original` | 0.0662 | 0.0312 | 0.034 | **0.271** | [0.005, 0.127] | 6.8% |
| `mandate_state` | -0.0322 | 0.0283 | 0.255 | **0.285** | [-0.088, 0.023] | -3.2% |
| `region_northeast` | 0.1067** | 0.0364 | 0.003 | **0.010** | [0.035, 0.178] | 11.3% |
| `region_south` | 0.0818 | 0.0405 | 0.043 | **0.150** | [0.002, 0.161] | 8.5% |
| `region_west` | 0.0414 | 0.0348 | 0.234 | **0.207** | [-0.027, 0.110] | 4.2% |
| `industry_data_center` | 0.0107 | 0.0584 | 0.854 | **0.870** | [-0.104, 0.125] | 1.1% |
| `family_ai_ml` | 0.0421 | 0.0505 | 0.405 | **0.458** | [-0.057, 0.141] | 4.3% |

*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** where one is reported. N = 264, R² = 0.543, SE: cluster.

### Secondary: log(range width)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 9.6982*** | 0.1833 | 0.000 | [9.339, 10.057] | — |
| `seniority_rank` | 0.1117*** | 0.0322 | 0.001 | [0.049, 0.175] | 11.8% |
| `yrs_exp_min` | -0.0127 | 0.0273 | 0.642 | [-0.066, 0.041] | -1.3% |
| `yrs_exp_stated` | 0.0464 | 0.1259 | 0.713 | [-0.200, 0.293] | 4.8% |
| `degree_required` | 0.2466 | 0.1504 | 0.101 | [-0.048, 0.541] | 28.0% |
| `degree_stem` | 0.2644** | 0.1070 | 0.013 | [0.055, 0.474] | 30.3% |
| `skill_cloud` | 0.0211 | 0.1235 | 0.864 | [-0.221, 0.263] | 2.1% |
| `skill_ml_ai` | 0.1952 | 0.1377 | 0.156 | [-0.075, 0.465] | 21.6% |
| `remote_eligible` | 0.3145** | 0.1587 | 0.048 | [0.003, 0.626] | 37.0% |
| `hourly_original` | 0.0630 | 0.1621 | 0.697 | [-0.255, 0.381] | 6.5% |
| `mandate_state` | -0.1929* | 0.1123 | 0.086 | [-0.413, 0.027] | -17.6% |
| `region_northeast` | 0.0486 | 0.2521 | 0.847 | [-0.446, 0.543] | 5.0% |
| `region_south` | 0.3125*** | 0.1183 | 0.008 | [0.081, 0.544] | 36.7% |
| `region_west` | 0.3627*** | 0.1229 | 0.003 | [0.122, 0.604] | 43.7% |
| `industry_data_center` | -0.8824*** | 0.2688 | 0.001 | [-1.409, -0.355] | -58.6% |
| `family_ai_ml` | 0.1121 | 0.2482 | 0.651 | [-0.374, 0.599] | 11.9% |

*** p<0.01, ** p<0.05, * p<0.10. N = 259, R² = 0.331, SE: cluster.

### Model 3: pay disclosed (linear probability)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 0.6948*** | 0.1245 | 0.000 | [0.451, 0.939] | — |
| `mandate_state` | 0.3242*** | 0.1138 | 0.004 | [0.101, 0.547] | 38.3% |
| `seniority_rank` | -0.0048 | 0.0141 | 0.733 | [-0.032, 0.023] | -0.5% |
| `remote_eligible` | -0.0465 | 0.1193 | 0.696 | [-0.280, 0.187] | -4.5% |
| `industry_data_center` | -0.1864 | 0.1574 | 0.236 | [-0.495, 0.122] | -17.0% |
| `region_northeast` | -0.0233 | 0.0967 | 0.809 | [-0.213, 0.166] | -2.3% |
| `region_south` | -0.2864** | 0.1365 | 0.036 | [-0.554, -0.019] | -24.9% |
| `region_west` | 0.0019 | 0.0780 | 0.980 | [-0.151, 0.155] | 0.2% |

*** p<0.01, ** p<0.05, * p<0.10. N = 353, R² = 0.357, SE: cluster.

### Model 4: early-career subsample (original question)

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.4171*** | 0.1443 | 0.000 | [11.134, 11.700] | — |
| `seniority_rank` | 0.0771 | 0.0729 | 0.290 | [-0.066, 0.220] | 8.0% |
| `yrs_exp_min` | 0.0009 | 0.0364 | 0.980 | [-0.070, 0.072] | 0.1% |
| `yrs_exp_stated` | 0.0091 | 0.1098 | 0.934 | [-0.206, 0.224] | 0.9% |
| `degree_required` | -0.0235 | 0.0421 | 0.576 | [-0.106, 0.059] | -2.3% |
| `degree_stem` | 0.0696 | 0.0462 | 0.132 | [-0.021, 0.160] | 7.2% |
| `skill_cloud` | 0.3643* | 0.1928 | 0.059 | [-0.014, 0.742] | 44.0% |
| `skill_ml_ai` | -0.1510 | 0.1428 | 0.291 | [-0.431, 0.129] | -14.0% |
| `remote_eligible` | -0.0339 | 0.0651 | 0.602 | [-0.162, 0.094] | -3.3% |
| `mandate_state` | 0.0363 | 0.0805 | 0.652 | [-0.121, 0.194] | 3.7% |
| `region_northeast` | -0.0474 | 0.0707 | 0.503 | [-0.186, 0.091] | -4.6% |
| `region_south` | -0.0375 | 0.1063 | 0.725 | [-0.246, 0.171] | -3.7% |
| `region_west` | 0.0443 | 0.0707 | 0.531 | [-0.094, 0.183] | 4.5% |
| `industry_data_center` | -0.1083 | 0.0743 | 0.145 | [-0.254, 0.037] | -10.3% |
| `family_ai_ml` | 0.5449*** | 0.1672 | 0.001 | [0.217, 0.873] | 72.5% |

*** p<0.01, ** p<0.05, * p<0.10. N = 55, R² = 0.477, SE: cluster.

### Robustness: log(pay), BEA price-adjusted

| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |
|---|---|---|---|---|---|
| `const` | 11.3891*** | 0.0439 | 0.000 | [11.303, 11.475] | — |
| `seniority_rank` | 0.1132*** | 0.0071 | 0.000 | [0.099, 0.127] | 12.0% |
| `yrs_exp_min` | 0.0159* | 0.0084 | 0.059 | [-0.001, 0.033] | 1.6% |
| `yrs_exp_stated` | -0.0193 | 0.0398 | 0.627 | [-0.097, 0.059] | -1.9% |
| `degree_required` | -0.0029 | 0.0349 | 0.933 | [-0.071, 0.065] | -0.3% |
| `degree_stem` | 0.0194 | 0.0329 | 0.556 | [-0.045, 0.084] | 2.0% |
| `skill_cloud` | 0.1508*** | 0.0327 | 0.000 | [0.087, 0.215] | 16.3% |
| `skill_ml_ai` | -0.0088 | 0.0330 | 0.790 | [-0.073, 0.056] | -0.9% |
| `remote_eligible` | 0.0595* | 0.0332 | 0.073 | [-0.006, 0.124] | 6.1% |
| `hourly_original` | 0.0074 | 0.0286 | 0.795 | [-0.049, 0.064] | 0.8% |
| `mandate_state` | -0.0865** | 0.0344 | 0.012 | [-0.154, -0.019] | -8.3% |
| `region_northeast` | 0.0304 | 0.0390 | 0.436 | [-0.046, 0.107] | 3.1% |
| `region_south` | 0.0585 | 0.0404 | 0.148 | [-0.021, 0.138] | 6.0% |
| `region_west` | -0.0135 | 0.0255 | 0.596 | [-0.063, 0.036] | -1.3% |
| `industry_data_center` | -0.0205 | 0.0568 | 0.718 | [-0.132, 0.091] | -2.0% |
| `family_ai_ml` | 0.0742 | 0.0477 | 0.119 | [-0.019, 0.168] | 7.7% |

*** p<0.01, ** p<0.05, * p<0.10. N = 253, R² = 0.548, SE: cluster.

**What price adjustment changes.** `region_northeast` passes the bootstrap on nominal pay but is not significant once pay is deflated by regional price parities (clustered p 0.436).
That is consistent with the nominal Northeast premium reflecting price levels rather than real pay.
Conversely, `mandate_state` (-0.086, clustered p 0.012) reaches clustered significance only in real terms. No bootstrap is run on this model, so under the pre-registered procedure it is not a finding.

### Inference: the wild cluster bootstrap

With 36 employer clusters, the asymptotic
clustered p-values above are anti-conservative, and the
pre-registration requires a wild cluster bootstrap before any
significance claim below thirty clusters, a line this sample clears only narrowly. It is estimated here, not
merely recommended: the restricted (null-imposed) variant of Cameron,
Gelbach and Miller (2008) with Rademacher weights drawn once per
employer, 9999 replications.

**2 of the 5 coefficients significant
at the 5% level under clustered standard errors do not survive the
bootstrap:** `hourly_original`, `region_south`.

This is the correction the pre-registered procedure exists to make.
Nothing about the point estimates changed; what changed is the
reference distribution the estimates are judged against, and at
36 clusters the asymptotic one is simply the
wrong yardstick. The coefficients concerned are reported below as
inconclusive rather than deleted, because an underpowered null is
not the same finding as a measured zero.

Surviving at the 5% level: `seniority_rank` (p = 0.000), `skill_cloud` (p = 0.002), `region_northeast` (p = 0.010).

Monte Carlo error is small relative to the decisions being read off
these numbers: at 9999 replications every
p-value above is stable to within about 0.005 across seeds. An earlier
run at 999 replications returned 0.049, 0.063 and 0.082 for
`degree_required` on three different seeds, straddling the very
threshold its verdict is read from, which is why the replication count
is what it is.

### Robustness: the nationwide-remote postings

12 postings are advertised as nationwide remote and resolve to no state,
so all three census-region dummies are zero for them and they fall into the
**Midwest reference category without being Midwest**. The model is therefore
re-estimated on the 252 observations that do resolve to a state, across
33 employers.

No verdict changes at the 5% level.

| Variable | Coef (full) | Bootstrap p (full) | Coef (resolved) | Bootstrap p (resolved) |
|---|---|---|---|---|
| `seniority_rank` | 0.1123 | 0.000 | 0.1133 | 0.001 |
| `yrs_exp_min` | 0.0146 | 0.246 | 0.0146 | 0.227 |
| `yrs_exp_stated` | -0.0210 | 0.589 | -0.0143 | 0.717 |
| `degree_required` | 0.0033 | 0.924 | -0.0026 | 0.942 |
| `degree_stem` | 0.0135 | 0.664 | 0.0156 | 0.651 |
| `skill_cloud` | 0.1480 | 0.002 | 0.1549 | 0.002 |
| `skill_ml_ai` | 0.0149 | 0.702 | -0.0128 | 0.692 |
| `remote_eligible` | 0.0573 | 0.087 | 0.0716 | 0.101 |
| `hourly_original` | 0.0662 | 0.271 | 0.0660 | 0.283 |
| `mandate_state` | -0.0322 | 0.285 | -0.0305 | 0.355 |
| `region_northeast` | 0.1067 | 0.010 | 0.1038 | 0.041 |
| `region_south` | 0.0818 | 0.150 | 0.0864 | 0.117 |
| `region_west` | 0.0414 | 0.207 | 0.0434 | 0.191 |
| `industry_data_center` | 0.0107 | 0.870 | -0.0204 | 0.768 |
| `family_ai_ml` | 0.0421 | 0.458 | 0.0827 | 0.127 |

This check is reported whichever way it comes out. It confirmed `seniority_rank`, `skill_cloud`, `region_northeast`.

### The early-career question

The study began as a question about early-career pay specifically.
That subsample is **55** postings from
**23** employers, estimated above.
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
| H2 | A mandate raises disclosure | + | 93.5% vs 50.0% — **supported**, descriptively |
| H6 | Mandate states advertise wider ranges | + | narrower (-0.193 log points), p = 0.086 clustered, no bootstrap on this model — inconclusive |

### Who discloses pay

Disclosure rate **74.8%** (264 disclosed, 89 withheld).

| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |
|---|---|---|---|---|
| `seniority_rank` | 3.102 | 3.461 | -0.358 | 0.052 |
| `yrs_exp_min` | 1.428 | 1.742 | -0.314 | 0.3071 |
| `yrs_exp_stated` | 0.371 | 0.483 | -0.112 | 0.0687 |
| `degree_required` | 0.735 | 0.629 | 0.106 | 0.0719 |
| `degree_stem` | 0.307 | 0.404 | -0.098 | 0.1031 |
| `skill_cloud` | 0.121 | 0.079 | 0.043 | 0.2262 |
| `skill_ml_ai` | 0.212 | 0.236 | -0.024 | 0.6462 |
| `remote_eligible` | 0.106 | 0.146 | -0.04 | 0.3444 |
| `hourly_original` | 0.008 | 0.0 | 0.008 | 0.1577 |
| `mandate_state` | 0.712 | 0.146 | 0.566 | 0.0 |
| `region_northeast` | 0.292 | 0.101 | 0.191 | 0.0 |
| `region_south` | 0.163 | 0.64 | -0.478 | 0.0 |
| `region_west` | 0.239 | 0.045 | 0.194 | 0.0 |
| `industry_data_center` | 0.08 | 0.281 | -0.201 | 0.0001 |
| `family_ai_ml` | 0.091 | 0.056 | 0.035 | 0.2528 |
| `metro_indianapolis` | 0.015 | 0.09 | -0.075 | 0.0192 |

## 6. Threats to validity

These are treated at length in `docs/limitations.md`. In short:

1. The outcome is **advertised** pay, not realized pay. Employers may
   negotiate away from the posted range in either direction.
2. **Disclosure is selected.** Where no mandate applies, 50% of postings
   state pay, so every pay coefficient is conditional
   on disclosure. This is the central threat, and it is why the disclosure
   model is a headline result rather than a footnote.
3. The mandate contrast is **associational**. One cross-section admits no
   difference-in-differences.
4. Pay is **nominal** in the headline model. The BEA price-adjusted
   re-estimate (N = 253) is in section 5; its note says which
   verdicts depend on nominal pay.
5. **Few employer clusters.** 36 employers, the largest supplying 17.8% of observations.
   Cluster-robust errors under-cover with few clusters, measured at 92%
   against a nominal 95% and over-rejecting a cluster-level placebo at 9.5%
   against 5%. Every significance claim in section 5 is therefore read off
   the wild cluster bootstrap, under which 2 of the 5 coefficients that clustered errors call significant become inconclusive.
6. The scope **widened four times in response to the data**. The
   specification was pre-registered before the national sample was
   collected; amendments after that point are dated in
   `docs/pre-registration.md` section 8.
7. Exelon, ComEd, Constellation and Citizens Energy are **absent**, all on
   iCIMS, verified closed rather than assumed.

## 7. Conclusion

Across 264 postings from 36 employers in the US energy and
data center sector, the sharpest regularity in the data is not about
the level of pay but about whether pay is named at all. In states
requiring a pay scale in the posting, 94% of postings
state one. Where no such requirement exists, 50% do. The
contrast is associational: the employers operating in mandate
states may differ in ways that produce some or all of it, and a
single cross-section cannot separate that from the law.

Within the postings that do disclose, seniority is the dominant
predictor and the most precisely estimated, which is what the
pre-registration expected.
The prediction that a stated degree requirement would raise pay
is not supported: the estimate is +0.003 (the predicted sign),
indistinguishable from zero at bootstrap p = 0.92.

The result a reader should treat most cautiously is any coefficient in
the pay models, because that sample is selected on the dependent
variable wherever disclosure is voluntary. The result a reader should
treat most seriously is the disclosure contrast, because it is measured
on the full sample and does not depend on pay being observed.

What would most improve this study is **more employers, not more
postings**. Every pre-registered condition passes (36 employer
clusters against 30; the largest employer supplies 17.8%
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

# Pre-registration

**Committed 2026-09-21, before the national collection run.**

This document fixes the specification *before* the data it will be estimated on
exists. It is written because the study's weakest methodological point is that
its scope widened three times in response to what the data showed — honestly
disclosed in `docs/limitations.md`, but a reader is entitled to discount
results chosen after seeing them.

Everything below is committed in advance. Where a later result contradicts it,
the contradiction is reported rather than the specification quietly revised.
Any change made after this commit appears in §8 as a dated amendment with its
reason, so the distinction between what was planned and what was adapted stays
visible in the git history.

---

## 1. Research question

**What attributes stated in a job posting predict the pay the employer
advertises, in the US energy and data center sector?**

Secondary: **does a state pay-transparency mandate change whether pay is
disclosed at all, and the level and width of the range when it is?**

## 2. Population and sampling frame

- **Sector:** energy, utility and data center employers. Enforced by a curated
  employer frame (`config/employers.yaml`, 272 employers across nine industry
  categories) plus a sector-confidence check on any board whose token was not
  hand-verified.
- **Roles:** the energy-analytics core taxonomy — siting and development;
  regulatory, policy and compliance; market, commercial and procurement; grid
  and power systems; AI/ML; GIS; sustainability analytics; software and data.
  Engineering is admitted only where analytics-adjacent (interconnection, grid
  modelling, transmission and resource planning); mechanical, electrical,
  thermal, commissioning and SCADA are excluded, as are technicians, skilled
  trades, corporate back-office, sales and security roles.
- **Geography:** United States only. Non-US postings are excluded — pooling
  currencies and labour markets would be meaningless.
- **Seniority:** all levels **except internships**, which are a different
  contract and pay regime.
- **Time:** the stock of postings open at collection, plus weekly flow.
- **Source:** public, unauthenticated ATS APIs. No authenticated source, no
  scraping of any site whose terms prohibit automated access.

## 3. Dependent variables

| | Definition |
|---|---|
| **Primary** | `log(pay_midpoint)`, the log of the midpoint of the employer-stated range, annualized (hourly × 2,080, flagged) |
| Secondary | `log(pay_min)`, `log(pay_max)`, and **range width** `(max − min) / midpoint` as a measure of employer pay uncertainty |
| Selection | `pay_disclosed` (binary), modelled in its own right |
| Robustness | Price-adjusted pay, deflated by BEA Regional Price Parities |

Postings with no disclosed pay are excluded from the pay models and **retained**
for the disclosure model. This is the selection problem, not a nuisance, and it
is reported as such.

## 4. Pre-specified models

**Model 1 — core pay model.** OLS on `log(pay_midpoint)`, standard errors
clustered by employer.

```
seniority_rank, yrs_exp_min, yrs_exp_stated, degree_required, degree_stem,
skill_cloud, skill_ml_ai, remote_eligible, hourly_original,
mandate_state, census_region (3 dummies), industry_data_center, family_ai_ml
```

`yrs_exp_stated` must always travel with `yrs_exp_min`: postings stating no
minimum are imputed to zero, and without the indicator that imputation is
indistinguishable from a genuine "0 years required".

**Model 2 — extended.** Model 1 plus the remaining coded regressors (skills,
soft skills, benefits, job context, full `role_family` and `industry` sets),
estimated **only if N supports roughly 20 observations per regressor**.

**Model 3 — disclosure.** Linear probability model of `pay_disclosed` on
`mandate_state` plus controls. Reported as a headline result, because national
coverage is what makes it estimable.

**Model 4 — early-career subsample.** Model 1 re-estimated on
`seniority_rank <= 1 OR yrs_exp_min <= 3`. This preserves the study's original
question and is reported whether or not it agrees with the full sample.

**Robustness, all pre-specified:** state fixed effects in place of census
region; price-adjusted DV; employer fixed effects; excluding the largest
employer; range width and floor/ceiling as DVs.

## 5. Hypotheses, directional and committed in advance

| # | Hypothesis | Direction |
|---|---|---|
| H1 | Seniority is the dominant predictor of advertised pay | **+**, largest coefficient |
| H2 | A state pay-transparency mandate raises the probability pay is disclosed | **+**, large |
| H3 | Required years of experience raises pay, conditional on seniority rank | **+** |
| H4 | AI/ML roles carry a premium over other energy-analytics roles | **+** |
| H5 | A required degree raises pay | **+** |
| H6 | Mandate states show **wider** advertised ranges, employers hedging under compulsory disclosure | **+** |
| H7 | Data center operators pay more than utilities for comparable roles | **+** |

H6 is the one I expect to be least sure of, and it is recorded precisely so a
null cannot be quietly dropped.

## 6. Inference and stopping rules

- **Clustered standard errors by employer.** With few clusters these
  under-cover; a simulation in `tests/test_analyze.py` measures 92% coverage
  against a nominal 95% and rejects a cluster-level placebo at 9.5% against a
  nominal 5%. **Wild cluster bootstrap is required before any significance
  claim** when clusters number under 30. Implemented 2026-09-22 — see the
  amendment in §8; before that date it was required here and not computed.
- **Interpretability gate.** `analyze.py` prints an unmissable block whenever
  observations per regressor fall below 10 or clusters below 30. **That block
  is removed only when the data earns it, never to make the paper look
  finished.**
- **No stopping on results.** Collection stops on a fixed schedule, not when
  the numbers look good.
- **Minimum detectable effect** is reported at the realized N alongside every
  model, so a null is distinguishable from an underpowered test.

## 7. What would falsify or embarrass this study

Stated in advance so they cannot be rationalized later:

- If **seniority does not dominate** (H1), the seniority coding is probably
  wrong, not the labour market.
- If **mandate states show no disclosure difference** (H2), either the mandate
  table is wrong or the frame is too tilted toward large multi-state employers
  who disclose everywhere.
- If a **single employer still supplies more than a quarter** of observations,
  clustered errors remain unreliable and the model substantially describes one
  firm, regardless of N.
- If **N ≥ 100 is reached but distinct employers stay under 30**, the floor has
  been met in letter and not in substance. Both numbers get reported together,
  always.

## 8. Amendments after this commit

### 2026-09-21 — `mandate_state` computed from any listed location

**What changed.** `mandate_state` was derived from the posting's first-listed
state. It is now 1 if **any** location the posting lists is in a mandate state.

**Why.** A pay-transparency law attaches to the job's location, so a posting
naming several places is covered if any one of them is covered. Taking the
first-listed state was arbitrary: 23% of rows list more than one location, and
`state` and `metro` were being selected by different rules, so they routinely
disagreed (`state=UT, metro=indianapolis`).

**Was it prompted by seeing results? Yes — and it moved the headline.** Audit
round 3 found nine rows carrying `mandate_state=0` while listing a mandate
state elsewhere in the same posting; seven of the nine had disclosed pay. The
disclosure contrast widened from a 64.9pp gap to 71.2pp.

**Why it is still defensible.** The change follows from what the statutes
attach to, not from which direction the number moved, and it was specified and
its effect predicted (~70.7pp) *before* being implemented; the realized 71.2pp
differs only because three out-of-scope roles were removed in the same round.
It would have been reported identically had the gap narrowed. A reader who
disagrees can recompute with the first-listed rule: `states_listed` and
`n_locations` are in the dataset for exactly that purpose.

### 2026-09-21 — range titles ranked at their floor

**What changed.** A title advertising several rungs ("Resource Planning Analyst
I or II or Senior") was ranked at its highest; it is now ranked at its lowest,
with an `is_level_range` indicator.

**Why.** The ceiling rule biased the headline regressor upward on 6% of rows,
precisely where the advertised pay range is widest. The floor is the level the
employer will hire at and the one the pay floor corresponds to. Averaging was
rejected: a midpoint rank is a rung nobody is hired into.

**Prompted by seeing results?** Found by auditing the assignments, not by
looking at outcomes. The effect on estimates was not checked before deciding.

### 2026-09-22 — the required wild cluster bootstrap was implemented, and it changed seven verdicts

**What changed.** §6 above has required a wild cluster bootstrap before any
significance claim since this document was committed. It was cited in eight
places across the code, paper and limitations and **never computed**. It is now
estimated on every run while clusters remain under 30: the restricted
(null-imposed) variant of Cameron, Gelbach and Miller (2008), Rademacher
weights drawn once per employer, 9,999 replications.

**What it did to the results.** Nothing to the point estimates; a great deal to
what the study claims. **Seven of the nine core coefficients significant at 5%
under clustered standard errors do not survive:** `degree_required`
(0.003 → 0.069), `degree_stem` (0.040 → 0.160), `remote_eligible`
(0.002 → 0.102), `region_northeast` (0.018 → 0.253), `region_south`
(0.013 → 0.212), `region_west` (0.044 → 0.221) and `industry_data_center`
(0.035 → 0.102). Only `seniority_rank` (0.000 → 0.005) and `skill_ml_ai`
(0.000 → 0.003) remain significant.

Two pre-registered hypotheses move as a result. **H7** (data centers pay more)
goes from supported to inconclusive. **H5** goes from *contradicted* to
inconclusive: the negative sign on a required degree stands, but at 23 clusters
it cannot be distinguished from zero. Both are now reported that way.

**Prompted by seeing results? No — the opposite.** This was required in advance
by this document, and implementing it destroyed most of the study's
significance claims. It is the clearest case in the project of the
pre-registration constraining the result rather than the result shaping the
report.

**Replication count.** 9,999, not the more common 999. At 999 replications
`degree_required` returned 0.049, 0.063 and 0.082 on three seeds — straddling
the 0.05 line its verdict is read from. At 9,999 it is stable at 0.066–0.073
across four seeds. Monte Carlo error has to be small relative to the decision
being made.

### 2026-09-22 — interpretability gate corrected from 20 clusters to the 30 stated here

**What changed.** §6 specifies that the interpretability block fires whenever
clusters fall below 30. `analyze.py` tested `n_clusters < 20`.

**Why it matters.** At the 23 clusters realized, the cluster warning did not
fire at all, and had observations per regressor risen above 10 the entire block
would have disappeared while a pre-registered condition still failed. The
deviation was in the direction that flatters the study. Pinned by a test.

### 2026-09-22 — the simulation justifying clustered errors had no within-cluster correlation

**What changed.** `simulate()` in `tests/test_analyze.py` drew an
employer-level shock as `rng.normal(0, 0.04) if i < len(employers) else 0`,
which gave each employer's shock to exactly **one** of its ~50 postings. The
comment beside it claimed it "makes clustered SEs the correct choice". It did
not: the fixture had no within-employer error correlation at all. One shock per
employer is now applied to every posting that employer makes.

**What it corrects.** The 88–90% coverage figure cited in §6, in
`docs/limitations.md` and in the paper was measured on that fixture, so the
evidence offered for clustering had been computed on data where clustering does
not bind. The corrected figure is 92%. It also explains why a placebo-based
test of the bootstrap's per-cluster weighting passed under deliberate
sabotage — there was no correlation to preserve — and why that property is now
pinned structurally instead.

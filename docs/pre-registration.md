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

### 2026-09-22 — multi-sector consultancies must show sector evidence per posting

**What changed.** Employers marked `requires_sector_evidence` admit a posting
only when its title names energy, utility or data-center work. Applied to
Guidehouse, Charles River Associates and The Brattle Group.

**Why.** §2 of this document fixes the population as energy, utility and data
center employers, and audit round 4 found the frame was not delivering it.
Guidehouse supplied 65 in-scope rows — 22% of the estimation sample — of which
three were energy work; the rest were public health, national security,
federal law enforcement, fraud and generic IT. The existing guards could not
catch it: `sector_confidence()` judges a board rather than a posting, and
Guidehouse's board does discuss energy, so it passed honestly.

**Prompted by seeing results? Found by reading the artifacts, and it cost the
study on every headline number.** Usable observations fall 154 → 120,
observations per regressor 9.6 → 8.0, and the largest employer's share rises
25.3% → 32.5%, taking a failing pre-registered condition further from passing.
Two findings previously reported as significant do not survive: `skill_ml_ai`
goes from a bootstrap p of 0.003 to 0.270, so the "AI premium attaches to the
skill" result was substantially an artifact of a consultancy's AI work in
health and national security.

**The one thing it improved, stated plainly because it is the flattering
part.** The disclosure contrast was sensitive to Virginia, swinging 50–71
points; it is now stable at 57–61. The non-disclosing mandate-state postings
were the same off-umbrella federal consulting rows. The direction of that
improvement played no part in the decision — the guard was specified from the
umbrella constraint, and its cost to N and concentration was accepted before
the disclosure numbers were recomputed.

### 2026-09-22 — the role screen recognises taxonomy families written in variant form

**What changed.** `roles.include_any` is a list of literal phrases, so a family
this document already declares was rejected whenever a posting spelled it
differently. `include_concepts` adds a conjunctive matcher — a title admits
when it carries a term from each of two synonym groups, so "Energy Market
Analytics Manager" matches the market/commercial family that "energy market
analyst" already declared. Five concepts, all drawn from families §2 fixes;
no new family was added.

**Why.** The taxonomy is the study's definition of its population, and the
screen was enforcing its literal spelling rather than its content. Measured
against the committed snapshots, 32 unique postings the taxonomy plainly
covers were being dropped — NYISO interconnection studies, Origis project
development, CRA Energy-practice consulting, Yes Energy power-markets
modelling.

**The false positives, found by reading rather than reasoning.** Every title
the concept layer newly admitted was read. Four were wrong and none was
predictable from the rule: "Site Reliability Engineer" (IT reliability, not
NERC reliability), "Manager/Senior Manager (Transfer Pricing practice)" (tax),
"Associate Principal/Pricing & Market Access (Life Sciences practice)"
(pharma) and "Residential Business Development Director" (sales). All four are
now excluded and pinned as regression cases.

**Effect, reported in full because it is flattering.** Usable observations
147 → 165, distinct employers 29 → 33, largest employer 26.5% → 23.6%. This
is the change that cleared the last two pre-registered conditions, so it
deserves the most scepticism of anything in this document: the guard against
it is that the concept list was written from §2's declared families before the
effect on N was measured, and that all 28 added rows are listed in the audit
log for a reader to check one by one.

### 2026-09-22 — a nested-location repost is one job, not two

**What changed.** The dedupe key is employer + title + location, so the same
requisition republished over a narrower location set survived as a second
observation. A posting whose locations are a strict **subset** of another with
the same employer, title and byte-identical description is now collapsed.

**Why nesting, and not the description.** Collapsing on description alone was
measured first and rejected: 38 groups in the corpus share an employer, a
title and a byte-identical description across several requisitions — Nexamp's
`Senior Interconnection Engineer` open in Boston, Chicago, New York and
Washington, Clearway's technicians across four states. Those are real,
separate openings, and a description-hash rule would have destroyed roughly
thirty genuine observations to fix one duplicate. Genuine multi-city postings
list **disjoint** locations; a repost lists a subset.

**Effect.** Exactly one pair nests across all 1,940 raw records — Tract's
`Director, Utility Development`, requisitions 4343777009 and 4372165009, same
description, same $175,000–$190,000, Alexandria + Denver + Remote against
Alexandria + Remote. N falls 166 → 165.

### 2026-09-22 — the interpretability gate now tests concentration, and the bootstrap always runs

**What changed.** Two corrections to the gate, both made on the run that first
cleared it, and both in the conservative direction.

**1. The concentration condition was declared and never tested.** §7 above
states that a single employer supplying more than a quarter of observations
leaves the model "substantially describing one firm, regardless of N". The
gate in `analyze.py` tested observations per regressor, cluster count and
power — and said nothing about concentration. It would have reported
`interpretable: true` with one employer at 40%. This is the same defect as the
cluster gate reading 20 against a pre-registered 30: lenient in exactly the
direction that flatters the study, and caught only because clearing 30
clusters made the rest of the gate fall silent.

**2. The bootstrap no longer switches itself off.** §6 requires the wild
cluster bootstrap "when clusters number under 30", and the code implemented
that condition literally. Crossing 30 clusters therefore deleted
`wild_cluster_bootstrap` from the report — and the paper, executive summary,
figures and deck all read that key defensively, so every one of them would
have silently reverted to asymptotic p-values. The bootstrap withdrew seven of
nine findings at 23 clusters; reverting would have restored them all, without
an amendment, on the first run that looked good. It now runs unconditionally.
33 clusters is still few, Cameron–Gelbach–Miller applies, and the cost is
minutes.

**Effect.** None on any point estimate. The gate now passes on all four
conditions it tests — N 165, 33 clusters, 11.0 observations per regressor,
largest employer 23.6% — so the interpretability block comes down for the
first time, by the gate's own arithmetic rather than by hand.

### 2026-09-22 — audit round 6: five corrections made after seeing run 26

All five were found by reading run 26's rows. Each changed the data, so each
is recorded here with its effect on the headline, whichever way it went. The
net effect of all five: N 231 → 214, clusters 36 → 34, largest employer
Invenergy 19.1% → 20.6%, observations per regressor 15.4 → 14.3. The
disclosure gap moves 49.9 → 46.3pp. Full detail and row lists are in
`docs/audit-log.md`, round 6.

**1. Pay parsing (measurement of the dependent variable).** The text parser
now reads the text a reader sees rather than the HTML, widens its search
windows to token boundaries, applies a "k" written once to both bounds,
ignores figures followed by "million"/"billion", requires a "$" on a lone
figure, and rejects a low bound below the federal minimum wage annualized.
34 rows' pay changed or appeared: 21 from the window and "k" fixes, 12 from
the markup, and 1 boilerplate row that now reads as undisclosed. 17 Invenergy
rows had been at half pay, and 9 NYISO rows at their floor.
*Effect.* It strengthened H1: `seniority_rank` +0.091 → +0.102 on this step
alone. It **destroyed** two findings the unaudited data showed: `mandate_state`
−0.171 → −0.063 and `region_west` +0.116 → +0.023 in the clustered fit. All 17
halved rows were in mandate states, twelve of them in Illinois, the Midwest
reference category. The change was made because the recorded numbers were verifiably
not the posted numbers. Direction played no part: it cut both ways and was
applied before the model was refit.

**2. Seniority of multi-rung titles (a regressor's coding).** The §8 floor
rule of 2026-09-21 is unchanged in intent, and now implemented as intended:
each listed alternative is ranked on its own and the title takes the lowest,
instead of the minimum over every rung keyword. 11 rows changed rank, 5
usable.
*Effect.* `seniority_rank` +0.102 → +0.112. This flatters H1, and it is
justified regardless: "Manager/Sr Manager" at $219k–$301k was coded as a
senior individual contributor, and "Engineer I, II, III" at its ceiling. Both
misread the title.

**3. Role screen (population).** Nineteen exclusion phrases and one literal
include ("real-time reliability") were added, each a
variant of a family §2 already excludes: back office, HR, legal, security,
facilities, civil drafting, equipment/IT reliability engineering, and
construction project management. 24 rows removed, 13 usable. §2's population
is unchanged. Three QTS "Development Project Manager" rows that are
largely construction work by description remain. A title-only screen cannot
separate them, and on 2026-09-23 the owner ruled the role in scope as
"somewhat analytical in nature", so no new mechanism was added.
*Effect.* Roughly neutral on the coefficients. It lowers N.

**4. Group-company postings (the umbrella).** A new per-employer guard,
`requires_company_mention`, makes a posting on a group-wide board name the
in-scope company. It is applied to Hitachi Energy and Iron Mountain Data
Centers. 11 rows removed, 4 usable, 2 clusters.
*Effect.* It costs N and clusters and moves concentration the wrong way
(Invenergy's share rises). The umbrella constraint required it.

**5. Mandate coding (identification of H2).** The table's effective dates are
now applied per snapshot. Connecticut is re-dated to its posting law's
effective date, 2026-10-01 (Public Act 26-12). Nevada and Rhode Island are
removed as on-request regimes, which the rule written above the table already
excluded. 6 rows move to `mandate_state = 0`, 4 of them disclosing.
*Effect.* It works against H2: the gap narrows. Made because the statute
dates are what they are.

**Verdicts after all five.** Bootstrap at 34 clusters, then the region check:
`seniority_rank` survives both (p 0.0001 / 0.0005). `region_northeast`
(0.032 / 0.057) and `skill_cloud` (0.046 / 0.058) pass the bootstrap and are
withdrawn by the region check. `mandate_state`, `region_south` and
`region_west` are not significant. The unaudited run 26 had shown five
survivors. Two of them, `region_west` and `mandate_state`, were artifacts of
defect 1.

### 2026-09-22 — audit round 7: same-day snapshots merge, and one URL is one requisition

**What changed.** Two data-handling rules, both found by reading collection
run 27's output (`docs/audit-log.md`, round 7).

1. A second collection run on the same date now **merges** with that date's
   existing snapshot file instead of overwriting it. The later copy of a
   posting wins. Run 27 had discarded run 26's record of an Alliant posting
   that closed between the two runs. The 39 records it dropped were restored
   from run 26's committed files by the same merge.
2. Rows that share an **employer and job URL** are one requisition. The
   latest version is kept, with the earliest `first_seen_run`. An edited
   title or a reformatted location string had given one job two dedupe keys.

**Why.** Both restore what §2 already fixes. A collected posting belongs to
the stock "open at collection", and a requisition is one observation. Neither
rule changes which postings are eligible.

**Effect, stated whichever way it goes.** Almost none on the estimates. The
unaudited run-27 data and the corrected data both have N = 220, 34 clusters,
Invenergy 20.0%. The two changes offset exactly: one observation restored, one
duplicate removed. The disclosure gap moves 44.1 → 44.7pp. Bootstrap p for
`skill_cloud` moves 0.029 → 0.031, and for `region_northeast` 0.014 → 0.010.

**What run 27 did to the verdicts, recorded here because it flatters.** With
six added observations, `skill_cloud` and `region_northeast` pass both the
bootstrap and the region check. At N = 214 the region check withdrew both.
They crossed the 5% line on six rows. The deliverables report them as
surviving, because that is what the pre-specified procedure returns. The
audit log reports the sensitivity checks, and this note records that the
verdict flipped on a handful of observations, so a reader can weigh it
accordingly. `seniority_rank` is the only coefficient that has survived every
version of the data.

### 2026-09-27 — audit round 8: a pay-magnitude guard and two role exclusions

**What changed.** Both found by reading collection run 28's rows
(`docs/audit-log.md`, round 8).

1. **Pay parsing (measurement of the dependent variable).** A figure followed
   by "M", "MM" or "B" is no longer read as pay, as "million" and "billion"
   already were not. Duke Energy's "projects range from $1M to $30M" had been
   recorded as $30 an hour on a posting that states no pay. One row changes
   across the whole corpus.
2. **Role screen (population).** `packaging` and `account manager` join
   `exclude_any`, each the sibling of an exclusion already listed ("sales",
   "account executive", equipment engineering). Two GE Vernova rows leave
   scope: EU packaging-waste compliance (usable) and enterprise sales (no
   pay). §2's population is unchanged.

**Effect, stated whichever way it goes.** N 266 → 264; clusters 37 → 36,
because the Duke row was the **only** usable row of the Duke Energy Indiana
cluster, which therefore should never have existed. The largest employer's
share moves 17.7% → 17.8% (Invenergy). The two changes cost N and a cluster,
which works against the gate. No coefficient verdict changes because of them.
The move that matters in this round is not from either rule: it is
`skill_cloud` going from bootstrap p 0.031 to 0.0015 on 44 added
observations, which the audit log reports with its sensitivity checks.
That result **flatters** the study, and the round records that it carried no
directional prediction here.

**Also changed, with no effect on any row:** the Ashby adapter no longer
crashes (no verified employer is on Ashby), and the collection workflow skips
slug discovery unless asked, because its candidates never enter the data.

### 2026-09-27 — frame expansion (batch 4) and a fixed end to collection, both before the data they govern

**Written before collection run 29 was dispatched.** Nothing in this entry was
prompted by run 29's results, because none existed yet.

**1. The sampling frame grows by 28 employers, and 6 existing entries are
corrected.** At the owner's request ("expand nationally ... with the services
we are currently using"), each ATS's own domain was searched for role titles
§2 already covers. A hit is a live job URL on that platform, so it names the
board token directly and satisfies the frame's verification rule. 22 new
employers are verified that way, and 6 seen only as a board root enter
unverified, behind the sector-confidence check: utilities (Energy Northwest,
Cleco, Central Hudson, Tucson Electric Power); developers and IPPs (Capital
Power, Deriva, Talen, Madison Energy Infrastructure, Wunder Capital,
ON.energy, Hanwha Renewables, Reactivate, Solar Landscape, Oklo); data
centers (Rowan, Crusoe); energy analytics and research (EnergyHub, Daylight,
Orennia, Tyba, Customized Energy Solutions, kWantera, EPRI); consulting
(CLEAResult, TRIO); a retailer (Base Power); and grid vendors (Bloom Energy,
SMA America). Corrected from live URLs: Wood Mackenzie, Austin Energy (the
City of Austin's tenant, so every posting must name Austin Energy), Leeward,
Intersect Power, ICF (its site name was the unknown since 2026-09-22), and
Dairyland. Wood Mackenzie and ICF are multi-sector, so they require sector
evidence per posting, like Guidehouse. **§2's population does not change:**
same umbrella, same role taxonomy, same geography. Oil and gas companies and
traders that appeared in the searches were left out as outside the umbrella.

*Expected effect, stated in advance.* More clusters and a lower share for the
largest employer, which is what the conclusion has said the study most needs.
Developers and data centers have historically yielded few disclosed-pay rows,
so most of the gain should come from utilities and analytics firms in mandate
states.

**2. Collection ends with snapshots dated 2026-09-30.** `study.collection_end`
in `config/scope.yaml`, enforced by `build_dataset.snapshots_in_window()`, so
a later snapshot on disk is ignored rather than trusted to be left out. §6
says collection "stops on a fixed schedule, not when the numbers look good".
Until today the schedule was not written down, and more runs were planned
after the results had been seen. Fixing the date now, before the runs it
covers, is what keeps those runs from being optional stopping. The date also
falls the day before Connecticut's posting law takes effect, so no posting
changes mandate status partway through the panel. **Runs between now and the
end date are reported whatever they show, and none is added after it.**

**Addendum, same evening, before any batch-5 data exist: batch 5 and the
daily runs.** The owner approved three scheduled runs on 28, 29 and 30
September, plus further employer searches between them. The cron names those
three days only. Batch 5 adds 22 employers by the same live-job-URL method (20
verified, 2 board-root-only and unverified): consulting (Edison Energy,
Energy Solutions, Cadeo Group), analytics (E Source, Aurora Solar, Verse,
Buzz Solutions, Neara, Redaptive, NREL), developers (Ameresco, Resonant
Energy, Copia Power, SOLV Energy, and the nuclear developers TerraPower,
Kairos Power, Last Energy and The Nuclear Company), data centers (Keel
Infrastructure, ECL), a retailer (Chariot Energy) and a grid vendor (Fluence).
Confirmed in existing entries from live URLs: Amperon, SEL, and Associated
Electric Cooperative. Five more by the same method before the 28 September run: OneEnergy Renewables, Brightcore Energy, Nira Energy, Energy Exemplar (verified) and American Transmission Co (board root, unverified). Frame: 297 -> 324 employers. Batch 6, added the same evening before the 28 September run and before any of its data exist: New Leaf Energy, Akaysha Energy, Equilibrium Energy, Gridware, Orenda (sector evidence required per posting) verified, and Pivot Energy (board root, unverified). Frame: 330. Batch 7, the same evening and before any of its data exist: VELCO (Vermont transmission), IPX Power, Catalyze, Scale Microgrids, TAR and RMI (sector evidence required per posting), all verified from live job URLs. South Jersey Industries, denied on 2026-09-23 for want of a supported ATS, was found on Workday and verified. AI-cloud providers that surfaced (Fluidstack, Together AI, Vultr) were not added: the frame has no cloud-provider category, and Crusoe was admitted as a data center builder and operator. Frame: 336. Batch 8, the same evening (committed 22:24 UTC) and before any of its data exist, by the same live-job-URL method, now also searching by name for the kinds of employer the state supplier and community-choice lists hold (source route 1, approved by the owner on 2026-09-27): San Diego Community Power (a California community choice aggregator, a public load-serving entity), Perch Energy (community solar subscriptions), LevelTen Energy and Tapestry (analytics), Sunrun, Avantus, 1st Avenue Power, ConnectGen, X-energy and Blue Energy (developers, the last two nuclear), Form Energy, Energy Vault and Canadian Solar (storage and solar manufacturers), all verified, and Palmetto Clean Technology (board root, unverified). Edged Energy's guessed board names are replaced by the one a live job URL shows (greenhouse `edged_global`), so it becomes verified. Not added, by rules already applied: a third Hanwha board (Qcells) and Canadian Solar's developer subsidiary (Recurrent Energy) as duplicate-cluster risks, a commodity trader, a gas pipeline, and an asset manager's investment roles. *Expected effect, stated in advance:* more clusters, most of them developers and manufacturers, which have yielded few disclosed-pay rows; San Diego Community Power and LevelTen (California and Washington, both mandate states) are the likeliest to add usable rows. Frame: 350. The nuclear developers'
engineering roles will mostly fail the role screen by design, because §2
admits engineering only where it is analytics-adjacent. They are in the frame
for their analytics, market and siting roles.

### 2026-09-27 — audit round 9: the pay unit read beside the figure, a declared location, six role exclusions

**What changed.** Found by reading run 29's 133 added rows
(`docs/audit-log.md`, round 9). Each change was measured across the whole
corpus before being kept.

1. **Pay parsing (the dependent variable).** The pay unit (hour, month or
   year) is now read from the text beside the matched figures, 40 characters
   before and 60 after, not from the whole 260-character window. Crusoe
   lists "Company paid commuter benefit; $300 per month" just above "the
   range of $170,000 - $205,000". The salary was taken as monthly,
   annualized to $2.0M, rejected, and replaced by the lone upper figure. A
   figure with a period as its thousands separator ("260.000") is read as
   thousands. **Nine rows change, all Crusoe.** Five had been recorded at a
   single figure and four as undisclosed. No other row in the corpus moves.
2. **Location (identification).** An employer may declare
   `location_fallback`, used only when a posting's own location names no US
   state. It is declared once: "Austin, TX" for Austin Energy, whose City of
   Austin tenant labels postings with facility names ("Austin Energy
   Headquarters"). Four rows enter, one with pay.
3. **Role screen (population).** `installer`, `inspection specialist`,
   `commodity manager`, `contracts specialist`, `supplier development` and
   `learning & development` join `exclude_any`. Each is the sibling of an
   existing exclusion (field service, procurement, legal, HR), and each
   matches exactly one in-scope title in the corpus. Six rows leave, five
   usable.

**Effect on the headline, stated before the results were read.** Change 1
raises N by four and moves nine rows of the largest new employer. Change 2
adds a cluster on the non-mandate side. Change 3 lowers N by five. None was
chosen for its effect: each is a posting read wrong by the pipeline,
measured and corrected.

**Not changed, and put to the owner instead:** whether Crusoe belongs in the
frame. It was admitted before any of its data existed (batch 4), as a data
center developer and operator, and its postings pass every existing screen.
But 49 of its 49 in-scope rows disclose pay, 41 of them California
software and AI-platform roles (ranges from $117,000 to $385,000). That makes it the
largest employer (13.4%). Excluding it now, after seeing its data, would be
the kind of change this document exists to prevent, so it stays, and the
results are reported with and without it.

**4. A leave-the-largest-employer-out check (inference), added to
`analyze.py`.** The core model and its bootstrap are re-estimated without
whichever employer is largest, on every run, and every verdict that changes
is reported. It is general, not written for Crusoe, and it is reported
whichever way it comes out. It exists because §7's concentration threat
does not stop at the 25% gate: a firm under the cap can still carry a
verdict. With Crusoe (the current largest) dropped, `seniority_rank`,
`yrs_exp_min` and `region_northeast` still pass (0.0005, 0.004 and 0.009 in
the wired-in check). **`skill_cloud` does not: 0.055** (0.048 in an earlier
9,999-replication run, so it sits on the line). `remote_eligible` becomes
significant (0.040, against 0.46 with Crusoe). The build therefore reports
two verdicts as depending on the largest employer. This is recorded here
because an earlier draft of this paragraph, written from the 9,999-rep run,
said no reported finding depended on Crusoe, and the check itself says
otherwise for `skill_cloud`.

**Owner decision, 2026-09-27:** "Keep Crusoe in, and continue as planned."
Crusoe stays in the frame as registered. The leave-the-largest-employer-out
check keeps reporting which verdicts depend on it.


### 2026-09-27 (late evening) — two corrections found between runs, and frame batches 9 and 10 with the federal regime, all before the 28 September run

**1. Two corrections to screening and deduplication, made after seeing the
data** (`docs/audit-log.md`, interim check of 2026-09-27). Neither was
looked for because of a result. Both surfaced while testing the USAJOBS
adapter.

- *Location (population).* A location fragment that ends in a US state is no
  longer excluded as foreign because it names a town that shares a name
  with a foreign city (Berlin, CT; Vancouver, WA; Paris, TX; "New Mexico").
  Every other non-US marker still applies anywhere. 14 Eversource rows enter.
- *Deduplication.* The nested-repost rule (2026-09-22) now compares
  descriptions by their letters and digits, not byte for byte. Across all
  2,435 raw records this adds exactly one pair to the one it already
  caught. One of the 14 rows leaves as a repost.

*Effect on the headline, stated whichever way it goes.* N 365 → 377,
clusters 52 → 52, largest employer Crusoe 13.4% → 13.0%, disclosure gap
45.3 → 45.0 points. **The corrections flatter two tentative findings**: the
Northeast premium's bootstrap p falls from 0.0058 to 0.0006, because the rows
are New England utility pay, and it stays insignificant in real terms. The
cloud-skill premium without the largest employer falls from 0.055 to 0.043.
They are corrections of postings the pipeline read wrongly, and are kept for
that reason. Being favourable is not a reason to keep them, and the audit
log reports both moves.

**2. Frame batch 9 (source route 4), before any of its data exist.** Board
tokens from Common Crawl's URL index (`data/registry/ats_tokens.csv`: 9,026
tokens, 356 with URLs naming an in-scope term), each confirmed by a
domain-restricted search showing a live job URL: Helion Energy, Giga
Energy, VEIR, Heron Power, WeaveGrid, GridCARE and Stem (verified); Antora
Energy, Rondo Energy, Fourth Power, Euclid Power, Sparkfund and Lunar Energy
seen only in the crawl (unverified, behind the sector-confidence check).
Traders, oil and gas, a cybersecurity vendor and non-US boards in the crawl
are left out by the rules already applied. *Expected effect:* more clusters,
mostly grid-technology and analytics firms in California, Massachusetts and
Washington, all mandate states.

**3. Frame batch 10 (source route 3): the federal power marketing
administrations, and the rule for them, both fixed before any federal
posting exists.** Bonneville, Western Area and Southwestern Power
Administration enter through the official USAJOBS Search API, keyed by their
subelement codes in USAJOBS's own code list, and the Tennessee Valley
Authority's entry gains its code. They are utilities, inside the umbrella.
Regulators (FERC, DOE headquarters) stay out, as state regulators do. They
collect only once the owner adds the free API key. Without it nothing
changes.

*The rule, stated now:* federal pay is set by statute and agency pay plans
and is always stated, so it is a different regime from a state posting
mandate. Whenever federal (USAJOBS) rows are present, `analyze.py` reports
(a) the disclosure contrast without them, as a fourth robustness cut, and
(b) the core pay model and its bootstrap without them
(`federal_robustness`), with every verdict that changes. Both are in the
code as of this entry, and were smoke-tested on a relabelled copy of the
data. *Expected effect:* federal rows all disclose, so they raise
disclosure on whichever side of the mandate line their states fall
(Bonneville in Oregon and Washington, a mandate state; Western Area across
the West). The without-federal cut is the one to read.

**USAJOBS terms, as read (2026-09-27).** The API's Authentication guide
requires a key requested through its API Request page, sent with the
registered email as User-Agent. Its Rate Limiting guide allows at most 500
rows per page and 10,000 per query, and says the Search API "defaults to only
'Public' jobs". Its Terms of Use page is the federal system-use notice:
"authorized users only", and it prohibits attempts to "accrue resources for
unauthorized use". A holder of an issued key using the documented API is an
authorized user of it. The API Terms of Service summary (as indexed by
search) limits data "to the explicit use of the requesting company identified
on the USAJOBS Program Office API Registration Form". Here that is the owner's
own research use, so the owner should register as the requester. Quoted
beside the other sources in `docs/limitations.md`.

Frame: 350 → 366 (the collector's loader).

**Addendum, 2026-09-28 (just after midnight UTC), before the 28 September run: batch 11
and the outcome of source route 2.** The EIA-861 (2024; 1,518 utilities by
retail customers) and EIA-860 (2025; 5,852 generator operators by operable
MW) lists were ranked against the frame, mandate states first
(`data/registry/eia_ranked_missing.csv`). The largest missing names were
searched on each supported ATS's domain. Almost all are subsidiaries of
parents already in the frame or already denied (Exelon's utilities on
iCIMS, National Grid, FirstEnergy, Dominion, Con Edison), or public
entities hiring through NEOGOV and their own portals (SMUD, LADWP, Seattle,
Snohomish and Clark PUDs, Colorado Springs, the California community choice
aggregators other than San Diego's). That is limitations 9b measured at
scale rather than a new finding, and it is recorded so the next search does
not repeat it. One employer found along the way enters, verified: Industrial
Electric Manufacturing (switchgear; Fremont, California). Frame: 366 → 367.

**Addendum, 2026-09-28 (just after midnight UTC), before the 28 September run: batch 12.**
Serverfarm (data center operator), Exowatt (power systems for data
centers) and CARIAN (utility energy-efficiency program services, which also
serves other sectors, so it must show sector evidence per posting, as ICF and
Guidehouse do). All three are verified from live job URLs. Left out: a
logistics REIT's data-center power role (Prologis), a fintech lender
(GoodLeap), a crypto firm (Galaxy) and a pipeline company (Enbridge).
Frame: 367 → 370.
Also in batch 12: David Energy (a Brooklyn retail supplier, in the frame
since batch 3 on guessed board names) is confirmed on Ashby from a live job
URL, and its guessed names are dropped. Energy by 5 (energy procurement
advisory, Chicago) enters from its board root, unverified. Frame: 371.

**Correction, 2026-09-28 (just after midnight UTC), before the 28 September run.** Batch 10
entered Bonneville and Western Area Power Administration as new employers,
but both were already in the frame (batch 2, on guessed board names that never
resolved). The existing-entry check by normalised name, a standing rule, was
skipped for batch 10. The duplicates are removed, and the USAJOBS codes now
sit on the original entries, which become verified with their guessed slugs
dropped. Southwestern Power Administration was new. A full scan of the frame
finds no other duplicate name. The frame counts stated in the entries above
from batch 10 on were two too high: **the frame is 369** (the collector's
loader). No data existed for any of these entries, so no result is affected.
Also before the 28 September run: Apex Clean Energy (in the
frame since the first batch, on guessed Greenhouse and Lever names that never
resolved) is confirmed on SmartRecruiters (`ApexCleanEnergy`) from live job
URLs in Charlottesville, Virginia, a mandate state. The guesses are dropped.
Frame unchanged at 369.
Also before the 28 September run: Gas South (retail natural gas
supplier, Atlanta; owned by Cobb EMC, not related to Southern Company Gas),
verified from a live job URL. Frame: 370.

**Addendum, 2026-09-28, before the 28 September run: the USAJOBS key works,
and what to expect from it.** The owner added the secrets. A preflight
(`sources.yml --only usajobs`, run 5, committed 00:20 UTC) returned HTTP 200
for all four codes. Bonneville lists 13 postings and Western Area 15, every
one with a stated pay range. Southwestern and TVA list none today. Their
titles are federal position titles ("Public Utilities Specialist",
"Electronics Engineer", "High Voltage Electrician", "Contract Specialist").
**The role screen is not changed for them.** Run through it unchanged, the
sampled titles are all rejected, including the Public Utilities Specialist
series, whose work is rate and power-marketing analysis. Widening the
taxonomy to admit them, after seeing them, would be the kind of change this
document exists to prevent. *Expected effect, stated in advance:* few or no
federal rows enter N. The `excluding_federal` cut and `federal_robustness`
report whatever does. If the owner wants the federal series admitted, it
needs a dated amendment of §2's taxonomy, with its effect reported.

### 2026-09-28 — the federal Public Utilities Specialist series admitted to the role taxonomy (owner decision), before any federal posting was collected

**Owner decision, 2026-09-28, quoted:** "Yes, admit the Public Utilities
Specialist series as an amendment."

**What changed.** `public utilities specialist` joins `roles.include_any`
in `config/scope.yaml`. This is OPM series 1130, which does rate,
power-marketing and regulatory analysis at the federal power marketing
administrations. It is the federal counterpart of the rate, tariff and
regulatory analyst titles §2 already admits. Exclusions are still judged
first, so a sales role in the same series stays out. Bonneville's current
"Public Utilities Specialist (Customer Account Executive)" is removed by the
existing "account executive" exclusion. Pinned in `tests/test_filters.py`
with that real title.

**When, relative to the data.** Made after the owner and I had seen the
federal *titles* in the key preflight (run 5), and before any federal
posting was collected or entered the dataset. It is recorded as a change
prompted by seeing the titles, which it was.

**Effect, stated whichever way it goes.** On the committed corpus it changes
no row: no existing title contains the phrase. The rebuild is identical at
N = 377, 52 clusters, Crusoe 13.0%. Its effect comes only through federal
postings, from the 28 September run on. Those rows face the
`excluding_federal` disclosure cut and the `federal_robustness`
re-estimate, which report every verdict they move. Federal pay ranges come
from the GS and agency pay plans and are always stated. So any such rows raise
the disclosure share on whichever side of the mandate line their states fall,
and the without-federal figures are the ones comparable to the rest of the
study.

### 2026-09-28 — the 28 September run moved from 09:17 UTC to a manual dispatch just after midnight (owner request), before it ran

**Owner request, 2026-09-28, quoted:** "Are you able to pause the future run
and run it now instead, rather than waiting and idling until its scheduled
time hits?"

**What changed.** The 28 September collection is dispatched by hand at
about 00:36 UTC instead of by the 09:17 cron. The cron now names 29 and 30
September only, so it does not also run today. Its snapshot is dated
2026-09-28 either way, so the collection dates are unchanged: one run per
day on 28, 29 and 30 September, closing with snapshots dated 2026-09-30.
Made before the run, and not prompted by any data. The only difference a
reader could see is that postings opened between 00:36 and 09:17 UTC today
are not in today's snapshot, and they are caught by the 29 September run if
still open. Today is a Monday, so the workflow does its weekly full re-read
of descriptions either way.

### 2026-09-28 — audit round 10: location forms read, one declared location, nine role exclusions

**What changed.** Found by reading run 30's 127 added rows and every silent
new board (`docs/audit-log.md`, round 10). Each change was measured across
the whole corpus before being kept.

1. **Location (population).** `canonicalize_place` reads four forms first
   met on this run: a facility after the state code ("Tucson, AZ -
   Downtown"), state before city ("Washington - Pullman", "United States -
   Massachusetts - Boston"), the metro's own name ("San Francisco Bay
   Area"), and city and state name without a comma ("Mt. View
   California"). 12 of 1,051 distinct raw locations change, all correctly.
   Heron Power declares `location_fallback: "Scotts Valley, CA"` (its
   headquarters), used only where a posting names no state. 18 in-scope
   rows enter, 9 of them SEL's.
2. **Role screen (population).** Nine phrases join `exclude_any`, each the
   sibling of an existing exclusion, each matching only its target: human
   capital, workforce, training & development, labor compliance,
   construction supervisor, quality engineer, fuel development, emc
   compliance, development lead engineer. 11 in-scope rows leave, 10 of
   them usable.

**Effect on the headline, stated whichever way it goes.** Against run 30 as
collected: N 470 → 472, clusters 85 → 86 (Heron Power), largest employer
Crusoe 10.4% → 10.4%, disclosure gap 43.6 → 43.1 points. The location
fixes add rows in California and Washington, mostly software and
engineering pay, and the exclusions remove HR, compliance and manufacturing
pay. Neither was chosen for its effect. Change 1 corrects postings the
pipeline could not place, and change 2 removes roles the taxonomy never
admitted. On this run the regressor budget passes the pre-registered
threshold for Model 2, so the extended specification is used. That is the
rule in §4 operating, not a choice made here.

### 2026-09-28 — owner approves options C and D: federal energy agencies (regulators included) join the frame, before the 29 September run

**Owner decision, 2026-09-28, quoted:** "I approve options C and D." (The
options are set out in `docs/next-session-prompt.md` §6. Options A, a
broader professional-role population, and B, an extended collection, were
not approved. The role taxonomy and the 2026-09-30 end of collection are
unchanged.)

**What changed (C).** Five federal agencies enter through the USAJOBS
Search API, by their active subelement codes in USAJOBS's own code list:
the Federal Energy Regulatory Commission (DNFE), the Nuclear Regulatory
Commission (NU00), Department of Energy headquarters (DN00, which includes
EIA, the Office of Electricity, the Grid Deployment Office and the Loan
Programs Office), the Bureau of Reclamation (IN07) and the Bureau of Ocean
Energy Management (IN27). **This reverses the frame's earlier exclusion
of regulators** ("out of scope as state regulators are"), by owner
decision. DOE headquarters, Reclamation and BOEM are multi-mission, so each
posting must show energy evidence, as for the multi-sector consultancies.
The Army Corps of Engineers is left out: its board is thousands of mostly
civil-works postings, hydropower a small part. NERC is not a federal agency
and is not on USAJOBS; it is to be searched on its own ATS under option D.
The role screen is unchanged. FERC's main series, "Energy Industry
Analyst", passes it as written, and most other federal titles do not. The
agencies are coded industry `utility`, the reference category, because
the model has no regulator category and one is not added after seeing data.

**Expected effect, stated in advance.** About +10 to +40 federal rows at
any time, all with stated GS or agency pay, mostly FERC and DOE. They raise
disclosure on whichever side of the mandate line their states fall. FERC
and DOE headquarters are in DC, a mandate jurisdiction. The
`excluding_federal` cut and `federal_robustness` report every verdict they
move. Frame: 370 → 375.

**(D)** Frame expansion through the four source routes continues, under
the existing rules.

### 2026-09-28 — option D, batch 14: 29 employers, recorded before the 29 September run

Written at 02:22 UTC by the clock, before the 29 September run and before
any of these employers' data exist. Same live-job-URL method as batches
4–12, under the owner's approval of option D ("I approve options C and D",
2026-09-28). Sources: unclaimed tokens in the Common Crawl list
(`data/registry/ats_tokens.csv`), the EIA-861 ranked list (California
community choice aggregators) and role-title searches restricted to the
supported ATS hosts. Every name was checked against the frame by normalised
name and by board token, and a full duplicate scan found none.

**Added (29).**
- *Utilities and load-serving entities:* Clean Power Alliance (a
  Los Angeles community choice aggregator, as San Diego Community Power) and
  City Utilities of Springfield, Missouri (electric and gas, also water,
  broadband and transit, so each posting must show sector evidence).
- *Data centers:* Core Scientific, Cipher Digital, Hut 8, Soluna and
  LightEdge. The first four build and operate their own campuses for
  mining and HPC hosting. They enter under the rule Crusoe entered by (a
  data center builder and operator; Crusoe itself began as a bitcoin
  miner). AI-cloud providers (CoreWeave, Lambda) stay out under the batch
  7 rule.
- *Developers:* Adapture Renewables, Scout Clean Energy, SolRiver Capital,
  SolAmerica Energy, Urban Grid Solar Projects, Korsail Energy, Lumen
  Energy, Elephant Energy and SunPower (residential, as Sunrun); nuclear and
  fusion developers Antares, Radiant Industries, Valar Atomics and
  Commonwealth Fusion Systems (as Oklo, Kairos and Helion); Quaise Energy
  (geothermal).
- *Analytics and grid technology:* Emerald AI, GridUnity, Omnidian,
  Habitat Energy, Emporia Energy, Teragen Energy, and Argonne National
  Laboratory (as NREL, but multi-mission, so each posting must show sector
  evidence).
- *Retail:* Common Energy (community solar subscriptions, as Perch).
- Quaise and Habitat enter from board roots, unverified. The rest are
  verified from live job URLs quoted in `config/employers.yaml`.

**Correction.** The batch 9 note said Terra-Gen was "already in the frame
under its own Ashby token". The Ashby token `teragenenergy` is Teragen
Energy, a fuel-cell maker, not Terra-Gen. It enters here as its own
employer. Terra-Gen's entry is unchanged: guessed board names that have not
resolved.

**NERC (searched under C and D).** NERC posts on UKG Pro Recruiting
(recruiting.ultipro.com/NOR1051NAER). Two of its regional entities use
Paylocity (WECC) and iSolved (SERC). The study has no adapter for any of
these, and adding one needs the owner's approval, so none enters. PG&E
(careers.pge.com) is not on a supported ATS either.

**Not added, recorded so they are not re-chased:**
- CoreWeave and Lambda (AI cloud).
- Galaxy (a crypto firm) and GoodLeap (a lender), as in batch 12.
- Kraken Technologies, part of the Octopus Energy group already in the
  frame (a duplicate-cluster risk).
- Pacific Fusion, which has open boards on both Greenhouse and Ashby (one
  employer never gets two live boards).
- Redwood Materials (battery-materials recycling).
- Non-US boards: Pacifico Energy's Japan roles, Enode, Enpal, Gridcog, Fuse
  Energy, Util-Assist and Metergy.
- TC Energy (pipelines).
- State commissions (Oregon PUC, California Energy Commission). State
  regulators remain out of scope; the owner's decision covered federal
  agencies.

**Expected effect, stated in advance.**
- More clusters. The five data-center operators add clusters beside Crusoe,
  so Crusoe's share should fall. They also bear on H7 (data centers pay
  more than utilities).
- Most developers, nuclear and fusion firms have yielded few disclosed-pay
  analytics rows before.
- Clean Power Alliance (California, a mandate state, with nine current
  postings seen) and Argonne (Illinois, a mandate state) are the likeliest
  to add usable rows.
- About +15 to +45 usable rows over the two remaining runs. Whether each
  addition helped or hurt the headline is reported at audit round 11.

Frame: 375 → 404.

**Addendum, 2026-09-28 (02:25 UTC by the clock), before the 29 September run: batch 15.**
Three more by the same method, found by role-title searches aimed at
mandate states, all verified from live job URLs:
- Calibrant Energy (on-site solar, storage and microgrids, California).
- Xcimer Energy (laser fusion, Denver, as Helion).
- BlocPower (building electrification, Brooklyn, as Elephant Energy). It
  also shows a Lever board, and only the Greenhouse board is listed.

Not added: SpryPoint (utility billing software, mostly for water utilities)
and InCharge Energy (EV charging, which has no frame category).

*Saturation, recorded as a finding:* in this batch's searches nearly every
energy, utility or data-center employer returned from the supported ATS
hosts was already in the frame (15 of the 20 boards checked in its last
three searches). Further
gains from option D will be small.

*Expected effect, stated in advance:* three small clusters, few rows.
Frame: 404 → 407.

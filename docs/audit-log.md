# Audit log

Per-round accuracy of the rule-based regressor coding, measured against
hand-coded truth. Rounds are appended, never rewritten, so the progression of
coding quality stays visible.

## Procedure

```bash
# 1. Draw a stratified sample and write a blank sheet
python src/lmstudy/audit.py sample --n 100

# 2. Hand-code every true_<regressor> cell as 0 or 1 in the sheet
#    (leave a cell blank if genuinely undecidable; blanks are skipped)

# 3. Score the filled sheet
python src/lmstudy/audit.py score --sheet data/gold/audit-sheet-<date>.csv
```

Sampling is stratified by metro, industry and pay disclosure, and is
reproducible under a fixed seed.

## Standard

A regressor is acceptable at **≥ 0.90 accuracy**. Anything below is refined in
`config/regressors.yaml` and re-scored. Cohen's kappa is reported alongside
accuracy because a rare regressor can look accurate purely by predicting 0
everywhere — kappa exposes that, accuracy does not.

## Gold standard set

A held-out set in `data/gold/` is **never** used to tune patterns, so the
accuracy reported from it is out-of-sample. Rules are refined only against
non-gold audit rounds.

## Known hazards to watch

Carried forward from code review; each should be checked explicitly in round 1:

| Regressor | Hazard |
|---|---|
| `soft_leadership` | May fire on boilerplate such as "our leadership team" rather than a requirement |
| `certification_req` | "certified" appears in unrelated contexts (e.g. "certified B Corporation") |
| `skill_cloud` | "azure" or "aws" may appear in a company blurb rather than as a requirement |
| `benefit_equity` | "equity" also appears in diversity language ("equity and inclusion") |
| `degree_stem` | Field names may describe the team, not the degree requirement |
| `soft_teamwork` | Nearly universal boilerplate; may have too little variance to be useful |

A regressor that turns out to be near-constant across postings carries no
information for the regression and should be dropped rather than reported.

## Rounds

### Round 1 — 2026-09-20

**Sample:** 53 real collected postings carrying full descriptions (Cologix 28,
EdgeConneX 19, Iron Mountain 2, Invenergy 1, plus Workday detail records),
hand-read against the machine coding.

Sampling from raw postings rather than the analysis dataset was necessary
because no posting has yet survived scope screening. Coding accuracy is a
property of the text, so the audit does not need in-scope postings — this is
what `audit.py sample --from-raw` exists for.

**Three systematic false positives found, each predicted as a hazard above and
each confirmed in real data.** All three came from *company boilerplate* — text
about the firm rather than the job, repeated verbatim in every posting an
employer publishes. That makes the error perfectly correlated within employer,
which is the worst case: in a regression clustered by employer it would look
like a real employer effect rather than noise.

| Regressor | Matched on | Before | After | Removed |
|---|---|---|---|---|
| `certification_req` | "our **certified** staff" | 31/53 | 7/53 | −24 |
| `soft_leadership` | "our experienced **leadership** team" | 37/53 | 8/53 | −29 |
| `benefit_health` | "their own unique **vision** for the Edge" | 20/53 | 1/53 | −19 |

**Fixes.** Bare `certification`, `certified`, `leadership` and `vision` were
removed from the dictionary. Each regressor now requires the attribute to be
asked of the *applicant*: `certification required`, `must be certified`, named
credentials; `leadership skills`, `demonstrated leadership`, `mentor`; and
`vision insurance` or `dental and vision` rather than the bare word. Six
regression tests in `tests/test_regressors.py` pin both directions — the
boilerplate must not fire, and a genuine requirement still must.

**A structural fix was tried and rejected.** Since all three errors came from
repeated boilerplate, an obvious remedy is to detect paragraphs an employer
repeats across postings and strip them before coding. It was implemented and
measured: **zero** further false positives removed, because the tightened
patterns already no longer matched the boilerplate. It also carried a serious
risk. Under Illinois HB 3129 employers must publish a benefits description, so
they paste an identical benefits block into every posting — that block *is*
boilerplate by construction, and stripping it would systematically zero out the
benefit regressors the study depends on. Iron Mountain already demonstrated
this: "competitive compensation and benefits aligned with experience" would
have been deleted. Zero measured gain against a structural risk to the
dependent variable's covariates, so it was removed rather than kept "just in
case".

**Still to check in round 2** (needs postings that survive scope screening):
`skill_cloud` firing on a company blurb ("360+ cloud providers" appears in
Cologix boilerplate and would match), `benefit_equity` against diversity
language, `degree_stem` where a field name describes the team rather than the
requirement, and whether `soft_teamwork` is near-constant and therefore
uninformative.

### Round 2 — 2026-09-21

**Target: `role_family`, which had never been checked against hand-coded
truth.** Rather than a sampled sheet, this round hand-read *all 53* assignments
in `data/analysis/postings.csv` against their real titles — the population was
small enough to audit exhaustively, which is stronger than a sample.

**Result: 6 of 53 assignments wrong (89% accuracy), below the 0.90 standard.**
Four of the six had reached a live measurement and sat at ranks 1, 7, 8 and 11
by pay in a 42-row sample. Together they raised the mean 4.2% and the median
6.1%, all in the direction that flatters an early-career study.

| Title | Was | Should be | Pay |
|---|---|---|---|
| AI Cybersecurity Engineer | `ai_ml`, kept | excluded (security) | $148,500 |
| Mergers and Acquisitions Associate | `siting_dev` | `market_commercial` | $127,262 |
| NERC Operations Team Leader | `regulatory`, kept | excluded (seniority) | $122,038 |
| Environmental Analyst V | `sustainability`, kept | excluded (seniority) | $118,100 |
| CAD Designer | `gis`, kept | excluded (drafting) | $74,800 |
| Data Analyst - AMLD | `other` | `software_data` | $77,533 |

**Causes — all the same class as round 1's, a pattern matching confidently and
wrongly:**

1. Seniority numerals stopped at IV, so "Analyst V" read as early career.
2. `lead` is word-bounded and so never matched "Leader".
3. Security roles were named out of scope in the original plan but never
   encoded, so a cybersecurity role entered on a bare `ai` match.
4. `role_family` returns the first matching pattern, so a broad term in an
   early family captures later ones: `acquisition` in `siting_dev` beat
   `mergers` in `market_commercial`, and bare `cad` in `gis` caught a drafter.
5. `software_data` listed `analytics` but not `data analyst`.

**Changes made:** V–VIII, `leader` and `team lead` added to
`seniority_exclusions`; six security terms added to `roles.exclude_any`;
`cad designer` and bare `cad` removed from `include_any`; `gis` narrowed to
`cad[- ]gis`; `siting_dev` narrowed to `site acquisition`/`land acquisition`;
`data analyst` added to `software_data`.

**Re-scored: 53/53 correct on the same titles.** Usable observations fall
42 → 38 and the median falls to $81,750. That is the correct direction — a
floor met by counting senior and out-of-scope roles is not worth meeting.
`gis` and `sustainability` now have zero observations, which is the honest
state: each had exactly one and both were misclassified.

**Pinned by tests.** Every title in `tests/test_filters.py::AUDIT_ROUND_2` is
real, read out of `postings.csv` rather than invented, and the roles that must
survive the tightening are pinned beside them so a tighter screen cannot
quietly take the sample with it.

**Still outstanding from round 1's list**, and not addressed here because this
round went after `role_family` instead: `skill_cloud` on company blurbs,
`benefit_equity` against diversity language, `degree_stem` where a field name
describes the team, and whether `soft_teamwork` is near-constant.


### Round 3 — 2026-09-21

**Target: `seniority_rank` and `state`**, the two variables the national
rescope introduced and nobody had checked against hand-coded truth. Both are
load-bearing: seniority is the headline regressor under H1, and `state` is what
`mandate_state` derives from, which carries the study's best finding. All 141
rows read, not sampled.

**Result: 21 of 141 wrong — 85.1% accuracy, below the 0.90 standard.**

**Finding 1 — `mandate_state` wrong on multi-location postings (9 rows).**
23% of rows list more than one location, and `state` and `metro` were assigned
by different rules — nearest study metro versus first parseable fragment — so
they disagreed constantly (`state=UT, metro=indianapolis`). For most fields
that is untidy; for `mandate_state` it is wrong, because the law attaches to
the job's location and a posting listing any covered place is covered. Nine
rows read 0 while listing a mandate state elsewhere, and seven of those nine
had disclosed pay.

| Disclosure contrast | mandate | no mandate | gap |
|---|---|---|---|
| Before | 98.8% (n=82) | 33.9% (n=59) | 64.9pp |
| After | 97.8% (n=89) | 26.5% (n=49) | **71.2pp** |

The fix strengthened the headline. That is worth stating plainly: it was found
by auditing assignments, the effect was predicted (~70.7pp) before it was
implemented, and it would have been reported identically had the gap narrowed.

**Finding 2 — range titles ranked at their ceiling (9 rows, 6%).** Utilities
routinely advertise several rungs in one requisition. Ranked at the floor now,
with `is_level_range` carrying the extra variance. Seniority shifted as
expected: entry 20 → 24, staff/principal 6 → 3.

**Finding 3 — three out-of-scope roles admitted.** "Corporate Counsel" (a
lawyer, on `capital markets`), "Sr. Nuclear Instructor (Database
Administrator)" (a training role; the DBA reference is parenthetical), and
"Senior Security and Compliance Analyst" (round 2 added `security analyst`, but
matching is contiguous and this reads "Security **and Compliance** Analyst").
A fourth, "AI Data & Security Governance Engineer", was judged a genuine
data-governance role and deliberately **kept**; the first fix excluded it too
and was narrowed, because a pattern broad enough to catch it was broader than
the finding justified.

**Changes made:** `resolve_us_states()`; `mandate_state` from any listed state;
`states_listed` and `n_locations` emitted so the rule is auditable and the old
rule recomputable; `seniority_rank()` returns the floor of a range;
`is_level_range` added; `counsel`, `attorney`, `instructor`, `trainer`,
`security and compliance` excluded.

**Re-scored: 138 rows, all three defects resolved.** N falls 101 → 100 as the
out-of-scope roles leave, which is the correct direction.

**Known limitation, recorded rather than papered over:** a range between an
*unlevelled* base and a named rung ("Data Analyst or Data Analyst Senior")
cannot be detected, because the unlevelled side carries no token to match. Two
rows. Ranking senior is the conservative read.

**Not defects, recorded so they are not re-litigated:** "Associate" is
genuinely ambiguous — a mid rung in banking, junior in engineering, and both
appear here — so it is documented rather than forced. And the five Invenergy
Development rows that looked like duplicates are distinct requisitions
(R11187-1, R11315-2, R10740-1, R11186, R10973-1); dedupe is working and my
first reading was wrong.

**Still outstanding from round 1:** `skill_cloud` on company blurbs,
`benefit_equity` on diversity language, `degree_stem` where a field name
describes the team, `soft_teamwork` possibly near-constant.


### Interim check — 2026-09-21, artifact integrity

Not a coding round. A check of the committed artifacts themselves, prompted by
reading run 21's output before rebuilding on it.

**Found:** `selection_funnel.json` reported `usable_with_pay` 103, its
`usable_by_metro` summed to 107, its `usable_by_employer` to 137, and the
committed `postings.csv` held 204 rows. Those quantities are computed from one
list with one filter in one pass, so no execution produces them.

**Cause:** the workflow's `-X ours` merged two runs' derived files. Detail in
`docs/limitations.md` §15.

**Resolution:** rebuilt from `data/raw/`, which was intact apart from four
duplicated records in one snapshot, also repaired. Post-rebuild all four
totals agree: 204 unique, 137 usable, 23 employers.

**Prevention:** `build_dataset.py` now refuses to write a funnel whose totals
disagree or a CSV whose row count differs from the count it just reported, and
the workflow regenerates derived artifacts rather than merging them.

**Why it is in the audit log.** The defect was in the artifact, not the coding
rules, so it belongs here for the same reason the coding rounds do: it was
found by reading real output, and it would not have been found by any test.

### Round 4 — 2026-09-22

**Target:** the industry umbrella itself, on the run-23 sample (221 unique in
scope, 154 usable). Rounds 1–3 audited the coding rules; nobody had audited
whether every admitted observation is actually energy, utility or data-center
work. That is the owner's one non-negotiable scope constraint.

**How it was found.** By reading the pay extremes after the rebuild, which is
the standing rule. Two titles in the top twelve did not belong in an energy
study: "Cloud and Health AI FinOps and Technology Value Optimization" and
"AWS Lakehouse Data Engineer", both Guidehouse. Reading all 65 Guidehouse rows
then showed the scale of it.

**Finding 1 — a multi-sector consultancy was 22% of the sample and almost none
of it was energy.** Guidehouse contributed 65 in-scope rows, 34 with disclosed
pay, making it the second-largest employer. Of its 74 postings, **three** are
energy work:

| Kept |
|---|
| Associate Director - AI & Data, Energy Providers |
| Data Scientist, Consultant (Utilities) |
| Senior Consultant - Energy Markets |

The rest are public health ("Epidemiologist Data Scientist", "Public Health
Data Engineer", "Business Analyst (Health)", "AI Strategy Associate Director -
State Health"), national security, federal law enforcement, fraud consulting,
and generic IT ("ServiceNow Business Analyst", "Palantir Platform Engineer",
"Senior Financial Management Data Engineer"). Charles River Associates was the
same story at smaller scale: antitrust, life sciences, forensics, intellectual
property and European competition, against ten roles explicitly labelled
"(Energy practice)".

**Why no existing guard caught it.** `sector_confidence()` judges a *board*,
and these boards genuinely do discuss energy, so they pass honestly; it also
applies only to unverified tokens, and Guidehouse's is hand-verified. The
`diversified` guard needs every off-umbrella line of business enumerated in
advance, which for a consultancy serving every sector of the economy is the
"pattern matching confidently and wrongly" failure this project keeps finding.

**Fix.** The burden is inverted for multi-sector employers:
`requires_sector_evidence: true` makes the *posting* prove it is energy work.
Applied to Guidehouse, Charles River Associates and The Brattle Group. It is
deliberately **not** applied to pure-play energy firms — E3's "Analyst" and
"Associate Consultant" are energy work by virtue of the firm, and the test
would wrongly drop them.

**Three versions of the test were measured against the committed snapshots and
two were discarded**, which is worth recording because each failed on real
rows rather than in principle:

| Test | Why it was rejected |
|---|---|
| One `STRONG_TERM` anywhere | Kept "Financial Transformation Business Analyst" on `feeder`, matching "feeder systems (procurement, travel, payroll, asset, grants)". Kept every CRA cybersecurity role on "NERC-CIP" listed beside NIST, HIPAA, ISO 27001 and SOC2 |
| Three distinct core sector words | Kept those same forensics roles and CRA's generic "Management Advisory Analyst", because the firm's boilerplate recites its practice areas and one of them is energy — **audit round 1's failure mode exactly** |
| Raw word counts | "Data Analyst/Power Platform" says "power" eleven times and is a Microsoft Power Platform role |
| **Sector word in the TITLE** (adopted) | A multi-sector consultancy states the practice in the title. Measured on all three boards: 3 of 74 at Guidehouse, 11 at CRA (every one energy-labelled), 3 at Brattle (all "Energy Analyst") |

The description is the firm's marketing; the title is the job. `power` is
excluded from the title-sufficient words for the Power Platform reason above,
while still counting toward board-level breadth.

**Finding 2 — `feeder` was an ambiguous `STRONG_TERM`.** Found by sweeping
every snapshot for a strong term firing on a posting containing no plain
sector word at all. `feeder` matched a federal financial-systems posting;
qualified to `distribution feeder`. The same sweep confirmed `data center`
(212), `colocation` (16), `switchgear` (4, on a posting sourcing switchgear
and transformers), `pjm` (2, on PJM's own board) and `demand response` (2) are
all firing correctly, so only one term needed changing.

**Finding 3 — screening flags were stamped at collection time.** `diversified`
and `off_umbrella` were written into each record by `collect/run.py`, so a new
guard could not be applied to snapshots already committed — it needed a fresh
collection to take effect. Screening is a decision about the corpus, not a
property of the fetch. `build_dataset.py` now reads the flags from
`config/employers.yaml` at build time, and config wins over the snapshot.

**Effect on the sample.** 337 postings rejected for lack of sector evidence.

| | Before | After |
|---|---|---|
| Usable observations | 154 | **120** |
| Distinct employers | 26 | **25** |
| Largest employer share | 25.3% | **32.5%** |
| Observations per regressor | 9.6 | **8.0** |

N falls and concentration gets **worse**, and both are the right direction:
Invenergy's 25.3% was flattered by off-umbrella rows padding the denominator,
so 32.5% is the honest figure. A floor met by counting public-health and
national-security consulting is not worth meeting.

**Effect on the headline, which is the important part.** The disclosure
contrast was previously sensitive to one jurisdiction, swinging from 50 to 71
points depending on the cut, and the paper had to hedge at length about
Virginia's three-month-old statute. It is now stable:

| Sample | Mandate | No mandate | Gap |
|---|---|---|---|
| All | 98.0% | 39.3% | 58.7pp |
| Excluding Virginia | 100.0% | 39.3% | 60.7pp |
| Excluding largest employer | 96.7% | 39.3% | 57.4pp |

**The "Virginia partial compliance" story was largely an artifact of including
a federal consultancy's non-energy postings.** 23 of the 25 non-disclosing
mandate-state postings were Guidehouse, and they were federal consulting work
in Virginia that never belonged in the study. Removing them removes the
sensitivity rather than explaining it away.

**Recorded as NOT a defect.** Eleven rows carry an empty `state` — these are
`remote_national` postings with no resolvable state, which is by design. But
see `docs/limitations.md`: they fall into the Midwest reference category of the
region dummies without being Midwest, which is a live misspecification and is
reported rather than silently fixed.

**Still open from earlier rounds.** `skill_cloud` on company blurbs,
`benefit_equity` on diversity language, `degree_stem` where a field name
describes the team rather than the requirement, and whether `soft_teamwork` is
near-constant. Round 4 went after the umbrella instead; these remain unchecked.

### Round 5 — the concept role screen and the nested repost (2026-09-22)

**Scope.** Every posting the new `include_concepts` matcher newly admitted was
read in full, plus the pay extremes and the employer concentration table of
the rebuilt dataset. This round audits a *screen change* rather than a sample,
so the unit is "rows that entered or left because of it".

**Result: 28 rows entered, 1 left, 4 false positives caught before the rebuild.**

### The four false positives

Found by reading all 40 titles the first version of the concept layer admitted.
None was predictable from the rule:

| Title | Why the concept layer matched | Why it is out |
|---|---|---|
| Site Reliability Engineer | `reliability` + engineering | IT uptime, not NERC reliability |
| Site Reliability Engineer — Disaster Recovery & Business Continuity | same | same |
| Manager/Senior Manager (Transfer Pricing practice) | `pricing` + `market` | tax practice |
| Associate Principal/Pricing & Market Access (Life Sciences practice) | `pricing` + `market access` | pharma |
| Residential Business Development Director | `development` | sales |

All five strings are now in `roles.concept_engineering_exclude` and pinned as
rejects in `tests/test_filters.py`.

### The 28 rows admitted, listed so a reader can check them

Charles River Associates (5, Energy practice — wholesale power markets,
transmission strategy, power and gas modelling, and a 2027 graduate analyst
role tagged `(Energy)`); New York ISO (6 — interconnection studies ×2, market
solutions engineering ×2, grid operations, grid transition); Origis Energy (5
— project development ×3, energy market analytics, interconnection);
Cypress Creek Renewables (2 — interconnection execution, development);
Silicon Ranch (2 — project development, interconnection project management);
Clearway Energy, Energy and Environmental Economics, Modo Energy, Octopus
Energy, Tract ×2, Voltus, Yes Energy (1 each).

All 28 are energy-sector analytic, development or market roles. Twelve of the
28 disclose no pay and so enter only the disclosure model's denominator.

### The nested repost

Tract published `Director, Utility Development` twice — requisitions
4343777009 (Alexandria + Denver + Remote US, posted 11 Aug) and 4372165009
(Alexandria + Remote US, posted 4 Sep) — with byte-identical descriptions and
identical $175,000–$190,000 pay. The dedupe key includes location, so both
survived.

A description-hash rule was measured before being rejected: 38 groups in the
corpus share employer, title and description across requisitions, and they are
genuine multi-city openings (Nexamp's Senior Interconnection Engineer in four
cities, Clearway's technicians in four states). Exactly **one** pair in 1,940
records has nested locations. The subset is now dropped; both cases are pinned
in `tests/test_pipeline.py`.

### Pay extremes, re-read per the standing rule

Low: Invenergy `Associate, Land Development` $46,500 and `Geospatial Scientist`
$47,500, both Illinois, both genuine entry-level bands. High: Invenergy
`Senior Director, Renewable Development` $240,000 and ERCOT
`Director - Data Products & AI Strategy` $236,500. All annual, none hourly-
annualised, none non-US. No implausible figure entered on this expansion.

### Nine rows carry no state

All nine are `metro=remote_national` — nationwide-remote US postings, which is
the designed category. They disclose at 55.6%, close to the 50.0% non-mandate
rate and far from the 96.1% mandate rate, which is consistent with their being
treated as uncovered. They are excluded from the region contrasts by the
robustness check already in `analyze.py`.


### Round 6 — run 26, and the pay parser that was still halving Invenergy (2026-09-22)

**Scope.** Collection run 26 (Actions 35744479596, commit `28244ea`) took the
dataset from 210 to 325 in-scope rows and from 165 to 231 usable. Every one of
the 115 added rows was read, matched to the audited commit `7180497` on `url`.
No row was removed and no existing row changed except `last_seen_run` on two.
Then the pay extremes, every employer on a shared parent tenant, and every
row the fixes below touched, across the **whole** corpus, not only run 26.

**Result: five substantive defects and three smaller ones, every one fixed
and pinned by a test built from the real string. Most were already in the
N = 165 deliverables, measured against `7180497`: 17 rows with a sub-$30,000
low bound (the halved Invenergy rows and the "k" rows), 9 NYISO rows at their
floor, Avangrid's "$30 billion" row, the 4 usable Hitachi and Iron Mountain
rows from other companies, and 4 usable Connecticut rows coded as covered.**

| | Unaudited run 26 | Audited |
|---|---|---|
| Usable observations | 231 | **214** |
| Unique in scope | 325 | 290 |
| Employer clusters | 36 | **34** |
| Largest employer | Invenergy 19.1% | **Invenergy 20.6%** (44 of 214) |
| Observations per regressor | 15.4 | 14.3 |
| Disclosure gap (mandate − none) | 49.9pp | **46.3pp** (93.9% of 164 vs 47.6% of 126) |

All four pre-registered conditions still pass. The gap narrows, and N falls.

#### Where the jump came from (measured, not assumed)

The handoff's prime suspect was the Workday page cap (25 → 150 pages). It
accounts for very little:

| Source | Added rows | Usable |
|---|---|---|
| Concept role screen reaching Workday for the first time | 96 | 59 |
| Three boards resolved for the first time (Alliant, Itron, GridPoint) | 11 | 7 |
| Page cap, Hitachi Energy only (8 → 24 postings) | 8 | 0 |

`make_detail_filter()` calls the same `screen_role()` as the build. Round 5
applied the concept screen to snapshots already on disk, but a Workday posting
the old title-only pre-screen rejected never had its description fetched, so
it could only arrive on the next collection. Run 26 was that collection.
Hitachi's tenant now lists **exactly 3,000 = 150 × 20** postings: it is
truncated again at the new cap. Guidehouse contributed nothing new. Its token
is `verified: false`, and the wider pre-screen let enough of its non-energy
titles through that `sector_confidence()` quarantined the board. Its three
rows come from earlier snapshots, and all three are energy work.

#### Defect 1 — the pay parser was still halving Invenergy (in the N = 165 data)

`d9e6a7b` fixed a window that opened inside the cents ("00 - $170,000.00") by
refusing a leading zero. A window opening one character earlier yields
"0,000.00 - $93,000.00" or "5,000.00 - 235,000.00", and those are well-formed
numbers. **Seventeen Invenergy rows were still recorded at half pay** (14 of
them already in the N = 165 data; 12 in Illinois, 5 in Colorado). Among
them was the lowest-paid row in the N = 165 deliverables, "Associate, Land
Development" at $46,500 = $93,000 / 2. Round 5 read that row and accepted it as
"a genuine entry-level band". The regression test passed because it handed
the parser the fragment directly and never exercised `_pay_windows()`.

Fixed at the cause: windows now widen to token boundaries (`_snap()`). A
second guard rejects any low bound below the federal minimum wage annualized
($15,080), whatever shape the next fragment takes. The same pass fixed three
related errors:

| Error | Rows | Example |
|---|---|---|
| "k" written once, on the upper figure | 3 | Cypress Creek "$200-235k" read as (200, 235,000) → $117,600; true $217,500 |
| Greenhouse's pay widget splits the range with markup | 12 | NYISO `<span>$68,900</span><span class="divider">-</span><span>$115,200 USD</span>` recorded as the floor, $68,900, on all nine NYISO rows. Flexential's range newly recovered |
| Company boilerplate read as pay | 1 | Avangrid "with **$30 billion** in assets" → $30/hour → $62,400, the lowest-paid row after the fix above. With that closed, "operations in **25** states" → $25/hour. The posting states no pay |

AEP's "Transmission System Operations Engineering Modeling Engineer" lists two
grade bands. The old value came from a window that cut through the first band,
so it was an artifact too. It now reads the first complete band. Putting
labelled cues ("compensation range") first was measured and rejected: it
changed 7 AEP rows and parsed "$42.13 - $128,688.00" as a single range.

#### Defect 2 — ranges of seniority read by keyword, not by alternative

The floor rule took the minimum over every rung **keyword** in a title:

| Title | Was | Now |
|---|---|---|
| Manager/Sr Manager Grid Implementation ($219k–$301k) | 3 | 5 |
| Senior Associate/Transmission Strategy and Planning | 1 | 3 |
| Associate Principal/Wholesale Power Markets Consultant | 1 | 4 |
| Director or Senior Director Project Development | 3 | 6 |
| Engineer I, Engineer II, Engineer III Grid Planning (commas stripped, so read as the ceiling) | 3 | 1 |
| Data Analyst or Data Analyst Senior (a known limitation since round 3) | 3 | 2 |

Each alternative is now ranked on its own, and the title takes the lowest. 11
rows changed, 5 of them usable.

#### Defect 3 — off-taxonomy roles through variant wordings (24 rows, 13 usable)

Each was read against its description. Each exclusion is the sibling of one
already in `config/scope.yaml`: HR ("Talent & Organizational Development"),
benefits/legal, procurement-policy compliance, accounting and financial
reporting, workplace services, AI security, and AutoCAD civil drafting.
**Equipment and IT "reliability engineers"** (AES inverter maintenance, Xcel
plant O&M, Vantage and STACK data-center critical systems, ERCOT's SRE role)
entered on the grid concept's "reliability" term. Grid reliability
("real-time reliability", "reliability compliance", NERC) is listed literally
and unaffected. QTS "Q-Systems", fire-protection and schedule-management
project managers are construction delivery.

**Left in, by the owner's decision (2026-09-23):** three QTS rows titled
plainly "Development Project Manager". Their descriptions are construction
project management, and the title is shared with genuine development roles.
The owner judged the role "somewhat analytical in nature" and in scope, so no
employer-specific rule was added. None discloses pay. Dropping them would move
the disclosure gap 46.3 → 45.1pp on this round's data, and 44.7 → 43.6pp on
round 7's.

#### Defect 4 — the "Hitachi Energy" cluster was not Hitachi Energy (in the N = 165 data)

The Workday tenant `hitachi/hitachi` is the whole group. **All three usable
rows filed as Hitachi Energy belonged to sister companies**: Hitachi High-Tech
America's semiconductor-metrology "Data Scientist I or II" and "AI Data &
Security Governance Engineer", and Hitachi Vantara Federal's "Federal Data
Engineer". Six undisclosed rows were Hitachi Digital Services and Vantara, and
"AIS and GIS" matched `gis` on gas-insulated switchgear. Across all 33 Hitachi
records, every genuine posting names Hitachi Energy ("Company Name: HITACHI
ENERGY USA INC") and none from a sister company does. `requires_company_mention`
now demands it. Iron Mountain's one usable row, a corporate SQL Server DBA for
the records business, fails the same test. That separation rests on only 8
collected records, and is recorded as such. The two changes cost two clusters
(36 → 34).

#### Defect 5 — Connecticut coded as a posting mandate two weeks early

`pay_mandate_states` dated CT 2021-10-01. That is its on-request law, which
the config's own comment excludes. The posting requirement is Public Act 26-12
(H.B. 5003), **effective 2026-10-01**, after every snapshot. The dates were
never read at all. `build_dataset` now applies them per snapshot. Six rows
move to `mandate_state = 0`, four of them disclosing, which narrows the gap.
NV (after-interview disclosure) and RI (on request, R.I.G.L. 28-6-22) were
removed under the same rule, with no row affected. Virginia (SB215/HB636,
effective 2026-07-01) was checked and is correct.

#### Smaller defects

- `geo.resolve()` ignored a stated state when the gazetteer lacked it. "Quincy,
  Washington" became Quincy, MA, which put Vantage's campus in the Boston
  study metro. 1 row.
- `off_umbrella()` matched substrings ("rail" in "trail", "mail" in "email").
  Measured to change no row, and made word-bounded.
- This log's round 5 sat inside the template's HTML comment and never rendered.

#### Checked and found clean

- **Duplicates.** No description is shared across employers, and no
  title+pay pair either. Eversource's four "Project Manager II, Transmission"
  rows are four requisitions (R-029937-1, R-030327, R-031394, R-030218) with
  different sites and dates. The two "Grid Operations Technology" pairs differ
  in requisition and are 24–32% similar in text. WGL R6817 and R6996 are 99.98%
  identical and posted the same day, but they are two requisitions, which the
  dedupe policy counts as two openings. PJM's REQ-2026-4190 and 4206-1 the same.
- **Avangrid attribution** (handoff open item since round 4). All 13 rows name
  Avangrid, UIL, NYSEG or RG&E and sit in the US. Verified.
- **`skill_cloud`**, which is new near the threshold. 23 of 24 firing rows name
  AWS, Azure or Kubernetes as a job requirement. The exception is Vantage's
  "WRI Aqueduct, AWS", where AWS is the Alliance for Water Stewardship.
  Round 1's boilerplate concern does not hold here.
- **Pay extremes after the rebuild.** Lowest: Invenergy "Analyst, Development"
  $68,500 (IL, CO), NYISO "Associate Market Solutions Engineer" $92,050.
  Highest: ERCOT "Manager/Sr Manager Grid Implementation" $260,000, Invenergy
  "Senior Director, Renewable Development" $240,000. Two hourly rows remain,
  both CAISO at a stated $45.10–$63.15. Five single figures remain, each a
  stated "$" amount. No non-US row.

#### What it did to the findings — the reason this round matters

Refit with the fixes applied one at a time (clustered OLS):

| Step | `mandate_state` | `region_west` | `region_south` | `seniority_rank` |
|---|---|---|---|---|
| Run 26 unaudited | −0.171 (p .002) | +0.116 (p .001) | +0.189 (p .000) | +0.091 |
| + pay window / k fix | **−0.063** (p .047) | **+0.023** (p .548) | +0.089 (p .017) | +0.102 |
| + seniority ranges | −0.057 | +0.025 | +0.081 | +0.112 |
| + role and group-company screens | −0.047 | +0.022 | +0.092 | +0.116 |
| + widget / boilerplate pay, CT dates | −0.038 (p .199) | +0.018 | +0.082 | +0.121 |

**The 17 halved rows were all Invenergy's and all in mandate states, twelve
of them in Illinois, which is also the Midwest reference category.** Halving
them depressed the mandate group and the reference region at once. That
produced a negative `mandate_state` level effect and inflated the region
dummies. The deliverables explained the negative mandate coefficient as
disclosure selection ("the employers that volunteer a range are the ones
paying well"). That story rested substantially on a parser defect, and it is
withdrawn.

Bootstrap (9,999 reps, 34 clusters) and region-robustness verdicts:

| Variable | Coef | Bootstrap p | Region check p | Verdict |
|---|---|---|---|---|
| `seniority_rank` | +0.121 | 0.0001 | 0.0005 | **survives** |
| `region_northeast` | +0.107 | 0.0324 | 0.0565 | withdrawn by the region check |
| `skill_cloud` | +0.124 | 0.0455 | 0.058 | withdrawn by the region check |
| `region_south` | +0.083 | 0.1104 | — | not significant |
| `mandate_state` | −0.038 | 0.2506 | — | not significant |
| `region_west` | +0.018 | 0.6376 | — | not significant |

`region_west` and `mandate_state` both passed the bootstrap on the unaudited
data. **Both were artifacts.** H1 is the only finding standing. The disclosure
contrast (H2) is unaffected in sign and size. It is associational, not
causal: one cross-section.


### Round 7 — run 27, the first live run of the description cache (2026-09-22)

**Scope.** Collection run 27 (Actions 35781235535, data commit `c4b6337`) was
dispatched with `no_slugs: true` to test the detail cache against live
boards. The cache statistics were read, disclosure was compared across
snapshots, and every added, removed and changed row was read against the
audited round-6 dataset, matched on `url`.

**The cache worked.** `manifest["detail_cache"]`: 733 cached records, **236
reused, 373 fetched, 0 stale, 0 edited**. Every one of the 373 misses was a
posting absent from the cache. Every posting the cache held inside its
window was reused. Reuse was 39% of detail fetches, not "most", for a reason
predicted before the run: run 27 had the same date as run 26, and the loader
skips the in-progress date's directory, so everything first seen that day
was refetched. A next-day run caches the previous day. **Disclosure did not
drift**: the 166 reused postings kept their disclosure status, and none of
the 76 postings refetched and also seen on 09-21 changed it. Over the 09-21
to 09-22 snapshots, 247 Workday postings refetched showed no change either.
The daily cron stays.

**Seven rows were added, all read.** AEP ×4 (Infrastructure Engineer Lead –
Cloud AI; Supply Chain Business Analyst; Regulatory Consultant – Principal;
DSO Real-Time Reliability Coordinator, admitted by round 6's "real-time
reliability" include), Avangrid Program Manager – Clean Energy Policy (CT, so
correctly uncovered until 2026-10-01), PJM (Sr./Lead) Compliance Analyst (II),
and Xcel Transmission Planning Supervisor. All are in the taxonomy, with
coherent pay. None came from the round-6 screens failing.

**Defect 1 — a second run on the same date overwrote the first run's
files.** Snapshots are one directory per date and one file per board, so
run 27 replaced run 26's 09-22 files. 39 records vanished across 17 files.
Most were titles round 6 now excludes, which run 27's pre-screen correctly
no longer fetched. One was a genuine loss: Alliant's "Engineer I - Grid
Planning" ($66,000–$85,000, disclosed). It closed between 15:03 and 20:35
(the board dropped from 46 to 45 postings), and its only record was
overwritten. `collect/run.py` now merges with an earlier same-day file
(`merge_same_day()`; this run's copy of a posting wins). The 39 records were
restored from run 26's committed files (`348d8a7`) by that same function.

**Defect 2 — an edited requisition was counted twice.** The dedupe key is
employer + title + location. Cypress Creek retitled "Director, Interconnection
Execution" ($200,000–$230,000) to "Associate Director / Director, ..."
($180,000–$230,000) on the same Greenhouse job id, and Origis reformatted a
location string on an unchanged posting. Each edit made a second key, so run
27 held two duplicate URLs, one of them usable. `collapse_same_url()` now
keeps one row per employer + URL: the latest version, with the earliest
`first_seen_run`. Before run 27 no two of 290 rows shared a URL, and Nexamp's
four-city openings carry four different URLs, so the rule does not touch
genuine multi-site postings. The pipeline fixture had given every record the
same placeholder URL; it now uses one per job id, as real boards do.

**Also found while regenerating.** The paper's conclusion carried three
sentences that did not depend on the estimates. It said "the prediction that
a stated degree requirement would raise pay was wrong", but the estimate is
+0.005, the predicted sign, at p 0.90. It said "too few employers contribute
and one contributes too much" after both conditions had passed. And it said
the disclosure gap is "too large to be explained by employer composition
alone", a causal claim. All three are now computed or strictly associational.
The paper said the scope widened "three times"; limitations 10 documents four.

**Result.**

| | Round 6 (audited, N=214) | Run 27, unaudited | Run 27, audited |
|---|---|---|---|
| Usable N | 214 | 220 | **220** (Alliant restored, Cypress duplicate removed) |
| Clusters | 34 | 34 | **34** |
| Largest employer | Invenergy 20.6% | 20.0% | **Invenergy 20.0%** |
| Disclosure gap | 46.3pp | 44.1pp | **44.7pp** (93.9% of 165 vs 49.2% of 132) |

**The verdicts moved, and the move is fragility, not a finding.**
`skill_cloud` (bootstrap p 0.046 → 0.031; region check 0.058 → 0.038) and
`region_northeast` (0.032 → 0.010; 0.057 → 0.025) now pass both hurdles. Six
added observations took two verdicts across 0.05. The two fixes above are not
why: the unaudited run-27 analysis already showed it (0.029 / 0.034 and
0.014 / 0.034). `skill_cloud` was checked for being driven by one row.
Without the new AEP "Cloud AI" row, p is 0.037. With the one known
miscode (Vantage's "AWS", the Alliance for Water Stewardship) set to 0, p is
0.025. Both changes together give 0.030. The miscode was **not** corrected in
the coding rule, because correcting it would strengthen the finding it sits
in. `seniority_rank` (+0.119, p 0.0001 / 0.0005) is unchanged.
`mandate_state` stays insignificant (−0.029, p 0.30).

<!--
Round template. (Until audit round 6 the comment opened above round 5, so
round 5 was committed inside it and never rendered.)

### Round N — YYYY-MM-DD
- Sample: 100 postings, seed 20260920
- Mean accuracy: X.XX
- Below threshold: [list]
- Changes made: [what patterns were edited]
- Re-scored accuracy: X.XX
-->

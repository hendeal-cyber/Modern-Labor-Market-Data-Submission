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


<!--
Round template:

### Round N — YYYY-MM-DD
- Sample: 100 postings, seed 20260920
- Mean accuracy: X.XX
- Below threshold: [list]
- Changes made: [what patterns were edited]
- Re-scored accuracy: X.XX
-->

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

<!--
Round template:

### Round N — YYYY-MM-DD
- Sample: 100 postings, seed 20260920
- Mean accuracy: X.XX
- Below threshold: [list]
- Changes made: [what patterns were edited]
- Re-scored accuracy: X.XX
-->

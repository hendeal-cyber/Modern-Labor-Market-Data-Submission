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

_No audit rounds yet — the first requires live collected data._

<!--
Round template:

### Round N — YYYY-MM-DD
- Sample: 100 postings, seed 20260920
- Mean accuracy: X.XX
- Below threshold: [list]
- Changes made: [what patterns were edited]
- Re-scored accuracy: X.XX
-->

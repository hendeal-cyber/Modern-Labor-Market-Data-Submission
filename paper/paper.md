# Advertised Pay in Early-Career Software and Data Roles
## Evidence from Utility and Data Center Operators in Chicago and Indianapolis

*Built from data collected through 2026-09-20. Collection cycles: 1.*

## 1. Introduction

Data center construction is driving a wave of technical hiring across the
utility sector and the colocation operators that depend on it. Both compete
for early-career software and data talent against employers who pay on a
national technology scale. This paper asks which attributes stated in a job
posting predict the pay that employers advertise for those roles.

The dependent variable is the natural log of the midpoint of the
employer-stated pay range, annualized to US dollars.

## 2. Institutional background

Illinois House Bill 3129, amending the Illinois Equal Pay Act, took effect on
1 January 2025. Employers with fifteen or more employees must state the pay
scale and describe benefits in any posting for work performed at least partly
in Illinois. Both the dependent variable and several benefit regressors are
therefore legally required to appear in Chicago-area postings.

Indiana has no comparable requirement. Indianapolis postings disclose pay far
less often, and those that do are self-selected. The indicator `mandate_state`
carries this contrast into the analysis rather than leaving it implicit.

## 3. Data

### 3.1 Source

Postings are collected from the public, unauthenticated applicant tracking
system APIs that employers publish through, which are the upstream source for
the job boards those postings appear on. LinkedIn is not used: its User
Agreement prohibits programmatic collection. Full methodological detail,
including the compliance posture, is in `docs/methods.md`.

### 3.2 Sampling frame

The frame is restricted to core operators — firms that own or operate
utilities or data centers — excluding the engineering firms and equipment
vendors that serve the sector. Roles are restricted to software, data and
analytics. Early career means three years or fewer of required experience.

> **Known gap.** Exelon and ComEd run iCIMS, which exposes no free public
> jobs API. They are the largest Chicago-headquartered utility employer and
> the most likely source of Chicago early-career software and data roles.
> Results describing "Chicago utilities" exclude them.

### 3.3 Selection funnel

| Stage | Postings |
|---|---|
| Retrieved from ATS boards | 7 |
| Unique after de-duplication | 0 |
| With a disclosed pay range (estimation sample) | 0 |

Rejections by reason:

| Reason | Count |
|---|---|
| `role_not_software_data` | 5 |
| `no_experience_signal` | 4 |
| `seniority_excluded` | 2 |
| `internship` | 1 |
| `role_excluded` | 1 |

Distinct employers contributing a disclosed range: **0**. By metro: `{}`.

> The pre-registered floor of 100 usable
> observations is **not yet met**. Collection continues; the escalation
> rule in `config/scope.yaml` governs what widens if it stays unmet.

### 3.4 Regressor coding and audit

Regressors are coded from posting text by word-boundary pattern matching
against a dictionary declared in `config/regressors.yaml`. Every coded value
retains the pattern that produced it. Definitions are in `docs/codebook.md`.

*TODO: no audit has been scored yet. Run `src/lmstudy/audit.py sample`,
hand-code the sheet, then `audit.py score`. Accuracy claims must not be
made until this exists.*

## 4. Empirical strategy

The specification regresses log advertised pay on posting attributes, with
standard errors clustered by employer because employers contribute many
postings each. A core model is pre-specified; an extended model is estimated
only when the sample supports roughly twenty observations per regressor, so
the specification is chosen by sample size rather than by results.

Cluster-robust standard errors are biased downward when clusters are few.
Simulation with twelve employer clusters recovered nominal 95% coverage of
only about 88%. Where the realized employer count is small, a wild cluster
bootstrap should precede any claim resting on a marginal p-value.

## 5. Results

*TODO: no analysis artifact. Run `src/lmstudy/analyze.py`.*

## 6. Threats to validity

These are treated at length in `docs/limitations.md`. In short: the outcome is
advertised pay rather than realized pay; disclosure is selected, and that
selection is concentrated in Indiana where no mandate applies; the panel has
no historical backfill, so the opening sample over-represents long-open roles;
rule-based coding misreads some postings, which the audit measures rather than
assumes away; standard errors under-cover when employer clusters are few; and
Exelon and ComEd are absent from the frame entirely.

## 7. Conclusion

*TODO: pending results.*

## Appendix

- `docs/codebook.md` — every variable and its coding rule
- `docs/methods.md` — design, compliance posture, estimation strategy
- `docs/limitations.md` — what the data cannot support
- `docs/audit-log.md` — coding accuracy by round
- `data/analysis/postings.csv` — the analysis dataset
- `data/analysis/selection_funnel.json` — full funnel and rejection reasons

Reproduce with `pip install -r requirements.txt && python tests/run_all.py`,
then `python src/lmstudy/collect/run.py && python src/lmstudy/build_dataset.py`.

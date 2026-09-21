# Methods

## Research question

What posting-level attributes predict advertised pay in the **United States
energy and data center sector**?

Secondary, and in practice the better-identified question: **does a state
pay-transparency mandate change whether pay is disclosed at all?**

Dependent variable: `log(pay_midpoint)`, the natural log of the midpoint of the
employer-stated pay range, annualized to USD.

### How this differs from the original question

The study was designed around early-career software and data roles within 35
miles of Chicago or Indianapolis. Measured against real postings, that scope
returned **zero** usable observations, and three successive widenings — role
taxonomy, then metros, then national scope with seniority as a regressor —
were each chosen after measuring what the previous one yielded.

The original question survives as a **pre-specified subsample**
(`early_career`), reported whether or not it agrees with the full sample.
Because the widening was data-driven rather than pre-registered, the
specification was fixed in `docs/pre-registration.md` before the national
sample was collected, and every change made afterwards is a dated amendment in
its section 8. `docs/limitations.md` §10 states plainly what a reader should
discount for.

## Why not LinkedIn

The study was originally conceived as a LinkedIn scrape. That is not possible
within LinkedIn's terms. Section 8.2 of the LinkedIn User Agreement prohibits
using "software, devices, scripts, robots or any other means or processes (such
as crawlers, browser plugins and add-ons or any other technology) to scrape or
copy the Services." This covers the unauthenticated `jobs-guest` JSON endpoint
commonly used in scraping tutorials, not merely browser automation. There is no
compliant, zero-cost programmatic path to LinkedIn job postings.

## Sampling frame

Postings are collected **directly from the applicant tracking systems (ATS)
that employers publish through** — the upstream systems that syndicate to job
boards including LinkedIn. Every endpoint used is public, documented and
unauthenticated:

| Platform | Endpoint |
|---|---|
| Greenhouse | `boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` |
| Lever | `api.lever.co/v0/postings/{token}?mode=json` |
| Ashby | `api.ashbyhq.com/posting-api/job-board/{token}?includeCompensation=true` |
| SmartRecruiters | `api.smartrecruiters.com/v1/companies/{token}/postings` |
| Workable | `apply.workable.com/api/v1/widget/accounts/{token}?details=true` |
| Recruitee | `{token}.recruitee.com/api/offers/` |
| Workday CXS | `{tenant}.wd{N}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs` |

This yields the employer's own untruncated description text and its own stated
pay range. Aggregator APIs were rejected as a backbone because they truncate
descriptions and often return model-*predicted* salaries; regressing a predicted
salary on job attributes would be circular.

### Scope revision, 2026-09-21

The study originally scoped software/data/analytics roles at core operators
only, within 35 miles of Chicago or Indianapolis. Measured against ~2,578 real
postings from 16 employer boards, that scope returned **zero** usable
observations: under 0.5% of these employers' postings are software/data roles
anywhere on earth, and what utilities and data center operators post in these
metros is energy and engineering work.

Rather than estimate the alternatives, a **probe collection** gathered every
in-metro posting regardless of role into `data/probe/`, separate from the
analysis dataset, so each candidate scope could be counted. That measurement
drove three changes, each verified before adoption:

- **Roles** widened from software/data to the energy analytics families these
  employers actually hire into: siting and development, regulatory and
  compliance, market and procurement, grid and power-system analytics, AI/ML,
  GIS, energy finance, and software/data. Engineering is admitted only where
  analytics-adjacent, so licensure does not become the dominant pay driver.
- **Metros** extended to Tier 3 (Northern Virginia, Denver, Twin Cities,
  Seattle) under the escalation pre-registered in `config/scope.yaml`, measured
  to roughly double the yield.
- **Experience** postings that state no minimum are admitted rather than
  dropped, with `yrs_exp_stated` carrying the imputation into the model.
  Dropping them cost roughly half the sample.

The **population is therefore the energy and data center sector**, not core
operators, and the write-up must describe it that way. `industry` is a
categorical regressor across utility, cooperative, retailer, grid operator,
data center operator, energy analytics, developer, consulting and grid vendor.

### Employer frame and how tokens are trusted

The frame spans 266 employers. A minority were verified by reading the token
off the employer's own careers URL; most were derived from company-name slugs,
which carries a real hazard: a slug can land on a different company sharing a
name. An Ashby board at token `constellation` turned out to belong to a San
Francisco AI startup rather than Constellation Energy, and only the geography
filter kept it out of the dataset.

Checking whether the employer's **name** appears on the board does not solve
this — both companies are called Constellation. Checking the board's **sector**
does. `sector_confidence()` measures the share of a board's own postings that
discuss substations, interconnection, megawatts, colocation and similar. Real
energy boards score 86–100%; the false-positive board scores 0%. Any employer
entry marked `verified: false` must clear a 25% threshold before contributing
data; anything below is quarantined to `_candidates_for_review.json` for a
person to confirm.

**Diversified employers** are declared in `config/employers.yaml` with an
`off_umbrella` list. Iron Mountain is primarily records management and its
board served CDL drivers and warehouse staff; Hitachi's Workday tenant covers
rail, elevators and medical imaging. Neither belongs in an energy study, and
the employer frame alone cannot tell them apart — the title has to.

## Compliance posture

- Only public, unauthenticated endpoints are contacted. Nothing is logged into.
- No access control, rate limit or bot mitigation is circumvented.
- Requests carry a descriptive `User-Agent` naming the project and linking the
  repository.
- Requests to a given host are spaced by at least one second.
- `ETag`/`If-None-Match` caching avoids re-transferring unchanged boards.
- `robots.txt` is respected for any HTML retrieval.

## Why Illinois makes this feasible

Illinois **HB 3129**, amending the Illinois Equal Pay Act, took effect
**1 January 2025**. Employers with 15 or more employees must include the pay
scale **and a general description of benefits and other compensation** in any
posting for a role performed at least partly in Illinois. Both the dependent
variable and several benefit regressors are therefore legally mandated to appear
in Chicago-area postings.

**Indiana has no comparable law.** Indianapolis postings disclose pay far less
often, and those that do are self-selected. `mandate_state` is carried as a
regressor so this contrast can be examined rather than ignored, but
Chicago-versus-Indianapolis pay comparisons must be read with that selection in
mind.

## Time design

ATS endpoints expose **currently open postings only**; there is no historical
archive, so earlier-2026 postings cannot be recovered retroactively. The panel is
therefore built prospectively: the first run captures the open **stock**, and
each weekly run appends the **flow** of newly appeared postings. `first_seen_run`
and `last_seen_run` together give an observed time-on-market.

## Screening

Applied in order, with every rejection counted in `selection_funnel.json`:

1. **Role** — title matched against a software/data/analytics taxonomy.
   Facilities, technician, electrical/power, network, IT support, security and
   commercial roles are excluded.
2. **Early career** — minimum years of experience parsed from the text; kept at
   ≤ 3 years. Postings stating no requirement are kept only on an explicit
   entry-level title signal. Senior/Staff/Principal/Lead/Manager titles are dropped.
3. **Internships** — interns and co-ops dropped; full-time rotational and
   development programs retained.
4. **Geography** — location resolved offline against a gazetteer and kept within
   35 miles of a metro centroid. Remote postings are kept when a study metro is
   eligible, with `work_arrangement` carried as a regressor.

## Pay extraction

Structured ATS compensation fields are preferred; text parsing is the fallback.
Hourly rates are annualized at 2,080 hours and flagged via `hourly_original`.
Values outside $25,000–$400,000 are rejected as implausible. Point values (not
ranges) are flagged via `pay_single_figure` for sensitivity analysis.

## Regressor coding

Rule-based and inspectable: `config/regressors.yaml` declares every pattern, and
matching uses **word boundaries rather than substring containment**. Each coded
value retains the pattern that produced it so the audit stage can compute
per-regressor precision and recall.

## Audit

Each coding round draws a stratified random sample of 100 postings for hand
checking against the rules. Per-regressor precision, recall, F1 and Cohen's
kappa are computed; anything below 0.90 agreement is refined. A held-out gold
standard set in `data/gold/` is never tuned on, so reported accuracy is
out-of-sample. Rounds are appended to `docs/audit-log.md`.

## Estimation

Primary specification is OLS on `log(pay_midpoint)` with HC3 robust standard
errors **clustered by employer**, since employers contribute multiple postings.
A pre-specified core model (8–10 regressors) is reported when N is small; the
extended model is used only when N supports roughly 20 observations per
regressor. Diagnostics cover VIF, residual behaviour and influence. Selection is
examined by comparing observables between disclosing and non-disclosing
postings, and by modelling disclosure as its own outcome.

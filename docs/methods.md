# Methods

## Research question

What posting-level attributes predict advertised pay for **early-career
software, data and analytics roles at utility and data center operators** in the
Chicago and Indianapolis metropolitan areas?

Dependent variable: `log(pay_midpoint)`, the natural log of the midpoint of the
employer-stated pay range, annualized to USD.

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

The employer frame (`config/employers.yaml`) is restricted to **core operators**:
firms that own or operate utilities or data centers. Engineering/EPC firms and
equipment vendors serving the sector are deliberately excluded.

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

# Decision log

*Copied from this project's working plan file on 2026-09-22. That file lived in
the authoring session's scratch directory, which is reclaimed when the session
ends, so it is preserved here.*

**This is a historical record, not current documentation.** It is ten sections
written oldest-first, each superseding parts of the ones before it, and the
early sections describe a study that no longer exists — the original scope was
early-career software and data roles within 35 miles of Chicago or
Indianapolis, which measured **zero** usable observations against real
postings. Where sections conflict, the later one wins.

For what the study currently is, read in this order:

| Question | File |
|---|---|
| Where things stand, and what to do next | `../HANDOFF.md` §0, §0.5 |
| What was committed before the data was seen | `pre-registration.md` |
| Design, compliance posture, estimation | `methods.md` |
| What the results cannot support | `limitations.md` |
| Variable definitions | `codebook.md` |
| Coding accuracy by round | `audit-log.md` |

## Why keep it

Three reasons it is worth more than its tidiness suggests.

**It records what each scope decision was worth at the time it was made.** The
widenings were data-driven rather than pre-registered — a real methodological
weakness, disclosed in `limitations.md` §10 — and this log is the auditable
record of the measurements behind each one. A reader discounting the results
can check what was known when.

**It records the failures in full**, including several that produced confident
wrong answers rather than crashes: a pay range parsed as $93,600 instead of
$104,000, 168 transit-dispatcher postings entering an energy study, a Warsaw
role at $309,500 becoming the highest-paid US observation, a BEA deflator
fetched in place of a price index, and a funnel whose own totals disagreed with
its own CSV. Each entry says how it was found, and in most cases the answer is
"by reading the real output", not "by a test failing".

**It records reasoning that was later reversed**, with the reversal. Two
recommendations of mine were withdrawn after measurement contradicted them, and
one estimate was overstated and corrected. Those are left in rather than
cleaned up, because a decision log that only contains the decisions that
survived is not evidence of anything.

---

# Early-Career Pay Determinants in Utility & Data Center Software/Data Roles

## Context

The goal is a regression study of **what drives advertised pay** in early-career
software/data job postings at **utility and data center operators**, using
**log(pay range midpoint)** as the dependent variable and ~15–25 posting
attributes as regressors.

Two findings from this session reshaped the original approach, both verified:

1. **LinkedIn cannot be scraped within its ToS at any budget.** User Agreement
   §8.2 prohibits "software, devices, scripts, robots… (such as crawlers,
   browser plugins…) to scrape or copy the Services." That covers the
   `jobs-guest` JSON endpoint, not just Playwright/Selenium. The user accepted
   any job board, so the study uses **public, unauthenticated ATS APIs** — the
   upstream systems companies syndicate to LinkedIn *from*. Full description
   text, employer-stated pay, no key, $0, no ToS conflict.

2. **This session cannot collect data.** The egress proxy returns 403 at CONNECT
   for every job host tested (`linkedin.com`, `boards-api.greenhouse.io`,
   `api.lever.co`, `api.ashbyhq.com`, `api.smartrecruiters.com`, `themuse.com`,
   `api.adzuna.com`, `data.usajobs.gov`, `public.api.careerjet.net`).
   **Collection runs in GitHub Actions**, which has open internet. The repo is
   public, so Actions minutes are free and unlimited.

What makes the study viable: **Illinois HB 3129** (effective 2025-01-01) requires
employers with 15+ employees to publish **pay scale and a benefits description**
in postings for Illinois work. The dependent variable and several regressors are
legally mandated to be present.

The hard constraint: **N ≥ 100 usable observations is non-negotiable.**

## Decisions locked with the user

| Dimension | Decision |
|---|---|
| Source | ATS-direct APIs (Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee, Workday CXS) |
| Execution | GitHub Actions, weekly cron |
| Time design | Current open **stock** now + weekly **flow**; ATS APIs have no history, so 2026 backfill is impossible |
| Industry | **Core operators only** — utilities and data center operators. Not engineering firms, not vendors |
| Roles | **Software, data, and analytics only** (SWE, data eng, data science, analytics, BI, ML, DBA) |
| Early career | ≤3 years required experience, plus title signals; exclude Senior/Staff/Principal/Lead/Manager |
| Internships | Excluded; full-time rotational/development programs kept |
| Geography | Tier 1: 35 mi of Chicago. Tier 2: 35 mi of Indianapolis |
| DV | `log(pay range midpoint)`; hourly annualized at 2,080 hrs with a unit flag |
| Missing pay | Drop, but report counts and test disclosed-vs-non-disclosed selection |
| Remote | Included when a study metro is eligible; arrangement is a regressor |
| Coding | Rule-based fuzzy extraction + iterative hand audit |
| Audit | 100-posting stratified sample per round, held-out gold set |
| Stack | Python end-to-end (pandas + statsmodels) |
| Storage | Full raw text committed to the public repo |
| Deliverable | Paper + dataset + code + presentation |

### Known risk the user accepted

**Indiana has no pay transparency law.** Indianapolis postings will disclose pay
far less often than Chicago's, and those that do are self-selected — so
Indianapolis will contribute fewer usable rows than its posting count suggests,
and Chicago-vs-Indianapolis pay comparisons carry selection risk. The user chose
Indianapolis anyway. Mitigations: `mandate_state` becomes a regressor (the
contrast is genuinely interesting), and a **Tier 3** is pre-registered but
dormant — mandate-state metros (Northern Virginia, Denver, Minneapolis, Seattle)
— triggered **only** if Chicago + Indianapolis fail the N ≥ 100 floor after
three collection cycles.

## Repository layout

Target: `hendeal-cyber/Modern-Labor-Market-Data-Submission` (empty), cloned at
`/home/user/modern-labor-market-data-submission`, branch
`claude/wonderful-tesla-53lgo4`.

```
config/
  employers.yaml     # curated frame: operator -> ATS platform + board token
  scope.yaml         # tiers, metro centroids, radii, role taxonomy, exclusions
  regressors.yaml    # the coding dictionary (patterns per regressor)
src/lmstudy/
  collect/ats.py     # one adapter per ATS platform
  collect/discover.py# board-token discovery from company-name slugs
  collect/run.py     # orchestration, raw snapshot writer
  normalize.py       # ATS schemas -> canonical posting record
  geo.py             # metro assignment via haversine + Census gazetteer
  filters.py         # industry / role / early-career / internship screens
  pay.py             # range parsing, hourly annualization, log midpoint
  code_regressors.py # rule-based regressor extraction
  dedupe.py          # cross-source and repost deduplication
  audit.py           # stratified sampler, agreement scoring vs gold set
  analyze.py         # OLS, diagnostics, tables, figures
data/raw/YYYY-MM-DD/ # immutable JSON snapshots, one dir per run
data/gold/           # hand-coded audit set (never tuned on)
data/analysis/postings.csv
docs/                # methods.md, codebook.md, audit-log.md, limitations.md
paper/
.github/workflows/collect.yml
```

## Implementation

### 1. Employer frame (`config/employers.yaml`)

Curated list of **core operators**, each with ATS platform and board token:

- **Utilities (Chicago):** Exelon, ComEd, Constellation Energy, Nicor Gas /
  Southern Company Gas, Peoples Gas / WEC Energy, Invenergy, Vistra,
  Illinois American Water, Aqua Illinois.
- **Utilities (Indianapolis):** AES Indiana, Citizens Energy Group,
  Duke Energy Indiana, Indiana American Water.
- **Data center operators (both metros):** Equinix, Digital Realty, QTS,
  Aligned, CyrusOne, CoreSite, Cologix, DataBank, TierPoint, Flexential, NTT,
  Vantage, STACK, Prime, EdgeConneX, Iron Mountain, T5, plus hyperscaler data
  center organizations.

`discover.py` probes candidate board tokens derived from company-name slugs
against each ATS to find boards not yet in the list; a miss is a harmless 404.
Every discovered token is written back to `employers.yaml` for review, so the
sampling frame stays explicit and documentable in the methods section.

### 2. Collection (`collect/ats.py`)

One adapter per platform, all unauthenticated GETs (Workday is a POST):

| Platform | Endpoint |
|---|---|
| Greenhouse | `boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` |
| Lever | `api.lever.co/v0/postings/{token}?mode=json` |
| Ashby | `api.ashbyhq.com/posting-api/job-board/{token}?includeCompensation=true` |
| SmartRecruiters | `api.smartrecruiters.com/v1/companies/{co}/postings` |
| Workable | `apply.workable.com/api/v1/widget/accounts/{token}?details=true` |
| Recruitee | `{co}.recruitee.com/api/offers/` |
| Workday | `{tenant}.wd{N}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs` (POST) |

Compliance posture, documented in `docs/methods.md`: descriptive User-Agent with
project and contact, ≤1 request/sec per host, ETag caching, robots.txt respected
for any HTML fetch, no authentication, no circumvention of any control.

Raw responses land immutably in `data/raw/<date>/`, so every later stage is
re-runnable without re-collecting.

### 3. Screening (`filters.py`, `geo.py`)

- **Geo:** haversine distance from Chicago Loop (41.8781, -87.6298) and
  Indianapolis (39.7684, -86.1581), 35-mile radius, using the free public-domain
  **Census Gazetteer** place/ZIP centroid file (downloaded once, cached in repo).
- **Role:** title + description matched against a software/data/analytics
  taxonomy; excludes facilities, technician, electrical/power, network, IT
  support, security, and sales roles.
- **Early career:** parse stated experience minimums; keep ≤3 years; keep
  untstated-experience postings only when title signals entry level
  (Associate, Junior, I/II, New Grad, Entry, Rotational, Development Program);
  exclude Senior/Staff/Principal/Lead/Manager/Director.
- **Internships:** excluded; rotational/development programs retained.

### 4. Pay extraction (`pay.py`)

Prefer structured compensation fields (Ashby, some Greenhouse metadata), fall
back to regex over description text: `$X - $Y`, `$X/hr`, `USD X–Y`, "per year",
"annually", `$85,000.00`. Records `pay_min`, `pay_max`, `pay_unit`,
`pay_source` (structured vs parsed), `pay_disclosed`. Hourly × 2,080 with
`hourly_original` flag. DV = `log((pay_min + pay_max) / 2)`.

### 5. Regressors (`config/regressors.yaml`, `code_regressors.py`)

Coded as an inspectable dictionary, grouped so the final model can be selected
against available N:

- **Human capital:** `degree_required`, `degree_stem`, `advanced_degree_pref`,
  `yrs_exp_min`, `prior_internship_req`, `certification_req`
- **Technical skills:** `python_r`, `sql`, `cloud`, `ml_ai`, `viz_bi`
- **Soft skills:** `teamwork`, `communication`, `leadership`
- **Job context:** `work_arrangement`, `travel_req`, `on_call`,
  `security_clearance`, `union`
- **Benefits (IL-mandated):** `health`, `retirement_match`, `bonus`,
  `equity`, `paid_leave`, `tuition_reimbursement`, `relocation`
- **Employer/context controls:** `industry` (utility vs DC operator), `metro`,
  `mandate_state`, `ats_platform` (the user's "which board" idea — a provenance
  control, not a labor-market attribute), `posting_age_days`, `employer_size`

### 6. Analysis (`analyze.py`)

- Primary: OLS on `log(midpoint)`, **HC3 robust SE clustered by employer**
  (multiple postings per employer violate independence).
- Pre-specified **core model** (8–10 regressors, safe at N≈100) and **extended
  model** (up to ~25, used only if N supports it at ~20 obs/regressor).
- Diagnostics: VIF, residual plots, influence, employer-FE robustness.
- **Power analysis** reporting detectable effect size at realized N.
- **Selection:** compare observables between disclosed and non-disclosed
  postings; secondary model with disclosure as the outcome.
- Secondary DVs: range floor, ceiling, and **width** (employer pay uncertainty).

### 7. Automation (`.github/workflows/collect.yml`)

Weekly cron: collect → normalize → screen → code → rebuild
`data/analysis/postings.csv` → commit. Emits a scope report of usable N by tier;
opens an issue if a run fails or if the N ≥ 100 floor is still unmet after three
cycles (the Tier 3 trigger).

### 8. Audit loop (`audit.py`)

Per round: stratified sample of 100 postings, hand-checked against rules,
per-regressor precision/recall/F1 and Cohen's kappa, refine anything below 0.90.
A held-out gold set in `data/gold/` is never tuned on, so reported accuracy is
honest out-of-sample. Every round appended to `docs/audit-log.md`.

## Verification

- **Unit tests** over recorded fixtures for every ATS adapter, the pay parser
  (including hourly, ranges, malformed currency), geo radius math, and each
  regressor rule.
- **Offline `--dry-run`** replays `data/raw/` so the whole pipeline is testable
  without network.
- **Honest limitation:** adapters cannot be validated against live APIs from
  this session — egress is blocked. First live validation happens in the
  initial Actions run, which I will review and fix before trusting any output.
- **Acceptance:** first Actions run returns non-zero postings from ≥5 distinct
  employers across ≥2 ATS platforms; pay parser ≥95% accurate on a hand-checked
  sample of 50; screening precision confirmed by hand-reading 30 kept and 30
  rejected postings.

## Sequence

1. Scaffold repo, config, tests, compliance docs.
2. ATS adapters + normalizer + fixtures.
3. Geo, screening, pay parsing.
4. Actions workflow; **first live run**; fix against real payloads.
5. Regressor dictionary + coding; first 100-posting audit; refine.
6. Weekly flow accumulates; monitor N against the floor.
7. Analysis, diagnostics, tables, figures.
8. Paper + presentation.

Stages 1–5 are buildable now. Stages 6–8 depend on accumulated N.

---

# Scope revision — 2026-09-21

## Why this revision

The original scope (software/data/analytics roles only, 35 miles of Chicago or
Indianapolis) was measured against ~2,578 real postings from 16 employer boards
and yields **zero** usable observations. Under 0.5% of these employers'
postings are software/data roles anywhere on earth; what utilities and data
center operators post in these metros is energy and engineering work.

A probe collection (every in-metro posting regardless of role, in `data/probe/`
and `data/probe_tier3/`, never feeding the analysis dataset) measured each
candidate scope rather than estimating it. The revision below is grounded in
those counts and in the study owner's own professional profile: data center
siting against grid and substation availability, regulatory docket and rate
case analysis, energy market analysis, and AI-driven site feasibility tooling.

## Measured yields (one cycle, Tier 1–3, industry-purity guarded)

| Configuration | Usable |
|---|---|
| Original: software/data only, Chicago+Indy, strict early-career | **0** |
| All roles at in-frame employers | 121 |
| — data center ops and technicians | 40 |
| — corporate back-office | 16 |
| — **energy/analytics/engineering core (selected)** | **65** |
| All roles, but only degree-required postings | 48 |

## Decisions (this revision supersedes the role row above)

| Dimension | Decision |
|---|---|
| **Roles** | **Energy/analytics/engineering core only.** Siting and development, regulatory and compliance, market and procurement, grid and power systems, AI/ML, GIS, software/data. Excludes data center technicians, corporate back-office, and skilled trades. |
| **Industry** | Unchanged in principle — every observation must sit under the energy/utility/data-center umbrella — but see the diversified-employer guard below. |
| **Degree** | Not required. `degree_required` stays a regressor, so the degree premium is estimated rather than assumed. Only 48 of 121 postings state a degree, so requiring one would fall below the floor and make the variable constant. |
| **Internships** | Remain excluded; full-time rotational and new-grad programs retained. |
| **Metros** | Tier 3 activated (Northern Virginia, Denver, Twin Cities, Seattle), per the escalation already pre-registered in `config/scope.yaml`. Measured: doubles the yield. |
| **Experience** | Admit postings that state no minimum, absorbed by the existing `yrs_exp_stated` indicator rather than dropped. Measured: roughly doubles the yield. |
| **AI scarcity** | Only 3 AI roles in 121. Resolved by adding AI-heavy adjacent employers (see below), not by relaxing roles further. |

## Role taxonomy to add to `config/scope.yaml`

Grounded in titles actually observed, not invented categories:

- **Siting and development** — site selection, siting analyst, land development,
  development analyst, `associate, development`, renewable development,
  permitting, origination, site acquisition, real estate analyst
- **Regulatory, policy and compliance** — regulatory analyst, regulatory affairs,
  `analyst, compliance`, reliability compliance, NERC compliance, NERC
  operations, policy analyst, legislative analyst, rate/tariff analyst
- **Market, commercial and procurement** — market analyst, market intelligence,
  commercial analyst, capital markets, procurement analyst, pricing analyst,
  energy analyst, energy markets, settlements, trading analyst
- **Grid and power systems** — grid analysis, interconnection analyst/engineer,
  grid integration, transmission planning, resource planning, load forecasting,
  power systems analyst, grid modeling, system planning
- **AI and machine learning** — AI engineer, AI application, applied AI, AI
  analyst, AI platform, artificial intelligence, machine learning, ML engineer,
  data scientist, geospatial scientist
- **GIS and geospatial** — GIS analyst/specialist/developer, geospatial, CAD-GIS
  (word-bounded: `gis` must not match "logistics")
- **Sustainability analytics** — sustainability analyst, ESG analyst, energy
  efficiency, demand response, carbon analyst, environmental analyst

Exclusions to add so the widened taxonomy does not pull in adjacent non-roles:
`talent development`, `talent acquisition`, `business development manager`,
`logistics`, `construction project manager`, `marketing`, `legal operations`,
`accounts payable`, `accountant`, `insurance`, `vegetation`.

## Diversified-employer guard

Iron Mountain is a records-management company with a data center arm. Without a
guard it contributed CDL Route Driver, Truck Driver, Warehouse Associate,
Record Center Specialist and Warehouse Technician — not energy work. Postings
from a diversified employer whose title matches an off-umbrella line of
business (`warehouse`, `record center`, `route driver`, `truck driver`,
`courier`, `shredding`, `data entry`) are excluded. Six observations dropped.
The same guard applies to any future diversified employer, declared per
employer in `config/employers.yaml`.

## New variable: `role_family`

Every observation is tagged `siting_dev`, `regulatory`, `market_commercial`,
`grid_power`, `ai_ml`, `gis`, `software_data`, or `sustainability`. This lets
the analysis control for role family, report an AI premium, and present
subsets as robustness checks. Without it, a widened taxonomy would silently mix
pay regimes.

## Employer frame expansion

Core roles alone yield 65, so employers — not roles — are the lever to the
floor, and the source of the AI roles that are scarce among operators (3 in
121). All four adjacent categories are admitted:

1. **Energy analytics & grid software** — Aurora Energy Research, Ascend
   Analytics, Kevala, Camus Energy, Gridmatic, Uplight, AutoGrid, Arcadia.
   Densest source of AI-for-energy roles; mostly Greenhouse/Lever/Ashby.
2. **Renewable & data center developers** — NextEra, Clearway, Apex Clean
   Energy, Intersect Power, Arevon, Ørsted, EDF Renewables.
3. **Energy consulting & advisory** — ICF, E3, Brattle, Charles River
   Associates, Guidehouse, 1898 & Co, The Power Bureau, Decennial Group.
4. **Grid technology vendors** — GE Vernova, Hitachi Energy, S&C Electric
   (Chicago), Itron, Landis+Gyr, Schneider Electric.

**`industry` is no longer binary.** It becomes a categorical regressor:
`utility`, `data_center`, `energy_analytics`, `developer`, `consulting`,
`grid_vendor`. This is a real change to what the study compares, and the
write-up must describe the population as *the energy and data center sector*
rather than *core operators*.

## Two further decisions

- **Engineering boundary: analytics-adjacent only.** Grid integration,
  interconnection, grid modeling, transmission and resource planning, power
  systems analysis. Mechanical, electrical design, thermal, commissioning and
  SCADA engineering stay out, so licensure and discipline do not become the
  dominant pay drivers.
- **Level II roles are included, with a new `job_level` ordinal regressor**
  (I / II / III, Associate / Analyst / Senior Associate). The experience parse,
  not the numeral, decides early-career status; the level variable then lets the
  within-ladder pay step be estimated directly.

## Implementation

| File | Change |
|---|---|
| `config/scope.yaml` | New role taxonomy and exclusions; Tier 3 metros enabled; `admit_unstated_experience: true` |
| `config/employers.yaml` | Four new employer categories, each with `industry:` and candidate ATS tokens; `diversified:` flag with off-umbrella title patterns |
| `src/lmstudy/filters.py` | Honour `admit_unstated_experience`; add `extract_job_level()` |
| `src/lmstudy/build_dataset.py` | Emit `role_family`, `job_level`, categorical `industry`; apply the diversified-employer guard |
| `config/regressors.yaml` | Add `ai_ml_role`; keep `degree_required` as a regressor rather than a filter |
| `src/lmstudy/analyze.py` | Add `role_family`, `job_level`, `industry` to the model; report the AI premium |
| `docs/` | Regenerate codebook; update methods and limitations for the widened population |

## Verification

1. `python tests/run_all.py` — all suites green, including new tests for
   `extract_job_level`, the diversified-employer guard, and `role_family`.
2. `scripts/scope_probe.py` against the existing probe corpus confirms the new
   taxonomy reproduces the measured 65 before any new employer is added, so the
   taxonomy change is isolated from the frame change.
3. Dispatch `collect.yml`; confirm the new employer boards resolve and record
   which do not.
4. Rebuild the dataset and check `selection_funnel.json` for N ≥ 100 with
   `role_family` populated and no off-umbrella titles present.
5. Audit round 2 on the widened sample, per `docs/audit-log.md`, checking the
   hazards listed there plus the new `role_family` assignment.
6. Run `analyze.py`; verify the model estimates, VIF is sane with the new
   categoricals, and the paper and deck regenerate with real results.

---

# Scope revision 2 — 2026-09-21 (later same day)

Supersedes the employer-frame section above. Driven by three owner requests:
add utility regulation roles, expand well beyond 50 employers, and add
cooperatives and retailers.

## Employer frame: 30 → 266

| Category | Count | Notes |
|---|---|---|
| Utilities (electric + gas) | 62 | IOUs, municipals, public power |
| Data center operators | 36 | |
| Cooperatives | 33 | G&T, distribution, service orgs |
| Developers | 31 | renewables and data center |
| Retailers | 30 | competitive electric/gas suppliers |
| Energy analytics | 27 | grid software and analytics firms |
| Consulting | 22 | incl. power-engineering advisories |
| Grid vendors | 16 | |
| Grid operators | 9 | RTOs/ISOs |

Cooperatives and retailers were the most **metro-dense** addition, because
co-ops are regionally headquartered rather than national: ACES and Wabash
Valley Power (Indianapolis), Tri-State and United Power (Denver), Great River
and Connexus (Twin Cities), NRECA and CFC (Northern Virginia), Santanna
(Chicago). MISO is in Carmel, Indiana — inside the Indianapolis radius, and the
RTO the owner works with directly.

`industry` gains `cooperative` and `retailer`, reaching nine categories. The
distinction is substantive: co-ops are non-profit and retailers are
competitive, so both have reason to set pay differently from an IOU.

## The safeguard that makes a 266-employer frame safe

Most tokens are derived from company-name slugs, not read off careers pages.
At this scale that would have reproduced the Constellation failure —
a slug landing on a different company sharing a name — repeatedly and
invisibly.

`sector_confidence()` in `collect/discover.py` measures the share of a board's
own postings that discuss substations, interconnection, megawatts, colocation
and similar. Measured separation: real energy boards 86–100%, the reconstructed
false-positive board 0%, threshold 25%.

Two properties that matter:
- **Name-matching does not work and was tried.** Both companies are called
  Constellation. Sector-matching does.
- **It applies to every `verified: false` entry**, whether the token came from
  a slug guess or a declared candidate, since an auto-derived candidate carries
  identical risk. Only hand-verified tokens skip it.

Guessed Workday tenants probe only wd1 and wd5; eight instances across 150+
employers would exhaust the job timeout for negligible yield. Workflow timeout
raised to 300 minutes.

## Rejected, with reasons

- **Indeed** — terms prohibit scraping; Publisher API retired 2023.
- **Handshake** — sits behind the owner's school login and bars automated
  access; using student credentials would breach its terms.
- Both fail for the same reason LinkedIn does. Recorded so they are not
  revisited.
- **USAJOBS** remains an open option for federal regulators (FERC, DOE, EIA,
  NRC). It has a genuinely free public API and 100% pay disclosure, but GS pay
  is administratively set rather than market-set, so it would need its own
  indicator and cannot be pooled naively.

## Documentation brought in line

`docs/methods.md` now records the measured scope revision and the token-trust
model. `docs/limitations.md` gains two entries a reader is entitled to: that
the widening was **data-driven and not pre-registered** (auditable via
`scope-decision.md` and `scope_probe*.json`, but discountable), and that
sector confidence is a **heuristic, not proof** — a same-name company genuinely
working in energy would pass it.

## Remaining work

1. Read the collection manifest: which of the 63 slug-derived co-op and
   retailer tokens resolved, and which were quarantined.
2. Promote resolved tokens to `verified: true` so they skip the check next run.
3. Check `selection_funnel.json` against the N ≥ 100 floor.
4. Audit round 2 on the widened sample — `role_family` assignment is untested
   against real data, and `docs/audit-log.md` lists hazards still unchecked
   (`skill_cloud` on company blurbs, `benefit_equity` on diversity language,
   `soft_teamwork` possibly near-constant).
5. Run `analyze.py`; check VIF with nine industry categories and eight role
   families, which is where multicollinearity is most likely.
6. Weekly flow accumulates via the Monday cron.

---

# Final state — 2026-09-21, run 35554269246 (success)

**35 usable observations against a required 100. The floor is not met.**

| Stage | Count |
|---|---|
| Employers probed | 266 |
| Boards resolved | 35 (13%) |
| Postings collected | 529 |
| Passed screening | 72 |
| Unique in scope | 38 |
| Usable with pay | **35** |
| Distinct employers | **8** |

Chicago 21, Denver 8, Northern Virginia 6. Median pay $81,000, mean $90,112,
range $46,500–$148,500. Role families: siting_dev 10, market_commercial 8,
software_data 4, grid_power 4, regulatory 4, ai_ml 3, gis 1.

## The binding problem is concentration, not N

**Invenergy supplies 21 of 35 observations — 60%.** With 8 employer clusters
and one dominating, clustered standard errors are close to meaningless and the
model largely describes a single firm's pay ladder. That matters more than the
headline N, and no amount of role widening fixes it; only more employers do.

## Why the frame underdelivered

Only 35 of 266 employer boards resolved. The 153 batch-2 and 63 batch-3 tokens
were slug-derived guesses, and most were simply wrong. Co-ops and retailers in
particular run smaller ATS platforms or plain career pages that none of the
seven adapters cover. Hand-verified tokens resolved reliably; guessed ones
mostly did not.

## Five collection runs were lost to plumbing, not collection

Worth recording because the pattern took too long to see. Collection succeeded
every time; the data was discarded afterwards by: a binary rebase conflict on
the generated deck, my own hand-edits to a snapshot a run was rewriting, and a
`TypeError` in the paper generator caused by an incomplete fix of mine, which
failed a cosmetic step that then skipped the commit step.

The correct fix was architectural and should have come three failures earlier:
cosmetic steps are `continue-on-error`, the commit step is `if: always()`, and
the run owns conflicts inside `data/`. Regenerating a codebook must never be
able to destroy a collection.

## Remaining work, in order of expected value

1. Hand-verify board tokens for the largest non-resolving employers, starting
   with utilities and co-ops. 231 employers returned nothing, mostly from bad
   guesses rather than absent boards.
2. Let weekly flow accumulate via the Monday cron.
3. Add an iCIMS or SuccessFactors adapter — Exelon, ComEd, Constellation,
   Citizens Energy, TierPoint and Peoples Gas are all blocked on these, and
   include the largest Chicago-area utility employer.
4. Reconsider the seniority screen (304 rejections); some "Senior Associate"
   roles at 2–4 years are arguably early career.
5. Audit round 2 once the sample grows — `role_family` is untested against
   hand-coded truth.

---

# Revision 3 — metro-resident frame (2026-09-21, post-handoff)

## Context

The list immediately above was written from the funnel summary rather than from
the per-employer record. Re-reading run `35554269246` posting by posting shows
it mis-ranks the levers. Nothing in the repository changed after the handoff —
local and remote are both at `3ba1284`, run 15 is the newest and it committed
before the handoff was written — so this revision corrects the *reading* of
that run, not stale facts.

Four measurements, all made offline against the committed corpus:

| Claim in the list above | What the data shows |
|---|---|
| "231 returned nothing, mostly bad guesses" | True but not the cause. **254 of 266 employers are tagged `national`; only 18 declare a study metro, and 16 of those 18 do not resolve** |
| Seniority screen costs 304 | **Costs 1–2.** Only 15 of the 304 also pass the role screen; 6 have stated years ≤3, and those 6 are two requisitions duplicated across cities. Lever 4 is near-worthless |
| — | **Geo bug confirmed:** `'Arlington, VA'` resolves in scope, `'US - VA, Arlington'` does not. Workday's `ST, City` format silently drops **14 role-matching postings** |
| — | Workday boards listing 742 postings and collecting 0 are **not** a bug. Duke=Charlotte, Vistra=Irving, CyrusOne=Dallas, Essential=Bryn Mawr, PJM=Audubon PA — legitimately out of radius |

A hypothesis was also killed: the Workday pre-screen judges roles on title
alone, so it looked likely to over-reject. Measured on the 86 postings that
pass the role screen with their description, **0% fail on title alone.** The
pre-screen is sound; leave it.

**The diagnosis.** The frame was expanded 30 → 266 by adding national
companies. A national company's board is overwhelmingly jobs outside the study
radii, so it contributes almost nothing: **27 of 35 observations come from the
two metro-headquartered utilities** (Invenergy 21, AES Indiana 6), and the
other 236 employers produced 8 between them. The frame optimised for employer
count when the binding quantity is *metro-resident* employer count. That is
also why Invenergy is 60% of the sample — the concentration and the shortfall
are the same problem.

## What this session unlocked

`WebSearch` works here, though `WebFetch` to any ATS host is still blocked by
the egress proxy. Token verification is therefore possible from this session
for the first time; collection still is not. The first search tried resolved an
employer the run missed: **Wabash Valley Power (Indianapolis) → SmartRecruiters
`WabashValleyPowerAlliance`**. Hit rate is partial — Tri-State runs Oracle
iRecruitment, which no adapter covers — so employers are verified one at a
time and recorded either way.

## Decisions taken with the owner

| Question | Decision |
|---|---|
| Frame strategy | **Metro-resident employers only.** Stop adding national firms |
| iCIMS | Try the legitimate machine-readable routes; browser automation is a later decision, see below |
| Nationwide-remote postings | **Admit as a separate `remote_national` category**, kept out of the metro contrasts |
| Fallback if still short | **Add more pay-mandate metros** (NYC, LA, Bay Area, Boston), preserving the early-career and energy-umbrella definitions |

### iCIMS, and the Playwright question

Independent evidence now confirms the handoff's finding rather than
overturning it: iCIMS's standard XML feed is released **only to approved job
boards**, and its Job Portal API is partner-gated with no self-serve tier. One
cheap test remains — the third-party JobThread syndication feed at
`icims.jobthread.com` — and `.jobs`/DirectEmployers syndication should be
checked for Southern Company Gas, which `employers.yaml` already notes uses it.

The owner asked that Playwright be tried if those fail. That contradicts the
project's founding constraint ("scraping methods like Playwright or Selenium
are likely banned") and iCIMS portal terms bar automated access the way
LinkedIn's do; `docs/methods.md` currently documents a compliance posture that
browser automation would falsify. **It is therefore not built by default.** If
RSS, JobThread and `.jobs` syndication all come back empty, bring the evidence
back and let the owner make that call explicitly.

One legitimate alternative to evaluate first: the **CareerOneStop / National
Labor Exchange API** (US DOL). It is free with a key, and NLx aggregates
employer-direct postings *with employer permission*, so it carries none of the
scraping objections. It may reach the iCIMS employers without touching iCIMS.

## Implementation

### 1. Fix the geography parser — `src/lmstudy/geo.py`

Normalise Workday's location formats before resolution: strip a leading
`US - ` / `US ` prefix and flip `ST, City` to `City, ST`. Recovers 14
role-matching postings, all in Northern Virginia (Arlington 11, McLean 2,
Springfield 1). Add each observed format string to the geo test suite as a
regression case, using the **real strings** from
`data/raw/2026-09-21/manifest.json` → `scope_diagnostics.locations_of_in_role`,
not invented ones — this is the failure mode that broke the sector gate.

Add a `remote_national` metro category for bare nationwide-remote strings
(`US - Remote (Any location)`, `Remote - US`, `Remote, USA`). It must not enter
the metro or `mandate_state` contrasts; carry it as its own level so the ~8
postings are recorded rather than discarded.

### 2. Re-target the employer frame — `config/employers.yaml`

Add a required `metro:` field and audit the 254 `national` entries: any
employer with a headquarters or major office inside a study radius is retagged.
New employers are admitted **only** with a study-metro presence and a
**hand-verified** token, each carrying `verified: true` and the careers URL it
was read from, so it skips the sector gate honestly.

Verify with `WebSearch` one employer at a time; record the outcome either way,
including "runs Oracle iRecruitment / no supported ATS", so no employer is
chased twice. Start with the 16 non-resolving metro employers already in the
frame, then work outward by metro. Wabash Valley Power's SmartRecruiters token
is the first entry.

### 3. iCIMS probe — `src/lmstudy/collect/ats.py`

A feature-flagged adapter that tries, in order: the JobThread syndication feed,
then `.jobs`/DirectEmployers syndication. Test in one Actions run against
Exelon, ComEd, Constellation and Citizens Energy. Record the result in
`docs/limitations.md` either way — a confirmed closed door is worth as much as
an open one here.

### 4. Do **not** touch the seniority screen or the Workday pre-screen

Both measured as sound or near-worthless. Record the measurements in
`docs/limitations.md` so lever 4 is not re-proposed from the funnel summary
again.

## Verification

1. `python tests/run_all.py` — green, including new geo regression cases built
   from the real manifest strings.
2. Offline replay: rebuild from `data/raw/` and confirm the geo fix alone lifts
   in-scope postings by the predicted 14, with the Northern Virginia count
   rising and no other metro changing.
3. `selection_funnel.json` shows `remote_national` populated and excluded from
   the metro contrasts.
4. Dispatch `collect.yml`; confirm each newly hand-verified token resolves, and
   demote any that does not rather than leaving it hopeful.
5. Re-check concentration explicitly: **Invenergy's share of observations must
   fall.** N rising while one employer still supplies 60% has not fixed the
   study, and `analyze.py`'s interpretability block stays until both N ≥ 100
   and the cluster count is defensible.
6. Audit round 2 once N grows — `role_family` is still untested against
   hand-coded truth.

---

# Revision 4 — national scope, all seniority levels (2026-09-21, late)

## Context

The owner's decision, taken tonight: **admit every US location and every
seniority level, and regress on both** rather than screening on either. The
industry umbrella is unchanged and non-negotiable — every observation still
sits under energy, utility or data centre.

This is not a retreat from the N ≥ 100 floor. It is the change that makes the
floor reachable and, more importantly, makes the estimates mean something.
After a full day of frame work the study stands at **40 usable observations,
13 employers, Invenergy 50%**. Employer concentration, the cluster count and
the shortfall were always one problem, and geography was the thing holding all
three down.

### Why this is large, measured rather than hoped

The binding constraint is not the analysis screens; it is the **collection-time
pre-screen**, which drops out-of-metro postings before their descriptions are
ever fetched. On run 35563603919:

| | |
|---|---|
| Workday postings **listed** | 3,778 |
| **kept** by the pre-screen | 120 |
| dropped as wrong place but right role | 48 |
| dropped as wrong place *and* wrong role | 2,246 |

So the study currently reads the description of **3% of what it already
finds**. Dropping geography from the pre-screen and keeping only the
title-based role screen turns 120 detail fetches into several hundred — a
change of minutes at one request per second, not of hours.

Add the seniority screen's 306 rejections and the 19 out-of-metro rejections
downstream, and raw postings plausibly go from 728 to roughly 2,000–2,500.
Disclosure runs near-universal in mandate states and perhaps a third elsewhere,
so **600–1,000 usable observations is the realistic range.** That is the
owner's original 1,000+ ambition, reached by the route that was available all
along.

### What the study becomes

It stops being "early-career pay in six metros" and becomes **"what drives
advertised pay in the US energy and data centre sector"**, with seniority and
location as first-class regressors instead of sample filters. Three things
improve at once:

- **Clusters.** Hundreds of employers instead of 13, so employer-clustered
  standard errors start behaving and the few-cluster bias note can come down.
- **Identification.** National coverage produces real variation in
  `mandate_state`, so the effect of a pay-transparency mandate on *whether* pay
  is disclosed, and on the level and width of the range, becomes estimable.
  That is a genuinely publishable finding and it was impossible at six metros.
- **Concentration.** Invenergy stops being half the sample by arithmetic.

The cost, stated plainly: the original early-career question survives only as a
**subsample robustness check**, and disclosure selection outside mandate states
is real. Both are handled below, neither is hidden.

## Decisions

| Dimension | Revision 4 |
|---|---|
| **Geography** | All **US** locations. Non-US excluded — the run already sees Chennai, Mumbai, Bangalore, Bogotá, Amsterdam and Shah Alam, and pooling currencies and labour markets would be nonsense |
| **Seniority** | All levels admitted, including internships, each carrying an indicator |
| **Industry** | **Unchanged.** Energy / utility / data centre umbrella, enforced as today |
| **Roles** | **Unchanged.** The energy-analytics core taxonomy is what makes the study coherent. It is now the largest remaining filter (391 + 209 of 728), so it is the next lever if N still disappoints |
| **Pay** | Unchanged. Non-disclosed dropped from the pay model, but disclosure now becomes an outcome in its own right |

## Implementation

### 1. Geography without a national gazetteer — `src/lmstudy/geo.py`

The gazetteer holds 235 places for ten metros. Seeding it nationally is a week
of work and is not needed: almost every ATS location string carries its state
(`"Irving, Texas"`, `"US - VA, Arlington"`, `"Overland Park, KS"`), and
`canonicalize_place()` already normalises the awkward forms.

So **resolve to state, not to coordinates**, for national coverage:

- `resolve_us_state(location_raw) -> "IL" | None`, using the existing
  `STATE_ABBR` table widened to all 50 plus DC, and `None` for anything that
  parses to a non-US country.
- Keep `resolve()` exactly as it is for the ten study metros, so `study_metro`
  survives as a regressor and every existing test keeps passing.
- New derived fields: `state`, `census_region` (Northeast / Midwest / South /
  West), `mandate_state`, `study_metro`, `remote_national`.

`mandate_state` needs a state → posting-level-mandate table with effective
dates: CA, CO, CT, HI, IL, MD, MN, NV, NJ, NY, RI, VT, WA, DC, plus MA from
2025-10 and VA from 2026-07. Put it in `config/scope.yaml`, not in code, so a
reader can audit it.

### 2. Pre-screen — `src/lmstudy/collect/run.py::make_detail_filter`

Drop geography and seniority; keep the title-based role screen, and add a
US-only test on any location that resolves to a country. **This is the change
that unlocks everything else, and it is the one that could blow the 300-minute
job timeout if the role screen goes too.** Keep it, and log kept/listed so the
next run can be sized.

### 3. Screens — `config/scope.yaml`, `src/lmstudy/filters.py`

`seniority_exclusions` stops being a filter and becomes a **classifier**:
`seniority_rank` 0 intern, 1 entry, 2 mid/unlevelled, 3 senior, 4 staff or
principal, 5 manager, 6 director, 7 VP and above. Audit round 2's fixes are
what make this trustworthy — the V–VIII numerals and `leader` now parse
correctly, so they stop being exclusions and start being levels.

Keep `is_internship`, `yrs_exp_min` and `yrs_exp_stated` as they are.
`early_career` becomes a derived indicator (rank ≤ 1 or ≤ 3 stated years) used
for the subsample check, not a gate.

### 4. Analysis — `src/lmstudy/analyze.py`

- Core model gains `seniority_rank`, `mandate_state`, `census_region` dummies.
- `state` fixed effects in the extended model once N supports them.
- **New disclosure model**, now that it is identified: `pay_disclosed` on
  `mandate_state` + controls. Report it as a finding in its own right.
- Robustness: re-estimate on the early-career subsample and show the original
  question is unchanged; report with and without `state` fixed effects.
- Keep the interpretability block. It comes down when N and clusters earn it —
  not before, and not to make the paper look finished.

### 5. Employer frame

Metro residence stops being the targeting criterion, so **expand Workday site
variants to every employer**, not just metro-resident ones. Watch the timeout:
248 Workday candidates × 7 sites × 2 instances is roughly an hour at one
request per second. Cap non-priority employers at 4 variants if the run gets
tight.

## Sequence for tomorrow

1. `geo.py`: state resolution, census regions, US-only, mandate table. Tests.
2. `scope.yaml`: mandate states, seniority ranks, role taxonomy untouched.
3. `filters.py`: seniority becomes a rank; early-career becomes derived.
4. Pre-screen: geography and seniority out, role and US-only in.
5. `build_dataset.py`: emit the new fields; rebuild offline and confirm the
   existing 40 are unchanged in their own right.
6. **Dispatch a collection run early** — it is the long pole at 30–60 minutes,
   and everything downstream is cheap. Do this before polishing anything.
7. `analyze.py`: new regressors, disclosure model, subsample robustness.
8. Audit round 3 on the widened sample: `seniority_rank` and `state` are both
   untested against hand-coded truth, and every previous round found something.
9. Paper, figures, deck regenerate; update methods and limitations for a
   national, all-seniority population.

## Verification

1. `python tests/run_all.py` green, including new state/region/mandate cases
   built from **real** location strings in the run manifests, not invented ones.
2. Offline rebuild: the 40 current observations must still be present and
   correctly classified, with `seniority_rank` populated for every row.
3. Non-US strings seen in the real manifests — Chennai, Bogotá, Amsterdam,
   Shah Alam — must all resolve to excluded.
4. The run's `kept / listed` ratio must rise from 3% to double digits; if it
   does not, the pre-screen change did not take effect.
5. Judge the result on **three** numbers, not one: N ≥ 100, the largest
   employer's share well under 50%, and the distinct-employer count in the
   dozens at least.
6. Pre-registration honesty: this widening is data-driven and not
   pre-registered, exactly like revisions 1–3. `docs/limitations.md` says so
   already and must say it again for this one.

## What could still go wrong

- **Timeout.** The likeliest failure. Mitigation: keep the role pre-screen,
  cap site variants, and dispatch early enough to retry once.
- **Disclosure selection.** Outside mandate states most postings state no pay,
  so the pay sample tilts toward mandate states. This is why the disclosure
  model is promoted to a headline result rather than a footnote.
- **Seniority dominating.** It will be the largest coefficient. That is the
  expected, correct answer, not a bug — but the early-career subsample is what
  keeps the owner's original question answerable.
- **"Finished by tomorrow night" depends on the first run landing clean.**
  Collection is the only step that cannot be hurried; everything after it is
  minutes.

---

## Rulings taken with the owner before starting (2026-09-21, night)

These supersede anything above that conflicts with them.

| Question | Ruling |
|---|---|
| **Roles** | **Keep the energy-analytics core taxonomy unchanged.** National scope solves N, so the role definition stays tight and the study stays coherent. Widen only if N genuinely disappoints, and say so if we do |
| **Internships** | **Stay excluded.** A different contract and pay regime; excluding them preserves comparability with everything collected so far. `seniority_rank` therefore starts at entry level, not intern |
| **Cost of living** | **Add BEA Regional Price Parities.** Report nominal and price-adjusted pay. A national pay regression without this is the first thing a reviewer challenges |
| **Framing** | **National headline, early career as robustness.** Retitle to *Determinants of Advertised Pay in the US Energy and Data Center Sector*. The early-career subsample becomes a robustness section that preserves the original question |
| **Pre-registration** | **Yes — write the specification before the collection run.** Model, regressor list and hypotheses committed to the repo first |
| **Deliverables** | Code + written economic study + slide deck, plus whatever else my judgement says a professional economic review needs. Standard of finish is professional polish, not "submitted" |
| **Timeline** | Finishing tomorrow is the aim, **not a constraint**. The owner: "there is no concern if we don't finish by tomorrow night — we have a lot of ground to cover." So nothing gets cut for speed; correctness wins over completion |
| **iCIMS / Playwright** | **Decided by the terms, not by preference.** See below |

### The iCIMS question is now a factual one

The owner's reasoning is sound and worth recording: LinkedIn bans automation
outright, but that is LinkedIn's rule, not a universal one, and these are
different companies. If their terms permit automated access, the objection
disappears.

So this is settled by reading, not by judgement. **Before any automation is
written:** read the iCIMS portal Terms of Use, each tenant's `robots.txt`
(`careers-exeloncorp.icims.com`, `careers-constellationenergy.icims.com`,
`careers-citizensenergygroup.icims.com`), and any terms linked from the portals
themselves. Report what they actually say, verbatim where it matters.

- **If they do not bar automated access and robots.txt permits the paths** —
  proceed, politely: one request per second, descriptive User-Agent, no
  circumvention of any control, and document it in `docs/methods.md` alongside
  the same posture used everywhere else.
- **If they bar it, or robots.txt disallows** — take the accept-and-document
  route. With national scope the sample no longer depends on these four.

Either way the finding goes in `docs/limitations.md` with the quoted term, so a
reader can check the reasoning rather than trust it. **Do not write the
automation before the reading is done and reported.**

### Consequences to carry into the write-up

- **The mandate finding is associational, not causal.** This is a single
  cross-section, so there is no time variation to support a difference-in-
  differences design. State it as a descriptive contrast between mandate and
  non-mandate states, with the selection caveat attached. Do not let it drift
  into causal language in the paper or the deck.
- **Non-US postings are excluded**, and the exclusion is stated: the run
  already sees Chennai, Mumbai, Bangalore, Bogotá, Amsterdam and Shah Alam, and
  pooling currencies and labour markets would be meaningless.
- **BEA RPP data may not be fetchable from this environment** — egress is
  blocked to most hosts. The table is ~51 state values, small enough to commit
  to `config/` as a cited data file. Fetch it in Actions if the host is
  reachable there; otherwise embed with the BEA citation and release date.

### Deliverables, at the professional standard the owner asked for

Beyond code, paper and deck, my judgement says a professional economic review
of this kind should also carry:

1. **Pre-registration document** (`docs/pre-registration.md`) — written and
   committed *before* the run, per the ruling above.
2. **Codebook / data dictionary** — already generated; must cover every new
   variable (`seniority_rank`, `state`, `census_region`, `mandate_state`,
   `rpp_adjusted_pay`).
3. **Reproducibility README** — how to rebuild every number from the committed
   raw snapshots, so a reader can verify rather than trust.
4. **Executive summary** — one page, findings first, for a reader who will not
   read the paper.
5. **Limitations** — already strong; must be updated for the national,
   all-seniority population and the non-causal mandate contrast.

## Revised sequence for tomorrow

0. ~~**Read the iCIMS terms and report.**~~ **DONE overnight, and the question is
   closed on two independent grounds.** The terms prohibit "any robot, spider or
   other automatic device, process, or means to access the Website", materially
   LinkedIn §8.2, reaching the career portals — so automation is out. And the
   syndication probe ran against all four tenants and found **no feed**, so
   there was nothing to read anyway. Both recorded in `docs/limitations.md`
   with the terms quoted. **No portal automation gets written.**
   Starting state this morning: `000b541`, clean, synced, **40 usable / 13
   employers / Invenergy 50%**.
1. **Write and commit `docs/pre-registration.md`.** Specification fixed before
   data is seen. This is now the first task.
2. `geo.py`: US state resolution, census regions, mandate table, non-US
   exclusion. Tests built from real manifest strings.
3. `scope.yaml`: mandate states by effective date; seniority ranks; roles and
   internship exclusion unchanged.
4. `filters.py`: seniority becomes a rank, not a gate; `early_career` derived.
5. Pre-screen: geography and seniority out, role and US-only in.
6. **Dispatch the collection run.** Long pole; everything after is cheap.
7. While it runs: BEA RPP table into `config/`, `build_dataset.py` fields,
   `analyze.py` specification per the pre-registration.
8. Rebuild, estimate, and check the three numbers: N, largest-employer share,
   distinct employers.
9. **Audit round 3.** `seniority_rank` and `state` are untested against
   hand-coded truth. Every previous round found real errors in the top rows by
   pay; assume this one will too.
10. Paper, executive summary, figures, deck, codebook, README, limitations.

---

# Audit round 3 — findings (2026-09-21, run on the 141-row national dataset)

## Context

Round 3 targets the two variables the national rescope introduced and nobody
had checked against hand-coded truth: **`seniority_rank`** and **`state`**.
Both are load-bearing — seniority is the headline regressor under H1, and
`state` is what `mandate_state` is derived from, which carries the study's
best finding. All 141 rows were read rather than sampled.

**Result: 21 of 141 assignments wrong — 85.1% accuracy, below the 0.90
standard.** Three distinct defects, one of which changes the headline number.

## Finding 1 — `mandate_state` is wrong on multi-location postings (9 rows)

**23% of rows (33 of 141) list more than one location**, and `state` and
`metro` are assigned by *different* rules: `resolve()` picks the nearest
in-radius study metro across all fragments, `resolve_us_state()` picks the
first fragment that parses. They disagree constantly —
`state=UT, metro=indianapolis`; `state=TX, metro=new_york`;
`state=GA, metro=northern_virginia`.

For most fields that is untidy. For `mandate_state` it is **wrong**, because a
pay-transparency law attaches to the job's location, so a posting listing *any*
covered location is covered. Taking the first fragment understates mandate
coverage arbitrarily.

Nine rows carry `mandate_state=0` while listing a mandate state elsewhere in
the same posting — and **seven of the nine disclosed pay**, which is what
being covered predicts.

| Effect on the headline disclosure contrast | mandate | no mandate | gap |
|---|---|---|---|
| Current (first fragment) | 98.8% (n=82) | 33.9% (n=59) | 64.9pp |
| **Any-location rule (correct)** | **96.7% (n=91)** | **26.0% (n=50)** | **70.7pp** |

The fix **strengthens** the finding, which is worth stating plainly: it was
found by auditing, not by looking for a better number, and it would have been
just as reportable had it gone the other way.

**Fix:** `mandate_state` becomes "any listed location is in a mandate state".
Add `states_listed` (all resolved states) and `n_locations` to the dataset so
the rule is auditable and multi-site postings can be controlled for or dropped
as a robustness check. Keep `state` as the primary location for regional
dummies, but document that it is the first-listed.

## Finding 2 — range titles are ranked at the top of their range (9 rows, 6%)

Utility postings routinely advertise several rungs in one requisition:
`Resource Planning Analyst I or II or Senior`,
`(Sr.) (Lead) (Principal) Energy Analyst/Engineer (II)`,
`Environmental Analyst III or IV`, `Senior/Principal Data Analyst`,
`Data Scientist I or II`. `seniority_rank()` returns the highest matching rung,
so every one is ranked at its ceiling. That biases the headline regressor
upward exactly where the advertised pay range is widest.

**Fix:** rank a range title at its **lowest** advertised rung — the level the
employer will actually hire at, and the one the pay floor corresponds to — and
add an `is_level_range` indicator so the model can absorb the extra variance.
Do not average: a midpoint rank is not a level anyone is hired into.

## Finding 3 — three out-of-scope roles admitted (plus one borderline)

| Title | Admitted by | Why it is out |
|---|---|---|
| Corporate Counsel, Corporate & Capital Markets | `capital markets` | A lawyer. `legal operations` is excluded; `counsel` and `attorney` are not |
| Sr. Nuclear Instructor (Database Administrator) | `database administrator` | A training role. The DBA reference is parenthetical |
| Senior Security and Compliance Analyst | `compliance analyst` | Security. Round 2 added `security analyst`, but matching is contiguous and this reads "Security **and Compliance** Analyst" |
| *AI Data & Security Governance Engineer* | `ai` | **Borderline, kept.** It is genuinely an AI data governance role; flagged, not excluded |

**Fix:** add `counsel`, `attorney`, `general counsel`, `instructor`, `trainer`
to `roles.exclude_any`; add `security and compliance` and `security governance`
alongside the round-2 security terms.

## Not a defect, recorded so it is not re-litigated

**"Associate" is genuinely ambiguous** and is left alone. In banking and
consulting it is a mid rung above analyst; in engineering it is junior. The
sample contains both (`Capital Markets Associate` vs
`Associate, Renewable Development`). Any rule would be wrong half the time, so
the ambiguity is documented in the codebook and `seniority_rank` keeps treating
`associate` as entry, consistent with the energy-sector majority here.

**Dedupe is working.** Five Invenergy Development rows that looked like
duplicates are distinct requisitions — R11187-1, R11315-2, R10740-1, R11186,
R10973-1 — across Chicago, Denver and Portland. My first reading was wrong.

## Implementation

| File | Change |
|---|---|
| `src/lmstudy/geo.py` | `resolve_us_states()` returning every state a location lists, beside the existing single-state resolver |
| `src/lmstudy/build_dataset.py` | `mandate_state` from any listed state; emit `states_listed`, `n_locations`, `is_level_range` |
| `src/lmstudy/filters.py` | `seniority_rank()` returns the LOWEST rung of a range title; `is_level_range()` detects one |
| `config/scope.yaml` | `counsel`, `attorney`, `instructor`, `trainer`, `security and compliance`, `security governance` in `roles.exclude_any` |
| `tests/test_filters.py` | The nine real range titles pinned with their correct (lowest) ranks |
| `tests/test_geo.py` | Multi-location strings from the manifests pinned for multi-state resolution |
| `docs/audit-log.md` | Round 3 entry in the established format |
| `docs/pre-registration.md` §8 | Dated amendment: the mandate rule changed **after** seeing data, and it moved the headline. Recorded as an amendment, not a silent edit |

## Verification

1. `python tests/run_all.py` green, with the nine range titles and the
   multi-location strings as regression cases, taken verbatim from the data.
2. Rebuild; confirm exactly the nine identified rows flip to `mandate_state=1`
   and no others move.
3. Re-run `analyze.py`; the disclosure gap should read ~70.7pp. **If it does
   not, the fix did something other than what this audit predicted** — stop and
   find out what.
4. Confirm the three out-of-scope roles are gone and N falls by exactly three.
5. Re-score the audited fields; target ≥ 0.90 before the write-up begins.

---

# Run 21 landed, and it exposed a data-integrity bug in the commit step

## Context

Run 21 committed `e573fc3`. Reading its artifacts before trusting them found
that **the committed derived files are internally inconsistent**:

| Artifact | Says |
|---|---|
| `selection_funnel.json` → `funnel` block | 141 unique in scope, **103** usable |
| `selection_funnel.json` → `usable_by_employer` | sums to **137** across 23 employers |
| `selection_funnel.json` → `usable_by_metro` | sums to **107** |
| `postings.csv` | **204 rows**, 137 with disclosed pay |

All four are written by one function in one pass, filtering identically
(`build_dataset.py:293-297`), and the code is byte-identical between the commit
run 21 executed and HEAD. **One execution cannot produce those numbers.**

## Cause: `-X ours` does not mean "take our file"

`.github/workflows/collect.yml:134`:

```
git pull --rebase --autostash -X ours origin "${GITHUB_REF_NAME}"
```

`-X ours` is a **merge strategy option**. It resolves *conflicting hunks* in
our favour — but non-conflicting hunks from **both sides are still merged in**.
For a CSV, two runs' rows sit on different lines, do not textually conflict,
and are therefore **unioned**. 204 rows is run 20's output plus run 21's.

The comment above that line says "on a conflict inside data/ take this run's
version", which is what was intended and is not what the flag does. The
cancelled cron (run 20) had committed on its way out, so run 21 rebased onto it
and merged.

## Why this matters more than it looks

Had I rebuilt on the committed artifacts and reported, the paper would have
claimed **137 observations across 23 employers with Invenergy at 28%** — all
three better than the truth, and all three wrong, produced by a git merge
rather than by the pipeline. It is exactly the failure mode this project keeps
finding: not a crash, a confident wrong answer.

It also would have looked like progress toward the pre-registered concentration
target, which is the direction most likely to go unquestioned.

## What is actually sound

- **`data/raw/` is authoritative and nearly clean.** All files parse; 901
  postings; one file (`Vantage_Data_Centers__workday.json`) carries 4 duplicated
  `external_id`s from the same merge. The pipeline dedupes on
  employer + title + location, so these collapse — but the file should still be
  repaired rather than left relying on a downstream guard.
- Derived artifacts are pure functions of `data/raw/`, so **nothing is lost**:
  they are regenerated, not recovered.

## Fix

**1. `.github/workflows/collect.yml` — never merge derived artifacts.**

Raw snapshots are append-only per-employer files where merging is safe and
correct. `data/analysis/` is derived and must be **recomputed**, never merged.
On a rebase conflict:

- take the run's own `data/raw/` wholesale (`git checkout --ours -- data/raw/`),
- then **re-run `build_dataset.py` and `analyze.py`** and amend, so the
  committed derived files are always the output of one execution over the
  merged raw corpus.

**2. `src/lmstudy/build_dataset.py` — make the inconsistency impossible to
commit.** Assert that `sum(usable_by_employer) == sum(usable_by_metro) ==
usable_with_pay` and that the CSV row count equals `unique_in_scope`, failing
the build loudly if not. A funnel whose own totals disagree should never be
written, let alone committed.

**3. Repair the 4 duplicated raw records** in the Vantage file.

**4. Rebuild and report the true numbers**, which are not yet known — the
current raw corpus (901 postings, Guidehouse newly resolved with ~34 postings)
has never had a clean build run over it.

## Verification

1. Rebuild from raw; confirm the new assertion passes and all four totals agree.
2. Confirm the CSV row count equals `unique_in_scope` exactly.
3. Report N, distinct employers and largest-employer share **from the clean
   build**, and treat the 137/23/28% figures as void.
4. Re-run the full suite; regenerate paper, codebook, figures and deck.
5. On the next collection run, confirm the commit step regenerates rather than
   merges — the committed CSV row count must equal the funnel's
   `unique_in_scope` in the run's own output.

---

# Employer token verification, round 2 (2026-09-22)

## Context

The study meets its N floor (137 observations) but fails two pre-registered
*substance* conditions: 23 distinct employers against a target of 30, and the
largest employer at 28% against a ceiling of 25%. Both are cluster problems,
and **more employers is the only thing that fixes them** — more postings from
the same boards makes concentration worse, not better.

Diagnosis from the current manifest: 39 boards resolve with postings but only
23 contribute a disclosed-pay observation. The 16 that contribute nothing split
into two groups, and neither is fixable by code:

- **Collect but nothing in scope** — T5 Data Centers (90 postings → 0),
  Clearway (50 → 0), Silicon Ranch, Origis, Tract. These are developers and
  data-centre builders posting construction and facilities work. The role
  screen is doing its job.
- **In scope but no pay disclosed** — Vistra (8 → 0), CyrusOne (5 → 0), PJM,
  Duke Energy Indiana, Wabash Valley Power. All in non-mandate states. Nothing
  to fix; they already count in the disclosure model's denominator.

So the target is **new boards**, and under national scope the metro constraint
no longer applies — any reachable US employer can add a cluster. What matters
now is: reachable ATS, posts energy-analytics roles, and **headquartered in a
mandate state**, because a cluster requires *disclosed* pay.

## Verified this round

All five read off a live job URL, not guessed.

| Employer | Platform | Token | HQ | Mandate |
|---|---|---|---|---|
| Ascend Analytics | greenhouse | `ascendanalytics` | Boulder CO | yes |
| Arcadia | greenhouse | `arcadiacareers` | Washington DC | yes |
| The Brattle Group | greenhouse | `thebrattlegroup` | Boston MA | yes |
| NYISO | greenhouse | `nyiso` | Rensselaer NY | yes |
| ERCOT | workday | `ercot` / `ercot_careers` / wd1 | Taylor TX | no |

Two are worth noting specifically:

- **Arcadia's token is `arcadiacareers`, not `arcadia`.** No slug derivation
  would have found it — the same failure mode as NiSource's `NiSource` site
  name. This is the second confirmation that hand-verification finds boards
  slug guessing cannot.
- **Brattle is an economics consultancy whose entry-level role is literally
  "Research Analyst"**, in a mandate state. Of the five it is the best fit to
  the study's role taxonomy, and its published salary bands suggest it
  discloses.

ERCOT is in a non-mandate state so it may add in-scope postings without
adding a cluster. It is still worth including: it enriches the non-mandate
side of the disclosure contrast, which currently rests on 62 postings.

## Recorded as closed, so they are not re-chased

- **Uplight**, **Analysis Group**, **Enverus** — no supported ATS identified.
- **ISO New England** — runs its own portal at `iso-ne.com`.
- **ICF** — Workday, but behind the `careers.icf.com` vanity domain; the
  tenant is not exposed and probing vanity hosts is out of scope.

## Honest expectation

Five new boards will not, on their own, clear 30 clusters. Judging by the
current conversion — 39 resolving boards to 23 contributing employers — these
five plausibly yield **three to four** new clusters, taking 23 to roughly 27.

**The condition will likely still fail after this round**, and it should be
reported as failing. Clearing 30 needs another verification pass of similar
size; this round establishes the method works and banks the result.

## Implementation

1. `config/employers.yaml` — set each of the five to `verified: true` with the
   token above and the `careers_url` it was read from, so it skips the
   sector-confidence gate honestly. Add `ats_unidentified: true` with a dated
   note to the five closed entries.
2. Dispatch `collect.yml`.
3. Rebuild, re-estimate, regenerate deliverables.

## Verification

1. The manifest must show all five resolving. Any that does not gets demoted
   to `verified: false` rather than left hopeful.
2. Report the three numbers together: N, distinct employers, largest-employer
   share. **Report whether the 30-cluster condition passes or fails, either
   way.**
3. `tests/run_all.py` green, including the consistency suite, which must be
   what confirms the paper matches the rebuilt dataset.
4. Watch for a new employer arriving with an implausible pay figure — the
   Warsaw role entered on exactly this kind of frame expansion, so read the
   pay extremes before believing the rebuild.

---

# Handoff point — exhaustive token verification (2026-09-22)

## Context

Work paused here for compaction. The owner's instruction is explicit:
**verify every remaining source until each is either confirmed or denied.**
230 employers are unresolved. This is the only remaining lever on the two
failing pre-registered conditions (23 employers against 30; largest at 28%
against 25%), because both are cluster problems and only employers fix them.

Everything else in the plan is complete: pipeline, national scope, seniority as
a regressor, four pre-registered models, three audit rounds plus an integrity
check, and all deliverables regenerating with 0 TODO markers.

**`HANDOFF.md` §0.5 is the working brief for this task** and carries the
operational detail. This section records the plan; that one records how.

## The task

1. **Build `config/token-verification.yaml` first.** Nothing currently records
   verification *attempts*, only outcomes, so an interrupted pass gets
   re-chased. Key by employer: `status` (confirmed / denied / unchecked), date,
   evidence URL for a confirmation, reason for a denial. Commit as you go so a
   usage-limit stop costs nothing.
2. **Work it in priority order**: mandate-state employers first, then
   energy-analytics firms and economics consultancies, then the rest. A board
   only becomes a cluster if its postings disclose pay, and disclosure is
   near-universal in mandate states and about a quarter elsewhere.
3. **Promote each confirmation** into `config/employers.yaml` as
   `verified: true` with the token and the `careers_url` it was read from, so
   it skips the sector gate honestly. Mark each denial `ats_unidentified: true`
   with the date and what was found.
4. **Dispatch `collect.yml`** after each meaningful batch rather than at the
   very end, so a bad token surfaces early.
5. **Rebuild and report the three numbers together** — N, distinct employers,
   largest-employer share — and state whether the 30-cluster condition passes
   **or fails**, either way.

## What is known to work, and what is not

- `WebSearch` works; **`WebFetch` is blocked** for ATS hosts *and* ordinary
  corporate careers pages. Confirm a token from a live job URL appearing in
  search results, never by opening the careers page.
- Query shape that works: `"<company> careers job openings greenhouse board
  apply <city>"`. Boolean host forms (`boards.greenhouse.io OR jobs.lever.co`)
  do not. Hit rate roughly 1 in 2.
- **Read the result links, not the summary prose** — the summary frequently
  says nothing was found while the links contain the board URL.
- Every token found so far was wrong in a way slug derivation cannot reach
  (`arcadiacareers`, `thebrattlegroup`, `nyiso`, `ercot_careers`, `NiSource`).
  That is the whole justification for doing this by hand.

## Verification

1. The ledger accounts for all 230: none left `unchecked` when the pass ends.
2. Every confirmation resolves in a collection manifest. Any that does not is
   **demoted to `verified: false`** rather than left hopeful.
3. `tests/run_all.py` green, including the consistency suite, which is what
   confirms the paper matches the rebuilt dataset.
4. **Read the pay extremes after each rebuild.** A Warsaw role at $309,500
   entered the US sample on exactly this kind of frame expansion, and it was
   the highest-paid observation in the study at the time.
5. If 30 clusters is reached, the interpretability block in `analyze.py` and
   `results.md` may come down **only** once N, cluster count and
   largest-employer share all pass. Not before, and never to make the
   deliverable look finished.

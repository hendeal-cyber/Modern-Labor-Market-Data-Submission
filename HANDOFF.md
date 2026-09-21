# Handoff — Modern Labor Market Data Submission

Written 2026-09-21. Read this first; it is the fastest path to being useful.

**Repo:** `hendeal-cyber/Modern-Labor-Market-Data-Submission`
**Branch:** `claude/wonderful-tesla-53lgo4` (all work lives here)
**Owner:** Alexander J. Henderson (hendeal@iu.edu), IU Kelley, BS Business
(Economic Consulting, Business Analytics, Sustainable Business), May 2027.

---

## 1. What the study is

A regression of **advertised pay** on attributes stated in early-career job
postings in the **energy and data center sector**.

- **Dependent variable:** `log(pay_midpoint)` — log of the midpoint of the
  employer-stated pay range, annualized to USD.
- **Hard constraint from the owner:** **N ≥ 100 usable observations.**
  Non-negotiable; it has been restated repeatedly.
- **Deliverables:** paper + dataset + code + presentation. All four regenerate
  automatically from committed artifacts on every collection run.

## 2. The two facts that shaped everything

1. **LinkedIn cannot be scraped within its terms.** User Agreement §8.2 bars
   scripts, robots and crawlers, which covers the `jobs-guest` JSON endpoint,
   not just browser automation. Indeed (terms bar scraping, Publisher API
   retired) and Handshake (school login, bars automated access) fail for the
   same reason. **Do not revisit this.** The study uses public, unauthenticated
   ATS APIs — the upstream systems employers syndicate to job boards from.
2. **This session's environment cannot collect data.** The egress proxy returns
   403 at CONNECT for every job host. **All collection runs in GitHub Actions.**
   Dispatch `collect.yml`; never try to fetch a job board locally.

What makes the study possible at all: **Illinois HB 3129** (effective
2025-01-01) obliges employers with 15+ staff to publish pay scale *and* a
benefits description in postings for Illinois work.

## 3. Scope, and why it is what it is

The original scope — software/data roles at core operators within 35 miles of
Chicago or Indianapolis — was measured against ~2,578 real postings and
returned **zero** usable observations. Under 0.5% of these employers' postings
are software/data roles anywhere on earth.

Rather than guess at alternatives, a **probe collection** (`data/probe/`,
`data/probe_tier3/`) gathered every in-metro posting regardless of role so each
candidate scope could be counted. Measured yields, one cycle:

| Configuration | Usable |
|---|---|
| Original scope | 0 |
| All roles, Chicago+Indy, strict early-career | 30 |
| All roles + admit unstated experience | 65 |
| All roles + Tier 3 + admit unstated | 131 |
| **Energy-analytics core taxonomy** (what is now configured) | **32** |

The binding constraint was never roles or geography — it is the **early-career
definition**. With the role screen lifted entirely, 401 postings die on
seniority and 227 on a conservative default. Widening geography nationally
recovers **5** postings; widening roles recovers ~180.

Current scope, all decided with the owner:

| Dimension | Setting |
|---|---|
| Roles | Energy analytics core: siting/development, regulatory/compliance, market/procurement, grid analytics, AI/ML, GIS, energy finance, software/data |
| Engineering | Analytics-adjacent only (grid integration, interconnection, modelling, planning). Mechanical/electrical/thermal/commissioning excluded |
| Industry | 9 categories — utility, cooperative, retailer, grid_operator, data_center, energy_analytics, developer, consulting, grid_vendor |
| Metros | Chicago, Indianapolis + Tier 3: Northern Virginia, Denver, Twin Cities, Seattle |
| Early career | ≤3 years; unstated experience admitted with `yrs_exp_stated` control |
| Degree | NOT required — `degree_required` is a regressor. Only 48 of 121 postings state one |
| Internships | Excluded; full-time rotational/new-grad programs kept |
| Employers | 266 |

## 4. Bugs already found and fixed — do not reintroduce these

Every one was caught by testing or by reading real output, and each is pinned
by a regression test.

| Bug | Consequence |
|---|---|
| Slug discovery matched an Ashby board `constellation` belonging to a **San Francisco AI startup** | Wrong company's postings entered the dataset. Name-matching does NOT fix it — both are called Constellation. Sector-confidence does |
| `" i "` substring-matched the **i inside "engineer"** | Every posting passed the early-career screen |
| `"between $45 and $55 per hour"` parsed as a single figure | **$93,600 instead of $104,000** — a confident wrong number |
| Bare `certification` / `leadership` / `vision` matched **company boilerplate** | 31/53, 37/53, 20/53 false positives, perfectly correlated within employer |
| `"internship"` did not match **"Internships"** (plural) | An internship at $50,960 reached a live measurement |
| Workday `"3 Locations"` read as an out-of-radius place | Multi-site postings silently dropped |
| **Sector gate substring-matched generic words** | The AI startup returned at 43% — `pipeline` on "architecting pipelines", `load` on "dataloaders", `generation` on "next-generation". **It had been validated against a reconstruction of the board, not the real text** |
| **Generic single-word slugs matched unrelated companies** | Eleven boards, 366 postings (41% of a run): `via` = public-transit software (168 postings), `pattern` = e-commerce, `tomorrow` = Tomorrow.io weather, `public` = a trading app |
| Pre-screen made a real board look **unfound** | Conflated "no board" with "nothing in scope" |
| All-roles probe option **bypassed screening entirely** | Reported 176 usable; true figure 30 |

## 5. Architecture

```
config/scope.yaml       metros, role taxonomy, early-career rules, escalation
config/employers.yaml   266 employers, industry, ATS tokens, diversified guards
config/regressors.yaml  28 coded regressors — patterns live here, not in code
src/lmstudy/
  collect/ats.py        7 ATS adapters (Greenhouse, Lever, Ashby,
                        SmartRecruiters, Workable, Recruitee, Workday CXS)
  collect/discover.py   token probing + sector_confidence() safeguard
  collect/run.py        orchestration; --probe and --enable-tier3 modes
  filters.py            role/seniority/experience/internship; extract_job_level
  pay.py                range parsing, hourly annualization, log midpoint
  code_regressors.py    rule-based coding from config/regressors.yaml
  build_dataset.py      screening funnel -> postings.csv; role_family
  audit.py              stratified sampling + precision/recall/kappa
  analyze.py            OLS, employer-clustered SE, VIF, power, selection
scripts/                make_codebook / make_figures / make_paper /
                        make_slides.js / qa_slides / scope_probe
tests/run_all.py        every suite; no network needed
```

### The lesson behind the bug table

Most of these are not crashes. They are **confident wrong answers**: a pay
range parsed as $93,600 instead of $104,000, a regressor firing on every
posting an employer publishes, 168 transit-dispatcher postings entering an
energy study. They were found by reading real output, not by tests passing.

The sector-gate failure is the one to internalise. It was validated against a
*reconstruction* of the offending board rather than the real text, because the
real data had been deleted. The reconstruction lacked the vocabulary that
caused the failure, so the check looked sound and was reported as working.
**When validating a guard against a known bad case, use the real artifact.**

**Key safeguard — `sector_confidence()` in `discover.py`.** Most of the 266
employer tokens are slug-derived. A slug can land on a different company
sharing a name. The check measures the share of a board's own postings that
discuss substations, interconnection, megawatts, colocation. Real energy boards
Terms must be unambiguous in a technology company's postings, and matching is
word-bounded. Admission needs a 30% share **or** six distinct terms — the
second gate because Charles River Associates is a genuine energy consultancy at
7.5% share (most of its practice is antitrust and life sciences) but uses 11
distinct sector terms. It applies to every entry marked `verified: false`;
hand-verified tokens skip it. Twelve confirmed wrong tokens are listed under
`rejected_tokens` in `config/employers.yaml` and skipped at probe time.

## 6. How to run things

```bash
pip install -r requirements.txt
python tests/run_all.py                      # all suites, offline
python src/lmstudy/build_dataset.py          # rebuild from data/raw/
python src/lmstudy/analyze.py                # estimate the model
python src/lmstudy/audit.py sample --from-raw --n 100   # audit sheet
python scripts/scope_probe.py [--tier3]      # score candidate scopes
```

Collection is Actions-only: dispatch `collect.yml` (inputs `limit`,
`no_slugs`) or `scope-probe.yml` (input `tier3`). Use `no_slugs: true` — the
employer file already carries slug candidates, so the fallback only doubles
runtime.


---

## 7. Where the data actually stands (2026-09-21, run 35554269246)

**The floor is not met. 35 usable observations against a required 100.**

| | |
|---|---|
| Employers probed | 266 |
| Boards resolved | **35** (13%) |
| Postings collected | 529 |
| Passed screening | 72 |
| Unique in scope | 38 |
| **Usable (pay disclosed)** | **35** |
| Distinct employers | **8** |

Metros: Chicago 21, Denver 8, Northern Virginia 6.
Pay: median $81,000, mean $90,112, range $46,500–$148,500.

Role families are well spread, which is the encouraging part — the widened
taxonomy is capturing the intended work:
siting_dev 10, market_commercial 8, software_data 4, grid_power 4,
regulatory 4, ai_ml 3, gis 1.

### The three problems that matter, in order

1. **Employer concentration. Invenergy alone is 21 of 35 observations (60%).**
   With 8 clusters and one supplying most of the sample, employer-clustered
   standard errors are close to meaningless and the model is effectively
   describing one firm's pay ladder. This is more damaging than the raw N.
2. **Only 13% of employer boards resolved.** 231 of 266 employers returned
   nothing. Most tokens are slug-derived guesses; co-ops and retailers in
   particular tend to run smaller ATS platforms or plain career pages that
   none of the seven adapters cover.
3. **The screens, not collection, are the bottleneck.** Of 696 raw postings,
   624 fail screening — role 408, seniority 304, role-excluded 190. Collection
   is working; the population of early-career energy-analytics postings with
   disclosed pay is simply thin at any one moment.

### What would actually move N, in order of expected value

1. **Verify board tokens by hand for the largest employers.** The 231 that
   returned nothing are mostly wrong guesses, not absent boards. Reading a
   careers URL takes a minute per employer and converts directly into data.
   Start with the utilities and co-ops, which are regionally headquartered.
2. **Accumulate weekly flow.** The Monday cron adds new postings; the stock is
   a snapshot. This is the cheapest path and needs only time.
3. **Add an iCIMS or SuccessFactors adapter.** Exelon, ComEd, Constellation,
   Citizens Energy, TierPoint and Peoples Gas are all blocked on these, and
   they include the largest Chicago-area utility employer.
4. **Reconsider the seniority screen.** 304 rejections. Some "Senior
   Associate" roles at 2–4 years are arguably early career; the numeral
   currently excludes them regardless of stated experience.

### What is already done and should not be redone

Pipeline, 7 ATS adapters, 28 audited regressors, audit round 1 with three
systematic false positives fixed, sector gate rebuilt after a production
failure, `role_family`/`job_level`, regression with employer-clustered SEs and
interpretability guards, paper/figures/deck generators, 100+ tests.

`analyze.py` runs and `results.md` opens with an unmissable block stating the
estimates are not interpretable at 3.2 observations per regressor and 8
clusters. **Do not remove that block to make the paper look finished.**

---

## 8. Session 2 (2026-09-21, after compaction) — what changed and why

Nothing in the repo had changed after §7 was written: local and remote were
both at `3ba1284` and run 15 was the newest. What changed is the **reading** of
that run. §7's ranked list was written from the funnel summary; the
per-employer record says something different, and two of its four items were
wrong.

### The diagnosis §7 missed

**254 of the 266 employers are tagged `national`; only 18 declare a study
metro, and 16 of those 18 did not resolve.** The frame was expanded 30 → 266 by
adding national companies, whose boards are overwhelmingly jobs outside the
study radii. **27 of the 35 observations come from the two metro-headquartered
utilities** (Invenergy 21, AES Indiana 6); the other 236 employers supplied 8
between them.

So Invenergy at 60% and the shortfall against the floor are **one problem, not
two**: the frame optimised for employer count when the binding quantity is
*metro-resident* employer count.

### Two of §7's levers were measured and are not worth doing

| §7 said | Measured |
|---|---|
| Reconsider the seniority screen — 304 rejections | **Worth 1–2 observations.** Only 15 of the 304 also pass the role screen, 6 state ≤3 years, and those 6 are two requisitions duplicated across cities. The funnel counts each rejection reason independently, so it double-counts |
| 231 employers returned nothing, mostly bad guesses | True, but the *cause* is the national/metro split above, not token quality alone |

Also killed: the Workday pre-screen judges roles on title alone and looked
likely to over-reject. Of the 86 postings that pass the role screen with their
full description, **0% fail on title alone.** It is sound; leave it. And the
six Workday boards that list 742 postings and collect none are **correct** —
Duke is Charlotte, Vistra Irving, CyrusOne Dallas, Essential Bryn Mawr, PJM
Audubon PA.

### Two real bugs found and fixed

1. **Workday location format.** `'Arlington, VA'` resolved in scope;
   `'US - VA, Arlington'` did not. Workday writes `STATE, CITY` behind a
   country prefix, which parsed to the city "va" and was recorded as out of
   radius — silently dropping **14 role-matching Northern Virginia postings**.
   Fixed by `canonicalize_place()` in `geo.py`. The flip is deliberately narrow
   and the regression cases use the **real strings** from run 35554269246's
   manifest.
2. **Workday site names were guessed too narrowly.** NiSource's candidates were
   `NiSource_Careers` and `careers`; the real board is
   `nisource.wd1.myworkdayjobs.com/NiSource` — the tenant's own name in the
   employer's own casing, never tried, so NiSource was recorded as having no
   board at all. `workday_site_variants()` now derives sites from the tenant
   and from each segment of the employer name, ordered most-likely-first, and
   expands only for metro-resident employers.

### What this session unlocked

**`WebSearch` works here.** `WebFetch` is still blocked for every ATS host
*and* for ordinary corporate careers pages, and collection is still
Actions-only — but board tokens can now be verified from a session for the
first time. Hit rate is roughly 1 in 4, so it is worth spending on named
metro-resident employers, not on sweeping the frame.

Verified this way: **NiSource → Workday `nisource/NiSource`**, **Wabash Valley
Power → SmartRecruiters `WabashValleyPowerAlliance`**. Recorded as closed:
Tri-State runs Oracle iRecruitment; Hoosier Energy and Sargent & Lundy have no
identifiable supported ATS. Negative results are written into
`config/employers.yaml` so nobody re-chases them.

### iCIMS: the gap is confirmed, not overturned

iCIMS's standard XML feed goes **only to approved job boards** and its Job
Portal API is partner-gated with no self-serve tier. Three legitimate routes
remain untried: the JobThread syndication feed, `.jobs`/DirectEmployers, and —
probably best — the **CareerOneStop / National Labor Exchange API**, which is
free with a key and carries employer-permissioned postings.

The owner asked for Playwright as a fallback. It is **not built**: it
contradicts the project's founding constraint, iCIMS portal terms bar automated
access the way LinkedIn's do, and `docs/methods.md` documents a compliance
posture it would falsify. That stays an explicit decision on evidence, never a
default.

### Decisions taken with the owner this session

| Question | Decision |
|---|---|
| Frame strategy | **Metro-resident employers only.** Stop adding national firms |
| Nationwide-remote postings | Admit as a separate `remote_national` category, kept out of the metro contrasts |
| Fallback if still short | Add more pay-mandate metros (NYC, LA, Bay Area, Boston) |

### Where it stands

Rebuilt offline from the existing snapshots: **35 → 37 usable, 8 → 10 distinct
employers, Invenergy 60% → 57%.** Every existing metro count is unchanged. The
14 Northern Virginia postings are **not** in that figure — they were discarded
by the collection-time pre-screen and never reached `data/raw/`, so that gain
only lands on a fresh collection. 65 employers now carry a study metro, up
from 18.

**The floor is still not met, and concentration is still the binding problem.**
`analyze.py`'s interpretability block stays until both N ≥ 100 *and* the
cluster count is defensible. Judge the next run on **Invenergy's share
falling**, not on N alone.


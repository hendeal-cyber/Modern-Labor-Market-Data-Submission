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

**Key safeguard — `sector_confidence()` in `discover.py`.** Most of the 266
employer tokens are slug-derived. A slug can land on a different company
sharing a name. The check measures the share of a board's own postings that
discuss substations, interconnection, megawatts, colocation. Real energy boards
score 86–100%; the known false positive scores 0%; threshold is 25%. It applies
to every entry marked `verified: false`. Hand-verified tokens skip it.

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

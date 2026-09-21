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

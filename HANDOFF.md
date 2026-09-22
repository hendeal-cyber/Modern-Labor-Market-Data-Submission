# Handoff — Modern Labor Market Data Submission

## 0. Current state — READ THIS FIRST

*Everything below section 0 is layered history, oldest first. Where they
conflict, this section wins.*

| | |
|---|---|
| Usable observations (pay disclosed) | **137** |
| Unique postings in scope | 204 |
| Distinct employers | **23** |
| Largest employer | Invenergy, **28%** |
| Observations per regressor | 9.13 |
| Raw postings collected | 897 |

**The N ≥ 100 floor is met. The pre-registered SUBSTANCE conditions are not:**
employers are 23 against a target of 30, and the largest supplies 28%
against a ceiling of 25%. `docs/pre-registration.md` §7 called this "met in
letter and not in substance" before any of it was known. No significance claim
should rest on a marginal p-value without a wild cluster bootstrap.

### The headline result

Pay is stated in **82.4%** of postings in mandate states
(n=142) against **32.3%** where none applies
(n=62). It is **associational, not causal** — one
cross-section, no difference-in-differences.

Its *size* is sensitive to one jurisdiction, so it is always reported cut:

| Sample | Mandate | No mandate | Gap |
|---|---|---|---|
| All | 82.4% | 32.3% | 50pp |
| Excluding Virginia | 100.0% | 32.3% | 68pp |
| Excluding largest employer | 97.8% | 27.1% | 71pp |

Virginia's mandate took effect 2026-07-01. Almost every non-disclosing
mandate-state posting is a Virginia posting from one employer. **Outside
Virginia every mandate-state posting in this sample states pay.**

### Deliverables: complete

Paper (0 TODO markers), slide deck (QA clean), dataset, code, pre-registration,
codebook, audit log (3 rounds + an integrity check), limitations (17
entries), decision log, reproducibility
README. All regenerate from `data/raw/` with the commands in the README.

### What is NOT done

1. **BEA price parities are still not usable, and the near-miss is worth
   reading.** The filename was fixed (`SARPP.zip`) and the fetch then
   *succeeded* — 51 states, valid JSON, all tests green — and returned the
   **wrong table**: BEA's implicit price deflator, ~1.237x the true RPP, which
   would have inflated every real-pay figure by about 24%. Caught by checking
   the values against BEA's published figures: no state was below 100, which is
   impossible for an index centred on 100. `is_plausible_rpp()` now rejects
   that class outright. Pay remains nominal; **no deflator is imputed**. See
   `docs/limitations.md` §17.
2. **More employers.** This is the only thing that fixes the two failing
   conditions, and it is worth more than more postings. Hand-verifying a board
   token takes minutes and adds a cluster; NiSource and Wabash Valley Power
   both resolved that way.
3. **Audit round 4.** Rounds 1-3 each found real errors in the top rows by pay.
   Assume round 4 would too.


### What the model actually says

Three results a reader should know before opening the paper, because two of
them are easy to get backwards.

**Seniority dominates, as pre-registered (H1).** `seniority_rank`
+0.0679 per rung, p=0.0000 — the most precisely
estimated coefficient in the model.

**The AI premium attaches to the SKILL, not the role label.**
`skill_ml_ai` is +0.2364 (≈27%) at
p=0.0001, while `family_ai_ml` — the role-family classification —
is +0.0169 at p=0.8376, indistinguishable from zero.
Postings that *mention* ML or AI skills pay more; roles *classified* as AI/ML
do not differ. H4 was written against the role family and reads inconclusive,
which understates what is there. **Do not restate this as "AI roles pay
more".**

**H5 is contradicted.** `degree_required` is -0.1143
(≈-11%) at p=0.0027 —
a stated degree requirement is associated with **lower** advertised pay,
conditional on seniority. The paper reports it as contradicted and offers a
compositional conjecture (the best-paid technical postings increasingly say
"degree or equivalent experience"), labelled as a conjecture because testing it
needs a variable this dataset lacks. It was predicted positive; that is why it
is reported rather than quietly dropped.

### Operational cautions — two things that cost this session time

**A collection run can hang, and it blocks the queue.** `collect.yml` uses a
concurrency group, so a stuck run leaves the next one `pending` indefinitely.
One Monday cron sat `in_progress` for ~115 minutes with no step transition
against 41 minutes for an identical commit; cancelling it released the queued
run within minutes. If nothing lands, check whether an older run is wedged
before assuming your own run failed.

**Do not watch for a data commit by comparing the remote to a fixed baseline.**
It cannot tell your own pushes from the run's, and it produced two false
"the run landed" reports here. Test **ancestry** instead: the run has committed
when the remote tip is *not* an ancestor of local `HEAD`:

```bash
git fetch -q origin <branch>
git merge-base --is-ancestor FETCH_HEAD HEAD || echo "run committed"
```

### The one rule to carry forward

**Read the real output before believing it.** Every serious defect in this
project was found that way and none by a test passing: a Warsaw role at
$309,500 that had entered the US sample twice, a funnel whose own totals
disagreed with its own CSV, four misclassified rows sitting in the top eleven
by pay, a BEA deflator fetched in place of a price index, and an executive
summary naming predictors that were not significant. `postings.csv` is small
enough to read end to end; do that after every rebuild.

**And validate a guard against the real artifact, never a reconstruction.**
This project made that mistake twice. The sector gate was checked against a
rebuilt version of the board it was meant to reject, scored clean, and shipped
broken. Then the BEA parser was tested against a CSV written to look like
BEA's, passed every case, and fetched the wrong table. A test built from
something you wrote tests your imagination.

---

Written 2026-09-21. Read this first; it is the fastest path to being useful.

**Repo:** `hendeal-cyber/Modern-Labor-Market-Data-Submission`
**Branch:** `claude/wonderful-tesla-53lgo4` (all work lives here)
**Owner:** Alexander J. Henderson (hendeal@iu.edu), IU Kelley, BS Business
(Economic Consulting, Business Analytics, Sustainable Business), May 2027.

---

## 0.5 THE NEXT TASK — finish the token verification pass

**This is the single highest-value thing left, and it is the owner's explicit
instruction: verify every remaining source until each is either confirmed or
denied.** It is also the only thing that fixes the two failing pre-registered
conditions, because those are cluster problems and only employers fix them.

### Why this and nothing else

More postings from boards already resolving makes concentration **worse**.
Reading the manifest shows the ceiling plainly: **39 boards resolve but only
23 contribute a disclosed-pay observation**, and the gap is not a bug.

- **Collect but nothing in scope** — T5 Data Centers 90 postings → 0, Clearway
  50 → 0, Silicon Ranch, Origis, Tract. Construction and facilities work. The
  role screen is correct to drop them.
- **In scope but no pay** — Vistra 8 → 0, CyrusOne 5 → 0, PJM, Duke Indiana,
  Wabash Valley. All non-mandate states. They already count in the disclosure
  model's denominator.

So: **230 unresolved employers**, by industry —
utility 59, cooperative 31, retailer 30, data_center 23, developer 23, energy_analytics 22, consulting 19, grid_vendor 15, grid_operator 8.

### The method, including what does NOT work

- **`WebSearch` works. `WebFetch` does not** — it is blocked for every ATS host
  *and* for ordinary corporate careers pages (`sandc.com` was refused). So a
  token is confirmed by finding a **live job URL in search results**, never by
  opening the careers page.
- **Query shape matters a lot.** What worked:
  `"<company> careers job openings greenhouse board apply <city>"` — the engine
  surfaces `job-boards.greenhouse.io/<token>/jobs/<id>` in the results list.
  What failed: `boards.greenhouse.io OR jobs.lever.co OR ...` boolean forms, and
  quoting the host directly. Roughly **1 in 2** with the good shape.
- **Confirm from the URL, not the prose.** The summary text often says "no
  information found" while the results list contains the board URL. Read the
  links.

### Prioritise by mandate state, not by company size

A new board only becomes a **cluster** if its postings disclose pay. Disclosure
is near-universal in mandate states and about a quarter elsewhere, so an
employer headquartered in CA, CO, CT, DC, HI, IL, MD, MA, MN, NV, NJ, NY, RI,
VT, VA or WA is worth several times one that is not. The full table with
effective dates is `pay_mandate_states` in `config/scope.yaml`.

Within that, energy-analytics firms and economics consultancies beat developers
and data-centre builders: they post analyst roles the taxonomy admits, and they
tend to sit on Greenhouse, Lever or Ashby, which resolve reliably and return
full description text plus structured compensation.

### Build a ledger first

I was about to do this when the session ended, and it is the right first step.
Nothing durable currently records verification *attempts* — only outcomes — so
an interrupted pass gets re-chased. Create `config/token-verification.yaml`
keyed by employer with `status` (`confirmed` / `denied` / `unchecked`), the date,
the evidence URL for a confirmation, and the reason for a denial. Then work it
in priority order and commit as you go, so a usage-limit stop costs nothing.

### Already confirmed — do not re-verify (27 employers)

Hand-verified tokens carry `verified: true` and a `careers_url` in
`config/employers.yaml`. The four from the last pass, all wrong in ways no slug
derivation reaches:

| Employer | Token | Was |
|---|---|---|
| Arcadia | greenhouse `arcadiacareers` | `arcadiapower`, `arcadia` |
| The Brattle Group | greenhouse `thebrattlegroup` | `brattle` |
| New York ISO | greenhouse `nyiso` | `newyorkiso` + 2 variants |
| ERCOT | workday `ercot` / `ercot_careers` | site was `careers` |

### Already denied — do not re-chase (9 marked `ats_unidentified`)

Analysis Group, Concentric Energy Advisors, Enverus, Hoosier Energy, ICF, ISO New England, NERA Economic Consulting, Sargent and Lundy, Uplight.

Notable: **Concentric Energy Advisors** runs its own portal, and its
Marlborough MA Energy Analyst posts **$93,000 disclosed** — an exact role and
mandate-state fit. Genuinely unreachable. **NERA** routes to parent company
Marsh, where employer attribution would be wrong and the sector gate would
rightly reject it. **ICF** is Workday behind the `careers.icf.com` vanity
domain with the tenant not exposed.

Separately blocked with `blocked_reason` (7): Citizens Energy Group, ComEd, Constellation Energy, Exelon, Peoples Gas (WEC Energy Group), TierPoint, Tri-State Generation and Transmission —
iCIMS and SuccessFactors, verified closed by reading the terms, not assumed.
See §17 of `docs/limitations.md` before revisiting.

### One open anomaly

**Ascend Analytics is correctly verified and returns nothing.** 16 other
Greenhouse boards resolved on the same run, so it is not an API problem. Likely
an empty board, or its only open req is the evergreen "General Interest"
posting the API does not list. If it stays empty across several runs, look
closer rather than changing the token.

### Background, if you want it

`docs/decision-log.md` is the full history of how the study reached this state,
copied out of the authoring session's plan file so it survives. It is
historical — the early sections describe a scope that measured zero usable
observations — but it records what each decision was worth when it was made,
and every failure with how it was found. Not required reading to do the
verification pass.

### Honest expectation

The last pass converted 4 tokens into roughly 3 expected clusters. Reaching 30
from 23 needs on the order of **10 more confirmed boards in mandate
states**, which at a 1-in-2 search hit rate and 1-2 searches per employer is a
few hundred searches. It is worth doing and it will not finish in one sitting —
which is exactly why the ledger comes first.

### A collection run was in flight when this was written

Dispatched on the four new tokens and **had not committed yet**. Check it
before dispatching another: `git fetch` and see whether the remote is ahead. If
it landed, rebuild (`build_dataset.py`, `analyze.py`, then the `scripts/make_*`
generators) and **read the pay extremes before believing the numbers** — a
Warsaw role at $309,500 entered the US sample on exactly this kind of frame
expansion.

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

Added in the national-scope session. Same character: valid output, wrong
content.

| Bug | Consequence |
|---|---|
| Workday writes `US - VA, Arlington` — country prefix, then **STATE, CITY** | Parsed to the city "va", resolved to nothing, recorded as out of radius. **14 role-matching Northern Virginia postings dropped** |
| The remote fallback accepted **absence of evidence** as US scope | A **Warsaw, Poland** role entered the US sample **twice at $309,500** — the highest-paid observation at the time — because it resolved to no US state and read as "remote". A Dammam role came the same way. `is_us_remote()` now demands positive evidence |
| `git pull -X ours` in the workflow **merged derived artifacts** | `-X ours` resolves conflicting hunks our way but still takes non-conflicting hunks from BOTH sides. Two runs' outputs combined: a funnel reporting 103 while its own CSV held 204 rows. Raw snapshots *should* merge; derived files must be **regenerated** |
| BEA archive holds several tables; the loop took **the first that parsed** | Fetched `SAIRPD` (implicit price **deflator**, 2017 base) instead of `SARPP`. Every value 1.237x the true RPP — cumulative US inflation. Would have inflated every real-pay figure ~24%. **Tests passed; they were written against a CSV I invented** |
| `seniority_rank` took the **highest** match on a range title | "Resource Planning Analyst I or II or Senior" ranked at its ceiling. 6% of rows, biasing the headline regressor upward exactly where the pay range is widest. Ranked at the **floor** now |
| `mandate_state` read the **first-listed** state only | 23% of postings list several locations, and coverage attaches to the job's location, so any covered location counts. 9 rows wrong; 7 of them disclosed pay. Fix moved the headline gap 65pp → 71pp |
| Three out-of-scope roles admitted | A **lawyer** on `capital markets`; a **nuclear instructor** whose title mentions a DBA parenthetically; a **security analyst** that round 2's `security analyst` term missed because the title reads "Security **and Compliance** Analyst" and matching is contiguous |
| `admit_all_seniority` silently switched on `admit_unstated_experience` | Made strict mode unreachable. Whether every level is admitted says nothing about whether unstated-minimum postings are kept — separate policies, now separate code |
| The funnel is a `Counter`, so a stage that rejected nothing **dropped its key** | "Nothing was rejected on geography" was indistinguishable from "the geography stage did not run". Seeded so every stage reports a number, including zero |
| The **executive summary** named predictors that were not significant | Claimed "seniority, required experience and role family" predict pay; required experience is p=0.57 and AI/ML role family p=0.67. True of an earlier specification, drifted when the model changed, in the section most readers read. Now **generated from the fitted coefficients** |
| `yrs_exp_stated` was in the fitted model but **absent from the codebook** | A reader could not look up the variable doing the imputation work — and it is load-bearing: unstated postings are imputed to zero, so without the indicator that imputation is indistinguishable from a genuine "no experience required" |

## 5. Architecture

```
config/scope.yaml       metros, geography.national, role taxonomy, seniority
                        ranks, pay_mandate_states (16 jurisdictions + dates)
config/employers.yaml   272 employers, industry, ATS tokens, diversified
                        guards, rejected_tokens, ats_unidentified markers
config/regressors.yaml  28 coded regressors — patterns live here, not in code
src/lmstudy/
  netclient.py          PoliteSession: get_json / get_text (feeds) /
                        get_bytes (archives). Named so it cannot shadow the
                        stdlib `http` package, which it once did
  collect/ats.py        7 ATS adapters + fetch_syndication (RSS/Atom probe for
                        the iCIMS employers) and feed_quality(), which refuses
                        a feed of teasers rather than returning half a body
  collect/discover.py   token probing, sector_confidence(),
                        workday_site_variants()
  collect/run.py        orchestration; --probe and --enable-tier3 modes.
                        make_detail_filter() is the highest-stakes filter here
  geo.py                canonicalize_place(), resolve() for study metros,
                        resolve_us_state/resolve_us_states(), census_region(),
                        is_non_us(), is_us_remote()
  filters.py            role screen; seniority_rank() and is_level_range();
                        is_early_career() derived, not enforced
  pay.py                range parsing, hourly annualization, log midpoint
  code_regressors.py    rule-based coding from config/regressors.yaml
  build_dataset.py      screening funnel -> postings.csv; role_family;
                        asserts its own totals agree before writing
  audit.py              stratified sampling + precision/recall/kappa
  analyze.py            four pre-registered models, employer-clustered SE,
                        VIF, power, selection, disclosure robustness cuts
scripts/                make_codebook / make_figures / make_paper /
                        make_slides.js / qa_slides / scope_probe / fetch_rpp
tests/run_all.py        every suite; no network needed. Suites: pay, geo,
                        filters, regressors, pipeline, audit, analyze, feeds,
                        rpp, consistency
```

**Second safeguard — `tests/test_consistency.py`.** Every other suite tests a
function; this one tests that the paper, codebook, dataset and model output
agree. It exists because two failures here were invisible to unit tests: the
merged funnel, and a fitted regressor missing from the codebook. It also guards
the honesty properties that are one edit from vanishing — the interpretability
block, the non-causal label on the mandate contrast, the "price adjustment
unavailable" note, and the absence of TODO markers. Verified by breaking it.

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

# deliverables — pure functions of data/analysis/, safe to delete and rebuild
python scripts/make_figures.py
python scripts/make_paper.py                 # prints its TODO-marker count
python scripts/make_codebook.py
node   scripts/make_slides.js && python scripts/qa_slides.py
python scripts/fetch_rpp.py                  # Actions only; egress blocked here
```

Collection is Actions-only: dispatch `collect.yml` (inputs `limit`,
`no_slugs`) or `scope-probe.yml` (input `tier3`). Use `no_slugs: true` — the
employer file already carries slug candidates, so the fallback only doubles
runtime.


---

## 7. Historical: where the data stood at run 35554269246

*Superseded. Kept because the reasoning in it is still how the levers were
measured. For current numbers read section 0 at the top of this file.*

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
remain untried: the JobThread syndication feed, `.jobs`/DirectEmployers, and
the **CareerOneStop / National Labor Exchange API**, which carries
employer-permissioned postings. Note the NLx API is **not** a free self-serve
key — the Jobs APIs moved from CareerOneStop to NLx and access is granted by
the NLx Research Hub Governance Board through a data request form. Worth
applying for as research use; not something to plan around.

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

### Audit round 2 found four wrong rows in the top eleven by pay

`role_family` had never been checked against hand-coded truth. All 53
assignments were read against their real titles — the sample was small enough
to audit exhaustively rather than sample. **Six were wrong (89%, below the 0.90
standard), and four had reached a live measurement at ranks 1, 7, 8 and 11 by
pay.** They raised the mean 4.2% and the median 6.1%.

Causes, all the same class as the bugs already in §4 — a pattern matching
confidently and wrongly: the seniority numerals stopped at IV so "Analyst V"
read as early career; `lead` is word-bounded so it never matched "Leader";
security roles were named out of scope in the original plan but never encoded,
so "AI Cybersecurity Engineer" entered on a bare `ai` match at $148,500;
`role_family` returns the first match, so `acquisition` in `siting_dev` beat
`mergers` and bare `cad` in `gis` caught a drafter.

**Usable observations fell 42 → 38 as a result, and that is the right
direction.** A floor met by counting senior and out-of-scope roles is not worth
meeting. `gis` and `sustainability` now have zero observations — each had
exactly one and both were misclassified. Full entry in `docs/audit-log.md`.

**The lesson to carry forward:** both audit rounds found the same failure mode,
and neither was found by tests passing. Round 1 found regressors firing on
company boilerplate; round 2 found screens admitting senior roles. If you
change a pattern, read the real output it produces — `postings.csv` is small
enough to read end to end, and that is exactly how these were caught.

### Audit round 3 changed the headline number

Target was `seniority_rank` and `state` — the two variables the national
rescope introduced and nobody had checked against hand-coded truth. All 141
rows read, not sampled. **21 wrong: 85.1% accuracy, below the 0.90 standard.**

The one that mattered: **23% of rows list more than one location**, and `state`
and `metro` were assigned by *different* rules — nearest study metro versus
first parseable fragment — so they disagreed constantly (`state=UT` with
`metro=indianapolis`). For most fields that is untidy. For `mandate_state` it
is **wrong**, because a pay-transparency law attaches to the job's location, so
a posting naming any covered place is covered. Nine rows read 0 while listing a
mandate state elsewhere, and **seven of those nine disclosed pay** — which is
what coverage predicts.

That widened the disclosure gap from 65 to 71 points. **The fix strengthened
the headline, which is exactly why it needs stating clearly**: it was found by
auditing assignments rather than looking for a better number, its effect was
predicted (~70.7pp) *before* implementation, and it would have been reported
identically had the gap narrowed. It is a dated amendment in
`docs/pre-registration.md` §8, not a silent edit, and `states_listed` plus
`n_locations` are in the dataset so a reader preferring the first-listed rule
can recompute it.

The other two findings — range titles ranked at their ceiling, and three
out-of-scope roles admitted — are in the bug table above. Full entry in
`docs/audit-log.md`.

**Two things recorded as NOT defects so they are not re-litigated.**
"Associate" is genuinely ambiguous (a mid rung in banking, junior in
engineering, and both appear here), so it is documented rather than forced. And
five Invenergy rows that looked like duplicates are distinct requisitions
(R11187-1, R11315-2, R10740-1, R11186, R10973-1) — dedupe is working and my
first reading was wrong.

### Still open from round 1

`skill_cloud` firing on company blurbs, `benefit_equity` on diversity
language, `degree_stem` where a field name describes the team rather than the
requirement, and whether `soft_teamwork` is near-constant and uninformative.
Round 2 went after `role_family` instead and did not touch these.

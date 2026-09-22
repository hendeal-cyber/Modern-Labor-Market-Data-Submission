# Handoff — Modern Labor Market Data Submission

## RESUME HERE — handoff of 2026-09-22, after audit round 6

*A new conversation starts here. This block wins over everything below it.
§0 and later sections are history: §0 describes N = 165 (commit `7180497`),
which round 6 showed carried halved pay, misattributed employers and a
misdated mandate. Do not quote numbers from below this block.*

### State at handoff — AUDITED

| | Value |
|---|---|
| Branch | `claude/wonderful-tesla-53lgo4`. **It is the repository's DEFAULT branch** (GitHub API `default_branch`), so its `schedule:` crons fire: the daily 09:17 UTC collection is live. A scheduled run has fired before (run 20, 2026-09-21) |
| Audited commits | `7b386d3` (fixes + rebuilt data), `934fe45` (deliverables + docs) |
| **Usable N** | **214** (unique in scope 290, raw 2,084) |
| **Employer clusters** | **34** |
| **Largest employer** | **Invenergy 20.6%** (44 of 214) |
| Obs per regressor | 14.3. `interpretable: true`, no warnings. All four pre-registered conditions pass |
| Disclosure gap (H2) | 93.9% (n=164) vs 47.6% (n=126), **46pp**, 44–49 across cuts. **Associational, not causal** |
| Survives bootstrap AND region check | **`seniority_rank` only** (+0.121/rung, p 0.0001 / 0.0005). H1 supported |
| Passes bootstrap, withdrawn by region check | `region_northeast` (0.032 / 0.057), `skill_cloud` (0.046 / 0.058). Inconclusive |
| Not significant | `mandate_state` (−0.038, p 0.25), `region_south` (0.11), `region_west` (0.64), everything else |
| Tests | `tests/run_all.py` ALL SUITES PASSED, consistency 29/29, slide QA clean |
| Run 27 | Actions **35781235535**, dispatched 20:35 UTC with `no_slugs: true` at `934fe45`. **First live test of the detail cache.** Result not yet read |

### What round 6 found (full record: `docs/audit-log.md` round 6)

1. **The pay parser was still halving Invenergy.** The 2026-09-22 "fix"
   (`d9e6a7b`) only refused a leading zero. A window opening at
   "0,000.00 - $93,000.00" still parsed (0, 93000). 17 rows in run 26, 14 in
   the N = 165 deliverables, including the row round 5 called "a genuine
   entry-level band". Also: a "k" written once ("$200-235k"), Greenhouse's
   pay widget recording NYISO at its floor, and "$30 billion" / "25 states"
   read as hourly pay.
2. **This one defect manufactured two findings.** The halved rows were all in
   mandate states, mostly Illinois (the Midwest reference). With them fixed,
   `mandate_state` goes −0.171 → −0.038 and `region_west` +0.116 → +0.018.
   The "negative mandate level = disclosure selection" story in earlier
   deliverables is **withdrawn**.
3. Multi-rung titles were floored over keywords, not alternatives
   ("Manager/Sr Manager" ranked senior IC).
4. Off-taxonomy roles via variant wordings (HR, legal, accounting, security,
   civil drafting, equipment/IT reliability engineering, construction PMs).
5. **Group tenants**: every usable "Hitachi Energy" row was Hitachi High-Tech
   or Hitachi Vantara; Iron Mountain's was corporate IT.
   `requires_company_mention` now guards both.
6. **Connecticut** was coded as a posting mandate. Its posting law (Public Act
   26-12) takes effect **2026-10-01**. Mandate dates are now applied per
   snapshot. **From the first snapshot dated 2026-10-01 on, CT postings will
   count as covered automatically.** Expect the contrast to move then, and
   read it as a coding event, not a finding.
7. Where the run-26 jump came from: the round-5 concept screen reaching
   Workday's detail pre-screen (96 of 115 rows), **not** the page cap (8 Hitachi
   rows, none usable). Hitachi's tenant is truncated again, at exactly 3,000.

### Do these next, in order

1. **Read run 27** (a check-in is scheduled for ~21:31 UTC). Find its data
   commit with `git fetch origin claude/wonderful-tesla-53lgo4` and look for
   "Data: collection run". Then:
   - `manifest["detail_cache"]` in `data/raw/<date>/manifest.json`: `reused`
     should cover most Workday and SmartRecruiters detail fetches.
   - Compare `pay_disclosed` on reused rows with the same postings' values in
     the previous snapshot.
   - Review new rows as in round 6: every added row, then the pay extremes.
   - **If the cache misbehaves, set the cron in `collect.yml` back to weekly
     before 09:17 UTC.** That cron is live, because this is the default branch.
2. **Every daily run makes the deliverables stale.** The workflow commits only
   `data/`. After each run, read the new rows, then rebuild and regenerate:
   `PYTHONPATH=src python3 -m lmstudy.build_dataset`, `... -m lmstudy.analyze`,
   `PYTHONPATH=src python3 scripts/make_{codebook,exec_summary,figures,paper}.py`,
   `node scripts/make_slides.js`, `python3 tests/run_all.py`. Then commit.
   Consistency will show 26/29 until you do. That is the check working.
3. **Owner decision pending:** three QTS "Development Project Manager" rows are
   construction PMs by description (TX, GA, W. Texas; none discloses pay). A
   title-only screen cannot remove them without an employer-specific rule,
   which would be a new screening mechanism. Keeping them widens the gap by
   1.2pp.
4. Lower priority: 118 unchecked employers in
   `config/token-verification.yaml`. Retailers and utilities first (§0.5).

### Standing rules (unchanged, all still binding)

- **$0 spend.** Do not bypass anyone's terms: no LinkedIn, Indeed, Handshake,
  or iCIMS portal automation.
- **N ≥ 100 is non-negotiable.** Every observation must sit under the energy,
  utility or data center umbrella.
- Audit frequently. Read the pay extremes after every rebuild, **and check
  that the low bound is a plausible number and not just the midpoint**. Round
  5 read a halved row and passed it.
- Never remove `analyze.py`'s interpretability block by hand.
- Report N, clusters and largest-employer share together, always.
- Sabotage tests use a **backup copy** of the file, never `git checkout`.
- In test files, put the `if __name__ == "__main__":` guard at the **very
  end**.
- **Do not use `pkill -f <pattern>` or `pgrep -f` in a loop** in this
  environment. The pattern matches the shell running it. That killed a rebuild
  this session and hung a wait loop.
- `WebSearch` works from the session; `WebFetch` to ATS or careers hosts does
  not. Collection happens only in GitHub Actions.

## 0. Superseded state (N = 165, commit `7180497`) — contained round-6 defects; see RESUME HERE above

*Everything below section 0 is layered history, oldest first. Where they
conflict, this section wins.*

| | |
|---|---|
| Usable observations (pay disclosed) | **165** |
| Unique postings in scope | 210 |
| Distinct employers (= clusters) | **33** |
| Largest employer | Invenergy, **23.6%** |
| Observations per regressor | 11.0 |
| Raw postings collected | 1,940 |
| Hand-verified board tokens | 41 |

**All four pre-registered conditions pass for the first time.** N 165 against a
floor of 100; 33 employer clusters against a target of 30;
Invenergy supplies 23.6% against a ceiling of 25%;
11.0 observations per regressor against a floor of 10. **The
interpretability block in `analyze.py` and the paper is therefore down — by the
gate's own arithmetic, not by hand.** `analysis.json` carries
`"interpretable": true` with an empty warning list.

**Two gate defects were found on the run that cleared it**, both fixed and
both recorded as amendments in `docs/pre-registration.md` §8:

1. **Concentration was never tested.** §7 declares a single employer above a
   quarter of the sample a falsification condition. The gate checked
   observations per regressor, clusters and power, and said nothing about
   concentration — it would have reported `interpretable: true` at 40%. Same
   defect as the cluster gate reading 20 against a pre-registered 30.
2. **The bootstrap switched itself off at 30 clusters**, and so did the five
   consistency checks that would have noticed. The suite fell from 29 checks
   to 24 and still printed ALL SUITES PASSED. Every deliverable reads
   `wild_cluster_bootstrap` defensively, so the paper, summary, figures and
   deck would have silently reverted to asymptotic p-values — restoring seven
   findings the bootstrap had withdrawn, without an amendment, on the first
   run that looked good. It now runs unconditionally.

**Read the numbers above, not the ones in §7–§8 or in any commit message
before 2026-09-22.**

### The headline result

Pay is stated in **96.1%** of postings in mandate states
(n=129) against **50.6%** where none applies
(n=81). It is **associational, not causal** — one
cross-section, no difference-in-differences.

| Sample | Mandate | No mandate | Gap |
|---|---|---|---|
| All | 96.1% | 50.6% | 46pp |
| Excluding Virginia | 97.3% | 50.6% | 47pp |
| Excluding largest employer | 94.4% | 50.6% | 44pp |

Stable across cuts — a spread of 3 points.

### What the model actually says — REWRITTEN 2026-09-22 (third time)

**Four coefficients survive the wild cluster bootstrap**, up from one, because
the concept role screen added 18 observations and 4 employer clusters:

| Variable | Coefficient | Bootstrap p | Survives the region check |
|---|---|---|---|
| `seniority_rank` | +0.0874 per rung | 0.0002 | yes |
| `region_northeast` | +0.1837 | 0.0219 | yes |
| `region_south` | +0.1585 | 0.0207 | yes |
| `mandate_state` | -0.1718 | 0.0406 | no |

H1 as pre-registered: seniority is the dominant predictor.

**`mandate_state` is negative and that is not a contradiction of H2.** H2 is
about *whether* pay is disclosed, and the disclosure gap above is large and
stable. The negative level effect is what disclosure selection predicts: where
no law compels it, the employers that volunteer a range are disproportionately
the ones paying well, so the non-mandate rows are a high-paying self-selected
subset. It does not survive the region check and is reported as inconclusive.

**Still withdrawn:** the AI premium (`skill_ml_ai`, p=0.425),
H5-as-contradicted (`degree_required`, p=0.964), and
`remote_eligible` (p=0.220).

### Deliverables: complete

Paper (0 TODO markers), **standalone executive summary** (generated, not
written), slide deck (QA clean), dataset, code, pre-registration with 9 dated
amendments, codebook, audit log (5 rounds + an integrity check), limitations
(24 entries), decision log, **employer verification ledger**, reproducibility
README. All regenerate from `data/raw/`.

### What the model actually says — REWRITTEN 2026-09-22 (second time)

**Only one coefficient survives.** `seniority_rank` is
+0.0776 per rung at bootstrap
p=0.000, and it survives the region-robustness
cut at p=0.0015. H1 as pre-registered.
That is the whole list: `seniority_rank`.

**It nearly did not survive, and the reason is worth knowing.** On run 25's
data before the pay parser was fixed, `seniority_rank` read p=0.075 — it would
have been reported as inconclusive, leaving the study with no interpretable
pay finding at all. The parser was halving advertised pay on the largest
employer (see the bug table). Fixing it moved the headline regressor from
0.075 to 0.000. A data-quality defect was suppressing the only robust result.

**`mandate_state` is significant in the full sample (p=0.048,
-0.1784) and withdrawn by the region check**
(p=0.0925). Postings with no resolvable state have no
determinable mandate status and are coded uncovered, so dropping them changes
the contrast directly. Reported as inconclusive.

**Still withdrawn, from earlier today:** the AI premium (`skill_ml_ai`,
p=0.419), H5-as-contradicted (`degree_required`,
p=0.492), and `remote_eligible`
(p=0.151). `region_south`, which survived this
morning, is now p=0.055 and does not.

**Do not report any of them as findings.**

### What is NOT done

1. **More employers — still the only thing that fixes the two failing
   conditions.** 175 of 272 employers remain unchecked, but the ledger now
   records every attempt, so an interrupted pass costs nothing. Priority-1
   (mandate-state metros) is down from 49 unchecked to 12.
2. **Two platform leads, deliberately unclaimed.** Oracle Cloud HCM and
   `careers.electric.coop`. Both could unlock many employers; both stay shut
   because **their terms cannot be read from this environment**. See
   `docs/limitations.md` §9b.
3. **Audit round 5.** Round 1's open items have never been checked:
   `skill_cloud` on company blurbs, `benefit_equity` on diversity language,
   `degree_stem` where a field name describes the team, and whether
   `soft_teamwork` is near-constant. Rounds 1–4 each found real errors.
4. **Verify Avangrid's employer attribution.** Its board is the *parent*
   Iberdrola's tenant. Defensible, not verified — check the collected rows are
   Avangrid US roles before trusting the cluster.

**BEA price parities are DONE** — previous handoffs listed this first under
"not done". Run 23 fetched SARPP correctly: 51 states, vintage 2024, values
straddling 100 from AR 86.9 to CA 110.7, past `is_plausible_rpp()`. The
price-adjusted robustness check runs on 113 observations.

### 0.6 The bootstrap, and why it matters more than it sounds

`docs/pre-registration.md` §6 has required a wild cluster bootstrap before any
significance claim, below 30 clusters, since the day it was committed. It was
cited in eight places across the code, paper and limitations and **never
computed**. Implementing it withdrew most of the study's significance claims.

Restricted Cameron–Gelbach–Miller, Rademacher weights drawn once per employer,
**9,999 replications** — not 999, because at 999 `degree_required` returned
0.049, 0.063 and 0.082 on three seeds, straddling the threshold its verdict is
read from. It costs ~90s per run. `analyze.py` runs it unconditionally while
the gate binds, because deciding to run it only when a p-value looks marginal
would make the reported inference depend on the result.

Two related fixes: the interpretability gate tested `n_clusters < 20` where the
pre-registration says **30**, so at 23 clusters the cluster warning never
fired. And the simulation offered as evidence *for* clustering had **no
within-cluster correlation** — the employer shock reached one posting per
employer instead of all of them — so the 88–90% coverage figure quoted in three
documents had been measured on data where clustering does not bind. Corrected
figure: 92% coverage, and a cluster-level placebo rejected at 9.5% against a
nominal 5%.

### Operational cautions

**A collection run can hang, and it blocks the queue.** `collect.yml` uses a
concurrency group, so a stuck run leaves the next one `pending` indefinitely.
If nothing lands, check whether an older run is wedged before assuming yours
failed.

**Do not watch for a data commit against a fixed baseline.** Test ancestry:

```bash
git fetch -q origin <branch>
git merge-base --is-ancestor FETCH_HEAD HEAD || echo "run committed"
```

**The commit step has now lost work three times.** Most recently run 23:
`--autostash` stashed the regenerated paper and deck, failed to reapply them,
left both unmerged, and `git commit --amend` then failed with "Committing is
not possible because you have unmerged files" — swallowed by `|| true`. The
pre-rebuild commit was pushed instead: a `postings.csv` with 221 rows beside an
`analysis.json` describing 137. **The rebuild itself had worked perfectly.**
The step now discards regenerated deliverables before pulling, fails loudly on
any unmerged path, drops `|| true` from the estimate, and runs the consistency
suite before pushing. If a run's numbers look stale, suspect this first.

### The rules to carry forward

**Read the real output before believing it.** Every serious defect in this
project was found that way and none by a test passing. Audit round 4 — the
largest data-quality defect found so far — came from reading the twelve
highest-paid rows after a rebuild. `postings.csv` is small enough to read end
to end; do that every time.

**Validate a guard against the real artifact, never a reconstruction.** This
project has now made that mistake three times: the sector gate, the BEA parser,
and a placebo test of the bootstrap's per-cluster weighting that a deliberately
sabotaged implementation passed. A test built from something you wrote tests
your imagination.

**Measure the claim before you ship the comment.** Twice in one session I wrote
a justification that measurement then contradicted — that promoting `External`
unlocked employers (it unlocks zero of 252), and that a placebo test
distinguished per-cluster from per-observation weights (it does not, at any
cluster count this study has). Both comments now say what is true.

**A caveat that cannot stop applying is a claim.** The paper and `analysis.json`
both asserted the disclosure gap "is sensitive to Virginia" unconditionally.
True at a 21-point spread, false at 3. Both are computed now.

---

Written 2026-09-21, substantially revised 2026-09-22. Read this first.

**Repo:** `hendeal-cyber/Modern-Labor-Market-Data-Submission`
**Branch:** `claude/wonderful-tesla-53lgo4` (all work lives here)
**Owner:** Alexander J. Henderson (hendeal@iu.edu), IU Kelley, BS Business
(Economic Consulting, Business Analytics, Sustainable Business), May 2027.

---

## 0.5 THE NEXT TASK — continue the verification pass from the ledger

**The ledger now exists**, which is the main thing that changed. Earlier
versions of this section told you to build it first; that is done.
`config/token-verification.yaml` keys all 272 employers to a status, a date,
and either an evidence URL or a reason. **51 confirmed,
46 denied, 175 unchecked.** Nothing gets re-chased,
and a usage-limit stop costs nothing.

Two scripts maintain it. `scripts/make_token_ledger.py` initialises missing
rows and refreshes derived fields but **never overwrites a status, date,
evidence or reason** — a generator that could silently revert a decision would
be worse than none. `scripts/ledger_set.py` refuses a confirmation without an
evidence URL or a denial without a reason. `--report` prints the worklist in
priority order.

### Work it in this order

Priority is by **mandate state, not company size**: a board only becomes a
*cluster* if its postings disclose pay, and disclosure is near-universal in
mandate states and about 39% elsewhere.

**Priority 1 — mandate-state metros (12 left):**
AEP Energy, Connexus Energy, Dakota Electric Association, Genie Energy, Nicor Gas (Southern Company Gas), Opus One Solutions, PowerHouse Data Centers, Santanna Energy Services, Soltage, WGL Energy, Washington Gas, Wright-Hennepin Cooperative Electric.

**Priority 2 — energy-analytics and consulting firms (12 left):**
1898 and Co, Aurora Energy Research, Daymark Energy Advisors, Exponent, HDR, Kimley-Horn, London Economics International, POWER Engineers, Quanta Services, Stantec, Ulteig, WSP. These post the analyst roles the taxonomy admits and
tend to sit on Greenhouse, Lever or Ashby, which resolve reliably.

Then `3_known_metro` (7) and `4_unlocated`
(144), which is most of what remains and the thinnest.

### What the pass has taught, concretely

Hit rate was roughly **1 confirmation per 4 employers** across ~40 checked. The
pattern in the confirmations is worth more than the count:

- **Two of three utilities hide behind the PARENT company's Workday tenant.**
  Ameren Illinois is `ameren`, not `amerenillinois`. Avangrid is `iberdrola`.
  No slug derivation from the subsidiary name reaches either. When a utility is
  a subsidiary, **try the parent's name as the tenant.**
- **Casing is part of the token, on every platform.** NiSource's Workday site
  is `/NiSource`, not `/nisource`. Eversource's is `/ExternalSite`, not
  `/External`. GridPoint's SmartRecruiters token is `Gridpoint` — lower-case p,
  which is not how the company spells its own name. Guessing the casing from
  the brand fails, and a board probed with the wrong casing reads as *not
  existing at all*, which is how NiSource and Eversource were both missed.
- **Workday site names are a small, learnable set.** `External` (Xcel, NRECA,
  Ameren), `ExternalSite` (Eversource), `AEPCareerSite` (AEP), `AltaGas` (WGL —
  the parent's name), or the employer's own name. All are probed now; a tenant
  using something else will still read as boardless.
- **Tokens carry suffixes.** `gridmaticinc`, `arcadiacareers`, `thebrattlegroup`,
  `octoenergy`.
- **Query shape:** `"<company> careers job openings greenhouse board apply
  <city>"`. **Read the result LINKS, not the summary prose** — the summary
  frequently says nothing was found while the links contain the board URL.
- **`WebSearch` works; `WebFetch` is blocked** for ATS hosts *and* ordinary
  corporate careers pages. Confirm from a live job URL in the results, never by
  opening the careers page.

### The denials are a finding, not a failure

They cluster by **ATS platform**, and the unreachable platforms map onto *kinds
of employer* — municipal utilities on NEOGOV, cooperatives on
`careers.electric.coop`, half the large IOUs on iCIMS or SuccessFactors. That
is written up as `docs/limitations.md` §9b and belongs in the paper's
discussion of coverage, because it is a **selection** issue, not a logistics
one. Keep recording what you find instead of just that you failed.

### Measured yield, and where the remaining value is

The pass searched **76 employers and found 9 new distinct boards** — a 12%
board-yield rate. (12 confirmations were recorded, but Washington Gas and WGL
Energy share one board, and Ascend Analytics was already verified.)

Hit rate varies enormously by industry, and this is the targeting insight for
whoever continues:

Run `python scripts/make_token_ledger.py --rates` for the current measured
hit rate by industry and the expected yield from what is left. **It is a
command rather than a table because the table went stale every batch** — it
read 50% for retailers on 8 searches and 33% four searches later, and the
projected total fell from 21 to 13 as the easy confirmations ran out.

What has been stable is the **ordering**, and that is what the targeting advice
rests on: energy-analytics firms and retailers well ahead of everything else;
utilities and cooperatives thin; developers, data-centre operators, grid
vendors, grid operators and consultancies at **zero across 60-odd attempts**.
Skip the last group unless something else changes.

**Do not expect the concentration condition to be reachable.** Invenergy
supplies 39 observations; getting its share under 25% needs the usable sample
past ~156. N and cluster count are movable; concentration probably is not.
Report all three either way — `docs/pre-registration.md` §7 requires them
together.

### The cooperative gap is the one structural finding of the pass

**Eight of eight cooperatives checked are unreachable**, and for one reason:
they syndicate to NRECA's Cooperative Career Center (`careers.electric.coop`)
or run their own page. Great River Energy, United Power, CFC, Connexus, Dakota
Electric, Wright-Hennepin, ACES, Indiana Electric Cooperatives. **Four of them
post analyst roles with disclosed pay in mandate states** — Connexus's Business
Systems Analyst at $89–117k, Great River's at $105–144k, United Power's "GIS
and Data Analyst I-IV".

Cooperatives are non-profit and set pay differently from an investor-owned
utility, so excluding all of them removes a **pay regime**, not a handful of
rows. `docs/limitations.md` §9b says so, and it belongs in the paper's
discussion of coverage rather than buried as a logistics note.

### Do NOT

- Re-verify anything the ledger marks `confirmed` or `denied`.
- Automate Oracle Cloud HCM or `careers.electric.coop` without reading their
  terms. Both are tempting and both are shut for the reason iCIMS is.
- Remove the interpretability block, or lift a bootstrap verdict, to make the
  deliverable look finished. It comes down when N, clusters **and**
  largest-employer share all pass.

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

Added 2026-09-22. The first is the largest data-quality defect found in the
project; the rest are the same character as everything above — valid output,
wrong content.

| Bug | Consequence |
|---|---|
| **A multi-sector consultancy was 22% of the sample and three rows of it were energy** | Guidehouse contributed 65 in-scope rows. Of its 74 postings, **three** are energy work; the rest are public health ("Epidemiologist Data Scientist"), national security, federal law enforcement, fraud and generic IT ("ServiceNow Business Analyst", "Palantir Platform Engineer"). Charles River Associates the same at smaller scale. **`sector_confidence()` could not catch it — it judges a BOARD, and these boards do discuss energy, so they pass honestly.** Fixed by inverting the burden: `requires_sector_evidence` makes the POSTING prove it. N 154 → 120 |
| The **pre-registered wild cluster bootstrap was never computed** | Required in eight places, implemented in none. **Seven of nine coefficients significant under clustered SEs do not survive it.** The AI-premium finding and the H5 contradiction both went with it |
| The interpretability gate tested `n_clusters < 20`; the pre-registration says **30** | At the 23 clusters realized the cluster warning never fired, and had obs/regressor risen above 10 the whole block would have vanished. Lenient in exactly the direction that flatters the study |
| **`distinct_employers` counted the wrong sample** | Computed over all in-scope postings, then printed beside the estimation N. `results.md` and the slide deck read "137 postings with disclosed pay from 30 employers" when the cluster count was 23 — and **30 is exactly the pre-registered target**, so a failing condition displayed as met |
| The simulation justifying clustered SEs had **no within-cluster correlation** | `rng.normal(0, 0.04) if i < len(employers) else 0` gave each employer's shock to **one** of its ~50 postings while the comment claimed it "makes clustered SEs the correct choice". So the 88–90% coverage figure quoted in three documents was measured where clustering does not bind. It is also why a placebo test of the bootstrap's per-cluster weighting **passed under deliberate sabotage** |
| `feeder` was an ambiguous `STRONG_TERM` | Matched "feeder systems (procurement, travel, payroll, asset, grants)" in a federal finance posting — the same class as `pipeline` and `load` before it. Qualified to `distribution feeder`. Found by sweeping every snapshot for a strong term firing where no plain sector word appears |
| Screening flags were stamped at **collection** time | `diversified` / `off_umbrella` were written into each record by `run.py`, so a guard added today could not be applied to snapshots already committed. Screening is a decision about the corpus, not a property of the fetch; read from config at build time now |
| The commit step **discarded a correct rebuild** | `--autostash` left `paper/paper.md` and `presentation.pptx` unmerged, `git commit --amend` failed with "you have unmerged files", and `\|\| true` swallowed it. Run 23 pushed a CSV with 221 rows beside an `analysis.json` describing 137. Third time this step has lost work |
| Two **caveats that could not stop applying** | The paper and `analysis.json` both asserted the disclosure gap "is sensitive to Virginia" and "partial compliance with a three-month-old statute" unconditionally — true at a 21-point spread, false at 3. Computed from the measured spread now |
| `remote_eligible` was identified off the rows with **no resolvable region** | Nationwide-remote postings have all three census dummies at zero, so they sit in the Midwest reference *without being Midwest* — and they are precisely the remote-eligible ones. Significant at p=0.026 in full sample, p=0.333 without them. Now a reported robustness check |

| **The pay parser matched the CENTS of a figure as a zero low bound** | When the 260-char pay window starts mid-figure, `00 - $170,000.00` parsed as (0, 170000), so the midpoint came out at **exactly half the true high**. Halved pay on **twelve Invenergy postings — the largest employer, 27% of the sample, skewed junior**, flattening the very gradient the headline regressor measures. Verified to the dollar: (0+170,000)/2 = the 85,000 recorded. **It suppressed H1**: `seniority_rank` read p=0.075 before the fix and p=0.000 after |
| The same missing left boundary read a **grade code** as pay | AEP writes `Compensation Grade: SP20-010 Compensation Range: $116,255.00 - $177,503.00`. `SP20-010` parsed as 20-to-010, both under 1000, inferred hourly, annualized to $20,800-$41,600 — with the true range in the next clause. A "Principal" at $31,200. Six rows, wrong by 4.7x |
| Seven **parent/subsidiary pairs** could each resolve one board under two employer names | Ameren/Ameren Illinois, Itron/Itron Analytics, Vistra/Vistra Retail, CoreSite/American Tower, Enel X, the two American Waters, WGL/Washington Gas. `distinct_employers` is a FAILING pre-registered condition, so a phantom cluster moves the number deciding whether the study met its own standard — in the flattering direction, with no wrong arithmetic anywhere. Ameren was live |
| The **deck** still presented the six-metro Illinois-vs-Indiana study | And asserted the ML/AI premium that audit round 4 had withdrawn hours earlier. The deck is the artifact most likely to be shown without the paper beside it |
| The **coefficient figure** drew clustered CIs only | Seven intervals visibly excluded zero for coefficients the bootstrap cannot distinguish from zero. Survivors are solid now, the rest faded |
| The workflow's consistency gate compared a **stale paper against fresh data** | Run 24 collected 1,915 postings, rebuilt cleanly to 133 usable, and refused to commit. The gate was right and was comparing the wrong pair |

## 5. Architecture

```
config/scope.yaml       metros, geography.national, role taxonomy, seniority
                        ranks, pay_mandate_states (16 jurisdictions + dates)
config/employers.yaml   272 employers, industry, ATS tokens, diversified
                        guards, requires_sector_evidence (multi-sector
                        consultancies), rejected_tokens, ats_unidentified
config/token-verification.yaml
                        every employer: confirmed / denied / unchecked, with a
                        date and either an evidence URL or a reason
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
                        VIF, power, selection, disclosure robustness cuts,
                        wild_cluster_bootstrap() (9,999 reps, run whenever
                        clusters < CLUSTER_GATE=30), region_robustness
scripts/                make_codebook / make_figures / make_paper /
                        make_exec_summary / make_slides.js / qa_slides /
                        scope_probe / fetch_rpp /
                        make_token_ledger + ledger_set (verification ledger)
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

### Audit round 4 audited the umbrella itself, and it cost the most

Rounds 1–3 audited the coding rules. Nobody had audited whether every admitted
observation is actually energy, utility or data-center work — the owner's one
non-negotiable scope constraint. Round 4 did, on the run-23 sample.

**Found by reading the pay extremes after a rebuild**, which is the standing
rule: two titles in the top twelve were "Cloud and Health AI FinOps and
Technology Value Optimization" and "AWS Lakehouse Data Engineer".

The fix inverted the burden for multi-sector employers rather than enumerating
their off-umbrella practices, because enumeration is the "pattern matching
confidently and wrongly" failure this project keeps finding. **Three versions
of the test were measured against the committed snapshots and two were thrown
away** — each failed on real rows, not in principle:

| Test | Why it was rejected |
|---|---|
| One `STRONG_TERM` anywhere | `feeder` matching "feeder systems (procurement, travel, payroll)"; "NERC-CIP" listed beside NIST, HIPAA and SOC2 in generic cyber boilerplate |
| Three distinct core sector words | The firm's own boilerplate recites its practice areas and one is energy — **round 1's failure mode exactly** |
| Raw counts | "Data Analyst/Power Platform" says "power" eleven times and is a Microsoft product role |
| **Sector word in the TITLE** (adopted) | A multi-sector consultancy states the practice in the title. 3 of 74 at Guidehouse, 11 at CRA (every one energy-labelled), 3 at Brattle |

Deliberately **not** applied to pure-play energy firms — E3's "Analyst" is
energy work by virtue of the firm, and the test would wrongly drop it.

N fell 154 → 120 and the largest employer's share **rose** 25.3% → 32.5%. Both
are right: the off-umbrella rows had been padding the denominator, so 32.5% is
the honest figure and a failing pre-registered condition moved further from
passing. A floor met by counting public-health consulting is not worth meeting.

### Still open from round 1

`skill_cloud` firing on company blurbs, `benefit_equity` on diversity
language, `degree_stem` where a field name describes the team rather than the
requirement, and whether `soft_teamwork` is near-constant and uninformative.
Round 2 went after `role_family` instead and did not touch these.

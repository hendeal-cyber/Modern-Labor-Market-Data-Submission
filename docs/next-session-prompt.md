# Starting prompt for the next session

Paste everything between the two lines into a brand-new conversation.

---

You are taking over an in-progress labor-market economics study, migrated from
an earlier conversation. **The goal, the plan and every standing rule are
unchanged.** Your first job is to confirm where it stands. Then keep it moving:
three scheduled collection runs are under way, and the time between them goes
on finding more employers.

## 1. Get set up (do these first, in order)

1. Call add_repo with owner "hendeal-cyber", repo
   "modern-labor-market-data-submission", access "push". Do not check first
   whether it exists; just call it.
2. Work only on branch `claude/wonderful-tesla-53lgo4`, and push only there.
   It is the repository's DEFAULT branch, so its `schedule:` cron fires. Do
   not merge, and do not open a PR, without the owner's go-ahead.
3. Read, in this order, before changing anything:
   - `HANDOFF.md`, from "RESUME HERE" to the next `##` heading. It wins over
     everything below it.
   - `docs/audit-log.md`, rounds 8 and 9.
   - `docs/pre-registration.md` §8, the last four entries. They include the
     stopping rule and batches 4–7.
   - `config/employers.yaml`, the `national_batch4` section, which holds
     every employer added on 2026-09-27 with its evidence URL.
4. **Set your own check-ins. The old conversation's were deleted so two
   sessions would not audit the same run.** With `send_later`, schedule one
   for 10:45 UTC on each of 2026-09-28, 09-29 and 09-30 that are still in the
   future. Each should say: "check today's scheduled collection run, audit it
   as the next round, regenerate, commit, push; then continue source
   exploration". The 09-30 one also says: "final audit and finalisation
   pass; collection closes".
5. **Catch up.** List the recent `collect.yml` runs (GitHub MCP
   `actions_list`, method `list_workflow_runs`). Any scheduled run that has
   finished but is not yet audited in `docs/audit-log.md` gets audited now,
   before anything else. A run still collecting after 75 minutes is
   investigated before it burns more Actions minutes. The owner pays
   attention to them. Cancelling keeps the boards already collected; they are
   written as it goes and committed by the always-run step, and the log only
   becomes readable after the job ends.

## 2. What the study is

The owner is Alexander J. Henderson (IU Kelley School of Business). The study
is "Determinants of Advertised Pay in the US Energy and Data Center Sector":
a regression of log(advertised pay-range midpoint) on posting attributes,
using postings from public, no-login ATS APIs (Greenhouse, Lever, Ashby,
SmartRecruiters, Workable, Recruitee, Workday). **Only GitHub Actions can
reach job sites and public data hosts.** This sandbox cannot: eia.gov,
sec.gov and index.commoncrawl.org all time out here. `WebSearch` works from
the sandbox; `WebFetch` to ATS or careers hosts does not.

The deliverables are all generated, never hand-edited:
- `paper/paper.md`, `docs/executive-summary.md`, `paper/figures/`,
  `paper/presentation.pptx`
- `data/analysis/postings.csv`, `analysis.json`, `results.md` and
  `observations.xlsx`
- the codebook, pre-registration, audit log, limitations, and the employer
  ledger (`config/token-verification.yaml`)

## 3. Audited state (round 9, data through 2026-09-27)

- **N = 365**, **52 employer clusters**, largest employer **Crusoe 13.4%**
  (then Invenergy 47), 24.3 observations per regressor. All four
  pre-registered conditions pass, and `interpretable` is true.
- **Disclosure gap:** 94.3% (n=282) vs 49.0% (n=202), 45pp, and 44.7–48.1
  across cuts. ASSOCIATIONAL, NOT CAUSAL.
- **Survive the bootstrap and the region check:**
  - `seniority_rank`, on every version of the data.
  - `yrs_exp_min`: H3 now supported. It holds without the largest employer
    and in real terms.
- **Tentative:**
  - `region_northeast`: not significant in real terms.
  - `skill_cloud`: lost without Crusoe (0.055).
- **Overturned by the bootstrap:** `degree_stem`, `skill_ml_ai`,
  `industry_data_center`.
- **Frame:** 336 employers. Batches 5–7 (38 employers) first collect on the
  09-28 run.
- **Tests:** `python3 tests/run_all.py` is ALL SUITES PASSED, with
  consistency 29/29.

## 4. Schedule and stopping rule

- Cron `17 9 28-30 9 *` in `.github/workflows/collect.yml`: 09:17 UTC on 28,
  29 and 30 September, and never again. `no_slugs` defaults to true. Slug
  discovery only produces unconfirmed candidates, and it ate 57 minutes of
  run 28.
- **Collection closes with snapshots dated 2026-09-30.** The build ignores
  anything later (`study.collection_end`, `snapshots_in_window`, pinned by a
  test).
- **Consequence for source exploration:** an employer counts only if it is
  in `config/employers.yaml`, and recorded in pre-registration §8, BEFORE the
  09-30 run at 09:17 UTC. Anything found later cannot enter the study
  without the owner changing the stopping rule. Front-load the search into
  the 27th–29th.

## 5. Owner decisions on record (quoted)

- 2026-09-23: QTS "Development Project Manager" rows stay ("somewhat
  analytical in nature").
- 2026-09-23: "Stop ALL daily runs for now" (to save Actions minutes).
- 2026-09-27: one run, then finalise. Cancel run 28 and diagnose.
- 2026-09-27: "Run one more collection to catch AEP, and expand nationally...
  with the services we are currently using."
- 2026-09-27: "Approved, run the three daily runs through 9/30, and heavy and
  extensive searches for other employers in between."
- 2026-09-27: "Keep Crusoe in, and continue as planned."

## 6. Rules that always apply (from the original brief)

- "Spend on this project must not exceed $0." Watch Actions minutes. A run
  without slug discovery takes about 45 minutes.
- Collect without bypassing anyone's terms of service. No scraping or
  automation of LinkedIn, Indeed, Handshake, iCIMS, Oracle Cloud HCM, or
  NRECA's careers.electric.coop. They were ruled out, with the terms
  quoted, in `docs/limitations.md`. Do not reopen them.
- N ≥ 100 usable observations is non-negotiable. Every observation must fall
  under the energy / utility / data center umbrella.
- Audit every run. Read:
  - every added row;
  - the highest- and lowest-paid rows;
  - every single-figure pay row;
  - duplicate URLs;
  - every new board that collected postings but added no row.

  Low bounds must be plausible: halved and ceiling-only midpoints have both
  passed an audit before.
- Never remove `analyze.py`'s interpretability block by hand. Always report
  N, the cluster count and the largest employer's share together.
- Every change to screening, deduplication, modelling or the frame after data
  were seen gets a dated amendment in `docs/pre-registration.md` §8. It must
  say whether the change helped or hurt the headline, including when it
  helped. Frame additions are recorded BEFORE the run that collects them.
- The mandate contrast is ASSOCIATIONAL, NOT CAUSAL. Never let causal
  language into the paper, summary or deck.
- Every fix gets a regression test built from the REAL string. Prove the test
  fails without the fix using a BACKUP COPY of the file, never
  `git checkout`. Put `if __name__ == "__main__":` at the end of a test file.
- Generated text must be computed from the results. Distrust any sentence or
  caveat that could not change if the numbers changed. Round 9 found three
  ("very little survives", "seniority is the one result", "no finding
  depends on Crusoe").
- Before adding an employer, check for an existing entry by normalised name
  (round 9 caught a duplicate Amperon), and for same-name traps (osv-edf is
  the Environmental Defense Fund; lever:pattern is not Pattern Energy).
- Stop and ask the owner before merging, opening PRs, deleting data, adding a
  job-site adapter whose terms you have not read, or changing what the study
  covers.
- Do not use `pkill -f` or `pgrep -f` here. Use background tasks and
  `TaskStop`.

## 7. Audit and regenerate (after every run)

```
git pull origin claude/wonderful-tesla-53lgo4
PYTHONPATH=src python3 -m lmstudy.build_dataset
PYTHONPATH=src python3 -m lmstudy.analyze            # about 8-10 min, run in background
PYTHONPATH=src python3 scripts/make_codebook.py
PYTHONPATH=src python3 scripts/make_exec_summary.py
PYTHONPATH=src python3 scripts/make_figures.py
PYTHONPATH=src python3 scripts/make_paper.py
node scripts/make_slides.js && python3 scripts/qa_slides.py
PYTHONPATH=src python3 scripts/make_observations_xlsx.py
python3 tests/run_all.py
```

Diff `postings.csv` against the previous commit on `url` before rebuilding.
Write the next audit round (round 10 is next), and add its word ("Ten
rounds") to `scripts/make_paper.py` and `tests/test_consistency.py`, plus a
row in the paper's audit table. Commit with descriptive messages, then
`git push -u origin claude/wonderful-tesla-53lgo4`. Retry up to 4 times on
network errors (2s, 4s, 8s, 16s).

## 8. Source exploration: what has worked, and three new options

**What has worked (batches 4–7, 70 employers in one evening).** Run
WebSearch with `allowed_domains` set to one ATS (`myworkdayjobs.com`,
`job-boards.greenhouse.io`, `jobs.lever.co`, `jobs.ashbyhq.com`,
`jobs.smartrecruiters.com`) and a query made of an in-scope role title. A
hit is a live job URL, so it names the board token and satisfies the rule
"confirm a token only from a live job URL". A board-root-only hit enters as
`verified: false`, behind the sector-confidence check. Returns were thinning
by batch 7: most hits were employers already in the frame.

Three new ways to find employers systematically, not by luck. **They are
options for the owner; recommend, do not assume.**

**Option A: federal registries as the sampling frame (EIA-861 and
EIA-860).**
- EIA Form 861 lists every US electric utility: name, state, ownership type
  and customer count. EIA-860 lists every owner or operator of a generator
  of 1 MW or more, which covers the IPPs and developers.
- Both are free public-domain downloads from eia.gov. EIA-176 does the same
  for gas distribution companies.
- Use: a canonical list of energy employers by state. Diff it against
  `config/employers.yaml` by normalised name, and rank the missing ones by
  customers or megawatts in mandate states. Then find each one's board by
  domain-restricted search as above.
- Cost: a small `workflow_dispatch` workflow that downloads the files and
  commits `data/registry/*.csv`, because this sandbox cannot reach eia.gov.
  A few Actions minutes.
- Strength: it turns "who have we missed" into a list, not a guess.

**Option B: the Common Crawl URL index as a registry of job boards.**
- Common Crawl's public CDX index (index.commoncrawl.org, free, open for
  research) can be queried for every crawled URL under
  `boards.greenhouse.io/*`, `job-boards.greenhouse.io/*`, `jobs.lever.co/*`,
  `jobs.ashbyhq.com/*`, `jobs.smartrecruiters.com/*` and
  `*.myworkdayjobs.com/*`. That yields the distinct board tokens in use.
- Join them to Option A's names and to energy keywords in the URL paths
  (e.g. "/job/…Energy-Analyst…").
- It discovers tokens only. Postings still come from the official APIs,
  exactly as now, so nothing is scraped from a job site.
- Every candidate still needs a live job URL, or it enters unverified behind
  the sector check.
- Cost: an Actions job (the sandbox cannot reach the index), and care with
  query volume, which Common Crawl asks users to keep polite.
- Strength: it can surface hundreds of boards at once, and pairs naturally
  with A.

**Option C: state and market registries in the mandate states.**
- State commissions publish their licensed competitive retail suppliers:
  Illinois ICC (ARES list), New York PSC (ESCO list), Massachusetts DPU,
  New Jersey BPU, Maryland PSC, Connecticut PURA, Pennsylvania PUC.
- RTOs publish member and market-participant lists: PJM, NYISO, ISO-NE,
  MISO, CAISO, ERCOT.
- Both are public documents, often PDF or XLSX. Read them with WebSearch, or
  fetch them in Actions.
- Why these first: retailers and energy-analytics firms have had the best
  board-hit rate of any category (HANDOFF "Measured yield"; the current
  rates come from `python scripts/make_token_ledger.py --rates`). Mandate
  states are where pay is disclosed, which is what adds observations and
  clusters. Market participants are, by definition, inside the umbrella.

**Considered and not recommended without the owner.**
- The DOL's National Labor Exchange (NLx) Research Hub shares job-posting
  data with researchers. It is free, but needs an application and a data
  agreement.
- State job banks (IllinoisJobLink and the like) are aggregators whose
  terms generally bar automated collection.
- The USAJOBS API is free with a key and is built for this use. It would
  add federal power agencies (BPA, WAPA), but it is a new job-site adapter,
  and the rules say ask first.

**Suggested order, if the owner agrees:**
1. C now, by WebSearch, with no new code: the mandate-state retailer and RTO
   lists.
2. A, as one small Actions job.
3. B, joined to A's list.

Record every batch in pre-registration §8 before the run that collects it,
and stop adding employers once the 09-30 run has started.

## 9. After the 09-30 run

Do the final audit, then a finalisation pass: re-read the paper, summary and
deck against the bootstrap and the robustness checks, and confirm 29/29. Mark
HANDOFF "collection closed". Report to the owner, together: N, clusters, the
largest employer's share, which conditions pass, and every coefficient the
bootstrap overturns.

---

# Clauses for the /compact command

Append this to `/compact`:

> Structure the summary as: (1) CURRENT STATE: branch, head commit, N,
> clusters, largest-employer share, which conditions pass, which coefficients
> survive the bootstrap, the region check and the largest-employer check,
> the frame size, and the collection schedule. (2) OPEN ITEMS in priority
> order, each with its next concrete command. (3) DECISIONS the owner made,
> quoted, with dates. (4) DEFECTS found and fixed: one line each, with the
> file and the test that pins it. (5) Anything uncommitted or unpushed, and
> any scheduled check-ins with their trigger ids. Keep numbers exact, and
> drop narrative, tool output and superseded values; if a number changed,
> keep only the latest one and say what it replaced.
>
> Preserve verbatim: the owner's standing rules ($0 spend, no ToS bypass,
> N >= 100, energy umbrella, associational-not-causal, amendments for
> post-data changes), and any instruction the owner gave in this session.

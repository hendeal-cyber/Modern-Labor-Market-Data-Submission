# Starting prompt for the next session (or for resuming after /compact)

Paste everything between the two lines into the new conversation. After a
/compact in the same session, read it from `docs/next-session-prompt.md`.

---

You are continuing an in-progress labor-market economics study. **The rules
below are unchanged. Confirm the state before acting, then act.**

## 1. Get set up (in order)

1. Call add_repo with owner "hendeal-cyber", repo
   "modern-labor-market-data-submission", access "push" (do not pre-check it).
   The clone may already be at /home/user/Modern-Labor-Market-Data-Submission.
2. Work only on `claude/wonderful-tesla-53lgo4`, the DEFAULT branch, whose
   `schedule:` cron fires. Push only there. Never merge or open a PR without
   the owner.
3. Read, in order: `HANDOFF.md` (RESUME HERE, to the next `##`);
   `docs/audit-log.md` round 10 and the interim check of 2026-09-27;
   `docs/pre-registration.md` §8, the last six entries.
4. Check-ins exist for **2026-09-29 and 09-30 at 10:45 UTC**
   (trig_01UR6mPtfXF2j7P9rnnT8Xih, trig_01DZEo3k1e41Gxp5aBxXaPuY).
   `list_triggers` confirms them. A new conversation must delete these
   and set its own, so two sessions never audit one run.
5. List `collect.yml` runs (GitHub MCP `actions_list`). Audit any finished
   run not yet in the audit log before anything else. Investigate any run
   collecting for over 75 minutes.

## 2. What the study is

Owner: Alexander J. Henderson (IU Kelley School of Business). "Determinants
of Advertised Pay in the US Energy and Data Center Sector". It regresses
log(advertised pay-range midpoint) on posting attributes, using postings
from public ATS APIs (Greenhouse, Lever, Ashby, SmartRecruiters, Workable,
Recruitee, Workday) and, since 2026-09-28, the official USAJOBS Search API.
**Only GitHub Actions can reach job sites and data hosts.** The sandbox
cannot. `WebSearch` works here; `WebFetch` to ATS or careers hosts does not.
Registry fetches go through `.github/workflows/sources.yml` (`--only
pages,eia,cc,usajobs`). Deliverables are all generated, never hand-edited:
paper, executive summary, figures, deck, `data/analysis/*`, codebook,
pre-registration, audit log, limitations and ledger.

## 3. Audited state (round 10, data through run 30, 2026-09-28)

- **N = 472**, **86 employer clusters**, largest employer **Crusoe 10.4%**
  (49 rows). 31.5 observations per regressor, so the budget rule selects
  **Model 2 (extended)**. All four conditions pass; `interpretable` true.
- **Disclosure gap:** 91.7% (n=384) vs 48.6% (n=247), **43.1pp**, 42.3–44.8
  across four cuts (incl. `excluding_federal`). ASSOCIATIONAL, NOT CAUSAL.
- **Survive the bootstrap and the region check:**
  - `seniority_rank` and `yrs_exp_min`: robust everywhere.
  - `skill_cloud` (0.0014): robust to Crusoe and to prices; exploratory.
  - `region_northeast`: not significant in real terms.
  - **New and tentative:** `region_west` (0.020, not in real terms) and
    `degree_stem` (0.024, **fails without Crusoe**).
- **Inconclusive:** `skill_ml_ai` (0.059).
- **Frame:** 404 employers (batch 13 federal agencies and batch 14, 29 employers under option D, added after round 10). Batches 4–12 (2026-09-27/28) each carry an evidence URL
  in `config/employers.yaml`.
- **USAJOBS:** key works. The preflight found BPA 13 postings, WAPA 15, SWPA
  0 and TVA 0. One federal row entered (WAPA, Public Utilities Specialist).
- **Tests:** ALL SUITES PASSED (13 suites), consistency 29/29.

## 4. Schedule and stopping rule (as registered now)

- The run of 09-28 was dispatched by hand at 00:36 UTC at the owner's
  request. Cron `17 9 29-30 9 *` covers the other two.
- **Collection closes with snapshots dated 2026-09-30**
  (`study.collection_end`, `snapshots_in_window`, pinned by a test). Frame
  additions count only if they are in `employers.yaml` and §8 before the
  09-30 run starts.
- Connecticut's posting law starts 2026-10-01. Mandates are coded per
  snapshot date, so any extension past 09-30 is a coding event for CT rows.

## 5. Owner decisions on record (quoted)

- 2026-09-23: QTS "Development Project Manager" rows stay.
- 2026-09-27: "Keep Crusoe in, and continue as planned."
- 2026-09-27: "Please write in recommendations 1-3 AND USA jobs into the
  handoff, as I would like to pursue ALL of these options." (All four source
  routes approved; all four are built.)
- 2026-09-27: "Approved, run the three daily runs through 9/30, and heavy
  and extensive searches for other employers in between."
- 2026-09-28: USAJOBS secrets added ("I added the USAJOBS secrets, continue
  as planned").
- 2026-09-28: "Yes, admit the Public Utilities Specialist series as an
  amendment."
- 2026-09-28: run the 09-28 collection now rather than at 09:17 (done).
- 2026-09-28: the owner wants **~1,000 observations**, "a full national
  scale, to the extent possible", and USAJOBS extended "from FERC to NERC,
  etc." (~100 jobs).
- 2026-09-28: **"I approve options C and D."** A and B are NOT approved: the
  role taxonomy and the 2026-09-30 end of collection stand. C was done at
  once (batch 13: FERC `DNFE`, NRC `NU00`, DOE HQ `DN00`, Reclamation
  `IN07`, BOEM `IN27`; the last three require sector evidence; coded
  `utility`; the Army Corps left out; NERC is not federal, so search its
  own ATS). Frame 375.

## 6. OPEN: the path to ~1,000 observations (measured 2026-09-28)

Measured on the 3,745 unique raw postings collected so far:

| Lever | Expected gain in usable N | What it changes | Needs |
|---|---|---|---|
| A. Broaden the role taxonomy from software/data/analytics to **all salaried professional roles** (finance, project management, customer success, engineering, operations management), still excluding field, trades, technicians and internships | **about +400 to +550** from data already on disk: 640 US pay-disclosed postings are now rejected only as "not software/data", before the sector and group filters | The population becomes "professional roles in the sector". It is a change made after seeing data, so report it as a **second, clearly labelled population**, with the pre-registered analytics-role population kept as the primary result | Owner decision; dated §8 amendment; both populations reported |
| B. **Extend collection** past 2026-09-30 to a new fixed end date, declared before the extra runs (e.g. 2026-10-14, daily) | About +5 to +20 usable a day from new postings, more while new employers keep being added | The registered stopping rule. Fix the new date in advance, never "until N is reached". CT turns covered on 10-01, a coding event | Owner decision; amend `study.collection_end`, the cron and the test pinning it |
| C. **More federal agencies** via USAJOBS: FERC (`DNFE`), NRC, EIA, DOE Office of Electricity and Grid Deployment and Loan Programs (DOE subelements), Bureau of Reclamation power, USACE hydropower | About +10 to +40 rows at any time (open postings, not ~100 in-scope ones); the taxonomy screens most federal titles out, and "Energy Industry Analyst" (FERC) needs a check | FERC and NRC are **regulators**, which the frame has excluded ("as state regulators are"). Admitting them is a scope change. Federal pay is its own regime; `excluding_federal` and `federal_robustness` already exist | Owner decision per agency class; §8 amendment. **NERC is not federal** (a private non-profit, not on USAJOBS); search its own ATS instead |
| D. Keep expanding the frame through the four routes | +20 to +60 per run for new employers (run 30: +95 from ~70 new) | Nothing, within the rules | Nothing; continue |

**Assessment given to the owner:** ~1,000 is not reachable by 09-30 within
the current population (expect about 500–560). It is reachable only with A
(the one large lever, available from data already collected), best combined
with B and D. A and B are changes to registered design and are the owner's
decision.

**Decided 2026-09-28: C and D approved, A and B not.** C is done (batch 13).
**Batch 14 done** (29 employers, frame 404; NERC is on UKG/UltiPro, which
has no adapter, so it needs an owner decision). **Next action:** D. Keep working the registry
candidate lists (`data/registry/*.csv`) and role-title searches. Record every
addition in §8 before 09:17 UTC on 09-30. At the 09-29 audit, read the first
FERC, NRC and DOE rows and check the sector-evidence gate on DOE HQ,
Reclamation and BOEM.

## 7. Rules that always apply (from the original brief)

- "Spend on this project must not exceed $0." Watch Actions minutes. A run
  without slug discovery takes 45–55 minutes (run 30: 53, a Monday full re-read).
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
  (round 9 caught a duplicate Amperon; batch 10 duplicated Bonneville and
  Western Area), and for same-name traps (osv-edf is
  the Environmental Defense Fund; lever:pattern is not Pattern Energy).
- Stop and ask the owner before merging, opening PRs, deleting data, adding a
  job-site adapter whose terms you have not read, or changing what the study
  covers.
- Do not use `pkill -f` or `pgrep -f` here. Use background tasks and
  `TaskStop`.

- Write clock times only from a clock or a commit, never estimated
  (2026-09-28: invented §8 times had to be corrected).
- For every silent new board, run its postings through the screens and read
  why each was rejected. That is how round 10 found SEL's unreadable
  locations.

## 8. Audit and regenerate (after every run)

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

Save the previous `postings.csv` and `analysis.json` first, then diff on
`url` (ignore `posting_age_days`, which moves with the date). Round 11 is
next: "Eleven rounds" and "Twelve rounds" are already in `make_paper.py`
and `test_consistency.py`; add a row to the paper's audit table (in
`make_paper.py`). Commit with descriptive messages, then push with
`git push -u origin claude/wonderful-tesla-53lgo4`, retrying up to 4 times
on network errors.

## 9. After the last run

Final audit, then a finalisation pass: re-read the paper, summary and deck
against the bootstrap and robustness checks. Confirm 29/29. Mark HANDOFF
"collection closed". Report N, clusters, the largest share, the conditions
that pass, and every coefficient the bootstrap overturns.

---

# Message to paste right after /compact

See `docs/compact-message.md`.

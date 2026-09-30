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
2. Work only on `claude/wonderful-tesla-53lgo4`, the DEFAULT branch. Push
   only there. Never merge or open a PR without the owner.
3. Read, in order: `HANDOFF.md` (RESUME HERE, to the next `##`);
   `docs/audit-log.md` rounds 11 and 12; `docs/pre-registration.md` §8,
   the last five entries.
4. **Collection is CLOSED** (snapshot 2026-09-30). The collection cron is
   removed and no check-ins exist (`list_triggers` returns none). Do NOT
   dispatch `collect.yml`: a new snapshot is ignored by the build anyway,
   and any extension is option B, which needs the owner.
5. Confirm: `git log -1` is at or after 345ce6f; `python3 tests/run_all.py`
   says ALL SUITES PASSED and consistency 32/32; `data/analysis/analysis.json`
   has `n_estimation` 543 and `n_clusters` 100.

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

## 3. Final audited state (round 12, collection CLOSED with the 2026-09-30 snapshot)

- **N = 543** (in scope 729), **100 employer clusters**, largest employer
  **Crusoe 9.0%** (49 rows). 36.2 observations per regressor, **Model 2
  (extended)**. All four conditions pass; `interpretable` true.
- **Disclosure gap:** 91.3% (n=449) vs 47.5% (n=280), **43.8pp**, 43.2–45.2
  across four cuts. ASSOCIATIONAL, NOT CAUSAL.
- **Robust everywhere:** `seniority_rank`, `yrs_exp_min`, and `skill_cloud`
  (exploratory). **Nominal only:** `region_west`, `region_northeast`.
  **Tentative:** `degree_stem` (fails without Crusoe and without the federal
  rows). **Overturned by the bootstrap:** `skill_ml_ai`, `family_ai_ml`.
- **Nothing is pending.** The collection cron is removed and no check-ins
  remain. Any further change is a post-collection amendment and needs the
  owner.
- **Frame:** 407 employers (batch 13 federal agencies and batches 14–15, 32 employers under option D, added after round 10). Batches 4–12 (2026-09-27/28) each carry an evidence URL
  in `config/employers.yaml`.
- **USAJOBS:** key works. Three federal rows (two BPA, one WAPA, all Public
  Utilities Specialist). NRC's and FERC's postings fall outside the taxonomy,
  DOE HQ and Reclamation fail the sector gate, and BOEM, SWPA and TVA had
  none open.
- **Tests:** ALL SUITES PASSED (13 suites), consistency 32/32.

## 4. Collection record and stopping rule

- The three approved runs, 28–30 September:
  - **28 Sep:** run 30, dispatched by hand at the owner's request.
  - **29 Sep:** run 31, dispatched by hand after the cron did not fire; the
    cron then fired 6.5 hours late as run 32, which merged into the same
    snapshot.
  - **30 Sep:** run 34, dispatched by hand. Run 33 had failed its test
    gate, because run 32's unaudited data no longer matched the paper.
- **Collection closed with snapshots dated 2026-09-30**
  (`study.collection_end`, `snapshots_in_window`, pinned by a test). The
  cron was removed (cron has no year field).
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
- 2026-09-28: NERC and the regional entities. After the terms were read
  (limitations §9d: UKG bans automated access; Paylocity's terms have no
  ban; isolved's do not forbid reading), a browser proof of concept found
  WECC's 5 jobs in plain HTML and SERC's board empty. Owner: **"Agreed, no
  adapter."**
- 2026-09-30: the owner closed collection: "most, if not all of the
  scheduled runs have completed. Please finish your analysis now, and then
  we will handoff and compute any other changes, updates, or fixes in the
  next compaction session."

## 6. OPEN for the next session: candidate changes, each the owner's decision

Collection is closed at N = 543. Option A (all salaried professional roles
as a second, labelled population; about +400 to +550 from data on disk) and
option B (collection past 09-30) were NOT approved, and remain the only
large levers toward ~1,000. Candidates found during the final rounds, none
started:

1. **A workflow gap (found 2026-09-30).** `collect.yml` commits only
   `data/`, by design (binary deck merge conflicts). So a run that lands
   before an audit leaves the paper disagreeing with the data, and the next
   run's test gate refuses to collect (run 33). This only matters if
   collection ever reopens. Options: regenerate and commit the markdown
   deliverables in CI, or run the consistency suite after collection rather
   than before.
2. **Core Scientific** (data-center operator): live job pages, but its
   Greenhouse API returns 404, so it is unreadable by the supported route.
   Soluna, Elephant, SunPower and BlocPower resolved no board either.
3. **Option A as a second population:** the one lever toward ~1,000, from
   data already on disk; it needs a dated §8 amendment and both populations
   reported.
4. **Presentation polish** the owner may want: the deck does not name
   `degree_stem`'s fragility to Crusoe and to the federal rows (the paper and
   summary do).

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

## 9. After the last run — DONE (2026-09-30)

Final audit (round 12) and the finalisation pass are complete. The paper,
summary and deck were re-read against the bootstrap and robustness checks,
which led to three fixes (audit-log round 12). Consistency is 32/32, and
HANDOFF says "collection closed". If anything is changed from here, rebuild,
re-analyse and regenerate (section 8), and record a dated §8 amendment
saying whether the change helped or hurt the headline.

---

# Message to paste right after /compact

See `docs/compact-message.md`.

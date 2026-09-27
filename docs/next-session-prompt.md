# Starting prompt for the next session

Paste everything between the lines into a new session.

---

You are resuming an in-progress labor-market economics study. It is audited
and paused. Your first job is to confirm where it stands, not to change it.

## 1. Repository

- Call add_repo with owner "hendeal-cyber", repo
  "modern-labor-market-data-submission", access "push". Do not check first
  whether the repo exists; just call it.
- Work on branch `claude/wonderful-tesla-53lgo4`, and develop and push ONLY
  there. The head should be the "Handoff for the next session" commit or
  later. This branch is the repository's DEFAULT branch, so any `schedule:`
  cron in it fires. Collection is paused: the cron in
  `.github/workflows/collect.yml` is commented out, and it stays that way
  until the owner says to resume.
- Read HANDOFF.md from the "RESUME HERE" block; it wins over everything
  below it. Then read docs/audit-log.md rounds 6 and 7, and
  docs/pre-registration.md section 8 (the dated amendments), before
  changing any analysis code.

## 2. Who this is for and what it is

The owner is Alexander J. Henderson (IU Kelley School of Business). The study
is "Determinants of Advertised Pay in the US Energy and Data Center Sector":
a regression of log(advertised pay-range midpoint) on posting attributes,
using postings from public, no-login ATS APIs (Greenhouse, Lever, Ashby,
SmartRecruiters, Workable, Recruitee, Workday). The postings are collected
only by GitHub Actions; this environment cannot reach job sites.

The deliverables are paper/paper.md, docs/executive-summary.md,
paper/figures/, paper/presentation.pptx, data/analysis/postings.csv,
analysis.json and results.md, data/analysis/observations.xlsx, the codebook,
the pre-registration, the audit log, the limitations, and the employer ledger
(config/token-verification.yaml). All of them are generated; none is edited
by hand.

## 3. Audited state (round 7, data through 2026-09-22)

N = 220, 34 employer clusters, largest employer Invenergy 20.0%, 14.7
observations per regressor. All four pre-registered conditions pass, and
`interpretable` is true. The disclosure gap is 93.9% vs 49.2% (45pp, 42–47
across cuts); it is associational, not causal. `seniority_rank` survives the
bootstrap and the region check in every version of the data.
`region_northeast` and `skill_cloud` pass both but are TENTATIVE: they crossed
0.05 on six added rows. The deliverables say so. tests/run_all.py is green,
with consistency 29/29.

## 4. Rules that always apply

- Spend on this project must not exceed $0. Watch GitHub Actions minutes:
  the owner paused collection to save them. Do not start a collection run
  unless the owner asks, and budget about 50 minutes per run.
- Collect without bypassing anyone's terms of service. No scraping or
  automation of LinkedIn, Indeed, Handshake, iCIMS, Oracle Cloud HCM, or
  NRECA's careers.electric.coop.
- N >= 100 usable observations is non-negotiable, and every observation must
  fall under the energy / utility / data center umbrella.
- Audit often. After every rebuild, read every added row and the highest- and
  lowest-paid rows. Check that low bounds are plausible (a halved midpoint
  passed an audit once), and that there are no duplicate URLs.
- Never remove analyze.py's interpretability block by hand. Always report N,
  the cluster count and the largest employer's share together.
- Every change to screening, deduplication or modelling after data were seen
  gets a dated amendment in docs/pre-registration.md section 8. Say whether
  it helped or hurt the headline numbers.
- The mandate contrast is ASSOCIATIONAL, NOT CAUSAL.
- Every fix gets a regression test built from the REAL string. Prove each new
  test fails with its fix removed, using a BACKUP COPY of the file, never
  `git checkout`. Put `if __name__ == "__main__":` at the very end of a test
  file.
- Generated text must be computed from the results. Three rounds in a row
  found sentences that stayed true whatever the data said ("the wrong sign",
  "fails", "confirmed the South coefficient"). Distrust any guard or caveat
  that cannot change when the numbers change.
- Do not use `pkill -f` or `pgrep -f` loops here; the pattern matches its own
  shell. Use background tasks and wait for them to finish.

## 5. What to do (ask the owner which, if it isn't clear)

A. If the owner resumes collection: uncomment the cron (or dispatch once with
   no_slugs false), then review the run as in HANDOFF "Do these next". This
   is the first true next-day test of the cache, and the first collection of
   six new boards: Portland General Electric, IDACORP, APS, Atmos, GE Vernova
   and California ISO. Watch GE Vernova for the 150-page cap. Connecticut's
   postings count as mandate-covered from snapshots dated 2026-10-01; read
   that as a coding event.
B. If the owner wants the paper finalised on the current data: re-read the
   paper and summary for any claim the bootstrap does not support, confirm
   29/29, and stop.
C. Lower priority: 90 unchecked employers in the ledger. Confirm a token only
   from a live job URL in WebSearch result LINKS. Watch for same-name traps:
   Northwest Bank vs NW Natural, ONEOK vs ONE Gas.

Report N, clusters and the largest employer's share together, say which
conditions pass and fail, and name every coefficient the bootstrap
overturns. Commit with descriptive messages and push:
git push -u origin claude/wonderful-tesla-53lgo4 (retry up to 4 times on
network errors, waiting 2s, 4s, 8s, 16s). Do not merge or open a PR without
the owner's go-ahead.

---

# Clauses for the /compact command

Append this to `/compact`:

> Structure the summary as: (1) CURRENT STATE: branch, head commit, N,
> clusters, largest-employer share, which conditions pass, which coefficients
> survive the bootstrap and the region check, and whether collection is
> paused. (2) OPEN ITEMS in priority order, each with its next concrete
> command. (3) DECISIONS the owner made this session, quoted, with dates.
> (4) DEFECTS found and fixed this session: one line each, with the file and
> the test that pins it. (5) Anything uncommitted or unpushed. Keep numbers
> exact, and drop narrative, tool output and superseded values; if a number
> changed, keep only the latest one and say what it replaced.
>
> Preserve verbatim: the owner's standing rules ($0 spend, no ToS bypass,
> N >= 100, energy umbrella, associational-not-causal, amendments for
> post-data changes), and any instruction the owner gave in this session.

# Executive summary

**Determinants of Advertised Pay in the US Energy and Data Center Sector**

Alexander J. Henderson · Indiana University Kelley School of Business

*This page is generated from `data/analysis/analysis.json`. Every figure below is
reproducible with the commands in `README.md`; none is hand-entered.*

## What was measured

**264 job postings** with an employer-stated pay range, from **36 employers**
in the US energy, utility and data center sector, drawn from 3,973 postings
collected from public applicant-tracking APIs — the upstream systems employers
publish through. The dependent variable is the log of the advertised range midpoint.

## Finding 1 — the strongest regularity is about disclosure, not level

Pay is stated in **93.5%** of postings in states that require a pay
scale in the posting (n=201), against **50.0%** where no such law applies (n=152)
— a gap of **42 to 47 percentage points** across every cut of the sample.

**This is associational, not causal.** It is a single cross-section, so there is no
time variation and no difference-in-differences is available. Employers who
operate in mandate states differ from those who do not in ways these data cannot
control for. It is reported as a descriptive contrast and nothing more.

## Finding 2 — within disclosed pay, very little survives proper inference

Of the regressors in the pre-specified model, these are distinguishable from zero
under the wild cluster bootstrap the pre-registration requires:

| Attribute | Effect on advertised pay | Bootstrap p | Survives the region check |
|---|---|---|---|
| seniority | +11.9% | 0.000 | yes |
| a stated cloud skill | +16.0% | 0.002 | yes |
| a Northeast location | +11.3% | 0.010 | yes |

**Read a Northeast location as tentative.** It passes both checks, but with a p-value above 0.02 on at least one,
close enough to 0.05 that a handful of added observations can move the verdict. See
`docs/audit-log.md` for how these verdicts have moved between collection runs.

**A Northeast location does not survive adjusting pay for regional price levels** (BEA regional price parities; clustered p 0.44), so read it as nominal only.

**A stated cloud skill carried no directional prediction in the pre-registration**, so read it as exploratory rather than as a confirmed hypothesis.

Seniority is the one result the study would defend without qualification: it is
the most precisely estimated coefficient, it was predicted in advance, and it
survives every robustness cut applied here, including price adjustment.

**2 further attributes reach significance under clustered standard errors and
not under the bootstrap** — being advertised hourly, a South location.
With few employer clusters the asymptotic p-values are anti-conservative, so these
are reported as inconclusive rather than as findings. An underpowered null is not
a measured zero, and neither is a finding.

## What this study does not support

Stated here because each was either predicted or previously reported, and a reader
who takes only this page away should not take away a claim the data withdrew.

- **A degree premium.** `degree_required` was predicted positive; the point estimate
  is +0.0033 — the predicted sign — and at p=0.924 it is not
  distinguishable from zero. Reported as inconclusive, not as a reversal.
- **An AI or ML pay premium.** `skill_ml_ai` is +0.0149 at p=0.702.
  An earlier version of this study reported roughly +27% at p=0.003. That estimate
  did not survive audit round 4, which removed a multi-sector consultancy's public
  health, national security and fraud postings from the sample — much of the
  apparent AI premium was theirs, and outside the sector under study.
- **Data center operators paying more than utilities.** Predicted positive; the
  estimate is positive but at p=0.870 it is inconclusive.
- **A pay-level effect of mandate states.** `mandate_state` is -0.0322 at p=0.285.
  Earlier versions reported a significant negative coefficient and explained it as
  disclosure selection. Audit round 6 found it was substantially an artifact: the pay
  parser was halving seventeen postings of the largest employer, all in mandate states
  and twelve in Illinois, the Midwest reference region. Corrected, it is indistinguishable
  from zero.

## What limits it

- **Disclosure is selected.** Only 264 of 353 in-scope postings state pay, so every
  pay coefficient is conditional on disclosure. This is the central threat, and it
  is why the disclosure result is a headline rather than a footnote.
- **The scope widened four times in response to the data.** Disclosed in
  `docs/limitations.md`; the specification was pre-registered before the national
  sample was collected, and every later change is a dated amendment.
- **Pay is nominal in the headline figures.** A price-adjusted check using BEA
  regional price parities is reported on 253 observations in the paper.

## Where to look next

| | |
|---|---|
| Full write-up | `paper/paper.md` |
| What was committed before seeing data | `docs/pre-registration.md` |
| Every defect found, and how | `docs/audit-log.md` |
| What a reader is entitled to discount | `docs/limitations.md` |
| Variable definitions | `docs/codebook.md` |
| Rebuilding every number | `README.md` |


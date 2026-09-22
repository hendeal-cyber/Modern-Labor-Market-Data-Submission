# Executive summary

**Determinants of Advertised Pay in the US Energy and Data Center Sector**

Alexander J. Henderson · Indiana University Kelley School of Business

*This page is generated from `data/analysis/analysis.json`. Every figure below is
reproducible with the commands in `README.md`; none is hand-entered.*

## What was measured

**147 job postings** with an employer-stated pay range, from **29 employers**
in the US energy, utility and data center sector, drawn from 1,940 postings
collected from public applicant-tracking APIs — the upstream systems employers
publish through. The dependent variable is the log of the advertised range midpoint.

## Finding 1 — the strongest regularity is about disclosure, not level

Pay is stated in **98.2%** of postings in states that require a pay
scale in the posting (n=110), against **53.4%** where no such law applies (n=73)
— a gap of **44 to 47 percentage points** across every cut of the sample.

**This is associational, not causal.** It is a single cross-section, so there is no
time variation and no difference-in-differences is available. Employers who
operate in mandate states differ from those who do not in ways these data cannot
control for. It is reported as a descriptive contrast and nothing more.

## Finding 2 — within disclosed pay, very little survives proper inference

Of the regressors in the pre-specified model, these are distinguishable from zero
under the wild cluster bootstrap the pre-registration requires:

| Attribute | Effect on advertised pay | Bootstrap p | Survives the region check |
|---|---|---|---|
| seniority | +8.1% | 0.000 | yes |
| a pay-transparency mandate | -16.3% | 0.048 | no |

**a pay-transparency mandate does not survive** re-estimating without the 9 nationwide-remote
postings, which resolve to no state and therefore sit in the Midwest reference
category of the region dummies.
A posting with no resolvable state also has no determinable mandate status and
is coded as uncovered, so dropping those rows changes the contrast directly.
Treat it as inconclusive.

Seniority is the one result the study would defend without qualification: it is
the most precisely estimated coefficient, it was predicted in advance, and it
survives every robustness cut applied here.

**2 further attributes reach significance under clustered standard errors and
not under the bootstrap** — a Northeast location, a South location.
With few employer clusters the asymptotic p-values are anti-conservative, so these
are reported as inconclusive rather than as findings. An underpowered null is not
a measured zero, and neither is a finding.

## What this study does not support

Stated here because each was either predicted or previously reported, and a reader
who takes only this page away should not take away a claim the data withdrew.

- **A degree premium.** `degree_required` was predicted positive; the point estimate
  is -0.0264 — the wrong sign — and at p=0.492 it is not
  distinguishable from zero. Reported as inconclusive, not as a reversal.
- **An AI or ML pay premium.** `skill_ml_ai` is +0.0949 at p=0.419.
  An earlier version of this study reported roughly +27% at p=0.003. That estimate
  did not survive audit round 4, which removed a multi-sector consultancy's public
  health, national security and fraud postings from the sample — much of the
  apparent AI premium was theirs, and outside the sector under study.
- **Data center operators paying more than utilities.** Predicted positive; the
  estimate is positive but at p=0.131 it is inconclusive.

## What limits it

- 9.8 observations per regressor (147 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
- 29 employer clusters, against the 30 pre-registered. Cluster-robust standard errors are biased downward with few clusters, so the asymptotic p-values are anti-conservative. Significance on this page is therefore read off the wild cluster bootstrap.
- **Disclosure is selected.** Only 147 of 183 in-scope postings state pay, so every
  pay coefficient is conditional on disclosure. This is the central threat, and it
  is why the disclosure result is a headline rather than a footnote.
- **The scope widened four times in response to the data.** Disclosed in
  `docs/limitations.md`; the specification was pre-registered before the national
  sample was collected, and every later change is a dated amendment.
- **Pay is nominal in the headline figures.** A price-adjusted check using BEA
  regional price parities is reported on 139 observations in the paper.

## Where to look next

| | |
|---|---|
| Full write-up | `paper/paper.md` |
| What was committed before seeing data | `docs/pre-registration.md` |
| Every defect found, and how | `docs/audit-log.md` |
| What a reader is entitled to discount | `docs/limitations.md` |
| Variable definitions | `docs/codebook.md` |
| Rebuilding every number | `README.md` |


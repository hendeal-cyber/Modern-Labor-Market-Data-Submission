# Executive summary

**Determinants of Advertised Pay in the US Energy and Data Center Sector**

Alexander J. Henderson · Indiana University Kelley School of Business

*This page is generated from `data/analysis/analysis.json`. Every figure below is
reproducible with the commands in `README.md`; none is hand-entered.*

## What was measured

**120 job postings** with an employer-stated pay range, from **25 employers**
in the US energy, utility and data center sector, drawn from 1,716 postings
collected from public applicant-tracking APIs — the upstream systems employers
publish through. The dependent variable is the log of the advertised range midpoint.

## Finding 1 — the strongest regularity is about disclosure, not level

Pay is stated in **98.0%** of postings in states that require a pay
scale in the posting (n=100), against **39.3%** where no such law applies (n=56)
— a gap of **57 to 61 percentage points** across every cut of the sample.

**This is associational, not causal.** It is a single cross-section, so there is no
time variation and no difference-in-differences is available. Employers who
operate in mandate states differ from those who do not in ways these data cannot
control for. It is reported as a descriptive contrast and nothing more.

## Finding 2 — within disclosed pay, very little survives proper inference

Of the regressors in the pre-specified model, these are distinguishable from zero
under the wild cluster bootstrap the pre-registration requires:

| Attribute | Effect on advertised pay | Bootstrap p | Survives the region check |
|---|---|---|---|
| a South location | +32.2% | 0.002 | yes |
| seniority | +7.5% | 0.009 | yes |
| remote eligibility | +19.8% | 0.026 | no |

**remote eligibility does not survive** re-estimating without the 8 nationwide-remote
postings, which have no resolvable state and therefore sit in the Midwest
reference category of the region dummies. Those same postings are the
remote-eligible ones, so the coefficient was partly identified off them. Treat it
as inconclusive.

Seniority is the one result the study would defend without qualification: it is
the most precisely estimated coefficient, it was predicted in advance, and it
survives every robustness cut applied here.

The South premium survives those cuts, but read it with care: of its 24 observations,
9 come from one employer (ERCOT) and 13 from one state (TX).
At 25 employer clusters a regional coefficient and an employer effect are
hard to separate.

**3 further attributes reach significance under clustered standard errors and
not under the bootstrap** — a pay-transparency mandate, a Northeast location, a West location.
With few employer clusters the asymptotic p-values are anti-conservative, so these
are reported as inconclusive rather than as findings. An underpowered null is not
a measured zero, and neither is a finding.

## What this study does not support

Stated here because each was either predicted or previously reported, and a reader
who takes only this page away should not take away a claim the data withdrew.

- **A degree premium.** `degree_required` was predicted positive; the point estimate
  is -0.0892 — the wrong sign — and at p=0.357 it is not
  distinguishable from zero. Reported as inconclusive, not as a reversal.
- **An AI or ML pay premium.** `skill_ml_ai` is +0.1220 at p=0.270.
  An earlier version of this study reported roughly +27% at p=0.003. That estimate
  did not survive audit round 4, which removed a multi-sector consultancy's public
  health, national security and fraud postings from the sample — much of the
  apparent AI premium was theirs, and outside the sector under study.
- **Data center operators paying more than utilities.** Predicted positive; the
  estimate is positive but at p=0.132 it is inconclusive.

## What limits it

- 8.0 observations per regressor (120 observations, 15 regressors). Below about 10 the estimates are overfit and the coefficients should not be interpreted.
- 25 employer clusters, against the 30 pre-registered. Cluster-robust standard errors are biased downward with few clusters, so the asymptotic p-values are anti-conservative. Significance on this page is therefore read off the wild cluster bootstrap.
- Minimum detectable effect is 0.27 log points, roughly a 32% pay difference. Any coefficient smaller than that is not distinguishable from noise regardless of its p-value.
- **Disclosure is selected.** Only 120 of 156 in-scope postings state pay, so every
  pay coefficient is conditional on disclosure. This is the central threat, and it
  is why the disclosure result is a headline rather than a footnote.
- **The scope widened four times in response to the data.** Disclosed in
  `docs/limitations.md`; the specification was pre-registered before the national
  sample was collected, and every later change is a dated amendment.
- **Pay is nominal in the headline figures.** A price-adjusted check using BEA
  regional price parities is reported on 113 observations in the paper.

## Where to look next

| | |
|---|---|
| Full write-up | `paper/paper.md` |
| What was committed before seeing data | `docs/pre-registration.md` |
| Every defect found, and how | `docs/audit-log.md` |
| What a reader is entitled to discount | `docs/limitations.md` |
| Variable definitions | `docs/codebook.md` |
| Rebuilding every number | `README.md` |


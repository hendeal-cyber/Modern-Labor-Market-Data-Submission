# Limitations

Stated plainly, because several of these are structural rather than fixable.

## 1. This is not LinkedIn data

LinkedIn's terms prohibit programmatic collection (User Agreement §8.2). The
study uses the ATS boards that employers publish through and that syndicate to
LinkedIn. The posting population overlaps heavily but is not identical: postings
an employer places *only* on LinkedIn, or through an ATS not covered here, are
missed. Any claim in the write-up should be about "employer-published postings",
not "LinkedIn postings".

## 2. Advertised pay, not realized pay

The dependent variable is what employers *advertise*, not what anyone is paid.
Posted ranges are shaped by compliance strategy and negotiating posture. Findings
describe employer pay-setting behaviour in postings, not earned wages.

## 3. Disclosure selection, concentrated in Indianapolis

Illinois mandates disclosure; Indiana does not. Indianapolis postings that
disclose pay are self-selected, so Chicago-versus-Indianapolis comparisons
confound metro with disclosure regime. `mandate_state` and the disclosure model
expose this rather than resolving it.

## 4. No historical backfill

ATS endpoints serve only currently-open postings. The panel starts when
collection starts. The initial stock over-represents long-open roles, which are
plausibly harder to fill and better paid; `posting_age_days` and
`first_seen_run` are carried so this can be tested.

## 5. The population was widened after measurement, and that is a real change

The study began as software/data roles at core operators within 35 miles of
Chicago or Indianapolis. That scope returned zero usable observations against
~2,578 real postings, so roles, metros and the employer frame were all widened.

Two consequences a reader should weigh:

- **The population is now the energy and data center sector**, spanning
  investor-owned utilities, cooperatives, retailers, RTOs, data center
  operators, developers, analytics firms, consultancies and grid vendors. It is
  no longer "core operators", and results should not be described that way.
  `industry` and `role_family` are carried as regressors so the composition is
  visible rather than hidden, and subsets can be reported as robustness checks.
- **The widening was driven by the data**, which is a form of specification
  search. It was done before any pay model was estimated, and the yields of
  every candidate scope were recorded in `docs/scope-decision.md` and
  `data/analysis/scope_probe*.json`, so the decision is auditable. But it was
  not pre-registered, and a reader is entitled to discount accordingly.

## 5a. Eleven wrong companies entered a collection run

Slug-derived tokens produced eleven same-name collisions in a single run,
contributing 366 of 886 postings — 41%. The largest, token `via`, was Via the
public-transit software company rather than Via Renewables, and supplied 168
postings of transit dispatch and field operations. Others included an
e-commerce operator (`pattern`), Tomorrow.io the weather company (`tomorrow`),
a trading app (`public`) and a Canadian PR firm (`national`).

All were caught by inspection and purged before any model was estimated, and
all twelve confirmed tokens are now recorded and skipped at probe time. But the
episode bounds how much confidence the frame deserves: **a reader should assume
some residual contamination** and treat any employer contributing an unusual
number of observations as worth checking against its careers page.

The first sector gate did not catch these. It substring-matched generic words,
scoring an AI startup at 43% on "pipelines", "dataloaders" and
"next-generation". It had been validated against a reconstruction of the
offending board rather than the real text.

## 5b. Slug-derived employer tokens, and what protects them

Most of the 266 employer board tokens were derived from company names rather
than read off a careers page. A slug can land on a different company sharing a
name, and did: an Ashby board at `constellation` belonged to a San Francisco AI
startup, not Constellation Energy.

The protection is a sector-confidence check — the share of a board's own
postings that read as energy or data-center work — applied to every unverified
entry at a 25% threshold. Measured separation is wide (real boards 86–100%, the
false positive 0%), but it is a heuristic, not proof. A same-name company that
happens to work in energy would pass it. Any employer contributing a surprising
number of observations is worth spot-checking against its careers page.

## 5c. Small, narrow population

Core operators only, software/data/analytics only, within 35 miles of two metro
centroids. Software and data teams at data center operators frequently sit at
corporate headquarters outside these metros, while the local sites hire
facilities and technician staff who are out of scope. The utility side therefore
contributes disproportionately, and N is expected to be modest. A pre-registered
Tier 3 escalation exists in `config/scope.yaml` for the case where the 100
observation floor is not met.

## 6. Rule-based coding is imperfect

Fuzzy pattern matching misreads some postings. Known hazards: `soft_leadership`
can fire on boilerplate about "the leadership team"; `certification_req` can fire
on unrelated uses of "certified". The audit loop measures these rather than
assuming them away, and per-regressor accuracy is reported in
`docs/audit-log.md`.

## 7. Hourly annualization is an assumption

Hourly rates are annualized at 2,080 hours, which assumes full-time year-round
work. `hourly_original` supports a robustness check excluding these.

## 8. Exelon and ComEd are not reachable, and they matter most

Exelon and its Illinois utility ComEd run **iCIMS**
(`careers-exeloncorp.icims.com`). iCIMS has no free public jobs API: the real
API is OAuth-gated to customers and approved partners, and the public portals
render from per-tenant JSON whose shape varies by release and sits behind CDN
rate limiting.

This is the most consequential gap in the study. Exelon/ComEd is the largest
Chicago-headquartered utility employer and the most likely source of
Chicago-based early-career software and data roles. Its absence lowers expected
N and skews the utility side of the sample toward Invenergy and Vistra.

Options, none free and automatic: request iCIMS partner API access; hand-collect
Exelon postings into the same schema (they would need a `source` flag and an
audit note); or accept the gap and state it. Until one is chosen, any claim about
"Chicago utilities" should be read as excluding Exelon and ComEd.

**Re-checked 2026-09-21, and the gap is confirmed rather than overturned.**
iCIMS's standard XML job feed is released only to *approved job boards*, and
its Job Portal API is part of a partnership agreement with credentials
provisioned per customer instance — there is no self-serve tier and no public
pricing. So the door is closed by design, not by our not having found the
handle.

**Tested 2026-09-21, run 35564... : no feed.** All four tenants were probed
across the candidate iCIMS and JobThread patterns and none returned a parseable
syndication feed. Combined with the terms finding below, the gap is now closed
on two independent grounds — there is no public feed to read, and automated
access would not be permitted even if there were. The `.jobs`/DirectEmployers
channel that `employers.yaml` records Southern Company Gas using remains the
one untried variant. A third is the **CareerOneStop / National Labor Exchange API** (US DOL). NLx
aggregates employer-direct postings *with employer permission*, so it carries
none of the scraping objections and could reach these employers without
touching iCIMS at all. **But it is not the free self-serve key it first looked
like:** the Jobs APIs have moved from CareerOneStop to NLx, and access is now
reviewed and granted by the NLx Research Hub Governance Board via a data
request form. That is an application with a human decision and an unknown lead
time, not a signup. It may still be worth making — the study is exactly the
research use the hub exists for, and the owner is a university student — but it
cannot be assumed and nothing should be planned around it landing.

Browser automation against the iCIMS portal is **not** on that list, and as of
2026-09-21 that is settled by reading rather than by preference.

The study owner raised a fair objection: LinkedIn bans automation outright, but
that is LinkedIn's rule, and iCIMS is a different company. If iCIMS permitted
automated access the objection would disappear. So the terms were read.

**They do not permit it.** iCIMS's Terms of Use prohibit "any robot, spider or
other automatic device, process, or means to access the Website for any
purpose, including monitoring or copying any of the material on the Website",
and separately bar the use of "deep-links, page-scrapers, robots, crawlers,
indexers, spiders, offline readers, click spam, macro programs, internet agents,
or other automatic devices, programs, algorithms or methodologies". That is
materially the same prohibition as LinkedIn User Agreement §8.2, and it reaches
the career portals, not just icims.com.

Per the owner's own ruling — proceed if the terms allow it, otherwise accept the
gap — **the gap is accepted and documented.** No Playwright, no Selenium, no
portal automation. This is recorded with the quoted terms so a reader can check
the reasoning rather than take it on trust.

The practical cost is now much smaller than it was: under the national scope the
sample no longer depends on these four employers. Any claim about "Chicago
utilities" should still be read as excluding Exelon, ComEd, Constellation and
Citizens Energy.

## 8b. Board tokens were guesses, and one was wrong

Tokens in `config/employers.yaml` began as inferred candidates because the
authoring environment could not reach any ATS host. The first live run showed
this is not a harmless assumption: slug discovery matched an Ashby board at
token `constellation` that belongs to a **San Francisco AI startup**, not
Constellation Energy. Only the geography filter kept it out of the dataset; a
same-named firm inside a study metro would have entered the frame silently.

Checking whether the employer's name appears in the board's own text does **not**
resolve this — the startup is also called Constellation. Two firms sharing a name
cannot be distinguished from posting text. Slug discovery therefore no longer
contributes data at all: hits are written to `_candidates_for_review.json` for a
person to confirm, and only tokens declared in `config/employers.yaml` enter the
frame. Confirmed-wrong tokens are listed under `rejected_tokens`.

## 8c. Two levers that look large in the funnel and are not

The selection funnel counts each rejection reason independently, so a posting
that fails several screens is counted several times. Read as a to-do list it
mis-ranks the work, and it did:

- **The seniority screen is not costing 304 observations.** It reports 304
  rejections, but only **15** of those also pass the role screen, and only
  **6** state an experience minimum of three years or less. Those 6 are two
  requisitions duplicated across cities (one Flexential role posted twice, one
  Nexamp role posted in four). After deduplication and geography the screen is
  worth **one to two observations**, not 304. It is left alone.
- **Workday boards that list hundreds of postings and collect none are mostly
  correct.** Six boards listed 742 postings between them and contributed
  nothing, which looks like a collection failure. It is not: Duke Energy is
  headquartered in Charlotte, Vistra in Irving, CyrusOne in Dallas, Essential
  Utilities in Bryn Mawr and PJM in Audubon PA. The postings are genuinely
  outside every study radius.
- The related worry that the Workday pre-screen judges roles on title alone,
  and so over-rejects, was measured and is false: of the 86 postings that pass
  the role screen when their full description is available, **0%** fail on the
  title alone. The pre-screen is sound.

Recorded here because all three were proposed from the funnel summary and
survived only until someone read the per-employer record.

## 9. Few clusters, so standard errors under-cover

Standard errors are clustered by employer because employers contribute many
postings each. But the study's employer frame is small — on the order of 10–30
employers actually posting in scope — and cluster-robust standard errors are
known to be biased downward when the number of clusters is small. Simulation in
`tests/test_analyze.py` reproduces this: with 12 employers, nominal 95%
confidence intervals cover the true coefficient 92% of the time, and a
cluster-level placebo is rejected at 9.5% against a nominal 5%.

**The remedy is now applied rather than recommended.** A wild cluster bootstrap
(Cameron, Gelbach & Miller 2008, restricted variant, Rademacher weights, 9,999
replications) runs on every estimation while clusters stay under 30, and its
p-values are the ones the paper reports. It matters: **seven of the nine core
coefficients significant at 5% under clustered standard errors do not survive
it.** Only `seniority_rank` and `skill_ml_ai` do.

An earlier version of this section cited 88% coverage. That figure came from a
fixture whose employer-level shock reached one posting per employer instead of
all of them, so the evidence for clustering had been measured on data with no
within-employer correlation. Both the fixture and the figure are corrected; see
`docs/pre-registration.md` §8.

## 9a. Nationwide-remote postings sit in the Midwest reference category

Eleven observations are nationwide-remote with no resolvable state. That is by
design — `remote_national` is a deliberate category, kept out of the metro
contrasts — but the census-region dummies are built from `state`, so a posting
with no state has `region_northeast`, `region_south` and `region_west` all
zero, which is the **Midwest reference level**. Those rows are therefore
pooled with Midwest postings in every regional comparison without being
Midwest.

At 11 of 120 observations this is roughly 9% of the sample loading onto the
reference category for the wrong reason, and `region_south` is one of the few
coefficients that survives the wild cluster bootstrap, so it is not harmless.
`metro_remote_national` exists as an indicator and is in the extended model,
which the realized N does not unlock.

It is reported rather than silently patched because the fix is a modelling
choice with a real trade-off: a fourth "no region" dummy would absorb them
cleanly but spends a degree of freedom the sample can barely afford at 8
observations per regressor. Anyone re-estimating can identify the rows —
`metro == "remote_national"` and `state` empty — and either drop them or add
the dummy. Found in audit round 4.

## 9b. The frame is bounded by ATS platform, not by effort — and that is selective

A hand verification pass over the employer frame (2026-09-22, recorded
employer-by-employer in `config/token-verification.yaml`) resolved 97 of 272
employers to a confirmed or denied outcome. The denials are not random: they
cluster by **applicant-tracking platform**, and the platforms the study cannot
reach map onto *kinds of employer*.

| Platform found instead of a supported one | Employers |
|---|---|
| Employer's own portal, no ATS identifiable | 19 |
| iCIMS | 4 (+3 already blocked) |
| `careers.electric.coop` (NRECA Cooperative Career Center) | 3 |
| SAP SuccessFactors, Oracle Cloud HCM, NEOGOV/GovernmentJobs, gr8people, Paylocity, JazzHR, Hirebridge, `.jobs`/DirectEmployers | 1 each |

The study reads seven ATS platforms — Greenhouse, Lever, Ashby,
SmartRecruiters, Workable, Recruitee and Workday — chosen because each exposes
a public, unauthenticated endpoint with full description text and no terms
prohibiting automated reading. Everything above is outside that set, and the
selection this creates is systematic rather than incidental:

- **Municipal and public power utilities** hire through NEOGOV/GovernmentJobs.
  Seattle City Light is a City of Seattle department and unreachable for that
  reason alone.
- **Electric cooperatives** syndicate to NRECA's own Cooperative Career Center.
  Three were lost to it, and all three were exact fits in mandate states:
  Great River Energy's Maple Grove analyst roles at \$105–144k, \$78–106k and
  \$102–140k (Minnesota), United Power's "GIS and Data Analyst I-IV" and
  "Financial Analyst II" in Brighton (Colorado), and CFC in Dulles (Virginia).
  Cooperatives are non-profit and set pay differently from an investor-owned
  utility, so their absence is not neutral for a pay study.
- **Large investor-owned utilities** are split: some run Workday and are
  reachable (Ameren, Eversource, Xcel, NiSource, Avangrid), while others run
  iCIMS or SuccessFactors and are not (Exelon, ComEd, Con Edison, Constellation,
  American Water, Peoples Gas).

Two of these are worth revisiting and neither is done here. **Oracle Cloud
HCM** exposes a public candidate-experience REST endpoint behind an ordinary
career site — the same shape as Workday CXS, which this study already reads —
so an adapter may well be defensible. And `careers.electric.coop` could reach
many of the 31 unresolved cooperatives at once. Both are left alone for the
same reason iCIMS is: **the terms cannot be read from this environment**, and
this project does not automate a platform whose terms it has not read. That is
a deliberate cost, recorded rather than quietly paid.

The practical consequence for a reader: the sample tilts toward employers
modern enough to run a Greenhouse/Lever/Ashby-class ATS or a Workday tenant,
which correlates with size, sector and how recently the firm was founded. It is
not a random sample of energy-sector employers and is not claimed to be.

## 10. The population is national and all-seniority, and that was not the original design

The study began as a question about early-career software and data roles within
35 miles of Chicago or Indianapolis. It is now a national study of the energy
and data center sector at every seniority level except internships. The widening
happened in four steps, each documented and each **data-driven rather than
pre-registered**: the original scope returned zero usable observations, and
every subsequent widening was chosen after measuring what the previous one
yielded.

A reader is entitled to discount results chosen after seeing the data. Two
things limit how much: `docs/pre-registration.md` fixes the specification
*before* the national sample was collected, with dated amendments for every
change made afterwards; and `scope-decision.md`, `decision-log.md` and the
probe measurements record what each option was worth at the time it was chosen,
so a reader discounting these results can check what was known when.

The early-career question survives as a pre-specified subsample, reported
whether or not it agrees with the full sample.

## 11. Disclosure selection is the central threat to the pay models

Outside mandate states, stating pay is voluntary, and only about a quarter of
postings do. The pay models are therefore estimated on a sample that is
**selected on the dependent variable** wherever no mandate applies.

This is not a nuisance to be noted and moved past. It is why the disclosure
model is promoted to a headline result rather than a robustness check: what can
be said confidently is who discloses, and what must be said cautiously is what
the disclosed numbers imply about the whole market.

Any coefficient in the pay models should be read as conditional on disclosure.

## 12. The mandate contrast is associational, not causal

A single cross-section carries no time variation, so no difference-in-
differences is available. Employers operating in mandate states differ from
those that do not in size, sector, geography and sophistication, and these data
cannot separate those differences from the effect of the law.

The contrast is large — roughly 98% against 26% — and large enough that it is
unlikely to be composition alone. But "unlikely to be composition alone" is not
an identified effect, and the paper must not drift into causal language.

## 13. Pay is nominal, not price-adjusted

Comparing advertised pay across states without adjusting for local price levels
overstates real differences in high-cost states. A BEA Regional Price Parity
adjustment is implemented (`scripts/fetch_rpp.py`) and reported as a robustness
check when the table has been fetched; where `pay_midpoint_real` is blank, it
has not been, and no deflator is imputed in its place.

## 14. Few clusters, and one employer dominates

The pre-registration named three conditions under which the sample would be
"met in letter and not in substance". Two are unresolved: distinct employers
remain below 30, and the largest single employer supplies well over a quarter
of observations. Cluster-robust standard errors under-cover with few clusters —
measured at 92% against a nominal 95% in simulation — so **every significance
claim is read off the wild cluster bootstrap**, which is implemented and run on
every estimation. Under it, seven of the nine coefficients clustered errors
called significant are inconclusive.

More employers, not more postings, is what fixes this.

## 15. One derived artifact was committed in an inconsistent state, and how it is prevented

Run 21 committed a `selection_funnel.json` whose own totals disagreed with its
own `postings.csv` — 103, 107, 137 and 204 for quantities that are computed
from one list with one filter in one pass. Nothing crashed and the JSON was
valid.

The cause was `git pull --rebase -X ours` in the collection workflow. `-X ours`
is a merge *strategy option*: it resolves conflicting hunks in our favour but
still takes non-conflicting hunks from both sides. Two runs' CSV rows sit on
different lines, so they were combined.

Raw snapshots *should* merge — they are append-only per-employer files and two
collections ought to combine. Derived artifacts must not; they are pure
functions of the raw corpus and must be the output of a single execution. The
workflow now merges only `data/raw/` and regenerates `data/analysis/` over the
merged corpus, and `build_dataset.py` refuses to write a funnel whose totals
disagree or a CSV whose row count differs from the count it just reported.

**What this means for a reader.** No published number came from the
inconsistent artifact: it was caught by reading the committed output before
using it, and everything was rebuilt from `data/raw/`, which was intact. But it
is recorded because the failure was silent, and because the same class of
failure — a valid-looking artifact that is not what it claims to be — is the
one this project has hit most often.

## 16. The disclosure gap once depended on one jurisdiction, and no longer does

*Rewritten in audit round 6. This section still asserted the dependence, with
figures from before audit round 4, after the paper and `analysis.json` had
started computing the spread instead of assuming it.*

Before audit round 4 the headline contrast moved with Virginia alone, from
50 to 71 points depending on the cut. That sensitivity came from a federal
consultancy's non-energy postings in Virginia, removed as outside the sector.
On the audited round-6 data the contrast is stable:

| Sample | Mandate | No mandate | Gap |
|---|---|---|---|
| All postings | 93.9% (n=164) | 47.6% (n=126) | 46pp |
| Excluding Virginia | 96.4% | 47.6% | 49pp |
| Excluding the largest employer | 91.7% | 47.6% | 44pp |

The spread is 5 points. `analysis.json` computes it on every run, and the
paper states whichever reading the numbers support. The contrast remains
**associational, not causal** (§12): a single cross-section.

Two coding corrections in round 6 both narrowed the gap. Connecticut's posting
law takes effect 2026-10-01, after collection, so its postings are coded as
uncovered. Three QTS "Development Project Manager" rows whose descriptions
are mostly construction project management remain in the no-mandate
denominator, undisclosed. The owner judged the role in scope (2026-09-23).
Removing them would narrow the gap by a further 1.2 points (44.7 → 43.6pp on
the round-7 data).

## 17. The first successful price-parity fetch returned the wrong table

Worth recording in full, because it is the closest this study came to
publishing a fabricated number, and because it defeated a test suite written
specifically to prevent it.

`scripts/fetch_rpp.py` was written to refuse to invent BEA figures: fetch them
or report the price-adjusted model as unavailable. The first fetch succeeded —
51 states, vintage 2024, valid JSON, every unit test green.

It was wrong. The archive BEA serves holds several tables, and the loop took
the first that parsed: `SAIRPD_STATE_2008_2024.csv`, the **implicit regional
price deflator** on a 2017 base, not `SARPP`, the Regional Price Parities. Every
value came back at ~1.237× the true RPP, which is cumulative US inflation
2017–2024. Applied as a deflator it would have **inflated every real-pay figure
in the study by about 24%**, silently and uniformly.

It was caught by comparing the fetched values against BEA's published figures
before using them: California read 136.9 where the real 2024 RPP is 110.7, and
**no state was below 100** — impossible for an index normalised so the US
average is 100.

**Why the tests did not catch it.** They were written against a CSV invented
to look like BEA's, not against the archive's real shape. That is the same
error that shipped a broken sector gate earlier in this project: a guard
validated against a reconstruction rather than the real artifact, scoring
clean and being wrong.

**What now prevents it.** `is_plausible_rpp()` rejects any table that does not
straddle 100 or whose median falls outside [90, 110]. That check does not
depend on knowing BEA's filenames, so it catches the whole class rather than
this instance. Members are additionally tried with `SARPP` before `SAIRPD`, and
the written file records which member it came from and that it passed
validation.

No price-adjusted result was ever published from the wrong table; it was
deleted. A later fetch (run 23) read `SARPP_STATE_2008_2024.csv` and passed the
guard: 51 states, vintage 2024, Arkansas 86.9 to California 110.7. The
price-adjusted model now runs as a robustness check (206 observations on the
round-6 data).

## 18. A board can belong to a whole corporate group

Several employers are reached through a parent's ATS tenant. For most of them
the parent is itself an energy company (Ameren, AES, Duke, AEP, Iberdrola for
Avangrid, AltaGas for WGL), and every row was checked to be the named
utility's or the group's energy work. Two are not. Hitachi Energy sits on
Hitachi's group tenant, and Iron Mountain Data Centers on Iron Mountain's.
Audit round 6 found that every usable "Hitachi Energy" row came from a sister
company (semiconductor metrology, federal IT) and that Iron Mountain's was
corporate IT. A title screen cannot see this, because a data scientist's
title reads the same at any company.

These boards now require the posting to name the in-scope company. For
Hitachi that rule was measured on 33 records and separated them perfectly.
For Iron Mountain it rests on 8, which is thin. **Hitachi's tenant is also
truncated**: it lists exactly 3,000 postings, the 150-page cap. Some Hitachi
Energy postings are therefore never seen. None of the ones that were seen
disclose pay, so this bears on the disclosure model and not on the pay
models.

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

Two legitimate routes remain untested and are worth one attempt each before the
gap is called permanent: the third-party JobThread syndication feed that some
iCIMS tenants publish, and the `.jobs`/DirectEmployers channel that
`employers.yaml` already records Southern Company Gas using. A third is the **CareerOneStop / National Labor Exchange API** (US DOL). NLx
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
confidence intervals covered the true coefficient about 88% of the time.

Read p-values near conventional thresholds with that in mind. If the realized
employer count stays low, a wild cluster bootstrap is the appropriate remedy and
should be run before reporting any headline significance claim.

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

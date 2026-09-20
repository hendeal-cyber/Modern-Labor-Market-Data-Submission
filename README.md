# Modern Labor Market Data Submission

A regression study of **what drives advertised pay in early-career software,
data and analytics roles at utility and data center operators** in the Chicago
and Indianapolis metro areas.

Dependent variable: `log(pay_midpoint)` — the log of the midpoint of the
employer-stated pay range, annualized to USD.

## Status

| Stage | State |
|---|---|
| Collection pipeline | Built, tested against fixtures |
| Live collection | **Not yet run** — board tokens unverified until the first Actions run |
| Regressor coding | 28 regressors declared and tested |
| Audit loop | Harness pending |
| Analysis | Pending data |

## How it works

Postings are collected directly from the **public, unauthenticated ATS APIs**
employers publish through (Greenhouse, Lever, Ashby, SmartRecruiters, Workable,
Recruitee, Workday CXS) — the upstream systems that syndicate to job boards.
LinkedIn is not scraped; its terms prohibit it. See [docs/methods.md](docs/methods.md).

```
config/employers.yaml   ->  collect/run.py   ->  data/raw/<date>/*.json
                                                        |
                                              build_dataset.py
                                                        |
                          data/analysis/postings.csv + selection_funnel.json
```

Collection runs weekly in GitHub Actions. ATS APIs expose only currently-open
postings, so the panel is built **prospectively**: the first run captures the
open stock, later runs append the flow.

## Usage

```bash
pip install -r requirements.txt

python tests/run_all.py                      # all suites, no network needed
python src/lmstudy/collect/run.py --limit 3  # small live collection
python src/lmstudy/build_dataset.py          # rebuild the analysis dataset
python scripts/make_codebook.py              # regenerate docs/codebook.md
```

## Layout

| Path | Purpose |
|---|---|
| `config/scope.yaml` | Every filter: metros, roles, early-career rules, escalation tiers |
| `config/employers.yaml` | The employer sampling frame and their ATS board tokens |
| `config/regressors.yaml` | The regressor coding dictionary |
| `src/lmstudy/` | Collection, screening, pay parsing, coding, dataset build |
| `data/raw/<date>/` | Immutable snapshots; every later stage re-runs from these |
| `data/analysis/` | `postings.csv` and the selection funnel |
| `docs/` | Methods, codebook, limitations, audit log |
| `tests/` | Offline suites over fixtures |

## Documentation

- [Methods](docs/methods.md) — design, compliance posture, estimation strategy
- [Codebook](docs/codebook.md) — every variable, generated from the configs
- [Limitations](docs/limitations.md) — what this data cannot support

## Scope decisions

Industry is **core operators only** (utilities and data center operators, not
engineering firms or vendors). Roles are **software, data and analytics only**.
Early career means **≤3 years** required experience. Internships are excluded;
full-time rotational programs are kept. Tier 1 is Chicago, Tier 2 Indianapolis;
Tier 3 metros are pre-registered but dormant unless the 100-observation floor
goes unmet after three collection cycles.

# Scope decision: the strict definition yields no sample

**Status: blocked pending a decision. Everything else in the pipeline is built,
tested and running.**

## What the data says

Sixteen employer boards are reachable and were collected in full: **~2,578
postings**, of which 2,424 passed through the title-and-location pre-screen
(the remaining 154 come from Greenhouse and Lever boards, which return
descriptions directly and go straight to full screening).

| Outcome | Count | Share |
|---|---|---|
| Software/data role in a study metro | **6** | 0.2% |
| Software/data role, **outside** the study metros | 5 | 0.2% |
| **Confirmed in a study metro**, not a software/data role | **181** | 7.5% |
| Location unknown, not a software/data role | 437 | 18.0% |
| Neither | 1,795 | 74.1% |

After full screening on experience, seniority, internship status and pay
disclosure: **0 usable observations.** Of 165 postings reaching the screens,
three survived, and all three then failed the 35-mile geography test.

Rejection reasons across those 165: role not software/data (96), no experience
signal (72), seniority excluded (63), role excluded (60), experience too high
(17), internship (6), out of metro (3).

## Why

Two independent causes, both structural rather than technical:

1. **These employers barely post software/data roles anywhere.** Eleven of 2,424
   screened listings, under 0.5%, were software/data roles anywhere on earth —
   Irving TX, Overland Park KS, Bangalore and Bogotá among them. Utilities and data center
   operators are not software employers.

2. **The roles they do post in Chicago and Indianapolis are engineering.**
   Associate Renewable Procurement, Engineering (Battery Storage), Manager
   Electrical Engineering – Thermal, Staff Engineer Thermal, Principal
   Geothermal Engineer, GIS Manager, NERC Cybersecurity Compliance, Analyst
   Compliance, plus 2027 engineering internships. Roughly 55% of in-metro
   postings are technical; the rest are drivers, security officers and
   accountants.

The original framing — "the tech side of utility and data center" — was sound.
In these industries, *tech means engineering*: electrical, thermal, grid,
controls, compliance. Narrowing to "software and data only" is what emptied
the sample.

## The levers, measured

A probe collection (every in-metro posting regardless of role, in
`data/probe/`, never feeding the analysis dataset) makes this a count rather
than an estimate. From **752 in-metro postings** in one cycle across 16 boards:

| Candidate scope | Usable observations |
|---|---|
| A. software/data/analytics — **current** | **0** |
| B. + IT, systems, cloud, devops | 0 |
| C. + network and cybersecurity | 0 |
| D. + engineering (electrical, thermal, controls, GIS) | 2 |
| E. **all roles**, early-career still enforced | **30** |

### The binding constraint is not roles

With the role screen lifted **entirely**, the 752 postings are lost like this:

| Lost to | Count |
|---|---|
| `seniority_excluded` (Senior/Staff/Principal/Lead/Manager/Director) | **401** |
| `no_experience_signal` (no stated years, no entry-level title cue) | **227** |
| `internship` | 35 |
| `experience_too_high` | 35 |
| geography | 46 |
| no pay disclosed | 13 |
| **usable** | **30** |

Widening the role taxonomy was the wrong diagnosis. **Early career is what
binds**, and 227 of those losses come from a conservative coding default of
mine rather than from anything the study specified: a posting that states no
experience minimum is dropped unless its title carries an entry-level cue.
Many are probably early-career; the text simply does not say.

The study already carries `yrs_exp_stated` precisely so an unstated minimum can
be absorbed as a control rather than guessed at. Admitting those postings is a
coding-rule choice, not a redefinition of the study:

| Variant | Usable |
|---|---|
| current: software/data only, strict early-career | **0** |
| software/data only, admit unstated experience | 1 |
| all roles, strict early-career | 30 |
| **all roles, admit unstated experience** | **65** |

Sixty-five from a single cycle, against a floor of 100, with weekly flow, the
eight unidentified boards, and Tier 3 metros all still available.

### Geography remains worthless here

| Lever | Recovers |
|---|---|
| Widen roles to all | +30 |
| Also admit unstated experience | +35 more |
| Widen geography nationally | **+5** |

## Honest expectation

Widening roles alone probably does **not** clear the 100-observation floor.
Measured, not estimated: the best single-cycle yield available without
changing industry or geography is **65**, and that requires both admitting
unstated-experience postings and dropping the role taxonomy entirely. The
floor of 100 is reachable, but only by combining that with weekly flow, the
eight unidentified boards, or Tier 3 metros.

## Options

1. **Admit unstated-experience postings**, controlling for it with the
   `yrs_exp_stated` indicator that already exists. This is a coding-rule change
   rather than a scope change, and it is the single cheapest gain available
   (+35 on its own, at all-roles). Worth doing under any of the options below.
2. **Roles → technical/engineering, keep industry and geography.** Closest to
   the original intent. Pay becomes a function of engineering discipline,
   licensure, and technical skill rather than software stack. Measured at 2
   alone; the gains come from going wider still.
3. **Roles + industry.** Adds the engineering and EPC firms serving these
   sectors, where early-career technical hiring in Chicago is dense.
4. **Roles + geography.** Keeps the two industries pure, adds metros as a
   regressor.
5. **Keep the strict definition and report the null.** Defensible as a finding
   in its own right — "these sectors do not hire early-career software talent
   in this market" is a real labor-market result — but it is not the regression
   study that was commissioned.

## What is unaffected

The pipeline does not care which is chosen. Role and metro definitions live in
`config/scope.yaml`; widening any of them is a config edit, not a rewrite. All
28 regressors, the pay parser, the audit harness and the estimation code work
unchanged.

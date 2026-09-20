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

| Lever | Recovers | Notes |
|---|---|---|
| **Widen roles** to technical/engineering | **181 confirmed in-metro postings** | The dominant lever, by 36×. Before experience and pay screens. |
| **Find the 8 remaining boards** | unknown | 16 of 30 employers are reachable; 6 are blocked on iCIMS or SuccessFactors. |
| **Widen geography** nationally | **5 postings** | Effectively worthless: these employers post almost no software/data roles anywhere on earth. |
| **Widen industry** to EPC/vendors | untested | Would admit Sargent & Lundy, Burns & McDonnell, S&C Electric and similar. |

An earlier recommendation of "geography first" was wrong and is withdrawn. It
was based on reasoning about where software teams sit, which was correct in
itself but irrelevant: the postings do not exist to be found in any geography.

## Honest expectation

Widening roles alone probably does **not** clear the 100-observation floor.
The 181 confirmed in-metro postings become perhaps 40–80 usable after the
early-career screen (≤3 years) and the pay-disclosure requirement, since only
about 55% are technical and only a minority are early-career. Reaching 100+
most likely needs **roles plus the remaining employer boards**, and possibly
industry as a third step.

## Options

1. **Roles → technical/engineering, keep industry and geography.** Closest to
   the original intent. Pay becomes a function of engineering discipline,
   licensure, and technical skill rather than software stack.
2. **Roles + industry.** Adds the engineering and EPC firms serving these
   sectors, where early-career technical hiring in Chicago is dense.
3. **Roles + geography.** Keeps the two industries pure, adds metros as a
   regressor.
4. **Keep the strict definition and report the null.** Defensible as a finding
   in its own right — "these sectors do not hire early-career software talent
   in this market" is a real labor-market result — but it is not the regression
   study that was commissioned.

## What is unaffected

The pipeline does not care which is chosen. Role and metro definitions live in
`config/scope.yaml`; widening any of them is a config edit, not a rewrite. All
28 regressors, the pay parser, the audit harness and the estimation code work
unchanged.

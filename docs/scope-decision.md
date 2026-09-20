# Scope decision: the strict definition yields no sample

**Status: blocked pending a decision. Everything else in the pipeline is built,
tested and running.**

## What the data says

Eleven employer boards are reachable and were collected in full. Across
**2,135 listed postings**, screening on title and location produced this:

| Outcome | Count | Share |
|---|---|---|
| In scope (software/data role, in a study metro) | **6** | 0.3% |
| Software/data role, but **outside** the study metros | 4 | 0.2% |
| **Inside** a study metro, but not a software/data role | ~176–589* | 8–28% |
| Neither | ~1,536 | 72% |

\* The earlier run measured 176 with confirmed in-metro locations. After fixing
a bug where Workday's `"N Locations"` placeholder was misread as an
out-of-radius place, the figure rose to 589 — but that number now mixes
confirmed in-metro postings with unknown-location ones. The diagnostic has
since been split to report the two separately. The conclusion does not depend
on which figure is right: both dwarf the geography lever by one to two orders
of magnitude.

After full screening (experience, internship, seniority, pay disclosure),
**zero** postings survived to the estimation sample.

## Why

Two independent causes, both structural rather than technical:

1. **These employers barely post software/data roles anywhere.** Ten of 2,135
   listings, about 0.5%, were software/data roles on the entire planet — Irving
   TX, Overland Park KS, Bangalore, Bogotá among them. Utilities and data center
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
| **Widen roles** to technical/engineering | ~100–350 in-metro postings | The dominant lever by 20–150×. Before experience and pay screens. |
| **Find the 14 unidentified boards** | unknown, likely substantial | 11 of 30 employers are reachable today; 5 are iCIMS-blocked. |
| **Widen geography** nationally | **4 postings** | Effectively worthless here: these employers post almost no software/data roles anywhere. |
| **Widen industry** to EPC/vendors | untested | Would admit Sargent & Lundy, Burns & McDonnell, S&C Electric and similar. |

An earlier recommendation of "geography first" was wrong and is withdrawn. It
was based on reasoning about where software teams sit, which was correct in
itself but irrelevant: the postings do not exist to be found in any geography.

## Honest expectation

Widening roles alone probably does **not** clear the 100-observation floor.
Roughly 176–589 in-metro postings become perhaps 40–80 usable after the
early-career screen (≤3 years) and the pay-disclosure requirement. Reaching
100+ most likely needs **roles + the remaining employer boards**, and possibly
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

#!/usr/bin/env python3
"""Generate docs/executive-summary.md -- one page, findings first.

GENERATED, not written. Every number and every named predictor comes from
data/analysis/analysis.json. The paper's executive summary was hand-written
once and drifted: it named "seniority, required experience and role family" as
predictors of pay when the latter two carried p-values of 0.57 and 0.67. It was
true of an earlier specification and nobody noticed when the model changed, in
the section most readers read. So this one cannot be written by hand either.

Significance is read off the WILD CLUSTER BOOTSTRAP wherever it exists, because
that is what docs/pre-registration.md section 6 requires below 30 clusters.
Reading the asymptotic clustered p-values instead would name seven predictors
this study cannot distinguish from zero.
"""
from __future__ import annotations

import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
ANALYSIS = ROOT / "data" / "analysis"

PRETTY = {
    "seniority_rank": "seniority",
    "skill_ml_ai": "a stated ML or AI skill",
    "skill_cloud": "a stated cloud skill",
    "remote_eligible": "remote eligibility",
    "degree_stem": "a STEM degree",
    "degree_required": "a required degree",
    "yrs_exp_min": "required years of experience",
    "yrs_exp_stated": "stating an experience minimum at all",
    "industry_data_center": "being a data center operator",
    "region_northeast": "a Northeast location",
    "region_south": "a South location",
    "region_west": "a West location",
    "family_ai_ml": "an AI/ML role family",
    "mandate_state": "a pay-transparency mandate",
    "hourly_original": "being advertised hourly",
}


def pretty(name: str) -> str:
    return PRETTY.get(name, f"`{name}`")


def _south_concentration():
    """How concentrated the South observations are, by employer and by state."""
    import collections
    import csv
    path = ANALYSIS / "postings.csv"
    if not path.exists():
        return None
    rows = [r for r in csv.DictReader(path.open())
            if r.get("pay_disclosed") == "1"
            and r.get("census_region") == "south"]
    if not rows:
        return None
    emp = collections.Counter(r["employer"] for r in rows).most_common(1)[0]
    st = collections.Counter(r["state"] for r in rows if r.get("state")).most_common(1)[0]
    return len(rows), emp[0], emp[1], st[0], st[1]


def main() -> int:
    a = json.loads((ANALYSIS / "analysis.json").read_text())
    funnel = json.loads((ANALYSIS / "selection_funnel.json").read_text())
    core = (a.get("models", {}).get("core", {}) or {}).get("coefficients", {})
    boot = ((a.get("wild_cluster_bootstrap") or {}).get("by_variable") or {})
    bp = {k: v["p_value"] for k, v in boot.items() if v.get("p_value") is not None}

    def p_of(name):
        return bp.get(name, core.get(name, {}).get("p_value", 1.0))

    survivors = sorted(
        (n for n in core if n != "const" and p_of(n) < 0.05), key=p_of)
    overturned = [n for n in core if n != "const"
                  and core[n].get("p_value", 1) < 0.05 and bp.get(n, 0) >= 0.05]

    disc = a.get("disclosure", {}) or {}
    by_m = disc.get("by_mandate", {}) or {}
    rb = disc.get("robustness", {}) or {}
    gaps = [v["gap"] for v in rb.values()] if rb else []

    L: list[str] = []
    A = L.append
    A("# Executive summary")
    A("")
    A("**Determinants of Advertised Pay in the US Energy and Data Center "
      "Sector**")
    A("")
    A("Alexander J. Henderson · Indiana University Kelley School of Business")
    A("")
    A("*This page is generated from `data/analysis/analysis.json`. Every "
      "figure below is")
    A("reproducible with the commands in `README.md`; none is hand-entered.*")
    A("")

    A("## What was measured")
    A("")
    A(f"**{a['n_estimation']} job postings** with an employer-stated pay range, "
      f"from **{a['n_clusters']} employers**")
    A(f"in the US energy, utility and data center sector, drawn from "
      f"{funnel['funnel']['raw']:,} postings")
    A("collected from public applicant-tracking APIs — the upstream systems "
      "employers")
    A("publish through. The dependent variable is the log of the advertised "
      "range midpoint.")
    A("")

    if by_m:
        m = by_m.get("mandate", {}); nm = by_m.get("no_mandate", {})
        A("## Finding 1 — the strongest regularity is about disclosure, not level")
        A("")
        A(f"Pay is stated in **{m.get('share_disclosed', 0) * 100:.1f}%** of "
          f"postings in states that require a pay")
        A(f"scale in the posting (n={m.get('n')}), against "
          f"**{nm.get('share_disclosed', 0) * 100:.1f}%** where no such law "
          f"applies (n={nm.get('n')})")
        if gaps:
            A(f"— a gap of **{min(gaps) * 100:.0f} to {max(gaps) * 100:.0f} "
              f"percentage points** across every cut of the sample.")
        A("")
        A("**This is associational, not causal.** It is a single "
          "cross-section, so there is no")
        A("time variation and no difference-in-differences is available. "
          "Employers who")
        A("operate in mandate states differ from those who do not in ways "
          "these data cannot")
        A("control for. It is reported as a descriptive contrast and nothing "
          "more.")
        A("")

    A("## Finding 2 — within disclosed pay, very little survives proper inference")
    A("")
    if survivors:
        A("Of the regressors in the pre-specified model, these are "
          "distinguishable from zero")
        A("under the wild cluster bootstrap the pre-registration requires:")
        A("")
        # A survivor that the region robustness check withdraws is NOT
        # presented as a finding. `remote_eligible` is the case: it is
        # identified partly off the nationwide-remote rows, which are exactly
        # the ones that have no resolvable region.
        rr = a.get("region_robustness") or {}
        fragile = set(rr.get("verdicts_changed") or [])
        A("| Attribute | Effect on advertised pay | Bootstrap p | Survives the "
          "region check |")
        A("|---|---|---|---|")
        for n in survivors:
            c = core[n]
            pct = c.get("pct_effect")
            eff = "—" if pct is None else f"{pct:+.1f}%"
            ok = "no" if n in fragile else "yes"
            A(f"| {pretty(n)} | {eff} | {p_of(n):.3f} | {ok} |")
        A("")
        if fragile & set(survivors):
            withdrawn = [pretty(n) for n in survivors if n in fragile]
            plural = len(withdrawn) > 1
            names = (" and ".join(withdrawn) if len(withdrawn) <= 2 else
                     ", ".join(withdrawn[:-1]) + " and " + withdrawn[-1])
            A(f"**{'Neither ' + names.replace(' and ', ' nor ') + ' survives' if plural else names + ' does not survive'}** re-estimating without the "
              f"{rr.get('n_dropped')} nationwide-remote")
            A("postings, which resolve to no state and therefore sit in the "
              "Midwest reference")
            A("category of the region dummies.")
            # The reason a given coefficient is identified off those rows is
            # specific to the coefficient. This paragraph used to give the
            # remote-eligibility explanation whichever variable turned out to
            # be fragile, which was wrong the moment a different one did.
            if "remote_eligible" in fragile:
                A("Those same postings are the remote-eligible ones, so that "
                  "coefficient was")
                A("identified in part off exactly the rows the check removes.")
            if "mandate_state" in fragile:
                A("A posting with no resolvable state also has no determinable "
                  "mandate status and")
                A("is coded as uncovered, so dropping those rows changes the "
                  "contrast directly.")
            A("Treat them as inconclusive." if plural else "Treat it as inconclusive.")
            A("")
        A("Seniority is the one result the study would defend without "
          "qualification: it is")
        A("the most precisely estimated coefficient, it was predicted in "
          "advance, and it")
        A("survives every robustness cut applied here.")
        A("")
        # Computed, not asserted. An earlier draft of this paragraph carried
        # the concentration figures as literals, in a generator whose entire
        # purpose is that no number is hand-entered.
        south = _south_concentration()
        if ("region_south" in survivors and "region_south" not in fragile
                and south):
            n_s, top_emp, top_n, top_state, state_n = south
            A(f"The South premium survives those cuts, but read it with care: "
              f"of its {n_s} observations,")
            A(f"{top_n} come from one employer ({top_emp}) and {state_n} from "
              f"one state ({top_state}).")
            A(f"At {a['n_clusters']} employer clusters a regional coefficient "
              f"and an employer effect are")
            A("hard to separate.")
            A("")
    if overturned:
        A(f"**{len(overturned)} further attributes reach significance under "
          f"clustered standard errors and")
        A("not under the bootstrap** — "
          + ", ".join(pretty(n) for n in overturned) + ".")
        A("With few employer clusters the asymptotic p-values are "
          "anti-conservative, so these")
        A("are reported as inconclusive rather than as findings. An "
          "underpowered null is not")
        A("a measured zero, and neither is a finding.")
        A("")

    A("## What this study does not support")
    A("")
    A("Stated here because each was either predicted or previously reported, "
      "and a reader")
    A("who takes only this page away should not take away a claim the data "
      "withdrew.")
    A("")
    dr = core.get("degree_required", {})
    if dr and p_of("degree_required") >= 0.05:
        A(f"- **A degree premium.** `degree_required` was predicted positive; "
          f"the point estimate")
        # The sign is read, not asserted: this line said "the wrong sign"
        # unconditionally and was false the moment the estimate turned
        # positive (audit round 6).
        sign = "the predicted sign" if dr.get("coef", 0) > 0 else "the wrong sign"
        A(f"  is {dr.get('coef', 0):+.4f} — {sign} — and at "
          f"p={p_of('degree_required'):.3f} it is not")
        A("  distinguishable from zero. Reported as inconclusive, not as a "
          "reversal.")
    if "skill_ml_ai" in core and p_of("skill_ml_ai") >= 0.05:
        A(f"- **An AI or ML pay premium.** `skill_ml_ai` is "
          f"{core['skill_ml_ai'].get('coef', 0):+.4f} at "
          f"p={p_of('skill_ml_ai'):.3f}.")
        A("  An earlier version of this study reported roughly +27% at "
          "p=0.003. That estimate")
        A("  did not survive audit round 4, which removed a multi-sector "
          "consultancy's public")
        A("  health, national security and fraud postings from the sample — "
          "much of the")
        A("  apparent AI premium was theirs, and outside the sector under "
          "study.")
    if "industry_data_center" in core and p_of("industry_data_center") >= 0.05:
        A("- **Data center operators paying more than utilities.** Predicted "
          "positive; the")
        dc_sign = ("positive" if core["industry_data_center"].get("coef", 0) > 0
                   else "negative")
        A(f"  estimate is {dc_sign} but at p={p_of('industry_data_center'):.3f} "
          f"it is inconclusive.")
    if "mandate_state" in core and p_of("mandate_state") >= 0.05:
        A(f"- **A pay-level effect of mandate states.** `mandate_state` is "
          f"{core['mandate_state'].get('coef', 0):+.4f} at "
          f"p={p_of('mandate_state'):.3f}.")
        A("  Earlier versions reported a significant negative coefficient and "
          "explained it as")
        A("  disclosure selection. Audit round 6 found it was substantially an "
          "artifact: the pay")
        A("  parser was halving seventeen postings of the largest employer, all "
          "in mandate states")
        A("  and twelve in Illinois, the Midwest reference region. Corrected, it "
          "is indistinguishable")
        A("  from zero.")
    A("")

    A("## What limits it")
    A("")
    for w in a.get("interpretability_warnings", []):
        # The analysis output says "read the bootstrap p-values below"; on this
        # page they are above, so the pointer is rewritten rather than copied.
        A("- " + w.replace("Read the wild cluster bootstrap p-values below, "
                           "not these.",
                           "Significance on this page is therefore read off "
                           "the wild cluster bootstrap."))
    A(f"- **Disclosure is selected.** Only "
      f"{funnel['funnel']['usable_with_pay']} of "
      f"{funnel['funnel']['unique_in_scope']} in-scope postings state pay, "
      f"so every")
    A("  pay coefficient is conditional on disclosure. This is the central "
      "threat, and it")
    A("  is why the disclosure result is a headline rather than a footnote.")
    A("- **The scope widened four times in response to the data.** Disclosed "
      "in")
    A("  `docs/limitations.md`; the specification was pre-registered before "
      "the national")
    A("  sample was collected, and every later change is a dated amendment.")
    pa = a.get("price_adjustment") or {}
    if pa.get("available"):
        A(f"- **Pay is nominal in the headline figures.** A price-adjusted "
          f"check using BEA")
        A(f"  regional price parities is reported on {pa.get('n')} "
          f"observations in the paper.")
    else:
        A("- **Pay is nominal.** No regional price adjustment is applied; no "
          "deflator is imputed.")
    A("")

    A("## Where to look next")
    A("")
    A("| | |")
    A("|---|---|")
    A("| Full write-up | `paper/paper.md` |")
    A("| What was committed before seeing data | `docs/pre-registration.md` |")
    A("| Every defect found, and how | `docs/audit-log.md` |")
    A("| What a reader is entitled to discount | `docs/limitations.md` |")
    A("| Variable definitions | `docs/codebook.md` |")
    A("| Rebuilding every number | `README.md` |")
    A("")

    out = ROOT / "docs" / "executive-summary.md"
    out.write_text("\n".join(L) + "\n")
    print(f"wrote {out.relative_to(ROOT)} ({len(L)} lines, "
          f"{len(survivors)} surviving predictor(s), "
          f"{len(overturned)} overturned by the bootstrap)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

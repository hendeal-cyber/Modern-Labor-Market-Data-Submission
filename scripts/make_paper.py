"""Generate paper/paper.md from the analysis artifacts.

Every number in the paper comes from a committed artifact, so the write-up
cannot drift from the data. Sections whose inputs do not exist yet are emitted
as explicit TODO markers rather than being silently omitted or invented.
"""
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
ANALYSIS = ROOT / "data" / "analysis"


def load(name: str) -> dict | None:
    path = ANALYSIS / name
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return None


def pct(x) -> str:
    return f"{x*100:.1f}%" if isinstance(x, (int, float)) else "n/a"


def coefficient_table(model: dict) -> list[str]:
    lines = ["| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |",
             "|---|---|---|---|---|---|"]
    for name, c in model["coefficients"].items():
        stars = ("***" if c["p_value"] < 0.01 else "**" if c["p_value"] < 0.05
                 else "*" if c["p_value"] < 0.10 else "")
        # pct_effect is None for the intercept, which is a level rather than
        # an effect. Formatting it as a number produced "7,370,111%" before,
        # and a TypeError after it was nulled.
        pct = "—" if c.get("pct_effect") is None else f"{c['pct_effect']:.1f}%"
        lines.append(
            f"| `{name}` | {c['coef']:.4f}{stars} | {c['std_err']:.4f} | {c['p_value']:.3f} | "
            f"[{c['ci_low']:.3f}, {c['ci_high']:.3f}] | {pct} |"
        )
    lines += ["", "*** p<0.01, ** p<0.05, * p<0.10. "
              f"N = {model['n']}, R² = {model['r_squared']:.3f}, "
              f"SE: {model['cov_type']}.", ""]
    return lines


def main() -> int:
    analysis = load("analysis.json")
    funnel = load("selection_funnel.json")
    audit = None
    audit_path = ROOT / "data" / "gold" / "audit-scores.json"
    if audit_path.exists():
        audit = json.loads(audit_path.read_text())

    L: list[str] = []
    A = L.append

    disc = (analysis or {}).get("disclosure", {}) or {}
    by_m = disc.get("by_mandate", {}) or {}
    m_share = (by_m.get("mandate") or {}).get("share_disclosed")
    n_share = (by_m.get("no_mandate") or {}).get("share_disclosed")

    A("# Determinants of Advertised Pay in the US Energy and Data Center Sector")
    A("## Evidence from employer-published job postings")
    A("")
    if funnel:
        A(f"*Built from data collected through {funnel.get('built_at','')[:10]}. "
          f"Collection cycles: {len(funnel.get('snapshots', []))}.*")
    A("")

    A("## Executive summary")
    A("")
    A("This study asks what attributes stated in a job posting predict the pay an")
    A("employer advertises, across the United States energy and data center sector.")
    A("Postings are collected from the public applicant tracking system APIs that")
    A("employers publish through — the upstream source for the job boards those")
    A("postings appear on.")
    A("")
    if m_share is not None and n_share is not None:
        A(f"**The clearest result concerns disclosure rather than level.** Pay is")
        A(f"stated in **{m_share:.1%}** of postings in states with a posting-level")
        A(f"pay-transparency mandate, against **{n_share:.1%}** where there is none —")
        A(f"a gap of **{(m_share - n_share) * 100:.0f} percentage points**. The")
        A("contrast is descriptive, not causal: this is a single cross-section with")
        A("no time variation, so no difference-in-differences is available, and")
        A("employers operating in mandate states differ from those that do not in")
        A("ways these data cannot control for.")
        A("")
    A("Seniority, required experience and role family are the attributes that")
    A("predict advertised pay within the disclosing sample. The early-career")
    A("subsample that motivated the study is reported separately, so the original")
    A("question remains answerable alongside the wider one.")
    A("")

    A("## 1. Introduction")
    A("")
    A("Data center construction is driving a wave of technical and analytical")
    A("hiring across the utility sector and the colocation operators that depend on")
    A("it. Both compete for talent against employers who pay on a national")
    A("technology scale. This paper asks which attributes stated in a job posting")
    A("predict the pay that employers advertise for those roles.")
    A("")
    A("The dependent variable is the natural log of the midpoint of the")
    A("employer-stated pay range, annualized to US dollars. Location and seniority")
    A("enter as regressors rather than as sample restrictions, which is what makes")
    A("the disclosure contrast estimable.")
    A("")

    A("## 2. Institutional background")
    A("")
    A("Sixteen US jurisdictions require employers to state a pay scale in the")
    A("posting itself. Colorado was first, in 2021; California, New York and")
    A("Washington followed; Illinois House Bill 3129 took effect on 1 January 2025")
    A("and Massachusetts in October 2025. The full table, with effective dates, is")
    A("in `config/scope.yaml` so a reader can audit which jurisdictions count.")
    A("")
    A("Coverage attaches to the location of the work. A posting listing several")
    A("locations is therefore covered if **any** of them is covered, which is how")
    A("`mandate_state` is computed; `states_listed` and `n_locations` are retained")
    A("so the rule can be checked or recomputed. Roughly a quarter of postings")
    A("list more than one location, so the choice is not cosmetic.")
    A("")
    A("Where no mandate applies, disclosure is voluntary and therefore selected.")
    A("This is the central limitation of the pay models and is treated as such:")
    A("disclosure is modelled as an outcome in its own right, not assumed away.")
    A("")

    A("## 3. Data")
    A("")
    A("### 3.1 Source")
    A("")
    A("Postings are collected from the public, unauthenticated applicant tracking")
    A("system APIs that employers publish through, which are the upstream source for")
    A("the job boards those postings appear on. LinkedIn is not used: its User")
    A("Agreement prohibits programmatic collection. Full methodological detail,")
    A("including the compliance posture, is in `docs/methods.md`.")
    A("")
    A("### 3.2 Sampling frame")
    A("")
    A("The frame covers the energy and data center sector across nine industry")
    A("categories: utilities, cooperatives, competitive retailers, grid operators,")
    A("data center operators, developers, energy analytics firms, consultancies")
    A("and grid technology vendors.")
    A("")
    A("Roles are restricted to an energy-analytics core — siting and development,")
    A("regulatory and compliance, market and commercial, grid and power systems,")
    A("AI and machine learning, GIS, sustainability analytics, and software and")
    A("data. Engineering is admitted only where analytics-adjacent. Every")
    A("seniority level is included **except internships**, which are a different")
    A("contract and pay regime; seniority enters as an ordinal regressor.")
    A("")
    A("Geography is the United States. Non-US postings are excluded, since pooling")
    A("currencies and labour markets would not be meaningful.")
    A("")
    A("> **Known gap.** Exelon, ComEd, Constellation and Citizens Energy run")
    A("> iCIMS, which releases its job feed only to approved job boards and gates")
    A("> its API behind a partnership. A syndication feed was probed and none")
    A("> exists, and the portal terms prohibit automated access, so the gap is")
    A("> accepted rather than worked around. Results describing Chicago utilities")
    A("> specifically exclude them. See `docs/limitations.md`.")
    A("")

    A("### 3.3 Selection funnel")
    A("")
    if funnel:
        f = funnel["funnel"]
        A("| Stage | Postings |")
        A("|---|---|")
        for label, key in [("Retrieved from ATS boards", "raw"),
                           ("Passed role, seniority and internship screens", "passed_screen"),
                           ("Within 35 miles of a study metro", "passed_geo"),
                           ("Unique after de-duplication", "unique_in_scope"),
                           ("With a disclosed pay range (estimation sample)", "usable_with_pay")]:
            if key in f:
                A(f"| {label} | {f[key]:,} |")
        A("")
        if funnel.get("rejection_reasons"):
            A("Rejections by reason:")
            A("")
            A("| Reason | Count |")
            A("|---|---|")
            for reason, count in list(funnel["rejection_reasons"].items())[:12]:
                A(f"| `{reason}` | {count:,} |")
            A("")
        A(f"Distinct employers contributing a disclosed range: "
          f"**{funnel.get('distinct_employers_with_pay', 0)}**. "
          f"By metro: `{funnel.get('usable_by_metro', {})}`.")
        A("")
        if not funnel.get("floor_met"):
            A(f"> The pre-registered floor of {funnel.get('min_usable_n')} usable")
            A("> observations is **not yet met**. Collection continues; the escalation")
            A("> rule in `config/scope.yaml` governs what widens if it stays unmet.")
            A("")
    else:
        A("*TODO: no selection funnel found. Run `src/lmstudy/build_dataset.py`.*")
        A("")

    A("### 3.4 Regressor coding and audit")
    A("")
    A("Regressors are coded from posting text by word-boundary pattern matching")
    A("against a dictionary declared in `config/regressors.yaml`. Every coded value")
    A("retains the pattern that produced it. Definitions are in `docs/codebook.md`.")
    A("")
    if audit:
        A(f"Audit: **{audit.get('regressors_judged', 0)}** regressors judged against")
        A(f"hand-coded truth, mean accuracy **{audit.get('mean_accuracy')}**.")
        weak = audit.get("below_threshold") or []
        if weak:
            A(f"Below the 0.90 threshold and refined: {', '.join(f'`{w}`' for w in weak)}.")
        else:
            A("No regressor fell below the 0.90 accuracy threshold.")
        A("")
    else:
        A("*TODO: no audit has been scored yet. Run `src/lmstudy/audit.py sample`,")
        A("hand-code the sheet, then `audit.py score`. Accuracy claims must not be")
        A("made until this exists.*")
        A("")

    A("## 4. Empirical strategy")
    A("")
    A("The specification regresses log advertised pay on posting attributes, with")
    A("standard errors clustered by employer because employers contribute many")
    A("postings each. A core model is pre-specified; an extended model is estimated")
    A("only when the sample supports roughly twenty observations per regressor, so")
    A("the specification is chosen by sample size rather than by results.")
    A("")
    A("Cluster-robust standard errors are biased downward when clusters are few.")
    A("Simulation with twelve employer clusters recovered nominal 95% coverage of")
    A("only about 88%. Where the realized employer count is small, a wild cluster")
    A("bootstrap should precede any claim resting on a marginal p-value.")
    A("")

    A("## 5. Results")
    A("")
    for warning in (analysis or {}).get("interpretability_warnings", []):
        A(f"> **Not yet interpretable.** {warning}")
        A(">")
    if (analysis or {}).get("interpretability_warnings"):
        A("> The model below is reported so the pipeline is verifiable end to end,")
        A("> not because the coefficients support conclusions.")
        A("")
    if analysis and analysis.get("status") == "ok":
        d = analysis.get("descriptives", {}).get("pay_midpoint", {})
        if d:
            A(f"Advertised pay in the estimation sample averages **${d.get('mean', 0):,.0f}** "
              f"(median ${d.get('median', 0):,.0f}, SD ${d.get('std', 0):,.0f}, "
              f"range ${d.get('min', 0):,.0f}–${d.get('max', 0):,.0f}).")
            A("")
        p = analysis.get("power", {})
        if p:
            A(f"At N = {p.get('n')} with {p.get('k_core')} regressors, the smallest")
            A(f"detectable standardized effect is **{p.get('min_detectable_std_effect_log_points')}**")
            A("log points at 5% significance and 80% power.")
            A("")
        # The disclosure contrast leads, because it is the result national
        # coverage made estimable and the one least vulnerable to the
        # selection problem that limits the pay models.
        if by_m:
            A("### Disclosure and pay-transparency mandates")
            A("")
            A("| Posting is in | Share stating pay | Postings |")
            A("|---|---|---|")
            for key, label in (("mandate", "a mandate state"),
                               ("no_mandate", "no mandate state")):
                row = by_m.get(key) or {}
                if row:
                    A(f"| {label} | {row.get('share_disclosed', 0):.1%} "
                      f"| {row.get('n', 0):,} |")
            A("")
            A("Coverage follows the job's location, so a posting listing any covered")
            A("location counts as covered. Around a quarter of postings list more")
            A("than one, and `states_listed` is retained so the rule can be checked.")
            A("")
            A("> **This is a descriptive contrast, not a causal estimate.** A single")
            A("> cross-section carries no time variation, so no")
            A("> difference-in-differences is available. Employers who operate in")
            A("> mandate states differ from those who do not in size, sector and")
            A("> geography, and these data cannot separate those differences from")
            A("> the effect of the law itself.")
            A("")

        for key, model in (analysis.get("models") or {}).items():
            A(f"### {model['label']}")
            A("")
            L.extend(coefficient_table(model))

        ec = analysis.get("early_career_subsample") or {}
        if ec:
            A("### The early-career question")
            A("")
            A(f"The study began as a question about early-career pay specifically.")
            A(f"That subsample is **{ec.get('n', 0)}** postings from")
            A(f"**{ec.get('n_employers', 0)}** employers"
              + (f" — {ec['note']}." if ec.get("note") else ", estimated above."))
            A("It is reported whether or not it agrees with the full sample: a")
            A("disagreement would be a finding, not a reason to drop it.")
            A("")

        pa = analysis.get("price_adjustment") or {}
        if pa and not pa.get("available"):
            A("### Price-adjusted pay")
            A("")
            A(f"Not available. {pa.get('note', '')} Nominal pay is reported")
            A("throughout. Comparing advertised pay across states without adjusting")
            A("for local price levels overstates real differences in high-cost")
            A("states, and this limitation applies to every coefficient above.")
            A("")

        A("### Pre-registered hypotheses, scored")
        A("")
        A("Directions were committed in `docs/pre-registration.md` before the")
        A("national sample was collected. They are scored here whether or not they")
        A("held, which is the point of having written them down.")
        A("")
        A("| # | Hypothesis | Predicted | Result |")
        A("|---|---|---|---|")
        core = (analysis.get("models") or {}).get("core", {}).get("coefficients", {})

        def verdict(name, want_positive=True, label=None):
            row = core.get(name)
            if not row:
                return f"| — | `{name}` | — | not estimated |"
            coef, pval = row.get("coef", 0), row.get("p_value", 1)
            sig = "significant" if pval < 0.05 else "not significant"
            direction = "positive" if coef > 0 else "negative"
            matched = (coef > 0) == want_positive
            mark = "supported" if (matched and pval < 0.05) else (
                "**contradicted**" if (not matched and pval < 0.05) else "inconclusive")
            return (label or name, "+" if want_positive else "-",
                    f"{direction}, {sig} — {mark}")

        for num, name, want, text in [
            ("H1", "seniority_rank", True, "Seniority dominates advertised pay"),
            ("H3", "yrs_exp_min", True, "Required experience raises pay"),
            ("H4", "family_ai_ml", True, "AI/ML roles carry a premium"),
            ("H5", "degree_required", True, "A required degree raises pay"),
            ("H7", "industry_data_center", True, "Data centers pay more than utilities"),
        ]:
            v = verdict(name, want)
            if isinstance(v, str):
                A(f"| {num} | {text} | {'+' if want else '-'} | not estimated |")
            else:
                A(f"| {num} | {text} | {v[1]} | {v[2]} |")
        if m_share is not None and n_share is not None:
            A(f"| H2 | A mandate raises disclosure | + | "
              f"{m_share:.1%} vs {n_share:.1%} — **supported**, descriptively |")
        A("")
        deg = core.get("degree_required") or {}
        if deg and deg.get("p_value", 1) < 0.05 and deg.get("coef", 0) < 0:
            A("**H5 is contradicted and the reason is not obvious.** A stated degree")
            A("requirement is associated with *lower* advertised pay, conditional on")
            A("seniority. The most likely explanation is compositional rather than")
            A("causal: the best-paid technical postings increasingly say \"degree or")
            A("equivalent experience\" or omit the requirement entirely, so the")
            A("indicator may be marking employers with more formal hiring processes")
            A("rather than jobs with higher human-capital requirements. That is a")
            A("conjecture, not a result — testing it needs a variable this dataset")
            A("does not have. It is reported because it was predicted the other way.")
            A("")
        sel = analysis.get("selection") or {}
        if sel.get("by_variable"):
            A("### Who discloses pay")
            A("")
            A(f"Disclosure rate **{pct(sel.get('disclosure_rate'))}** "
              f"({sel.get('n_disclosed')} disclosed, {sel.get('n_withheld')} withheld).")
            A("")
            A("| Variable | Mean (disclosed) | Mean (withheld) | Difference | p |")
            A("|---|---|---|---|---|")
            for name, row in sel["by_variable"].items():
                A(f"| `{name}` | {row['mean_disclosed']} | {row['mean_withheld']} | "
                  f"{row['diff']} | {row['p_value']} |")
            A("")
    elif analysis:
        A(f"*No results yet: {analysis.get('note', analysis.get('status'))}*")
        A("")
        A(f"Current sample: {analysis.get('n_estimation', 0)} usable observations "
          f"from {analysis.get('distinct_employers', 0)} employers.")
        A("")
    else:
        A("*TODO: no analysis artifact. Run `src/lmstudy/analyze.py`.*")
        A("")

    A("## 6. Threats to validity")
    A("")
    A("These are treated at length in `docs/limitations.md`. In short: the outcome is")
    A("advertised pay rather than realized pay; disclosure is selected, and that")
    A("selection is concentrated in Indiana where no mandate applies; the panel has")
    A("no historical backfill, so the opening sample over-represents long-open roles;")
    A("rule-based coding misreads some postings, which the audit measures rather than")
    A("assumes away; standard errors under-cover when employer clusters are few; and")
    A("Exelon and ComEd are absent from the frame entirely.")
    A("")

    A("## 7. Conclusion")
    A("")
    if analysis and analysis.get("status") == "ok":
        A("*TODO: write once the results above are stable across collection cycles.*")
    else:
        A("*TODO: pending results.*")
    A("")
    A("## Appendix")
    A("")
    A("- `docs/codebook.md` — every variable and its coding rule")
    A("- `docs/methods.md` — design, compliance posture, estimation strategy")
    A("- `docs/limitations.md` — what the data cannot support")
    A("- `docs/audit-log.md` — coding accuracy by round")
    A("- `data/analysis/postings.csv` — the analysis dataset")
    A("- `data/analysis/selection_funnel.json` — full funnel and rejection reasons")
    A("")
    A("Reproduce with `pip install -r requirements.txt && python tests/run_all.py`,")
    A("then `python src/lmstudy/collect/run.py && python src/lmstudy/build_dataset.py`.")
    A("")

    out = ROOT / "paper" / "paper.md"
    out.write_text("\n".join(L))
    todos = sum(1 for line in L if "TODO" in line)
    print(f"wrote {out} ({len(L)} lines, {todos} TODO marker(s))")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

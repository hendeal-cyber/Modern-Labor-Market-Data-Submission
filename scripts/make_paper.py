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
        lines.append(
            f"| `{name}` | {c['coef']:.4f}{stars} | {c['std_err']:.4f} | {c['p_value']:.3f} | "
            f"[{c['ci_low']:.3f}, {c['ci_high']:.3f}] | {c['pct_effect']:.1f}% |"
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

    A("# Advertised Pay in Early-Career Software and Data Roles")
    A("## Evidence from Utility and Data Center Operators in Chicago and Indianapolis")
    A("")
    if funnel:
        A(f"*Built from data collected through {funnel.get('built_at','')[:10]}. "
          f"Collection cycles: {len(funnel.get('snapshots', []))}.*")
    A("")

    A("## 1. Introduction")
    A("")
    A("Data center construction is driving a wave of technical hiring across the")
    A("utility sector and the colocation operators that depend on it. Both compete")
    A("for early-career software and data talent against employers who pay on a")
    A("national technology scale. This paper asks which attributes stated in a job")
    A("posting predict the pay that employers advertise for those roles.")
    A("")
    A("The dependent variable is the natural log of the midpoint of the")
    A("employer-stated pay range, annualized to US dollars.")
    A("")

    A("## 2. Institutional background")
    A("")
    A("Illinois House Bill 3129, amending the Illinois Equal Pay Act, took effect on")
    A("1 January 2025. Employers with fifteen or more employees must state the pay")
    A("scale and describe benefits in any posting for work performed at least partly")
    A("in Illinois. Both the dependent variable and several benefit regressors are")
    A("therefore legally required to appear in Chicago-area postings.")
    A("")
    A("Indiana has no comparable requirement. Indianapolis postings disclose pay far")
    A("less often, and those that do are self-selected. The indicator `mandate_state`")
    A("carries this contrast into the analysis rather than leaving it implicit.")
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
    A("The frame is restricted to core operators — firms that own or operate")
    A("utilities or data centers — excluding the engineering firms and equipment")
    A("vendors that serve the sector. Roles are restricted to software, data and")
    A("analytics. Early career means three years or fewer of required experience.")
    A("")
    A("> **Known gap.** Exelon and ComEd run iCIMS, which exposes no free public")
    A("> jobs API. They are the largest Chicago-headquartered utility employer and")
    A("> the most likely source of Chicago early-career software and data roles.")
    A("> Results describing \"Chicago utilities\" exclude them.")
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
        for key, model in (analysis.get("models") or {}).items():
            A(f"### {model['label']}")
            A("")
            L.extend(coefficient_table(model))
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

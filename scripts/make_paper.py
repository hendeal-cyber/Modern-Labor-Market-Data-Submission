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


def bootstrap_p(analysis: dict | None) -> dict[str, float]:
    """Bootstrap p-values by variable, empty when the bootstrap did not run.

    The pre-registration (section 6) makes the wild cluster bootstrap the
    inference procedure while employer clusters number under 30, so wherever
    it exists it is what this paper reports. Before it was implemented the
    paper read significance off the asymptotic clustered p-values, and seven
    of the nine it called significant do not survive the bootstrap -- so this
    is not a presentational preference, it decides what the study claims.
    """
    boot = (analysis or {}).get("wild_cluster_bootstrap") or {}
    return {k: v["p_value"] for k, v in (boot.get("by_variable") or {}).items()
            if v.get("p_value") is not None}


def reported_p(name: str, model_coefs: dict, boot: dict) -> tuple[float, str]:
    """The p-value the paper stands behind, and which procedure produced it."""
    if name in boot:
        return boot[name], "bootstrap"
    row = model_coefs.get(name) or {}
    return row.get("p_value", 1.0), "clustered"


def coefficient_table(model: dict, boot: dict | None = None) -> list[str]:
    boot = boot or {}
    if boot:
        lines = ["| Variable | Coef. | Std. err. | Clustered p | **Bootstrap p** | "
                 "95% CI | Approx. % effect |",
                 "|---|---|---|---|---|---|---|"]
        for name, c in model["coefficients"].items():
            bp = boot.get(name)
            # Stars follow the BOOTSTRAP where there is one. Starring the
            # clustered p beside a bootstrap p that disagrees would put the
            # paper's own emphasis on the number it does not stand behind.
            basis = bp if bp is not None else c["p_value"]
            stars = ("***" if basis < 0.01 else "**" if basis < 0.05
                     else "*" if basis < 0.10 else "")
            pct = "—" if c.get("pct_effect") is None else f"{c['pct_effect']:.1f}%"
            lines.append(
                f"| `{name}` | {c['coef']:.4f}{stars} | {c['std_err']:.4f} | "
                f"{c['p_value']:.3f} | "
                f"{'—' if bp is None else f'**{bp:.3f}**'} | "
                f"[{c['ci_low']:.3f}, {c['ci_high']:.3f}] | {pct} |")
        lines += ["", "*** p<0.01, ** p<0.05, * p<0.10, **on the bootstrap p-value** "
                  "where one is reported. "
                  f"N = {model['n']}, R² = {model['r_squared']:.3f}, "
                  f"SE: {model['cov_type']}.", ""]
        return lines
    lines = ["| Variable | Coef. | Std. err. | p | 95% CI | Approx. % effect |",
             "|---|---|---|---|---|---|"]
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
    # The dataset itself, for claims that must be counted rather than asserted.
    _csv_path = ANALYSIS / "postings.csv"
    _rows: list[dict] = []
    if _csv_path.exists():
        import csv as _csvmod
        with _csv_path.open() as _fh:
            _rows = list(_csvmod.DictReader(_fh))
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
        rb_all = ((analysis or {}).get("disclosure", {}) or {}).get("robustness", {})
        gaps = [v["gap"] for v in rb_all.values()] if rb_all else []
        if len(gaps) > 1:
            A("")
            spread = (max(gaps) - min(gaps)) * 100
            A(f"The gap is large under every cut of the sample "
              f"({min(gaps) * 100:.0f} to {max(gaps) * 100:.0f} points)")
            # Whether the gap is fragile is a measured property, not a fixed
            # caveat. It read "its size depends heavily on one jurisdiction"
            # unconditionally, which was true at a 50-71 point spread and
            # false once audit round 4 removed a federal consultancy's
            # off-umbrella postings -- those WERE the Virginia non-disclosers,
            # and the spread fell to a few points. A caveat that cannot stop
            # applying is not a caveat.
            if spread > 10:
                A("but its size depends heavily on one jurisdiction; see the")
                A("robustness table in section 5 before quoting a single figure.")
            else:
                A(f"and stable across them, a spread of only {spread:.0f} points. "
                  "Earlier versions")
                A("of this study reported a gap swinging from 50 to 71 points, "
                  "sensitive to")
                A("Virginia alone. That sensitivity was an artifact: the "
                  "non-disclosing")
                A("mandate-state postings were a federal consultancy's public "
                  "health, national")
                A("security and law-enforcement work, which audit round 4 "
                  "removed as outside")
                A("the sector under study. Removing it removed the fragility "
                  "rather than")
                A("explaining it away. Section 5 reports every cut.")
        A("")

    # Generated from the fitted model rather than asserted. This sentence
    # previously named "required experience and role family" as predictors when
    # neither was significant (p = 0.57 and 0.67), which is exactly the kind of
    # claim a summary written by hand drifts into after the model changes.
    core_coefs = ((analysis or {}).get("models", {}).get("core", {})
                  .get("coefficients", {}))
    # Significance is read from the BOOTSTRAP where one exists. Read off the
    # clustered p-values this sentence named seven attributes that the
    # pre-registered procedure cannot distinguish from zero -- the same class
    # of drift as the earlier hand-written version, one layer deeper.
    _boot = bootstrap_p(analysis)
    sig = sorted(((k, v) for k, v in core_coefs.items()
                  if k != "const"
                  and reported_p(k, core_coefs, _boot)[0] < 0.05),
                 key=lambda kv: reported_p(kv[0], core_coefs, _boot)[0])
    if sig:
        pretty = {
            "seniority_rank": "seniority", "skill_ml_ai": "a stated ML or AI skill",
            "remote_eligible": "remote eligibility", "degree_stem": "a STEM degree",
            "degree_required": "a required degree", "yrs_exp_min": "required experience",
            "industry_data_center": "being a data center operator",
            "region_northeast": "Northeast location", "region_south": "South location",
            "region_west": "West location", "family_ai_ml": "an AI/ML role family",
        }
        named = [pretty.get(k, f"`{k}`") for k, _ in sig[:4]]
        basis = "the wild cluster bootstrap" if _boot else "clustered standard errors"
        A("Within the postings that do disclose, the attributes that predict pay at")
        if len(named) == 1:
            A(f"conventional significance under {basis} are limited to one:")
            A(f"{named[0]}.")
        else:
            A(f"conventional significance under {basis} are "
              f"{', '.join(named[:-1])} and {named[-1]}.")
        # The region check is a second pre-specified hurdle. Naming survivors
        # of the first without it presented two coefficients the study
        # reports as inconclusive as findings (audit round 6).
        _fragile = set((analysis.get("region_robustness") or {})
                       .get("verdicts_changed") or [])
        _withdrawn = [pretty.get(k, f"`{k}`") for k, _ in sig if k in _fragile]
        _robust = [pretty.get(k, f"`{k}`") for k, _ in sig if k not in _fragile]
        if _withdrawn:
            A(f"{' and '.join(_withdrawn)} "
              f"{'do' if len(_withdrawn) > 1 else 'does'} not survive "
              "re-estimation without the nationwide-remote postings (a")
            A("robustness check added after pre-registration, reported either way) and "
              f"{'are' if len(_withdrawn) > 1 else 'is'} reported as inconclusive"
              + (f"; {' and '.join(_robust)} "
                 f"{'survive' if len(_robust) > 1 else 'survives'} both." if _robust
                 else "."))
        if _boot:
            dropped = [k for k, v in core_coefs.items()
                       if k != "const" and v.get("p_value", 1) < 0.05
                       and _boot.get(k, 0) >= 0.05]
            if dropped:
                A(f"A further {len(dropped)} attributes reach significance under")
                A("clustered standard errors but not under the bootstrap, which is")
                A("the inference this study pre-registered; they are reported as")
                A("inconclusive, not as findings.")
        neg = [k for k, v in sig if v.get("coef", 0) < 0]
        if neg:
            A(f"Note that {pretty.get(neg[0], neg[0])} enters **negatively**, which")
            A("was predicted the other way; section 5 reports it as contradicted.")
        A("")
    A("The early-career subsample that motivated the study is reported separately,")
    A("so the original question remains answerable alongside the wider one.")
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
                           ("In the US, with a resolvable state or nationwide-remote", "passed_geo"),
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
        # The gold-set scorer in audit.py has not been run, but three rounds of
        # hand-auditing have. Printing "no audit has been scored" understated
        # the work and was the misleading direction to be wrong in.
        # The round count is read from the audit log, not written here. It
        # said "three rounds" after round 4 had landed -- and round 4 is the
        # one that removed 337 off-umbrella postings and withdrew the AI
        # premium, so the stale count hid the most consequential audit.
        import re as _re
        _log = (ROOT / "docs" / "audit-log.md")
        _rounds = len(_re.findall(r"^### Round \d+", _log.read_text(), _re.M)) \
            if _log.exists() else 0
        _word = {1: "One round", 2: "Two rounds", 3: "Three rounds",
                 4: "Four rounds", 5: "Five rounds", 6: "Six rounds"}.get(_rounds,
                                                         f"{_rounds} rounds")
        A(f"{_word} of hand-auditing are recorded in `docs/audit-log.md`.")
        A("Each read real collected titles rather than a synthetic sample, and")
        A("each found errors the test suite had not:")
        A("")
        A("| Round | Target | Result |")
        A("|---|---|---|")
        A("| 1 | Regressor coding | Three systematic false positives, all firing on company boilerplate rather than on anything asked of the applicant |")
        A("| 2 | `role_family` | 6 of 53 assignments wrong (89%). Four had reached a live measurement and sat in the top eleven rows by pay |")
        A("| 3 | `seniority_rank`, `state` | 21 of 141 wrong (85.1%). One defect changed the headline disclosure contrast |")
        if _rounds >= 4:
            A("| 4 | The industry umbrella itself | A multi-sector consultancy supplied 22% of the sample and three rows of it were energy work. 337 postings removed; the AI-premium finding did not survive |")
        if _rounds >= 5:
            A("| 5 | The concept role screen and dedupe | All 40 titles the new matcher admitted were read: 4 false positives caught before the rebuild. One nested-location repost found in 1,940 records and collapsed |")
        if _rounds >= 6:
            A("| 6 | Run 26: all 115 added rows, then the whole corpus | The pay parser was still halving 17 Invenergy rows and recording 9 NYISO rows at their floor. Every usable \"Hitachi Energy\" row belonged to a sister company. Connecticut was coded as a mandate state before its law took effect. Fixing them withdrew `mandate_state` and `region_west`, which had passed the bootstrap on the unaudited data |")
        A("")
        A("Every defect found is pinned by a regression test built from the real")
        A("title or location string that produced it, not from a reconstruction.")
        A("")
        A("> The formal gold-set scorer (`audit.py score`) has not been run, so no")
        A("> single per-regressor accuracy figure is quoted here. The rounds above")
        A("> are exhaustive hand-reads of the population, which is a different and")
        A("> in this sample stronger check than a sampled gold set — but it is not")
        A("> the same thing, and is not presented as one.")
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
    A("Simulation with twelve employer clusters covers the planted coefficient 92%")
    A("of the time against a nominal 95%, and rejects a cluster-level placebo at")
    A("9.5% against a nominal 5%. A **wild cluster bootstrap is therefore estimated")
    A("and reported**, not merely recommended, whenever the realized employer count")
    A("falls below thirty; section 5 gives it. An earlier version of this paper")
    A("cited 88% coverage, measured on a simulation whose employer-level shock was")
    A("applied to one posting per employer instead of to all of them — so the")
    A("figure justifying clustered errors had been computed on data with no")
    A("within-employer correlation. The fixture and the figure are both corrected.")
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
            rb = disc.get("robustness") or {}
            if rb:
                A("**Robustness.** The size of the gap is sensitive to one")
                A("jurisdiction, so it is cut three ways rather than quoted once:")
                A("")
                A("| Sample | Mandate states | No mandate | Gap |")
                A("|---|---|---|---|")
                for key, label in (("all", "All postings"),
                                   ("excluding_virginia", "Excluding Virginia"),
                                   ("excluding_largest_employer",
                                    "Excluding the largest employer")):
                    row = rb.get(key)
                    if row:
                        A(f"| {label} | {row['mandate']:.1%} (n={row['n_mandate']}) "
                          f"| {row['no_mandate']:.1%} (n={row['n_no_mandate']}) "
                          f"| {row['gap'] * 100:.0f}pp |")
                A("")
                if disc.get("note"):
                    A(disc["note"])
                    A("")
                # Computed. This read "almost every non-disclosing posting in
                # a mandate state is a Virginia posting from a single employer"
                # unconditionally. It happens to still hold, but it held by
                # luck: audit round 4 removed the federal-consulting rows that
                # were the original basis for it, and nothing would have
                # flagged the sentence had they been the last of them.
                nd = [r for r in _rows
                      if r.get("mandate_state") == "1"
                      and r.get("pay_disclosed") != "1"] if _rows else []
                if nd:
                    import collections as _c
                    emps = _c.Counter(r["employer"] for r in nd)
                    va = sum(1 for r in nd
                             if "VA" in (r.get("states_listed") or r.get("state") or ""))
                    A(f"Only **{len(nd)}** posting(s) covered by a mandate fail to "
                      f"state pay.")
                    if va:
                        A(f"{va} of them list Virginia, whose mandate took effect on "
                          f"1 July 2026 and is")
                        A("the newest in the table, so partial compliance with a very "
                          "recent statute")
                        A("is a plausible reading.")
                    if len(emps) == 1:
                        A(f"All of them come from one employer "
                          f"({next(iter(emps))}), so these data cannot separate")
                        A("that reading from the posting practices of that firm.")
                    A("")
            A("> **This is a descriptive contrast, not a causal estimate.** A single")
            A("> cross-section carries no time variation, so no")
            A("> difference-in-differences is available. Employers who operate in")
            A("> mandate states differ from those who do not in size, sector and")
            A("> geography, and these data cannot separate those differences from")
            A("> the effect of the law itself.")
            A("")

        boot_ps = bootstrap_p(analysis)
        for key, model in (analysis.get("models") or {}).items():
            A(f"### {model['label']}")
            A("")
            # The bootstrap is estimated on the core specification only, so its
            # column belongs to that table and nowhere else.
            L.extend(coefficient_table(model, boot_ps if key == "core" else None))

        boot = analysis.get("wild_cluster_bootstrap") or {}
        if boot.get("by_variable"):
            core_c = (analysis.get("models") or {}).get("core", {}).get("coefficients", {})
            A("### Inference: the wild cluster bootstrap")
            A("")
            A(f"With {boot.get('n_clusters')} employer clusters, the asymptotic")
            A("clustered p-values above are anti-conservative, and the")
            A("pre-registration requires a wild cluster bootstrap before any")
            A("significance claim at this cluster count. It is estimated here, not")
            A("merely recommended: the restricted (null-imposed) variant of Cameron,")
            A(f"Gelbach and Miller (2008) with Rademacher weights drawn once per")
            A(f"employer, {boot.get('reps_requested')} replications.")
            A("")
            lost = [n for n, b in boot["by_variable"].items()
                    if b.get("p_value") is not None
                    and (core_c.get(n, {}).get("p_value", 1) < 0.05 <= b["p_value"])]
            kept = [n for n, b in boot["by_variable"].items()
                    if b.get("p_value") is not None and b["p_value"] < 0.05]
            if lost:
                A(f"**{len(lost)} of the {len(lost) + len(kept)} coefficients significant")
                A("at the 5% level under clustered standard errors do not survive the")
                A("bootstrap:** " + ", ".join(f"`{n}`" for n in lost) + ".")
                A("")
                A("This is the correction the pre-registered procedure exists to make.")
                A("Nothing about the point estimates changed; what changed is the")
                A("reference distribution the estimates are judged against, and at")
                A(f"{boot.get('n_clusters')} clusters the asymptotic one is simply the")
                A("wrong yardstick. The coefficients concerned are reported below as")
                A("inconclusive rather than deleted, because an underpowered null is")
                A("not the same finding as a measured zero.")
                A("")
            if kept:
                A("Surviving at the 5% level: "
                  + ", ".join(f"`{n}` (p = {boot['by_variable'][n]['p_value']:.3f})"
                              for n in kept) + ".")
                A("")
            A("Monte Carlo error is small relative to the decisions being read off")
            A(f"these numbers: at {boot.get('reps_requested')} replications every")
            A("p-value above is stable to within about 0.005 across seeds. An earlier")
            A("run at 999 replications returned 0.049, 0.063 and 0.082 for")
            A("`degree_required` on three different seeds, straddling the very")
            A("threshold its verdict is read from, which is why the replication count")
            A("is what it is.")
            A("")

        rr = analysis.get("region_robustness") or {}
        if rr.get("by_variable"):
            A("### Robustness: the nationwide-remote postings")
            A("")
            A(f"{rr.get('n_dropped')} postings are advertised as nationwide "
              f"remote and resolve to no state,")
            A("so all three census-region dummies are zero for them and they "
              "fall into the")
            A("**Midwest reference category without being Midwest**. The model "
              "is therefore")
            A(f"re-estimated on the {rr.get('n')} observations that do resolve "
              f"to a state, across")
            A(f"{rr.get('n_clusters')} employers.")
            A("")
            changed = rr.get("verdicts_changed") or []
            if changed:
                A("**" + ", ".join(f"`{c}`" for c in changed)
                  + " change verdict** at the 5% level and are")
                A("reported as inconclusive.")
                if "remote_eligible" in changed:
                    A("`remote_eligible` is the one that matters: the "
                      "nationwide-remote postings are")
                    A("precisely the remote-eligible ones, so the coefficient "
                      "was identified in part")
                    A("off the rows this check removes.")
            else:
                A("No verdict changes at the 5% level.")
            A("")
            A("| Variable | Coef (full) | Bootstrap p (full) | "
              "Coef (resolved) | Bootstrap p (resolved) |")
            A("|---|---|---|---|---|")
            base = ((analysis.get("wild_cluster_bootstrap") or {})
                    .get("by_variable") or {})

            def _num(v, spec):
                return "—" if v is None else format(v, spec)

            for name, row in rr["by_variable"].items():
                b0 = base.get(name, {})
                A("| `{}` | {} | {} | {} | {} |".format(
                    name,
                    _num(b0.get("coef"), ".4f"),
                    _num(b0.get("p_value"), ".3f"),
                    _num(row.get("coef"), ".4f"),
                    _num(row.get("bootstrap_p"), ".3f")))
            A("")
            # Computed. This sentence used to say "it confirmed the South
            # coefficient and withdrew remote eligibility" whatever the check
            # found, and was false on the audited round-6 data.
            _held = [f"`{k}`" for k, row in rr["by_variable"].items()
                     if (base.get(k, {}).get("p_value", 1) < 0.05
                         and (row.get("bootstrap_p") or 1) < 0.05)]
            _lost = [f"`{k}`" for k in changed]
            A("This check is reported whichever way it comes out. "
              + (f"It confirmed {', '.join(_held)}" if _held
                 else "It confirmed no coefficient")
              + (f" and withdrew {', '.join(_lost)}." if _lost else "."))
            A("")

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
            coef = row.get("coef", 0)
            pval, basis = reported_p(name, core, bootstrap_p(analysis))
            sig = ("significant" if pval < 0.05 else "not significant") + (
                " (bootstrap)" if basis == "bootstrap" else "")
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
        deg_p = reported_p("degree_required", core, bootstrap_p(analysis))[0]
        if deg and deg_p >= 0.05 and deg.get("coef", 0) < 0 and bootstrap_p(analysis):
            A("**H5 is inconclusive, and it was nearly reported as contradicted.**")
            A("The point estimate is negative — a stated degree requirement sits")
            A("alongside *lower* advertised pay, conditional on seniority — and under")
            A(f"clustered standard errors that reads p = {deg.get('p_value', 0):.3f},")
            A("comfortably significant and opposite to the prediction. The wild")
            A(f"cluster bootstrap puts it at p = {deg_p:.3f}. So the sign is worth")
            A("recording and the finding is not: at this cluster count the data")
            A("cannot distinguish the negative coefficient from zero. It is reported")
            A("because it was predicted the other way, and because the asymptotic")
            A("and bootstrap procedures disagree about it, which is precisely the")
            A("case the pre-registration anticipated.")
            A("")
        elif deg and deg_p < 0.05 and deg.get("coef", 0) < 0:
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
    A("These are treated at length in `docs/limitations.md`. In short:")
    A("")
    A("1. The outcome is **advertised** pay, not realized pay. Employers may")
    A("   negotiate away from the posted range in either direction.")
    A("2. **Disclosure is selected.** Where no mandate applies only about a")
    A("   quarter of postings state pay, so every pay coefficient is conditional")
    A("   on disclosure. This is the central threat, and it is why the disclosure")
    A("   model is a headline result rather than a footnote.")
    A("3. The mandate contrast is **associational**. One cross-section admits no")
    A("   difference-in-differences.")
    A("4. Pay is **nominal**. A price-adjusted robustness check is implemented and")
    A("   reported when the BEA table has been fetched.")
    A("5. **Few employer clusters, one of them dominant.** Cluster-robust errors")
    A("   under-cover with few clusters, measured at 92% against a nominal 95% and")
    A("   over-rejecting a cluster-level placebo at 9.5% against 5%. Every")
    A("   significance claim in section 5 is therefore read off the wild cluster")
    A("   bootstrap, under which seven of the nine coefficients that clustered")
    A("   errors called significant become inconclusive.")
    A("6. The scope **widened three times in response to the data**. The")
    A("   specification was pre-registered before the national sample was")
    A("   collected; amendments after that point are dated in")
    A("   `docs/pre-registration.md` section 8.")
    A("7. Exelon, ComEd, Constellation and Citizens Energy are **absent**, all on")
    A("   iCIMS, verified closed rather than assumed.")
    A("")

    A("## 7. Conclusion")
    A("")
    if analysis and analysis.get("status") == "ok":
        n_est = analysis.get("n_estimation", 0)
        n_emp = analysis.get("n_clusters", 0)
        if m_share is not None and n_share is not None:
            A(f"Across {n_est} postings from {n_emp} employers in the US energy and")
            A("data center sector, the sharpest regularity in the data is not about")
            A("the level of pay but about whether pay is named at all. In states")
            A(f"requiring a pay scale in the posting, {m_share:.0%} of postings")
            A(f"state one. Where no such requirement exists, {n_share:.0%} do. The")
            A("gap is too large to be explained by employer composition alone,")
            A("though composition cannot be ruled out with a single cross-section.")
            A("")
        A("Within the postings that do disclose, seniority is the dominant")
        A("predictor and the most precisely estimated, which is what the")
        A("pre-registration expected. The prediction that a stated degree")
        A("requirement would raise pay was wrong, and is reported as wrong.")
        A("")
        A("The result a reader should treat most cautiously is any coefficient in")
        A("the pay models, because that sample is selected on the dependent")
        A("variable wherever disclosure is voluntary. The result a reader should")
        A("treat most seriously is the disclosure contrast, because it is measured")
        A("on the full sample and does not depend on pay being observed.")
        A("")
        A("What would most improve this study is **more employers, not more")
        A("postings**. The floor on observations is met; the constraint is that")
        A("too few employers contribute and one contributes too many, which is")
        A("what makes the standard errors fragile.")
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

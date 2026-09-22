"""Cross-artifact consistency: the deliverables must agree with each other.

Every other suite tests a function. This one tests the thing a reader actually
sees — that the paper, the codebook, the dataset and the model output tell the
same story. Two failures this session were invisible to unit tests and would
have been caught here:

  * run 21 committed a selection_funnel.json whose own totals disagreed with
    its own postings.csv, because the workflow merged derived artifacts;
  * `yrs_exp_stated` sat in the fitted model while absent from the codebook,
    so a reader could not look up the variable doing the imputation work.

It also guards the honesty properties that are easy to remove by accident and
costly to remove silently: the interpretability block, the non-causal label on
the mandate contrast, and the contradicted hypothesis.

Skips cleanly when the artifacts have not been built.
"""
import csv, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
ANALYSIS = ROOT / "data" / "analysis"


def run():
    need = [ANALYSIS / "analysis.json", ANALYSIS / "selection_funnel.json",
            ANALYSIS / "postings.csv", ROOT / "paper" / "paper.md",
            ROOT / "docs" / "codebook.md"]
    missing = [p.name for p in need if not p.exists()]
    if missing:
        print(f"consistency: skipped (not built: {', '.join(missing)})")
        return 0

    a = json.loads((ANALYSIS / "analysis.json").read_text())
    f = json.loads((ANALYSIS / "selection_funnel.json").read_text())
    rows = list(csv.DictReader((ANALYSIS / "postings.csv").open()))
    disc = [r for r in rows if r["pay_disclosed"] == "1"]
    paper = (ROOT / "paper" / "paper.md").read_text()
    codebook = (ROOT / "docs" / "codebook.md").read_text()

    fails, n = [], 0

    def chk(name, ok, detail=""):
        nonlocal n
        n += 1
        if not ok:
            fails.append(f"{name}{': ' + detail if detail else ''}")

    # 1-4. The four totals that disagreed in run 21's commit.
    chk("CSV rows == funnel unique_in_scope",
        len(rows) == f["funnel"]["unique_in_scope"],
        f"{len(rows)} vs {f['funnel']['unique_in_scope']}")
    chk("CSV disclosed == funnel usable_with_pay",
        len(disc) == f["funnel"]["usable_with_pay"],
        f"{len(disc)} vs {f['funnel']['usable_with_pay']}")
    chk("by_employer sums to usable_with_pay",
        sum(f["usable_by_employer"].values()) == f["funnel"]["usable_with_pay"])
    chk("by_metro sums to usable_with_pay",
        sum(f["usable_by_metro"].values()) == f["funnel"]["usable_with_pay"])

    # 5-6. The model must describe the dataset it was fitted on.
    if a.get("status") == "ok":
        chk("analysis n_estimation == CSV disclosed rows",
            a["n_estimation"] == len(disc), f"{a['n_estimation']} vs {len(disc)}")
        chk("analysis n_clusters == distinct employers with pay",
            a["n_clusters"] == len({r["employer"] for r in disc}))

        # 7. No number in the paper is hand-entered, so the headline figures
        # must be findable in it verbatim.
        chk("paper quotes the estimation N", str(a["n_estimation"]) in paper)
        rb = (a.get("disclosure") or {}).get("robustness", {}).get("all")
        if rb:
            chk("paper quotes the disclosure shares",
                f"{rb['mandate']:.1%}" in paper and f"{rb['no_mandate']:.1%}" in paper)

        # 8-11. Honesty properties. Each is one edit away from disappearing and
        # none would fail a unit test.
        chk("interpretability block present exactly when conditions fail",
            (not a["interpretable"]) == ("Not yet interpretable" in paper))
        chk("mandate contrast labelled non-causal",
            "not a causal estimate" in paper or "descriptive contrast" in paper)
        chk("price adjustment reported as unavailable when absent",
            a.get("price_adjustment", {}).get("available")
            or "Not available" in paper)

        # 12. Every fitted regressor must be documented. Categorical dummies
        # are generated from a documented parent, so they are exempt.
        coefs = [c for c in a["models"]["core"]["coefficients"] if c != "const"]
        undocumented = [c for c in coefs if f"`{c}`" not in codebook
                        and not c.startswith(("region_", "industry_",
                                              "family_", "metro_"))]
        chk("every core regressor appears in the codebook",
            not undocumented, str(undocumented))

    # 13. The paper must be finished, not a draft.
    chk("paper carries no TODO markers", "TODO" not in paper)

    # --- 14-19. Added 2026-09-22, each pinning a defect found by reading the
    # real artifacts rather than by any test failing.

    # 14. `distinct_employers` must describe the ESTIMATION sample. It counted
    # the whole in-scope corpus, so results.md and the deck reported 30
    # employers beside 137 estimation rows when the cluster count was 23 --
    # which is exactly the pre-registered target, shown as met while failing.
    chk("distinct_employers equals the cluster count",
        a.get("distinct_employers") == a.get("n_clusters"),
        f"distinct_employers={a.get('distinct_employers')} "
        f"n_clusters={a.get('n_clusters')}")
    chk("distinct_employers equals employers among disclosed rows",
        a.get("distinct_employers") == len({r["employer"] for r in disc}))

    # 15. results.md must not print a bare employer count that reads as the
    # cluster count while describing the wider corpus.
    results_md = ANALYSIS / "results.md"
    if results_md.exists():
        rmd = results_md.read_text()
        chk("results.md labels which sample each employer count describes",
            "estimation sample" in rmd and "all postings in scope" in rmd)

    # 16. The bootstrap is REQUIRED by pre-registration section 6 below 30
    # clusters. It was cited in eight places and never computed.
    gate = 30
    if a.get("n_clusters", gate) < gate:
        boot = a.get("wild_cluster_bootstrap") or {}
        chk("wild cluster bootstrap ran (pre-registration requires it "
            f"below {gate} clusters)", bool(boot.get("by_variable")))
        if boot.get("by_variable"):
            core = a["models"]["core"]["coefficients"]
            fitted = [c for c in core if c != "const"]
            chk("bootstrap covers every fitted core regressor",
                set(boot["by_variable"]) == set(fitted),
                str(set(fitted) ^ set(boot["by_variable"])))
            # 17. No bootstrap p may be exactly 0: the observed statistic is
            # itself a draw from the null, so (extreme + 1) / (reps + 1).
            chk("no bootstrap p-value is exactly zero",
                all(v["p_value"] != 0.0 for v in boot["by_variable"].values()
                    if v.get("p_value") is not None))
            # 18. The paper must REPORT the bootstrap, not just cite it. Seven
            # of nine clustered-significant coefficients do not survive here,
            # so a paper that quietly kept reading the clustered column would
            # be making claims its own pre-registered procedure rejects.
            chk("paper reports the bootstrap p-values",
                "Bootstrap p" in paper or "bootstrap p" in paper)
            overturned = [nm for nm, b in boot["by_variable"].items()
                          if b.get("p_value") is not None
                          and core.get(nm, {}).get("p_value", 1) < 0.05
                          <= b["p_value"]]
            chk("paper names the coefficients the bootstrap overturns",
                not overturned
                or all(f"`{nm}`" in paper for nm in overturned),
                str([nm for nm in overturned if f"`{nm}`" not in paper]))

    # 18b. The executive summary is the page a reader who reads nothing else
    # takes away, and this project has already shipped one that named
    # predictors which were not significant. It must agree with the model.
    es_path = ROOT / "docs" / "executive-summary.md"
    if es_path.exists():
        es = es_path.read_text()
        chk("executive summary quotes the estimation N",
            str(a["n_estimation"]) in es)
        chk("executive summary quotes the cluster count",
            str(a["n_clusters"]) in es)
        chk("executive summary labels the mandate contrast non-causal",
            "associational, not causal" in es)
        boot_es = (a.get("wild_cluster_bootstrap") or {}).get("by_variable") or {}
        if boot_es:
            core_es = a["models"]["core"]["coefficients"]
            # It must not name, as a predictor, anything the bootstrap cannot
            # distinguish from zero. Checked via the pretty labels the
            # generator uses, since that is what a reader actually sees.
            labels = {
                "seniority_rank": "seniority",
                "skill_ml_ai": "a stated ML or AI skill",
                "industry_data_center": "being a data center operator",
                "degree_required": "a required degree",
            }
            named_wrongly = [
                n for n, lab in labels.items()
                if n in boot_es and boot_es[n].get("p_value") is not None
                and boot_es[n]["p_value"] >= 0.05
                and f"| {lab} |" in es
            ]
            chk("executive summary names no predictor the bootstrap rejects",
                not named_wrongly, str(named_wrongly))

    # 19. The coverage figure offered as evidence for clustering must be the
    # measured one. 88% was computed on a fixture whose employer shock reached
    # one posting per employer, i.e. on data with no within-employer
    # correlation -- so the justification for clustering had been measured
    # where clustering does not bind.
    limitations = ROOT / "docs" / "limitations.md"
    if limitations.exists():
        lim = limitations.read_text()
        stale = [d for d in ("88-90%", "88\u201390%") if d in lim or d in paper]
        chk("no stale cluster-coverage figure in paper or limitations",
            not stale, str(stale))

    print(f"consistency: {n - len(fails)}/{n} checks passed")
    for x in fails:
        print("  FAIL", x)
    return len(fails)


if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

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

    print(f"consistency: {n - len(fails)}/{n} checks passed")
    for x in fails:
        print("  FAIL", x)
    return len(fails)


if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

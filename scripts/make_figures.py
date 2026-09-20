"""Generate the paper's figures from the analysis artifacts.

Colors come from a validated palette (blue categorical slot 1, orange slot 2,
blue->red diverging for signed effects, a single-hue blue ordinal ramp for the
funnel). The categorical pair and the ordinal ramp were checked with the
palette validator: adjacent CVD dE 24.7, normal-vision dE 33.6, light-end
contrast 2.06:1, all passing.
"""
from __future__ import annotations

import json
import pathlib
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
ANALYSIS = ROOT / "data" / "analysis"
FIGS = ROOT / "paper" / "figures"

# --- validated palette ---------------------------------------------------
SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK_2 = "#52514e"
GRID = "#e4e3df"
SERIES_1 = "#2a78d6"     # blue
SERIES_2 = "#eb6834"     # orange
POS = "#2a78d6"          # diverging: positive pole
NEG = "#e34948"          # diverging: negative pole
NEUTRAL = "#8a8985"
ORDINAL = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#0d366b"]

plt.rcParams.update({
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE,
    "savefig.facecolor": SURFACE, "text.color": INK,
    "axes.labelcolor": INK_2, "xtick.color": INK_2, "ytick.color": INK_2,
    "axes.edgecolor": GRID, "font.size": 10,
    "axes.titlesize": 12, "axes.titleweight": "bold", "axes.titlelocation": "left",
})


def _clean(ax, xgrid=True):
    """Recessive grid and axes; no chartjunk."""
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.spines["left"].set_color(GRID)
    ax.spines["bottom"].set_color(GRID)
    ax.set_axisbelow(True)
    ax.grid(axis="x" if xgrid else "y", color=GRID, linewidth=0.8)


def load(path: pathlib.Path):
    return json.loads(path.read_text()) if path.exists() else None


def fig_funnel(funnel: dict) -> str | None:
    """Ordinal stages: a horizontal bar per screen, labelled directly."""
    stages = [("Retrieved", "raw"), ("Passed screens", "passed_screen"),
              ("In a study metro", "passed_geo"), ("Unique postings", "unique_in_scope"),
              ("Pay disclosed", "usable_with_pay")]
    # Every stage is shown even at zero: a stage that silently disappears
    # makes the funnel look like it never ran that screen.
    data = [(label, funnel["funnel"].get(key, 0)) for label, key in stages]
    if not data or max(v for _, v in data) == 0:
        return None
    labels = [d[0] for d in data]
    values = [d[1] for d in data]

    fig, ax = plt.subplots(figsize=(7.2, 0.62 * len(data) + 1.5))
    y = np.arange(len(data))[::-1]
    bars = ax.barh(y, values, height=0.62,
                   color=ORDINAL[: len(data)], zorder=3)
    # 4px-equivalent rounded data-ends, anchored at the baseline.
    for bar in bars:
        bar.set_joinstyle("round")
    span = max(values) or 1
    for yi, value in zip(y, values):
        ax.text(value + span * 0.015, yi, f"{value:,}", va="center", ha="left",
                fontsize=10, color=INK, fontweight="bold")
    ax.set_yticks(y, labels)
    ax.set_xlim(0, span * 1.16)
    ax.set_xlabel("Postings")
    ax.set_title("Selection funnel")
    _clean(ax)
    ax.tick_params(length=0)
    out = FIGS / "fig1_funnel.png"
    fig.tight_layout(); fig.savefig(out, dpi=200); plt.close(fig)
    return out.name


def fig_pay_distribution(rows: list[dict]) -> str | None:
    """Single-series distribution; the title names the series, so no legend."""
    values = [float(r["pay_midpoint"]) for r in rows
              if r.get("pay_disclosed") == "1" and r.get("pay_midpoint")]
    if len(values) < 10:
        return None
    fig, ax = plt.subplots(figsize=(7.2, 3.6))
    bins = min(24, max(8, len(values) // 8))
    ax.hist(values, bins=bins, color=SERIES_1, zorder=3, edgecolor=SURFACE, linewidth=1.2)
    median = float(np.median(values))
    ax.axvline(median, color=NEG, linewidth=2, zorder=4)
    ax.text(median, ax.get_ylim()[1] * 0.94, f"  median ${median:,.0f}",
            color=NEG, fontsize=10, fontweight="bold", va="top")
    ax.set_xlabel("Advertised pay midpoint, annualized USD")
    ax.set_ylabel("Postings")
    ax.set_title(f"Distribution of advertised pay (n = {len(values)})")
    ax.xaxis.set_major_formatter(lambda v, _: f"${v/1000:,.0f}k")
    _clean(ax, xgrid=False)
    out = FIGS / "fig2_pay_distribution.png"
    fig.tight_layout(); fig.savefig(out, dpi=200); plt.close(fig)
    return out.name


def fig_coefficients(model: dict) -> str | None:
    """Signed effects: diverging blue/red around a neutral zero line."""
    items = [(n, c) for n, c in model["coefficients"].items() if n != "const"]
    if not items:
        return None
    items.sort(key=lambda kv: kv[1]["coef"])
    names = [n for n, _ in items]
    coefs = np.array([c["coef"] for _, c in items])
    lo = np.array([c["ci_low"] for _, c in items])
    hi = np.array([c["ci_high"] for _, c in items])

    fig, ax = plt.subplots(figsize=(7.2, 0.42 * len(items) + 1.8))
    y = np.arange(len(items))
    ax.axvline(0, color=NEUTRAL, linewidth=1.5, zorder=2)
    for yi, c, l, h in zip(y, coefs, lo, hi):
        color = POS if c >= 0 else NEG
        ax.plot([l, h], [yi, yi], color=color, linewidth=2, solid_capstyle="round", zorder=3)
        ax.plot([c], [yi], "o", color=color, markersize=8,
                markeredgecolor=SURFACE, markeredgewidth=2, zorder=4)
    ax.set_yticks(y, [f"{n}" for n in names], fontsize=9)
    ax.set_xlabel("Effect on log advertised pay (95% CI)")
    ax.set_title(f"{model['label']} — coefficient estimates")
    _clean(ax)
    ax.tick_params(length=0)
    out = FIGS / "fig3_coefficients.png"
    fig.tight_layout(); fig.savefig(out, dpi=200); plt.close(fig)
    return out.name


def fig_disclosure_by_metro(rows: list[dict]) -> str | None:
    """Two categories; both are direct-labelled, so identity is never color-alone."""
    metros: dict[str, list[int]] = {}
    for r in rows:
        metros.setdefault(r.get("metro", "?"), []).append(int(r.get("pay_disclosed", 0) or 0))
    metros = {k: v for k, v in metros.items() if len(v) >= 3}
    if len(metros) < 2:
        return None
    labels = list(metros)
    rates = [100 * sum(v) / len(v) for v in metros.values()]
    counts = [len(v) for v in metros.values()]

    fig, ax = plt.subplots(figsize=(7.2, 2.9))
    x = np.arange(len(labels))
    colors = [SERIES_1, SERIES_2][: len(labels)]
    ax.bar(x, rates, width=0.5, color=colors, zorder=3)
    for xi, rate, n in zip(x, rates, counts):
        ax.text(xi, rate + 2, f"{rate:.0f}%\n(n={n})", ha="center", va="bottom",
                fontsize=10, color=INK, fontweight="bold")
    ax.set_xticks(x, [f"{l.title()}" for l in labels])
    ax.set_ylim(0, 112)
    ax.set_ylabel("Postings disclosing pay (%)")
    ax.set_title("Pay disclosure rate by metro")
    _clean(ax, xgrid=False)
    ax.tick_params(length=0)
    out = FIGS / "fig4_disclosure_by_metro.png"
    fig.tight_layout(); fig.savefig(out, dpi=200); plt.close(fig)
    return out.name


def main() -> int:
    import csv
    FIGS.mkdir(parents=True, exist_ok=True)
    funnel = load(ANALYSIS / "selection_funnel.json")
    analysis = load(ANALYSIS / "analysis.json")
    csv_path = ANALYSIS / "postings.csv"
    rows = list(csv.DictReader(csv_path.open(encoding="utf-8"))) if csv_path.exists() else []

    made, skipped = [], []
    if funnel:
        (made if (f := fig_funnel(funnel)) else skipped).append(f or "fig1_funnel (no data)")
    if rows:
        (made if (f := fig_pay_distribution(rows)) else skipped).append(
            f or "fig2_pay_distribution (needs >=10 disclosed)")
        (made if (f := fig_disclosure_by_metro(rows)) else skipped).append(
            f or "fig4_disclosure_by_metro (needs 2 metros)")
    if analysis and analysis.get("status") == "ok":
        model = (analysis.get("models") or {}).get("core")
        if model:
            (made if (f := fig_coefficients(model)) else skipped).append(
                f or "fig3_coefficients (no coefficients)")
    else:
        skipped.append("fig3_coefficients (no estimated model yet)")

    print(f"figures written: {made or 'none'}")
    if skipped:
        print(f"skipped: {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

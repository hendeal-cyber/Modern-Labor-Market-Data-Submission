"""Aggregate the tables the slide deck draws, so make_slides.js stays a layout.

Writes data/analysis/deck_data.json from the committed snapshots, the built
dataset and the config. Every number the deck shows is either here or in
analysis.json / selection_funnel.json; none is typed into the slide script.
The paper's audit table is read from paper/paper.md, which make_paper.py
generates from the audit log, so the deck and the paper cannot disagree.
"""
from __future__ import annotations

import collections
import datetime as dt
import inspect
import json
import pathlib
import re

import numpy as np
import pandas as pd
import yaml

from lmstudy.filters import is_early_career

ROOT = pathlib.Path(__file__).resolve().parents[1]
ANALYSIS = ROOT / "data" / "analysis"
RAW = ROOT / "data" / "raw"

# Display order and names for the sources. USAJOBS is the federal API, not an
# applicant tracking system, and is labelled as such.
PLATFORM_NAMES = {
    "workday": "Workday", "greenhouse": "Greenhouse", "ashby": "Ashby",
    "lever": "Lever", "workable": "Workable", "smartrecruiters": "SmartRecruiters",
    "recruitee": "Recruitee", "usajobs": "USAJOBS (federal)",
}


def in_window(scope: dict) -> list[pathlib.Path]:
    end = str((scope.get("study") or {}).get("collection_end") or "9999-12-31")
    return sorted(d for d in RAW.iterdir() if d.is_dir() and d.name <= end)


def platform_table(snapshots, postings: pd.DataFrame) -> list[dict]:
    raw, raw_emp = collections.Counter(), collections.defaultdict(set)
    for snap in snapshots:
        for path in sorted(snap.glob("*.json")):
            if path.name == "manifest.json":
                continue
            try:
                records = json.loads(path.read_text())
            except json.JSONDecodeError:
                continue
            for rec in records:
                plat = rec.get("platform") or "unknown"
                raw[plat] += 1
                raw_emp[plat].add(rec.get("employer"))
    rows = []
    for plat in sorted(set(raw) | set(postings.ats_platform),
                       key=lambda p: -raw.get(p, 0)):
        sub = postings[postings.ats_platform == plat]
        pay = sub[sub.pay_disclosed == 1]
        rows.append({"platform": plat, "label": PLATFORM_NAMES.get(plat, plat),
                     "employers_with_postings": len(raw_emp.get(plat, ())),
                     "raw": raw.get(plat, 0), "in_scope": len(sub),
                     "with_pay": len(pay), "employers_with_pay": pay.employer.nunique()})
    return rows


def audit_rounds() -> list[dict]:
    paper = (ROOT / "paper" / "paper.md").read_text()
    out = []
    for m in re.finditer(r"^\| (\d+) \| ([^|]+) \| ([^|]+) \|$", paper, re.M):
        out.append({"round": int(m.group(1)), "target": m.group(2).strip(),
                    "result": m.group(3).strip()})
    return out


def main() -> int:
    scope = yaml.safe_load((ROOT / "config" / "scope.yaml").read_text())
    postings = pd.read_csv(ANALYSIS / "postings.csv")
    pay = postings[postings.pay_disclosed == 1]
    snapshots = in_window(scope)

    manifest = json.loads((snapshots[-1] / "manifest.json").read_text())
    results = manifest.get("results") or []

    dates = {k: str(v) for k, v in (scope.get("pay_mandate_states") or {}).items()}

    bins = list(range(50_000, 400_001, 25_000))
    hist = pd.cut(pay.pay_midpoint, bins=bins, right=False).value_counts(sort=False)

    by_emp = (pay.groupby("employer")
              .agg(n=("url", "size"), industry=("industry", "first"))
              .reset_index().sort_values(["n", "employer"], ascending=[False, True]))

    region = {}
    for reg, sub in postings.groupby(postings.census_region.fillna("remote_national")):
        region[reg] = {"n": len(sub), "share_disclosed": round(sub.pay_disclosed.mean(), 4),
                       "n_mandate": int(sub.mandate_state.sum())}

    early = postings[(postings.early_career == 1)]
    example = pay[(pay.employer == "Invenergy") & (pay.title == "Analyst, Development")
                  & (pay.state == "IL")].head(1)

    data = {
        "built_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "snapshots": [s.name for s in snapshots],
        "frame": {"employers_attempted": manifest.get("employers_attempted"),
                  "boards_found_last_run": sum(1 for r in results if r.get("found")),
                  "last_run": manifest.get("run_date")},
        "platforms": platform_table(snapshots, postings),
        "industry_in_scope": postings.industry.value_counts().to_dict(),
        "industry_with_pay": pay.industry.value_counts().to_dict(),
        "employers_by_industry": pay.groupby("industry").employer.nunique().to_dict(),
        "role_in_scope": postings.role_family.value_counts().to_dict(),
        "role_with_pay": pay.role_family.value_counts().to_dict(),
        "state_with_pay": pay.state.value_counts().to_dict(),
        "state_in_scope": postings.state.value_counts().to_dict(),
        "no_state_with_pay": int(pay.state.isna().sum()),
        "region_with_pay": pay.census_region.value_counts().to_dict(),
        "region_disclosure": region,
        "employers_with_pay": by_emp.to_dict("records"),
        "mandate_dates": dates,
        "pay_hist": [{"lo": int(iv.left), "hi": int(iv.right), "n": int(n)}
                     for iv, n in hist.items()],
        "pay_stats": {"mean": round(pay.pay_midpoint.mean()), "median": round(pay.pay_midpoint.median()),
                      "sd": round(pay.pay_midpoint.std()), "min": round(pay.pay_midpoint.min()),
                      "max": round(pay.pay_midpoint.max())},
        # OLS passes through the means, so the predicted log pay at seniority
        # rank r, other regressors at their sample means, is
        # mean(ln pay) + b * (r - mean(rank)); make_slides.js applies b.
        "seniority_profile": {
            "mean_log_pay": round(float(np.log(pay.pay_midpoint).mean()), 6),
            "mean_rank": round(float(pay.seniority_rank.mean()), 6),
            "n_by_rank": {int(k): int(v) for k, v in pay.seniority_rank.value_counts().sort_index().items()},
            "label_by_rank": {int(k): str(v) for k, v in pay.groupby("seniority_rank").seniority_label.first().items()},
        },
        "early_career": {"in_scope": len(early), "with_pay": int(early.pay_disclosed.sum()),
                         "max_years": inspect.signature(is_early_career).parameters["max_years"].default,
                         "ranks_with_pay": {int(k): int(v) for k, v in early[early.pay_disclosed == 1]
                                            .seniority_rank.value_counts().sort_index().items()}},
        "multi_location_share": round((postings.n_locations > 1).mean(), 4),
        "example_posting": example[["employer", "title", "state", "pay_min", "pay_max", "url",
                                    "ats_platform"]].to_dict("records")[0] if len(example) else None,
        "audit_rounds": audit_rounds(),
    }
    (ANALYSIS / "deck_data.json").write_text(json.dumps(data, indent=1, default=int) + "\n")
    print(f"deck_data.json: {len(data['platforms'])} platforms, "
          f"{len(data['employers_with_pay'])} employers, {len(data['audit_rounds'])} audit rounds")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

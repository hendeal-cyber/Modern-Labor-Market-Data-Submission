"""Turn raw snapshots into the analysis dataset.

Emits data/analysis/postings.csv plus a selection funnel recording how many
postings were lost at each screen, so the sample can be described honestly
rather than reported as an unexplained final count.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import pathlib
import sys
from collections import Counter, defaultdict

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from lmstudy import geo, pay                                     # noqa: E402
from lmstudy.code_regressors import load_dictionary, code_posting  # noqa: E402
from lmstudy.filters import screen_all, extract_years            # noqa: E402


def dedupe_key(record: dict) -> str:
    """Same employer + same normalized title + same location = one job."""
    parts = [
        (record.get("employer") or "").lower().strip(),
        " ".join((record.get("title") or "").lower().split()),
        (record.get("location_raw") or "").lower().strip(),
    ]
    return hashlib.sha1("|".join(parts).encode()).hexdigest()[:16]


def text_hash(description: str) -> str:
    return hashlib.sha256((description or "").encode()).hexdigest()[:16]


def days_since(iso: str | None, today: dt.date) -> int | None:
    if not iso:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%f%z"):
        try:
            parsed = dt.datetime.strptime(iso[:26] if "." in iso else iso, fmt)
            return (today - parsed.date()).days
        except ValueError:
            continue
    try:
        return (today - dt.datetime.fromisoformat(iso.replace("Z", "+00:00")).date()).days
    except (ValueError, AttributeError):
        return None


def build(raw_root: pathlib.Path, out_dir: pathlib.Path, config_dir: pathlib.Path) -> dict:
    scope = yaml.safe_load((config_dir / "scope.yaml").read_text())
    dictionary = load_dictionary(config_dir / "regressors.yaml")
    gazetteer = geo.load_gazetteer(ROOT / "data" / "gazetteer.json")
    metros = {k: v for k, v in scope["metros"].items() if v.get("enabled") is not False}
    hours = scope["pay"]["hours_per_year"]
    today = dt.date.today()

    funnel = Counter()
    reject_reasons = Counter()
    rows: dict[str, dict] = {}
    first_seen: dict[str, str] = {}

    snapshot_dirs = sorted(d for d in raw_root.iterdir() if d.is_dir()) if raw_root.exists() else []
    for snapshot in snapshot_dirs:
        run_date = snapshot.name
        for path in sorted(snapshot.glob("*.json")):
            if path.name == "manifest.json":
                continue
            try:
                records = json.loads(path.read_text())
            except json.JSONDecodeError:
                continue
            for rec in records:
                funnel["raw"] += 1
                key = dedupe_key(rec)
                first_seen.setdefault(key, run_date)

                title = rec.get("title") or ""
                description = rec.get("description") or ""

                passed, reasons, detail = screen_all(title, description, scope)
                if not passed:
                    for reason in reasons:
                        reject_reasons[reason] += 1
                    funnel["rejected_screen"] += 1
                    continue
                funnel["passed_screen"] += 1

                place = geo.resolve(rec.get("location_raw") or "", metros, gazetteer, description)
                if not place.in_scope:
                    funnel["rejected_geo"] += 1
                    reject_reasons["out_of_metro"] += 1
                    continue
                funnel["passed_geo"] += 1

                money = pay.extract(
                    description,
                    rec.get("comp_min"),
                    rec.get("comp_max"),
                    rec.get("comp_interval"),
                    hours_per_year=hours,
                )
                coded = code_posting(title, description, dictionary)
                years_min, years_excerpt = extract_years(description)
                metro_spec = scope["metros"][place.metro]

                row = {
                    "posting_key": key,
                    "employer": rec.get("employer"),
                    "industry": rec.get("industry"),
                    "title": title,
                    "ats_platform": rec.get("platform"),
                    "url": rec.get("url"),
                    "metro": place.metro,
                    "tier": place.tier,
                    "state": place.state or metro_spec.get("state"),
                    "mandate_state": int(bool(metro_spec.get("pay_disclosure_mandate"))),
                    "distance_miles": place.distance_miles,
                    "work_arrangement": place.work_arrangement,
                    "remote_eligible": int(place.remote_eligible),
                    "posted_at": rec.get("posted_at"),
                    "posting_age_days": days_since(rec.get("posted_at"), today),
                    "first_seen_run": first_seen[key],
                    "last_seen_run": run_date,
                    "yrs_exp_min": years_min if years_min is not None else "",
                    "yrs_exp_excerpt": years_excerpt or "",
                    "pay_disclosed": int(money.disclosed),
                    "pay_min": money.pay_min if money.pay_min is not None else "",
                    "pay_max": money.pay_max if money.pay_max is not None else "",
                    "pay_midpoint": money.midpoint if money.midpoint is not None else "",
                    "pay_range_width": (
                        money.pay_max - money.pay_min
                        if money.pay_max is not None and money.pay_min is not None
                        else ""
                    ),
                    "pay_source": money.source or "",
                    "pay_unit_original": money.unit_original or "",
                    "hourly_original": int(money.hourly_original),
                    "pay_single_figure": int(money.single_figure),
                    "pay_excerpt": (money.raw_excerpt or "")[:120],
                    "description_hash": text_hash(description),
                    "description_chars": len(description),
                }
                row.update(coded.values)
                # A repeat sighting refreshes last_seen but keeps first_seen.
                if key in rows:
                    rows[key]["last_seen_run"] = run_date
                    funnel["duplicate_sighting"] += 1
                else:
                    rows[key] = row

    out_dir.mkdir(parents=True, exist_ok=True)
    unique = list(rows.values())
    funnel["unique_in_scope"] = len(unique)
    funnel["usable_with_pay"] = sum(1 for r in unique if r["pay_disclosed"] == 1)

    by_metro = Counter(r["metro"] for r in unique if r["pay_disclosed"] == 1)
    by_employer = Counter(r["employer"] for r in unique if r["pay_disclosed"] == 1)

    if unique:
        fieldnames = list(unique[0].keys())
        with (out_dir / "postings.csv").open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(unique)

    report = {
        "built_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "snapshots": [d.name for d in snapshot_dirs],
        "funnel": dict(funnel),
        "rejection_reasons": dict(reject_reasons.most_common()),
        "usable_by_metro": dict(by_metro),
        "usable_by_employer": dict(by_employer.most_common()),
        "distinct_employers_with_pay": len(by_employer),
        "min_usable_n": scope["study"]["min_usable_n"],
        "floor_met": funnel["usable_with_pay"] >= scope["study"]["min_usable_n"],
    }
    (out_dir / "selection_funnel.json").write_text(json.dumps(report, indent=2))
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the analysis dataset from raw snapshots.")
    parser.add_argument("--raw", default=str(ROOT / "data" / "raw"))
    parser.add_argument("--out", default=str(ROOT / "data" / "analysis"))
    parser.add_argument("--config", default=str(ROOT / "config"))
    args = parser.parse_args()

    report = build(pathlib.Path(args.raw), pathlib.Path(args.out), pathlib.Path(args.config))
    print(json.dumps(report["funnel"], indent=2))
    print(f"\nusable observations (in scope, pay disclosed): {report['funnel'].get('usable_with_pay', 0)}")
    print(f"distinct employers with pay: {report['distinct_employers_with_pay']}")
    print(f"floor of {report['min_usable_n']} met: {report['floor_met']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

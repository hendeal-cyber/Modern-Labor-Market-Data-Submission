"""Measure what each candidate scope would actually yield.

Reads the probe collection (every in-metro posting, regardless of role) and
runs each candidate role taxonomy through the full screening chain, reporting
usable N at every stage. The point is to replace an estimate with a count, so
the scope decision rests on evidence.

This reports. It does not change the study's scope; that stays in
config/scope.yaml and is the user's call.
"""
from __future__ import annotations

import copy
import glob
import json
import pathlib
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lmstudy import geo, pay                              # noqa: E402
from lmstudy.filters import screen_all                    # noqa: E402

# Candidate role taxonomies, each a superset of the one before.
OPTIONS: dict[str, list[str]] = {
    "A. software/data/analytics (current)": [],
    "B. + IT, systems, cloud, devops": [
        "systems engineer", "systems analyst", "it analyst", "it engineer",
        "cloud engineer", "devops", "site reliability", "infrastructure engineer",
        "systems administrator", "database administrator",
    ],
    "C. + network and cybersecurity": [
        "network engineer", "network analyst", "network operations",
        "security engineer", "security analyst", "cybersecurity", "cyber security",
        "information security", "nerc cip", "compliance analyst",
    ],
    "D. + engineering (electrical, thermal, controls, GIS)": [
        "electrical engineer", "power engineer", "thermal engineer",
        "controls engineer", "automation engineer", "scada", "substation engineer",
        "design engineer", "project engineer", "field engineer", "gis",
        "engineering analyst", "process engineer", "mechanical engineer",
        "commissioning engineer", "reliability engineer",
    ],
    "E. all technical and professional roles": ["*"],
}

# These exclusions are lifted as the taxonomy widens, in the same order.
LIFT_EXCLUSIONS = {
    "B. + IT, systems, cloud, devops": ["it support", "systems administrator"],
    "C. + network and cybersecurity": ["network engineer", "network operations",
                                       "noc", "security analyst", "cybersecurity"],
    "D. + engineering (electrical, thermal, controls, GIS)": [
        "electrical engineer", "power engineer", "substation", "relay"],
    "E. all technical and professional roles": None,   # drop every exclusion
}


def load_probe(subdir: str = "probe") -> list[dict]:
    records, seen = [], set()
    for path in sorted(glob.glob(str(ROOT / "data" / subdir / "*" / "*.json"))):
        name = pathlib.Path(path).name
        if name.startswith("_") or name == "manifest.json":
            continue
        try:
            for rec in json.loads(pathlib.Path(path).read_text()):
                key = f"{rec.get('employer')}|{rec.get('title')}|{rec.get('location_raw')}"
                if key in seen:
                    continue
                seen.add(key)
                records.append(rec)
        except json.JSONDecodeError:
            continue
    return records


def scope_for(option: str, base: dict) -> dict:
    scope = copy.deepcopy(base)
    extra = OPTIONS[option]
    if extra == ["*"]:
        scope["roles"]["include_any"] = ["*"]
        scope["roles"]["exclude_any"] = []
        return scope
    cumulative: list[str] = []
    for name in OPTIONS:
        cumulative += [t for t in OPTIONS[name] if t != "*"]
        lift = LIFT_EXCLUSIONS.get(name)
        if lift is None and name in LIFT_EXCLUSIONS:
            scope["roles"]["exclude_any"] = []
        elif lift:
            scope["roles"]["exclude_any"] = [
                e for e in scope["roles"]["exclude_any"] if e not in lift]
        if name == option:
            break
    scope["roles"]["include_any"] = list(scope["roles"]["include_any"]) + cumulative
    return scope


def evaluate(records: list[dict], scope: dict, gazetteer: dict) -> dict:
    metros = {k: v for k, v in scope["metros"].items() if v.get("enabled") is not False}
    hours = scope["pay"]["hours_per_year"]
    wildcard = scope["roles"]["include_any"] == ["*"]

    stage = {"probe_postings": len(records), "role_ok": 0, "all_screens_ok": 0,
             "in_metro": 0, "pay_disclosed": 0}
    for rec in records:
        title = rec.get("title") or ""
        description = rec.get("description") or ""
        # The wildcard option lifts the ROLE screen only. Early-career,
        # seniority and internship screening still apply — skipping them would
        # count senior staff, directors and interns as usable observations and
        # badly overstate the option's yield.
        if wildcard:
            reasons = [r for r in screen_all(title, description, scope)[1]
                       if r not in ("role_not_software_data", "role_excluded")]
            passed = not reasons
        else:
            passed, _, _ = screen_all(title, description, scope)
        if not passed:
            continue
        stage["all_screens_ok"] += 1
        place = geo.resolve(rec.get("location_raw") or "", metros, gazetteer, description)
        if not place.in_scope:
            continue
        stage["in_metro"] += 1
        money = pay.extract(description, rec.get("comp_min"), rec.get("comp_max"),
                            rec.get("comp_interval"), hours_per_year=hours)
        if money.usable:
            stage["pay_disclosed"] += 1
    return stage


def main() -> int:
    tier3 = "--tier3" in sys.argv
    records = load_probe("probe_tier3" if tier3 else "probe")
    if not records:
        print("No probe data. Run: python src/lmstudy/collect/run.py --probe --no-slugs")
        return 1
    base = yaml.safe_load((ROOT / "config" / "scope.yaml").read_text())
    if tier3:
        for spec in base["metros"].values():
            if spec.get("tier") == 3:
                spec["enabled"] = True
        print("Evaluating WITH Tier 3 metros enabled\n")
    gazetteer = geo.load_gazetteer(ROOT / "data" / "gazetteer.json")
    floor = base["study"]["min_usable_n"]

    print(f"Probe corpus: {len(records)} in-metro postings with descriptions\n")
    print(f"{'option':52} {'screens':>8} {'in metro':>9} {'usable':>7}  floor")
    print("-" * 88)
    results = {}
    for option in OPTIONS:
        scope = scope_for(option, base)
        stage = evaluate(records, scope, gazetteer)
        results[option] = stage
        met = "MET" if stage["pay_disclosed"] >= floor else f"{stage['pay_disclosed']}/{floor}"
        print(f"{option:52} {stage['all_screens_ok']:8} {stage['in_metro']:9} "
              f"{stage['pay_disclosed']:7}  {met}")

    out = ROOT / "data" / "analysis" / (
        "scope_probe_tier3.json" if tier3 else "scope_probe.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"floor": floor, "corpus": len(records),
                               "options": results}, indent=2))
    print(f"\nwritten to {out}")
    print("\nThese are counts from one collection cycle. Weekly flow adds to them.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

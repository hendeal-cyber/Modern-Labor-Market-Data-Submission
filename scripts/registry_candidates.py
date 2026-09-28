#!/usr/bin/env python3
"""Route 1: turn fetched registry pages into a candidate list of employers.

Reads the page text saved by fetch_registries.py (data/registry/raw/) and
writes data/registry/state_rto_candidates.csv: one row per distinct company,
with the registry and the source URL it came from, and whether it is already
in the frame (normalised-name match, as elsewhere). PJM members are collapsed
to their parent company, because the parent is the employer: a solar LLC per
project is not a place anyone works.

Nothing here is evidence of a job board. A candidate still needs a live job
URL on a supported ATS before it can enter config/employers.yaml.

    python scripts/registry_candidates.py
"""
from __future__ import annotations

import collections
import csv
import importlib.util
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "registry" / "raw"
OUT = ROOT / "data" / "registry" / "state_rto_candidates.csv"

_spec = importlib.util.spec_from_file_location("fetch_registries", ROOT / "scripts" / "fetch_registries.py")
reg = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(reg)

MEMBERSHIP = {"Voting Member", "Affiliate Member", "Associate", "Ex Officio Voting Member",
              "Ex-Officio Voting Member", "Emergency Load Program Member"}
SECTORS = {"Generation Owner", "Other Supplier", "Transmission Owner", "Electric Distributor",
           "End-Use Customer", "None"}


def source_url(text: str) -> str:
    m = re.match(r"# source: (\S+)", text)
    return m.group(1) if m else ""


def parse_pjm(text: str) -> list[dict]:
    """(member, parent, sector) from PJM's member list, as saved to text.

    The page lists each member as four lines: membership type, member name,
    parent company (or "Not applicable"), sector.
    """
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    out = []
    for i, ln in enumerate(lines[:-3]):
        if ln in MEMBERSHIP and lines[i + 3] in SECTORS:
            name, parent, sector = lines[i + 1], lines[i + 2], lines[i + 3]
            if parent in ("Not applicable", ""):
                parent = name
            out.append({"member": name, "parent": parent, "sector": sector, "membership": ln})
    return out


def parse_tx_reps(text: str) -> list[str]:
    """Retail electric provider names from the PUCT alphabetical directory:
    a certificate number line, then the name (an asterisk marks a d/b/a)."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    names = []
    for i, ln in enumerate(lines[:-1]):
        if re.fullmatch(r"1\d{4}", ln) and not re.fullmatch(r"1\d{4}|\*", lines[i + 1]):
            names.append(lines[i + 1])
    return names


def rank_eia(names: set[str]) -> None:
    """Route 2: EIA-861 utilities (by retail customers) and EIA-860 operators
    (by operable MW) missing from the frame, utilities in mandate states
    first, into data/registry/eia_ranked_missing.csv."""
    import sys
    import yaml
    sys.path.insert(0, str(ROOT / "src"))
    from lmstudy.build_dataset import mandate_effective_dates, mandates_in_force
    scope = yaml.safe_load((ROOT / "config" / "scope.yaml").read_text())
    mandate = set(mandates_in_force(mandate_effective_dates(scope), "2026-09-30"))
    out = []
    for fname, size_col, source in (("eia861_utilities.csv", "customers", "EIA-861"),
                                    ("eia860_owners.csv", "nameplate_mw", "EIA-860")):
        path = ROOT / "data" / "registry" / fname
        if not path.exists():
            continue
        for row in csv.DictReader(path.open()):
            if reg.in_frame(row["name"], names):
                continue
            states = set(row["states"].split())
            out.append({"source": source, "name": row["name"], "states": row["states"],
                        "ownership": row.get("ownership", ""),
                        "size": row[size_col], "size_unit": size_col,
                        "mandate_state": bool(states & mandate)})
    out.sort(key=lambda r: (r["source"], not r["mandate_state"], -float(r["size"] or 0)))
    reg.write_csv(ROOT / "data" / "registry" / "eia_ranked_missing.csv", out,
                  ["source", "name", "states", "ownership", "size", "size_unit", "mandate_state"])
    print(f"{len(out)} EIA entities outside the frame -> eia_ranked_missing.csv")


def main() -> int:
    names, _ = reg.frame_index()
    rows: dict[str, dict] = {}

    def add(name: str, registry: str, url: str, detail: str) -> None:
        key = reg.norm_name(name)
        if not key:
            return
        row = rows.setdefault(key, {"name": name, "registries": set(), "source_urls": set(),
                                    "detail": collections.Counter()})
        row["registries"].add(registry)
        row["source_urls"].add(url)
        row["detail"][detail] += 1

    p = RAW / "pjm_members.txt"
    if p.exists():
        text = p.read_text()
        for m in parse_pjm(text):
            add(m["parent"], "PJM member list", source_url(text), m["sector"])
    p = RAW / "tx_puct_reps.txt"
    if p.exists():
        text = p.read_text()
        for n in parse_tx_reps(text):
            add(n, "PUCT retail electric providers", source_url(text), "REP")

    out = []
    for row in rows.values():
        out.append({"name": row["name"],
                    "registries": "; ".join(sorted(row["registries"])),
                    "entities": sum(row["detail"].values()),
                    "sectors": "; ".join(f"{k} {v}" for k, v in row["detail"].most_common()),
                    "in_frame": reg.in_frame(row["name"], names),
                    "source_urls": " ".join(sorted(row["source_urls"]))})
    out.sort(key=lambda r: (r["in_frame"], -r["entities"], r["name"].lower()))
    rank_eia(names)
    reg.write_csv(OUT, out, ["name", "registries", "entities", "sectors", "in_frame", "source_urls"])
    print(f"{len(out)} companies, {sum(not r['in_frame'] for r in out)} not in the frame -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

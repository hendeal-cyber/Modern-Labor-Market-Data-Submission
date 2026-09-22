#!/usr/bin/env python3
"""Initialise and maintain config/token-verification.yaml.

Why this exists: nothing in the repository recorded verification *attempts*,
only outcomes. An employer that was searched for and not found looked
identical to one nobody had looked at, so an interrupted pass got re-chased
from the start. 217 employers are unresolved; without a ledger that is a job
nobody can pick up halfway.

Re-runnable by design. It ADDS entries for employers the ledger does not yet
know and refreshes only the derived fields (priority, industry, whether the
last manifest resolved the board). It never overwrites a `status`, a
`checked_on`, an `evidence` URL or a `reason` -- those are decisions, and a
generator that could silently revert a decision would be worse than no
generator.

    python scripts/make_token_ledger.py            # add missing, refresh derived
    python scripts/make_token_ledger.py --report   # priority-ordered worklist
"""
from __future__ import annotations

import argparse
import collections
import glob
import json
import pathlib

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
LEDGER = ROOT / "config" / "token-verification.yaml"

# Disclosure is near-universal in mandate states and about a quarter elsewhere,
# and a board only becomes a CLUSTER if its postings disclose pay. So an
# employer whose declared metro sits in a mandate state is worth several times
# one that does not, regardless of company size.
MANDATE_METROS = {
    "chicago": "IL", "northern_virginia": "VA", "denver": "CO",
    "twin_cities": "MN", "minneapolis": "MN", "seattle": "WA",
    "new_york": "NY", "bay_area": "CA", "boston": "MA",
}
# Energy-analytics firms and economics consultancies post the analyst roles the
# taxonomy admits, and they tend to sit on Greenhouse, Lever or Ashby, which
# resolve reliably and return full description text plus structured pay.
GOOD_ATS_INDUSTRIES = {"energy_analytics", "consulting"}


def industry_of(group: str, entry: dict) -> str:
    if entry.get("industry"):
        return entry["industry"]
    # Batch groups carry the industry in the group name.
    return (group.replace("_batch2", "").replace("_batch3", "")
            .rstrip("s").replace("utilitie", "utility")
            .replace("data_center_operator", "data_center")
            .replace("grid_operator", "grid_operator")
            .replace("cooperative", "cooperative")
            .replace("retailer", "retailer")
            .replace("developer", "developer")
            .replace("grid_vendor", "grid_vendor"))


def priority(entry: dict, industry: str) -> str:
    metro = entry.get("metro")
    if metro in MANDATE_METROS:
        return "1_mandate_metro"
    if industry in GOOD_ATS_INDUSTRIES:
        return "2_analyst_roles_good_ats"
    if metro:
        return "3_known_metro"
    return "4_unlocated"


def load_frame() -> list[tuple[str, str, dict]]:
    cfg = yaml.safe_load((ROOT / "config" / "employers.yaml").read_text())
    out = []
    for group, entries in cfg.items():
        if group in ("discovery", "rejected_tokens") or not isinstance(entries, list):
            continue
        for e in entries:
            if isinstance(e, dict) and e.get("name"):
                out.append((e["name"], group, e))
    return out


def latest_manifest() -> dict:
    paths = sorted(glob.glob(str(ROOT / "data" / "raw" / "*" / "manifest.json")))
    if not paths:
        return {}
    data = json.loads(pathlib.Path(paths[-1]).read_text())
    return {r["employer"]: r for r in data.get("results", [])}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true",
                    help="print the priority-ordered worklist and exit")
    ap.add_argument("--rates", action="store_true",
                    help="print measured hit rate by industry and the expected "
                         "yield from what is left, then exit")
    args = ap.parse_args()

    ledger = {}
    if LEDGER.exists():
        ledger = yaml.safe_load(LEDGER.read_text()) or {}
    entries = ledger.setdefault("employers", {})

    frame = load_frame()
    manifest = latest_manifest()
    added = 0
    for name, group, e in frame:
        ind = industry_of(group, e)
        row = entries.get(name)
        if row is None:
            row = {"status": "unchecked"}
            entries[name] = row
            added += 1
        # A board that resolves needs no search: it is already confirmed by the
        # collection itself, which is stronger evidence than a search result.
        resolved = bool(manifest.get(name, {}).get("found"))
        if resolved and row.get("status") == "unchecked":
            row["status"] = "confirmed"
            row["evidence"] = "resolved in collection manifest"
            row["checked_on"] = "2026-09-22"
        # A hand-verified token IS a confirmation: it was read off a live job
        # URL, which is why it skips the sector gate. Leaving it "unchecked"
        # would send the next pass to re-search employers already done.
        if (e.get("verified") is True and row.get("status") == "unchecked"):
            row["status"] = "confirmed"
            row["evidence"] = e.get("careers_url", "hand-verified in employers.yaml")
            row["checked_on"] = e.get("verified_on", "2026-09-22")
        if e.get("ats_unidentified") and row.get("status") == "unchecked":
            row["status"] = "denied"
            row["reason"] = "no supported ATS identified (from employers.yaml)"
            row["checked_on"] = "2026-09-22"
        if e.get("blocked_reason") and row.get("status") == "unchecked":
            row["status"] = "denied"
            row["reason"] = f"blocked: {e['blocked_reason']}"
            row["checked_on"] = "2026-09-22"
        # Derived fields are refreshed; decisions are not.
        row["industry"] = ind
        row["priority"] = priority(e, ind)
        row["resolved_in_last_run"] = resolved
        if e.get("metro"):
            row["metro"] = e["metro"]

    ledger["employers"] = dict(sorted(entries.items()))
    ledger["_note"] = (
        "Verification ledger. status: confirmed | denied | unchecked. "
        "A confirmation needs an evidence URL (a live job URL seen in search "
        "results) or 'resolved in collection manifest'. A denial needs a "
        "reason. Regenerate derived fields with scripts/make_token_ledger.py; "
        "it never overwrites a status, date, evidence or reason."
    )

    counts = collections.Counter(r["status"] for r in entries.values())
    by_pri = collections.Counter(
        r["priority"] for r in entries.values() if r["status"] == "unchecked")

    if args.rates:
        # Computed rather than written down. An earlier version of this table
        # lived in HANDOFF.md as literals, read 50% for retailers on 8
        # searches, and was 33% four searches later -- a number that goes
        # stale every batch does not belong in a document.
        searched = collections.Counter()
        confd = collections.Counter()
        for row in entries.values():
            ind = row.get("industry", "?")
            if row["status"] == "confirmed" and row.get("platform") and row.get("token"):
                searched[ind] += 1
                confd[ind] += 1
            elif row["status"] == "denied" and row.get("checked_on"):
                searched[ind] += 1
        if not searched:
            print("nothing searched yet")
            return 0
        tot_s = sum(searched.values())
        tot_c = sum(confd.values())
        print(f"{'industry':24s} {'searched':>9s} {'confirmed':>10s} {'rate':>7s}")
        for ind in sorted(searched, key=lambda i: -searched[i]):
            sn, cn = searched[ind], confd[ind]
            print(f"{ind:24s} {sn:9d} {cn:10d} {cn / sn * 100:6.0f}%")
        print(f"{'OVERALL':24s} {tot_s:9d} {tot_c:10d} {tot_c / tot_s * 100:6.0f}%")

        left = collections.Counter(r.get("industry", "?") for r in entries.values()
                                   if r["status"] == "unchecked")
        expected = 0.0
        print(f"\n{sum(left.values())} unchecked; expected confirmations at the "
              f"observed rate:")
        for ind in sorted(left, key=lambda i: -left[i]):
            rate = (confd[ind] / searched[ind]) if searched.get(ind) else tot_c / tot_s
            expected += left[ind] * rate
            print(f"  {ind:24s} {left[ind]:4d} x {rate * 100:5.1f}% = "
                  f"{left[ind] * rate:5.1f}")
        print(f"  TOTAL expected: ~{expected:.0f} confirmations")
        print("\nRates are small samples and they move -- retailers read 50% on "
              "8 searches\nand 33% on 12. The ORDERING has been stable; the "
              "levels have not.")
        return 0

    if args.report:
        print(f"{sum(counts.values())} employers: " +
              ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
        print("\nunchecked by priority:")
        for p, n in sorted(by_pri.items()):
            print(f"  {p:28s} {n}")
        print("\nworklist (priority, then industry, then name):")
        work = [(r["priority"], r["industry"], n)
                for n, r in entries.items() if r["status"] == "unchecked"]
        for p, i, n in sorted(work):
            print(f"  {p:26s} {i:18s} {n}")
        return 0

    LEDGER.write_text(yaml.safe_dump(ledger, sort_keys=False, allow_unicode=True,
                                     width=100))
    print(f"wrote {LEDGER.relative_to(ROOT)}: {sum(counts.values())} employers "
          f"({added} newly added)")
    print("  " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
    print("  unchecked by priority: " +
          ", ".join(f"{k} {v}" for k, v in sorted(by_pri.items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

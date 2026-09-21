#!/usr/bin/env python3
"""Fetch BEA Regional Price Parities by state, for price-adjusted pay.

Why this exists: comparing advertised pay across the whole US without adjusting
for local price levels is the first thing a reviewer challenges. $95,000 in San
Francisco is not $95,000 in Indiana.

Why it is a SCRIPT and not a committed table: I do not know these 51 numbers,
and inventing them would be the worst failure available here — a fabricated
deflator applied to every observation, invisible in the output, in a document
that presents itself as an economic study. The numbers come from BEA or they
do not exist.

The environment that authored this cannot reach bea.gov (egress is blocked to
almost everything), so this runs in GitHub Actions like collection does. It
tries a short ordered list of public BEA endpoints and records which answered.
A miss is an ordinary outcome: if nothing answers, no file is written, and
analyze.py reports the price-adjusted model as unavailable rather than
substituting a guess.

It writes to data/ rather than config/ on purpose: config is what this
study CHOOSES, data is what it FETCHES, and the collection workflow already
commits data/.

Usage:  python scripts/fetch_rpp.py [--out data/rpp_by_state.json]
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import pathlib
import sys
import zipfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from lmstudy.netclient import PoliteSession  # noqa: E402

# BEA publishes its regional datasets as public CSV archives that need no key.
CANDIDATES = (
    "https://apps.bea.gov/regional/zip/RPP.zip",
    "https://apps.bea.gov/regional/zip/rpp.zip",
)

STATE_NAME_TO_CODE = None  # filled from lmstudy.geo


def load_state_map() -> dict[str, str]:
    from lmstudy.geo import STATE_ABBR
    return dict(STATE_ABBR)


def parse_rpp_csv(text: str, states: dict[str, str]) -> tuple[dict[str, float], str | None]:
    """Extract {state_code: rpp_all_items} for the most recent year present.

    BEA's regional CSVs carry one row per (GeoName, LineCode) with a column per
    year. LineCode 1 is "RPPs: All items". Anything else — metro rows, goods or
    services subindexes — is ignored.
    """
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        return {}, None
    cols = {c.strip(): c for c in reader.fieldnames}
    geo_col = cols.get("GeoName") or cols.get("GeoFips")
    line_col = cols.get("LineCode") or cols.get("Description")
    if not geo_col:
        return {}, None
    year_cols = sorted(c for c in cols if c.strip().isdigit() and len(c.strip()) == 4)
    if not year_cols:
        return {}, None
    year = year_cols[-1]

    out: dict[str, float] = {}
    for row in reader:
        name = (row.get(geo_col) or "").strip()
        code = states.get(name.lower())
        if not code:
            continue
        # Keep only the all-items line.
        line = (row.get(line_col) or "").strip() if line_col else "1"
        if line not in ("1", "RPPs: All items", "All items"):
            continue
        raw = (row.get(cols[year]) or "").strip().replace(",", "")
        try:
            value = float(raw)
        except ValueError:
            continue
        if 50.0 < value < 200.0:      # an RPP is a percentage of the US level
            out[code] = value
    return out, year


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data/rpp_by_state.json")
    args = ap.parse_args()

    states = load_state_map()
    session = PoliteSession()
    for url in CANDIDATES:
        print(f"trying {url}", flush=True)
        resp = session.get_bytes(url)
        if not resp.ok:
            print(f"  no: {resp.error or resp.status}", flush=True)
            continue
        try:
            archive = zipfile.ZipFile(io.BytesIO(resp.data))
        except zipfile.BadZipFile as exc:
            print(f"  not a zip: {exc}", flush=True)
            continue
        for member in archive.namelist():
            if not member.lower().endswith(".csv"):
                continue
            text = archive.read(member).decode("utf-8-sig", errors="replace")
            values, year = parse_rpp_csv(text, states)
            # 51 jurisdictions exist; accept a near-complete table but say so.
            if len(values) >= 45:
                payload = {
                    "_source": url,
                    "_member": member,
                    "_vintage": year,
                    "_note": ("BEA Regional Price Parities, all items, by state. "
                              "US average = 100. Fetched by scripts/fetch_rpp.py; "
                              "not hand-entered."),
                    "_n_states": len(values),
                    "values": dict(sorted(values.items())),
                }
                out = pathlib.Path(args.out)
                out.write_text(json.dumps(payload, indent=1) + "\n")
                print(f"  wrote {out} — {len(values)} states, vintage {year}", flush=True)
                return 0
        print("  zip held no parseable RPP table", flush=True)

    print("NO RPP TABLE FETCHED. The price-adjusted model will be reported as "
          "unavailable. No values are invented to fill the gap.", flush=True)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

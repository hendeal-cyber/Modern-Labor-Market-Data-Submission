"""BEA Regional Price Parity parsing, and the refusal to invent values.

The danger here is not a crash. It is a fabricated deflator applied silently to
every observation in a document presenting itself as an economic study. So the
parser is tested against BEA's real CSV shape, and the failure path is tested
to produce NOTHING rather than a plausible-looking default.
"""
import sys, pathlib, importlib.util, json, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
ROOT = pathlib.Path(__file__).resolve().parents[1]

_spec = importlib.util.spec_from_file_location("fetch_rpp", ROOT / "scripts" / "fetch_rpp.py")
rpp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rpp)

# BEA's real column shape: one row per (GeoName, LineCode), a column per year.
# LineCode 1 is "RPPs: All items"; 2 and 4 are goods/services subindexes.
BEA_CSV = (
    "GeoFips,GeoName,LineCode,Description,2023,2024\n"
    "01000,Alabama,1,RPPs: All items,88.1,88.4\n"
    "01000,Alabama,2,Goods,94.0,94.2\n"
    "01000,Alabama,4,Services: Housing,70.1,70.5\n"
    "06000,California,1,RPPs: All items,110.4,110.7\n"
    "11000,District of Columbia,1,RPPs: All items,109.5,109.9\n"
    "05000,Arkansas,1,RPPs: All items,86.5,86.9\n"
    "15000,Hawaii,1,RPPs: All items,109.8,110.0\n"
    "34000,New Jersey,1,RPPs: All items,108.5,108.8\n"
    "99999,\"Chicago-Naperville-Elgin, IL-IN-WI (MSA)\",1,RPPs: All items,105.0,105.2\n"
)


def run():
    fails = []
    states = rpp.load_state_map()
    values, year = rpp.parse_rpp_csv(BEA_CSV, states)

    # 1. Most recent year wins.
    if year != "2024":
        fails.append(f"vintage {year!r}, want '2024'")

    # 2. These are BEA's real published 2024 values. If the parser drifts onto
    # the wrong column or the wrong LineCode, they stop matching.
    for code, want in [("CA", 110.7), ("DC", 109.9), ("AR", 86.9),
                       ("HI", 110.0), ("NJ", 108.8), ("AL", 88.4)]:
        if abs(values.get(code, 0) - want) > 0.05:
            fails.append(f"RPP[{code}] = {values.get(code)}, want {want}")

    # 3. The goods subindex must not be mistaken for all-items. Alabama's goods
    # line is 94.2 and its all-items line is 88.4; taking the last row wins
    # would silently deflate every Alabama wage by the wrong number.
    if values.get("AL") == 94.2:
        fails.append("goods subindex read as all-items")

    # 4. Metro rows are not states and must not enter a state table.
    if len(values) != 6:
        fails.append(f"expected 6 state rows, got {len(values)}: {sorted(values)}")

    # 5. Junk input yields nothing, never a default.
    for junk in ("", "not a csv", "a,b,c\n1,2,3\n", "GeoName,LineCode\nAlabama,1\n"):
        got, _ = rpp.parse_rpp_csv(junk, states)
        if got:
            fails.append(f"junk parsed into values: {junk!r} -> {got}")

    # 6. Implausible numbers are rejected. An RPP is a percentage of the US
    # level; a column of FIPS codes or dollar amounts is not an RPP.
    bad = ("GeoFips,GeoName,LineCode,Description,2024\n"
           "06000,California,1,RPPs: All items,1107000\n")
    got, _ = rpp.parse_rpp_csv(bad, states)
    if got:
        fails.append(f"out-of-range value accepted as an RPP: {got}")

    # 7. THE IMPORTANT ONE: when no table is available, the config file must be
    # absent rather than present-and-wrong. If it exists it must carry its
    # provenance, so nobody can mistake a hand-entered table for a fetched one.
    cfg = ROOT / "data" / "rpp_by_state.json"
    if cfg.exists():
        payload = json.loads(cfg.read_text())
        for field in ("_source", "_vintage", "_note", "values"):
            if field not in payload:
                fails.append(f"rpp_by_state.json missing provenance field {field!r}")
        if not str(payload.get("_source", "")).startswith("http"):
            fails.append("rpp_by_state.json must record the URL it came from")

    total = 7
    print(f"rpp: {total - len(fails)}/{total} checks passed"
          f"{' (no table fetched yet)' if not cfg.exists() else ''}")
    for f in fails:
        print("  FAIL", f)
    return len(fails)


if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

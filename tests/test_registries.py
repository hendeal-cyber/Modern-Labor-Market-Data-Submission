"""Registry fetcher (scripts/fetch_registries.py): name matching, token
extraction, and the EIA sheet parsers.

The registries only FIND candidate employers; nothing here produces a posting.
The risks are quiet ones: a board token read from the wrong part of a URL, a
name that is already in the frame reported as missing (or the reverse), or an
EIA header row taken from the title line so every column is shifted.

The URLs below are the real evidence URLs quoted in config/employers.yaml.
The EIA fixtures follow the workbook layout (a title row above the header,
"." for a blank), and are to be replaced by rows from the first real fetch.
"""
import sys, pathlib, importlib.util
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

_spec = importlib.util.spec_from_file_location("fetch_registries", ROOT / "scripts" / "fetch_registries.py")
reg = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(reg)


def _df(rows):
    import pandas as pd
    return pd.DataFrame(rows)


def run():
    fails = []
    total = 0

    def check(cond, msg):
        nonlocal total
        total += 1
        if not cond:
            fails.append(msg)

    # --- token extraction, from evidence URLs quoted in employers.yaml ---
    cases = {
        "energynorthwest.wd1.myworkdayjobs.com/External/job/Richland-WA/Regulatory-Analyst---III--II--I_REQ25_177":
            ("workday", "energynorthwest/External/wd1"),
        "https://capitalpower.wd10.myworkdayjobs.com/en-US/External/job/Analyst--Natural-Gas_JR807009":
            ("workday", "capitalpower/External/wd10"),
        "job-boards.greenhouse.io/madisonenergyinfrastructure/jobs/4285289009":
            ("greenhouse", "madisonenergyinfrastructure"),
        "https://boards.greenhouse.io/embed/job_board?for=x": None,
        "https://jobs.lever.co/": None,
    }
    for url, want in cases.items():
        got = reg.token_of(url)
        check(got == want, f"token_of({url!r}) = {got!r}, want {want!r}")

    # --- name normalisation: legal suffixes and generic words do not count ---
    check(reg.norm_name("Tucson Electric Power Company") == reg.norm_name("Tucson Electric Power"),
          "suffix 'Company' kept Tucson Electric Power apart from itself")
    check(reg.norm_name("NRG Energy, Inc.") == "nrg", "NRG Energy, Inc. did not reduce to 'nrg'")
    check(reg.norm_name("AT&T") == reg.norm_name("AT and T"), "ampersand not normalised")
    names, tokens = reg.frame_index()
    check(reg.in_frame("Cleco Corporation", names), "Cleco (in batch 4) reported missing")
    check(not reg.in_frame("Nonexistent Power Cooperative of Nowhere", names),
          "an unknown name matched the frame")
    check("madisonenergyinfrastructure" in tokens, "a greenhouse token in the frame was not indexed")
    check("energynorthwest" in tokens, "a workday tenant in the frame was not indexed")

    # --- EIA-861: the header is found under the title row; TOTAL customers is the last block ---
    df861 = _df([
        ["Sales to Ultimate Customers", None, None, None, None, None, None, None],
        ["Data Year", "Utility Number", "Utility Name", "State", "Ownership",
         "Customers", "Customers", "Customers"],
        [2024, 5553, "Duke Energy Carolinas, LLC", "NC", "Investor Owned", "100", "10", "2,000,000"],
        [2024, 5553, "Duke Energy Carolinas, LLC", "SC", "Investor Owned", "50", "5", "600,000"],
        [2024, 19547, "Tucson Electric Power Co", "AZ", "Investor Owned", "1", "1", "450,000"],
        [2024, 99999, "Tiny Muni", "VT", "Municipal", ".", ".", "."],
        ["Totals", None, None, None, None, None, None, None],
    ])
    rows = reg.parse_eia861(df861)
    by = {r["name"]: r for r in rows}
    check(set(by) == {"Duke Energy Carolinas, LLC", "Tucson Electric Power Co", "Tiny Muni"},
          f"EIA-861 utilities wrong: {sorted(by)}")
    check(by.get("Duke Energy Carolinas, LLC", {}).get("customers") == 2_600_000,
          "EIA-861 customers not summed across states from the TOTAL column")
    check(by.get("Duke Energy Carolinas, LLC", {}).get("states") == "NC SC", "EIA-861 states wrong")
    check(by.get("Tiny Muni", {}).get("customers") == 0, "EIA-861 '.' blank not read as zero")
    check(rows and rows[0]["name"].startswith("Duke"), "EIA-861 not ranked by customers")

    # --- EIA-860: operators summed across plants, header found ---
    df860 = _df([
        ["Form EIA-860 Data - Schedule 3, 'Generator Data' (Operable Units Only)", None, None, None],
        ["Utility ID", "Utility Name", "State", "Nameplate Capacity (MW)"],
        [1, "Invenergy Services LLC", "IL", "200.0"],
        [1, "Invenergy Services LLC", "TX", "1,300.5"],
        [2, "Talen Energy Supply", "PA", "2500"],
        ["NOTE: ...", None, None, None],
    ])
    rows = reg.parse_eia860(df860)
    by = {r["name"]: r for r in rows}
    check(by.get("Invenergy Services LLC", {}).get("nameplate_mw") == 1500.5,
          f"EIA-860 MW not summed: {by.get('Invenergy Services LLC')}")
    check(by.get("Invenergy Services LLC", {}).get("states") == "IL TX", "EIA-860 states wrong")
    check(len(rows) == 2, f"EIA-860 note row read as a utility: {len(rows)} rows")
    check(reg.parse_eia860(_df([["no header here"]])) == [], "EIA-860 without a header returned rows")

    # --- the Common Crawl filter must compile as the server compiles it ---
    import re as _re, yaml as _yaml
    pattern = _yaml.safe_load((ROOT / "config" / "registry_sources.yaml").read_text())["commoncrawl"]["url_filter"]
    flt = reg.cdx_filter(pattern)
    check(flt.startswith("url:"), f"CDX filter lacks its field: {flt!r}")
    try:
        rx = _re.compile(flt[len("url:"):])
        check(bool(rx.search("https://acme.wd5.myworkdayjobs.com/en-US/X/job/Houston/Energy-Analyst_R1")),
              "CDX filter misses an energy job URL")
        check(not rx.search("https://job-boards.greenhouse.io/acmebank/jobs/123"),
              "CDX filter matches an unrelated board")
    except _re.error as exc:
        check(False, f"CDX filter is not a valid regex ({exc}): {flt[:40]!r}")

    # --- page text keeps link and option labels, drops scripts ---
    text = reg.html_to_text('<script>var x="Hidden Energy";</script><ul><li><a href="/s/1">'
                            'Agera Energy LLC</a></li><li>Verde Energy USA &amp; Co</li></ul>')
    check("Agera Energy LLC" in text and "Verde Energy USA & Co" in text, f"list text lost: {text!r}")
    check("Hidden Energy" not in text, "script content leaked into page text")

    print(f"registries: {total - len(fails)}/{total} checks passed")
    for f in fails:
        print("  FAIL", f)
    return len(fails)


if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

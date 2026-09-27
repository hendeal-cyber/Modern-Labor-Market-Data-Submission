#!/usr/bin/env python3
"""Fetch the public registries used to FIND employers, never to collect postings.

Owner decision, 2026-09-27: pursue all four source routes (pre-registration
section 8). Three of them need hosts this project's authoring sandbox cannot
reach (eia.gov, index.commoncrawl.org, state commission and RTO sites), so,
like fetch_rpp.py, this runs in GitHub Actions (.github/workflows/sources.yml)
and commits what it finds to data/registry/.

What it writes:
  data/registry/raw/<id>.txt      each page in config/registry_sources.yaml,
                                  as text, so it can be read and quoted
  data/registry/eia861_utilities.csv   one row per utility: name, states,
                                  ownership, retail customers (EIA-861)
  data/registry/eia860_owners.csv one row per generator operator or owner:
                                  name, states, operable nameplate MW (EIA-860)
  data/registry/ats_tokens.csv    distinct ATS board tokens in Common Crawl's
                                  URL index whose URLs name an in-scope concept
  data/registry/manifest.json     every request: url, status, bytes, and
                                  which EIA year answered

Every file carries `in_frame`, a normalised-name (or token) match against
config/employers.yaml, so the unmatched rows are the candidates. A candidate
still needs a live job URL on a supported ATS before it can enter the frame.

A failed source writes nothing in its place: the manifest records the miss.

Usage:  python scripts/fetch_registries.py [--only pages,eia,cc]
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import html
import io
import json
import pathlib
import re
import sys
import zipfile
from urllib.parse import quote, urlparse

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

OUT = ROOT / "data" / "registry"

# Words that distinguish nothing between two energy companies' names. Dropped
# before comparing, so "Tucson Electric Power Company" and "Tucson Electric
# Power" meet, and so does "NRG Energy, Inc." with "NRG".
_STOP = {
    "inc", "llc", "l", "p", "lp", "llp", "corp", "corporation", "company", "co",
    "the", "of", "and", "ltd", "holdings", "group", "services", "service",
    "energy", "power", "electric", "electricity", "usa", "us", "na", "de",
}


def norm_name(s: str) -> str:
    s = html.unescape(str(s or "")).lower().replace("&", " and ")
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return " ".join(w for w in s.split() if w not in _STOP)


# ---------------------------------------------------------------- the frame

def frame_index(path: pathlib.Path = ROOT / "config" / "employers.yaml"):
    """(normalised names, lower-cased board tokens) already in the frame."""
    doc = yaml.safe_load(path.read_text())
    names, tokens = set(), set()
    for group, entries in doc.items():
        if not isinstance(entries, list):
            continue
        for e in entries:
            if not isinstance(e, dict) or "name" not in e:
                continue
            names.add(norm_name(e["name"]))
            for platform, cands in (e.get("candidates") or {}).items():
                for c in cands or []:
                    if isinstance(c, dict):
                        tokens.add(str(c.get("tenant", "")).lower())
                    else:
                        tokens.add(str(c).lower())
    names.discard("")
    tokens.discard("")
    return names, tokens


def in_frame(name: str, names: set[str]) -> bool:
    n = norm_name(name)
    return bool(n) and n in names


# ------------------------------------------------------------------ pages

_TAG = re.compile(r"<[^>]+>")
_DROP = re.compile(r"<(script|style|noscript|svg)[^>]*>.*?</\1>", re.S | re.I)
_BLOCK = re.compile(r"</?(p|div|li|tr|td|th|br|h[1-6]|table|ul|ol|option|a)\b[^>]*>", re.I)


def html_to_text(body: str) -> str:
    """Readable text, one block per line. Link and option text are kept,
    because supplier and member lists are usually lists of links or options."""
    body = _DROP.sub(" ", body)
    body = _BLOCK.sub("\n", body)
    body = html.unescape(_TAG.sub(" ", body))
    lines = (re.sub(r"[ \t\r\f\v]+", " ", ln).strip() for ln in body.split("\n"))
    return "\n".join(ln for ln in lines if ln)


def pdf_to_text(data: bytes) -> str | None:
    try:
        from pypdf import PdfReader
    except ImportError:
        return None
    reader = PdfReader(io.BytesIO(data))
    return "\n".join((p.extract_text() or "") for p in reader.pages)


def fetch_pages(session, pages: list[dict], manifest: dict) -> None:
    raw = OUT / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    for page in pages:
        r = session.get_bytes(page["url"], use_etag=False)
        rec = {"url": page["url"], "status": r.status, "error": r.error}
        if r.ok:
            data = r.data
            if data[:4] == b"%PDF":
                (raw / f"{page['id']}.pdf").write_bytes(data)
                text = pdf_to_text(data)
            else:
                text = html_to_text(data.decode("utf-8", errors="replace"))
            if text is not None:
                (raw / f"{page['id']}.txt").write_text(
                    f"# source: {page['url']}\n# fetched: {manifest['fetched_at']}\n\n{text}\n")
            rec.update(bytes=len(data), text_chars=len(text or ""))
        manifest["pages"][page["id"]] = rec
        print(f"page {page['id']}: {r.status} {rec.get('text_chars', '')}")


# -------------------------------------------------------------------- EIA

def header_row(df, required: tuple[str, ...]) -> int | None:
    """Index of the first row that contains every required label. EIA's
    workbooks open with a title row or two, so the header is found, not
    assumed."""
    for i in range(min(len(df), 10)):
        cells = [str(v).strip().lower() for v in df.iloc[i].tolist()]
        if all(any(req in c for c in cells) for req in required):
            return i
    return None


def _col(cols: list[str], *labels: str, last: bool = False) -> int | None:
    hits = [i for i, c in enumerate(cols) if any(l in c for l in labels)]
    if not hits:
        return None
    return hits[-1] if last else hits[0]


def parse_eia861(df) -> list[dict]:
    """Utilities from EIA-861's Sales_Ult_Cust sheet (read with header=None).

    One row per utility, summed across states. The customer count is the LAST
    "Customers" column, which EIA places under TOTAL after the residential,
    commercial, industrial and transportation blocks.
    """
    h = header_row(df, ("utility number", "utility name"))
    if h is None:
        return []
    cols = [str(v).strip().lower() for v in df.iloc[h].tolist()]
    i_num, i_name = _col(cols, "utility number"), _col(cols, "utility name")
    i_state = _col(cols, "state")
    i_own = _col(cols, "ownership")
    i_cust = _col(cols, "customers", last=True)
    out: dict[str, dict] = {}
    for row in df.iloc[h + 1:].itertuples(index=False):
        num, name = str(row[i_num]).strip(), str(row[i_name]).strip()
        if not name or name.lower() in ("nan", "none") or not num[:1].isdigit():
            continue
        u = out.setdefault(num, {"utility_id": num, "name": name, "states": set(),
                                 "ownership": "", "customers": 0})
        if i_state is not None and str(row[i_state]).strip() not in ("", "nan"):
            u["states"].add(str(row[i_state]).strip())
        if i_own is not None and str(row[i_own]).strip() not in ("", "nan"):
            u["ownership"] = str(row[i_own]).strip()
        if i_cust is not None:
            try:
                u["customers"] += int(float(str(row[i_cust]).replace(",", "")))
            except ValueError:
                pass   # "." is EIA's blank
    for u in out.values():
        u["states"] = " ".join(sorted(u["states"]))
    return sorted(out.values(), key=lambda u: -u["customers"])


def parse_eia860(df) -> list[dict]:
    """Generator operators from EIA-860's 3_1_Generator Operable sheet.

    One row per operating utility (EIA's "utility" is the operator), with its
    operable nameplate MW summed across plants and the states they sit in.
    """
    h = header_row(df, ("utility id", "utility name", "nameplate capacity"))
    if h is None:
        return []
    cols = [str(v).strip().lower() for v in df.iloc[h].tolist()]
    i_id, i_name = _col(cols, "utility id"), _col(cols, "utility name")
    i_state = _col(cols, "state")
    i_mw = _col(cols, "nameplate capacity")
    out: dict[str, dict] = {}
    for row in df.iloc[h + 1:].itertuples(index=False):
        uid, name = str(row[i_id]).strip(), str(row[i_name]).strip()
        if not name or name.lower() in ("nan", "none") or not uid[:1].isdigit():
            continue
        u = out.setdefault(uid, {"utility_id": uid, "name": name, "states": set(),
                                 "nameplate_mw": 0.0, "generators": 0})
        if i_state is not None:
            u["states"].add(str(row[i_state]).strip())
        try:
            u["nameplate_mw"] += float(str(row[i_mw]).replace(",", ""))
        except ValueError:
            pass
        u["generators"] += 1
    for u in out.values():
        u["states"] = " ".join(sorted(s for s in u["states"] if s and s != "nan"))
        u["nameplate_mw"] = round(u["nameplate_mw"], 1)
    return sorted(out.values(), key=lambda u: -u["nameplate_mw"])


def _zip_sheet(data: bytes, name_part: str, sheet_part: str | None = None):
    import pandas as pd
    zf = zipfile.ZipFile(io.BytesIO(data))
    member = next((m for m in zf.namelist()
                   if name_part.lower() in m.lower() and m.lower().endswith((".xlsx", ".xls"))), None)
    if member is None:
        return None, zf.namelist()
    book = pd.read_excel(io.BytesIO(zf.read(member)), sheet_name=None, header=None)
    key = next((k for k in book if sheet_part and sheet_part.lower() in k.lower()), None)
    return book[key or next(iter(book))], member


def fetch_eia(session, cfg: dict, manifest: dict, names: set[str]) -> None:
    jobs = (
        ("eia861", ("eia861", "eia861_archive"), "Sales_Ult_Cust", "States", parse_eia861,
         "eia861_utilities.csv", ["utility_id", "name", "states", "ownership", "customers"]),
        ("eia860", ("eia860", "eia860_archive"), "3_1_Generator", "Operable", parse_eia860,
         "eia860_owners.csv", ["utility_id", "name", "states", "nameplate_mw", "generators"]),
    )
    for key, url_keys, member, sheet, parse, fname, fields in jobs:
        rec = manifest["eia"].setdefault(key, {"tried": []})
        for year in cfg["years"]:
            for uk in url_keys:
                url = cfg[uk].format(year=year)
                r = session.get_bytes(url, use_etag=False)
                rec["tried"].append({"url": url, "status": r.status})
                print(f"{key} {year}: {r.status}")
                if not r.ok or r.data[:2] != b"PK":
                    continue
                df, which = _zip_sheet(r.data, member, sheet)
                if df is None:
                    rec["error"] = f"no {member} workbook; members: {which}"
                    continue
                rows = parse(df)
                if not rows:
                    rec["error"] = f"{which}: header not found"
                    continue
                for row in rows:
                    row["in_frame"] = in_frame(row["name"], names)
                write_csv(OUT / fname, rows, fields + ["in_frame"])
                rec.update(year=year, url=url, member=which, rows=len(rows),
                           not_in_frame=sum(not r["in_frame"] for r in rows))
                break
            if "rows" in rec:
                break


# ----------------------------------------------------------- Common Crawl

# Where the board token sits in each platform's URL.
def token_of(url: str) -> tuple[str, str] | None:
    """(platform, token) for an ATS URL, or None.

    Workday's token is tenant/site/wdN, as in config/employers.yaml, because a
    tenant can run several sites and only the site names a board.
    """
    p = urlparse(url if "://" in url else "https://" + url)
    host, parts = p.netloc.lower().split(":")[0], [x for x in p.path.split("/") if x]
    if host.endswith(".myworkdayjobs.com"):
        tenant, wd = host.split(".")[0], host.split(".")[1]
        site = next((x for x in parts if not re.fullmatch(r"[a-z]{2}-[A-Z]{2}", x)), None)
        if not site or not wd.startswith("wd"):
            return None
        return "workday", f"{tenant}/{site}/{wd}"
    if not parts:
        return None
    platform = {"job-boards.greenhouse.io": "greenhouse", "boards.greenhouse.io": "greenhouse",
                "jobs.lever.co": "lever", "jobs.ashbyhq.com": "ashby",
                "jobs.smartrecruiters.com": "smartrecruiters"}.get(host)
    if not platform or parts[0].lower() in ("embed", "v1", "api", "oneclick-ui"):
        return None
    return platform, parts[0]


def fetch_commoncrawl(session, cfg: dict, manifest: dict, tokens_in_frame: set[str]) -> None:
    """Every distinct board token in the newest crawl, read page by page.

    The filter is applied HERE, not by the server. Sent as the CDX `filter`
    parameter, it made every page answer 404 on the second dispatch
    (2026-09-27), after the regex error of the first was fixed, and the index
    for these six domains is only about fifteen pages, so reading them whole is
    cheap. Keeping every token, not only those whose URL names an energy term,
    lets tokens be joined to registry names later: a Greenhouse or Lever URL
    carries no job title, so a keyword filter alone would miss most boards.
    """
    import requests
    r = session.get_json(cfg["index_list"], use_etag=False)
    rec = manifest["commoncrawl"]
    if not r.ok:
        rec["error"] = f"collinfo: {r.status}"
        return
    api = r.data[0]["cdx-api"]          # newest crawl first
    rec["index"] = r.data[0]["id"]
    keyword = re.compile(cfg["url_filter"])
    found: dict[tuple[str, str], dict] = {}
    for domain in cfg["domains"]:
        target = f"*.{domain}" if domain == "myworkdayjobs.com" else f"{domain}/*"
        base = f"{api}?url={quote(target, safe='')}&output=json&fl=url"
        n = session.get_json(base + "&showNumPages=true", use_etag=False)
        pages = int((n.data or {}).get("pages", 0)) if n.ok else 0
        cap = min(pages, cfg["max_pages_per_domain"])
        # Spread a capped read evenly over the index, which is sorted by URL,
        # so a cap samples the whole alphabet of tokens, not its start.
        picks = sorted({int(i * pages / cap) for i in range(cap)}) if cap else []
        seen, statuses, diag = 0, [], None
        for pg in picks:
            resp = session.get_bytes(f"{base}&page={pg}", use_etag=False)
            statuses.append(resp.status)
            if not resp.ok:
                if diag is None:     # keep the server's own words once per domain
                    try:
                        raw = requests.get(f"{base}&page={pg}", timeout=60)
                        diag = f"{raw.status_code}: {raw.text[:300]}"
                    except requests.RequestException as exc:
                        diag = f"{type(exc).__name__}: {exc}"
                continue
            for line in resp.data.decode("utf-8", errors="replace").splitlines():
                try:
                    url = json.loads(line)["url"]
                except (ValueError, KeyError, TypeError):
                    continue
                t = token_of(url)
                if not t:
                    continue
                seen += 1
                row = found.setdefault(t, {"platform": t[0], "token": t[1], "urls": 0,
                                           "energy_urls": 0, "example_url": url})
                row["urls"] += 1
                if keyword.search(url):
                    if not row["energy_urls"]:
                        row["example_url"] = url
                    row["energy_urls"] += 1
        rec.setdefault("domains", {})[domain] = {"pages": pages, "read": len(picks), "urls": seen,
                                                 "page_statuses": statuses, "diagnostic": diag}
        print(f"cc {domain}: {pages} pages, read {len(picks)}, {seen} urls, {diag or ''}")
    rows = sorted(found.values(), key=lambda r: (-r["energy_urls"], -r["urls"]))
    for row in rows:
        t = row["token"].lower()
        row["in_frame"] = t in tokens_in_frame or t.split("/")[0] in tokens_in_frame
    write_csv(OUT / "ats_tokens.csv", rows,
              ["platform", "token", "urls", "energy_urls", "example_url", "in_frame"])
    rec.update(tokens=len(rows), energy_tokens=sum(1 for r in rows if r["energy_urls"]),
               not_in_frame=sum(not r["in_frame"] for r in rows))


# ---------------------------------------------------------------- helpers

def write_csv(path: pathlib.Path, rows: list[dict], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="pages,eia,cc")
    args = ap.parse_args(argv)
    only = set(args.only.split(","))

    from lmstudy.netclient import PoliteSession
    cfg = yaml.safe_load((ROOT / "config" / "registry_sources.yaml").read_text())
    names, tokens = frame_index()
    manifest = {"fetched_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                "pages": {}, "eia": {}, "commoncrawl": {}}
    session = PoliteSession(min_interval=1.0, timeout=120)
    OUT.mkdir(parents=True, exist_ok=True)
    # One source failing must not lose the others: each records its own error.
    if "pages" in only:
        try:
            fetch_pages(session, cfg["pages"], manifest)
        except Exception as exc:
            manifest["pages_error"] = f"{type(exc).__name__}: {exc}"
    if "eia" in only:
        try:
            fetch_eia(session, cfg["eia"], manifest, names)
        except Exception as exc:
            manifest["eia"]["error"] = f"{type(exc).__name__}: {exc}"
    if "cc" in only:
        cc = PoliteSession(min_interval=cfg["commoncrawl"]["min_interval_seconds"], timeout=120)
        try:
            fetch_commoncrawl(cc, cfg["commoncrawl"], manifest, tokens)
        except Exception as exc:
            manifest["commoncrawl"]["error"] = f"{type(exc).__name__}: {exc}"
    # A partial dispatch (--only cc) must not erase the record of the sources
    # it did not re-fetch: keep their previous entries.
    prev_path = OUT / "manifest.json"
    if prev_path.exists():
        prev = json.loads(prev_path.read_text())
        for key, stage in (("pages", "pages"), ("eia", "eia"), ("commoncrawl", "cc")):
            if stage not in only and key in prev:
                manifest[key] = prev[key]
        manifest.setdefault("fetched_at_by_stage", prev.get("fetched_at_by_stage", {}))
    manifest.setdefault("fetched_at_by_stage", {})
    for stage in only:
        manifest["fetched_at_by_stage"][stage] = manifest["fetched_at"]
    prev_path.write_text(json.dumps(manifest, indent=2, default=str) + "\n")
    print(json.dumps({k: v for k, v in manifest.items() if k != "pages"}, indent=1, default=str)[:3000])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Render pages in a real browser and save what a visitor would see.

Some pages are built by JavaScript: a plain fetch returns an empty shell
(Paylocity's terms page came back with no text on 2026-09-28). This script
opens each page marked `render: true` in config/registry_sources.yaml in
headless Chromium, once, and saves under data/registry/raw/rendered/:

  <id>.txt    the rendered text (document.body.innerText)
  <id>.json   the page's links (text and target), and every JSON response
              the page loaded while rendering (URL, method, status, body up
              to a size cap) -- the data an adapter would read instead

It is for reading terms and for a proof of concept on a board whose terms
have been read. It collects no postings into the study: nothing here is read
by build_dataset. One visit per page, a pause between pages, and the same
identifying user agent as every other fetch.

Usage: python scripts/render_pages.py --ids paylocity_terms_rendered,...
Runs in .github/workflows/sources.yml (stage "render"), because the
authoring sandbox cannot reach these hosts.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import time

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "registry" / "raw" / "rendered"
BODY_CAP = 400_000          # characters of each JSON body kept
PAUSE_SECONDS = 3.0


def render(page, url: str, wait_ms: int) -> dict:
    """Open one URL in an existing browser page; return text, links, JSON."""
    responses: list[dict] = []

    def on_response(resp):
        ctype = (resp.headers or {}).get("content-type", "")
        if "json" not in ctype.lower():
            return
        rec = {"url": resp.url, "method": resp.request.method, "status": resp.status,
               "content_type": ctype}
        try:
            body = resp.text()
            rec["chars"] = len(body)
            rec["body"] = body[:BODY_CAP]
        except Exception as exc:          # a body can be gone after navigation
            rec["body_error"] = f"{type(exc).__name__}: {exc}"
        responses.append(rec)

    page.on("response", on_response)
    try:
        nav = page.goto(url, wait_until="networkidle", timeout=60_000)
        status = nav.status if nav else None
    except Exception as exc:
        # networkidle can time out on pages that keep a socket open; keep
        # whatever rendered.
        status = f"{type(exc).__name__}: {str(exc)[:200]}"
    page.wait_for_timeout(wait_ms)
    text = page.evaluate("() => document.body ? document.body.innerText : ''")
    links = page.evaluate(
        "() => Array.from(document.querySelectorAll('a[href]'))"
        ".map(a => ({text: (a.innerText || '').trim().slice(0, 200), href: a.href}))")
    page.remove_listener("response", on_response)
    return {"url": url, "status": status, "final_url": page.url, "text": text,
            "links": links, "json_responses": responses}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", required=True, help="comma-separated page ids with render: true")
    ap.add_argument("--wait-ms", type=int, default=4000)
    args = ap.parse_args(argv)
    ids = [i for i in args.ids.split(",") if i]

    cfg = yaml.safe_load((ROOT / "config" / "registry_sources.yaml").read_text())
    pages = {p["id"]: p for p in cfg["pages"] if p.get("render")}
    missing = [i for i in ids if i not in pages]
    if missing:
        raise SystemExit(f"not render pages in registry_sources.yaml: {missing}")

    from playwright.sync_api import sync_playwright

    ua = os.environ.get("LMSTUDY_USER_AGENT", "lmstudy-research/0.1 (academic labor-market study)")
    OUT.mkdir(parents=True, exist_ok=True)
    fetched = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    summary = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
        context = browser.new_context(user_agent=ua)
        page = context.new_page()
        for n, pid in enumerate(ids):
            if n:
                time.sleep(PAUSE_SECONDS)
            rec = render(page, pages[pid]["url"], args.wait_ms)
            rec["fetched_at"] = fetched
            (OUT / f"{pid}.txt").write_text(
                f"# source: {rec['url']}\n# rendered: {fetched}\n# status: {rec['status']}\n\n"
                f"{rec['text']}\n")
            (OUT / f"{pid}.json").write_text(json.dumps(rec, indent=1) + "\n")
            summary[pid] = {"status": rec["status"], "text_chars": len(rec["text"]),
                            "links": len(rec["links"]),
                            "json_responses": [(r["status"], r["url"][:160], r.get("chars"))
                                               for r in rec["json_responses"]]}
            print(pid, json.dumps(summary[pid], indent=1), flush=True)
        browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Collection entry point: probe every employer board and snapshot the results.

Writes raw payloads to data/raw/<date>/ so that every downstream stage can be
re-run without contacting any host again.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "src"))

from lmstudy.http import PoliteSession                      # noqa: E402
from lmstudy.collect.discover import discover_employer      # noqa: E402
from lmstudy import geo                                      # noqa: E402
from lmstudy.filters import screen_role, screen_early_career  # noqa: E402


def make_detail_filter(scope: dict, gazetteer: dict):
    """Cheap pre-screen on title and location, for platforms that need a
    separate request per description.

    Only the screens that can be judged without the description are applied:
    role, seniority and geography. Experience and internship screening still
    happens later, in build_dataset, against the full text.
    """
    metros = {k: v for k, v in scope["metros"].items() if v.get("enabled") is not False}

    def keep(posting) -> bool:
        if not screen_role(posting.title, "", scope).passed:
            return False
        # Only a seniority rejection is actionable here. "No experience signal"
        # is not: that verdict needs the description we have not fetched yet.
        if screen_early_career(posting.title, "", scope).reason == "seniority_excluded":
            return False
        location = posting.location_raw or ""
        if not location:
            return True          # unknown location: keep and decide on full text
        return geo.resolve(location, metros, gazetteer).in_scope

    return keep


def load_employers(path: pathlib.Path) -> list[dict]:
    raw = yaml.safe_load(path.read_text())
    entries = []
    for section, industry in (("utilities", "utility"), ("data_center_operators", "data_center")):
        for entry in raw.get(section) or []:
            entries.append({**entry, "industry": industry})
    return entries


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect postings from public ATS boards.")
    parser.add_argument("--employers", default=str(ROOT / "config" / "employers.yaml"))
    parser.add_argument("--out", default=str(ROOT / "data" / "raw"))
    parser.add_argument("--limit", type=int, default=0, help="stop after N employers (smoke test)")
    parser.add_argument("--no-slugs", action="store_true", help="skip slug-based discovery")
    parser.add_argument("--min-interval", type=float, default=1.0)
    args = parser.parse_args()

    employers = load_employers(pathlib.Path(args.employers))
    if args.limit:
        employers = employers[: args.limit]

    scope = yaml.safe_load((ROOT / "config" / "scope.yaml").read_text())
    gazetteer = geo.load_gazetteer(ROOT / "data" / "gazetteer.json")
    detail_filter = make_detail_filter(scope, gazetteer)

    session = PoliteSession(min_interval=args.min_interval)
    run_date = dt.date.today().isoformat()
    out_dir = pathlib.Path(args.out) / run_date
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "run_date": run_date,
        "collected_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "employers_attempted": len(employers),
        "results": [],
    }
    total_postings = 0
    candidates: list[dict] = []

    for i, entry in enumerate(employers, 1):
        name = entry["name"]
        print(f"[{i}/{len(employers)}] {name}", flush=True)
        hits = discover_employer(session, entry, try_slugs=not args.no_slugs,
                                 detail_filter=detail_filter)
        if not hits:
            print("    no board found")
            manifest["results"].append(
                {"employer": name, "industry": entry["industry"], "found": False, "postings": 0}
            )
            continue
        for hit in hits:
            # A slug-discovered board is an unconfirmed candidate: it is recorded
            # for review but contributes no postings. Only tokens declared in
            # employers.yaml enter the sampling frame, because two companies can
            # share a name and no automated check reliably tells them apart.
            if hit.source == "slug":
                candidates.append({"employer": name, "platform": hit.platform,
                                   "token": hit.token, **(hit.detail or {})})
                print(f"    CANDIDATE (unconfirmed) {hit.platform}:{hit.token} "
                      f"-> {len(hit.postings)} postings, needs review")
                manifest["results"].append(
                    {"employer": name, "industry": entry["industry"], "found": False,
                     "platform": hit.platform, "token": hit.token, "postings": 0,
                     "status": "slug_candidate_unconfirmed"}
                )
                continue
            records = [p.to_dict() for p in hit.postings]
            for record in records:
                record["industry"] = entry["industry"]
            safe = "".join(c if c.isalnum() else "_" for c in name)
            path = out_dir / f"{safe}__{hit.platform}.json"
            path.write_text(json.dumps(records, indent=1))
            total_postings += len(records)
            print(f"    {hit.platform}:{hit.token} -> {len(records)} postings")
            manifest["results"].append(
                {
                    "employer": name,
                    "industry": entry["industry"],
                    "found": True,
                    "platform": hit.platform,
                    "token": hit.token,
                    "postings": len(records),
                    "file": path.name,
                }
            )

    manifest["total_postings"] = total_postings
    manifest["slug_candidates_for_review"] = len(candidates)
    if candidates:
        (out_dir / "_candidates_for_review.json").write_text(json.dumps(candidates, indent=2))
        print(f"\n{len(candidates)} unconfirmed slug candidate(s) written for review; "
              "they contribute no data until declared in config/employers.yaml")
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    found = sum(1 for r in manifest["results"] if r.get("found"))
    print(f"\ncollected {total_postings} raw postings from {found} boards -> {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

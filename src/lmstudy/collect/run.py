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


def make_detail_filter(scope: dict, gazetteer: dict, diag: dict | None = None,
                       probe: bool = False):
    """Cheap pre-screen on title and location, for platforms that need a
    separate request per description.

    Only the screens that can be judged without the description are applied:
    role, seniority and geography. Experience and internship screening still
    happens later, in build_dataset, against the full text.
    """
    metros = {k: v for k, v in scope["metros"].items() if v.get("enabled") is not False}

    def keep(posting) -> bool:
        role_ok = screen_role(posting.title, "", scope).passed
        senior = screen_early_career(posting.title, "", scope).reason == "seniority_excluded"
        location = posting.location_raw or ""
        # An unknown location (absent, or Workday's "N Locations") is kept so
        # the detail record can settle it; only a resolvable, out-of-radius
        # place is a rejection.
        geo_ok = (True if geo.is_unknown_location(location)
                  else geo.resolve(location, metros, gazetteer).in_scope)

        # Record WHY each listing was dropped. Knowing whether the binding
        # constraint is the role taxonomy or the 35-mile radius is what decides
        # which scope lever is worth widening, so it is measured rather than
        # guessed.
        if diag is not None:
            diag["listed"] = diag.get("listed", 0) + 1
            if role_ok and not senior and geo_ok:
                diag["kept"] = diag.get("kept", 0) + 1
            elif role_ok and not senior and not geo_ok:
                diag["role_ok_wrong_place"] = diag.get("role_ok_wrong_place", 0) + 1
                diag.setdefault("locations_of_in_role", {})
                key = location[:40] or "(blank)"
                diag["locations_of_in_role"][key] = diag["locations_of_in_role"].get(key, 0) + 1
            elif geo_ok and not (role_ok and not senior):
                # An unknown location is not evidence of being in a study
                # metro, so it is counted apart from a confirmed in-metro
                # posting. Lumping them together would overstate how much
                # widening the role taxonomy actually recovers.
                bucket = ("unknown_place_wrong_role" if geo.is_unknown_location(location)
                          else "in_metro_wrong_role")
                diag[bucket] = diag.get(bucket, 0) + 1
                if bucket == "in_metro_wrong_role":
                    diag.setdefault("titles_in_metro", {})
                    diag["titles_in_metro"][posting.title[:60]] = \
                        diag["titles_in_metro"].get(posting.title[:60], 0) + 1
            else:
                diag["neither"] = diag.get("neither", 0) + 1

        # Probe mode keeps every in-metro posting regardless of role, so the
        # yield of each candidate scope can be MEASURED rather than estimated.
        # It writes to data/probe/ and never feeds the analysis dataset, so it
        # widens nothing about the study itself.
        if probe:
            return geo_ok
        if not role_ok or senior:
            return False
        return geo_ok

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
    parser.add_argument("--probe", action="store_true",
                        help="collect every in-metro posting regardless of role, "
                             "into data/probe/, to measure what each candidate "
                             "scope would yield. Does not affect the dataset.")
    args = parser.parse_args()

    employers = load_employers(pathlib.Path(args.employers))
    if args.limit:
        employers = employers[: args.limit]

    scope = yaml.safe_load((ROOT / "config" / "scope.yaml").read_text())
    gazetteer = geo.load_gazetteer(ROOT / "data" / "gazetteer.json")
    diagnostics: dict = {}
    detail_filter = make_detail_filter(scope, gazetteer, diagnostics,
                                       probe=args.probe)

    session = PoliteSession(min_interval=args.min_interval)
    run_date = dt.date.today().isoformat()
    base = pathlib.Path(args.out)
    if args.probe:
        base = base.parent / "probe"
    out_dir = base / run_date
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
            listed = (hit.detail or {}).get("listed")
            print(f"    {hit.platform}:{hit.token} -> {len(records)} postings"
                  + (f" (board listed {listed})" if listed is not None else ""))
            manifest["results"].append(
                {
                    "employer": name,
                    "industry": entry["industry"],
                    "found": True,
                    "platform": hit.platform,
                    "token": hit.token,
                    "listed": listed,
                    "postings": len(records),
                    "file": path.name,
                }
            )

    manifest["total_postings"] = total_postings
    # Trim the long tails so the manifest stays readable.
    for field in ("locations_of_in_role", "titles_in_metro"):
        if field in diagnostics:
            diagnostics[field] = dict(sorted(diagnostics[field].items(),
                                             key=lambda kv: -kv[1])[:30])
    manifest["scope_diagnostics"] = diagnostics
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

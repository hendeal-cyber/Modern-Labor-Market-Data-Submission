"""The detail cache must save requests without freezing a posting's pay.

The saving is easy and the safeguard is what needs testing: a cache that
never re-read anything would bias `pay_disclosed` downward, because employers
add pay ranges to live postings and pay disclosure is this study's dependent
variable.
"""
import datetime as dt
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lmstudy.collect.cache import DetailCache, load_detail_cache  # noqa: E402
from lmstudy.collect.ats import RawPosting                        # noqa: E402

TODAY = dt.date(2026, 9, 22)


def stub(external_id="1", platform="workday", updated_at=None):
    return RawPosting(platform=platform, employer="Invenergy", board_token="t",
                      external_id=external_id, title="Analyst", location_raw="Chicago, IL",
                      description="", url="u", updated_at=updated_at)


def cached(external_id="1", platform="workday", days_ago=0, updated_at=None,
           description="full text"):
    return {"platform": platform, "employer": "Invenergy",
            "external_id": external_id, "description": description,
            "updated_at": updated_at, "location_raw": "Chicago, IL",
            "detail_fetched_at": (TODAY - dt.timedelta(days=days_ago)).isoformat()}


def run():
    fails = []

    def cache(records, max_age_days=7):
        keyed = {f"{r['platform']}|{r['employer']}|{r['external_id']}": r
                 for r in records}
        return DetailCache(keyed, max_age_days=max_age_days, today=TODAY)

    # 1. A posting read yesterday and unchanged is reused, not re-fetched.
    c = cache([cached(days_ago=1)])
    p = stub()
    if not c.apply(p):
        fails.append("an unchanged posting read yesterday must be reused")
    if p.description != "full text":
        fails.append("a reused posting must carry its cached description")
    if c.hits != 1:
        fails.append(f"hits={c.hits}, want 1")

    # 2. A posting the platform says changed is re-fetched. This is the guard
    #    that catches an employer adding a pay range to a live posting.
    c = cache([cached(days_ago=1, platform="greenhouse", updated_at="2026-09-01")])
    if c.apply(stub(platform="greenhouse", updated_at="2026-09-21")):
        fails.append("an edited posting must be re-fetched, not reused")
    if c.edited != 1:
        fails.append(f"edited={c.edited}, want 1")

    # 3. A posting older than the window is re-read whatever the platform says.
    #    Workday reports NO `updated_at` on any of the 298 Workday records in
    #    the corpus, so for the largest platform in the frame this is the ONLY
    #    thing that ever catches an edit.
    c = cache([cached(days_ago=8)])
    if c.apply(stub()):
        fails.append("a posting past the refresh window must be re-read")
    if c.stale != 1:
        fails.append(f"stale={c.stale}, want 1")
    c = cache([cached(days_ago=7)])
    if not c.apply(stub()):
        fails.append("a posting exactly at the window edge must still be reused")

    # 4. Never serve an empty description as though it were a real one.
    c = cache([cached(days_ago=1, description="")])
    if c.apply(stub()):
        fails.append("an empty cached description must not count as a hit")

    # 5. The key is platform + employer + id. A different employer sharing an
    #    external id must never collide -- Workday ids are only unique within
    #    a tenant.
    c = cache([cached(days_ago=1)])
    other = stub()
    other.employer = "AES Indiana"
    if c.apply(other):
        fails.append("a different employer must not hit another's cache entry")

    # 6. A record with no stamp at all is re-read rather than trusted.
    entry = cached(days_ago=1)
    del entry["detail_fetched_at"]
    if cache([entry]).apply(stub()):
        fails.append("a record with no fetch date must be re-read")

    # 7. load_detail_cache reads real snapshots, newest first.
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        root = pathlib.Path(tmp)
        for day, text in (("2026-09-20", "older"), ("2026-09-21", "newer")):
            d = root / day
            d.mkdir()
            (d / "Invenergy__workday.json").write_text(json.dumps([
                {"platform": "workday", "employer": "Invenergy",
                 "external_id": "1", "description": text}]))
        (root / "2026-09-22").mkdir()
        (root / "2026-09-22" / "Invenergy__workday.json").write_text(json.dumps([
            {"platform": "workday", "employer": "Invenergy",
             "external_id": "1", "description": "todays partial run"}]))
        c = load_detail_cache(root, today=TODAY, skip_run_date="2026-09-22")
        p = stub()
        if not c.apply(p):
            fails.append("a snapshot-loaded posting must be reusable")
        elif p.description != "newer":
            fails.append(f"newest snapshot must win, got {p.description!r}")
        # The run currently being written must not seed its own cache.
        if "todays partial run" in json.dumps(c.stats()):
            fails.append("the in-progress run must be skipped")

    print(f"cache: {7 - len(set(f[:12] for f in fails))}/7 checks passed"
          if fails else "cache: 7/7 checks passed")
    for f in fails:
        print("  FAIL", f)
    return len(fails)


if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

"""Reuse descriptions already fetched, so a daily run reads only what is new.

Workday and SmartRecruiters list postings without descriptions, so each
in-scope posting costs a SECOND request, throttled to one per second. That
per-posting fetch is the whole cost of a collection run; listing is cheap by
comparison. `external_id` is stable across runs, so a posting whose detail was
read yesterday does not need reading again today.

How much this saves is measured, not assumed. Between the two consecutive
snapshots with comparable board coverage (2026-09-21 and 2026-09-22, 40
employers in both, 730 postings), 12 postings were new and 8 disappeared --
1.6% and 1.1%. Boards do not refresh on a schedule; they change when an
employer opens or closes a requisition, and at this frame size that is a dozen
postings a day.

THE RISK, AND WHY THE REFRESH WINDOW EXISTS. An employer can edit a live
posting -- most importantly by adding a pay range to one that had none. Pay
disclosure is this study's dependent variable and its headline finding, so a
cache that froze every posting at its first sighting would bias disclosure
downward, and would do it invisibly.

Two guards:

  1. `updated_at` forces a re-read when it moves. Greenhouse, Lever, Ashby,
     SmartRecruiters and Workable all populate it.
  2. A maximum age forces a re-read regardless. This is not belt-and-braces:
     Workday returns `updated_at` as NULL on every one of the 298 Workday
     records in the corpus, so for the largest platform in the frame guard 1
     does not exist and the age window is the ONLY thing that catches an
     edited posting.

A cached record is therefore reused only when the posting is unchanged by
whatever signal the platform gives, and was read within the window.
"""

from __future__ import annotations

import datetime as dt
import json
import pathlib

# Seven days. Every posting is re-read at least weekly, so a pay range added
# to a live posting enters the dataset within a week at the latest, and the
# saving still applies to the ~98% of postings unchanged on any given day.
DEFAULT_MAX_AGE_DAYS = 7


def _key(platform: str, employer: str, external_id: str) -> str:
    return f"{platform}|{employer}|{external_id}"


class DetailCache:
    """Descriptions read on earlier runs, keyed by platform + employer + id."""

    def __init__(self, records: dict | None = None,
                 max_age_days: int = DEFAULT_MAX_AGE_DAYS,
                 today: dt.date | None = None):
        self._records = records or {}
        self.max_age_days = max_age_days
        self._today = today or dt.date.today()
        self.hits = 0
        self.misses = 0
        self.stale = 0
        self.edited = 0

    def __len__(self) -> int:
        return len(self._records)

    def _fresh(self, cached: dict) -> bool:
        stamp = cached.get("detail_fetched_at")
        if not stamp:
            return False
        try:
            when = dt.date.fromisoformat(str(stamp)[:10])
        except ValueError:
            return False
        return (self._today - when).days <= self.max_age_days

    def get(self, posting) -> dict | None:
        """The cached detail for this stub, or None if it must be fetched."""
        cached = self._records.get(
            _key(posting.platform, posting.employer, posting.external_id))
        if not cached or not cached.get("description"):
            self.misses += 1
            return None
        # An edit the platform reports is always re-read. Workday reports none.
        listed_update = getattr(posting, "updated_at", None)
        if listed_update and listed_update != cached.get("updated_at"):
            self.edited += 1
            self.misses += 1
            return None
        if not self._fresh(cached):
            self.stale += 1
            self.misses += 1
            return None
        self.hits += 1
        return cached

    def apply(self, posting) -> bool:
        """Fill a stub from cache. True if it was filled and needs no fetch."""
        cached = self.get(posting)
        if cached is None:
            return False
        posting.description = cached.get("description") or ""
        for field in ("posted_at", "updated_at", "department", "employment_type",
                      "comp_min", "comp_max", "comp_interval"):
            if cached.get(field) is not None and getattr(posting, field, None) in (None, ""):
                setattr(posting, field, cached[field])
        if cached.get("location_raw"):
            posting.location_raw = cached["location_raw"]
        payload = dict(posting.payload or {})
        payload["detail_from_cache"] = True
        payload["detail_fetched_at"] = cached.get("detail_fetched_at")
        posting.payload = payload
        return True

    def stats(self) -> dict:
        return {"cached_records": len(self._records), "reused": self.hits,
                "fetched": self.misses, "refetched_stale": self.stale,
                "refetched_edited": self.edited,
                "max_age_days": self.max_age_days}


def load_detail_cache(raw_root: pathlib.Path,
                      max_age_days: int = DEFAULT_MAX_AGE_DAYS,
                      today: dt.date | None = None,
                      skip_run_date: str | None = None) -> DetailCache:
    """Build a cache from committed snapshots, newest snapshot winning.

    Snapshots are read newest-first and an existing key is never overwritten,
    so the most recent read of a posting is the one kept.
    """
    records: dict = {}
    if raw_root.exists():
        for day_dir in sorted((d for d in raw_root.iterdir() if d.is_dir()),
                              reverse=True):
            if skip_run_date and day_dir.name == skip_run_date:
                continue
            for path in sorted(day_dir.glob("*.json")):
                if path.name == "manifest.json":
                    continue
                try:
                    data = json.loads(path.read_text())
                except (ValueError, OSError):
                    continue
                if not isinstance(data, list):
                    continue
                for rec in data:
                    if not isinstance(rec, dict) or not rec.get("description"):
                        continue
                    key = _key(rec.get("platform", ""), rec.get("employer", ""),
                               str(rec.get("external_id", "")))
                    if key in records:
                        continue
                    stamp = ((rec.get("payload") or {}).get("detail_fetched_at")
                             or day_dir.name)
                    entry = dict(rec)
                    entry["detail_fetched_at"] = stamp
                    records[key] = entry
    return DetailCache(records, max_age_days=max_age_days, today=today)

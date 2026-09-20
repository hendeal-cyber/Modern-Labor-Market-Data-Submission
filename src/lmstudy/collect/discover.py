"""Resolve which ATS board (if any) a given employer publishes on.

Board tokens are not published in any directory, so candidates from
config/employers.yaml are probed and slug variants are tried as a fallback.
A miss returns 404 and costs the host one cheap request.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from ..http import PoliteSession
from .ats import FETCHERS, RawPosting


@dataclass
class BoardHit:
    employer: str
    platform: str
    token: str
    postings: list[RawPosting]
    detail: dict | None = None
    source: str = "declared"      # "declared" | "slug"
    identity_note: str | None = None


STOPWORDS = {"inc", "llc", "corp", "corporation", "company", "co", "group",
             "holdings", "the", "energy", "data", "centers", "center", "gas",
             "services", "solutions", "systems", "technologies", "international",
             "global", "american", "national", "us", "usa"}


def distinctive_tokens(name: str) -> set[str]:
    """Name words that actually identify a company.

    "Constellation Energy" reduces to {"constellation"}; the generic half of a
    name is what makes slug collisions possible in the first place.
    """
    words = re.sub(r"[^a-z0-9 ]", " ", name.lower()).split()
    return {w for w in words if w not in STOPWORDS and len(w) > 2}


def board_profile(employer: str, postings: list[RawPosting]) -> dict:
    """Advisory summary of a slug-discovered board, for human review.

    This is NOT an identity test and must not be used as one. Slug discovery
    found an Ashby board at token "constellation" belonging to a San Francisco
    AI startup rather than Constellation Energy; a name-in-content check does
    not catch it, because the startup is also called Constellation. Two firms
    sharing a name cannot be told apart from posting text, so a slug hit is
    only ever a CANDIDATE for a person to confirm. Only tokens declared in
    config/employers.yaml enter the sampling frame.
    """
    locations = sorted({(p.location_raw or "").strip() for p in postings if p.location_raw})
    return {
        "employer_searched": employer,
        "distinctive_tokens": sorted(distinctive_tokens(employer)),
        "n_postings": len(postings),
        "sample_titles": [p.title for p in postings[:8]],
        "locations_seen": locations[:12],
        "sample_url": postings[0].url if postings else None,
        "review_required": True,
        "note": "Unconfirmed slug match. Verify this board belongs to the intended "
                "employer, then add the token to config/employers.yaml as a declared "
                "candidate. Until then it contributes no data.",
    }


def slug_variants(name: str) -> list[str]:
    """Candidate board tokens derived from a company name."""
    base = re.sub(r"[^a-z0-9 ]", " ", name.lower())
    base = re.sub(r"\b(inc|llc|corp|corporation|company|co|group|holdings|the)\b", " ", base)
    words = [w for w in base.split() if w]
    if not words:
        return []
    out = ["".join(words), "-".join(words), words[0]]
    seen, unique = set(), []
    for token in out:
        if token and token not in seen:
            seen.add(token)
            unique.append(token)
    return unique


def probe(
    session: PoliteSession,
    employer: str,
    platform: str,
    token: str | dict,
    detail_filter=None,
) -> BoardHit | None:
    """Try one (platform, token). Returns a hit only if postings came back."""
    fetcher = FETCHERS.get(platform)
    if fetcher is None:
        return None
    try:
        if platform == "workday":
            tenant = token.get("tenant") if isinstance(token, dict) else token
            site = token.get("site", "careers") if isinstance(token, dict) else "careers"
            pinned = token.get("wd") if isinstance(token, dict) else None
            # A verified candidate names its wd instance, so probe only that one.
            instances = (pinned,) if pinned else (1, 5, 3, 2, 10, 12, 103, 105)
            for instance in instances:
                postings, resp = fetcher(session, tenant, site, employer,
                                         wd_instance=instance, detail_filter=detail_filter)
                listed = resp.listed or 0
                # A board that listed jobs exists even when the pre-screen
                # removed all of them. Conflating the two would make a real
                # employer look boardless and hide that it simply posts
                # nothing in scope.
                if postings or listed:
                    return BoardHit(employer, platform, f"{tenant}/{site}", postings,
                                    {"wd_instance": instance, "listed": listed})
            return None
        if platform == "smartrecruiters":
            postings, resp = fetcher(session, token, employer, detail_filter=detail_filter)
        else:
            postings, resp = fetcher(session, token, employer)
        listed = resp.listed if resp.listed is not None else len(postings)
        if postings or listed:
            return BoardHit(employer, platform, token, postings, {"listed": listed})
        return None
    except Exception as exc:  # a malformed board must not abort the whole run
        print(f"    probe error {employer}/{platform}/{token}: {type(exc).__name__}: {exc}")
        return None


def discover_employer(
    session: PoliteSession, entry: dict, try_slugs: bool = True, detail_filter=None
) -> list[BoardHit]:
    """Probe declared candidates first, then derived slugs as a fallback."""
    employer = entry["name"]
    hits: list[BoardHit] = []

    for platform, tokens in (entry.get("candidates") or {}).items():
        for token in tokens or []:
            hit = probe(session, employer, platform, token, detail_filter)
            if hit:
                hits.append(hit)
                break          # one confirmed board per platform is enough
    if hits or not try_slugs:
        return hits

    for platform in ("greenhouse", "lever", "ashby", "smartrecruiters", "workable", "recruitee"):
        for token in slug_variants(employer):
            hit = probe(session, employer, platform, token, detail_filter)
            if hit:
                hit.source = "slug"
                hit.detail = board_profile(employer, hit.postings)
                hits.append(hit)
                return hits
    return hits

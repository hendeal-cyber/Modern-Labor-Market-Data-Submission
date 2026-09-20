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
) -> BoardHit | None:
    """Try one (platform, token). Returns a hit only if postings came back."""
    fetcher = FETCHERS.get(platform)
    if fetcher is None:
        return None
    try:
        if platform == "workday":
            tenant = token.get("tenant") if isinstance(token, dict) else token
            site = token.get("site", "careers") if isinstance(token, dict) else "careers"
            for instance in (1, 5, 3, 2, 10, 12):
                postings, _ = fetcher(session, tenant, site, employer, wd_instance=instance)
                if postings:
                    return BoardHit(employer, platform, f"{tenant}/{site}", postings,
                                    {"wd_instance": instance})
            return None
        postings, _ = fetcher(session, token, employer)
        return BoardHit(employer, platform, token, postings) if postings else None
    except Exception as exc:  # a malformed board must not abort the whole run
        print(f"    probe error {employer}/{platform}/{token}: {type(exc).__name__}: {exc}")
        return None


def discover_employer(
    session: PoliteSession, entry: dict, try_slugs: bool = True
) -> list[BoardHit]:
    """Probe declared candidates first, then derived slugs as a fallback."""
    employer = entry["name"]
    hits: list[BoardHit] = []

    for platform, tokens in (entry.get("candidates") or {}).items():
        for token in tokens or []:
            hit = probe(session, employer, platform, token)
            if hit:
                hits.append(hit)
                break          # one confirmed board per platform is enough
    if hits or not try_slugs:
        return hits

    for platform in ("greenhouse", "lever", "ashby", "smartrecruiters", "workable", "recruitee"):
        for token in slug_variants(employer):
            hit = probe(session, employer, platform, token)
            if hit:
                hits.append(hit)
                return hits
    return hits

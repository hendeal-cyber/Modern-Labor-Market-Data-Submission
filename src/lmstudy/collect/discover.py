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


# Vocabulary that an energy, utility, grid or data-center employer's postings
# will contain and an unrelated company's will not. Used to verify that a
# discovered board actually belongs to this sector.
SECTOR_TERMS = (
    "utility", "utilities", "energy", "electric", "power grid", "grid",
    "substation", "transmission", "renewable", "solar", "wind", "battery",
    "data center", "data centre", "datacenter", "megawatt", "kilowatt",
    "interconnection", "ferc", "nerc", "rto", "iso", "kwh", "mwh",
    "generation", "natural gas", "pipeline", "electricity", "decarboniz",
    "colocation", "uptime", "critical facilit", "load", "outage",
)
MIN_SECTOR_SHARE = 0.25


def sector_confidence(postings: list[RawPosting]) -> float:
    """Share of a board's postings that read as energy or data-center work.

    This is the safeguard that makes large-scale token discovery safe. A slug
    guess can land on a different company sharing a name — an Ashby board at
    token "constellation" turned out to be a San Francisco AI startup, not
    Constellation Energy. Checking the employer's NAME against the board does
    not catch that, because both are called Constellation. Checking the
    board's SECTOR does: an AI startup's postings do not discuss substations,
    interconnection or megawatts.
    """
    sample = postings[:40]
    if not sample:
        return 0.0
    hits = 0
    for posting in sample:
        blob = f"{posting.title} {posting.description[:3000]}".lower()
        if any(term in blob for term in SECTOR_TERMS):
            hits += 1
    return hits / len(sample)


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
        "sector_confidence": round(sector_confidence(postings), 3),
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
    unverified_guess: bool = False,
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
            if pinned:
                instances = (pinned,)
            elif unverified_guess:
                # A guessed tenant is usually wrong; probing eight instances
                # for each of 150 employers would blow the job timeout for
                # almost no yield. wd1 and wd5 cover most real tenants.
                instances = (1, 5)
            else:
                instances = (1, 5, 3, 2, 10, 12, 103, 105)
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
    """Probe declared candidates first, then derived slugs as a fallback.

    A candidate on an entry marked `verified: false` was derived from the
    company name rather than read off the employer's own careers page, so it
    carries the same same-name collision risk as a slug guess and is held to
    the same sector-confidence check. Hand-verified entries skip it.
    """
    employer = entry["name"]
    hand_verified = bool(entry.get("verified"))
    hits: list[BoardHit] = []

    for platform, tokens in (entry.get("candidates") or {}).items():
        for token in tokens or []:
            hit = probe(session, employer, platform, token, detail_filter,
                        unverified_guess=not hand_verified)
            if not hit:
                continue
            if not hand_verified:
                profile = board_profile(employer, hit.postings)
                if profile["sector_confidence"] < MIN_SECTOR_SHARE:
                    hit.source = "slug"
                    hit.detail = profile
                    print(f"      {platform}:{token} quarantined "
                          f"(sector confidence {profile['sector_confidence']:.0%})",
                          flush=True)
                    hits.append(hit)
                    break
                hit.detail = {**profile, "review_required": False,
                              "admitted_by": "sector_confidence"}
            hits.append(hit)
            break              # one confirmed board per platform is enough
    if hits or not try_slugs:
        return hits

    for platform in ("greenhouse", "lever", "ashby", "smartrecruiters", "workable", "recruitee"):
        for token in slug_variants(employer):
            hit = probe(session, employer, platform, token, detail_filter)
            if hit:
                profile = board_profile(employer, hit.postings)
                confidence = profile["sector_confidence"]
                if confidence >= MIN_SECTOR_SHARE:
                    # The board's own postings are plainly energy or data-center
                    # work, so this is not a same-name collision.
                    hit.source = "declared"
                    hit.detail = {**profile, "review_required": False,
                                  "admitted_by": "sector_confidence"}
                    print(f"      slug {platform}:{token} admitted "
                          f"(sector confidence {confidence:.0%})", flush=True)
                else:
                    hit.source = "slug"
                    hit.detail = profile
                    print(f"      slug {platform}:{token} quarantined "
                          f"(sector confidence {confidence:.0%})", flush=True)
                hits.append(hit)
                return hits
    return hits

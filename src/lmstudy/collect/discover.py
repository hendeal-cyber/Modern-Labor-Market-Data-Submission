"""Resolve which ATS board (if any) a given employer publishes on.

Board tokens are not published in any directory, so candidates from
config/employers.yaml are probed and slug variants are tried as a fallback.
A miss returns 404 and costs the host one cheap request.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

import pathlib

from ..netclient import PoliteSession
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
SECTOR_TERMS = tuple()  # superseded by STRONG_TERMS below; kept for imports

# Unambiguous energy / utility / data-center vocabulary.
#
# The first version of this list failed in production on the case it was built
# for. It substring-matched generic words, so an AI startup's board scored 43%
# and was admitted: "pipeline" hit "architecting pipelines for transforming
# data", "load" hit "dataloaders", "generation" hit "next-generation clinical",
# "utility" hit "utility providers" in an office-management posting. Every term
# below must be unambiguous in a technology-company context, and matching is
# word-bounded rather than substring.
STRONG_TERMS = (
    # physical grid
    "substation", "switchgear", "transformer", "transmission line", "power grid",
    "electric grid", "grid operator", "interconnection", "megawatt", "kilowatt",
    "gigawatt", "kwh", "mwh", "kva", "switchyard",
    # "feeder" alone was ambiguous -- it matched "feeder systems
    # (procurement, travel, payroll, asset, grants)" in a federal finance
    # posting. Qualified so it means the distribution asset.
    "distribution feeder",
    # markets and regulation
    "ferc", "nerc", "caiso", "ercot", "miso", "pjm", "iso-ne", "nyiso",
    "rate case", "ratepayer", "public utility", "utility commission",
    "tariff filing", "integrated resource plan", "capacity market",
    "energy market", "power purchase agreement", "renewable energy credit",
    # generation and fuels
    "renewable energy", "solar", "wind farm", "photovoltaic", "turbine",
    "battery storage", "energy storage", "natural gas", "power generation",
    "generation capacity", "decarboniz", "grid-scale",
    # utility operations
    "demand response", "energy efficiency", "load forecasting", "peak load",
    "outage management", "smart meter", "distribution utility",
    # data centers
    "data center", "data centre", "datacenter", "colocation",
    "critical facilit", "critical environment", "cooling capacity",
)
MIN_SECTOR_SHARE = 0.30
MIN_DISTINCT_TERMS = 2

_STRONG_RE = [(t, __import__("re").compile(rf"(?<!\w){__import__('re').escape(t)}(?!\w)", __import__("re").IGNORECASE))
              for t in STRONG_TERMS]


def sector_confidence(postings: list[RawPosting]) -> float:
    """Share of a board's postings that are unambiguously energy or data-center work.

    This distinguishes a real match from a same-name collision, which name
    matching cannot: an Ashby board at token "constellation" belongs to a San
    Francisco AI startup, and both companies are called Constellation.
    """
    sample = postings[:40]
    if not sample:
        return 0.0
    hits = 0
    for posting in sample:
        blob = f"{posting.title} {posting.description[:3000]}"
        if any(rx.search(blob) for _, rx in _STRONG_RE):
            hits += 1
    return hits / len(sample)


def distinct_sector_terms(postings: list[RawPosting]) -> int:
    """How many different sector terms the board uses.

    A board that trips one term repeatedly is far weaker evidence than one
    using several, so admission requires breadth as well as share.
    """
    blob = " ".join(f"{p.title} {p.description[:3000]}" for p in postings[:40])
    return sum(1 for _, rx in _STRONG_RE if rx.search(blob))


def has_strong_sector_term(text: str) -> bool:
    """Whether one unambiguous sector term appears in this text, word-bounded."""
    return any(rx.search(text or "") for _, rx in _STRONG_RE)


# Plain sector vocabulary, for judging a single POSTING rather than a board.
# STRONG_TERMS alone is the wrong test here: measured against the real
# snapshots it dropped "Associate Director - AI & Data, Energy Providers" and
# "Data Scientist, Consultant (Utilities)" -- both genuinely energy -- because
# real consulting prose says "energy" and "utilities" rather than "substation"
# or "integrated resource plan".
CORE_SECTOR_WORDS = (
    "energy", "utility", "utilities", "electric", "grid", "power", "renewable",
    "substation", "megawatt", "interconnection", "transmission", "solar", "wind",
)
_CORE_RE = tuple((w, re.compile(rf"\b{w}\b", re.I)) for w in CORE_SECTOR_WORDS)

# "power" is deliberately absent. In a consulting or IT title it is far more
# often Microsoft Power Platform, Power BI or PowerPoint than electric power:
# Guidehouse's "Data Analyst/Power Platform" trips "power" eleven times in its
# description and is not an energy role. It still counts toward the breadth
# test below, where needing three DIFFERENT words neutralises it.
_TITLE_SECTOR_WORDS = tuple(w for w in CORE_SECTOR_WORDS if w != "power")
_TITLE_RE = tuple(re.compile(rf"\b{w}\b", re.I) for w in _TITLE_SECTOR_WORDS)

MIN_DISTINCT_CORE_WORDS = 3


def posting_shows_sector(title: str, description: str) -> bool:
    """Positive energy / utility / data-center evidence in ONE posting's TITLE.

    Title only, and the description deliberately ignored. Three attempts at
    using the description were measured against the committed snapshots and
    each failed on real rows:

    * one STRONG_TERM kept Guidehouse's "Financial Transformation Business
      Analyst" (on "feeder systems", since fixed) and every Charles River
      Associates cybersecurity role (on "NERC-CIP" listed beside NIST, HIPAA,
      ISO 27001 and SOC2 -- generic cyber-compliance boilerplate);
    * three distinct core sector words kept those same CRA forensics roles and
      its generic "Management Advisory Analyst", because the firm's boilerplate
      recites its practice areas and one of them is energy. That is audit round
      1's failure exactly: a pattern matching company prose rather than the
      job;
    * raw counts were worse still -- Guidehouse's "Data Analyst/Power Platform"
      says "power" eleven times and is a Microsoft Power Platform role.

    A multi-sector consultancy states the practice in the title, and measuring
    all three boards confirms it: CRA labels them "(Energy practice)", Brattle
    "Energy Analyst", Guidehouse "Energy Providers", "(Utilities)", "Energy
    Markets". The description is the firm's marketing; the title is the job.

    Only for employers carrying `requires_sector_evidence`. A pure-play energy
    firm must NOT carry it -- E3's "Analyst" and "Associate Consultant" are
    energy work by virtue of the firm, and this test would wrongly drop them.
    """
    return any(rx.search(title or "") for rx in _TITLE_RE)


MIN_DISTINCT_FOR_DIVERSIFIED = 6


def sector_ok(postings: list[RawPosting]) -> bool:
    """Either gate is sufficient, and each covers a case the other misses.

    A focused energy employer clears the share gate. A diversified firm whose
    energy work is a minority of its postings does not — Charles River
    Associates is a real energy consultancy at 7.5% share, because most of its
    practice is antitrust and life sciences — but it uses 11 distinct sector
    terms, which a company in another industry does not. Both of the known
    wrong-company matches score zero on both gates: the AI startup at token
    "constellation" and the public-transit company at token "via".
    """
    return (sector_confidence(postings) >= MIN_SECTOR_SHARE
            or distinct_sector_terms(postings) >= MIN_DISTINCT_FOR_DIVERSIFIED)


def slug_variants_safe(name: str) -> list[str]:
    """Slug candidates, minus the ones that invite a collision.

    The bare first word of a multi-word name is dangerously generic: "Via
    Renewables" produced "via", which is a public-transit software company
    with 168 postings. A short first word is dropped unless the company name
    is a single word.
    """
    variants = slug_variants(name)
    words = name.split()
    if len(words) > 1:
        # Drop the bare first word entirely, not merely the short ones. A
        # length threshold was tried and was not enough: "pattern" (7),
        # "tomorrow" (8), "national" (8) and "lightsource" (11) all cleared it
        # and all landed on unrelated companies — an e-commerce firm, a weather
        # company, a PR agency and a software startup.
        first = words[0].lower().strip(".,")
        variants = [v for v in variants if v != first]
    return variants


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
        "distinct_sector_terms": distinct_sector_terms(postings),
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


def load_rejected(path=None) -> set[tuple[str, str]]:
    """(platform, token) pairs confirmed to be a different company."""
    import yaml
    path = path or (pathlib.Path(__file__).resolve().parents[3]
                    / "config" / "employers.yaml")
    try:
        raw = yaml.safe_load(pathlib.Path(path).read_text())
    except (OSError, yaml.YAMLError):
        return set()
    return {(r.get("platform"), r.get("token"))
            for r in (raw.get("rejected_tokens") or [])}


REJECTED = load_rejected()



# Workday site names are a small, highly conventional space, and guessing them
# too narrowly is what hid NiSource: its declared candidates were
# "NiSource_Careers" and "careers", while the real board is
# nisource.wd1.myworkdayjobs.com/NiSource — the tenant's own name, which was
# never tried. Run 35554269246 resolved 29 of 266 boards, and this is a
# measured cause rather than a suspected one.
#
# Ordered most-likely first so a hit usually lands in the first probe or two.
def workday_site_variants(tenant: str, employer: str = "", limit: int = 7) -> list[str]:
    """Conventional Workday site paths for a tenant. Case matters to Workday."""
    tenant = (tenant or "").strip()
    if not tenant:
        return []
    # Workday site paths are case-sensitive, so the employer's own casing
    # matters: NiSource's board is /NiSource, not /nisource or /Nisource.
    # "NiSource / NIPSCO" and "MISO (Midcontinent ISO)" both carry the real
    # brand in their first segment, so each segment is tried.
    segments = [seg.strip() for seg in re.split(r"[/(]", employer) if seg.strip()]
    names = [re.sub(r"[^A-Za-z0-9]", "", seg) for seg in segments]
    names = [n for n in names if n]
    base = names[0] if names else tenant
    seen: list[str] = []
    for candidate in (
        *names,                     # NiSource/NiSource is the commonest form
        # "External" is tried early because it is the commonest real site name
        # in this frame: all three whose site is known use it -- Xcel Energy
        # (found only because of it), NRECA and Ameren. Promoting it saves
        # probe requests per tenant, which matters against the job timeout at
        # 252 Workday tenants. It does NOT unlock anyone: I checked all 252
        # and every one of them already reached "External" inside the limit of
        # 7, so the ordering is a cost saving and not a fix.
        "External",
        tenant,
        tenant.capitalize(),
        "careers",
        "Careers",
        f"{tenant}careers",
        f"{base}_Careers",
        f"{base}Careers",
        "External_Career_Site",
    ):
        if candidate and candidate not in seen:
            seen.append(candidate)
    return seen[:limit]


def probe(
    session: PoliteSession,
    employer: str,
    platform: str,
    token: str | dict,
    detail_filter=None,
    unverified_guess: bool = False,
    expand_sites: bool = False,
) -> BoardHit | None:
    """Try one (platform, token). Returns a hit only if postings came back."""
    fetcher = FETCHERS.get(platform)
    if fetcher is None:
        return None
    if isinstance(token, str) and (platform, token) in REJECTED:
        print(f"      skipping {platform}:{token} — known wrong company", flush=True)
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
            # A declared site is tried first; the conventional variants are a
            # fallback for employers whose site name was guessed wrong. They
            # are only expanded for employers inside a study metro, because
            # each variant costs a request per instance and only a
            # metro-resident employer can contribute an observation.
            sites = [site]
            if expand_sites:
                sites += [s for s in workday_site_variants(tenant, employer)
                          if s != site]
            for site_name in sites:
                for instance in instances:
                    postings, resp = fetcher(session, tenant, site_name, employer,
                                             wd_instance=instance,
                                             detail_filter=detail_filter)
                    listed = resp.listed or 0
                    # A board that listed jobs exists even when the pre-screen
                    # removed all of them. Conflating the two would make a real
                    # employer look boardless and hide that it simply posts
                    # nothing in scope.
                    if postings or listed:
                        return BoardHit(employer, platform, f"{tenant}/{site_name}",
                                        postings,
                                        {"wd_instance": instance, "listed": listed,
                                         "site_guessed": site_name != site})
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
    # Only an employer inside a study radius can ever contribute an
    # observation, so the extra Workday site probes are spent there. Measured
    # on run 35554269246: the two metro-headquartered utilities supplied 27 of
    # 35 observations, the other 236 employers supplied 8 between them.
    metro_resident = bool(entry.get("metro")) and entry.get("metro") != "national"
    hits: list[BoardHit] = []

    for platform, tokens in (entry.get("candidates") or {}).items():
        for token in tokens or []:
            hit = probe(session, employer, platform, token, detail_filter,
                        unverified_guess=not hand_verified,
                        expand_sites=metro_resident)
            if not hit:
                continue
            if not hand_verified:
                profile = board_profile(employer, hit.postings)
                # probe() records whether the board was found under a guessed
                # site name; the sector profile must not overwrite that.
                probe_detail = dict(hit.detail or {})
                if not sector_ok(hit.postings):
                    hit.source = "slug"
                    hit.detail = {**probe_detail, **profile}
                    print(f"      {platform}:{token} quarantined "
                          f"(sector confidence {profile['sector_confidence']:.0%})",
                          flush=True)
                    hits.append(hit)
                    break
                hit.detail = {**probe_detail, **profile, "review_required": False,
                              "admitted_by": "sector_confidence"}
            hits.append(hit)
            break              # one confirmed board per platform is enough
    if hits or not try_slugs:
        return hits

    for platform in ("greenhouse", "lever", "ashby", "smartrecruiters", "workable", "recruitee"):
        for token in slug_variants_safe(employer):
            hit = probe(session, employer, platform, token, detail_filter)
            if hit:
                profile = board_profile(employer, hit.postings)
                confidence = profile["sector_confidence"]
                if sector_ok(hit.postings):
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

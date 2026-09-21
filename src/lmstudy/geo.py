"""Assign postings to study metros by distance from a metro centroid.

Location strings in ATS payloads are free text ("Chicago, IL", "Oak Brook,
Illinois", "Remote - US", "Chicago, IL; Indianapolis, IN"). Resolution is
offline against a bundled gazetteer so collection stays free and deterministic;
no geocoding service is called.
"""
from __future__ import annotations

import json
import math
import pathlib
import re
import unicodedata
from dataclasses import dataclass

GAZETTEER_PATH = pathlib.Path(__file__).resolve().parents[2] / "data" / "gazetteer.json"
EARTH_RADIUS_MILES = 3958.8

# Workday collapses a multi-site posting to "3 Locations" rather than listing
# them. That is an unknown location, not an out-of-scope one: treating it as a
# place silently drops postings that may well be in a study metro.
MULTI_LOCATION_RE = re.compile(r"^\s*\d+\s+locations?\s*$", re.IGNORECASE)


def is_unknown_location(location_raw: str | None) -> bool:
    text = (location_raw or "").strip()
    return not text or bool(MULTI_LOCATION_RE.match(text))


# Nationwide-remote postings live here rather than being discarded.
REMOTE_NATIONAL = "remote_national"

REMOTE_MARKERS = ("remote", "work from home", "wfh", "virtual", "anywhere")
HYBRID_MARKERS = ("hybrid", "flexible location", "partially remote")
ONSITE_MARKERS = ("on-site", "onsite", "in office", "in-office")

STATE_ABBR = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "district of columbia": "DC", "washington dc": "DC", "washington d.c.": "DC",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN",
    "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE",
    "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC",
    "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR",
    "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA",
    "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
}


_STATE_CODES = set(STATE_ABBR.values()) | {
    "AL", "AK", "AZ", "AR", "CT", "DE", "DC", "FL", "GA", "HI", "IA", "ID",
    "KS", "KY", "LA", "ME", "MA", "MI", "MS", "MO", "MT", "NE", "NV", "NH",
    "NJ", "NM", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN",
    "TX", "UT", "VT", "WV", "WY",
}


@dataclass
class GeoResult:
    metro: str | None = None
    tier: int | None = None
    distance_miles: float | None = None
    matched_place: str | None = None
    state: str | None = None
    work_arrangement: str = "unspecified"   # onsite | hybrid | remote | unspecified
    remote_eligible: bool = False
    note: str | None = None

    @property
    def in_scope(self) -> bool:
        return self.metro is not None


def haversine_miles(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_MILES * math.asin(math.sqrt(h))


def load_gazetteer(path: pathlib.Path | None = None) -> dict[str, tuple[float, float, str]]:
    """{"chicago|il": (lat, lon, "IL")} built from the US Census Gazetteer."""
    path = path or GAZETTEER_PATH
    if not path.exists():
        return {}
    raw = json.loads(path.read_text())
    return {k: (v[0], v[1], v[2]) for k, v in raw.items()}


def detect_arrangement(location_raw: str, description: str = "") -> str:
    blob = f"{location_raw} {description[:2000]}".lower()
    if any(m in blob for m in HYBRID_MARKERS):
        return "hybrid"
    if any(m in blob for m in REMOTE_MARKERS):
        return "remote"
    if any(m in blob for m in ONSITE_MARKERS):
        return "onsite"
    return "unspecified"


# Workday tenants render a location as "US - VA, Arlington": a country prefix
# followed by STATE, CITY, which is the reverse of the "City, ST" form every
# other ATS uses. Measured on run 35554269246 this silently dropped 14
# role-matching postings in Northern Virginia, because "- VA, Arlington" parses
# to the city "va". The strings handled here are taken verbatim from that run's
# manifest (scope_diagnostics.locations_of_in_role) rather than invented.
_COUNTRY_PREFIX_RE = re.compile(r"^\s*(?:US|USA|U\.S\.|United States)\s*[-\u2013]\s*", re.IGNORECASE)
_STATE_FIRST_RE = re.compile(r"^\s*([A-Z]{2})\s*,\s*(.+?)\s*$")


def canonicalize_place(fragment: str) -> str:
    """'US - VA, Arlington' -> 'Arlington, VA'. Leaves 'Chicago, IL' alone.

    Only the comma-separated STATE, CITY form is flipped. A bare "PA Bryn Mawr"
    is left as-is on purpose: guessing at forms that were not observed is how
    the sector gate was broken.
    """
    text = _COUNTRY_PREFIX_RE.sub("", fragment or "")
    match = _STATE_FIRST_RE.match(text)
    if match:
        state, city = match.group(1), match.group(2)
        # Only flip when the leading token is a real state code and the trailing
        # token is not, so "IL, Chicago" flips but "Chicago, IL" cannot.
        if state.upper() in _STATE_CODES and city.strip().upper() not in _STATE_CODES:
            return f"{city}, {state.upper()}"
    return text.strip() or (fragment or "")


def _split_locations(location_raw: str) -> list[str]:
    """A posting may list several sites; each is considered separately."""
    parts = re.split(r"\s*(?:;|\||\bor\b|\band\b|/)\s*", location_raw or "")
    return [p.strip() for p in parts if p.strip()]


def _normalize_place(fragment: str) -> tuple[str, str] | None:
    """'Oak Brook, Illinois' -> ('oak brook', 'IL')."""
    cleaned = re.sub(r"\b(remote|hybrid|onsite|on-site|usa|united states|us)\b", " ",
                     fragment, flags=re.IGNORECASE)
    cleaned = re.sub(r"[^A-Za-z ,.-]", " ", cleaned)
    bits = [b.strip() for b in cleaned.split(",") if b.strip()]
    if not bits:
        return None
    city = bits[0].lower().strip(" .-")
    state = None
    if len(bits) > 1:
        cand = bits[1].lower().strip(" .-")
        state = STATE_ABBR.get(cand, cand.upper() if len(cand) == 2 else None)
    if not city:
        return None
    return city, (state or "")



# --------------------------------------------------------------------------
# National (US) resolution.
#
# The gazetteer holds coordinates for the study metros only, and seeding it for
# every US place is a week of work that this study does not need. Almost every
# ATS location string carries its state — "Irving, Texas", "US - VA, Arlington",
# "Overland Park, KS" — so national coverage resolves to STATE rather than to
# coordinates. resolve() is untouched and still assigns study metros by
# distance, so `study_metro` survives as a regressor alongside `state`.

# Countries seen in real collected payloads. Non-US postings are excluded:
# pooling currencies and labour markets would be meaningless, and the run
# already returns Chennai, Mumbai, Bangalore, Bogota, Amsterdam and Shah Alam.
NON_US_MARKERS = (
    "india", "canada", "mexico", "united kingdom", "england", "scotland",
    "ireland", "germany", "france", "spain", "netherlands", "amsterdam",
    "belgium", "poland", "romania", "bulgaria", "sweden", "norway", "denmark",
    "finland", "portugal", "italy", "switzerland", "austria", "czech",
    "hungary", "greece", "turkey", "israel", "uae", "dubai", "singapore",
    "malaysia", "philippines", "japan", "china", "hong kong", "korea",
    "australia", "new zealand", "brazil", "colombia", "chile", "argentina",
    "peru", "south africa", "kenya", "nigeria", "egypt", "vietnam",
    "thailand", "indonesia", "taiwan", "pakistan", "bangladesh",
    "bogota", "chennai", "mumbai", "bangalore", "bengaluru", "hyderabad",
    "pune", "delhi", "shah alam", "selangor", "gabrovo", "sevlievo",
    "toronto", "vancouver", "montreal", "london", "paris", "berlin", "madrid",
    # Seen in real payloads as country codes rather than names. "Remote
    # Location - PL; POL Warsaw" is how a Warsaw role reached the US sample.
    "pol", "warsaw", "dammam", "saudi arabia", "riyadh", "jeddah",
    "deu", "gbr", "fra", "esp", "ita", "nld", "bel", "che", "aut", "swe",
    "nor", "dnk", "fin", "irl", "prt", "grc", "rou", "bgr", "hun", "cze",
    "pln", "ind", "chn", "jpn", "kor", "aus", "nzl", "bra", "mex", "can",
    "zaf", "are", "sgp", "mys", "phl", "tha", "vnm", "idn", "twn",
)

# US Census regions. Used instead of state fixed effects when N is too small to
# support 50 dummies.
CENSUS_REGION = {
    "northeast": ("CT", "ME", "MA", "NH", "RI", "VT", "NJ", "NY", "PA"),
    "midwest": ("IL", "IN", "MI", "OH", "WI", "IA", "KS", "MN", "MO",
                "NE", "ND", "SD"),
    "south": ("DE", "DC", "FL", "GA", "MD", "NC", "SC", "VA", "WV", "AL",
              "KY", "MS", "TN", "AR", "LA", "OK", "TX"),
    "west": ("AZ", "CO", "ID", "MT", "NV", "NM", "UT", "WY", "AK", "CA",
             "HI", "OR", "WA"),
}
_STATE_TO_REGION = {st: region for region, states in CENSUS_REGION.items()
                    for st in states}


def census_region(state: str | None) -> str | None:
    return _STATE_TO_REGION.get((state or "").upper()) or None


def is_non_us(location_raw: str | None) -> bool:
    """True when the location names a country other than the United States.

    Matched on word boundaries so "Ireland" cannot fire inside a US place name
    and "India" cannot fire inside "Indiana" — the exact substring trap that
    has produced four separate bugs in this codebase already.
    """
    text = _fold(location_raw)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return False
    return any(re.search(rf"(?<!\w){re.escape(marker)}(?!\w)", text)
               for marker in NON_US_MARKERS)



# Tokens that positively assert US scope in a remote posting.
US_MARKERS = ("us", "usa", "u s", "united states", "america", "nationwide",
              "domestic", "conus")
# What is left once remoteness and US markers are stripped. If anything
# substantive remains, the posting names somewhere else.
_REMOTE_WORDS = ("remote", "location", "locations", "any", "work from home",
                 "wfh", "virtual", "anywhere", "home", "based", "flexible",
                 "hybrid", "onsite", "on site", "field")


def is_us_remote(location_raw: str | None) -> bool:
    """True when a remote posting is plausibly US-scoped.

    Accepts "Remote", "Remote - US", "US (Remote)", "Remote, United States".
    Rejects "Remote Location - PL; POL Warsaw" and "Dammam, Eastern Region,
    Saudi Arabia" — both of which reached the dataset as "nationwide remote"
    before this existed.
    """
    text = _fold(location_raw)
    if not text:
        return False
    if is_non_us(location_raw):
        return False
    words = [w for w in text.split() if w]
    if any(re.search(rf"(?<!\w){re.escape(m)}(?!\w)", text) for m in US_MARKERS):
        return True
    # No US marker: accept only when the string says nothing but "remote".
    leftover = [w for w in words if w not in _REMOTE_WORDS]
    return not leftover


def _fold(value: str | None) -> str:
    """Lowercase, accent-folded, punctuation-stripped."""
    folded = unicodedata.normalize("NFKD", value or "")
    folded = "".join(c for c in folded if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9 ]+", " ", folded.lower())
    return re.sub(r"\s+", " ", text).strip()


def resolve_us_state(location_raw: str | None) -> str | None:
    """Two-letter US state code for a free-text location, or None.

    Returns None for non-US locations, for nationwide-remote strings that name
    no state, and for anything unparseable. Runs canonicalize_place() first so
    Workday's "US - VA, Arlington" form resolves like everything else.
    """
    if not location_raw or is_non_us(location_raw):
        return None
    for fragment in _split_locations(location_raw):
        parsed = _normalize_place(canonicalize_place(fragment))
        if not parsed:
            continue
        city, state = parsed
        if state and state.upper() in _STATE_CODES:
            return state.upper()
        # A bare state name with no city: "Illinois", "Remote - Texas".
        code = STATE_ABBR.get(city.lower())
        if code:
            return code
    return None



def resolve_us_states(location_raw: str | None) -> list[str]:
    """EVERY US state a location lists, not just the first.

    A pay-transparency law attaches to the job's location, so a posting listing
    several places is covered if ANY of them is covered. Taking the first
    fragment understated mandate coverage on 9 of 141 rows in the round-3
    audit, seven of which had disclosed pay — which is what being covered
    predicts.
    """
    if not location_raw:
        return []
    out: list[str] = []
    for fragment in _split_locations(location_raw):
        state = resolve_us_state(fragment)
        if state and state not in out:
            out.append(state)
    return out


def resolve(
    location_raw: str,
    metros: dict[str, dict],
    gazetteer: dict[str, tuple[float, float, str]],
    description: str = "",
) -> GeoResult:
    """Nearest in-radius active metro for any site listed on the posting."""
    arrangement = detect_arrangement(location_raw, description)
    best: GeoResult | None = None

    for fragment in _split_locations(location_raw):
        parsed = _normalize_place(canonicalize_place(fragment))
        if not parsed:
            continue
        city, state = parsed
        coords = gazetteer.get(f"{city}|{state.lower()}") if state else None
        if coords is None:
            # Fall back to a unique city-name match across the gazetteer.
            matches = [v for k, v in gazetteer.items() if k.split("|")[0] == city]
            coords = matches[0] if len(matches) == 1 else None
        if coords is None:
            continue
        lat, lon, place_state = coords
        for name, spec in metros.items():
            if spec.get("enabled") is False or not spec.get("centroid"):
                continue
            distance = haversine_miles((lat, lon), tuple(spec["centroid"]))
            if distance <= spec.get("radius_miles", 35):
                if best is None or distance < (best.distance_miles or 1e9):
                    best = GeoResult(
                        metro=name,
                        tier=spec.get("tier"),
                        distance_miles=round(distance, 2),
                        matched_place=f"{city.title()}, {place_state}",
                        state=place_state,
                        work_arrangement=arrangement,
                        remote_eligible=(arrangement == "remote"),
                    )

    if best is not None:
        return best

    # A remote posting naming a study state is metro-eligible per the study
    # design, but its distance is undefined.
    if arrangement == "remote":
        for name, spec in metros.items():
            if spec.get("enabled") is False:
                continue
            state_code = (spec.get("state") or "").lower()
            if state_code and re.search(rf"\b{state_code}\b", location_raw or "", re.IGNORECASE):
                return GeoResult(
                    metro=name,
                    tier=spec.get("tier"),
                    matched_place=None,
                    state=spec.get("state"),
                    work_arrangement="remote",
                    remote_eligible=True,
                    note="remote posting matched by state, distance undefined",
                )

    # A remote posting that names no state cannot be attributed to a metro, but
    # it is a real posting and is kept in its own category.
    #
    # This requires POSITIVE evidence that the posting is US-scoped. Accepting
    # every unresolved remote posting let a Warsaw role in twice at $309,500 —
    # "Remote Location - PL; POL Warsaw" resolved to no US state, read as
    # remote, and became "nationwide remote". It was the highest-paid
    # observation in the sample. A Dammam role came in the same way.
    #
    # So: the location must name the US, or name nothing but remoteness.
    # Anything that names another place and not the US is out.
    if arrangement == "remote" and REMOTE_NATIONAL in metros and is_us_remote(location_raw):
        return GeoResult(
            metro=REMOTE_NATIONAL,
            tier=metros[REMOTE_NATIONAL].get("tier"),
            work_arrangement="remote",
            remote_eligible=True,
            note="nationwide remote, no metro attribution",
        )

    return GeoResult(work_arrangement=arrangement, note=f"unresolved location: {location_raw!r}")

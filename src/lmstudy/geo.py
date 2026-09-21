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
    "illinois": "IL", "indiana": "IN", "virginia": "VA", "colorado": "CO",
    "minnesota": "MN", "washington": "WA", "california": "CA", "new york": "NY",
    "maryland": "MD", "wisconsin": "WI",
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

    # A remote posting that names no state at all ("US - Remote (Any location)",
    # "Remote - US") cannot be attributed to a metro, but it is a real
    # early-career energy posting and is kept in its own category. It must never
    # enter the metro or mandate-state contrasts: those identify off Illinois
    # HB 3129, and a nationwide posting has no determinate jurisdiction.
    if arrangement == "remote" and REMOTE_NATIONAL in metros:
        return GeoResult(
            metro=REMOTE_NATIONAL,
            tier=metros[REMOTE_NATIONAL].get("tier"),
            work_arrangement="remote",
            remote_eligible=True,
            note="nationwide remote, no metro attribution",
        )

    return GeoResult(work_arrangement=arrangement, note=f"unresolved location: {location_raw!r}")

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

REMOTE_MARKERS = ("remote", "work from home", "wfh", "virtual", "anywhere")
HYBRID_MARKERS = ("hybrid", "flexible location", "partially remote")
ONSITE_MARKERS = ("on-site", "onsite", "in office", "in-office")

STATE_ABBR = {
    "illinois": "IL", "indiana": "IN", "virginia": "VA", "colorado": "CO",
    "minnesota": "MN", "washington": "WA", "california": "CA", "new york": "NY",
    "maryland": "MD", "wisconsin": "WI",
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
        parsed = _normalize_place(fragment)
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
            if spec.get("enabled") is False:
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

    return GeoResult(work_arrangement=arrangement, note=f"unresolved location: {location_raw!r}")

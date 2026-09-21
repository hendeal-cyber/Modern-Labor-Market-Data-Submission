"""Geo tests, including a typo-catcher for the seed gazetteer.

A wrong coordinate would silently exclude or wrongly include postings, so every
seeded place must sit within a sane distance of at least one study metro.
"""
import sys, pathlib, yaml
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
ROOT = pathlib.Path(__file__).resolve().parents[1]

from lmstudy.geo import (haversine_miles, load_gazetteer, resolve,
                        detect_arrangement, canonicalize_place)

SCOPE = yaml.safe_load((ROOT / "config" / "scope.yaml").read_text())
METROS = SCOPE["metros"]
GAZ = load_gazetteer(ROOT / "data" / "gazetteer.json")

def all_metros():
    """Only metros with a centroid; remote_national is a category, not a place."""
    return {k: v for k, v in METROS.items() if v.get("centroid")}

def active_metros():
    return {k: v for k, v in METROS.items() if v.get("enabled") is not False}

def run():
    fails = []

    # 1. Known distance sanity: Chicago Loop -> Evanston is ~12 miles.
    d = haversine_miles((41.8781, -87.6298), (42.0451, -87.6877))
    if not (10 <= d <= 14):
        fails.append(f"Chicago->Evanston distance implausible: {d:.1f}mi")

    # 2. Typo-catcher: every seeded place within 70mi of SOME metro centroid.
    for key, (lat, lon, st) in GAZ.items():
        best = min(haversine_miles((lat, lon), tuple(s["centroid"])) for s in all_metros().values())
        if best > 70:
            fails.append(f"gazetteer entry {key} is {best:.0f}mi from every metro (likely typo)")
        if not (24 <= lat <= 49 and -125 <= lon <= -66):
            fails.append(f"gazetteer entry {key} outside continental US: {lat},{lon}")

    # 3. In-scope resolution.
    for loc, want in [
        ("Chicago, IL", "chicago"),
        ("Elk Grove Village, Illinois", "chicago"),
        ("Oak Brook, IL", "chicago"),
        ("Hammond, IN", "chicago"),          # NW Indiana is inside Chicago's radius
        ("Carmel, IN", "indianapolis"),
        ("Fishers, Indiana", "indianapolis"),
    ]:
        got = resolve(loc, active_metros(), GAZ)
        if got.metro != want:
            fails.append(f"resolve({loc!r}) -> {got.metro} want {want} ({got.note})")

    # 4. Out-of-scope must NOT resolve. This list shrinks as the study widens,
    # and that is the point of keeping it: Ashburn left when Tier 3 was
    # activated, and Redwood City and New York left on 2026-09-21 when Tier 4
    # added the Bay Area, New York, Los Angeles and Boston. Dallas and Atlanta
    # have no pay-disclosure mandate and are not study metros under any tier,
    # so they are the durable negatives.
    for loc in ["Dallas, TX", "Atlanta, GA", "Houston, TX", "Phoenix, AZ"]:
        got = resolve(loc, active_metros(), GAZ)
        if got.metro is not None:
            fails.append(f"resolve({loc!r}) wrongly in scope as {got.metro}")

    # 4b. The Tier 4 metros must actually resolve, or the widening is cosmetic.
    for loc, want in [("New York, NY", "new_york"), ("Jersey City, NJ", "new_york"),
                      ("Santa Clara, CA", "bay_area"), ("Redwood City, CA", "bay_area"),
                      ("El Segundo, CA", "los_angeles"), ("Cambridge, MA", "boston")]:
        got = resolve(loc, active_metros(), GAZ)
        if got.metro != want:
            fails.append(f"tier-4 {loc!r} -> {got.metro} want {want}")
    # Every Tier 4 metro carries a posting-level pay mandate; that is why they
    # were chosen over larger metros without one.
    for name in ("new_york", "los_angeles", "bay_area", "boston"):
        if not METROS[name].get("pay_disclosure_mandate"):
            fails.append(f"{name} must carry a pay-disclosure mandate")

    # 5. Tier 3 is active, so its metros resolve.
    for loc, want in [("Ashburn, VA", "northern_virginia"), ("Denver, CO", "denver"),
                      ("Bloomington, MN", "minneapolis"), ("Bellevue, WA", "seattle")]:
        got = resolve(loc, active_metros(), GAZ)
        if got.metro != want:
            fails.append(f"tier 3: resolve({loc!r}) -> {got.metro} want {want}")

    # 6. Multi-site postings pick the in-scope site.
    got = resolve("Dallas, TX; Chicago, IL", active_metros(), GAZ)
    if got.metro != "chicago":
        fails.append(f"multi-site posting -> {got.metro} want chicago")

    # 7. Workday's "N Locations" placeholder is unknown, not out-of-scope.
    from lmstudy.geo import is_unknown_location
    for text, want in [("3 Locations", True), ("2 locations", True), ("", True),
                       ("Chicago, IL", False), ("Locations", False)]:
        if is_unknown_location(text) != want:
            fails.append(f"is_unknown_location({text!r}) -> {not want}, want {want}")
    # A resolvable but far-away place must still be rejected.
    if is_unknown_location("Dallas, TX"):
        fails.append("a real out-of-scope place must not read as unknown")

    # 8. Work arrangement detection.
    for text, want in [("Remote - US", "remote"), ("Chicago, IL (Hybrid)", "hybrid"),
                       ("Chicago, IL - Onsite", "onsite"), ("Chicago, IL", "unspecified")]:
        if detect_arrangement(text) != want:
            fails.append(f"arrangement({text!r}) -> {detect_arrangement(text)} want {want}")

    # 9. Remote posting naming a study state is eligible.
    got = resolve("Remote - IL", active_metros(), GAZ)
    if got.metro != "chicago" or not got.remote_eligible:
        fails.append(f"remote-IL -> {got.metro} remote={got.remote_eligible}")


    # 10. Workday renders locations as "US - VA, Arlington" (country prefix,
    # then STATE, CITY). Every string below is taken verbatim from run
    # 35554269246's manifest, scope_diagnostics.locations_of_in_role, not
    # invented: a guard validated against a reconstruction rather than the real
    # artifact is what let the sector gate through.
    for loc, want in [
        ("US - VA, Arlington", "northern_virginia"),
        ("US - VA, McLean", "northern_virginia"),
        ("US - VA, Springfield", "northern_virginia"),
        ("US - VA, Norfolk", None),        # ~200mi away, must stay out
        ("US - AL, Huntsville", None),
        ("US - MD, Annapolis Junction", None),
    ]:
        got = resolve(loc, active_metros(), GAZ)
        if got.metro != want:
            fails.append(f"workday format {loc!r} -> {got.metro} want {want}")

    # 11. Flipping must be narrow. "Chicago, IL" is already CITY, STATE and
    # must survive untouched, and a city that shares a state abbreviation's
    # spelling must not be mistaken for one.
    for loc in ("Chicago, IL", "Oak Brook, Illinois", "Carmel, IN", "Irving, Texas"):
        if canonicalize_place(loc) != loc:
            fails.append(f"canonicalize_place mangled an ordinary place: {loc!r}"
                         f" -> {canonicalize_place(loc)!r}")
    if resolve("Chicago, IL", active_metros(), GAZ).metro != "chicago":
        fails.append("canonicalisation broke the ordinary City, ST form")

    # 12. Nationwide remote: kept in its own category, never attributed to a
    # metro. A remote posting that DOES name a study state still wins its metro.
    for loc in ("US - Remote (Any location)", "Remote - US", "Remote, USA"):
        got = resolve(loc, active_metros(), GAZ)
        if got.metro != "remote_national" or not got.remote_eligible:
            fails.append(f"nationwide remote {loc!r} -> {got.metro}")
    got = resolve("Chicago, IL (Remote)", active_metros(), GAZ)
    if got.metro != "chicago":
        fails.append(f"state-naming remote must beat remote_national, got {got.metro}")
    if METROS["remote_national"].get("pay_disclosure_mandate"):
        fails.append("remote_national must carry no pay-disclosure mandate")

    # 13. A genuinely unresolvable, non-remote place stays out entirely.
    if resolve("Irving, Texas", active_metros(), GAZ).metro is not None:
        fails.append("an out-of-radius onsite place must not fall into remote_national")

    print(f"geo: {len(fails)} failure(s) across {len(GAZ)} gazetteer entries")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

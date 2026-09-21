"""Geo tests, including a typo-catcher for the seed gazetteer.

A wrong coordinate would silently exclude or wrongly include postings, so every
seeded place must sit within a sane distance of at least one study metro.
"""
import sys, pathlib, yaml
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
ROOT = pathlib.Path(__file__).resolve().parents[1]

from lmstudy.geo import (haversine_miles, load_gazetteer, resolve,
                        detect_arrangement, canonicalize_place,
                        resolve_us_state, census_region, is_non_us,
                        is_us_remote, resolve_us_states,
                        CENSUS_REGION, STATE_ABBR)

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


    # 14. National resolution, 2026-09-21. Every location string below is real,
    # taken from a collection manifest, not invented.
    for loc, want in [
        ("Chicago, IL", "IL"), ("Irving, Texas", "TX"),
        ("US - VA, Arlington", "VA"), ("Overland Park, KS", "KS"),
        ("Carmel, IN", "IN"), ("Reading, Pennsylvania, United States", "PA"),
        ("Dublin, OH", "OH"),          # must not read as Ireland
        ("Indianapolis, Indiana", "IN"),   # must not read as India
        ("Chennai, Tamil Nadu, India", None),
        ("Shah Alam, Selangor", None),
        ("Bogot\u00e1", None),             # accented, must still be caught
        ("Toronto, ON", None),
        ("US - Remote (Any location)", None),
        ("3 Locations", None), ("", None),
    ]:
        got = resolve_us_state(loc)
        if got != want:
            fails.append(f"resolve_us_state({loc!r}) = {got}, want {want}")

    # 15. The substring traps that have produced four bugs in this codebase.
    # "India" inside "Indiana" and "Ireland" near "Dublin, OH" must not fire.
    for loc in ("Indianapolis, Indiana", "Indiana", "Dublin, OH", "Moscow, ID"):
        if is_non_us(loc):
            fails.append(f"is_non_us({loc!r}) wrongly True")
    for loc in ("Chennai, Tamil Nadu, India", "Amsterdam", "Toronto, ON"):
        if not is_non_us(loc):
            fails.append(f"is_non_us({loc!r}) wrongly False")

    # 16. Census regions cover every state exactly once, and nothing else.
    seen = [st for states in CENSUS_REGION.values() for st in states]
    if len(seen) != len(set(seen)):
        dupes = {st for st in seen if seen.count(st) > 1}
        fails.append(f"states in more than one census region: {dupes}")
    codes = set(STATE_ABBR.values())
    missing = codes - set(seen)
    if missing:
        fails.append(f"states with no census region: {sorted(missing)}")
    if census_region("IL") != "midwest" or census_region("VA") != "south":
        fails.append("census_region mis-assigns a known state")
    if census_region(None) is not None or census_region("ZZ") is not None:
        fails.append("census_region must return None for an unknown state")

    # 17. Every mandate state in config must be a real state code, or the
    # mandate flag silently reads 0 for a jurisdiction that has a law.
    mandates = SCOPE.get("pay_mandate_states") or {}
    for code in mandates:
        if str(code).upper() not in codes:
            fails.append(f"pay_mandate_states has a non-state code: {code!r}")
        elif census_region(str(code)) is None:
            fails.append(f"mandate state {code} has no census region")


    # 18. The remote fallback must require POSITIVE evidence of US scope.
    # Found 2026-09-21 in the first national run: a Warsaw role entered the US
    # sample twice at $309,500 — the highest-paid observation in it — because
    # "Remote Location - PL; POL Warsaw" resolved to no US state, read as
    # remote, and fell into "nationwide remote". A Dammam role came the same
    # way. Every string here is verbatim from that run.
    for loc in ("Remote Location - PL; POL Warsaw",
                "Warsaw; Remote Location - PL",
                "Dammam, Eastern Region, Saudi Arabia"):
        if is_us_remote(loc):
            fails.append(f"foreign remote accepted as US: {loc!r}")
        got = resolve(loc, active_metros(), GAZ)
        if got.metro is not None:
            fails.append(f"foreign posting {loc!r} resolved to {got.metro}")

    # Genuine US remote forms must still be admitted, or the guard has simply
    # traded one silent error for another.
    for loc in ("US (Remote)", "Remote - US", "Remote, USA", "Remote",
                "Remote, United States", "(DEAI HV) US Remote DC"):
        if not is_us_remote(loc):
            fails.append(f"US remote wrongly rejected: {loc!r}")
        if resolve(loc, active_metros(), GAZ).metro != "remote_national":
            fails.append(f"{loc!r} should be remote_national")

    # A posting that names a US state is placed by that state, not swept into
    # the remote bucket just because its description mentions remote work.
    for loc, want_state in (("Dallas, TX; Remote", "TX"), ("Irving, Texas", "TX")):
        if resolve_us_state(loc) != want_state:
            fails.append(f"{loc!r} should resolve to {want_state}")
        if resolve(loc, active_metros(), GAZ).metro == "remote_national":
            fails.append(f"{loc!r} has a state and must not be remote_national")


    # 19. Multi-location postings, audit round 3. 24 of 138 rows list more than
    # one place, and mandate status must consider EVERY one: a pay-transparency
    # law attaches to the job's location, so a posting naming any covered place
    # is covered. Taking the first-listed state understated coverage on 9 rows,
    # seven of which had disclosed pay. Strings verbatim from the dataset.
    for loc, want in [
        ("US, Salt Lake City, UT; US, Indianapolis, IN; US, Dayton, OH",
         ["UT", "IN", "OH"]),
        ("Chicago, IL; Denver, CO", ["IL", "CO"]),
        ("Boston, MA, United States; Chicago, IL, United States", ["MA", "IL"]),
        ("Dallas, TX; Remote", ["TX"]),
        ("Chicago, IL", ["IL"]),
        ("Remote Location - PL; POL Warsaw", []),
        ("", []),
    ]:
        got = resolve_us_states(loc)
        if got != want:
            fails.append(f"resolve_us_states({loc[:44]!r}) = {got}, want {want}")

    # The single-state resolver must still agree with the first of the list, or
    # the two are reading the string differently and one of them is wrong.
    for loc in ("US, Salt Lake City, UT; US, Indianapolis, IN",
                "Chicago, IL; Denver, CO", "Chicago, IL"):
        multi = resolve_us_states(loc)
        if multi and resolve_us_state(loc) != multi[0]:
            fails.append(f"resolve_us_state disagrees with resolve_us_states on {loc!r}")

    # A mandate state anywhere in the list must be findable, which is the whole
    # point of the multi-state resolver.
    mand = {str(k).upper() for k in (SCOPE.get("pay_mandate_states") or {})}
    covered = resolve_us_states("US, Salt Lake City, UT; US, Denver, CO")
    if not (set(covered) & mand):
        fails.append("a listed mandate state (CO) was not found alongside UT")

    print(f"geo: {len(fails)} failure(s) across {len(GAZ)} gazetteer entries")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

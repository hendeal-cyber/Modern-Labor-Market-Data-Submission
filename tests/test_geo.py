"""Geo tests, including a typo-catcher for the seed gazetteer.

A wrong coordinate would silently exclude or wrongly include postings, so every
seeded place must sit within a sane distance of at least one study metro.
"""
import sys, pathlib, yaml
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
ROOT = pathlib.Path(__file__).resolve().parents[1]

from lmstudy.geo import haversine_miles, load_gazetteer, resolve, detect_arrangement

SCOPE = yaml.safe_load((ROOT / "config" / "scope.yaml").read_text())
METROS = SCOPE["metros"]
GAZ = load_gazetteer(ROOT / "data" / "gazetteer.json")

def all_metros():
    return {k: v for k, v in METROS.items()}

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

    # 4. Out-of-scope must NOT resolve.
    for loc in ["Redwood City, CA", "Dallas, TX", "Ashburn, VA", "New York, NY"]:
        got = resolve(loc, active_metros(), GAZ)
        if got.metro is not None:
            fails.append(f"resolve({loc!r}) wrongly in scope as {got.metro}")

    # 5. Tier 3 dormant: Ashburn resolves only when tier 3 is enabled.
    t3 = dict(active_metros())
    t3["northern_virginia"] = {**METROS["northern_virginia"], "enabled": True}
    if resolve("Ashburn, VA", t3, GAZ).metro != "northern_virginia":
        fails.append("Ashburn should resolve once tier 3 is enabled")

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

    print(f"geo: {len(fails)} failure(s) across {len(GAZ)} gazetteer entries")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

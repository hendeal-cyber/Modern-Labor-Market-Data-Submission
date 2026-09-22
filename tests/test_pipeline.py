"""End-to-end pipeline test over fixture snapshots.

Asserts the exact selection funnel so a regression in any screen shows up as a
changed count rather than a silently different sample.
"""
import sys, pathlib, csv, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
ROOT = pathlib.Path(__file__).resolve().parents[1]
from lmstudy.build_dataset import build

KEEP_WITH_PAY = {"ComEd", "Exelon", "Equinix", "AES Indiana", "Invenergy", "DataBank"}

def check_nested_repost_collapse():
    """A repost of one job collapses; the same job in several cities does not.

    Both cases share an employer, a title and a byte-identical description,
    so a description-hash rule cannot tell them apart -- it would have
    collapsed 38 groups in the real corpus, among them Nexamp's
    `Senior Interconnection Engineer` open in four separate cities, to fix
    the single Tract repost. Nesting is what distinguishes them, and both
    cases below are taken verbatim from data/raw/.
    """
    import sys, pathlib as _p
    sys.path.insert(0, str(_p.Path(__file__).resolve().parents[1] / "src"))
    from lmstudy.build_dataset import collapse_nested_reposts

    fails = []

    # Tract requisitions 4343777009 and 4372165009: identical description,
    # identical pay, and the second's locations are a strict subset.
    rows = {
        "a": {"employer": "Tract", "title": " Director, Utility Development",
              "description_hash": "f8c94b2f1ab9c663"},
        "b": {"employer": "Tract", "title": " Director, Utility Development",
              "description_hash": "f8c94b2f1ab9c663"},
    }
    locs = {
        "a": "Alexandria, Virginia, United States; Denver, Colorado, "
             "United States; Remote US",
        "b": "Alexandria, Virginia, United States; Remote US",
    }
    dropped = collapse_nested_reposts(rows, locs)
    if dropped != 1:
        fails.append(f"nested Tract repost: dropped {dropped}, want 1")
    if "a" not in rows:
        fails.append("the superset posting must be the one kept")
    if "b" in rows:
        fails.append("the subset repost must be the one dropped")

    # Nexamp's Senior Interconnection Engineer: one description, four cities,
    # no nesting. Four real openings, and they must all survive.
    cities = ["Boston, MA", "Chicago, IL", "New York, NY", "Washington, DC"]
    rows = {c: {"employer": "Nexamp", "title": "Senior Interconnection Engineer",
                "description_hash": "deadbeefdeadbeef"} for c in cities}
    locs = {c: c for c in cities}
    dropped = collapse_nested_reposts(rows, locs)
    if dropped != 0:
        fails.append(f"disjoint multi-city posting collapsed {dropped} rows")
    if len(rows) != 4:
        fails.append(f"multi-city openings: {len(rows)} rows survive, want 4")

    # A different employer with the same title and description is never a
    # repost, however its locations nest.
    rows = {
        "a": {"employer": "Nexamp", "title": "Analyst",
              "description_hash": "aaaa"},
        "b": {"employer": "Voltus", "title": "Analyst",
              "description_hash": "aaaa"},
    }
    locs = {"a": "Boston, MA; Chicago, IL", "b": "Boston, MA"}
    if collapse_nested_reposts(rows, locs) != 0:
        fails.append("rows from different employers must never collapse")

    return fails


def check_mandate_dates_in_dataset():
    """Every row's mandate_state matches the DATED mandate table.

    Checked against the committed postings.csv, not a fixture. Audit round 6
    found the table's effective dates were never read, so Connecticut, whose
    posting rule starts 2026-10-01, covered six rows collected in September.
    """
    import csv, pathlib, yaml
    from lmstudy.build_dataset import mandate_effective_dates, mandates_in_force
    root = pathlib.Path(__file__).resolve().parents[1]
    scope = yaml.safe_load((root / "config" / "scope.yaml").read_text())
    dates = mandate_effective_dates(scope)
    fails = []
    path = root / "data" / "analysis" / "postings.csv"
    for row in csv.DictReader(path.open(encoding="utf-8")):
        in_force = mandates_in_force(dates, row["first_seen_run"])
        listed = {s for s in (row["states_listed"] or "").split(";") if s}
        listed.add(row["state"])
        want = int(bool(listed & in_force))
        if int(row["mandate_state"]) != want:
            fails.append(f"mandate_state={row['mandate_state']} want {want}: "
                         f"{row['employer']} | {row['title'][:40]} [{row['states_listed']}]")
    return fails[:5]


def check_verified_workday_pins():
    """Every hand-verified Workday entry pins an instance the prober reads.

    Checked against the real config/employers.yaml. Eight verified entries
    wrote `instance: wdN` where the prober read only `wd`, so their pins were
    ignored without any error (audit round 6).
    """
    import pathlib, yaml
    from lmstudy.collect.discover import pinned_workday_instance
    root = pathlib.Path(__file__).resolve().parents[1]
    cfg = yaml.safe_load((root / "config" / "employers.yaml").read_text())
    fails = []
    for group, entries in cfg.items():
        if not isinstance(entries, list):
            continue
        for e in entries:
            if not isinstance(e, dict) or not e.get("verified"):
                continue
            for tok in (e.get("candidates") or {}).get("workday") or []:
                if pinned_workday_instance(tok) is None:
                    fails.append(f"verified Workday entry {e['name']!r} pins no "
                                 f"instance the prober reads: {tok}")
    for tok, want in (({"wd": 5}, 5), ({"instance": "wd3"}, 3), ({}, None),
                      ("tenant", None)):
        if pinned_workday_instance(tok) != want:
            fails.append(f"pinned_workday_instance({tok!r}) != {want}")
    return fails


def run():
    fails = []
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp)
        report = build(ROOT / "tests" / "fixtures" / "raw", out, ROOT / "config")
        f = report["funnel"]

        # unique_in_scope rose from 7 to 8 when admit_unstated_experience was
        # turned on: the "Data Engineer" fixture states no minimum and carries
        # no entry-level title cue, so it is now kept and controlled for rather
        # than dropped. It still has no pay, so usable_with_pay is unchanged.
        expect = {"raw": 14, "rejected_screen": 3, "rejected_geo": 0,
                  "duplicate_sighting": 1, "unique_in_scope": 10, "usable_with_pay": 8}
        for key, want in expect.items():
            if f.get(key) != want:
                fails.append(f"funnel[{key}]={f.get(key)} want {want}")

        rows = list(csv.DictReader((out / "postings.csv").open()))
        by_title = {r["title"]: r for r in rows}

        # Rejections must be absent. "Senior Software Engineer" left this list
        # on 2026-09-21: seniority became a regressor, so it is admitted and
        # ranked. Role and internship screens still exclude.
        for gone in ["Data Center Critical Facilities Technician",
                     "Software Engineering Intern", "Network Engineer"]:
            if gone in by_title:
                fails.append(f"{gone!r} should have been screened out")

        # ...and the senior role must be PRESENT, correctly ranked. Simply
        # removing it from the list above would not catch it being admitted
        # with a default rank.
        senior = by_title.get("Senior Software Engineer")
        if not senior:
            fails.append("'Senior Software Engineer' should be admitted and ranked now")
        elif senior.get("seniority_rank") != "3" or senior.get("early_career") != "0":
            fails.append(f"senior role ranked {senior.get('seniority_rank')} "
                         f"early_career={senior.get('early_career')}")

        # National scope: the Dallas posting must now appear, carrying its own
        # state and a mandate flag of 0 (Texas has no posting-level mandate).
        dallas = [r for r in rows if r.get("state") == "TX"]
        if not dallas:
            fails.append("national scope: the Dallas posting should be present")
        elif dallas[0].get("mandate_state") != "0" or dallas[0].get("census_region") != "south":
            fails.append(f"Dallas row: mandate={dallas[0].get('mandate_state')} "
                         f"region={dallas[0].get('census_region')}")
        # Non-US must still be excluded under national scope.
        for r in rows:
            if (r.get("state") or "") == "" and r.get("metro") not in ("remote_national", ""):
                continue

        # Hourly annualization: $30-$38/hr -> midpoint 34 * 2080 = 70,720
        grad = by_title.get("Data Analyst - New Grad")
        if not grad or abs(float(grad["pay_midpoint"]) - 34.0 * 2080) > 1:
            fails.append(f"hourly annualization wrong: {grad and grad['pay_midpoint']}")
        if grad and grad["hourly_original"] != "1":
            fails.append("hourly_original flag not set")

        # Structured compensation path.
        ae = by_title.get("Analytics Engineer")
        if not ae:
            fails.append("Analytics Engineer (structured comp) missing")
        elif ae["pay_source"] != "structured" or abs(float(ae["pay_midpoint"]) - 99000) > 1:
            fails.append(f"structured comp wrong: source={ae['pay_source']} mid={ae['pay_midpoint']}")

        # Non-disclosure retained in dataset but flagged.
        nd = sorted(r["employer"] for r in rows if r["pay_disclosed"] == "0")
        if nd != ["Exelon", "Nicor Gas"]:
            fails.append(f"expected non-disclosing rows [Exelon, Nicor Gas], got {nd}")

        # Indianapolis row must carry mandate_state = 0.
        indy = [r for r in rows if r["metro"] == "indianapolis"]
        if not indy or indy[0]["mandate_state"] != "0":
            fails.append("Indianapolis row should have mandate_state=0")
        chi = [r for r in rows if r["metro"] == "chicago"]
        if not chi or chi[0]["mandate_state"] != "1":
            fails.append("Chicago row should have mandate_state=1")

        # Regressors coded on a kept row.
        de = next((r for r in rows if r["title"] == "Data Engineer I"
                   and r["employer"] == "ComEd"), None)
        for reg in ["degree_required", "skill_python_r", "skill_sql", "benefit_health",
                    "benefit_retirement", "benefit_bonus", "soft_teamwork"]:
            if de and de.get(reg) != "1":
                fails.append(f"Data Engineer I {reg}={de.get(reg)} want 1")

        # role_family and job_level are populated on every row.
        for r in rows:
            if not r.get("role_family"):
                fails.append(f"role_family missing on {r['title']!r}")
            if r.get("job_level") in (None, ""):
                fails.append(f"job_level missing on {r['title']!r}")
        if de and de.get("role_family") != "software_data":
            fails.append(f"Data Engineer I role_family={de.get('role_family')}")
        if de and de.get("job_level") != "1":
            fails.append(f"Data Engineer I job_level={de.get('job_level')} want 1")

        # The diversified-employer guard drops other lines of business.
        from lmstudy.build_dataset import off_umbrella
        if not off_umbrella({"diversified": True, "off_umbrella": ["warehouse"],
                             "title": "Warehouse Associate"}):
            fails.append("guard should drop a warehouse role at a diversified employer")
        if off_umbrella({"diversified": True, "off_umbrella": ["warehouse"],
                         "title": "Data Center Technician"}):
            fails.append("guard must not drop an in-umbrella role")
        if off_umbrella({"title": "Warehouse Associate"}):
            fails.append("guard must only apply to employers flagged diversified")
        # Word-bounded: Hitachi Energy's list holds "rail" and Iron Mountain's
        # holds "mail", which as substrings catch "trail" and "email".
        if off_umbrella({"diversified": True, "off_umbrella": ["rail", "mail"],
                         "title": "Email Platform Engineer, Grid Trail Analytics"}):
            fails.append("off_umbrella matched inside a word (substring match)")
        if not off_umbrella({"diversified": True, "off_umbrella": ["rail"],
                             "title": "Rail Signalling Engineer"}):
            fails.append("off_umbrella must still match the whole word")

        # Dedup collapsed the repeated posting. The fixture holds three
        # "Data Engineer I" rows: two at ComEd/Chicago which are the same job
        # posted twice, and one at Digital Realty/Dallas which is a different
        # job that national scope now admits. Keying on title alone would read
        # the Dallas row as a dedup failure, which is what it did.
        comed = [r for r in rows if r["title"] == "Data Engineer I"
                 and r["employer"] == "ComEd"]
        if len(comed) != 1:
            fails.append(f"duplicate ComEd posting not collapsed: {len(comed)} rows")
        dr = [r for r in rows if r["title"] == "Data Engineer I"
              and r["employer"] == "Digital Realty"]
        if len(dr) != 1:
            fails.append("a different employer's posting must not be deduped away")

    fails += check_nested_repost_collapse()
    fails += check_mandate_dates_in_dataset()
    fails += check_verified_workday_pins()

    print(f"pipeline: {len(fails)} failure(s)")
    for x in fails:
        print("  FAIL", x)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

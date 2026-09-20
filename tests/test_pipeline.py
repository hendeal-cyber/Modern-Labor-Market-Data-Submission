"""End-to-end pipeline test over fixture snapshots.

Asserts the exact selection funnel so a regression in any screen shows up as a
changed count rather than a silently different sample.
"""
import sys, pathlib, csv, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
ROOT = pathlib.Path(__file__).resolve().parents[1]
from lmstudy.build_dataset import build

KEEP_WITH_PAY = {"ComEd", "Exelon", "Equinix", "AES Indiana", "Invenergy", "DataBank"}

def run():
    fails = []
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp)
        report = build(ROOT / "tests" / "fixtures" / "raw", out, ROOT / "config")
        f = report["funnel"]

        expect = {"raw": 14, "rejected_screen": 5, "rejected_geo": 1,
                  "duplicate_sighting": 1, "unique_in_scope": 7, "usable_with_pay": 6}
        for key, want in expect.items():
            if f.get(key) != want:
                fails.append(f"funnel[{key}]={f.get(key)} want {want}")

        rows = list(csv.DictReader((out / "postings.csv").open()))
        by_title = {r["title"]: r for r in rows}

        # Rejections must be absent.
        for gone in ["Data Center Critical Facilities Technician", "Senior Software Engineer",
                     "Software Engineering Intern", "Network Engineer"]:
            if gone in by_title:
                fails.append(f"{gone!r} should have been screened out")

        # Dallas posting must not appear.
        if any(r["metro"] not in ("chicago", "indianapolis") for r in rows):
            fails.append("out-of-metro posting present")

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
        nd = [r for r in rows if r["pay_disclosed"] == "0"]
        if len(nd) != 1 or nd[0]["employer"] != "Nicor Gas":
            fails.append(f"expected one non-disclosing row (Nicor Gas), got {[r['employer'] for r in nd]}")

        # Indianapolis row must carry mandate_state = 0.
        indy = [r for r in rows if r["metro"] == "indianapolis"]
        if not indy or indy[0]["mandate_state"] != "0":
            fails.append("Indianapolis row should have mandate_state=0")
        chi = [r for r in rows if r["metro"] == "chicago"]
        if not chi or chi[0]["mandate_state"] != "1":
            fails.append("Chicago row should have mandate_state=1")

        # Regressors coded on a kept row.
        de = by_title.get("Data Engineer I")
        for reg in ["degree_required", "skill_python_r", "skill_sql", "benefit_health",
                    "benefit_retirement", "benefit_bonus", "soft_teamwork"]:
            if de and de.get(reg) != "1":
                fails.append(f"Data Engineer I {reg}={de.get(reg)} want 1")

        # Dedup collapsed the repeated posting.
        if sum(1 for r in rows if r["title"] == "Data Engineer I") != 1:
            fails.append("duplicate posting was not collapsed")

    print(f"pipeline: {len(fails)} failure(s)")
    for x in fails:
        print("  FAIL", x)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

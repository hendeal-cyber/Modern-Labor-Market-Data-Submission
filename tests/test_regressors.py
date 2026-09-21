"""Regressor coding tests, including known false-positive traps."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from lmstudy.code_regressors import load_dictionary, code_posting

D = load_dictionary()

POSTING = """
Data Engineer I - ComEd

We are seeking an early career Data Engineer to join our analytics team.

Requirements:
- Bachelor's degree in Computer Science, Information Systems, or a related
  quantitative field
- 2+ years of experience building data pipelines
- Proficiency in Python and SQL; experience with Apache Spark and Airflow
- Experience with AWS or Azure
- Strong communication skills and the ability to collaborate in a
  cross-functional team environment
- Must be authorized to work in the United States; we will not sponsor

Benefits: medical, dental and vision insurance, 401(k) with company match,
annual incentive bonus, paid time off and paid holidays, tuition reimbursement.

The salary range for this position is $85,000 - $105,000 annually.
"""

EXPECT_1 = ["degree_required", "degree_stem", "skill_python_r", "skill_sql",
            "skill_cloud", "skill_big_data", "soft_teamwork", "soft_communication",
            "benefit_health", "benefit_retirement", "benefit_bonus",
            "benefit_paid_leave", "benefit_tuition", "sponsorship_unavailable"]
EXPECT_0 = ["advanced_degree_pref", "security_clearance", "union_role",
            "benefit_relocation", "travel_required", "skill_ml_ai", "on_call"]

TRAPS = [
    # (text, regressor, expected, label)
    ("Our R&D group builds internal tools.", "skill_python_r", 0,
     "R&D must not be read as the R language"),
    ("We invest heavily in R&D and machine learning.", "skill_ml_ai", 1,
     "machine learning still detected alongside R&D"),
    ("A bachelor's degree is preferred but not required.", "degree_required", 0,
     "negation suppresses degree_required"),
    ("High school diploma or equivalent required.", "degree_required", 0,
     "high-school-only posting is not a degree requirement"),
    ("Master's degree in Statistics required.", "advanced_degree_pref", 1,
     "advanced degree detected"),
    ("Relocation assistance is available for this role.", "benefit_relocation", 1,
     "relocation benefit"),
    ("This position is covered by the IBEW collective bargaining agreement.",
     "union_role", 1, "union role"),
    # --- Regressions from audit round 1, all found in real collected postings.
    # Company boilerplate is about the firm, not the job, and it repeats across
    # every posting an employer publishes, so a false positive here is
    # perfectly correlated within employer and looks like an employer effect.
    ("Cologix's experienced leadership team, certified staff and commitment to "
     "ESG initiatives help form a culture that values our people.",
     "certification_req", 0, "boilerplate 'certified staff' is not a requirement"),
    ("Cologix's experienced leadership team, certified staff and commitment to "
     "ESG initiatives help form a culture that values our people.",
     "soft_leadership", 0, "boilerplate 'leadership team' is not a requirement"),
    ("helping our customers define and deliver their own unique vision for the Edge",
     "benefit_health", 0, "'vision' in a company blurb is not a health benefit"),
    # The same regressors must still fire when genuinely required.
    ("Demonstrated leadership experience and the ability to mentor junior engineers.",
     "soft_leadership", 1, "leadership genuinely asked of the applicant"),
    ("AWS Certified Solutions Architect certification required.",
     "certification_req", 1, "certification genuinely required"),
    ("Benefits include medical, dental and vision insurance.",
     "benefit_health", 1, "vision named as an actual benefit"),
]


def sector_gate_cases():
    """The sector gate must reject the wrong-company matches that got through.

    Each of these was admitted by slug discovery and caught on inspection.
    The first version of the gate substring-matched generic words and let the
    AI startup through at 43%.
    """
    import sys, pathlib as _p
    sys.path.insert(0, str(_p.Path(__file__).resolve().parents[1] / "src"))
    from lmstudy.collect.discover import sector_ok, sector_confidence
    from lmstudy.collect.ats import RawPosting

    def board(*texts):
        return [RawPosting("x", "y", "z", str(i), t, "", d, "")
                for i, (t, d) in enumerate(texts)]

    fails = []
    # The AI startup: ML vocabulary that tripped the old substring terms.
    ai = board(
        ("Research Scientist", "architecting pipelines for transforming data"),
        ("Research Engineer", "write research code, dataloaders, evaluation harnesses"),
        ("Office & Operations Manager", "building management, hvac maintenance, isps, and utility providers"),
        ("Senior Software Engineer", "train and serve our next-generation models"),
    )
    if sector_ok(ai):
        fails.append(f"AI startup board admitted at {sector_confidence(ai):.0%}")
    # Public-transit software, which arrived as "Via Renewables".
    transit = board(
        ("Dispatcher", "Via is on a mission to create public transportation systems"),
        ("Field Operations Manager", "transit networks, smart, data-driven digital networks"),
    )
    if sector_ok(transit):
        fails.append("public-transit board admitted")
    # A real energy board must still pass.
    energy = board(
        ("Associate, Renewable Development", "solar and wind farm development, interconnection queue, megawatt scale"),
        ("Analyst, Compliance", "NERC compliance, substation records, transmission line outage management"),
    )
    if not sector_ok(energy):
        fails.append("real energy board rejected")
    return fails


def run():
    fails = []
    coded = code_posting("Data Engineer I", POSTING, D)
    for name in EXPECT_1:
        if coded.values.get(name) != 1:
            fails.append(f"{name} should be 1, got {coded.values.get(name)}")
    for name in EXPECT_0:
        if coded.values.get(name) != 0:
            fails.append(f"{name} should be 0, got {coded.values.get(name)} "
                         f"(matched {coded.evidence[name]['matched']!r})")
    for text, reg, want, label in TRAPS:
        got = code_posting("", text, D).values.get(reg)
        if got != want:
            ev = code_posting("", text, D).evidence[reg]
            fails.append(f"[{label}] {reg}={got} want {want} evidence={ev}")

    fails.extend(sector_gate_cases())

    total = len(EXPECT_1) + len(EXPECT_0) + len(TRAPS) + 3
    print(f"regressors: {total-len(fails)}/{total} passed ({len(D)} regressors in dictionary)")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)


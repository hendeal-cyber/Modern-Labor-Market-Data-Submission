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
]

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

    total = len(EXPECT_1) + len(EXPECT_0) + len(TRAPS)
    print(f"regressors: {total-len(fails)}/{total} passed ({len(D)} regressors in dictionary)")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

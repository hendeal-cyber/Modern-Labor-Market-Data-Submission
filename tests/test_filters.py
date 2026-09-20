"""Screening tests: role, seniority, experience parsing, internships."""
import sys, pathlib, yaml
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
ROOT = pathlib.Path(__file__).resolve().parents[1]
from lmstudy.filters import screen_role, screen_early_career, screen_internship, extract_years

CFG = yaml.safe_load((ROOT / "config" / "scope.yaml").read_text())

ROLE_KEEP = ["Software Engineer I", "Associate Data Scientist", "Data Engineer",
             "Business Intelligence Developer", "Analytics Engineer",
             "Junior Full Stack Developer", "Machine Learning Engineer"]
ROLE_DROP = ["Data Center Critical Facilities Technician", "Network Engineer",
             "Electrical Engineer - Substation", "IT Support Specialist",
             "Cybersecurity Analyst", "Account Executive", "HVAC Technician",
             "Lineman Apprentice", "Financial Analyst"]

SENIOR_DROP = ["Senior Software Engineer", "Staff Data Scientist",
               "Principal Software Engineer", "Engineering Manager",
               "Lead Data Engineer", "Director of Analytics"]

YEARS = [
    ("Requires 2+ years of experience with Python.", 2),
    ("Minimum of 5 years of relevant experience required.", 5),
    ("3-5 years of professional experience.", 3),
    ("A 4-year degree in Computer Science is required.", None),   # degree, not experience
    ("No prior experience is required for this entry-level role.", 0),
    ("Build dashboards for the analytics team.", None),
]

def run():
    fails = []
    for t in ROLE_KEEP:
        if not screen_role(t, "", CFG).passed:
            fails.append(f"role should KEEP {t!r}: {screen_role(t,'',CFG).reason}")
    for t in ROLE_DROP:
        if screen_role(t, "", CFG).passed:
            fails.append(f"role should DROP {t!r}")
    for t in SENIOR_DROP:
        if screen_early_career(t, "2+ years experience", CFG).passed:
            fails.append(f"seniority should DROP {t!r}")

    for text, want in YEARS:
        got, _ = extract_years(text)
        if got != want:
            fails.append(f"extract_years({text!r}) -> {got} want {want}")

    # Early career decisions
    cases = [
        ("Software Engineer I", "Requires 2 years of experience.", True, "2yr ok"),
        ("Software Engineer", "Requires 7+ years of experience.", False, "7yr too high"),
        ("Associate Data Scientist", "Join our team.", True, "title signal, no years"),
        ("Data Engineer", "Build pipelines.", False, "no signal at all"),
        ("Data Analyst - New Grad", "Exciting opportunity.", True, "new grad signal"),
        # Regression: " i " must match the roman numeral in "Engineer I",
        # NOT the letter i inside "engineer". Substring matching passed
        # every posting here before word boundaries were enforced.
        ("Software Engineer I", "Join the platform team.", True, "roman numeral I"),
        ("Software Engineer", "Join the platform team.", False, "bare title must not match ' i '"),
        ("Data Scientist II", "Build models.", True, "roman numeral II"),
        ("Data Architect III", "Own the design.", False, "III is a seniority exclusion"),
    ]
    for title, desc, want, label in cases:
        got = screen_early_career(title, desc, CFG)
        if got.passed != want:
            fails.append(f"early_career[{label}] -> {got.passed} want {want} ({got.reason})")

    # Internships
    intern_cases = [
        ("Software Engineering Intern", "Summer 2026 internship.", False, "intern in title"),
        ("Data Science Co-op", "Six month co-op.", False, "co-op"),
        ("Rotational Development Program - Data", "Full time program.", True, "rotational kept"),
        ("Software Engineer I", "Prior internship experience preferred.", True,
         "internship only as prior-experience preference"),
    ]
    for title, desc, want, label in intern_cases:
        got = screen_internship(title, desc, CFG)
        if got.passed != want:
            fails.append(f"internship[{label}] -> {got.passed} want {want} ({got.reason})")

    total = len(ROLE_KEEP)+len(ROLE_DROP)+len(SENIOR_DROP)+len(YEARS)+len(cases)+len(intern_cases)
    print(f"filters: {total-len(fails)}/{total} passed")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

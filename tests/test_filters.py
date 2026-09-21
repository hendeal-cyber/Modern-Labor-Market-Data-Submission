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

# Audit round 2, 2026-09-21. Every title here is REAL — read out of
# data/analysis/postings.csv, not invented — and every one of them reached a
# live measurement wrongly. The four that were kept were ranks 1, 7, 8 and 11
# by pay in a 42-row sample whose median was $85,750, so between them they
# pulled the mean up 4.2% and the median up 6.1%.
AUDIT_ROUND_2 = [
    # (title, must_be_kept, expected_family_or_None)
    # Seniority: the roman-numeral list stopped at IV.
    ("Environmental Analyst V (Construction Stormwater) - Denver, CO", False, None),
    ("Analyst VI", False, None),
    # "lead" is word-bounded and never matched "Leader".
    ("NERC Operations Team Leader", False, None),
    # Security was named out of scope from the start but never encoded; this
    # entered on a bare "ai" match at $148,500, the top of the sample.
    ("AI Cybersecurity Engineer", False, None),
    ("Information Security Analyst", False, None),
    # Drafting, not geospatial analytics, and it was the ONLY gis observation.
    ("CAD Designer", False, None),
    # Family order: siting_dev's bare "acquisition" beat market_commercial.
    ("Mergers and Acquisitions Associate", True, "market_commercial"),
    # software_data had "analytics" but not "data analyst", so this fell to
    # the catch-all "other" bucket.
    ("Data Analyst - AMLD", True, "software_data"),
]

# Roles that must survive all of the above. Tightening a screen is only correct
# if it does not take the real sample with it.
AUDIT_ROUND_2_KEEP = [
    ("Associate, Renewable Development", "siting_dev"),
    ("Analyst, Compliance", "regulatory"),
    ("Market Analyst", "market_commercial"),
    ("Data Engineer II", "software_data"),
    ("GIS Analyst", "gis"),
    ("Grid Integration Engineer I", "grid_power"),
]


def audit_round_2_cases(config):
    """Bugs found by hand-reading role_family against real collected titles."""
    import sys, pathlib as _p
    sys.path.insert(0, str(_p.Path(__file__).resolve().parents[1] / "src"))
    from lmstudy.build_dataset import role_family

    fails = []
    for title, keep, family in AUDIT_ROUND_2 + [(t, True, f) for t, f in AUDIT_ROUND_2_KEEP]:
        role = screen_role(title, "", config)
        early = screen_early_career(title, "", config)
        kept = role.passed and early.passed
        if kept != keep:
            why = role.reason or early.reason or "kept"
            fails.append(f"audit2: {title!r} kept={kept} want={keep} ({why})")
            continue
        if keep and family and role_family(title) != family:
            fails.append(f"audit2: {title!r} family={role_family(title)} want {family}")
    return fails


def run():
    fails = []

    # Regression, asserted at the matcher rather than through the screen:
    # " i " must match the roman numeral in "Engineer I" and NOT the letter i
    # inside "engineer". Substring matching once passed every posting here.
    from lmstudy.filters import _matches, _norm
    if _matches(_norm("Software Engineer"), " i "):
        fails.append("' i ' must not match the i inside 'engineer'")
    if not _matches(_norm("Software Engineer I"), " i "):
        fails.append("' i ' must match the roman numeral in 'Engineer I'")

    # With the config flag off, the strict behaviour must still hold.
    import copy
    strict = copy.deepcopy(CFG)
    strict["early_career"]["admit_unstated_experience"] = False
    if screen_early_career("Data Engineer", "Build pipelines.", strict).passed:
        fails.append("strict mode must still reject unstated experience")
    if screen_early_career("Data Engineer", "Build pipelines.", strict).reason != "no_experience_signal":
        fails.append("strict mode should reject with no_experience_signal")

    # Job level is ordinal and highest-match-wins.
    from lmstudy.filters import extract_job_level
    for title, want in [("Grid Integration Engineer I", 1), ("Grid Integration Engineer II", 2),
                        ("Data Architect III", 3), ("Associate, Renewable Development", 1),
                        ("Geospatial Scientist", 0), ("Senior Associate, Capital Markets", 3)]:
        if extract_job_level(title) != want:
            fails.append(f"extract_job_level({title!r}) -> {extract_job_level(title)} want {want}")

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
        # admit_unstated_experience is on, so a posting with no stated minimum
        # is kept and yrs_exp_stated carries the imputation into the model.
        ("Data Engineer", "Build pipelines.", True, "unstated experience admitted"),
        ("Data Analyst - New Grad", "Exciting opportunity.", True, "new grad signal"),
        # Regression: " i " must match the roman numeral in "Engineer I",
        # NOT the letter i inside "engineer". Substring matching passed
        # every posting here before word boundaries were enforced.
        ("Software Engineer I", "Join the platform team.", True, "roman numeral I"),
        ("Software Engineer", "Join the platform team.", True, "unstated, admitted"),
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
        # Regression: matching is word-bounded, so the plural needs its own
        # entry. This exact title reached a live measurement before the fix.
        ("2027 Summer Internships - Electrical Engineering", "Apply now.", False,
         "plural 'Internships' in title"),
        ("Data Science Interns - Summer 2027", "Apply now.", False,
         "plural 'Interns' in title"),
        ("Engineering Apprenticeship Program", "Apply now.", False,
         "apprenticeship"),
    ]
    for title, desc, want, label in intern_cases:
        got = screen_internship(title, desc, CFG)
        if got.passed != want:
            fails.append(f"internship[{label}] -> {got.passed} want {want} ({got.reason})")

    fails += audit_round_2_cases(CFG)
    total = (len(ROLE_KEEP)+len(ROLE_DROP)+len(SENIOR_DROP)+len(YEARS)+len(cases)
             +len(intern_cases)+len(AUDIT_ROUND_2)+len(AUDIT_ROUND_2_KEEP))
    print(f"filters: {total-len(fails)}/{total} passed")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

"""Screening tests: role, seniority, experience parsing, internships."""
import sys, pathlib, yaml
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
ROOT = pathlib.Path(__file__).resolve().parents[1]
from lmstudy.filters import seniority_rank, is_early_career, is_level_range, screen_role, screen_early_career, screen_internship, extract_years

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
    # Seniority: these were the round-2 bugs, and the fix still matters even
    # though seniority no longer excludes. The numerals and "Leader" must be
    # RECOGNISED; before round 2 they were invisible, so under the national
    # rescope they would now be ranked entry level instead of merely admitted
    # wrongly. Their ranks are asserted in check_seniority_ranks below.
    ("Environmental Analyst V (Construction Stormwater) - Denver, CO", True, "sustainability"),
    ("Market Analyst VI", True, "market_commercial"),
    ("NERC Operations Team Leader", True, "regulatory"),
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


# Seniority as a rank, 2026-09-21. Admitting every level is only useful if the
# level is recorded correctly: if seniority_rank() returned the default for
# everything, the sample would look national and complete while the headline
# regressor was noise. Every title here is real, taken from collected data or
# from the manifests' title diagnostics.
SENIORITY_RANK_CASES = [
    ("Analyst I", 1), ("Associate, Development", 1), ("Data Analyst - New Grad", 1),
    ("Engineer I Interconnections & Grid Analysis", 1),
    ("Market Analyst", 2), ("Data Engineer II", 2), ("Grid Integration Engineer II", 2),
    ("Senior Interconnection Engineer", 3), ("Engineer III", 3),
    ("Environmental Analyst V (Construction Stormwater) - Denver, CO", 3),
    ("Market Analyst VI", 3),
    ("Staff Engineer, Thermal Engineering", 4), ("Principal, NERC Cybersecurity Compliance (CIP)", 4),
    ("NERC Operations Team Leader", 5), ("Manager of Thermal Development", 5),
    ("Director, Mechanical Engineering", 6), ("Sr. Project Manager, Geothermal Project Management", 5),
    ("Vice President, Origination", 7),
]


def check_seniority_ranks():
    fails = []
    for title, want in SENIORITY_RANK_CASES:
        got = seniority_rank(title)
        if got != want:
            fails.append(f"seniority_rank({title[:44]!r}) = {got}, want {want}")

    # An unlevelled title defaults to MID, not entry. Defaulting to entry would
    # bias the seniority coefficient toward zero across the whole unlevelled
    # majority of postings, which is most of them.
    if seniority_rank("Market Analyst") != 2 or seniority_rank("") != 2:
        fails.append("an unlevelled title must default to mid (2)")

    # The highest matching rank wins, so a compound title is not read down.
    if seniority_rank("Senior Director, Grid Strategy") != 6:
        fails.append("'Senior Director' must rank director (6), not senior (3)")

    # is_early_career preserves the original study question on the subsample.
    for rank, years, want in [
        (1, None, True), (1, 2, True), (2, 2, True), (2, None, False),
        (3, 2, False), (3, None, False), (2, 7, False), (5, 1, False),
    ]:
        if is_early_career(rank, years) != want:
            fails.append(f"is_early_career(rank={rank}, years={years}) "
                         f"= {is_early_career(rank, years)}, want {want}")
    return fails


# Audit round 3, 2026-09-21. Utilities routinely advertise several rungs in one
# requisition. seniority_rank took the highest match, so every one was ranked at
# its ceiling — biasing the headline regressor upward exactly where the
# advertised pay range is widest. Ranked at the FLOOR now: the level the
# employer will actually hire at, and the one the pay floor corresponds to.
# Averaging was rejected; a midpoint rank is a rung nobody is hired into.
# Every title is verbatim from the 141-row national dataset.
RANGE_TITLE_CASES = [
    # (title, expected rank, expected is_level_range)
    ("Resource Planning Analyst I or II or Senior", 1, True),
    ("Senior Resource Planning Analyst (or Resource Planning Analyst II or I)", 1, True),
    ("Data Scientist I or II (MAD-BS-OR)", 1, True),
    ("Analyst OR Senior Associate, Capital Markets", 1, True),
    ("(Sr.) (Lead) (Principal) Energy Analyst/Engineer (II)", 2, True),
    ("Senior/Principal Data Analyst", 3, True),
    ("Transmission Planning Engineer, or Staff, or Senior Engineer", 3, True),
    # NOT a range in this scheme: III and IV are both rank 3, so there is only
    # one rung advertised and the ceiling is the floor.
    ("Environmental Analyst III or IV - Amarillo, TX", 3, False),
    # Known limitation, recorded rather than papered over: an UNLEVELLED base
    # carries no token to match, so a range from unlevelled to senior cannot be
    # detected. Ranking senior is the conservative read.
    ("Data Analyst or Data Analyst Senior - AMLD", 3, False),
    # Ordinary titles must be untouched by any of this.
    ("Senior Interconnection Engineer", 3, False),
    ("Market Analyst", 2, False),
    ("Associate, Development", 1, False),
    ("Director, Mechanical Engineering", 6, False),
]


def check_range_titles():
    fails = []
    for title, want_rank, want_range in RANGE_TITLE_CASES:
        got = seniority_rank(title)
        if got != want_rank:
            fails.append(f"range rank({title[:48]!r}) = {got}, want {want_rank}")
        if is_level_range(title) != want_range:
            fails.append(f"is_level_range({title[:48]!r}) = "
                         f"{is_level_range(title)}, want {want_range}")
    # A slash that is not a level alternation must not read as a range.
    for title in ("Engineer, Grid Integration and Interconnection Services",
                  "Sustainability Data Lead, Global"):
        if is_level_range(title):
            fails.append(f"is_level_range wrongly True for {title!r}")
    return fails


# Round 3 also found three out-of-scope roles in the dataset, and one that was
# judged borderline and deliberately kept. Excluding the borderline one too
# would be a pattern broader than the finding justified.
AUDIT_ROUND_3_ROLES = [
    ("Corporate Counsel, Corporate & Capital Markets", False),
    ("Sr. Nuclear Instructor (Database Administrator)", False),
    ("Senior Security and Compliance Analyst", False),
    ("AI Data & Security Governance Engineer (MAD-BS-OR)", True),
    ("Analyst, Compliance", True),
    ("Senior Interconnection Engineer", True),
]


def check_audit_round_3_roles(config):
    fails = []
    for title, want in AUDIT_ROUND_3_ROLES:
        got = screen_role(title, "", config).passed
        if got != want:
            fails.append(f"audit3 role {title[:48]!r} kept={got} want={want}")
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
    # Seniority stopped being a filter on 2026-09-21 and became a regressor.
    # These titles are now ADMITTED, and what must be right is the rank: the
    # information has to be captured, not merely let through. A test that only
    # flipped the expectation to "passed" would not notice seniority_rank
    # silently returning the default for every one of them.
    for t in SENIOR_DROP:
        result = screen_early_career(t, "2+ years experience", CFG)
        if not result.passed:
            fails.append(f"seniority is a regressor now; should ADMIT {t!r}"
                         f" (reason {result.reason})")
        rank = seniority_rank(t)
        if rank < 3:
            fails.append(f"{t!r} should rank senior or above, got {rank}")
        if is_early_career(rank, 2):
            fails.append(f"{t!r} must not read as early career at rank {rank}")

    for text, want in YEARS:
        got, _ = extract_years(text)
        if got != want:
            fails.append(f"extract_years({text!r}) -> {got} want {want}")

    # Early career decisions
    cases = [
        ("Software Engineer I", "Requires 2 years of experience.", True, "2yr ok"),
        # Admitted now, with the years carried into the model rather than
        # used to exclude. is_early_career() is what keeps the original
        # question answerable on the subsample.
        ("Software Engineer", "Requires 7+ years of experience.", True, "7yr admitted, ranked"),
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
        ("Data Architect III", "Own the design.", True, "III admitted as rank 3"),
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
    fails += check_seniority_ranks()
    fails += check_range_titles()
    fails += check_audit_round_3_roles(CFG)
    total = (len(ROLE_KEEP)+len(ROLE_DROP)+len(SENIOR_DROP)+len(YEARS)+len(cases)
             +len(intern_cases)+len(AUDIT_ROUND_2)+len(AUDIT_ROUND_2_KEEP)
             +len(SENIORITY_RANK_CASES)+11
             +len(RANGE_TITLE_CASES)*2+2+len(AUDIT_ROUND_3_ROLES))
    print(f"filters: {total-len(fails)}/{total} passed")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

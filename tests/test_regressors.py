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


def check_workday_site_variants():
    """The site name NiSource actually uses must be among the ones probed.

    Run 35554269246 resolved 29 of 266 boards. NiSource was one of the misses,
    and not because it has no board: its declared candidates were
    "NiSource_Careers" and "careers", while the real board is
    nisource.wd1.myworkdayjobs.com/NiSource. Workday site paths are
    case-sensitive, so "nisource" would not have found it either.
    """
    import sys, pathlib as _p
    sys.path.insert(0, str(_p.Path(__file__).resolve().parents[1] / "src"))
    from lmstudy.collect.discover import workday_site_variants

    fails = []
    for tenant, employer, required in [
        ("nisource", "NiSource / NIPSCO", "NiSource"),
        ("misoenergy", "MISO (Midcontinent ISO)", "MISO"),
        ("invenergyllc", "Invenergy", "Invenergy"),
    ]:
        got = workday_site_variants(tenant, employer)
        if required not in got:
            fails.append(f"workday variants for {tenant} miss {required!r}: {got}")
        # The employer's own casing must be tried before the lowercased tenant,
        # since that is the form that actually resolves.
        if required in got and got.index(required) > 2:
            fails.append(f"{required!r} ranked too low for {tenant}: {got}")
    # "External" must stay among the probed sites: it is the site name of all
    # three employers in the frame whose Workday site is known -- Xcel Energy
    # (found only because of it), NRECA and Ameren. This pins that it is
    # probed at all, which is what matters; it is deliberately NOT a test of
    # its position, because measuring all 252 Workday tenants showed every one
    # reached it inside the limit under the old ordering too.
    for tenant, employer in [("ameren", "Ameren Illinois"),
                             ("nreca", "NRECA National Rural Electric Cooperative"),
                             ("xcelenergy", "Xcel Energy")]:
        got = workday_site_variants(tenant, employer)
        if "External" not in got:
            fails.append(f"'External' missing for {tenant}: {got}")
    if workday_site_variants("", "Nobody"):
        fails.append("a blank tenant must yield no variants")
    if len(set(workday_site_variants("acme", "Acme Power"))) != \
            len(workday_site_variants("acme", "Acme Power")):
        fails.append("workday variants must not repeat a site")
    return fails


def run():
    fails = []
    fails += check_workday_site_variants()
    fails += check_posting_sector_evidence()
    fails += check_no_board_collisions()
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

    total = len(EXPECT_1) + len(EXPECT_0) + len(TRAPS) + 3 + 5   # +5 workday site variants
    print(f"regressors: {total-len(fails)}/{total} passed ({len(D)} regressors in dictionary)")
    for f in fails:
        print("  FAIL", f)
    return len(fails)




def check_posting_sector_evidence():
    """Per-posting sector evidence for multi-sector consultancies.

    Audit round 4. Guidehouse supplied 65 in-scope rows -- 22% of the
    estimation sample -- of which three were energy work. Every case below is
    a REAL title from the committed snapshots, including each one that broke
    an earlier version of this test:

      * "Financial Transformation Business Analyst" passed on the STRONG_TERM
        "feeder", matching "feeder systems (procurement, travel, payroll,
        asset, grants)". `feeder` is now `distribution feeder`.
      * CRA's cybersecurity roles passed on "NERC-CIP" listed beside NIST,
        HIPAA, ISO 27001 and SOC2 -- generic cyber-compliance boilerplate.
      * CRA's "Management Advisory Analyst" passed on three distinct core
        sector words drawn from the firm's own practice-area boilerplate,
        which is audit round 1's failure mode exactly.
      * "Data Analyst/Power Platform" says "power" eleven times and is a
        Microsoft Power Platform role, which is why "power" cannot be
        title-sufficient.
    """
    import sys, pathlib as _p
    sys.path.insert(0, str(_p.Path(__file__).resolve().parents[1] / "src"))
    from lmstudy.collect.discover import posting_shows_sector as P

    fails = []
    admit = [
        "Associate Director - AI & Data, Energy Providers",
        "Data Scientist, Consultant (Utilities)",
        "Senior Consultant - Energy Markets",
        "Associate Principal/Utility Regulation and Finance (Energy practice)",
        "Principal/Transmission Strategy and Planning Expert  (Energy practice)",
        "Associate Principal/Wholesale Power Markets Consultant (Energy practice)",
        "Energy Analyst (Economics) - July 2027",
        "(2027 Bachelor's/Master's graduates) Management Advisory Analyst/Associate (Energy)",
    ]
    reject = [
        "Epidemiologist Data Scientist",
        "Public Health Data Engineer",
        "Data Scientist - National Security",
        "Federal Law Enforcement Data Analyst",
        "Fraud AI / Data Consultant",
        "ServiceNow Business Analyst",
        "Palantir Platform Engineer",
        "Data Analyst/Power Platform",
        "Financial Transformation Business Analyst",
        "Associate/Cybersecurity & Incident Response (Forensic Services practice)",
        "Senior Associate (Antitrust & Competition Economics practice)",
        "Analyst/Associate - Litigation (Life Sciences practice)",
        "Cloud and Health AI FinOps and Technology Value Optimization",
        "AI Strategy Associate Director - State Health",
        "(2028 Bachelor's/Master's graduates) Management Advisory Analyst/Associate Intern (Summer 2027)",
    ]
    for t in admit:
        if not P(t, ""):
            fails.append(f"sector evidence WRONGLY rejected: {t!r}")
    for t in reject:
        if P(t, ""):
            fails.append(f"sector evidence WRONGLY admitted: {t!r}")

    # The description must NOT be able to admit a posting on its own: it is the
    # firm's marketing, and every attempt to use it failed on real rows.
    boiler = ("CRA's Energy practice advises utilities on electric transmission, "
              "grid interconnection, megawatt-scale renewable energy and substation "
              "investment across power markets.")
    if P("Senior Associate/eDiscovery (Forensic Services practice)", boiler):
        fails.append("firm boilerplate in the description admitted a forensics role")

    # "feeder" must no longer be a standalone sector term.
    from lmstudy.collect.discover import has_strong_sector_term
    if has_strong_sector_term("assess feeder systems for procurement and payroll"):
        fails.append("'feeder' still matches a generic financial-systems posting")
    if not has_strong_sector_term("upgrade of the distribution feeder and switchyard"):
        fails.append("'distribution feeder' must still match real grid work")
    return fails




def check_no_board_collisions():
    """No board may be reachable by two employer entries.

    The frame carries parent/subsidiary pairs -- Ameren and Ameren Illinois,
    American Tower and CoreSite, Southern Company Gas and Nicor Gas, Enel North
    America and Enel X, the two American Waters -- and nothing stopped both
    members of a pair resolving the SAME board under two employer names. That
    would invent a second cluster out of one firm.

    It matters more than tidiness: `distinct_employers` is a FAILING
    pre-registered condition (25 against a target of 30), so a phantom cluster
    moves the number that decides whether the study met its own standard, in
    the flattering direction, without a single line of wrong arithmetic.

    Ameren was live when this was written: its entry carried tenant "ameren"
    unverified, and promoting "External" into the probed site names had just
    made it resolve the exact board hand-verified for Ameren Illinois.

    Resolution is explicit, not automatic -- the subordinate entry gets
    `duplicate_of` and no candidates -- so this test forces a decision rather
    than silently picking a winner.
    """
    import sys, pathlib as _p, collections, yaml
    root = _p.Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(root / "src"))
    from lmstudy.collect.discover import workday_site_variants

    cfg = yaml.safe_load((root / "config" / "employers.yaml").read_text())
    entries = [e for g, v in cfg.items() if isinstance(v, list)
               for e in v if isinstance(e, dict) and e.get("name")]
    pairs = collections.defaultdict(set)
    for e in entries:
        c = e.get("candidates") or {}
        for w in (c.get("workday") or []):
            if not isinstance(w, dict) or not w.get("tenant"):
                continue
            t = w["tenant"]
            sites = ([w.get("site")] if e.get("verified")
                     else workday_site_variants(t, e["name"]))
            for site in sites:
                pairs[("workday", t, site)].add(e["name"])
        for plat in ("greenhouse", "lever", "ashby", "workable",
                     "smartrecruiters", "recruitee"):
            for tok in (c.get(plat) or []):
                if isinstance(tok, str):
                    pairs[(plat, tok, None)].add(e["name"])

    fails = []
    for key, names in sorted(pairs.items()):
        if len(names) > 1:
            fails.append(f"board {key[0]}/{key[1]}/{key[2]} reachable by "
                         f"{sorted(names)} — give one `duplicate_of` and no "
                         f"candidates")
    return fails


if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

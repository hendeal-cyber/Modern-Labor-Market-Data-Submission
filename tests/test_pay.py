"""Pay parser tests built from real-world posting phrasings.

Cases mirror the formats Illinois postings actually use post-HB 3129, plus the
traps: hourly rates, k-suffixes, equity figures near the salary, and
non-disclosure language.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from lmstudy.pay import extract, from_text, from_structured

CASES = [
    # (description, expect_disclosed, expect_midpoint, label)
    ("The salary range for this position is $85,000 - $105,000 per year.",
     True, 95000, "standard annual range"),
    ("Base salary: $72,000.00 to $90,000.00 annually, plus bonus.",
     True, 81000, "decimal cents, 'to' separator"),
    ("Pay range: $95k–$120k",
     True, 107500, "k-suffix with en dash"),
    ("The hiring range for this role is $34.50 - $48.75 per hour.",
     True, (34.50 + 48.75) / 2 * 2080, "hourly annualized"),
    ("Compensation: $110,000 annually",
     True, 110000, "single figure in pay context"),
    ("We offer a competitive salary commensurate with experience.",
     False, None, "explicit non-disclosure"),
    ("Join our team building data pipelines. You will use Python and SQL.",
     False, None, "no pay mention at all"),
    ("Expected pay: $60,000 - $75,000. Equity: 5,000 - 10,000 options.",
     True, 67500, "equity figures must not hijack the parse"),
    ("Salary range $105,000 - $85,000",
     True, 95000, "reversed range is reordered"),
    ("Target pay is $28.00/hr",
     True, 28.0 * 2080, "single hourly figure"),
    ("Annual salary range: $1,200,000 - $1,500,000",
     False, None, "implausible magnitude rejected"),
    ("Benefits include a 401(k) with up to 6% match and a $1,000 signing bonus. "
     "The salary range for this position is $88,000 - $102,000 per year.",
     True, 95000, "bonus figure before the real range"),
    ("Our company serves 4,000,000 customers across 6 states. "
     "Salary: $70,000 - $80,000 annually.",
     True, 75000, "large unrelated number earlier in text"),
    ("Pay Transparency: The anticipated salary range for this position is "
     "$78,500.00 - $107,900.00. Actual pay will depend on experience.",
     True, 93200, "verbose IL-style transparency block"),
    ("Tuition reimbursement up to $5,250 per year. Base pay range: $92,000-$115,000.",
     True, 103500, "tuition figure with per-year marker nearby"),
    ("This role pays between $45.00 and $55.00 per hour depending on location.",
     True, 50.0 * 2080, "'between X and Y' hourly"),
    ("Relocation assistance of $10,000 available. Compensation is competitive.",
     False, None, "relocation figure must not be read as pay"),
]

def run():
    failures = []
    for text, want_disclosed, want_mid, label in CASES:
        got = from_text(text)
        if got.disclosed != want_disclosed:
            failures.append(f"[{label}] disclosed={got.disclosed} want={want_disclosed} note={got.note}")
            continue
        if want_mid is not None:
            if got.midpoint is None or abs(got.midpoint - want_mid) > 1.0:
                failures.append(f"[{label}] midpoint={got.midpoint} want={want_mid}")
    # Structured path
    s = from_structured(85000, 105000, "YEAR")
    if not (s.usable and abs(s.midpoint - 95000) < 1):
        failures.append(f"[structured annual] {s}")
    h = from_structured(40, 60, "HOUR")
    if not (h.usable and abs(h.midpoint - 50 * 2080) < 1 and h.hourly_original):
        failures.append(f"[structured hourly] {h}")
    inferred = from_structured(45, 65, None)
    if not (inferred.usable and inferred.hourly_original):
        failures.append(f"[structured unitless small -> hourly] {inferred}")
    # Structured wins over text
    both = extract("salary range $10,000 - $20,000", comp_min=90000, comp_max=110000, comp_interval="year")
    if not (both.usable and both.source == "structured" and abs(both.midpoint - 100000) < 1):
        failures.append(f"[structured precedence] {both}")

    total = len(CASES) + 4
    glued = check_glued_digits_and_cents()
    failures += glued
    total += 9   # the cases inside check_glued_digits_and_cents
    edge_fails, edge_total = check_window_edges()
    failures += edge_fails
    total += edge_total
    print(f"{total - len(failures)}/{total} pay tests passed")
    for f in failures:
        print("  FAIL", f)
    return len(failures)


def check_glued_digits_and_cents():
    """Numbers glued to letters or digits are not money.

    Two production failures, both found by reading the pay extremes after a
    rebuild, both from the same missing left boundary in the money token.

    1. AEP Energy writes "Compensation Grade:  SP20-010 Compensation Range:
       $116,255.00 - $177,503.00". The old pattern read "SP20-010" as the range
       20 to 010; both are under 1000, which the unit inference calls hourly,
       so six postings were annualized to $20,800-$41,600 with their true range
       in the very next clause. A "NERC Compliance Specialist Lead - Principal"
       was recorded at $31,200 against a true midpoint near $147,000.

    2. Worse, because it was silent: when the pay WINDOW starts mid-figure, the
       old pattern matched the CENTS of the first amount as the low bound --
       "00 - $170,000.00" parsed as (0, 170000) -- so the midpoint came out at
       exactly half the true high. That halved advertised pay on twelve
       Invenergy postings, and Invenergy is the largest employer in the study
       at 27% of the sample. $118,000-$170,000 was recorded as $85,000.

    Neither crashed, both produced confident wrong numbers, and the second
    moved the headline regressor.
    """
    from lmstudy.pay import from_text
    fails = []
    cases = [
        ("Compensation Grade:  SP20-010 Compensation Range:  $116,255.00 - $177,503.00",
         116255.0, 177503.0),
        ("Compensation Grade:  SP20-009 Compensation Range:  $116,255.00 - $151,132.50",
         116255.0, 151132.5),
        ("Base Pay  $118,000.00 - $170,000.00 USD Annual Bonus: 25% - 40%",
         118000.0, 170000.0),
        ("Base Pay  $100,000.00 - $120,000.00 USD Annual Bonus: 20% - 30%",
         100000.0, 120000.0),
        ("The estimated pay range for this role, if based in Colorado, is:  "
         "$88,963.50 - 136,067.00", 88963.5, 136067.0),
    ]
    for text, lo, hi in cases:
        r = from_text(text)
        got = (r.pay_min, r.pay_max) if r else (None, None)
        if got[0] is None or abs(got[0] - lo) > 0.01 or abs((got[1] or 0) - hi) > 0.01:
            fails.append(f"pay parse {text[:44]!r}: got {got}, want ({lo}, {hi})")

    r = from_text("00 - $170,000.00 USD")
    if r and r.pay_min == 0:
        fails.append("cents matched as a zero low bound: the halving bug is back")

    for junk in ("Job Posting End Date 09-24-2026 Please note",
                 "Requisition 20-006 apply today",
                 "Grade SP20-010 applies"):
        r = from_text(junk)
        if r and r.pay_min:
            fails.append(f"{junk[:34]!r} parsed as pay: {r.pay_min}-{r.pay_max}")
    return fails


def check_window_edges():
    """Real posting text, parsed through the full window machinery.

    check_glued_digits_and_cents() hands the parser a fragment directly, so it
    never exercised _pay_windows(), and it stayed green while the halving it
    was written for went on happening. The fragment is manufactured by the
    window slice: Invenergy's "$80,000.00 - $93,000.00" sits about 60
    characters before a later "compensation" cue, so the window opened at
    "0,000.00 - $93,000.00" and parsed (0, 93000). Fourteen Invenergy rows
    were at half pay in the N = 165 deliverables (seventeen in run 26),
    including the lowest-paid
    row, which audit round 5 read and accepted as "a genuine entry-level
    band". Found in audit round 6.

    The "k" cases are the same kind of confident wrong number: "$200-235k"
    read as (200, 235000) still gives a midpoint inside the plausible window.
    """
    from lmstudy.pay import from_text, MIN_PLAUSIBLE_BOUND
    fails = []
    invenergy = (
        "- Must be self-directed and driven, with the ability and desire to "
        "effectively lead.\n\nBase Pay\n\n$80,000.00 - $93,000.00 USD Annual\n"
        "Bonus: 20% - 30%\n\nThe base pay range reflects the minimum and maximum "
        "target salary for the position. Invenergy considers a number of factors "
        "when determining base pay offers such as the scope and responsibilities "
        "of the position and the candidate's experience, education and skills."
        "\n\nIn addition to base pay, the total annual compensation package may "
        "also include a discretionary annual bonus.")
    cases = [
        ("Invenergy, Associate, Land Development", invenergy, 80000.0, 93000.0),
        ("Cypress Creek, Senior Director, Development",
         '<p><strong><span data-contrast="auto">Compensation:</span></strong>'
         '<span data-contrast="auto"> The salary range for the position is '
         '$200-235k plus bonus and benefits. Compensation may vary outside of '
         'this range depending on a number of factors.</span></p>',
         200000.0, 235000.0),
        ("Sense, Corporate Development Associate",
         "- Authorized to work in the US\n\n- Compensation is $100 - 150k\n\n"
         "Benefits\nHealth Care Plan (Medical, Dental & Vision) Retirement Plan "
         "(401k, IRA)", 100000.0, 150000.0),
        ("Sense, Staff Backend Software Engineer",
         "- Authorized to work in the US\n\n- Compensation is 180 - 200k\n\n"
         "Benefits\n\n- Health Care Plan (Medical, Dental & Vision)",
         180000.0, 200000.0),
        ("Plus Power, single figure behind markup",
         '<span class="EOP SCXW75530381 BCX8" data-ccp-props="{"201341983":0,'
         '"335559740":240}"> </span></p>\n<p><span data-contrast="auto">The '
         'expected salary range* for this position </span><span '
         'data-contrast="auto">begins</span><span data-contrast="auto"> at '
         '$105,000. </span><span data-ccp-props="{"201341983":0,"335559740":259}">',
         105000.0, 105000.0),
    ]
    for label, text, lo, hi in cases:
        r = from_text(text)
        if r.pay_min is None or abs(r.pay_min - lo) > 0.01 or abs((r.pay_max or 0) - hi) > 0.01:
            fails.append(f"[{label}] got ({r.pay_min}, {r.pay_max}), want ({lo}, {hi})")

    # Greenhouse's pay-transparency widget, verbatim from New York ISO: the
    # tags between the figures stopped the range pattern and the floor was
    # recorded as a point value on every NYISO row.
    nyiso = ('<div class="pay-input"><div class="title">Salary Range</div>'
             '<div class="pay-range"><span>$68,900</span><span class="divider">'
             '-</span><span>$115,200 USD</span></div></div></div>')
    r = from_text(nyiso)
    if (r.pay_min, r.pay_max, r.single_figure) != (68900.0, 115200.0, False):
        fails.append(f"[NYISO widget] got ({r.pay_min}, {r.pay_max}, "
                     f"single={r.single_figure}), want (68900, 115200, range)")

    # Avangrid's boilerplate, verbatim, on a posting that states no pay. It was
    # the lowest-paid row in the dataset: "$30 billion" read as $30 an hour,
    # and with that closed, "25 states" read as $25 an hour.
    avangrid = ("About AVANGRID: AVANGRID, Inc. (NYSE:AGR) is a diversified "
                "energy and utility company with $30 billion in assets and "
                "operations in 25 states. The company operates regulated "
                "utilities, electricity generation, and natural gas storage.")
    r = from_text(avangrid)
    if r.usable:
        fails.append(f"[Avangrid boilerplate] parsed as pay: {r.raw_excerpt!r} -> {r.midpoint}")

    # The window edges on their own: no window may open or close mid-token,
    # whatever the bound check downstream would have caught.
    from lmstudy.pay import _pay_windows
    for w in _pay_windows(invenergy):
        at = invenergy.find(w)
        end = at + len(w)
        if (at > 0 and not invenergy[at - 1].isspace()) or (
                end < len(invenergy) and not invenergy[end].isspace()):
            fails.append(f"window cuts a token: {w[:30]!r}...{w[-20:]!r}")
            break

    # The bound check on its own, independent of how the fragment arises.
    for fragment in ("Base pay 5,000.00 - 235,000.00 USD Annual",
                     "Salary: 0,000.00 - $93,000.00 USD Annual"):
        r = from_text(fragment)
        if r.usable and r.pay_min < MIN_PLAUSIBLE_BOUND:
            fails.append(f"{fragment!r} accepted with a low bound of {r.pay_min}")
    return fails, len(cases) + 5


if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

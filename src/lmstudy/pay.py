"""Extract the dependent variable: annualized pay range from a posting.

Priority order:
  1. Structured compensation from the ATS (most reliable).
  2. Regex over description text (Illinois HB 3129 forces this to exist for
     covered IL employers, but formatting is entirely unstandardized).

Everything is annualized to USD. Hourly is multiplied by `hours_per_year`
(default 2080) and flagged, so the conversion assumption stays testable.
"""
from __future__ import annotations

import html
import re
from dataclasses import dataclass

HOURS_PER_YEAR = 2080
MIN_PLAUSIBLE_ANNUAL = 25_000
MAX_PLAUSIBLE_ANNUAL = 400_000
# An hourly figure above this is almost certainly an annual salary mislabeled.
MAX_PLAUSIBLE_HOURLY = 300.0
# No full-time US job can advertise a LOW bound under the federal minimum wage
# annualized ($7.25 x 2,080). A bound below it is a fragment, not a figure:
# every halved Invenergy row and every "$200-235k" row had a low bound between
# $0 and $9,000, and each still produced a midpoint inside the plausible window,
# because the high bound alone carried it there. The midpoint check cannot see
# this; the bound check can, whatever shape the fragment takes next time.
MIN_PLAUSIBLE_BOUND = 7.25 * 2080

# Money token: $85,000 / $85,000.00 / 85,000 / $85k / 42.50
#
# The leading lookbehind is load-bearing. Without it the bare-digits branch
# matched a number glued to preceding letters or digits, and AEP Energy's
# postings say:
#
#     Compensation Grade:  SP20-010   Compensation Range:  $116,255.00 - $177,503.00
#
# so "SP20-010" parsed as the range 20 to 010. Both are under 1000, which the
# unit inference reads as hourly, so six postings were annualized to
# $20,800-$41,600 while their real range sat in the very next clause. A
# "NERC Compliance Specialist Lead - Principal" was recorded at $31,200
# against a true midpoint near $147,000 -- wrong by 4.7x, and low enough to
# drag every coefficient it touched.
#
# A leading zero is also disqualifying: no advertised pay figure is written
# "010", but grade codes and dates are full of them.
#
# A figure followed by a magnitude word is not pay either. Avangrid's
# boilerplate "with $30 billion in assets" was read as $30 an hour and
# annualized to $62,400, the lowest-paid row in the dataset, on a posting that
# discloses no pay at all (audit round 6).
_NOT_GLUED = r"(?<![A-Za-z0-9])"
_NOT_MAGNITUDE = r"(?![\d,.]*\s*(?:million|billion|trillion|mn|bn)\b)"
_MONEY = (_NOT_GLUED +
          r"\$?\s?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|[1-9]\d*(?:\.\d{1,2})?)"
          + _NOT_MAGNITUDE +
          r"\s?(k\b|K\b)?")
_DASH = r"\s*(?:-|–|—|to|through|up to)\s*"

RANGE_RE = re.compile(_MONEY + _DASH + _MONEY, re.IGNORECASE)
# "between X and Y" is a common phrasing; "and" is only safe as a range
# separator when "between" introduces it, so it gets its own pattern rather
# than joining the general dash alternation.
BETWEEN_RE = re.compile(r"between\s+" + _MONEY + r"\s+and\s+" + _MONEY, re.IGNORECASE)
SINGLE_RE = re.compile(_MONEY, re.IGNORECASE)
_TAG = re.compile(r"<[^>]+>")

HOURLY_MARKERS = (
    "per hour", "/hour", "/hr", "an hour", "hourly", "per hr", "each hour",
)
ANNUAL_MARKERS = (
    "per year", "/year", "/yr", "annually", "annualized", "per annum",
    "a year", "annual salary", "base salary", "salary range",
)
MONTHLY_MARKERS = ("per month", "/month", "/mo", "monthly")

# Windows of text that usually contain the pay statement.
PAY_CONTEXT = (
    "salary", "compensation", "pay range", "pay scale", "base pay", "wage",
    "hiring range", "target pay", "expected pay", "anticipated salary",
    "pay transparency", "starting pay", "rate of pay",
)

# Phrases that signal an explicit refusal/absence rather than a figure.
NON_DISCLOSURE = (
    "commensurate with experience",
    "salary will be determined",
    "competitive salary",
    "competitive compensation",
    "depending on experience",
)


@dataclass
class PayResult:
    disclosed: bool = False
    pay_min: float | None = None          # annualized USD
    pay_max: float | None = None
    midpoint: float | None = None
    unit_original: str | None = None      # hour | year | month
    hourly_original: bool = False
    source: str | None = None             # "structured" | "text" | None
    single_figure: bool = False           # a point value, not a stated range
    raw_excerpt: str | None = None
    note: str | None = None

    @property
    def usable(self) -> bool:
        return self.disclosed and self.midpoint is not None


def _to_number(digits: str, k_suffix: str | None) -> float | None:
    try:
        value = float(digits.replace(",", ""))
    except ValueError:
        return None
    if k_suffix:
        value *= 1000
    return value


def _range_values(match: re.Match) -> tuple[float | None, float | None]:
    """Both bounds of a matched range, with a shared "k" applied to both.

    "$200-235k" and "$100 - 150k" write the thousands suffix once, on the
    upper figure. Read literally that is (200, 235000); the midpoint lands
    near half the true range and still passes the plausibility window, so
    nothing downstream objects. Cypress Creek's "Senior Director,
    Development" was recorded at $117,600 against a true $217,500.
    """
    lo_digits, lo_k, hi_digits, hi_k = match.group(1, 2, 3, 4)
    lo = _to_number(lo_digits, lo_k)
    hi = _to_number(hi_digits, hi_k)
    if hi_k and not lo_k and lo is not None and hi is not None:
        if lo < 1000 and lo * 1000 <= hi:
            lo *= 1000
    elif lo_k and not hi_k and lo is not None and hi is not None:
        if hi < 1000 and hi * 1000 >= lo:
            hi *= 1000
    return lo, hi


def _infer_unit(window: str, values: list[float]) -> str:
    low = window.lower()
    if any(m in low for m in HOURLY_MARKERS):
        return "hour"
    if any(m in low for m in MONTHLY_MARKERS):
        return "month"
    if any(m in low for m in ANNUAL_MARKERS):
        return "year"
    # No explicit marker: infer from magnitude. Values under 1000 in a pay
    # context are hourly rates; large values are annual.
    if values and max(values) < 1000:
        return "hour"
    return "year"


def _annualize(value: float, unit: str, hours_per_year: int) -> float:
    if unit == "hour":
        return value * hours_per_year
    if unit == "month":
        return value * 12
    return value


def from_structured(
    comp_min: float | None,
    comp_max: float | None,
    interval: str | None,
    hours_per_year: int = HOURS_PER_YEAR,
) -> PayResult:
    """Use the ATS's own compensation fields when present."""
    if comp_min is None and comp_max is None:
        return PayResult()
    unit = "year"
    interval_l = (interval or "").lower()
    if "hour" in interval_l:
        unit = "hour"
    elif "month" in interval_l:
        unit = "month"
    elif not interval_l:
        candidates = [v for v in (comp_min, comp_max) if v]
        if candidates and max(candidates) < 1000:
            unit = "hour"

    lo = _annualize(comp_min, unit, hours_per_year) if comp_min else None
    hi = _annualize(comp_max, unit, hours_per_year) if comp_max else None
    lo, hi = _order(lo, hi)
    if lo is None and hi is None:
        return PayResult()
    mid = _midpoint(lo, hi)
    if mid is None or not (MIN_PLAUSIBLE_ANNUAL <= mid <= MAX_PLAUSIBLE_ANNUAL):
        return PayResult(note=f"structured value implausible: {lo}-{hi}")
    return PayResult(
        disclosed=True,
        pay_min=lo,
        pay_max=hi,
        midpoint=mid,
        unit_original=unit,
        hourly_original=(unit == "hour"),
        source="structured",
    )


def from_text(text: str, hours_per_year: int = HOURS_PER_YEAR) -> PayResult:
    """Parse a pay range out of unstructured description text."""
    if not text:
        return PayResult()
    # Parse the text a reader sees, not the markup. Greenhouse's
    # pay-transparency widget renders a range as
    #     <span>$68,900</span><span class="divider">-</span><span>$115,200 USD</span>
    # and with the tags in place the range pattern cannot span the divider,
    # so the single-figure fallback took the FLOOR as a point value. Every
    # New York ISO row was recorded at its minimum that way. Audit round 6.
    text = html.unescape(_TAG.sub(" ", text))

    for window in _pay_windows(text):
        for pattern in (BETWEEN_RE, RANGE_RE):
            match = pattern.search(window)
            if not match:
                continue
            lo, hi = _range_values(match)
            result = _build(lo, hi, window, match.group(0), hours_per_year)
            if result.usable:
                return result

    # Fall back to a single figure only inside an explicit pay context. Every
    # figure in the window is tried, not just the first: a window widened to a
    # token boundary can open on markup ("335559740":240}), and Plus Power's
    # "begins at $105,000" sat behind exactly that.
    for window in _pay_windows(text):
        if any(p in window.lower() for p in NON_DISCLOSURE) and "$" not in window:
            continue
        for match in SINGLE_RE.finditer(window):
            # A lone figure is pay only when written as money. Without the
            # "$", "operations in 25 states" became $25 an hour: Avangrid's
            # boilerplate, on a posting that states no pay (audit round 6).
            if "$" not in match.group(0):
                continue
            value = _to_number(match.group(1), match.group(2))
            result = _build(value, value, window, match.group(0), hours_per_year)
            if result.usable:
                result.single_figure = True
                result.note = "single figure, not a range"
                return result

    return PayResult(note="no pay figure found")


def _snap(text: str, start: int, end: int) -> str:
    """Slice text[start:end], widened so neither edge cuts through a token.

    A window that opens or closes mid-figure hands the money pattern a
    fragment that is itself a well-formed number. Invenergy writes

        Base Pay  $80,000.00 - $93,000.00 USD Annual

    and a window opened 60 characters before a later "compensation" cue began
    at "0,000.00 - $93,000.00", which parsed as (0, 93000): a midpoint of
    exactly half the true high. The money token's left-boundary lookbehind
    cannot see a character the slice has already thrown away, so the earlier
    fix (a leading zero is disqualifying) caught only the "00 - $170,000.00"
    shape of the fragment, and "5,000.00 - 235,000.00" kept getting through.
    Snapping to whitespace removes the fragment instead of pattern-matching
    its shapes.
    """
    start = max(0, start)
    end = min(len(text), end)
    while start > 0 and not text[start - 1].isspace():
        start -= 1
    while end < len(text) and not text[end].isspace():
        end += 1
    return text[start:end]


def _pay_windows(text: str, width: int = 260) -> list[str]:
    """Text slices around pay-related cues, best cues first."""
    low = text.lower()
    windows = []
    for cue in PAY_CONTEXT:
        start = 0
        while True:
            idx = low.find(cue, start)
            if idx == -1:
                break
            windows.append(_snap(text, idx - 60, idx + width))
            start = idx + len(cue)
    # A bare "$" range with no cue word is still worth a look, last.
    if not windows and "$" in text:
        for m in re.finditer(r"\$", text):
            windows.append(_snap(text, m.start() - 60, m.start() + width))
            if len(windows) >= 5:
                break
    return windows


def _build(
    lo: float | None, hi: float | None, window: str, excerpt: str, hours_per_year: int
) -> PayResult:
    values = [v for v in (lo, hi) if v is not None]
    if not values:
        return PayResult()
    unit = _infer_unit(window, values)

    # Guard against an "hourly" reading of what is plainly an annual figure.
    if unit == "hour" and max(values) > MAX_PLAUSIBLE_HOURLY:
        unit = "year"

    lo_a = _annualize(lo, unit, hours_per_year) if lo is not None else None
    hi_a = _annualize(hi, unit, hours_per_year) if hi is not None else None
    lo_a, hi_a = _order(lo_a, hi_a)
    if lo_a is not None and lo_a < MIN_PLAUSIBLE_BOUND:
        return PayResult(note=f"low bound under the federal minimum wage: {lo_a}-{hi_a}")
    mid = _midpoint(lo_a, hi_a)
    if mid is None or not (MIN_PLAUSIBLE_ANNUAL <= mid <= MAX_PLAUSIBLE_ANNUAL):
        return PayResult(note=f"implausible after annualizing: {lo_a}-{hi_a}")
    return PayResult(
        disclosed=True,
        pay_min=lo_a,
        pay_max=hi_a,
        midpoint=mid,
        unit_original=unit,
        hourly_original=(unit == "hour"),
        source="text",
        raw_excerpt=excerpt.strip(),
    )


def _order(lo: float | None, hi: float | None) -> tuple[float | None, float | None]:
    if lo is not None and hi is not None and lo > hi:
        return hi, lo
    return lo, hi


def _midpoint(lo: float | None, hi: float | None) -> float | None:
    values = [v for v in (lo, hi) if v is not None]
    if not values:
        return None
    return sum(values) / len(values)


def extract(
    description: str,
    comp_min: float | None = None,
    comp_max: float | None = None,
    comp_interval: str | None = None,
    hours_per_year: int = HOURS_PER_YEAR,
) -> PayResult:
    """Structured compensation first, text parsing as fallback."""
    structured = from_structured(comp_min, comp_max, comp_interval, hours_per_year)
    if structured.usable:
        return structured
    return from_text(description, hours_per_year)

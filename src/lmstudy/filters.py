"""Screen postings down to the study population.

Four independent screens, each returning a reason when it rejects, so the
pipeline can report a full selection funnel (how many postings were lost at
each stage) rather than an unexplained final count.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

# "3+ years", "3-5 years", "minimum of 2 years", "at least 4 years'"
YEARS_PATTERNS = [
    re.compile(r"(\d+)\s*\+?\s*(?:to|-|–)\s*(\d+)\s*\+?\s*year", re.I),
    re.compile(r"(?:minimum|min\.?|at least|a minimum of)\s*(?:of\s*)?(\d+)\s*\+?\s*year", re.I),
    re.compile(r"(\d+)\s*\+\s*year", re.I),
    re.compile(r"(\d+)\s*year(?:s)?['’]?\s*(?:of\s*)?(?:relevant\s*|related\s*|professional\s*)?experience", re.I),
]
NO_EXPERIENCE = re.compile(
    r"\b(no (?:prior )?experience (?:is )?(?:required|necessary)|0-\d+ years|entry[- ]level)\b", re.I
)
# Years mentioned about the degree, not the job, must not be read as experience.
DEGREE_YEARS = re.compile(r"(?:4|four)\s*[- ]?year\s+(?:degree|university|college)", re.I)


@dataclass
class ScreenResult:
    passed: bool
    reason: str | None = None
    detail: dict = field(default_factory=dict)


def _norm(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    cleaned = re.sub(r"[^a-z0-9+/ -]", " ", (text or "").lower())
    return re.sub(r"\s+", " ", cleaned).strip()


_NEEDLE_CACHE: dict[str, re.Pattern] = {}


def _matches(text_norm: str, needle: str) -> bool:
    """Whole-word/phrase match.

    Substring matching is unsafe here: the entry-level signal " i " (for
    "Engineer I") would otherwise match the "i" inside "engineer" and pass
    every posting. Word boundaries are required.
    """
    key = needle
    pattern = _NEEDLE_CACHE.get(key)
    if pattern is None:
        token = _norm(needle)
        if not token:
            pattern = re.compile(r"(?!x)x")  # never matches
        else:
            pattern = re.compile(rf"(?<!\w){re.escape(token)}(?!\w)")
        _NEEDLE_CACHE[key] = pattern
    return bool(pattern.search(text_norm))


def screen_role(title: str, description: str, config: dict) -> ScreenResult:
    """Keep software / data / analytics roles; drop everything else."""
    roles = config["roles"]
    title_n = _norm(title)

    # Exclusions are judged on the title only: a software posting may well
    # mention "network" or "sales" in its body without being one.
    for bad in roles["exclude_any"]:
        if _matches(title_n, bad):
            return ScreenResult(False, "role_excluded", {"matched": bad})

    for good in roles["include_any"]:
        if _matches(title_n, good):
            return ScreenResult(True, None, {"matched": good})

    return ScreenResult(False, "role_not_software_data", {"title": title})


def extract_years(description: str) -> tuple[int | None, str | None]:
    """Minimum required years of experience, if the posting states one."""
    if not description:
        return None, None
    text = DEGREE_YEARS.sub(" ", description)
    if NO_EXPERIENCE.search(text):
        return 0, "explicit no-experience statement"
    best: int | None = None
    excerpt = None
    for pattern in YEARS_PATTERNS:
        for match in pattern.finditer(text):
            try:
                value = int(match.group(1))
            except (ValueError, IndexError):
                continue
            if 0 <= value <= 30 and (best is None or value < best):
                best = value
                excerpt = match.group(0).strip()
    return best, excerpt


def screen_early_career(title: str, description: str, config: dict) -> ScreenResult:
    """Keep roles requiring <= max_years_experience, using title as fallback."""
    ec = config["early_career"]
    title_n = _norm(title)

    # Since 2026-09-21 seniority is a REGRESSOR, not a filter. With the flag
    # set, every level is admitted and seniority_rank() carries the information
    # into the model instead. The exclusion lists are kept, not deleted: they
    # are what SENIORITY_RANKS is built from, and reverting is a config edit.
    admit_all = ec.get("admit_all_seniority", False)

    if not admit_all:
        for senior in ec["seniority_exclusions"]:
            if _matches(title_n, senior):
                return ScreenResult(False, "seniority_excluded", {"matched": senior})

    years, excerpt = extract_years(description)
    if years is not None:
        if admit_all or years <= ec["max_years_experience"]:
            return ScreenResult(True, None, {"years_min": years, "excerpt": excerpt})
        return ScreenResult(False, "experience_too_high", {"years_min": years, "excerpt": excerpt})

    # No stated requirement. An explicit entry-level title signal always passes.
    for signal in ec["entry_title_signals"]:
        if _matches(title_n, signal):
            return ScreenResult(True, None, {"years_min": None, "title_signal": signal})

    # Otherwise admit or reject per config. Admitting is the measured default:
    # dropping unstated-experience postings cost roughly half the sample, and
    # `yrs_exp_stated` carries the imputation into the model as a control.
    # Deliberately NOT `admit_all or ...`. Admitting every seniority level says
    # nothing about whether a posting that states no minimum should be kept;
    # those are separate policies and conflating them made strict mode
    # unreachable.
    if ec.get("admit_unstated_experience"):
        return ScreenResult(True, None, {"years_min": None, "experience_unstated": True})

    return ScreenResult(False, "no_experience_signal", {"title": title})



# --------------------------------------------------------------------------
# Seniority as a RANK, not a gate.
#
# Until 2026-09-21 seniority was a screen: anything matching "senior", "lead",
# a numeral above II and so on was dropped, and the study was early-career by
# construction. The owner's decision to admit every level turns that screen
# into a classifier — the same vocabulary, read for what it says rather than
# used to exclude.
#
# Order matters: the highest matching rank wins, so "Senior Director" is 6 and
# not 3. Audit round 2 is what makes this trustworthy: before it, "Analyst V"
# and "Team Leader" were not recognised at all, so they would have been ranked
# entry level here rather than merely admitted wrongly.
SENIORITY_RANKS = [
    (7, ["vp", "vice president", "chief", "head of", "svp", "evp", "c-level"]),
    (6, ["director", "sr director", "senior director"]),
    (5, ["manager", "mgr", "supervisor", "team lead", "leader"]),
    (4, ["staff", "principal", "distinguished", "fellow", "architect"]),
    (3, ["senior", "sr", "iii", "iv", "v", "vi", "vii", "viii", "lead",
         "senior associate", "senior analyst"]),
    (2, ["ii", "mid-level", "intermediate"]),
    (1, ["i", "associate", "junior", "jr", "entry level", "entry-level",
         "new grad", "new graduate", "early career", "rotational",
         "development program", "graduate program", "campus", "trainee"]),
]

# Rank 2 is also the default for a title carrying no level signal at all: an
# unlevelled "Market Analyst" is a mid-level posting, not an entry-level one,
# and assuming otherwise would bias the seniority coefficient.
SENIORITY_DEFAULT = 2

SENIORITY_LABELS = {
    0: "intern", 1: "entry", 2: "mid", 3: "senior", 4: "staff_principal",
    5: "manager", 6: "director", 7: "executive",
}


# A requisition advertising several rungs at once: "Resource Planning Analyst
# I or II or Senior", "(Sr.) (Lead) (Principal) Energy Analyst/Engineer (II)",
# "Senior/Principal Data Analyst". Utilities post these routinely — 9 of 141
# rows in the round-3 audit — and taking the highest match ranked every one at
# its ceiling, biasing the headline regressor upward exactly where the
# advertised pay range is widest.
_RANGE_SEPARATOR = re.compile(r"\bor\b|/", re.IGNORECASE)


def is_level_range(title: str) -> bool:
    """True when one posting advertises more than one seniority rung."""
    title_n = _norm(title)
    if not title_n or not _RANGE_SEPARATOR.search(title_n):
        return False
    return len(_ranks_present(title_n)) > 1


def _ranks_present(title_n: str) -> set[int]:
    return {rank for rank, needles in SENIORITY_RANKS
            for needle in needles if _matches(title_n, needle)}


def seniority_rank(title: str, description: str = "") -> int:
    """Ordinal seniority from the title. Higher is more senior.

    0 intern, 1 entry, 2 mid or unlevelled, 3 senior, 4 staff/principal,
    5 manager, 6 director, 7 VP and above.

    A title advertising a RANGE of rungs is ranked at its LOWEST — the level
    the employer will actually hire at, and the one the advertised pay floor
    corresponds to. Averaging was rejected: a midpoint rank is not a level
    anyone is hired into, and it would invent a rung the posting never named.
    """
    title_n = _norm(title)
    if not title_n:
        return SENIORITY_DEFAULT
    found = _ranks_present(title_n)
    if not found:
        return SENIORITY_DEFAULT
    if len(found) > 1 and _RANGE_SEPARATOR.search(title_n):
        return min(found)
    return max(found)


def is_early_career(rank: int, years_min: int | None,
                    max_years: int = 3) -> bool:
    """The study's original question, now derived rather than enforced.

    Early career means an entry-level rung OR a stated experience minimum
    within the threshold. A posting stating no minimum is judged on its rank
    alone, which is why the rank defaults to mid rather than entry.
    """
    if years_min is not None:
        return years_min <= max_years and rank <= 2
    return rank <= 1


def screen_internship(title: str, description: str, config: dict) -> ScreenResult:
    """Drop internships and co-ops; keep full-time rotational programs."""
    cfg = config["internships"]
    if not cfg.get("exclude", True):
        return ScreenResult(True)
    blob = _norm(f"{title} {description[:1200]}")
    title_n = _norm(title)

    hit = next((s for s in cfg["intern_signals"] if _matches(title_n, s)), None)
    if hit is None:
        hit = next((s for s in cfg["intern_signals"] if _matches(blob, s)), None)
        if hit is not None and not _matches(title_n, hit):
            # An "internship" mentioned only in body text is usually a
            # description of a prior-experience preference, not the role itself.
            hit = None

    if hit is not None:
        keeper = next(
            (k for k in cfg.get("keep_despite_signals", []) if _matches(title_n, k)), None
        )
        if keeper:
            return ScreenResult(True, None, {"kept_as": keeper})
        return ScreenResult(False, "internship", {"matched": hit})
    return ScreenResult(True)


def screen_all(title: str, description: str, config: dict) -> tuple[bool, list[str], dict]:
    """Run every screen, collecting all rejection reasons for the funnel."""
    reasons, detail = [], {}
    for name, fn in (
        ("role", screen_role),
        ("early_career", screen_early_career),
        ("internship", screen_internship),
    ):
        result = fn(title, description, config)
        detail[name] = result.detail
        if not result.passed:
            reasons.append(result.reason or name)
    return (not reasons), reasons, detail


# Job level: the rung on the early-career ladder, as an ordinal.
#   0 = unlevelled   1 = I / Associate   2 = II / Analyst   3 = III / Senior Associate
LEVEL_PATTERNS = [
    (3, [r"\biii\b", r"\blevel 3\b", r"\bl3\b", r"senior associate", r"senior analyst"]),
    (2, [r"\bii\b", r"\blevel 2\b", r"\bl2\b", r"\banalyst\b"]),
    (1, [r"\bi\b", r"\blevel 1\b", r"\bl1\b", r"\bassociate\b", r"\bjunior\b", r"\bjr\b"]),
]
_LEVEL_RE = [(lvl, [re.compile(p, re.IGNORECASE) for p in pats]) for lvl, pats in LEVEL_PATTERNS]


def extract_job_level(title: str) -> int:
    """Ordinal rung from the title, highest match wins.

    Checked high-to-low so "Engineer III" is not read as "I". The numeral does
    not decide early-career status — the experience parse does — this only
    records where on the ladder the posting sits, so the within-ladder pay step
    can be estimated.
    """
    text = f" {(title or '').lower()} "
    for level, patterns in _LEVEL_RE:
        if any(p.search(text) for p in patterns):
            return level
    return 0

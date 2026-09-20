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

    for senior in ec["seniority_exclusions"]:
        if _matches(title_n, senior):
            return ScreenResult(False, "seniority_excluded", {"matched": senior})

    years, excerpt = extract_years(description)
    if years is not None:
        if years <= ec["max_years_experience"]:
            return ScreenResult(True, None, {"years_min": years, "excerpt": excerpt})
        return ScreenResult(False, "experience_too_high", {"years_min": years, "excerpt": excerpt})

    # No stated requirement: accept only on an explicit entry-level title signal.
    for signal in ec["entry_title_signals"]:
        if _matches(title_n, signal):
            return ScreenResult(True, None, {"years_min": None, "title_signal": signal})

    return ScreenResult(False, "no_experience_signal", {"title": title})


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

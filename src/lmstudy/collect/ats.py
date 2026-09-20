"""Adapters for public, unauthenticated ATS job-board APIs.

Each adapter returns a list of RawPosting. Normalization into the canonical
schema happens in lmstudy.normalize so that raw payloads stay verbatim on disk
and every downstream stage can be re-run without re-collecting.

None of these endpoints require a key, and none are behind a login.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, asdict
from typing import Any, Iterable

from ..http import PoliteSession, Response

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"[ \t\r\f\v]+")


def strip_html(raw: str | None) -> str:
    """HTML -> plain text, preserving paragraph and list breaks.

    Job descriptions carry meaning in their list structure (requirements,
    benefits), so block boundaries become newlines rather than vanishing.
    """
    if not raw:
        return ""
    text = raw.replace("\r\n", "\n")
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</(p|div|li|ul|ol|h[1-6]|tr)>", "\n", text)
    text = re.sub(r"(?i)<li[^>]*>", "\n- ", text)
    text = TAG_RE.sub(" ", text)
    # Unescape the entities that actually appear in ATS payloads.
    for entity, char in (
        ("&amp;", "&"), ("&nbsp;", " "), ("&lt;", "<"), ("&gt;", ">"),
        ("&quot;", '"'), ("&#39;", "'"), ("&rsquo;", "'"), ("&ndash;", "-"),
        ("&mdash;", "-"), ("&bull;", "-"),
    ):
        text = text.replace(entity, char)
    text = WS_RE.sub(" ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return "\n".join(line.strip() for line in text.split("\n")).strip()


@dataclass
class RawPosting:
    """One posting as retrieved, before any study-specific interpretation."""

    platform: str
    employer: str
    board_token: str
    external_id: str
    title: str
    location_raw: str
    description: str
    url: str
    posted_at: str | None = None
    updated_at: str | None = None
    department: str | None = None
    employment_type: str | None = None
    # Structured compensation, when the ATS exposes it (Ashby, some Greenhouse).
    comp_min: float | None = None
    comp_max: float | None = None
    comp_interval: str | None = None
    payload: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# --------------------------------------------------------------------------
# Greenhouse
# --------------------------------------------------------------------------
def fetch_greenhouse(
    session: PoliteSession, token: str, employer: str
) -> tuple[list[RawPosting], Response]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true"
    resp = session.get_json(url)
    if not resp.ok:
        return [], resp
    out = []
    for job in resp.data.get("jobs", []) or []:
        meta = {m.get("name"): m.get("value") for m in (job.get("metadata") or [])}
        comp_min, comp_max, interval = _greenhouse_comp(job)
        out.append(
            RawPosting(
                platform="greenhouse",
                employer=employer,
                board_token=token,
                external_id=str(job.get("id", "")),
                title=job.get("title", "") or "",
                location_raw=(job.get("location") or {}).get("name", "") or "",
                description=strip_html(job.get("content")),
                url=job.get("absolute_url", "") or "",
                updated_at=job.get("updated_at"),
                posted_at=job.get("first_published") or job.get("updated_at"),
                department=_first_name(job.get("departments")),
                comp_min=comp_min,
                comp_max=comp_max,
                comp_interval=interval,
                payload={"metadata": meta},
            )
        )
    return out, resp


def _greenhouse_comp(job: dict) -> tuple[float | None, float | None, str | None]:
    """Greenhouse exposes pay via pay_input_ranges on boards that enable it."""
    ranges = job.get("pay_input_ranges") or []
    if not ranges:
        return None, None, None
    first = ranges[0]
    lo, hi = first.get("min_cents"), first.get("max_cents")
    interval = (first.get("interval") or "").lower() or None
    return (
        lo / 100.0 if isinstance(lo, (int, float)) else None,
        hi / 100.0 if isinstance(hi, (int, float)) else None,
        interval,
    )


def _first_name(items: Iterable[dict] | None) -> str | None:
    for item in items or []:
        name = item.get("name")
        if name:
            return name
    return None


# --------------------------------------------------------------------------
# Lever
# --------------------------------------------------------------------------
def fetch_lever(
    session: PoliteSession, token: str, employer: str
) -> tuple[list[RawPosting], Response]:
    url = f"https://api.lever.co/v0/postings/{token}?mode=json"
    resp = session.get_json(url)
    if not resp.ok or not isinstance(resp.data, list):
        return [], resp
    out = []
    for job in resp.data:
        categories = job.get("categories") or {}
        salary = job.get("salaryRange") or {}
        out.append(
            RawPosting(
                platform="lever",
                employer=employer,
                board_token=token,
                external_id=str(job.get("id", "")),
                title=job.get("text", "") or "",
                location_raw=categories.get("location", "") or "",
                description=strip_html(job.get("descriptionPlain") or job.get("description")),
                url=job.get("hostedUrl", "") or "",
                posted_at=_epoch_ms(job.get("createdAt")),
                updated_at=_epoch_ms(job.get("createdAt")),
                department=categories.get("team") or categories.get("department"),
                employment_type=categories.get("commitment"),
                comp_min=_as_float(salary.get("min")),
                comp_max=_as_float(salary.get("max")),
                comp_interval=(salary.get("interval") or "").lower() or None,
            )
        )
    return out, resp


# --------------------------------------------------------------------------
# Ashby  (exposes structured compensation explicitly)
# --------------------------------------------------------------------------
def fetch_ashby(
    session: PoliteSession, token: str, employer: str
) -> tuple[list[RawPosting], Response]:
    url = (
        f"https://api.ashbyhq.com/posting-api/job-board/{token}"
        "?includeCompensation=true"
    )
    resp = session.get_json(url)
    if not resp.ok:
        return [], resp
    out = []
    for job in resp.data.get("jobs", []) or []:
        lo, hi, interval = _ashby_comp(job.get("compensation"))
        out.append(
            RawPosting(
                platform="ashby",
                employer=employer,
                board_token=token,
                external_id=str(job.get("id", "")),
                title=job.get("title", "") or "",
                location_raw=job.get("location", "") or "",
                description=strip_html(job.get("descriptionHtml") or job.get("descriptionPlain")),
                url=job.get("jobUrl", "") or "",
                posted_at=job.get("publishedAt"),
                updated_at=job.get("publishedAt"),
                department=job.get("department") or job.get("team"),
                employment_type=job.get("employmentType"),
                comp_min=lo,
                comp_max=hi,
                comp_interval=interval,
            )
        )
    return out, resp


def _ashby_comp(comp: dict | None) -> tuple[float | None, float | None, str | None]:
    if not comp:
        return None, None, None
    for tier in comp.get("compensationTiers") or []:
        for component in tier.get("components") or []:
            if (component.get("compensationType") or "").lower() != "salary":
                continue
            lo = _as_float(component.get("minValue"))
            hi = _as_float(component.get("maxValue"))
            interval = (component.get("interval") or "").lower() or None
            if lo is not None or hi is not None:
                return lo, hi, interval
    return None, None, None


# --------------------------------------------------------------------------
# SmartRecruiters  (list endpoint is a summary; detail fetched per posting)
# --------------------------------------------------------------------------
def fetch_smartrecruiters(
    session: PoliteSession,
    token: str,
    employer: str,
    max_postings: int = 200,
    detail_filter=None,
) -> tuple[list[RawPosting], Response]:
    base = f"https://api.smartrecruiters.com/v1/companies/{token}/postings"
    resp = session.get_json(f"{base}?limit=100")
    if not resp.ok:
        return [], resp
    out = []
    for job in (resp.data.get("content") or [])[:max_postings]:
        job_id = str(job.get("id", ""))
        location = job.get("location") or {}
        location_raw = ", ".join(
            p for p in (location.get("city"), location.get("region")) if p
        )
        # Descriptions need a second request each; skip the ones that cannot
        # be in scope on title and location alone.
        stub = RawPosting(
            platform="smartrecruiters", employer=employer, board_token=token,
            external_id=job_id, title=job.get("name", "") or "",
            location_raw=location_raw, description="", url="",
        )
        if detail_filter is not None and not detail_filter(stub):
            continue
        detail = session.get_json(f"{base}/{job_id}")
        description, lo, hi, interval = "", None, None, None
        if detail.ok:
            description = _smartrecruiters_text(detail.data)
            lo, hi, interval = _smartrecruiters_comp(detail.data)
        out.append(
            RawPosting(
                platform="smartrecruiters",
                employer=employer,
                board_token=token,
                external_id=job_id,
                title=job.get("name", "") or "",
                location_raw=location_raw,
                description=description,
                url=(job.get("applyUrl") or job.get("ref") or ""),
                posted_at=job.get("releasedDate"),
                updated_at=job.get("releasedDate"),
                department=(job.get("department") or {}).get("label"),
                employment_type=(job.get("typeOfEmployment") or {}).get("label"),
                comp_min=lo,
                comp_max=hi,
                comp_interval=interval,
            )
        )
    return out, resp


def _smartrecruiters_text(detail: dict) -> str:
    sections = ((detail.get("jobAd") or {}).get("sections") or {})
    parts = []
    for key in ("companyDescription", "jobDescription", "qualifications", "additionalInformation"):
        text = (sections.get(key) or {}).get("text")
        if text:
            parts.append(strip_html(text))
    return "\n\n".join(parts)


def _smartrecruiters_comp(detail: dict) -> tuple[float | None, float | None, str | None]:
    comp = detail.get("compensation") or {}
    interval = (comp.get("interval") or "").lower() or None
    return _as_float(comp.get("min")), _as_float(comp.get("max")), interval


# --------------------------------------------------------------------------
# Workable
# --------------------------------------------------------------------------
def fetch_workable(
    session: PoliteSession, token: str, employer: str
) -> tuple[list[RawPosting], Response]:
    url = f"https://apply.workable.com/api/v1/widget/accounts/{token}?details=true"
    resp = session.get_json(url)
    if not resp.ok:
        return [], resp
    out = []
    for job in resp.data.get("jobs", []) or []:
        out.append(
            RawPosting(
                platform="workable",
                employer=employer,
                board_token=token,
                external_id=str(job.get("shortcode") or job.get("id") or ""),
                title=job.get("title", "") or "",
                location_raw=", ".join(
                    p for p in (job.get("city"), job.get("state"), job.get("country")) if p
                ),
                description=strip_html(job.get("description")),
                url=job.get("url") or job.get("application_url") or "",
                posted_at=job.get("published_on") or job.get("created_at"),
                updated_at=job.get("published_on"),
                department=job.get("department"),
                employment_type=job.get("employment_type"),
            )
        )
    return out, resp


# --------------------------------------------------------------------------
# Recruitee
# --------------------------------------------------------------------------
def fetch_recruitee(
    session: PoliteSession, token: str, employer: str
) -> tuple[list[RawPosting], Response]:
    url = f"https://{token}.recruitee.com/api/offers/"
    resp = session.get_json(url)
    if not resp.ok:
        return [], resp
    out = []
    for job in resp.data.get("offers", []) or []:
        out.append(
            RawPosting(
                platform="recruitee",
                employer=employer,
                board_token=token,
                external_id=str(job.get("id", "")),
                title=job.get("title", "") or "",
                location_raw=", ".join(
                    p for p in (job.get("city"), job.get("state_code")) if p
                ),
                description=strip_html(job.get("description")),
                url=job.get("careers_url") or job.get("careers_apply_url") or "",
                posted_at=job.get("published_at") or job.get("created_at"),
                updated_at=job.get("published_at"),
                department=job.get("department"),
                employment_type=job.get("employment_type_code"),
            )
        )
    return out, resp


# --------------------------------------------------------------------------
# Workday CXS  (POST, paginated)
# --------------------------------------------------------------------------
def fetch_workday(
    session: PoliteSession,
    tenant: str,
    site: str,
    employer: str,
    wd_instance: int = 1,
    page_size: int = 20,
    max_pages: int = 25,
    detail_filter=None,
) -> tuple[list[RawPosting], Response]:
    """Workday lists postings without descriptions, so each in-scope posting
    needs a second request. `detail_filter` decides which ones are worth it:
    a large tenant can list hundreds of jobs of which only a handful are in
    scope, and fetching every description would be slow and inconsiderate."""
    base = f"https://{tenant}.wd{wd_instance}.myworkdayjobs.com/wday/cxs/{tenant}/{site}"
    out: list[RawPosting] = []
    last: Response | None = None
    for page in range(max_pages):
        body = {"appliedFacets": {}, "limit": page_size, "offset": page * page_size, "searchText": ""}
        resp = session.post_json(f"{base}/jobs", body, use_etag=False)
        last = resp
        if not resp.ok:
            break
        postings = resp.data.get("jobPostings") or []
        if not postings:
            break
        for job in postings:
            path = job.get("externalPath", "") or ""
            out.append(
                RawPosting(
                    platform="workday",
                    employer=employer,
                    board_token=f"{tenant}/{site}",
                    external_id=path.rsplit("/", 1)[-1] or job.get("bulletFields", [""])[0],
                    title=job.get("title", "") or "",
                    location_raw=job.get("locationsText", "") or "",
                    description="",  # filled by the per-posting detail call below
                    url=f"https://{tenant}.wd{wd_instance}.myworkdayjobs.com/{site}{path}",
                    posted_at=job.get("postedOn"),
                    payload={"externalPath": path},
                )
            )
        if len(postings) < page_size:
            break
    # Fetch descriptions only for postings that already look in scope.
    listed = len(out)
    if detail_filter is not None:
        out = [p for p in out if detail_filter(p)]
        print(f"      workday {tenant}/{site}: {listed} listed -> {len(out)} need detail",
              flush=True)
    for posting in out:
        path = (posting.payload or {}).get("externalPath")
        if not path:
            continue
        detail = session.get_json(f"{base}{path}")
        if detail.ok:
            info = detail.data.get("jobPostingInfo") or {}
            posting.description = strip_html(info.get("jobDescription"))
            posting.posted_at = info.get("startDate") or posting.posted_at
            posting.employment_type = info.get("timeType")
            if info.get("location"):
                posting.location_raw = posting.location_raw or info["location"]
    return out, (last or Response(base, 0, error="no pages fetched"))


# --------------------------------------------------------------------------
def _as_float(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _epoch_ms(value: Any) -> str | None:
    """Lever timestamps are epoch milliseconds."""
    import datetime as _dt

    if not isinstance(value, (int, float)):
        return None
    try:
        return _dt.datetime.fromtimestamp(value / 1000, tz=_dt.timezone.utc).isoformat()
    except (ValueError, OSError, OverflowError):
        return None


FETCHERS = {
    "greenhouse": fetch_greenhouse,
    "lever": fetch_lever,
    "ashby": fetch_ashby,
    "smartrecruiters": fetch_smartrecruiters,
    "workable": fetch_workable,
    "recruitee": fetch_recruitee,
    "workday": fetch_workday,
}

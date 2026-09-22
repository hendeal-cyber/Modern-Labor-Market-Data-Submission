"""Turn raw snapshots into the analysis dataset.

Emits data/analysis/postings.csv plus a selection funnel recording how many
postings were lost at each screen, so the sample can be described honestly
rather than reported as an unexplained final count.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import pathlib
import re
import sys
from collections import Counter, defaultdict

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from lmstudy import geo, pay                                     # noqa: E402
from lmstudy.code_regressors import load_dictionary, code_posting  # noqa: E402
from lmstudy.filters import (screen_all, extract_years, extract_job_level,  # noqa: E402
                            seniority_rank, is_early_career, is_level_range,
                            SENIORITY_LABELS)


# Role families, checked in order; the first match wins. Ordered so the more
# specific family beats the generic one ("AI Application Engineer" is ai_ml,
# not software_data).
# Order matters: the first pattern that matches wins, so a broad term in an
# early family silently captures roles belonging to a later one. Hand-auditing
# the assignments against real titles found two such captures.
# "Mergers and Acquisitions Associate" matched siting_dev's bare "acquisition"
# instead of market_commercial's "mergers", and "CAD Designer" matched gis's
# bare "cad" although it is drafting rather than geospatial analytics.
ROLE_FAMILIES = [
    ("ai_ml", r"\bai\b|artificial intelligence|machine learning|\bml\b|data scien|geospatial scien"),
    ("gis", r"\bgis\b|geospatial|cad[- ]gis"),
    ("siting_dev", r"siting|site selection|\bland\b|development|permitting|origination|real estate|site acquisition|land acquisition"),
    ("regulatory", r"regulator|compliance|policy|legislat|\bnerc\b|tariff|rate case|docket"),
    ("market_commercial", r"market|commercial|procurement|pricing|capital markets|contracts|valuation|investment|fp&a|mergers"),
    ("grid_power", r"grid|transmission|interconnect|resource plan|load forecast|power system|substation"),
    ("software_data", r"software|developer|data engineer|data analyst|analytics|business intelligence|platform engineer|servicenow|application|business analyst"),
    ("sustainability", r"sustainab|\besg\b|energy efficiency|demand response|carbon|environmental"),
]
_FAMILY_RE = [(name, re.compile(pat, re.IGNORECASE)) for name, pat in ROLE_FAMILIES]


def role_family(title: str) -> str:
    for name, pattern in _FAMILY_RE:
        if pattern.search(title or ""):
            return name
    return "other"


def off_umbrella(record: dict) -> bool:
    """True when a diversified employer's posting is from another line of business.

    Iron Mountain is a records-management company with a data center arm; its
    board served CDL drivers and warehouse staff. Hitachi's tenant covers rail
    and medical imaging. Neither belongs in an energy study, and the employer
    frame alone cannot tell them apart — the title has to.
    """
    if not record.get("diversified"):
        return False
    title = (record.get("title") or "").lower()
    return any(term.lower() in title for term in record.get("off_umbrella") or [])


def lacks_sector_evidence(record: dict) -> bool:
    """True when an employer needing positive sector evidence has none in the posting.

    Multi-sector consultancies are the hole the umbrella constraint fell
    through. Guidehouse supplied 65 in-scope rows -- 22% of the estimation
    sample, the second-largest employer -- of which exactly three were energy
    work: "Associate Director - AI & Data, Energy Providers", "Data Scientist,
    Consultant (Utilities)" and "Senior Consultant - Energy Markets". The rest
    were public health ("Epidemiologist Data Scientist", "Public Health Data
    Engineer"), national security, federal law enforcement, fraud, and generic
    IT ("ServiceNow Business Analyst", "Palantir Platform Engineer").

    Neither existing guard could catch it. sector_confidence() judges a BOARD,
    and Guidehouse's board does discuss energy, so it passes honestly; it also
    only applies to unverified tokens, and this one is hand-verified. The
    diversified guard needs every off-umbrella line of business enumerated in
    advance, which for a consultancy serving every sector of the economy is
    precisely the "pattern matching confidently and wrongly" failure this
    project keeps finding.

    So the burden is inverted for these employers: the POSTING must show
    positive energy, utility or data-center evidence, using the same
    word-bounded STRONG_TERMS vocabulary that sector_confidence() already
    relies on -- a list written after its substring-matching predecessor
    admitted an AI startup at 43%.
    """
    if not record.get("requires_sector_evidence"):
        return False
    from lmstudy.collect.discover import posting_shows_sector
    return not posting_shows_sector(record.get("title") or "",
                                    record.get("description") or "")


def dedupe_key(record: dict) -> str:
    """Same employer + same normalized title + same location = one job."""
    parts = [
        (record.get("employer") or "").lower().strip(),
        " ".join((record.get("title") or "").lower().split()),
        (record.get("location_raw") or "").lower().strip(),
    ]
    return hashlib.sha1("|".join(parts).encode()).hexdigest()[:16]


def text_hash(description: str) -> str:
    return hashlib.sha256((description or "").encode()).hexdigest()[:16]


def days_since(iso: str | None, today: dt.date) -> int | None:
    if not iso:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%f%z"):
        try:
            parsed = dt.datetime.strptime(iso[:26] if "." in iso else iso, fmt)
            return (today - parsed.date()).days
        except ValueError:
            continue
    try:
        return (today - dt.datetime.fromisoformat(iso.replace("Z", "+00:00")).date()).days
    except (ValueError, AttributeError):
        return None


def employer_screen_flags(config_dir: pathlib.Path) -> dict[str, dict]:
    """Per-employer screening flags, read at BUILD time rather than collection.

    `diversified` / `off_umbrella` used to be stamped onto each record by
    collect/run.py, which meant a new guard could not be applied to snapshots
    already committed -- it needed a fresh collection to take effect. Screening
    is a decision about the corpus, not a property of the fetch, so it is read
    here and applies to every snapshot on disk immediately.
    """
    cfg = yaml.safe_load((config_dir / "employers.yaml").read_text())
    flags: dict[str, dict] = {}
    for group, entries in (cfg or {}).items():
        if group in ("discovery", "rejected_tokens") or not isinstance(entries, list):
            continue
        for e in entries:
            if not isinstance(e, dict) or not e.get("name"):
                continue
            flags[e["name"]] = {
                "diversified": bool(e.get("diversified")),
                "off_umbrella": e.get("off_umbrella") or [],
                "requires_sector_evidence": bool(e.get("requires_sector_evidence")),
            }
    return flags


def build(raw_root: pathlib.Path, out_dir: pathlib.Path, config_dir: pathlib.Path) -> dict:
    scope = yaml.safe_load((config_dir / "scope.yaml").read_text())
    screen_flags = employer_screen_flags(config_dir)
    dictionary = load_dictionary(config_dir / "regressors.yaml")
    gazetteer = geo.load_gazetteer(ROOT / "data" / "gazetteer.json")
    metros = {k: v for k, v in scope["metros"].items() if v.get("enabled") is not False}
    national = bool(scope.get("geography", {}).get("national"))
    # Mandate status is a property of the posting's state, read from config
    # so a reader can audit which jurisdictions count and why.
    mandate_states = {str(k).upper() for k in (scope.get("pay_mandate_states") or {})}
    # BEA regional price parities, if a collection run fetched them. Absent is
    # a normal state: the price-adjusted column is then blank and analyze.py
    # reports that model as unavailable. Nothing is imputed — a fabricated
    # deflator applied to every row would be invisible and wrong.
    rpp_path = ROOT / "data" / "rpp_by_state.json"
    rpp_table, rpp_vintage = {}, None
    if rpp_path.exists():
        _rpp = json.loads(rpp_path.read_text())
        rpp_table = {k.upper(): float(v) for k, v in (_rpp.get("values") or {}).items()}
        rpp_vintage = _rpp.get("_vintage")
        print(f"price parities: {len(rpp_table)} states, vintage {rpp_vintage}")
    else:
        print("price parities: none fetched; real-pay columns will be blank")
    hours = scope["pay"]["hours_per_year"]
    today = dt.date.today()

    # Seeded so every stage reports a number, including zero. A Counter drops
    # keys that never increment, which made "nothing was rejected on geography"
    # and "the geography stage did not run" indistinguishable in the funnel.
    funnel = Counter({
        "raw": 0, "rejected_off_umbrella": 0,
        "rejected_no_sector_evidence": 0, "rejected_screen": 0,
        "passed_screen": 0, "rejected_geo": 0, "passed_geo": 0,
        "duplicate_sighting": 0, "unique_in_scope": 0, "usable_with_pay": 0,
    })
    reject_reasons = Counter()
    rows: dict[str, dict] = {}
    first_seen: dict[str, str] = {}

    snapshot_dirs = sorted(d for d in raw_root.iterdir() if d.is_dir()) if raw_root.exists() else []

    for snapshot in snapshot_dirs:
        run_date = snapshot.name
        for path in sorted(snapshot.glob("*.json")):
            if path.name == "manifest.json":
                continue
            try:
                records = json.loads(path.read_text())
            except json.JSONDecodeError:
                continue
            for rec in records:
                funnel["raw"] += 1
                key = dedupe_key(rec)
                first_seen.setdefault(key, run_date)

                title = rec.get("title") or ""
                description = rec.get("description") or ""

                # Config wins over whatever the snapshot happened to record,
                # so a guard added today applies to data collected yesterday.
                rec = {**rec, **screen_flags.get(rec.get("employer") or "", {})}

                if off_umbrella(rec):
                    funnel["rejected_off_umbrella"] += 1
                    reject_reasons["off_umbrella_line_of_business"] += 1
                    continue

                if lacks_sector_evidence(rec):
                    funnel["rejected_no_sector_evidence"] += 1
                    reject_reasons["no_sector_evidence_in_posting"] += 1
                    continue

                passed, reasons, detail = screen_all(title, description, scope)
                if not passed:
                    for reason in reasons:
                        reject_reasons[reason] += 1
                    funnel["rejected_screen"] += 1
                    continue
                funnel["passed_screen"] += 1

                location_raw = rec.get("location_raw") or ""
                place = geo.resolve(location_raw, metros, gazetteer, description)
                # National scope: a posting qualifies on being in the US, and
                # study-metro membership becomes a regressor rather than a gate.
                # The state is what identifies the mandate contrast, so a US
                # posting we cannot place to a state is no use to the pay model
                # and is rejected here rather than carried with a blank.
                us_state = geo.resolve_us_state(location_raw) if national else None
                # EVERY state the posting lists. A pay-transparency law attaches
                # to the job's location, so a posting naming several places is
                # covered if any one of them is covered.
                states_listed = geo.resolve_us_states(location_raw) if national else []
                if national:
                    if geo.is_non_us(location_raw):
                        funnel["rejected_geo"] += 1
                        reject_reasons["non_us"] += 1
                        continue
                    if us_state is None and not place.in_scope:
                        funnel["rejected_geo"] += 1
                        reject_reasons["no_us_state"] += 1
                        continue
                elif not place.in_scope:
                    funnel["rejected_geo"] += 1
                    reject_reasons["out_of_metro"] += 1
                    continue
                funnel["passed_geo"] += 1

                money = pay.extract(
                    description,
                    rec.get("comp_min"),
                    rec.get("comp_max"),
                    rec.get("comp_interval"),
                    hours_per_year=hours,
                )
                coded = code_posting(title, description, dictionary)
                years_min, years_excerpt = extract_years(description)
                metro_spec = scope["metros"].get(place.metro) or {}
                # State comes from the national resolver first: it reads the
                # posting's own location, where a metro's declared state is
                # only the metro's. They agree for in-metro postings.
                state = us_state or place.state or metro_spec.get("state") or ""
                rank = seniority_rank(title, description)

                row = {
                    "posting_key": key,
                    "employer": rec.get("employer"),
                    "industry": rec.get("industry"),
                    "title": title,
                    "role_family": role_family(title),
                    "job_level": extract_job_level(title),
                    "ats_platform": rec.get("platform"),
                    "url": rec.get("url"),
                    "metro": place.metro or "",
                    "study_metro": int(bool(place.metro)
                                       and place.metro != geo.REMOTE_NATIONAL),
                    "tier": place.tier if place.tier is not None else "",
                    "state": state,
                    "census_region": geo.census_region(state) or "",
                    # Every state the posting lists, so the mandate rule is
                    # auditable and multi-site postings can be controlled for.
                    "states_listed": ";".join(states_listed),
                    "n_locations": len(states_listed),
                    # Mandate status is read from the POSTING's locations, not
                    # from the metro it sits in, and ANY covered location counts.
                    # Taking the first-listed state understated coverage on 9 of
                    # 141 rows in audit round 3 — seven of which disclosed pay,
                    # which is what being covered predicts.
                    "mandate_state": int(
                        bool({s.upper() for s in states_listed} & mandate_states)
                        or state.upper() in mandate_states),
                    "seniority_rank": rank,
                    "seniority_label": SENIORITY_LABELS.get(rank, ""),
                    "early_career": int(is_early_career(rank, years_min)),
                    # One requisition advertising several rungs. Ranked at its
                    # floor; the flag lets the model absorb the extra variance.
                    "is_level_range": int(is_level_range(title)),
                    "distance_miles": place.distance_miles,
                    "work_arrangement": place.work_arrangement,
                    "remote_eligible": int(place.remote_eligible),
                    "posted_at": rec.get("posted_at"),
                    "posting_age_days": days_since(rec.get("posted_at"), today),
                    "first_seen_run": first_seen[key],
                    "last_seen_run": run_date,
                    "yrs_exp_min": years_min if years_min is not None else "",
                    "yrs_exp_excerpt": years_excerpt or "",
                    "pay_disclosed": int(money.disclosed),
                    "pay_min": money.pay_min if money.pay_min is not None else "",
                    "pay_max": money.pay_max if money.pay_max is not None else "",
                    "pay_midpoint": money.midpoint if money.midpoint is not None else "",
                    # Nominal pay deflated to national price levels. RPP is a
                    # percentage of the US average, so dividing by RPP/100
                    # expresses the wage in national-average dollars.
                    "rpp": rpp_table.get(state.upper(), ""),
                    "pay_midpoint_real": (
                        round(money.midpoint / (rpp_table[state.upper()] / 100.0), 2)
                        if money.midpoint is not None and state.upper() in rpp_table
                        else ""
                    ),
                    "pay_range_width": (
                        money.pay_max - money.pay_min
                        if money.pay_max is not None and money.pay_min is not None
                        else ""
                    ),
                    "pay_source": money.source or "",
                    "pay_unit_original": money.unit_original or "",
                    "hourly_original": int(money.hourly_original),
                    "pay_single_figure": int(money.single_figure),
                    "pay_excerpt": (money.raw_excerpt or "")[:120],
                    "description_hash": text_hash(description),
                    "description_chars": len(description),
                }
                row.update(coded.values)
                # A repeat sighting refreshes last_seen but keeps first_seen.
                if key in rows:
                    rows[key]["last_seen_run"] = run_date
                    funnel["duplicate_sighting"] += 1
                else:
                    rows[key] = row

    out_dir.mkdir(parents=True, exist_ok=True)
    unique = list(rows.values())
    funnel["unique_in_scope"] = len(unique)
    funnel["usable_with_pay"] = sum(1 for r in unique if r["pay_disclosed"] == 1)

    by_metro = Counter(r["metro"] for r in unique if r["pay_disclosed"] == 1)
    by_employer = Counter(r["employer"] for r in unique if r["pay_disclosed"] == 1)

    # These three are computed from the same rows with the same filter, so they
    # cannot legitimately disagree. They disagreed anyway in the commit from
    # run 21 (usable_with_pay 103, by_metro 107, by_employer 137) because the
    # workflow's `git pull -X ours` textually MERGED two runs' derived files:
    # -X ours resolves conflicting hunks in our favour but still takes
    # non-conflicting hunks from both sides, and two runs' CSV rows sit on
    # different lines and do not conflict.
    #
    # Nothing crashed. The artifacts were syntactically valid and claimed 137
    # observations across 23 employers — better than the truth on every metric
    # the study is judged by, which is the direction least likely to be
    # questioned. Asserting here makes that state impossible to write, let
    # alone commit.
    n_pay = funnel["usable_with_pay"]
    if sum(by_metro.values()) != n_pay or sum(by_employer.values()) != n_pay:
        raise SystemExit(
            f"funnel totals disagree: usable_with_pay={n_pay}, "
            f"by_metro={sum(by_metro.values())}, by_employer={sum(by_employer.values())}. "
            "This means the derived artifacts were merged rather than rebuilt. "
            "Rebuild from data/raw/, which is authoritative."
        )

    csv_path = out_dir / "postings.csv"
    if unique:
        fieldnames = list(unique[0].keys())
        with csv_path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(unique)
    written = (sum(1 for _ in csv_path.open()) - 1) if csv_path.exists() else 0
    if written != funnel["unique_in_scope"]:
        raise SystemExit(
            f"postings.csv has {written} rows but the funnel counted "
            f"{funnel['unique_in_scope']} unique postings. The CSV was merged, "
            "not rebuilt."
        )

    report = {
        "built_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "snapshots": [d.name for d in snapshot_dirs],
        "funnel": dict(funnel),
        "rejection_reasons": dict(reject_reasons.most_common()),
        "usable_by_metro": dict(by_metro),
        "usable_by_employer": dict(by_employer.most_common()),
        "distinct_employers_with_pay": len(by_employer),
        "min_usable_n": scope["study"]["min_usable_n"],
        "floor_met": funnel["usable_with_pay"] >= scope["study"]["min_usable_n"],
    }
    (out_dir / "selection_funnel.json").write_text(json.dumps(report, indent=2))
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the analysis dataset from raw snapshots.")
    parser.add_argument("--raw", default=str(ROOT / "data" / "raw"))
    parser.add_argument("--out", default=str(ROOT / "data" / "analysis"))
    parser.add_argument("--config", default=str(ROOT / "config"))
    args = parser.parse_args()

    report = build(pathlib.Path(args.raw), pathlib.Path(args.out), pathlib.Path(args.config))
    print(json.dumps(report["funnel"], indent=2))
    print(f"\nusable observations (in scope, pay disclosed): {report['funnel'].get('usable_with_pay', 0)}")
    print(f"distinct employers with pay: {report['distinct_employers_with_pay']}")
    print(f"floor of {report['min_usable_n']} met: {report['floor_met']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

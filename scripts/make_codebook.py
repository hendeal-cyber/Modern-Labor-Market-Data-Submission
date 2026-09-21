"""Generate docs/codebook.md from the configs, so docs cannot drift from code."""
import pathlib, sys, yaml
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from lmstudy.code_regressors import load_dictionary

scope = yaml.safe_load((ROOT / "config" / "scope.yaml").read_text())
D = load_dictionary(ROOT / "config" / "regressors.yaml")

DERIVED = [
 ("posting_key","string","SHA1 of employer + normalized title + location; the dedup key."),
 ("employer","string","Employer name from the sampling frame."),
 ("industry","categorical","utility | data_center | cooperative | retailer | grid_operator | energy_analytics | developer | consulting | grid_vendor. Utility is the model's reference category."),
 ("role_family","categorical","siting_dev | regulatory | market_commercial | grid_power | ai_ml | gis | software_data | sustainability | other. Keeps a widened role taxonomy from silently pooling different pay regimes; software_data is the reference category."),
 ("job_level","ordinal","0 unlevelled, 1 = I/Associate/Junior, 2 = II/Analyst, 3 = III/Senior Associate. Records the rung on the early-career ladder. It does NOT decide early-career status; the experience parse does."),
 ("title","string","Posting title as published."),
 ("ats_platform","categorical","Which ATS served the posting. Provenance control, not a labor-market attribute."),
 ("metro","categorical","A study metro when the posting falls inside one, remote_national for a US-wide remote posting, blank otherwise. Since the national rescope this is a descriptor, not a filter."),
 ("study_metro","binary","1 if the posting sits inside one of the ten study metros. Lets metro-resident and other postings be compared without dropping either."),
 ("tier","int","Scope tier the observation entered through."),
 ("state","string","State of the FIRST listed work location. Regional dummies are built from this; see states_listed for the full set."),
 ("states_listed","string","Every US state the posting lists, semicolon-separated. Roughly a quarter of postings name more than one location, so this is what mandate_state is computed from."),
 ("n_locations","int","How many distinct US states the posting lists. 0 for a location-free remote posting."),
 ("census_region","categorical","northeast | midwest | south | west, from the US Census definition. Midwest is the model's reference category because it holds Chicago and Indianapolis, the metros the study began with."),
 ("mandate_state","binary","1 if ANY listed location is in a state requiring a pay scale in the posting itself. Coverage attaches to the job's location, so any covered location makes the posting covered; the first-listed rule understated this on 9 of 141 rows in audit round 3. The jurisdiction list with effective dates is config/scope.yaml."),
 ("seniority_rank","ordinal","0 intern, 1 entry, 2 mid or unlevelled, 3 senior, 4 staff/principal, 5 manager, 6 director, 7 VP and above. Read from the title. Was an exclusion screen until 2026-09-21; now the headline regressor. An unlevelled title defaults to 2 (mid), not 1 — assuming entry would bias the coefficient toward zero across the unlevelled majority."),
 ("seniority_label","string","The human-readable name of seniority_rank."),
 ("is_level_range","binary","1 when one requisition advertises several rungs ('Resource Planning Analyst I or II or Senior'). Such titles are ranked at their FLOOR — the level the employer will hire at, and the one the advertised pay floor corresponds to. Ranking at the ceiling biased seniority upward on 6% of rows."),
 ("early_career","binary","1 if seniority_rank <= 1, or a stated minimum of three years or fewer at rank <= 2. Derived, not enforced: it defines the pre-specified subsample that preserves the study's original question."),
 ("rpp","numeric","BEA Regional Price Parity for the state, all items, US average = 100. Blank when the table has not been fetched; no value is ever imputed."),
 ("pay_midpoint_real","numeric","pay_midpoint deflated by rpp/100, expressing the wage in national-average dollars. Blank whenever rpp is blank."),
 ("distance_miles","numeric","Great-circle miles from the metro centroid; blank for location-free remote postings."),
 ("work_arrangement","categorical","onsite | hybrid | remote | unspecified."),
 ("remote_eligible","binary","1 if the posting is remote-eligible."),
 ("posted_at","date","Publication timestamp as reported by the ATS."),
 ("posting_age_days","numeric","Days between posted_at and the build date."),
 ("first_seen_run","date","First collection run that observed this posting."),
 ("last_seen_run","date","Most recent run that observed it; with first_seen it gives time-on-market."),
 ("yrs_exp_min","numeric","Minimum years of experience parsed from the text; blank if unstated. Imputed to 0 in the model, which is why yrs_exp_stated must always accompany it."),
 ("yrs_exp_stated","binary","1 if the posting states an experience minimum at all. It MUST travel with yrs_exp_min in every specification: unstated postings are imputed to zero, and without this indicator that imputation is indistinguishable from a genuine 'no experience required'. Dropping it would silently bias the experience coefficient."),
 ("pay_disclosed","binary","1 if a usable pay figure was found. The selection indicator."),
 ("pay_min / pay_max","numeric","Annualized USD range bounds."),
 ("pay_midpoint","numeric","Annualized midpoint. log of this is the dependent variable."),
 ("pay_range_width","numeric","pay_max - pay_min. Secondary outcome: employer pay-setting uncertainty."),
 ("pay_source","categorical","structured (ATS field) | text (parsed from description)."),
 ("pay_unit_original","categorical","year | hour | month, before annualizing."),
 ("hourly_original","binary","1 if the posting quoted an hourly rate (annualized at 2,080 hrs)."),
 ("pay_single_figure","binary","1 if a point value rather than a range was found. Exclude in robustness checks."),
 ("description_hash","string","SHA256 prefix of the description, for integrity checking."),
 ("description_chars","numeric","Description length; a rough control for posting detail."),
]

def esc(text: str) -> str:
    """Escape pipes so values like 'utility | data_center' do not break the table."""
    return str(text).replace("|", "\\|")


lines = ["# Codebook", "",
 f"Dependent variable: **{scope['study']['dependent_variable']}**.", "",
 "Generated by `scripts/make_codebook.py` from `config/scope.yaml` and",
 "`config/regressors.yaml`. Do not edit by hand.", "",
 "## Identifiers, context, and outcome variables", "",
 "| Variable | Type | Definition |", "|---|---|---|"]
for name, typ, desc in DERIVED:
    lines.append(f"| `{esc(name)}` | {typ} | {esc(desc)} |")

lines += ["", "## Coded regressors", "",
 f"{len(D)} regressors coded from posting text by word-boundary pattern matching.",
 "A negation pattern forces an otherwise-positive match back to 0.", ""]
by_group = {}
for name, spec in D.items():
    by_group.setdefault(spec["group"], []).append((name, spec))
for group, items in by_group.items():
    lines += [f"### {group.replace('_',' ').title()}", "",
              "| Variable | Definition | Example patterns | Negations |", "|---|---|---|---|"]
    for name, spec in items:
        pats = ", ".join(f"`{p}`" for p in spec.get("patterns", [])[:4])
        if len(spec.get("patterns", [])) > 4:
            pats += f", … ({len(spec['patterns'])} total)"
        negs = ", ".join(f"`{n}`" for n in spec.get("negations", [])) or "—"
        lines.append(f"| `{name}` | {esc(spec.get('description',''))} | {pats} | {negs} |")
    lines.append("")

out = ROOT / "docs" / "codebook.md"
out.write_text("\n".join(lines) + "\n")
print(f"wrote {out} ({len(D)} regressors, {len(DERIVED)} derived variables)")

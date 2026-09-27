"""USAJOBS adapter (source route 3): parsing, pay, location, and skipping
cleanly without the key.

The fixture is the sample Search API response published in USAJOBS's own
developer documentation (developer.usajobs.gov/api-reference/get-api-search,
saved by the registry job to data/registry/raw/usajobs_search_api.txt), not
an invented shape. Replace it with a live response once the key exists.
"""
import copy, json, os, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from lmstudy.collect import ats, discover        # noqa: E402
from lmstudy import pay, geo                      # noqa: E402
from lmstudy.netclient import Response            # noqa: E402

DOC = json.loads((ROOT / "tests" / "fixtures" / "usajobs_search_doc_example.json").read_text())


class FakeSession:
    def __init__(self, body):
        self.body, self.calls = body, []

    def get_json_with_headers(self, url, headers, **kw):
        self.calls.append((url, dict(headers)))
        return Response(url, 200, data=self.body)


class NoNetwork:
    def __getattr__(self, name):
        raise AssertionError(f"network used without the USAJOBS key: {name}")


def run():
    fails, total = [], 0

    def check(cond, msg):
        nonlocal total
        total += 1
        if not cond:
            fails.append(msg)

    item = DOC["SearchResult"]["SearchResultItems"][0]
    p = ats.parse_usajobs_item(item, "DD", "Example Agency")
    check(p.platform == "usajobs" and p.board_token == "DD", "platform/token not recorded")
    check(p.title == "IT SPECIALIST (INFOSEC/NETWORK)", f"title wrong: {p.title!r}")
    check(p.url == "https://www.usajobs.gov/GetJob/ViewDetails/21947200", f"url wrong: {p.url!r}")
    check(p.external_id == "21947200", f"id wrong: {p.external_id!r}")
    check((p.comp_min, p.comp_max, p.comp_interval) == (92108.0, 119746.0, "year"),
          f"pay wrong: {(p.comp_min, p.comp_max, p.comp_interval)}")
    r = pay.from_structured(p.comp_min, p.comp_max, p.comp_interval)
    check(r.disclosed and r.midpoint == (92108 + 119746) / 2, f"structured pay not read: {r}")
    check(geo.resolve_us_state(p.location_raw) == "CA",
          f"location {p.location_raw!r} did not resolve to CA")
    check("Major Duties" in p.description, "UserArea details missing from the description")

    # A rate the study cannot annualise (without compensation) is left unparsed.
    odd = copy.deepcopy(item)
    odd["MatchedObjectDescriptor"]["PositionRemuneration"][0]["RateIntervalCode"] = "WC"
    q = ats.parse_usajobs_item(odd, "DD", "x")
    check(q.comp_min is None and q.comp_interval is None, "without-compensation rate was parsed as pay")

    # Without the secrets: nothing is requested and nothing is returned.
    saved = {k: os.environ.pop(k, None) for k in ("USAJOBS_API_KEY", "USAJOBS_USER_AGENT")}
    try:
        out, resp = ats.fetch_usajobs(NoNetwork(), "DN03", "Bonneville Power Administration")
        check(out == [] and not resp.ok, "adapter ran without its key")
        check(discover.probe(NoNetwork(), "Bonneville Power Administration", "usajobs", "DN03") is None,
              "probe reported a board without the key")
        # With them: the documented headers are sent and the page is parsed.
        os.environ["USAJOBS_API_KEY"] = "test-key"
        os.environ["USAJOBS_USER_AGENT"] = "researcher@example.edu"
        fake = FakeSession(DOC)
        out, resp = ats.fetch_usajobs(fake, "DN03", "Bonneville Power Administration")
        url, headers = fake.calls[0]
        check(headers.get("Authorization-Key") == "test-key"
              and headers.get("User-Agent") == "researcher@example.edu",
              f"documented headers not sent: {headers}")
        check("Organization=DN03" in url and "ResultsPerPage=500" in url,
              f"search not scoped to the agency: {url}")
        check(len(out) == 1 and resp.ok and resp.listed == 1, f"page not parsed: {len(out)}, {resp}")
    finally:
        for k in ("USAJOBS_API_KEY", "USAJOBS_USER_AGENT"):
            os.environ.pop(k, None)
            if saved[k] is not None:
                os.environ[k] = saved[k]
    check("usajobs" in ats.FETCHERS, "usajobs not registered as a platform")

    print(f"usajobs: {total - len(fails)}/{total} checks passed")
    for f in fails:
        print("  FAIL", f)
    return len(fails)


if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

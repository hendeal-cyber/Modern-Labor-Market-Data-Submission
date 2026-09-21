"""Syndication-feed probe: parsing, and the guard that matters more.

A feed that parses is not a feed that is usable. Syndication feeds normally
carry a teaser rather than the full job description, and this study extracts
pay, benefits, required experience and every coded regressor from the body.
A feed of 200-character summaries would parse perfectly and produce a dataset
with no pay in it, which is worse than no feed at all — the pipeline would look
like it was working.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from lmstudy.collect.ats import parse_feed, feed_quality, RawPosting, FEED_PATTERNS


def post(desc, location="Chicago, IL"):
    return RawPosting("icims_feed", "E", "t", "1", "Analyst", location, desc, "u")


def run():
    fails = []

    # 1. RSS 2.0 parses, and HTML entities in the description are decoded.
    rss = """<?xml version="1.0"?><rss version="2.0"><channel>
    <item><title>Analyst, Regulatory</title><link>https://x/1</link>
    <description>&lt;p&gt;Body text&lt;/p&gt;</description>
    <pubDate>Mon, 01 Sep 2026</pubDate></item></channel></rss>"""
    items = parse_feed(rss)
    if len(items) != 1 or items[0]["title"] != "Analyst, Regulatory":
        fails.append(f"RSS parse failed: {items}")
    elif items[0]["description"] != "Body text":
        fails.append(f"RSS description not unescaped: {items[0]['description']!r}")

    # 2. Atom parses, and the link comes from the href attribute, not the body.
    atom = """<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
    <entry><title>Engineer II</title><link href="https://x/2"/>
    <summary>Body</summary></entry></feed>"""
    items = parse_feed(atom)
    if len(items) != 1 or items[0]["link"] != "https://x/2":
        fails.append(f"Atom parse failed: {items}")

    # 3. A portal that serves an HTML error page instead of a 404 must yield
    # nothing, not one bogus posting titled "Page not found".
    for junk in ("<html><body>Page not found</body></html>", "not xml", "", "<"):
        if parse_feed(junk):
            fails.append(f"junk parsed as a feed: {junk!r}")

    # 4. An item with no title is not a posting.
    if parse_feed("""<rss><channel><item><link>https://x</link></item></channel></rss>"""):
        fails.append("a titleless item must not become a posting")

    # 5. THE GUARD: teaser-length descriptions are rejected even though they
    # parse. This is the failure mode that would poison the dataset silently.
    teasers = [post("Short blurb about the role, apply now.") for _ in range(10)]
    q = feed_quality(teasers)
    if q["usable"]:
        fails.append(f"teaser feed wrongly judged usable: {q}")

    # 6. Full-length descriptions are accepted.
    full = [post("x" * 4000) for _ in range(10)]
    q = feed_quality(full)
    if not q["usable"]:
        fails.append(f"full-text feed wrongly rejected: {q}")

    # 7. Full text but no locations is not usable: geography is a screen, and
    # a posting with no place cannot be assigned to a metro.
    q = feed_quality([post("x" * 4000, location="") for _ in range(10)])
    if q["usable"]:
        fails.append(f"feed with no locations wrongly judged usable: {q}")

    # 8. An empty feed is not usable and must not divide by zero.
    if feed_quality([])["usable"]:
        fails.append("empty feed judged usable")

    # 9. Every declared pattern is a formattable template.
    for kind, patterns in FEED_PATTERNS.items():
        for pattern in patterns:
            try:
                url = pattern.format(tenant="acme")
            except (KeyError, IndexError) as exc:
                fails.append(f"{kind} pattern {pattern!r} not formattable: {exc}")
                continue
            if "{" in url or "acme" not in url:
                fails.append(f"{kind} pattern did not substitute: {url}")

    total = 9
    print(f"feeds: {total - len(fails)}/{total} checks passed")
    for f in fails:
        print("  FAIL", f)
    return len(fails)


if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

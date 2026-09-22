#!/usr/bin/env python3
"""Record a verification outcome in config/token-verification.yaml.

    ledger_set.py confirm "Employer" --platform greenhouse --token tok --url URL
    ledger_set.py deny    "Employer" --reason "runs NEOGOV; no supported ATS"

Kept as a script rather than hand-editing the YAML so every entry carries a
date and either evidence or a reason, and so a long pass cannot drift into
half-filled rows.
"""
import argparse, datetime, pathlib, sys, yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
LEDGER = ROOT / "config" / "token-verification.yaml"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["confirm", "deny"])
    ap.add_argument("employer")
    ap.add_argument("--platform"); ap.add_argument("--token")
    ap.add_argument("--url"); ap.add_argument("--reason")
    ap.add_argument("--note")
    a = ap.parse_args()

    led = yaml.safe_load(LEDGER.read_text())
    emps = led["employers"]
    if a.employer not in emps:
        print(f"unknown employer: {a.employer!r}", file=sys.stderr)
        close = [k for k in emps if a.employer.lower() in k.lower()]
        if close:
            print("did you mean: " + ", ".join(close[:5]), file=sys.stderr)
        return 1
    row = emps[a.employer]
    today = datetime.date.today().isoformat()
    if a.action == "confirm":
        if not (a.platform and a.token and a.url):
            print("confirm needs --platform, --token and --url", file=sys.stderr)
            return 1
        row.update(status="confirmed", platform=a.platform, token=a.token,
                   evidence=a.url, checked_on=today)
    else:
        if not a.reason:
            print("deny needs --reason", file=sys.stderr)
            return 1
        row.update(status="denied", reason=a.reason, checked_on=today)
        row.pop("platform", None); row.pop("token", None)
    if a.note:
        row["note"] = a.note
    LEDGER.write_text(yaml.safe_dump(led, sort_keys=False, allow_unicode=True, width=100))
    print(f"{a.action}: {a.employer}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

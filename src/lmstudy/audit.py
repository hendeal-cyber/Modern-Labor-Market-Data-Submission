"""Audit the rule-based regressor coding against hand-coded truth.

Workflow:
  1. `sample`  — draw a stratified random sample and write a blank audit sheet.
  2. (human)   — fill in the true 0/1 for each regressor in the sheet.
  3. `score`   — compare rules against truth, per regressor.

Stratification is by metro, industry and pay disclosure, so the audit does not
over-sample the largest employer. The gold set is never used to tune rules, so
its accuracy figures stay out-of-sample.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import pathlib
import random
import sys
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from lmstudy.code_regressors import load_dictionary  # noqa: E402


def stratified_sample(rows: list[dict], n: int, seed: int = 20260920) -> list[dict]:
    """Proportional allocation across (metro, industry, pay_disclosed)."""
    rng = random.Random(seed)
    strata: dict[tuple, list[dict]] = defaultdict(list)
    for row in rows:
        strata[(row.get("metro"), row.get("industry"), row.get("pay_disclosed"))].append(row)

    total = len(rows)
    if total == 0:
        return []
    n = min(n, total)

    picked: list[dict] = []
    # Largest-remainder allocation keeps the sample proportional without
    # rounding a small stratum down to zero.
    quotas = []
    for key, bucket in strata.items():
        exact = len(bucket) * n / total
        quotas.append([key, int(exact), exact - int(exact)])
    allocated = sum(q[1] for q in quotas)
    for q in sorted(quotas, key=lambda x: -x[2])[: n - allocated]:
        q[1] += 1
    for key, take, _ in quotas:
        bucket = strata[key]
        rng.shuffle(bucket)
        picked.extend(bucket[:take])
    rng.shuffle(picked)
    return picked


def write_sheet(rows: list[dict], out_path: pathlib.Path, regressors: list[str]) -> None:
    """Blank audit sheet: context columns, then one empty column per regressor."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    context = ["posting_key", "employer", "industry", "metro", "title", "url",
               "pay_disclosed", "pay_midpoint", "pay_excerpt"]
    with out_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(context + [f"true_{r}" for r in regressors])
        for row in rows:
            writer.writerow([row.get(c, "") for c in context] + [""] * len(regressors))


def score(coded_rows: list[dict], truth_rows: list[dict], regressors: list[str]) -> dict:
    """Per-regressor precision, recall, F1, accuracy and Cohen's kappa."""
    coded_by_key = {r["posting_key"]: r for r in coded_rows}
    results = {}
    for reg in regressors:
        tp = fp = fn = tn = 0
        for truth in truth_rows:
            raw = (truth.get(f"true_{reg}") or "").strip()
            if raw == "":
                continue                       # unjudged cell
            predicted_row = coded_by_key.get(truth["posting_key"])
            if predicted_row is None:
                continue
            actual = int(raw)
            predicted = int(predicted_row.get(reg, 0) or 0)
            if predicted and actual:
                tp += 1
            elif predicted and not actual:
                fp += 1
            elif not predicted and actual:
                fn += 1
            else:
                tn += 1
        n = tp + fp + fn + tn
        if n == 0:
            results[reg] = {"n": 0, "note": "no judged cells"}
            continue
        precision = tp / (tp + fp) if (tp + fp) else None
        recall = tp / (tp + fn) if (tp + fn) else None
        f1 = (
            2 * precision * recall / (precision + recall)
            if precision and recall and (precision + recall)
            else None
        )
        accuracy = (tp + tn) / n
        # Cohen's kappa: agreement corrected for chance.
        p_yes = ((tp + fp) / n) * ((tp + fn) / n)
        p_no = ((fn + tn) / n) * ((fp + tn) / n)
        expected = p_yes + p_no
        kappa = (accuracy - expected) / (1 - expected) if expected < 1 else 1.0
        results[reg] = {
            "n": n, "tp": tp, "fp": fp, "fn": fn, "tn": tn,
            "precision": round(precision, 3) if precision is not None else None,
            "recall": round(recall, 3) if recall is not None else None,
            "f1": round(f1, 3) if f1 is not None else None,
            "accuracy": round(accuracy, 3),
            "kappa": round(kappa, 3),
            "below_threshold": (accuracy < 0.90),
        }
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit regressor coding accuracy.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("sample", help="draw a stratified sample and write a blank sheet")
    s.add_argument("--n", type=int, default=100)
    s.add_argument("--dataset", default=str(ROOT / "data" / "analysis" / "postings.csv"))
    s.add_argument("--out", default=None)
    s.add_argument("--seed", type=int, default=20260920)

    c = sub.add_parser("score", help="score a filled sheet against the coded dataset")
    c.add_argument("--sheet", required=True)
    c.add_argument("--dataset", default=str(ROOT / "data" / "analysis" / "postings.csv"))
    c.add_argument("--out", default=None)

    args = parser.parse_args()
    regressors = list(load_dictionary().keys())
    dataset = pathlib.Path(args.dataset)
    if not dataset.exists():
        print(f"dataset not found: {dataset}")
        return 1
    rows = list(csv.DictReader(dataset.open(encoding="utf-8")))

    if args.cmd == "sample":
        picked = stratified_sample(rows, args.n, args.seed)
        stamp = dt.date.today().isoformat()
        out = pathlib.Path(args.out or ROOT / "data" / "gold" / f"audit-sheet-{stamp}.csv")
        write_sheet(picked, out, regressors)
        print(f"wrote {len(picked)} rows to {out}")
        print("Fill each true_<regressor> column with 0 or 1, then run: audit.py score --sheet <file>")
        return 0

    truth = list(csv.DictReader(pathlib.Path(args.sheet).open(encoding="utf-8")))
    results = score(rows, truth, regressors)
    judged = [r for r in results.values() if r.get("n")]
    weak = sorted(
        (reg for reg, r in results.items() if r.get("below_threshold")),
        key=lambda reg: results[reg]["accuracy"],
    )
    summary = {
        "scored_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "sheet": str(args.sheet),
        "regressors_judged": len(judged),
        "mean_accuracy": round(sum(r["accuracy"] for r in judged) / len(judged), 3) if judged else None,
        "below_threshold": weak,
        "per_regressor": results,
    }
    out = pathlib.Path(args.out or ROOT / "data" / "gold" / "audit-scores.json")
    out.write_text(json.dumps(summary, indent=2))
    print(json.dumps({k: summary[k] for k in
                      ("regressors_judged", "mean_accuracy", "below_threshold")}, indent=2))
    print(f"\nfull results -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

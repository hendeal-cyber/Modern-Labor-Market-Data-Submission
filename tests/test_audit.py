"""Audit scorer tests with hand-computable answers."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))
from lmstudy.audit import score, stratified_sample

def run():
    fails = []
    # 10 postings. Rules say 1 for keys 1-5, 0 for 6-10.
    coded = [{"posting_key": str(i), "x": 1 if i <= 5 else 0} for i in range(1, 11)]
    # Truth: keys 1-4 really are 1 (so key 5 is a false positive),
    #        key 6 really is 1 (a false negative), 7-10 really are 0.
    truth = []
    for i in range(1, 11):
        actual = 1 if i <= 4 or i == 6 else 0
        truth.append({"posting_key": str(i), "true_x": str(actual)})

    r = score(coded, truth, ["x"])["x"]
    # tp=4 (1-4), fp=1 (5), fn=1 (6), tn=4 (7-10)
    expect = {"tp": 4, "fp": 1, "fn": 1, "tn": 4, "n": 10,
              "precision": 0.8, "recall": 0.8, "f1": 0.8, "accuracy": 0.8}
    for k, want in expect.items():
        if r[k] != want:
            fails.append(f"score[{k}]={r[k]} want {want}")
    # kappa: po=0.8, pe=(5/10)(5/10)+(5/10)(5/10)=0.5 -> (0.8-0.5)/0.5 = 0.6
    if r["kappa"] != 0.6:
        fails.append(f"kappa={r['kappa']} want 0.6")
    if not r["below_threshold"]:
        fails.append("accuracy 0.8 should be flagged below the 0.90 threshold")

    # Blank cells are skipped rather than counted as 0.
    partial = [{"posting_key": "1", "true_x": "1"}, {"posting_key": "2", "true_x": ""}]
    if score(coded, partial, ["x"])["x"]["n"] != 1:
        fails.append("blank truth cells must be skipped")

    # Stratification keeps sample size exact and respects strata presence.
    rows = ([{"posting_key": f"c{i}", "metro": "chicago", "industry": "utility", "pay_disclosed": "1"} for i in range(80)]
            + [{"posting_key": f"i{i}", "metro": "indianapolis", "industry": "data_center", "pay_disclosed": "0"} for i in range(20)])
    picked = stratified_sample(rows, 10)
    if len(picked) != 10:
        fails.append(f"stratified sample size {len(picked)} want 10")
    if not any(p["metro"] == "indianapolis" for p in picked):
        fails.append("small stratum was rounded away entirely")
    # Deterministic under a fixed seed.
    if [p["posting_key"] for p in stratified_sample(rows, 10)] != [p["posting_key"] for p in picked]:
        fails.append("sampling is not reproducible under a fixed seed")
    # Requesting more than available returns everything, not an error.
    if len(stratified_sample(rows, 500)) != 100:
        fails.append("oversized request should return all rows")

    print(f"audit: {len(fails)} failure(s)")
    for f in fails:
        print("  FAIL", f)
    return len(fails)

if __name__ == "__main__":
    raise SystemExit(1 if run() else 0)

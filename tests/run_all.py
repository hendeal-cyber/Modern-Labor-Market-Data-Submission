"""Run every test suite. Exit non-zero if any fails."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import test_pay, test_geo, test_filters, test_regressors, test_pipeline
import test_audit, test_analyze, test_feeds, test_rpp

def main():
    total = 0
    for name, mod in [("pay", test_pay), ("geo", test_geo), ("filters", test_filters),
                      ("regressors", test_regressors), ("pipeline", test_pipeline),
                      ("audit", test_audit), ("analyze", test_analyze),
                      ("feeds", test_feeds), ("rpp", test_rpp)]:
        print(f"--- {name} ---")
        total += mod.run()
    print(f"\n{'ALL SUITES PASSED' if total == 0 else f'{total} FAILURE(S)'}")
    return 1 if total else 0

if __name__ == "__main__":
    raise SystemExit(main())

\# Outside tester log

Date/time | What I tried (README step) | Expected | What happened | Pass/Fail

17-10-2026 | Read README | Steps to run, results, names | How to run and Results empty, no video link, role names blank | Not ready yet (expected)

17-10-2026 | Compared results/loadtest.txt with platform's numbers | Same numbers | Mismatch at first: loadtest.txt (real model, 810 req/s) vs an older dummy-scorer run (878 req/s) | Resolved: both load-test files are real-model runs and agree (about 800 to 870 req/s, p95 under 2 ms at 1 caller)


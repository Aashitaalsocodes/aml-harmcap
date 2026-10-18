18-10-2026 | Re-test README fingerprints and services | amlapi 8000 = 36cf, amlreal 8002 = 9a9c, labelled | Both labelled correctly | Pass

18-10-2026 | Re-test README video link and DEFINITIONS | Placeholder and link present | "Video: (link to be added)" and DEFINITIONS.md linked | Pass

18-10-2026 | Re-test README load table | Real-model table in README body | Table labelled test scorer; real-model numbers only listed as a file name | Open, asked M18-10-2026 | README load-test table vs results files | Table uses real-model run | Table was the dummy-scorer run; Ashmitha confirmed file labels | Fail, told M, fix requested# Outside tester log

Date/time | What I tried (README step) | Expected | What happened | Pass/Fail

17-10-2026 | Read README | Steps to run, results, names | How to run and Results empty, no video link, role names blank | Not ready yet (expected)

17-10-2026 | Compared results/loadtest.txt with platform's numbers | Same numbers | Mismatch at first: loadtest.txt (real model, 810 req/s) vs an older dummy-scorer run (878 req/s) | Resolved: both load-test files are real-model runs and agree (about 800 to 870 req/s, p95 under 2 ms at 1 caller)

18-10-2026 | Read README results tables | Match results files | HI and LI tables and tamper table match | Pass

18-10-2026 | README load-test table | Real-model numbers, scorer named | Table looks like older dummy-scorer run (877.5 req/s, p95 1.37) and does not name the scorer | Fail, told M

18-10-2026 | README fingerprint labels | amlapi 8000 = 36cf, amlreal 8002 = 9a9c | README calls 8002 the Demo service; service names missing | Fail, told M

18-10-2026 | README How to run | Same service as the demo | Builds aml-harmcap:dev with no model/threshold; demo uses aml-harmcap:real | Could not test, VM; asked Ashmitha

18-10-2026 | README limitations | Includes frozen thresholds, 8 windows coarse, innocent definition | Those points missing | Fail, told M

18-10-2026 | README video link | Placeholder for video | None | Fail, told M


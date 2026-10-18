\# Outside tester log



| Date | What I tried (README step) | Expected | What happened | Result |

|------|----------------------------|----------|---------------|--------|

| 17-10-2026 | Read README | Steps to run, results, names | How to run and Results empty, no video link, role names blank | Not ready yet (expected) |

| 17-10-2026 | Compared results/loadtest.txt with platform's numbers | Same numbers | Mismatch at first: loadtest.txt (real model, 810 req/s) vs an older dummy-scorer run (878 req/s) | Resolved: both load-test files are real-model runs and agree (about 800 to 870 req/s, p95 under 2 ms at 1 caller) |

| 18-10-2026 | Clone repo into fresh folder | Repo downloads | Cloned 277 objects, no errors | Pass |

| 18-10-2026 | Look at repo root | Clear file names | 6 screenshots with default names and 4 plots in root | Tidy-up suggested to M |

| 18-10-2026 | Look at results folder | Clear which load test to trust | 4 load-test files, unlabelled; recal.txt unexplained | Fixed: files now labelled in README |

| 18-10-2026 | Look at docs folder | platform\_demo.md present | platform\_demo.md present | Pass |

| 18-10-2026 | Read README results tables | Match results files | HI and LI tables and tamper table match | Pass |

| 18-10-2026 | README load-test table | Real-model numbers, scorer named | Table was the older test-scorer run (877.5 req/s, p95 1.37) and did not name the scorer | Fixed by M, re-tested below |

| 18-10-2026 | README fingerprint labels | amlapi 8000 = 36cf, amlreal 8002 = 9a9c | README called 8002 the Demo service; service names missing | Fixed by M, re-tested below |

| 18-10-2026 | README How to run (tested by Ashmitha, port 8014) | Same service as the demo | Steps worked but ran the test scorer (dummy-scorer-v0), not the real model | Fixed: real-model variant added, re-tested below |

| 18-10-2026 | README /screen example (tested by Ashmitha) | Works as written | HTTP 200, release, audit intact on test scorer; on real model score near 0, a hold needs the 5-request sequence | Pass (example shows release, not hold) |

| 18-10-2026 | README limitations | Frozen thresholds, 8 windows coarse, innocent definition | Those points were missing | Fixed by M |

| 18-10-2026 | README video link | Placeholder for video | None at first | Fixed: placeholder added |

| 18-10-2026 | Re-test README after fixes: How to run | Test-scorer and real-model variants | Both present and labelled | Pass |

| 18-10-2026 | Re-test README fingerprints and services | amlapi 8000 = 36cf, amlreal 8002 = 9a9c, labelled | Both labelled correctly | Pass |

| 18-10-2026 | Re-test README video link and DEFINITIONS | Placeholder and link present | "Video: (link to be added)" and DEFINITIONS.md linked | Pass |

| 18-10-2026 | Re-test README load table and replay check | Real-model table, replay line | 873.2 req/s, p95 1.32 ms row and replay check (20,000 rows within 1e-6, one slice) present | Pass || 18-10-2026 | Check root screenshot for secrets | No token, key or .verify\_token value | Shows health, one /screen request and audit verify; no secret visible | Pass |


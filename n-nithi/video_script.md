\# 3-minute video script (numbers marked \[TBD] are filled in as the team finishes)



| Time | Scene | What is on screen | Narration |

|------|-------|-------------------|-----------|

| 0:00-0:25 | Problem | Problem slide | Banks flag transactions for money laundering. Most flags are innocent people, and their accounts get frozen. Nobody measures that harm. |

| 0:25-0:50 | Our idea | One-line diagram | We flip it. The bank first sets a cap on wrongly held innocents, for example 5 per 10,000, and the system catches as much laundering as it can within that cap. |

| 0:50-1:20 | Does the cap hold? | Break-rate chart | We tested the cap on later windows and on a second dataset, with nothing retuned. At 5 wrongly held innocents per 10,000, the cap held in 6 of 8 windows on the main dataset, with recall 32.8%. On the second dataset it held in 26 of 40 windows, with recall 13.4%. We report the misses honestly. |

| 1:20-2:10 | LIVE demo on LinuxONE | Terminal: uname -m, docker ps, one /screen request, audit log entry | Everything runs on IBM LinuxONE, in a Docker container, not as root. Here is one transaction going through the API and being logged. With one request at a time we measured about 880 requests per second, p95 latency 1.4 milliseconds, while the VM was busy, so these are conservative. The scoring step in this demo is a placeholder while the real model integration is in progress. |

| 2:10-2:40 | Tamper demo | Verifier output (pass/fail table) | If someone edits, deletes or reorders a decision record, cuts off the end of the log, or swaps the model file, the verifier catches it. All five tamper tests were caught. For an edited record it reports: content altered, hash mismatch. |

| 2:40-3:00 | Limits + close | Limitation slide | The data is synthetic, so "innocent" means "not labelled laundering". There are only 8 test windows on the main dataset, so "6 of 8" is coarse. A proof of method, not a claim about a real bank. Why IBM Z: banks run payment screening on IBM Z, so the service and its signed audit log can sit next to the transactions. We make no speed claims against other platforms. |



Rule: nothing in the video that is not actually working on the VM.


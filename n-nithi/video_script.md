\# 3-minute video script



| Time | Scene | What is on screen | Narration |

|------|-------|-------------------|-----------|

| 0:00-0:20 | Problem | Problem slide | Banks flag transactions for money laundering. Most flags are innocent people, and their accounts get frozen. Nobody measures that harm. |

| 0:20-0:40 | Our idea | Idea slide | We flip it. The bank first sets a cap on wrongly held innocents, for example 5 per 10,000, and the system catches as much laundering as it can within that cap. |

| 0:40-1:10 | Does the cap hold? | Break-rate chart | We tested the cap on later windows and on a second dataset, with nothing retuned. At 5 per 10,000, the cap held in 6 of 8 windows on the main dataset, with recall 32.8%. On the second dataset it held in 26 of 40 windows, with recall 13.4%. We report the misses. |

| 1:10-1:50 | LIVE demo on LinuxONE | Terminal: uname -m, docker ps, one /screen request, audit log entry | Everything runs on IBM LinuxONE, in a Docker container, not as root. Here is one transaction going through the API with the real LightGBM model, and being logged. With one request at a time we measured about 870 requests per second, p95 latency about 1.3 milliseconds, on a single worker with the test client on the same machine. With many callers at once it slows down, so this is a single-node result, not production capacity. |

| 1:50-2:25 | Tamper demo | Verifier output (pass/fail table) | If someone edits, deletes or reorders a record, cuts the end of the log, or swaps the model file, the verifier catches it. All five tamper tests were caught. |

| 2:25-2:50 | Limits + close | Limitation slide | The data is synthetic, so "innocent" means "not labelled laundering", and 6 of 8 windows is coarse. A proof of method, not a claim about a real bank. Why IBM Z: banks run payment screening there, so the service and its signed audit log can sit next to the transactions. |



Rule: nothing in the video that is not actually working on the VM.


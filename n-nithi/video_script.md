\# 3-minute video script (numbers marked \[TBD] are filled in as the team finishes)



| Time | Scene | What is on screen | Narration |

|------|-------|-------------------|-----------|

| 0:00-0:25 | Problem | Problem slide | Banks flag transactions for money laundering. Most flags are innocent people, and their accounts get frozen. Nobody measures that harm. |

| 0:25-0:50 | Our idea | One-line diagram | We flip it. The bank first sets a cap on wrongly held innocents, for example 5 per 10,000, and the system catches as much laundering as it can within that cap. |

| 0:50-1:20 | Does the cap hold? | Break-rate chart | We tested the cap on later time windows and on a second dataset. The cap held in \[TBD]% of windows. Recall at a cap of 5 per 10,000 was \[TBD]. |

| 1:20-2:10 | LIVE demo on LinuxONE | Terminal: uname -m, docker ps, one /screen request, audit log entry | Everything runs on IBM LinuxONE. Here is one transaction going through the API and being logged. \[TBD] requests per second, p95 latency \[TBD] ms. |

| 2:10-2:40 | Tamper demo | Verifier output (pass/fail table) | If someone edits, deletes or reorders a decision record, the verifier catches it. All five tamper tests detected. |

| 2:40-3:00 | Limits + close | Limitation slide | The data is synthetic and has no real innocent label, so this is a proof of method. Why IBM Z: \[TBD, from Partner]. |



Rule: nothing in the video that is not actually working on the VM.


# Harm-Capped AML Screening on IBM LinuxONE

## Project summary
Banks' AML systems flag transactions, and most flags are innocent people who get frozen, with nobody measuring that harm. We flip the objective: the bank first sets a cap on wrongly held innocents (for example 5 per 10,000), and the system catches as much laundering as it can within that cap. We test whether the cap holds on later time windows and on a second dataset, and report the break rate. Every decision goes into a hash-chained audit log, served by a FastAPI service in Docker on IBM LinuxONE.

## Team and roles
- Data, model, thresholds: (name)
- Platform, audit log, API, Docker: (name)
- Evidence, README, exploration: M
- Video script, slides, testing: N

## How to run
(To be filled in when the platform and model are ready.)

## Results
### Harm-cap test on later windows (HI-Small)
Thresholds were frozen on the Sep 7-8 calibration data and tested on 8 six-hour windows from Sep 9-10, without retuning. Harm is wrongly held innocent accounts per 10,000 active accounts. A window breaks when its harm is above the cap.

| Cap (per 10,000) | Recall | Mean harm | Worst window | Break rate |
|---|---|---|---|---|
| 2 | 29.0% | 0.9 | 2.1 | 1 of 8 |
| 5 | 32.8% | 9.1 | 48.8 | 2 of 8 |
| 10 | 35.4% | 209.0 | 789.3 | 4 of 8 |

The strictest cap held in 7 of 8 windows and missed only slightly in the eighth (2.1 against 2). Looser caps broke more often and by large margins. Recall rose only from 29.0% to 35.4% across the three caps, so the extra harm bought little extra detection. "Innocent" is defined from the synthetic dataset's labels.

### Transfer to a second dataset (LI-Small, no retuning)
The thresholds from the HI-Small calibration were applied without retuning to 40 windows of LI-Small, which has a lower laundering rate.

| Cap (per 10,000) | Recall | Mean harm | Worst window | Break rate |
|---|---|---|---|---|
| 2 | 11.9% | 1.9 | 7.4 | 25% of 40 windows 
### Tamper-evident audit log
Every decision is written to a hash-chained log with signed checkpoints. A verifier walks the chain and checks the hashes, the signatures and the pinned model file. Automated tests alter the log in five ways, and the verifier must detect each one.

| Test | Result | What the verifier reported |
|---|---|---|
| Untouched log verifies clean | PASS | no problems |
| Replay record 100 | PASS | decision reproduced (release) |
| 1. Edit a field | PASS | record 100: content altered (hash mismatch) |
| 1b. Edit a field and recompute its hash | PASS | record 101: chain broken (prev_hash mismatch) |
| 2. Delete a record | PASS | record 100: sequence is 101 (gap, reorder or deletion) |
| 3. Reorder records | PASS | record 100: sequence is 101 (gap, reorder or deletion) |
| 4. Truncate the tail | PASS | checkpoint 230: log ends at 220 (tail truncated) |
| 5. Swap the model file | PASS | record 1: model file does not match logged model hash |

PASS means the tamper was detected. All five attacks were caught, including the edit with a recomputed hash, which breaks the link to the next record.|
| 5 | 13.4% | 6.0 | 50.0 | 35% of 40 windows |
| 10 | 15.2% | 48.0 | 745.8 | 48% of 40 windows |

The guarantee weakens on the second dataset. At cap 2 the break rate rises from 1 of 8 windows (12.5%) on HI-Small to 25% on LI-Small, and recall falls from 29.0% to 11.9%. Looser caps again break often and by large margins. This is the result the project is designed to measure: a harm cap tuned on one dataset does not automatically hold on another.

### Load test (with audit logging)
2,000 requests per concurrency level against the FastAPI service in Docker on the LinuxONE VM. The load client ran in the same container as the API, so it competed with the server for the same 3 CPUs and the figures understate what the service can do.

| Concurrent clients | Requests | Errors | Requests/s | p50 ms | p95 ms | p99 ms |
|---|---|---|---|---|---|---|
| 1 | 2000 | 0 | 877.5 | 1.09 | 1.37 | 1.86 |
| 10 | 2000 | 0 | 774.3 | 6.62 | 47.91 | 122.19 |
| 50 | 2000 | 0 | 297.6 | 99.86 | 556.23 | 924.84 |
| 100 | 2000 | 0 | 244.3 | 183.07 | 1836.22 | 3225.25 |

There were no errors at any level. Throughput is highest with one client and falls as concurrency rises, and tail latency grows from under 2 ms to about 3.2 s at 100 clients.
## Limitations
- The data is synthetic and has no real "innocent customer" label.
- The data spans only days to weeks, so test windows are hours or single days.
- The last days of the dataset (11 to 18 September) contain almost only laundering transactions, so time-based test windows must avoid or treat this tail separately.


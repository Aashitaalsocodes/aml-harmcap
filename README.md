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
| 2 | 11.9% | 1.9 | 7.4 | 25% of 40 windows |
| 5 | 13.4% | 6.0 | 50.0 | 35% of 40 windows |
| 10 | 15.2% | 48.0 | 745.8 | 48% of 40 windows |

The guarantee weakens on the second dataset. At cap 2 the break rate rises from 1 of 8 windows (12.5%) on HI-Small to 25% on LI-Small, and recall falls from 29.0% to 11.9%. Looser caps again break often and by large margins. This is the result the project is designed to measure: a harm cap tuned on one dataset does not automatically hold on another.
## Limitations
- The data is synthetic and has no real "innocent customer" label.
- The data spans only days to weeks, so test windows are hours or single days.
- The last days of the dataset (11 to 18 September) contain almost only laundering transactions, so time-based test windows must avoid or treat this tail separately.


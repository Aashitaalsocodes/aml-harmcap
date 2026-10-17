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
(To be filled in when numbers arrive.)

## Limitations
- The data is synthetic and has no real "innocent customer" label.
- The data spans only days to weeks, so test windows are hours or single days.

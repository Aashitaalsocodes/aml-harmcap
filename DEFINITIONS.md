# Definitions and method

## Data and the first limitation
IBM synthetic AML data (HI-Small for training, calibration and test; LI-Small for out-of-distribution scoring only). The data is synthetic, so "innocent" means "not labelled laundering". There is no real customer-harm label.

## Cut and splits
- Both datasets are cut at ts < 2022-09-11. After that date every sender is guilty (chain remnants), which would leak "late timestamp = laundering".
- HI-Small: train Sep 1-6 (2,530 laundering txns), calibration Sep 7-8 (1,036), test Sep 9-10 (956). Split on timestamp only.
- LI-Small is never used for tuning or thresholds. It is scored with the frozen HI model and thresholds.

## Windows and harm
- Window = 6 hours. Screening unit = a transaction scored before release, by sender.
- Account-window = (window, sender). Its score is the max over its transactions.
- Guilty = the account sent at least one laundering-labelled transaction in that window.
- Held innocent = flagged account-window that is not guilty.
- Harm per 10,000 = distinct held-innocent accounts / distinct active senders in the window x 10,000.
- Break rate = share of windows whose harm is above the cap.

## Threshold method
Clopper-Pearson 95% upper bound (delta = 0.05) on the false-hold rate over innocent account-windows in the calibration period. Threshold = lowest score on a 2,000-point quantile grid (0.9 to 1.0 of innocent scores) whose bound x 10,000 is at most the cap. Assumption: account-windows are exchangeable. No calibrator is used; thresholds sit on raw model scores. Frozen thresholds: cap 2 = 0.9999999999999998, cap 5 = 0.99506049103294, cap 10 = 0.6388633634331633.

## Model and features
LightGBM (300 trees, lr 0.05, 31 leaves, min_child_samples 200, scale_pos_weight 5, subsample 0.8, colsample 0.8). 11 features: log amount, same bank, same currency, hour, payment format, sender count and sum in the previous 24h, receiver count in the previous 24h, amount ratio to the sender's 24h mean, seconds since the sender's last transaction, first-time sender-receiver pair.
- The 24h windows are [t-24h, t): earlier rows only, same-timestamp rows excluded.
- Seconds-since-last and first-time-pair see earlier same-minute rows (in transaction order).

## Results (frozen model, nothing retuned)
HI-Small test, 8 windows: cap 2 recall 29.0%, 1 of 8 windows over the cap; cap 5 recall 32.8%, 2 of 8; cap 10 recall 35.4%, 4 of 8. Test AUC 0.9135.
LI-Small, 40 windows: cap 2 recall 11.9%, 10 of 40; cap 5 recall 13.4%, 14 of 40; cap 10 recall 15.2%, 19 of 40.
Failures concentrate on Sep 9 (HI), a busier weekday where innocent scores shift upward; a bank would recalibrate daily.

## Checks and what is not yet re-measured
- Shuffled-label AUC 0.492 and a future-rows-deleted check were run on the earlier cumulative-feature model. The final 24h-rolling features were not re-run through the same two checks.
- Serving versus offline: 99.8% of 20,000 test scores matched within 1e-6 before the same-timestamp fix. The fix was verified on one held transaction (hold, score 1.0) but the 20,000-row match was not re-measured.
- Only 8 HI test windows, so break rates are coarse.
- Serving uses one worker (the audit log has a single writer): about 800 screens/s at low concurrency, degrading at 50+ concurrent callers (see results/loadtest.txt).

# Platform demo: command sheet

All commands run at the **VM host prompt** (`linux1@lbc:~$`), not inside the notebook container.
Demo service: `amlapi` on port 8000, real LightGBM model, cap 5.
Do not touch `amlreal` (port 8002) or `notebook`.

Audit key fingerprint shown on screen for amlapi (8000):
`36cf12035bb2476c0bd08ea4ec703506d16ab5dfcce612159c8ce448e2c47157`
(The separate amlreal service on 8002 has its own key, `9a9cc1eb...`.)

## 0. Fresh restart (only right before recording)

```bash
docker rm -f amlapi
docker run -d --name amlapi --user 10001:10001 -p 127.0.0.1:8000:8000 \
  -e VERIFY_TOKEN="$(cat ~/shared/ashmitha/.verify_token)" \
  -e THRESHOLD=0.99506049103294 -e CAP_PER_10K=5 \
  -e MODEL_PATH=/model/m3.txt \
  -v amlruntime:/data -v /home/linux1/shared/clean:/model:ro aml-harmcap:real
sleep 15
docker cp ~/shared/ashmitha/aml-harmcap/results/demo_hold_sequence.json amlapi:/tmp/seq.json
```

## 1. Health and policy (on camera)

```bash
curl -s localhost:8000/health; echo
curl -s localhost:8000/policy; echo
```

Shows model `lightgbm-m3-r24`, threshold 0.99506049103294, cap 5, the audit key fingerprint.

## 2. Warm-up: four releases (run ONCE)

```bash
docker exec -i amlapi python3 - <<'EOF'
import json, httpx
for r in json.load(open('/tmp/seq.json'))[:4]:
    x = httpx.post('http://localhost:8000/screen', json=r, timeout=30)
    print(r['txn_id'], x.json()['decision'], x.json()['score'])
EOF
```

All four say `release`. The scorer keeps account history in memory, so running this twice changes later scores. If it goes wrong, do step 0 again.

## 3. The hold (run ONCE, must come after step 2)

```bash
docker exec -i amlapi python3 - <<'EOF'
import json, httpx
r = json.load(open('/tmp/seq.json'))[4]
print(httpx.post('http://localhost:8000/screen', json=r, timeout=30).text)
EOF
```

Expect `HOLD4250810`: decision `hold`, score 1.0, tier 3, step "Manual review by a human analyst", with a `case_id`.
This transaction scores 1.0, so it goes straight to manual review (the top tier).

## 4. Case and verification

```bash
curl -s localhost:8000/case/HOLD4250810; echo
TOKEN=$(cat ~/shared/ashmitha/.verify_token)
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8000/case/HOLD4250810/verify -H 'Content-Type: application/json' -d '{"result":"pass"}'
curl -s -X POST localhost:8000/case/HOLD4250810/verify -H "X-Verifier-Token: $TOKEN" -H 'Content-Type: application/json' -d '{"result":"pass"}'; echo
```

The call without the token is refused (expect 401 or 403). With the token it is recorded and the case clears. Never print `$TOKEN`.

## 5. Audit log

```bash
curl -s localhost:8000/audit/verify; echo
```

Expect `"intact":true` and `"problems":[]`.

## Facts to state honestly

- Load test (real model, results/loadtest_real_model.txt): about 870 req/s with one caller (p95 1.3 ms), about 800 with ten, 0 errors in 8,000 requests. Single worker, client on the same machine, shared 3-core VM. It slows to about 250 req/s at 100 callers, so do not claim it scales.
- Scorer matches the offline m3 scores to 6 decimals on 20,000 test rows (results/replay_check.txt), after warming up with earlier history.
- Tamper tests: 8 of 8 pass on temporary logs (results/tamper_test.txt). Tail truncation is only caught back to the last signed checkpoint.
- The verify endpoint records a pass/fail from the token holder; it does not check anyone's identity itself.
- Tier ranges and pass probabilities are placeholders. One worker keeps the audit chain consistent.
- The first 8,101 log records came from an earlier test scorer; the chain is intact across them.
- Scorer history is in memory and resets on restart.

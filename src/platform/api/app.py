"""Screening API (dummy scorer for now; swap in the real model later).
Run from this folder:  python3 -m uvicorn app:app --port 8000
Use ONE worker for now: the audit log has a single writer."""
import hashlib, os, sys, time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "audit"))
from auditlog import AuditLog, verify_log, replay, canon, sha256_hex

RUNTIME = os.environ.get("RUNTIME_DIR", os.path.expanduser("~/shared/ashmitha/runtime"))
THRESHOLD = float(os.environ.get("THRESHOLD", "0.9"))   # dummy until the policy is chosen
LOGGING = os.environ.get("AUDIT_LOGGING", "1") == "1"   # set 0 only for load-test comparison
CAP_PER_10K = 5                                          # placeholder cap shown by /policy

MODEL_ID = "dummy-scorer-v0"
MODEL_HASH = sha256_hex(MODEL_ID.encode())
CALIBRATOR_HASH = sha256_hex(b"dummy-calibrator-v0")

app = FastAPI(title="Harm-capped AML screening")
log = AuditLog(os.path.join(RUNTIME, "audit"), os.path.join(RUNTIME, "keys", "audit_key.pem"),
               checkpoint_every=100, batch_size=50)


class Txn(BaseModel):
    txn_id: str
    src_acct: str
    dst_acct: str
    amount: float
    currency: str = "USD"


def score_txn(t):
    """Deterministic fake score in [0,1). Replace with the real model + calibrator."""
    h = hashlib.sha256(f"{t.txn_id}|{t.src_acct}|{t.dst_acct}|{t.amount}".encode()).hexdigest()
    return int(h[:8], 16) / 0x100000000


def sync_log():
    """Write buffered records and sign a checkpoint so verification sees everything."""
    with log._lock:
        log._flush()
        if log.seq > log._cp_seq:
            log._checkpoint()


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_ID, "records_logged": log.seq, "audit_logging": LOGGING}


@app.get("/policy")
def policy():
    return {"threshold": THRESHOLD, "cap_per_10k": CAP_PER_10K, "model_hash": MODEL_HASH,
            "calibrator_hash": CALIBRATOR_HASH, "note": "dummy values until the model is wired in"}


@app.post("/screen")
def screen(t: Txn):
    t0 = time.perf_counter()
    score = score_txn(t)
    hold = score >= THRESHOLD
    decision = "hold" if hold else "release"
    tier = 1 if hold else 0
    feature_hash = sha256_hex(canon(t.model_dump()))
    if LOGGING:
        rec = log.append(t.txn_id, feature_hash, MODEL_HASH, CALIBRATOR_HASH,
                         THRESHOLD, round(score, 6), decision, tier)
    else:
        rec = {"seq": 0, "record_hash": ""}
    return {"txn_id": t.txn_id, "decision": decision, "tier": tier, "score": round(score, 6),
            "audit_seq": rec["seq"], "record_hash": rec["record_hash"],
            "latency_ms": round((time.perf_counter() - t0) * 1000, 3)}


@app.get("/audit/verify")
def audit_verify():
    sync_log()
    problems = verify_log(os.path.join(RUNTIME, "audit"))
    return {"intact": not problems, "records": log.seq, "problems": problems[:20]}


@app.get("/audit/replay/{seq}")
def audit_replay(seq: int):
    sync_log()
    ok, rec = replay(os.path.join(RUNTIME, "audit"), seq)
    if rec is None:
        raise HTTPException(404, "no such record")
    return {"consistent": ok, "record": rec}

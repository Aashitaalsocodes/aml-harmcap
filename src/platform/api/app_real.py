"""Screening API with the real model. Set MODEL_PATH to enable it."""
import hashlib, os, sys, time
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "audit"))
sys.path.insert(0, HERE)
from auditlog import AuditLog, verify_log, replay, canon, sha256_hex
from scorer import RealScorer

RUNTIME = os.environ.get("RUNTIME_DIR", os.path.expanduser("~/shared/ashmitha/runtime"))
MODEL_PATH = os.environ["MODEL_PATH"]
THRESHOLD = float(os.environ.get("THRESHOLD", "0.99506049103294"))  # cap 5 per 10k, frozen on HI calibration
CAP_PER_10K = int(os.environ.get("CAP_PER_10K", "5"))
LOGGING = os.environ.get("AUDIT_LOGGING", "1") == "1"

SC = RealScorer(MODEL_PATH)
MODEL_ID = "lightgbm-m3-r24"
MODEL_HASH = SC.model_hash
CALIBRATOR_HASH = sha256_hex(b"none: thresholds chosen on raw model scores")

app = FastAPI(title="Harm-capped AML screening")
log = AuditLog(os.path.join(RUNTIME, "audit"), os.path.join(RUNTIME, "keys", "audit_key.pem"),
               checkpoint_every=100, batch_size=50)
PUBKEY_FPR = sha256_hex(log.key.public_key().export_key(format="DER"))


class Txn(BaseModel):
    txn_id: str
    src_acct: str
    dst_acct: str
    amount: float
    currency: str = "USD"
    cur_recv: Optional[str] = None
    src_bank: str = "0"
    dst_bank: str = "1"
    fmt: str = "ACH"
    ts: Optional[str] = None   # ISO time, e.g. 2022-09-09T10:15:00 (UTC)


def sync_log():
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
            "calibrator_hash": CALIBRATOR_HASH, "audit_public_key_sha256": PUBKEY_FPR,
            "note": "raw LightGBM scores, threshold frozen on HI-Small Sep 7-8 calibration"}


@app.post("/screen")
def screen(t: Txn):
    t0 = time.perf_counter()
    score = SC.score(t)
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

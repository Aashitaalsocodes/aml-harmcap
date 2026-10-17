"""Screening API (dummy scorer for now; swap in the real model later).
Run from this folder:  python3 -m uvicorn app:app --port 8000
Use ONE worker for now: the audit log has a single writer."""
import atexit, hashlib, hmac, json, os, sys, threading, time
from typing import Literal, Optional
from fastapi import FastAPI, Header, HTTPException
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


PUBKEY_FPR = sha256_hex(log.key.public_key().export_key(format="DER"))


with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "tiers.json")) as _f:
    TIER_CFG = json.load(_f)
TIERS = sorted(TIER_CFG["tiers"], key=lambda x: x["tier"])
STEP = {x["tier"]: x["step"] for x in TIERS}
MAX_TIER = max(STEP)
VERIFY_TOKEN = os.environ.get("VERIFY_TOKEN", "")
CASES = {}
CASES_LOCK = threading.Lock()
atexit.register(log.close)


def tier_for(score, threshold):
    frac = (score - threshold) / (1.0 - threshold) if threshold < 1.0 else 1.0
    for x in TIERS:
        if frac <= x["up_to_fraction"]:
            return x["tier"]
    return MAX_TIER


def next_state(tier, result):
    """pass -> cleared; fail -> next tier (stays at the top tier, i.e. manual review)."""
    if result == "pass":
        return "cleared", tier
    return "held", min(tier + 1, MAX_TIER)


def rebuild_cases():
    path = os.path.join(RUNTIME, "audit", "log.jsonl")
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            if not line.strip():
                continue
            r = json.loads(line)
            if r.get("event") == "verify":
                c = CASES.get(r.get("case_id"))
                if c and c["status"] == "held":
                    c["status"], c["tier"] = next_state(c["tier"], r["result"])
                    c["attempts"] += 1
            elif r.get("decision") == "hold" and r["txn_id"] not in CASES:
                CASES[r["txn_id"]] = {"status": "held", "tier": tier_for(r["score"], r["threshold"]),
                                      "score": r["score"], "attempts": 0}


rebuild_cases()


class VerifyBody(BaseModel):
    result: Literal["pass", "fail"]


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
            "calibrator_hash": CALIBRATOR_HASH, "audit_public_key_sha256": PUBKEY_FPR, "verify_auth_required": bool(VERIFY_TOKEN), "tiers": TIERS, "note": "dummy values until the model is wired in"}


@app.post("/screen")
def screen(t: Txn):
    t0 = time.perf_counter()
    score = score_txn(t)
    hold = score >= THRESHOLD
    decision = "hold" if hold else "release"
    tier = tier_for(score, THRESHOLD) if hold else 0
    feature_hash = sha256_hex(canon(t.model_dump()))
    if LOGGING:
        rec = log.append(t.txn_id, feature_hash, MODEL_HASH, CALIBRATOR_HASH,
                         THRESHOLD, round(score, 6), decision, tier)
    else:
        rec = {"seq": 0, "record_hash": ""}
    resp = {"txn_id": t.txn_id, "decision": decision, "tier": tier, "score": round(score, 6),
            "audit_seq": rec["seq"], "record_hash": rec["record_hash"],
            "latency_ms": round((time.perf_counter() - t0) * 1000, 3)}
    if hold:
        with CASES_LOCK:
            CASES.setdefault(t.txn_id, {"status": "held", "tier": tier, "score": round(score, 6), "attempts": 0})
        resp["case_id"] = t.txn_id
        resp["required_step"] = STEP[tier]
    return resp


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


@app.get("/case/{case_id}")
def case_status(case_id: str):
    with CASES_LOCK:
        c = CASES.get(case_id)
        if c is None:
            raise HTTPException(404, "no such held case")
        return {"case_id": case_id, **c,
                "required_step": STEP[c["tier"]] if c["status"] == "held" else None}


@app.post("/case/{case_id}/verify")
def case_verify(case_id: str, body: VerifyBody, x_verifier_token: Optional[str] = Header(default=None)):
    if VERIFY_TOKEN and not hmac.compare_digest(x_verifier_token or "", VERIFY_TOKEN):
        raise HTTPException(401, "verifier token required")
    with CASES_LOCK:
        c = CASES.get(case_id)
        if c is None:
            raise HTTPException(404, "no such held case")
        if c["status"] == "cleared":
            raise HTTPException(409, "case already cleared")
        from_tier = c["tier"]
        status, tier = next_state(from_tier, body.result)
        c["status"], c["tier"] = status, tier
        c["attempts"] += 1
        decision = "cleared" if status == "cleared" else ("escalate" if tier > from_tier else "manual_review")
        seq = 0
        if LOGGING:
            rec = log.append(case_id, sha256_hex(canon({"case_id": case_id, "result": body.result})),
                             MODEL_HASH, CALIBRATOR_HASH, THRESHOLD, c["score"], decision, tier,
                             extra={"event": "verify", "case_id": case_id,
                                    "result": body.result, "from_tier": from_tier})
            seq = rec["seq"]
        return {"case_id": case_id, "decision": decision, "status": status, "tier": tier,
                "attempts": c["attempts"], "audit_seq": seq,
                "next_step": STEP[tier] if status == "held" else None}

"""Hash-chained, signed, tamper-evident audit log.
SHA-256 from hashlib, Ed25519 from PyCryptodome (works on s390x)."""
import hashlib, json, os, threading, time
from Crypto.PublicKey import ECC
from Crypto.Signature import eddsa

GENESIS = "0" * 64


def canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def sha256_hex(data):
    return hashlib.sha256(data).hexdigest()


def file_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def record_hash(rec):
    body = {k: v for k, v in rec.items() if k != "record_hash"}
    return sha256_hex(canon(body))


class AuditLog:
    def __init__(self, directory, key_path, checkpoint_every=100, batch_size=50):
        os.makedirs(directory, exist_ok=True)
        self.log_path = os.path.join(directory, "log.jsonl")
        self.cp_path = os.path.join(directory, "checkpoints.jsonl")
        self.pub_path = os.path.join(directory, "public_key.pem")
        self.checkpoint_every = checkpoint_every
        self.batch_size = batch_size
        self._lock = threading.Lock()
        self._buf = []
        self.key = self._load_or_create_key(key_path)
        self.seq, self.head, self._cp_seq = self._load_head()

    def _load_or_create_key(self, key_path):
        if os.path.exists(key_path):
            with open(key_path) as f:
                key = ECC.import_key(f.read())
        else:
            os.makedirs(os.path.dirname(os.path.abspath(key_path)), exist_ok=True)
            key = ECC.generate(curve="Ed25519")
            with open(key_path, "w") as f:
                f.write(key.export_key(format="PEM"))
            os.chmod(key_path, 0o600)
        with open(self.pub_path, "w") as f:
            f.write(key.public_key().export_key(format="PEM"))
        return key

    @staticmethod
    def _last_line(path):
        last = None
        if os.path.exists(path):
            with open(path) as f:
                for line in f:
                    if line.strip():
                        last = line
        return json.loads(last) if last else None

    def _load_head(self):
        rec = self._last_line(self.log_path)
        cp = self._last_line(self.cp_path)
        seq, head = (rec["seq"], rec["record_hash"]) if rec else (0, GENESIS)
        return seq, head, (cp["seq"] if cp else 0)

    def append(self, txn_id, feature_hash, model_hash, calibrator_hash,
               threshold, score, decision, tier, extra=None):
        with self._lock:
            self.seq += 1
            rec = {
                "seq": self.seq, "ts": round(time.time(), 6), "txn_id": txn_id,
                "feature_hash": feature_hash, "model_hash": model_hash,
                "calibrator_hash": calibrator_hash, "threshold": threshold,
                "score": score, "decision": decision, "tier": tier,
                "prev_hash": self.head,
            }
            if extra:
                for k, v in extra.items():
                    if k not in rec:
                        rec[k] = v
            rec["record_hash"] = record_hash(rec)
            self.head = rec["record_hash"]
            self._buf.append(rec)
            if self.seq % self.checkpoint_every == 0:
                self._checkpoint()
            elif len(self._buf) >= self.batch_size:
                self._flush()
            return rec

    def _flush(self):
        if not self._buf:
            return
        with open(self.log_path, "a") as f:
            f.write("".join(json.dumps(r, sort_keys=True) + "\n" for r in self._buf))
        self._buf.clear()

    def _checkpoint(self):
        self._flush()
        msg = canon({"seq": self.seq, "head": self.head})
        sig = eddsa.new(self.key, "rfc8032").sign(msg)
        with open(self.cp_path, "a") as f:
            f.write(json.dumps({"seq": self.seq, "head": self.head,
                                "sig": sig.hex()}) + "\n")
        self._cp_seq = self.seq

    def flush(self):
        with self._lock:
            self._flush()

    def close(self):
        with self._lock:
            self._flush()
            if self.seq > self._cp_seq:
                self._checkpoint()


def verify_log(directory, model_path=None, pub_path=None):
    """Return a list of problems. Empty list = log is intact."""
    problems = []
    log_path = os.path.join(directory, "log.jsonl")
    cp_path = os.path.join(directory, "checkpoints.jsonl")
    pub_path = pub_path or os.path.join(directory, "public_key.pem")
    if not os.path.exists(log_path):
        return ["log file missing"]
    with open(pub_path) as f:
        verifier = eddsa.new(ECC.import_key(f.read()), "rfc8032")

    records = []
    with open(log_path) as f:
        for n, line in enumerate(f, 1):
            if line.strip():
                try:
                    records.append(json.loads(line))
                except ValueError:
                    problems.append(f"line {n}: not valid JSON")

    model_hash = file_sha256(model_path) if model_path else None
    prev = GENESIS
    for i, rec in enumerate(records, 1):
        if rec.get("seq") != i:
            problems.append(f"record {i}: sequence is {rec.get('seq')} (gap, reorder or deletion)")
        if rec.get("prev_hash") != prev:
            problems.append(f"record {i}: chain broken (prev_hash mismatch)")
        if record_hash(rec) != rec.get("record_hash"):
            problems.append(f"record {i}: content altered (hash mismatch)")
        if model_hash and rec.get("model_hash") != model_hash:
            problems.append(f"record {i}: model file does not match logged model hash")
        prev = rec.get("record_hash")

    if not os.path.exists(cp_path):
        problems.append("no checkpoints file")
    else:
        with open(cp_path) as f:
            for line in f:
                if not line.strip():
                    continue
                cp = json.loads(line)
                seq = cp["seq"]
                if seq > len(records):
                    problems.append(f"checkpoint {seq}: log ends at {len(records)} (tail truncated)")
                    continue
                if records[seq - 1].get("record_hash") != cp["head"]:
                    problems.append(f"checkpoint {seq}: head hash does not match log")
                try:
                    verifier.verify(canon({"seq": seq, "head": cp["head"]}),
                                    bytes.fromhex(cp["sig"]))
                except ValueError:
                    problems.append(f"checkpoint {seq}: bad signature")
    return problems


def replay(directory, seq, rescore=None):
    """Re-check one decision. rescore(txn_id) -> score is optional (real model later)."""
    with open(os.path.join(directory, "log.jsonl")) as f:
        for line in f:
            rec = json.loads(line)
            if rec["seq"] == seq:
                if rec.get("event") == "verify":
                    ok = rec.get("result") in ("pass", "fail")
                else:
                    expected = "hold" if rec["score"] >= rec["threshold"] else "release"
                    ok = rec["decision"] == expected
                if rescore is not None:
                    ok = ok and abs(rescore(rec["txn_id"]) - rec["score"]) < 1e-6
                return ok, rec
    return False, None

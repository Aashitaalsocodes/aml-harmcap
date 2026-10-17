import json, os, shutil, sys, tempfile
from auditlog import AuditLog, verify_log, replay, file_sha256, sha256_hex, record_hash


def make_log(d, n=230):
    model = os.path.join(d, "model.txt")
    with open(model, "w") as f:
        f.write("fake model v1")
    mh = file_sha256(model)
    log = AuditLog(os.path.join(d, "audit"), os.path.join(d, "keys", "k.pem"),
                   checkpoint_every=50, batch_size=20)
    for i in range(n):
        score = (i * 37 % 100) / 100
        hold = score >= 0.9
        log.append(f"T{i:05d}", sha256_hex(f"f{i}".encode()), mh, "c" * 64,
                   0.9, score, "hold" if hold else "release", 1 if hold else 0)
    log.close()
    return os.path.join(d, "audit"), model


def read_lines(p):
    with open(p) as f:
        return f.read().splitlines()


def write_lines(p, lines):
    with open(p, "w") as f:
        f.write("\n".join(lines) + "\n")


def t_edit(audit, model):
    p = os.path.join(audit, "log.jsonl"); L = read_lines(p)
    r = json.loads(L[99]); r["score"] = 0.123
    L[99] = json.dumps(r, sort_keys=True); write_lines(p, L)


def t_edit_rehash(audit, model):  # attacker also fixes that record's own hash
    p = os.path.join(audit, "log.jsonl"); L = read_lines(p)
    r = json.loads(L[99]); r["score"] = 0.123; r["record_hash"] = record_hash(r)
    L[99] = json.dumps(r, sort_keys=True); write_lines(p, L)


def t_delete(audit, model):
    p = os.path.join(audit, "log.jsonl"); L = read_lines(p)
    del L[99]; write_lines(p, L)


def t_reorder(audit, model):
    p = os.path.join(audit, "log.jsonl"); L = read_lines(p)
    L[99], L[100] = L[100], L[99]; write_lines(p, L)


def t_truncate(audit, model):
    p = os.path.join(audit, "log.jsonl"); L = read_lines(p)
    write_lines(p, L[:-10])


def t_swap_model(audit, model):
    with open(model, "w") as f:
        f.write("fake model v2 (swapped)")


TESTS = [("1 edit a field", t_edit), ("1b edit + recompute its hash", t_edit_rehash),
         ("2 delete a record", t_delete), ("3 reorder records", t_reorder),
         ("4 truncate the tail", t_truncate), ("5 swap the model file", t_swap_model)]

if __name__ == "__main__":
    results = []
    d = tempfile.mkdtemp(); audit, model = make_log(d)
    base = verify_log(audit, model)
    results.append(("0 untouched log verifies clean", not base, "no problems" if not base else base[0]))
    ok, rec = replay(audit, 100)
    results.append(("0b replay record 100", ok, f"decision={rec['decision']}"))
    shutil.rmtree(d)
    for name, attack in TESTS:
        d = tempfile.mkdtemp(); audit, model = make_log(d)
        attack(audit, model)
        probs = verify_log(audit, model)
        results.append((name, bool(probs), f"{len(probs)} problem(s): {probs[0]}" if probs else "NOT DETECTED"))
        shutil.rmtree(d)
    print(f"{'TEST':34} {'RESULT':6}  DETAIL")
    for name, passed, detail in results:
        print(f"{name:34} {'PASS' if passed else 'FAIL':6}  {detail}")
    sys.exit(0 if all(r[1] for r in results) else 1)

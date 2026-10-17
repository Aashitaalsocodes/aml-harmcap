import hashlib, math, threading, time
from collections import defaultdict, deque
from datetime import datetime, timezone
import numpy as np
import lightgbm as lgb

FMT = {"ACH": 0, "Bitcoin": 1, "Cash": 2, "Cheque": 3,
       "Credit Card": 4, "Reinvestment": 5, "Wire": 6}
NAMES = ["amt", "same_bank", "same_cur", "hour", "fmt", "r24_s_cnt", "r24_s_sum",
         "r24_r_cnt", "amt_ratio24", "s_gap", "new_pair"]
DAY = 86400.0
NAN = float("nan")


def to_epoch(ts):
    if ts is None:
        return time.time()
    if isinstance(ts, (int, float)):
        return float(ts)
    return datetime.fromisoformat(ts).replace(tzinfo=timezone.utc).timestamp()


class RealScorer:
    def __init__(self, model_path):
        self.booster = lgb.Booster(model_file=model_path)
        with open(model_path, "rb") as f:
            self.model_hash = hashlib.sha256(f.read()).hexdigest()
        self.sent = defaultdict(deque)   # src -> deque[(t, amt)]
        self.recv = defaultdict(deque)   # dst -> deque[t]
        self.last_send = {}
        self.pairs = set()
        self.lock = threading.Lock()

    def update(self, src, dst, amt, ep):
        self.sent[src].append((ep, amt))
        self.recv[dst].append(ep)
        self.last_send[src] = ep
        self.pairs.add((src, dst))

    def score_raw(self, src, dst, amt, ep, src_bank, dst_bank, fmt, cur_paid, cur_recv):
        with self.lock:
            sq = self.sent[src]
            while sq and sq[0][0] < ep - DAY:
                sq.popleft()
            rq = self.recv[dst]
            while rq and rq[0] < ep - DAY:
                rq.popleft()
            sq_w = [(t, a) for t, a in sq if t < ep]  # same-timestamp rows excluded, as in training
            cnt = len(sq_w)
            ssum = sum(a for _, a in sq_w)
            ratio = amt / (ssum / cnt + 1.0) if cnt > 0 else NAN
            gap = ep - self.last_send[src] if src in self.last_send else NAN
            new_pair = 0 if (src, dst) in self.pairs else 1
            hour = datetime.fromtimestamp(ep, tz=timezone.utc).hour
            x = [math.log1p(amt), int(src_bank == dst_bank), int(cur_paid == cur_recv),
                 hour, FMT.get(fmt, -1), cnt, ssum, sum(1 for t in rq if t < ep), ratio, gap, new_pair]
            p = float(self.booster.predict(np.array([x], dtype=float))[0])
            self.update(src, dst, amt, ep)
            return p

    def score(self, t):
        return self.score_raw(t.src_acct, t.dst_acct, t.amount, to_epoch(t.ts),
                              t.src_bank, t.dst_bank, t.fmt, t.currency,
                              t.cur_recv or t.currency)

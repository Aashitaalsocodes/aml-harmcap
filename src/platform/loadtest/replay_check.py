import sys, time
sys.path.insert(0, '/home/ibm-user/shared/ashmitha/aml-harmcap/src/platform/api')
import pandas as pd, numpy as np
from scorer import RealScorer

N = int(sys.argv[1]) if len(sys.argv) > 1 else 20000
MODEL = '/home/ibm-user/shared/clean/m3.txt'
THR = 0.99506049103294
t0 = time.time()

d = pd.read_pickle('/home/ibm-user/shared/clean/HI-Small.pkl')
d = d.sort_values(['ts', 'tx_id'], kind='stable').reset_index(drop=True)
off = pd.read_pickle('/home/ibm-user/shared/clean/te3.pkl')[['tx_id', 'score']]
ep = ((d.ts - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')).astype('int64').values
start = pd.Timestamp('2022-09-09')
n_before = int((d.ts < start).sum())
n_win = int((d.ts < start - pd.Timedelta('1D')).sum())
print('rows before Sep 9:', n_before, '| loaded in', round(time.time() - t0), 's', flush=True)

src = d.src_acct.values; dst = d.dst_acct.values
amt = d.amt_paid.values.astype(float)
sb = d.src_bank.values; db = d.dst_bank.values
fm = d.fmt.values; cp = d.cur_paid.values; cr = d.cur_recv.values

sc = RealScorer(MODEL)
# older history: only pair/last-send memory; last 24h before Sep 9: full window update
for i in range(n_win):
    sc.last_send[src[i]] = float(ep[i]); sc.pairs.add((src[i], dst[i]))
for i in range(n_win, n_before):
    sc.update(src[i], dst[i], amt[i], float(ep[i]))
print('warm-up done at', round(time.time() - t0), 's', flush=True)

api = []
for i in range(n_before, n_before + N):
    api.append(sc.score_raw(src[i], dst[i], amt[i], float(ep[i]), sb[i], db[i], fm[i], cp[i], cr[i]))
print('scored', N, 'rows at', round(time.time() - t0), 's', flush=True)

res = pd.DataFrame({'tx_id': d.tx_id.values[n_before:n_before + N], 'api': api})
m = res.merge(off, on='tx_id', how='left')
print('rows with no offline match:', int(m.score.isna().sum()))
m = m.dropna()
diff = (m.api - m.score).abs()
print('corr:', round(float(np.corrcoef(m.api, m.score)[0, 1]), 6))
print('max abs diff:', float(diff.max()), '| mean abs diff:', float(diff.mean()))
print('rows within 1e-6:', int((diff < 1e-6).sum()), 'of', len(m))
print('rows differing by > 0.01:', int((diff > 0.01).sum()))
print('hold decisions api vs offline:', int((m.api >= THR).sum()), 'vs', int((m.score >= THR).sum()))
print('worst 5 rows:')
print(m.assign(diff=diff).sort_values('diff', ascending=False).head(5).to_string())

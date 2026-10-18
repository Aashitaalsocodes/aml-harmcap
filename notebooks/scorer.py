{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 1,
   "id": "96d5f63f-3689-4284-a848-48e2d5603c65",
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "model hash: f4642eb27784b354fed862d4daa96cf5047ab0a93537fe864634ac7a9663e7de\n",
      "max diff 7.183963001700615e-08 | share within 1e-6: 1.0\n"
     ]
    }
   ],
   "source": [
    "import sys, numpy as np, pandas as pd\n",
    "sys.path.insert(0, \"/home/ibm-user/shared/aml-harmcap/src/platform/api\")\n",
    "C = \"/home/ibm-user/shared/clean\"\n",
    "from scorer import RealScorer\n",
    "SC = RealScorer(f\"{C}/m3.txt\")\n",
    "print(\"model hash:\", SC.model_hash)\n",
    "\n",
    "sec = lambda s: (s - pd.Timestamp(\"1970-01-01\")).dt.total_seconds()\n",
    "te = pd.read_pickle(f\"{C}/te3.pkl\").sort_values(\"tx_id\").iloc[:20000]\n",
    "d = pd.read_pickle(f\"{C}/HI-Small.pkl\")\n",
    "accts = set(te.src_acct) | set(te.dst_acct)\n",
    "prior = d[(d.ts < te.ts.min()) & (d.src_acct.isin(accts) | d.dst_acct.isin(accts))]\n",
    "prior = prior.assign(ep=sec(prior.ts))\n",
    "for r in prior.itertuples():\n",
    "    SC.update(r.src_acct, r.dst_acct, r.amt_paid, r.ep)\n",
    "te = te.assign(ep=sec(te.ts))\n",
    "mine = [SC.score_raw(r.src_acct, r.dst_acct, r.amt_paid, r.ep, r.src_bank, r.dst_bank,\n",
    "                     r.fmt, r.cur_paid, r.cur_recv) for r in te.itertuples()]\n",
    "diff = np.abs(np.array(mine) - te.score.values)\n",
    "print(\"max diff\", diff.max(), \"| share within 1e-6:\", (diff < 1e-6).mean())"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 1,
   "id": "1565b33f-6592-4396-8f66-464b4d0b11f1",
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "5 requests; last = {'txn_id': 'HOLD4250810', 'src_acct': '808222DA0', 'dst_acct': '803B8BFC0', 'amount': 1081714.1, 'currency': 'Yen', 'cur_recv': 'Yen', 'src_bank': '3698', 'dst_bank': '210261', 'fmt': 'ACH', 'ts': '2022-09-09T00:49:00'}\n"
     ]
    }
   ],
   "source": [
    "import json, pandas as pd\n",
    "C = \"/home/ibm-user/shared/clean\"\n",
    "d = pd.read_pickle(f\"{C}/HI-Small.pkl\")\n",
    "TID = 4250810\n",
    "r0 = d[d.tx_id == TID].iloc[0]\n",
    "ts, s, dst = r0.ts, r0.src_acct, r0.dst_acct\n",
    "lo = ts - pd.Timedelta(\"24h\")\n",
    "prior = d[d.tx_id < TID]\n",
    "a = prior[(prior.src_acct == s) & (prior.ts >= lo)]\n",
    "last = prior[prior.src_acct == s].tail(1)\n",
    "pair = prior[(prior.src_acct == s) & (prior.dst_acct == dst)].tail(1)\n",
    "rc = prior[(prior.dst_acct == dst) & (prior.ts >= lo)].tail(300)\n",
    "h = pd.concat([last, pair, a, rc]).drop_duplicates(\"tx_id\").sort_values(\"tx_id\")\n",
    "\n",
    "def payload(r, tag):\n",
    "    return {\"txn_id\": f\"{tag}{r.tx_id}\", \"src_acct\": str(r.src_acct), \"dst_acct\": str(r.dst_acct),\n",
    "            \"amount\": float(r.amt_paid), \"currency\": r.cur_paid, \"cur_recv\": r.cur_recv,\n",
    "            \"src_bank\": str(r.src_bank), \"dst_bank\": str(r.dst_bank), \"fmt\": r.fmt,\n",
    "            \"ts\": r.ts.strftime(\"%Y-%m-%dT%H:%M:%S\")}\n",
    "\n",
    "seq = [payload(r, \"W\") for r in h.itertuples()]\n",
    "seq.append(payload(next(d[d.tx_id == TID].itertuples()), \"HOLD\"))\n",
    "for p in (f\"/home/ibm-user/shared/runtime_real/hold_sequence.json\",\n",
    "          f\"/home/ibm-user/shared/aml-harmcap/results/demo_hold_sequence.json\"):\n",
    "    json.dump(seq, open(p, \"w\"), indent=1)\n",
    "print(len(seq), \"requests; last =\", seq[-1])"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "82a72ea5-a8bd-4724-958b-29b7675ed957",
   "metadata": {},
   "outputs": [],
   "source": []
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3 (ipykernel)",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.12.15"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 5
}

"""Async load test for POST /screen.  Usage: python3 - <label> <requests_per_level>
Run INSIDE the API container so no extra packages are needed on the host."""
import asyncio, sys, time, httpx

BASE = "http://127.0.0.1:8000"
LEVELS = [1, 10, 50, 100]
RUN = int(time.time() * 1000)


async def worker(client, q, lat, errs):
    while True:
        try:
            i = q.get_nowait()
        except asyncio.QueueEmpty:
            return
        body = {"txn_id": f"L{RUN}-{i}", "src_acct": f"A{i % 500}",
                "dst_acct": f"B{i % 700}", "amount": 10.0 + (i % 1000)}
        t0 = time.perf_counter()
        try:
            r = await client.post("/screen", json=body)
            if r.status_code != 200:
                errs.append(1)
        except Exception:
            errs.append(1)
        lat.append((time.perf_counter() - t0) * 1000)


async def run(conc, total):
    q = asyncio.Queue()
    for i in range(total):
        q.put_nowait(i)
    lat, errs = [], []
    limits = httpx.Limits(max_connections=conc, max_keepalive_connections=conc)
    async with httpx.AsyncClient(base_url=BASE, limits=limits, timeout=60) as c:
        t0 = time.perf_counter()
        await asyncio.gather(*[worker(c, q, lat, errs) for _ in range(conc)])
        dt = time.perf_counter() - t0
    lat.sort()
    pct = lambda p: lat[min(len(lat) - 1, int(len(lat) * p))]
    return conc, total, len(errs), total / dt, pct(0.50), pct(0.95), pct(0.99)


async def main():
    label = sys.argv[1] if len(sys.argv) > 1 else "run"
    total = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
    await run(5, 100)   # warm-up, not reported
    print(f"Load test: {label}, {total} requests per level (client runs in the same container)")
    print(f"{'conc':>5} {'reqs':>6} {'errors':>6} {'req/s':>9} {'p50 ms':>8} {'p95 ms':>8} {'p99 ms':>8}")
    for conc in LEVELS:
        c, n, e, tps, p50, p95, p99 = await run(conc, total)
        print(f"{c:>5} {n:>6} {e:>6} {tps:>9.1f} {p50:>8.2f} {p95:>8.2f} {p99:>8.2f}")

asyncio.run(main())

# Harm Cap — AML Decision System UI

A multi-page React + Vite front-end for the Harm Cap anti-money-laundering decision system. The UI demonstrates a harm-bounded screening approach: instead of flagging everything and freezing innocent accounts, the bank sets a cap on how many innocent senders can be wrongly held per 10,000 active senders per 6-hour window.

> **Data notice** — All numbers come from IBM's synthetic AML dataset. "Innocent" means "not labelled as laundering" in that dataset. Results do not represent real-bank performance.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (Recorded mode, no backend needed)
npm run dev

# 3. Open in browser
#    http://localhost:5173  (or the port shown in the terminal)
```

To create a static production bundle:

```bash
npm run build
# Output goes to dist/ — serve any static file server from there
```

---

## Pages

| Route | Title | Description |
|-------|-------|-------------|
| `/` | Overview | Hero 10,000-dot illustration, three steps, synthetic-data warning |
| `/cap-explorer` | Cap Explorer | Segmented control for cap 2/5/10; HI-Small & LI-Small charts |
| `/screening` | Live Screening | Transaction form + replay of the 5-step demo sequence |
| `/audit` | Audit Log | Visual hash chain with click-to-expand, verify action |
| `/tamper` | Tamper Tests | Animated chain-break illustration for each of 8 recorded tests |
| `/platform` | Platform | /health & /policy cards, load-test chart (IBM LinuxONE s390x) |
| `/limits` | Limits | Negative result (daily recalibration), known limitations table |

---

## Recorded vs Live mode

The app starts in **Recorded mode**: all content is served from bundled JSON in `public/data/`. No network calls are made.

### Switching to Live mode

1. Click **"Go live"** in the left navigation or the mode strip.
2. Confirm the dialog ("This adds records to the live audit log").
3. The app will connect to the screening service at `http://127.0.0.1:8000`.

> **Important** — only `POST /screen` (triggered by the Replay button or the form submit) writes to the audit log. All other live calls are read-only.

If the service is unreachable or returns an error the app automatically falls back to Recorded mode and shows an error message.

### Backend base URL

The base URL is a single constant, proxied by Vite in development:

```
http://127.0.0.1:8000
```

In production (`npm run build`) the fetch calls go to the same origin as the static bundle, so you must either:
- Serve the `dist/` folder from the same host/port as the FastAPI service, **or**
- Set the `VITE_API_BASE` environment variable (not yet wired; add to `src/api.js` if needed).

### Dev proxy

`vite.config.js` proxies the following paths to `http://127.0.0.1:8000` during development:

```
/health  /policy  /screen  /audit  /case
```

This avoids CORS issues without touching the backend.

---

## Project structure

```
harmcap-ui/
├── public/
│   └── data/
│       ├── demo_hold_sequence.json   ← 5-tx replay payload (from brief)
│       ├── recorded_replay.json      ← pre-recorded screening results
│       ├── recorded_audit.json       ← pre-recorded audit chain
│       ├── recorded_tamper.json      ← pre-recorded tamper test results
│       ├── recorded_health.json      ← pre-recorded /health & /policy
│       ├── hi_test.txt               ← raw HI-Small results (source of truth)
│       ├── li_ood.txt                ← raw LI-Small results (source of truth)
│       ├── loadtest_real_model.txt   ← raw load-test numbers
│       ├── recal.txt                 ← recalibration comparison numbers
│       └── tamper_test.txt           ← raw tamper test results
├── src/
│   ├── api.js                        ← all API calls + recorded data loader
│   ├── App.jsx                       ← hash router, 7 routes
│   ├── main.jsx
│   ├── context/
│   │   └── ModeContext.jsx           ← recorded ↔ live mode state
│   ├── components/
│   │   ├── Layout.jsx                ← persistent left nav + mode strip
│   │   └── Layout.css
│   ├── pages/
│   │   ├── Overview.{jsx,css}
│   │   ├── CapExplorer.{jsx,css}
│   │   ├── LiveScreening.{jsx,css}
│   │   ├── AuditLog.{jsx,css}
│   │   ├── TamperTests.{jsx,css}
│   │   ├── Platform.{jsx,css}
│   │   └── Limits.{jsx,css}
│   └── styles/
│       ├── tokens.css                ← design tokens (colours, fonts, radii)
│       └── global.css                ← reset, typography, component primitives
└── vite.config.js
```

---

## Design system

| Token | Value | Used for |
|-------|-------|----------|
| `--ink` | `#0E1A24` | Background |
| `--ledger` | `#F4F1E8` | Data panels |
| `--teal` | `#19A58E` | Held within cap / released |
| `--vermilion` | `#E2553B` | Over cap / tampered |
| `--amber` | `#E8B341` | Hold decisions only |
| `--font-display` | Fraunces | Headlines, big numbers |
| `--font-body` | Inter | Body, UI |

---

## Placeholders and known gaps

| Page | Item | Reason |
|------|------|--------|
| Audit Log | Hash chain shows only 5 demo records | The OpenAPI spec has no `GET /audit/log` list endpoint; a live endpoint would be needed to page all records |
| Audit Log | Verify button | Requires a live connection and a verifier token; in Recorded mode the button is disabled with an explanation |
| Platform | `/health` uptime | Shows recorded snapshot `86421 s` in Recorded mode; switches to live in Live mode |
| Tamper Tests | Chain animation | Conceptual illustration only — block sequences are representative, not replaying the real log |
| Screening form | `ts` field | ISO-8601 datetime string; the backend may normalise or reject certain formats |

---

## Tech stack

- **React 19** + **Vite 8**
- **react-router-dom** (HashRouter — works from any static server)
- **Recharts** — all charts (ComposedChart, BarChart, LineChart)
- **Framer Motion** — hero ripple, decision reveal, chain-break animations
- **Google Fonts** — Fraunces (display) + Inter (body), loaded via `<link>` in `index.html`
- No paid services, no external CDNs for scripts or styles

---

## Accessibility notes

- Skip link at the top of every page
- All interactive elements have visible `:focus-visible` outlines
- Segmented controls use `role="radiogroup"` / `role="radio"` / `aria-checked`
- Audit log chain blocks are keyboard-activatable (`Enter` / `Space`)
- `prefers-reduced-motion` is respected everywhere (Framer Motion + CSS)
- `prefers-color-scheme: light` tokens defined in `tokens.css`
- Minimum font size: 16 px; key numbers: 56 px+

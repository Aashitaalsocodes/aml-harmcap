import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  ComposedChart,
  ScatterChart,
  Scatter
} from 'recharts';
import './CapExplorer.css';

// Frozen evaluation dataset numbers across cap thresholds
const CAP_DATA = {
  2: {
    cap: 2,
    headline: "At 2 per 10,000, the cap held in 7 of 8 windows on HI-Small (recall 29.0%) and in 30 of 40 windows on LI-Small (recall 11.9%), with nothing retuned.",
    hi: { recall: 29.0, meanHarm: 0.9, worstHarm: 2.1, overCap: 1, held: 7, total: 8 },
    li: { recall: 11.9, meanHarm: 1.9, worstHarm: 7.4, overCap: 10, held: 30, total: 40 }
  },
  5: {
    cap: 5,
    headline: "At 5 per 10,000, the cap held in 6 of 8 windows on HI-Small (recall 32.8%) and in 26 of 40 windows on LI-Small (recall 13.4%), with nothing retuned.",
    hi: { recall: 32.8, meanHarm: 9.1, worstHarm: 48.8, overCap: 2, held: 6, total: 8 },
    li: { recall: 13.4, meanHarm: 6.0, worstHarm: 50.0, overCap: 14, held: 26, total: 40 }
  },
  10: {
    cap: 10,
    headline: "At 10 per 10,000, the cap held in 4 of 8 windows on HI-Small (recall 35.4%) and in 21 of 40 windows on LI-Small (recall 15.2%), with nothing retuned.",
    hi: { recall: 35.4, meanHarm: 209, worstHarm: 789, overCap: 4, held: 4, total: 8 },
    li: { recall: 15.2, meanHarm: 48, worstHarm: 746, overCap: 19, held: 21, total: 40 }
  }
};

const HI_SMALL_TABLE = [
  { cap: 2, recall: '29.0%', meanHarm: '0.9', worstHarm: '2.1', overCap: '1/8', heldPct: '87.5%' },
  { cap: 5, recall: '32.8%', meanHarm: '9.1', worstHarm: '48.8', overCap: '2/8', heldPct: '75.0%' },
  { cap: 10, recall: '35.4%', meanHarm: '209', worstHarm: '789', overCap: '4/8', heldPct: '50.0%' }
];

const LI_SMALL_TABLE = [
  { cap: 2, recall: '11.9%', meanHarm: '1.9', worstHarm: '7.4', overCap: '10/40', heldPct: '75.0%' },
  { cap: 5, recall: '13.4%', meanHarm: '6.0', worstHarm: '50.0', overCap: '14/40', heldPct: '65.0%' },
  { cap: 10, recall: '15.2%', meanHarm: '48', worstHarm: '746', overCap: '19/40', heldPct: '52.5%' }
];

// Dot plot data: Recall vs Cap
const RECALL_VS_CAP_DATA = [
  { cap: 2, capLabel: '2', hiRecall: 29.0, liRecall: 11.9 },
  { cap: 5, capLabel: '5', hiRecall: 32.8, liRecall: 13.4 },
  { cap: 10, capLabel: '10', hiRecall: 35.4, liRecall: 15.2 }
];

// Log-scale worst harm comparison data
const WORST_HARM_DATA = [
  { cap: 2, capLabel: 'Cap 2', hiWorst: 2.1, liWorst: 7.4, capValue: 2 },
  { cap: 5, capLabel: 'Cap 5', hiWorst: 48.8, liWorst: 50.0, capValue: 5 },
  { cap: 10, capLabel: 'Cap 10', hiWorst: 789, liWorst: 746, capValue: 10 }
];

// Custom Tooltip for Proportion Bar Chart
function ProportionTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip__title">{data.name}</div>
        <div className="custom-tooltip__row">
          <span>Held within cap:</span>
          <strong>{data.held} / {data.total} ({data.heldPct}%)</strong>
        </div>
        <div className="custom-tooltip__row">
          <span>Exceeded cap (broke):</span>
          <strong>{data.broke} / {data.total} ({data.brokePct}%)</strong>
        </div>
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Recall Dot Plot
function RecallTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip__title">Cap: {label} per 10,000</div>
        {payload.map((entry, idx) => (
          <div key={idx} className="custom-tooltip__row" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <strong>{entry.value}%</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Worst Harm Log Chart
function WorstHarmTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip__title">{label} per 10,000</div>
        <div className="custom-tooltip__row" style={{ color: '#19A58E' }}>
          <span>HI-Small Worst:</span>
          <strong>{data.hiWorst} per 10k</strong>
        </div>
        <div className="custom-tooltip__row" style={{ color: '#59C3B0' }}>
          <span>LI-Small Worst:</span>
          <strong>{data.liWorst} per 10k</strong>
        </div>
        <div className="custom-tooltip__row" style={{ color: '#E8B341', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '4px', marginTop: '4px' }}>
          <span>Cap Line:</span>
          <strong>{data.capValue} per 10k</strong>
        </div>
      </div>
    );
  }
  return null;
}

export default function CapExplorer() {
  const [selectedCap, setSelectedCap] = useState(5);

  const current = CAP_DATA[selectedCap];

  // Proportion horizontal bar data for current cap selection
  const proportionData = [
    {
      name: 'HI-Small',
      held: current.hi.held,
      broke: current.hi.overCap,
      total: current.hi.total,
      heldPct: Number(((current.hi.held / current.hi.total) * 100).toFixed(1)),
      brokePct: Number(((current.hi.overCap / current.hi.total) * 100).toFixed(1))
    },
    {
      name: 'LI-Small',
      held: current.li.held,
      broke: current.li.overCap,
      total: current.li.total,
      heldPct: Number(((current.li.held / current.li.total) * 100).toFixed(1)),
      brokePct: Number(((current.li.overCap / current.li.total) * 100).toFixed(1))
    }
  ];

  return (
    <div className="cap-explorer">
      {/* 1. Header with Big Segmented Control */}
      <header className="cap-explorer__header">
        <div className="cap-explorer__titles">
          <h1 className="cap-explorer__title">Cap Explorer</h1>
          <p className="cap-explorer__subtitle">
            Empirical evaluation of harm caps on frozen production evaluation windows.
            Evaluate the operational trade-offs between recall and worst-window harm.
          </p>
        </div>

        <div className="cap-explorer__control-wrapper">
          <label id="cap-select-label" className="cap-explorer__control-label">
            Select Cap Value (per 10,000 active senders):
          </label>
          <div
            className="segmented-control"
            role="radiogroup"
            aria-labelledby="cap-select-label"
          >
            {[2, 5, 10].map((capVal) => {
              const isActive = selectedCap === capVal;
              return (
                <button
                  key={capVal}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={`segmented-control__btn ${
                    isActive ? 'segmented-control__btn--active' : ''
                  }`}
                  onClick={() => setSelectedCap(capVal)}
                >
                  <span className="segmented-control__num">{capVal}</span>
                  <span className="segmented-control__unit">per 10k</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. Prominent Headline Sentence */}
      <section className="cap-explorer__headline-card" aria-live="polite">
        <p className="cap-explorer__headline-text">
          {current.headline}
        </p>
      </section>

      {/* 3. Two Datasets Side-by-Side */}
      <section className="cap-explorer__datasets-section">
        <div className="section-header">
          <h2 className="section-title">Evaluation Datasets</h2>
          <p className="section-desc">
            Frozen performance metrics across separate evaluation environments for Cap {selectedCap} per 10,000.
          </p>
        </div>

        <div className="datasets-grid">
          {/* Dataset 1: HI-Small */}
          <article className="dataset-panel dataset-panel--hi">
            <div className="dataset-panel__header">
              <div className="dataset-panel__identity">
                <h3 className="dataset-panel__name">HI-Small</h3>
                <span className="dataset-panel__meta">Later days Sep 9–10 (8 windows)</span>
              </div>
              <span className={`dataset-panel__badge ${current.hi.overCap === 0 ? 'badge-held' : 'badge-over'}`}>
                {current.hi.overCap} of {current.hi.total} over cap
              </span>
            </div>

            <div className="dataset-panel__recall-block">
              <span className="dataset-panel__recall-label">Model Recall at Cap {selectedCap}</span>
              <span className="dataset-panel__recall-value">{current.hi.recall.toFixed(1)}%</span>
              <span className="dataset-panel__recall-note">
                Held in {current.hi.held} of {current.hi.total} windows ({((current.hi.held / current.hi.total) * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="dataset-panel__stats">
              <div className="stat-item">
                <span className="stat-item__label">Mean Harm</span>
                <span className="stat-item__val">{current.hi.meanHarm}</span>
              </div>
              <div className="stat-item">
                <span className="stat-item__label">Worst Harm</span>
                <span className={`stat-item__val ${current.hi.worstHarm > selectedCap ? 'stat-item__val--break' : ''}`}>
                  {current.hi.worstHarm}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-item__label">Windows Over Cap</span>
                <span className={`stat-item__val ${current.hi.overCap > 0 ? 'stat-item__val--break' : ''}`}>
                  {current.hi.overCap} / {current.hi.total}
                </span>
              </div>
            </div>

            <div className="dataset-panel__table-wrap">
              <div className="dataset-panel__table-title">HI-Small Frozen Evaluation Grid</div>
              <table className="dataset-table">
                <thead>
                  <tr>
                    <th>Cap</th>
                    <th>Recall</th>
                    <th>Mean Harm</th>
                    <th>Worst Harm</th>
                    <th>Over Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {HI_SMALL_TABLE.map((row) => (
                    <tr
                      key={row.cap}
                      className={row.cap === selectedCap ? 'dataset-table__row--active' : ''}
                    >
                      <td>Cap {row.cap}</td>
                      <td>{row.recall}</td>
                      <td>{row.meanHarm}</td>
                      <td>{row.worstHarm}</td>
                      <td>{row.overCap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          {/* Dataset 2: LI-Small */}
          <article className="dataset-panel dataset-panel--li">
            <div className="dataset-panel__header">
              <div className="dataset-panel__identity">
                <h3 className="dataset-panel__name">LI-Small</h3>
                <span className="dataset-panel__meta">Different dataset, never tuned (40 windows)</span>
              </div>
              <span className="dataset-panel__badge badge-over">
                {current.li.overCap} of {current.li.total} over cap
              </span>
            </div>

            <div className="dataset-panel__recall-block">
              <span className="dataset-panel__recall-label">Model Recall at Cap {selectedCap}</span>
              <span className="dataset-panel__recall-value">{current.li.recall.toFixed(1)}%</span>
              <span className="dataset-panel__recall-note">
                Held in {current.li.held} of {current.li.total} windows ({((current.li.held / current.li.total) * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="dataset-panel__stats">
              <div className="stat-item">
                <span className="stat-item__label">Mean Harm</span>
                <span className="stat-item__val">{current.li.meanHarm}</span>
              </div>
              <div className="stat-item">
                <span className="stat-item__label">Worst Harm</span>
                <span className={`stat-item__val ${current.li.worstHarm > selectedCap ? 'stat-item__val--break' : ''}`}>
                  {current.li.worstHarm}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-item__label">Windows Over Cap</span>
                <span className="stat-item__val stat-item__val--break">
                  {current.li.overCap} / {current.li.total}
                </span>
              </div>
            </div>

            <div className="dataset-panel__table-wrap">
              <div className="dataset-panel__table-title">LI-Small Frozen Evaluation Grid</div>
              <table className="dataset-table">
                <thead>
                  <tr>
                    <th>Cap</th>
                    <th>Recall</th>
                    <th>Mean Harm</th>
                    <th>Worst Harm</th>
                    <th>Over Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {LI_SMALL_TABLE.map((row) => (
                    <tr
                      key={row.cap}
                      className={row.cap === selectedCap ? 'dataset-table__row--active' : ''}
                    >
                      <td>Cap {row.cap}</td>
                      <td>{row.recall}</td>
                      <td>{row.meanHarm}</td>
                      <td>{row.worstHarm}</td>
                      <td>{row.overCap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>

      {/* 4. Three Recharts Charts */}
      <section className="cap-explorer__charts-section">
        <div className="section-header">
          <h2 className="section-title">Visual Analysis</h2>
          <p className="section-desc">
            Direct visual comparisons across window adherence, recall curves, and worst-case harm behavior.
          </p>
        </div>

        {/* Chart A: Proportion Bar Chart */}
        <article className="chart-card">
          <div className="chart-card__header">
            <h3 className="chart-card__title">
              (a) Window Adherence Proportion: Held in X of N Windows (Cap {selectedCap} per 10k)
            </h3>
            <p className="chart-card__desc">
              Aggregate breakdown of 6-hour evaluation windows that stayed strictly within the cap (teal) vs exceeded the cap (vermilion). No claim is made on specific window identities.
            </p>
          </div>

          <div className="chart-card__container">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                layout="vertical"
                data={proportionData}
                margin={{ top: 12, right: 28, left: 20, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--ledger-dim)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 13, fill: '#1A1A1A' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 14, fontWeight: 700, fill: '#1A1A1A' }}
                  width={90}
                />
                <Tooltip content={<ProportionTooltip />} />
                <Bar
                  dataKey="heldPct"
                  name="Held within cap"
                  stackId="proportion"
                  fill="#19A58E"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="brokePct"
                  name="Exceeded cap (broke)"
                  stackId="proportion"
                  fill="#E2553B"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend-custom">
            <div className="chart-legend-item">
              <span className="chart-legend-swatch chart-legend-swatch--teal" />
              <span>Held within cap (HI: {current.hi.held}/{current.hi.total}, LI: {current.li.held}/{current.li.total})</span>
            </div>
            <div className="chart-legend-item">
              <span className="chart-legend-swatch chart-legend-swatch--vermilion" />
              <span>Exceeded cap / broke (HI: {current.hi.overCap}/{current.hi.total}, LI: {current.li.overCap}/{current.li.total})</span>
            </div>
          </div>
        </article>

        {/* Chart B: Dot Plot - Recall vs Cap */}
        <article className="chart-card">
          <div className="chart-card__header">
            <h3 className="chart-card__title">
              (b) Dot Plot: Recall vs Cap Threshold
            </h3>
            <p className="chart-card__desc">
              Recall % as cap threshold increases from 2 to 10 per 10,000 active senders.
              HI-Small is depicted in teal, LI-Small in lighter teal. Amber dashed marker highlights the active cap ({selectedCap}).
            </p>
          </div>

          <div className="chart-card__container chart-card__container--tall">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={RECALL_VS_CAP_DATA}
                margin={{ top: 24, right: 32, left: 12, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ledger-dim)" />
                <XAxis
                  dataKey="cap"
                  type="number"
                  domain={[1, 11]}
                  ticks={[2, 5, 10]}
                  tickFormatter={(v) => `Cap ${v}`}
                  tick={{ fontSize: 13, fontWeight: 600, fill: '#1A1A1A' }}
                  label={{ value: 'Cap (per 10,000)', position: 'insideBottom', offset: -12, fill: '#6B7280', fontSize: 13 }}
                />
                <YAxis
                  unit="%"
                  domain={[0, 40]}
                  ticks={[0, 10, 20, 30, 40]}
                  tick={{ fontSize: 13, fill: '#1A1A1A' }}
                  label={{ value: 'Recall (%)', angle: -90, position: 'insideLeft', offset: 12, fill: '#6B7280', fontSize: 13 }}
                />
                <Tooltip content={<RecallTooltip />} />
                <ReferenceLine
                  x={selectedCap}
                  stroke="#E8B341"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: `Active: Cap ${selectedCap}`,
                    fill: '#8A6D14',
                    fontSize: 13,
                    fontWeight: 600,
                    position: 'top'
                  }}
                />
                <Line
                  type="linear"
                  dataKey="hiRecall"
                  name="HI-Small Recall"
                  stroke="#19A58E"
                  strokeWidth={3}
                  dot={{ r: 7, fill: '#19A58E', stroke: '#F4F1E8', strokeWidth: 2 }}
                  activeDot={{ r: 9 }}
                />
                <Line
                  type="linear"
                  dataKey="liRecall"
                  name="LI-Small Recall"
                  stroke="#59C3B0"
                  strokeWidth={3}
                  dot={{ r: 7, fill: '#59C3B0', stroke: '#F4F1E8', strokeWidth: 2 }}
                  activeDot={{ r: 9 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend-custom">
            <div className="chart-legend-item">
              <span className="chart-legend-line" style={{ backgroundColor: '#19A58E' }} />
              <span>HI-Small (Recall: 29.0% &rarr; 32.8% &rarr; 35.4%)</span>
            </div>
            <div className="chart-legend-item">
              <span className="chart-legend-line" style={{ backgroundColor: '#59C3B0' }} />
              <span>LI-Small (Recall: 11.9% &rarr; 13.4% &rarr; 15.2%)</span>
            </div>
          </div>
        </article>

        {/* Chart C: Log-Scale Bar Chart - Worst Harm vs Cap */}
        <article className="chart-card">
          <div className="chart-card__header">
            <h3 className="chart-card__title">
              (c) Log-Scale Bar Chart: Worst-Window Harm vs Cap Line
            </h3>
            <p className="chart-card__desc">
              Worst single-window harm observed (per 10,000 senders) plotted on a logarithmic scale alongside the selected cap baseline (red dashed line at {selectedCap}).
            </p>
          </div>

          <div className="chart-card__container chart-card__container--tall">
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart
                data={WORST_HARM_DATA}
                margin={{ top: 24, right: 36, left: 16, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ledger-dim)" />
                <XAxis
                  dataKey="capLabel"
                  tick={{ fontSize: 13, fontWeight: 700, fill: '#1A1A1A' }}
                />
                <YAxis
                  scale="log"
                  domain={[1, 1000]}
                  allowDataOverflow
                  ticks={[1, 2, 5, 10, 50, 100, 500, 1000]}
                  tickFormatter={(v) => `${v}`}
                  tick={{ fontSize: 13, fill: '#1A1A1A' }}
                  label={{ value: 'Harm per 10k (log scale)', angle: -90, position: 'insideLeft', offset: 12, fill: '#6B7280', fontSize: 13 }}
                />
                <Tooltip content={<WorstHarmTooltip />} />
                <ReferenceLine
                  y={selectedCap}
                  stroke="#E2553B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{
                    value: `Selected Cap Limit: ${selectedCap}`,
                    fill: '#a72812',
                    fontSize: 13,
                    fontWeight: 700,
                    position: 'insideTopRight'
                  }}
                />
                <Bar
                  dataKey="hiWorst"
                  name="HI-Small Worst Harm"
                  fill="#19A58E"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Bar
                  dataKey="liWorst"
                  name="LI-Small Worst Harm"
                  fill="#59C3B0"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend-custom">
            <div className="chart-legend-item">
              <span className="chart-legend-swatch chart-legend-swatch--teal" />
              <span>HI-Small Worst Harm (Cap 2: 2.1, Cap 5: 48.8, Cap 10: 789)</span>
            </div>
            <div className="chart-legend-item">
              <span className="chart-legend-swatch chart-legend-swatch--li-teal" />
              <span>LI-Small Worst Harm (Cap 2: 7.4, Cap 5: 50.0, Cap 10: 746)</span>
            </div>
            <div className="chart-legend-item">
              <span className="chart-legend-line" style={{ backgroundColor: '#E2553B', height: '2px', borderTop: '2px dashed #E2553B' }} />
              <span>Cap Reference Line ({selectedCap} per 10k)</span>
            </div>
          </div>
        </article>
      </section>

      {/* 5. How to Read This Panel */}
      <footer className="how-to-read-panel">
        <div className="how-to-read-panel__header">
          <h3 className="how-to-read-panel__title">How to Read This</h3>
        </div>

        <div className="how-to-read-panel__core-definition">
          <strong>Harm</strong> = distinct wrongly held senders per 10,000 active senders in a 6-hour window. <strong>Break</strong> = a window where harm exceeded the cap.
        </div>

        <div className="how-to-read-panel__grid">
          <div className="how-to-read-item">
            <span className="how-to-read-item__term">Evaluation Window</span>
            <p className="how-to-read-item__desc">
              All evaluations are conducted over discrete 6-hour windows. Window harm is normalized per 10,000 active senders observed during that window.
            </p>
          </div>

          <div className="how-to-read-item__term-box">
            <div className="how-to-read-item">
              <span className="how-to-read-item__term">HI-Small Dataset</span>
              <p className="how-to-read-item__desc">
                High-intensity evaluation dataset spanning later days Sep 9–10 across 8 total windows.
              </p>
            </div>
          </div>

          <div className="how-to-read-item__term-box">
            <div className="how-to-read-item">
              <span className="how-to-read-item__term">LI-Small Dataset</span>
              <p className="how-to-read-item__desc">
                Low-intensity evaluation dataset, completely independent and never tuned, covering 40 windows.
              </p>
            </div>
          </div>

          <div className="how-to-read-item__term-box">
            <div className="how-to-read-item">
              <span className="how-to-read-item__term">Recall vs Cap Trade-off</span>
              <p className="how-to-read-item__desc">
                Loosening the cap from 2 to 10 improves recall modestly (29.0% to 35.4% on HI-Small), but worst-window harm escalates non-linearly (from 2.1 to 789).
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import './Limits.css';

const RECALIBRATION_COMPARISONS = [
  {
    cap: 'Cap 2',
    fixedRecall: '29.0%',
    dailyRecall: '13.7%',
    fixedWorst: '2.1',
    dailyWorst: '2.1',
    fixedOverCap: '1/8',
    dailyOverCap: '1/8',
    recallAlert: true,
  },
  {
    cap: 'Cap 5',
    fixedRecall: '32.8%',
    dailyRecall: '32.4%',
    fixedWorst: '48.8',
    dailyWorst: '128.8',
    fixedOverCap: '2/8',
    dailyOverCap: '2/8',
    worstAlert: true,
  },
  {
    cap: 'Cap 10',
    fixedRecall: '35.4%',
    dailyRecall: '33.7%',
    fixedWorst: '789',
    dailyWorst: '789',
    fixedOverCap: '4/8',
    dailyOverCap: '3/8',
    recallAlert: false,
  },
];

export default function Limits() {
  return (
    <div className="limits-page">
      {/* Page Header */}
      <header className="limits-header">
        <h1 className="limits-title">Limits and what did not work</h1>
        <p className="limits-subtitle">
          Empirical evaluation of daily recalibration, negative experimental findings,
          and documented system constraints across the screening pipeline.
        </p>
      </header>

      {/* Negative Result Panel */}
      <section 
        className="negative-result-panel"
        aria-labelledby="negative-result-heading"
        tabIndex={0}
      >
        <div className="negative-result-header">
          <span className="negative-result-badge">Negative Result</span>
          <h2 id="negative-result-heading" className="negative-result-title">
            Daily recalibration did not help
          </h2>
          <p className="negative-result-explanation">
            Threshold re-chosen each window from the previous four windows, skipping the latest.
            This was tested on HI-Small (8 windows).
          </p>
        </div>

        {/* Prominent One-line Reading */}
        <div className="prominent-reading-banner" role="region" aria-label="Key finding reading">
          <blockquote className="prominent-reading-text">
            “Busy days shift scores upward, and history cannot see a shift that has just arrived.”
          </blockquote>
        </div>

        {/* Key Statistical Callouts */}
        <div className="negative-stats-grid">
          <div className="negative-stat-card">
            <span className="negative-stat-label">Cap 2 Daily Recall Degradation</span>
            <div className="negative-stat-row">
              <span className="negative-stat-big vermilion">13.7%</span>
              <span className="negative-stat-desc">vs 29.0% fixed threshold (drop of 15.3 percentage points)</span>
            </div>
          </div>
          <div className="negative-stat-card">
            <span className="negative-stat-label">Cap 5 Daily Worst Harm</span>
            <div className="negative-stat-row">
              <span className="negative-stat-big vermilion">128.8</span>
              <span className="negative-stat-desc">vs 48.8 fixed threshold (2.6× increase in worst-case harm)</span>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="table-container" tabIndex={0} role="region" aria-label="Fixed threshold vs daily recalibration table">
          <table className="recal-table">
            <thead>
              <tr>
                <th scope="col">Budget</th>
                <th scope="col">Fixed recall</th>
                <th scope="col">Daily recall</th>
                <th scope="col">Fixed worst</th>
                <th scope="col">Daily worst</th>
                <th scope="col">Fixed over cap</th>
                <th scope="col">Daily over cap</th>
              </tr>
            </thead>
            <tbody>
              {RECALIBRATION_COMPARISONS.map((row) => (
                <tr key={row.cap}>
                  <td>{row.cap}</td>
                  <td>{row.fixedRecall}</td>
                  <td className={row.recallAlert ? 'table-cell-alert' : ''}>
                    {row.dailyRecall}
                  </td>
                  <td>{row.fixedWorst}</td>
                  <td className={row.worstAlert ? 'table-cell-alert' : ''}>
                    {row.dailyWorst}
                  </td>
                  <td>{row.fixedOverCap}</td>
                  <td>{row.dailyOverCap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="table-caption-note">
          Note: For cap 10, both fixed and daily have the same worst (789 from the brief's data for fixed;
          the recal data shows worst=789.0 as well). The brief says cap10 over=4/8 fixed vs 3/8 daily.
        </p>
      </section>

      {/* Known Limitations Section */}
      <section 
        className="limitations-container"
        aria-labelledby="limitations-heading"
      >
        <div className="limitations-header">
          <h2 id="limitations-heading" className="limitations-title">Known Limitations</h2>
          <p className="limitations-intro">
            Boundary conditions and dataset properties that scope the operational validity of the HarmCap model.
          </p>
        </div>

        <div className="limitations-stack">
          {/* Limitation 1: Synthetic labels */}
          <article 
            className="limitation-item-synthetic"
            tabIndex={0}
            aria-labelledby="lim-synthetic-title"
          >
            <span className="limitation-label-synthetic">Data Origin</span>
            <h3 id="lim-synthetic-title" className="limitation-heading-synthetic">
              Synthetic labels
            </h3>
            <p className="limitation-body-synthetic">
              Results come from IBM's synthetic AML dataset. Real laundering patterns may differ.
            </p>
          </article>

          {/* Limitation 2: Only 8 HI test windows */}
          <article 
            className="limitation-item-windows"
            tabIndex={0}
            aria-labelledby="lim-windows-title"
          >
            <div className="limitation-window-metric">
              <span className="limitation-stat-number">8</span>
              <span className="limitation-stat-subtext">HI Test Windows</span>
            </div>
            <div className="limitation-window-content">
              <h3 id="lim-windows-title" className="limitation-window-title">
                Only 8 HI test windows
              </h3>
              <p className="limitation-window-text">
                The held-out test covers just two days (Sep 9–10). More windows would give higher confidence.
              </p>
            </div>
          </article>

          {/* Limitation 3: Frozen thresholds */}
          <article 
            className="limitation-item-frozen"
            tabIndex={0}
            aria-labelledby="lim-frozen-title"
          >
            <span className="limitation-label-frozen">Calibration Policy</span>
            <h3 id="lim-frozen-title" className="limitation-heading-frozen">
              Frozen thresholds
            </h3>
            <p className="limitation-body-frozen">
              The threshold is fixed from calibration and not adapted during test windows.
            </p>
          </article>

          {/* Limitation 4: Audit truncation */}
          <article 
            className="limitation-item-audit"
            tabIndex={0}
            aria-labelledby="lim-audit-title"
          >
            <div className="limitation-audit-indicator">
              <span className="limitation-audit-dot" aria-hidden="true"></span>
              <span>Cryptographic Verification Boundary</span>
            </div>
            <h3 id="lim-audit-title" className="limitation-heading-audit">
              Audit truncation limited to the last checkpoint
            </h3>
            <p className="limitation-body-audit">
              Truncation beyond the last signed checkpoint cannot be detected.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

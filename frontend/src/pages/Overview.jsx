import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Overview.css';

/**
 * Deterministic coordinates for the 100x100 grid (indices 0..9999).
 * Cell size: 10x10 units in a 1000x1000 SVG coordinate space.
 * Center of dot: cx = col * 10 + 5, cy = row * 10 + 5.
 */

// Amber dots: innocent accounts wrongly held (bounded strictly by the cap)
const AMBER_DOTS = [
  // Cap = 2 (2 dots)
  { id: 'ACC-2418', col: 18, row: 24, score: 0.942, minCap: 2 },
  { id: 'ACC-6872', col: 72, row: 68, score: 0.938, minCap: 2 },
  // Cap = 5 (+3 dots -> 5 dots total)
  { id: 'ACC-1583', col: 83, row: 15, score: 0.925, minCap: 5 },
  { id: 'ACC-8134', col: 34, row: 81, score: 0.919, minCap: 5 },
  { id: 'ACC-4762', col: 62, row: 47, score: 0.914, minCap: 5 },
  // Cap = 10 (+5 dots -> 10 dots total)
  { id: 'ACC-3391', col: 91, row: 33, score: 0.908, minCap: 10 },
  { id: 'ACC-8912', col: 12, row: 89, score: 0.903, minCap: 10 },
  { id: 'ACC-5627', col: 27, row: 56, score: 0.899, minCap: 10 },
  { id: 'ACC-1245', col: 45, row: 12, score: 0.895, minCap: 10 },
  { id: 'ACC-7458', col: 58, row: 74, score: 0.891, minCap: 10 },
];

// Red-ringed dots: laundering accounts successfully caught
const RED_DOTS = [
  // Cap = 2 (15 laundering dots caught)
  { id: 'AML-0819', col: 19, row: 8, score: 0.988, minCap: 2 },
  { id: 'AML-2264', col: 64, row: 22, score: 0.984, minCap: 2 },
  { id: 'AML-3541', col: 41, row: 35, score: 0.981, minCap: 2 },
  { id: 'AML-1789', col: 89, row: 17, score: 0.976, minCap: 2 },
  { id: 'AML-4321', col: 21, row: 43, score: 0.972, minCap: 2 },
  { id: 'AML-5277', col: 77, row: 52, score: 0.969, minCap: 2 },
  { id: 'AML-6138', col: 38, row: 61, score: 0.965, minCap: 2 },
  { id: 'AML-7982', col: 82, row: 79, score: 0.961, minCap: 2 },
  { id: 'AML-8415', col: 15, row: 84, score: 0.958, minCap: 2 },
  { id: 'AML-9363', col: 63, row: 93, score: 0.954, minCap: 2 },
  { id: 'AML-2955', col: 55, row: 29, score: 0.950, minCap: 2 },
  { id: 'AML-4873', col: 73, row: 48, score: 0.947, minCap: 2 },
  { id: 'AML-6711', col: 11, row: 67, score: 0.944, minCap: 2 },
  { id: 'AML-7349', col: 49, row: 73, score: 0.940, minCap: 2 },
  { id: 'AML-9128', col: 28, row: 91, score: 0.936, minCap: 2 },
  // Cap = 5 (+3 laundering dots -> 18 total caught)
  { id: 'AML-1432', col: 32, row: 14, score: 0.929, minCap: 5 },
  { id: 'AML-5986', col: 86, row: 59, score: 0.922, minCap: 5 },
  { id: 'AML-8850', col: 50, row: 88, score: 0.916, minCap: 5 },
  // Cap = 10 (+2 laundering dots -> 20 total caught)
  { id: 'AML-3808', col: 8, row: 38, score: 0.906, minCap: 10 },
  { id: 'AML-6592', col: 92, row: 65, score: 0.897, minCap: 10 },
];

/**
 * Pre-generate 14 concentric radial rings spanning the 100x100 grid.
 * Each ring is converted into a compact SVG path string for maximum rendering performance.
 */
function createRadialRingPaths() {
  const NUM_RINGS = 14;
  const rings = Array.from({ length: NUM_RINGS }, () => []);
  const center = 49.5;
  const maxDist = Math.hypot(center, center); // ~70.0

  for (let r = 0; r < 100; r++) {
    for (let c = 0; c < 100; c++) {
      const dist = Math.hypot(c - center, r - center);
      const ringIdx = Math.min(NUM_RINGS - 1, Math.floor((dist / maxDist) * NUM_RINGS));
      rings[ringIdx].push({ c, r });
    }
  }

  return rings.map(dotList => {
    return dotList
      .map(({ c, r }) => {
        const x = c * 10 + 5;
        const y = r * 10 + 5;
        // 2px diameter circle path: radius 1
        return `M ${x - 1} ${y} a 1 1 0 1 0 2 0 a 1 1 0 1 0 -2 0`;
      })
      .join(' ');
  });
}

const RADIAL_RING_PATHS = createRadialRingPaths();

export default function Overview() {
  const [cap, setCap] = useState(2);
  const [hoveredDot, setHoveredDot] = useState(null);
  const shouldReduceMotion = useReducedMotion();

  // Active highlighted dots based on selected cap
  const activeAmberDots = useMemo(() => {
    return AMBER_DOTS.filter(d => d.minCap <= cap);
  }, [cap]);

  const activeRedDots = useMemo(() => {
    return RED_DOTS.filter(d => d.minCap <= cap);
  }, [cap]);

  const innocentHeld = activeAmberDots.length;
  const launderingCaught = activeRedDots.length;
  const innocentCleared = 10000 - innocentHeld - launderingCaught;

  return (
    <div className="overview-page">
      {/* Page Title & Subheading */}
      <header className="overview-header">
        <h1 className="overview-title">HarmCap</h1>
        <p className="overview-subtitle">
          Mathematically bounded false positives for anti-money laundering transaction screening.
        </p>
      </header>

      {/* Prominently displayed Synthetic Data Warning */}
      <section className="warning-panel" aria-label="Dataset Notice">
        <div className="warning-content">
          <p className="warning-text">
            This demonstration uses IBM's synthetic AML dataset. All accounts labelled 'innocent' are those not labelled as laundering in the synthetic data. Results do not represent real-bank performance.
          </p>
        </div>
      </section>

      {/* Hero Visual Section: 10,000 Accounts Grid */}
      <section className="hero-section" aria-labelledby="hero-visual-heading">
        <div className="hero-control-bar">
          <div className="hero-meta">
            <h2 id="hero-visual-heading" className="hero-label">
              Illustration: 10,000 accounts
            </h2>
            <p className="hero-sublabel">
              Simulated population grid displaying false-positive harm containment. This is NOT real data.
            </p>
          </div>

          {/* Segmented control for cap */}
          <div className="cap-control-wrapper">
            <span id="cap-control-label" className="control-label">
              Innocent hold cap:
            </span>
            <div
              className="cap-segmented-control"
              role="radiogroup"
              aria-labelledby="cap-control-label"
            >
              {[2, 5, 10].map(val => (
                <button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={cap === val}
                  className={`segmented-button ${cap === val ? 'active' : ''}`}
                  onClick={() => setCap(val)}
                >
                  <span className="button-cap-val">{val}</span>
                  <span className="button-cap-unit">held / 10k</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live metric callouts */}
        <div className="hero-metrics-bar">
          <div className="metric-callout innocent-callout">
            <div className="metric-indicator amber-dot-sample" aria-hidden="true" />
            <div className="metric-data">
              <span className="metric-value">{innocentHeld}</span>
              <span className="metric-name">Innocent accounts held</span>
              <span className="metric-detail">
                {innocentHeld} of 10,000 accounts ({((innocentHeld / 10000) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="metric-callout laundering-callout">
            <div className="metric-indicator red-ring-sample" aria-hidden="true" />
            <div className="metric-data">
              <span className="metric-value">{launderingCaught}</span>
              <span className="metric-name">Laundering accounts caught</span>
              <span className="metric-detail">
                Screened & flagged within the statistical ceiling
              </span>
            </div>
          </div>

          <div className="metric-callout total-callout">
            <div className="metric-indicator base-dot-sample" aria-hidden="true" />
            <div className="metric-data">
              <span className="metric-value">10,000</span>
              <span className="metric-name">Total accounts screened</span>
              <span className="metric-detail">
                {innocentCleared.toLocaleString()} innocent accounts passed uninterrupted
              </span>
            </div>
          </div>
        </div>

        {/* Interactive SVG 100x100 dot grid */}
        <div className="grid-container">
          <div className="grid-svg-wrapper">
            <svg
              className="grid-svg"
              viewBox="0 0 1000 1000"
              role="img"
              aria-label={`100 by 100 accounts grid: ${innocentHeld} innocent held in amber, ${launderingCaught} laundering caught in red rings.`}
            >
              {/* Radial ripple rings for base dots */}
              <g className="base-dots-layer">
                {RADIAL_RING_PATHS.map((pathData, ringIdx) => (
                  <motion.path
                    key={ringIdx}
                    d={pathData}
                    className="base-dot-ring"
                    initial={shouldReduceMotion ? { opacity: 0.3 } : { opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 0.3, scale: 1 }}
                    transition={{
                      duration: 0.45,
                      delay: shouldReduceMotion ? 0 : ringIdx * 0.045,
                      ease: 'easeOut',
                    }}
                    style={{ transformOrigin: '500px 500px' }}
                  />
                ))}
              </g>

              {/* Active Red-Ringed Dots (Laundering Caught) */}
              <g className="red-dots-layer">
                {activeRedDots.map(dot => {
                  const cx = dot.col * 10 + 5;
                  const cy = dot.row * 10 + 5;
                  const isHovered = hoveredDot?.id === dot.id;

                  return (
                    <motion.g
                      key={dot.id}
                      className="highlight-dot-group red-dot-group"
                      initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: isHovered ? 1.5 : 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      style={{ transformOrigin: `${cx}px ${cy}px` }}
                      onMouseEnter={() => setHoveredDot({ ...dot, type: 'Laundering Caught' })}
                      onMouseLeave={() => setHoveredDot(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${dot.id}: Laundering caught, Model score ${dot.score}`}
                    >
                      {/* Outer target ring */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={7}
                        className="red-outer-ring"
                      />
                      {/* Inner solid core */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        className="red-inner-core"
                      />
                    </motion.g>
                  );
                })}
              </g>

              {/* Active Amber Dots (Innocent Wrongly Held under Cap) */}
              <g className="amber-dots-layer">
                {activeAmberDots.map(dot => {
                  const cx = dot.col * 10 + 5;
                  const cy = dot.row * 10 + 5;
                  const isHovered = hoveredDot?.id === dot.id;

                  return (
                    <motion.g
                      key={dot.id}
                      className="highlight-dot-group amber-dot-group"
                      initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: isHovered ? 1.6 : 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      style={{ transformOrigin: `${cx}px ${cy}px` }}
                      onMouseEnter={() => setHoveredDot({ ...dot, type: 'Innocent Wrongly Held' })}
                      onMouseLeave={() => setHoveredDot(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${dot.id}: Innocent held under cap, Model score ${dot.score}`}
                    >
                      {/* Subtle halo ring */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6.5}
                        className="amber-halo-ring"
                      />
                      {/* Solid amber core */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3.5}
                        className="amber-inner-core"
                      />
                    </motion.g>
                  );
                })}
              </g>
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredDot && (
              <div
                className="grid-tooltip"
                role="status"
                aria-live="polite"
              >
                <div className="tooltip-header">
                  <span className={`tooltip-tag ${hoveredDot.type.includes('Laundering') ? 'tag-red' : 'tag-amber'}`}>
                    {hoveredDot.type}
                  </span>
                  <span className="tooltip-id">{hoveredDot.id}</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-key">Model AML Score:</span>
                  <span className="tooltip-val">{hoveredDot.score.toFixed(3)}</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-key">Grid Location:</span>
                  <span className="tooltip-val">Col {hoveredDot.col}, Row {hoveredDot.row}</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-key">Decision Threshold:</span>
                  <span className="tooltip-val">Exceeds Cap {hoveredDot.minCap} cutoff</span>
                </div>
              </div>
            )}
          </div>

          {/* Grid Legend */}
          <div className="grid-legend" aria-label="Visual legend">
            <div className="legend-item">
              <span className="legend-sample dot-normal" aria-hidden="true" />
              <span className="legend-label">Innocent accounts cleared uninterrupted (~9,970+)</span>
            </div>
            <div className="legend-item">
              <span className="legend-sample dot-amber" aria-hidden="true" />
              <span className="legend-label">Innocent accounts wrongly held (strictly bounded by cap)</span>
            </div>
            <div className="legend-item">
              <span className="legend-sample dot-red" aria-hidden="true" />
              <span className="legend-label">Laundering accounts caught (red ring indicator)</span>
            </div>
          </div>
        </div>
      </section>

      {/* THREE STEPS section below hero */}
      <section className="steps-section" aria-labelledby="steps-section-heading">
        <header className="steps-header">
          <h2 id="steps-section-heading" className="steps-heading">
            How HarmCap operates
          </h2>
          <p className="steps-subheading">
            Three principles of statistical risk containment and verifiable auditability.
          </p>
        </header>

        <div className="steps-blocks-container">
          {/* Step 1: Score */}
          <div className="step-block step-score">
            <div className="step-num-display" aria-hidden="true">
              01
            </div>
            <div className="step-body">
              <div className="step-badge">Stage 1: Scoring</div>
              <h3 className="step-title">Score</h3>
              <p className="step-description">
                Every transaction is scored by a model trained on the bank's own history.
              </p>
              <div className="step-technical-rail">
                <div className="rail-item">
                  <span className="rail-label">Model Pipeline</span>
                  <span className="rail-value">XGBoost / LightGBM AML Ensemble</span>
                </div>
                <div className="rail-item">
                  <span className="rail-label">Score Range</span>
                  <span className="rail-value">0.000000 to 1.000000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Hold only the riskiest within the cap */}
          <div className="step-block step-cap">
            <div className="step-num-display" aria-hidden="true">
              02
            </div>
            <div className="step-body">
              <div className="step-badge">Stage 2: Enforcement</div>
              <h3 className="step-title">Hold only the riskiest within the cap</h3>
              <p className="step-description">
                The bank sets a ceiling on innocent accounts that may be wrongly held. The system catches as much laundering as it can within that cap.
              </p>
              <div className="step-technical-rail">
                <div className="rail-item">
                  <span className="rail-label">Bound Guarantee</span>
                  <span className="rail-value">Provable empirical harm limit</span>
                </div>
                <div className="rail-item">
                  <span className="rail-label">Optimization</span>
                  <span className="rail-value">Maximum recall given harm budget</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Log every decision tamper-evidently */}
          <div className="step-block step-audit">
            <div className="step-num-display" aria-hidden="true">
              03
            </div>
            <div className="step-body">
              <div className="step-badge">Stage 3: Governance</div>
              <h3 className="step-title">Log every decision tamper-evidently</h3>
              <p className="step-description">
                Every screening decision is written to a hash-chained, signed audit log.
              </p>
              <div className="step-technical-rail">
                <div className="rail-item">
                  <span className="rail-label">Log Structure</span>
                  <span className="rail-value">Cryptographic Hash Chain (SHA-256)</span>
                </div>
                <div className="rail-item">
                  <span className="rail-label">Verification</span>
                  <span className="rail-value">Independent tamper detection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation / Next actions */}
      <section className="overview-actions-section" aria-label="Deep dive navigation">
        <div className="action-links-wrapper">
          <Link to="/cap-explorer" className="overview-link-primary">
            Launch Cap Explorer
          </Link>
          <Link to="/screening" className="overview-link-secondary">
            View Live Screening Stream
          </Link>
          <Link to="/audit" className="overview-link-secondary">
            Inspect Signed Audit Log
          </Link>
        </div>
      </section>
    </div>
  );
}

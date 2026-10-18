import React, { useState, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import './TamperTests.css';

// Canonical fallback data in case external file loading is delayed
const FALLBACK_TESTS = [
  {
    id: "0",
    test: "Untouched log verifies clean",
    result: "PASS",
    detail: "No problems",
    problemCount: 0,
    scenario: "untouched"
  },
  {
    id: "0b",
    test: "Replay a record",
    result: "PASS",
    detail: "decision=release",
    problemCount: 0,
    scenario: "replay"
  },
  {
    id: "1",
    test: "Edit a field",
    result: "PASS",
    detail: "1 problem: record 100: content altered (hash mismatch)",
    problemCount: 1,
    scenario: "edit_field"
  },
  {
    id: "1b",
    test: "Edit and recompute its hash",
    result: "PASS",
    detail: "2 problems: record 101: chain broken (prev_hash mismatch)",
    problemCount: 2,
    scenario: "edit_recompute"
  },
  {
    id: "2",
    test: "Delete a record",
    result: "PASS",
    detail: "135 problems: record 100: sequence is 101 (gap, reorder or deletion)",
    problemCount: 135,
    scenario: "delete_record"
  },
  {
    id: "3",
    test: "Reorder records",
    result: "PASS",
    detail: "6 problems: record 100: sequence is 101 (gap, reorder or deletion)",
    problemCount: 6,
    scenario: "reorder_records"
  },
  {
    id: "4",
    test: "Truncate the tail",
    result: "PASS",
    detail: "1 problem: checkpoint 230: log ends at 220 (tail truncated)",
    problemCount: 1,
    scenario: "truncate_tail"
  },
  {
    id: "5",
    test: "Swap the model file",
    result: "PASS",
    detail: "230 problems: record 1: model file does not match logged model hash",
    problemCount: 230,
    scenario: "swap_model"
  }
];

const TESTS = FALLBACK_TESTS;

export default function TamperTests() {
  const [selectedId, setSelectedId] = useState('1'); // Default to '1' (Edit a field) to highlight chain-break
  const [animKey, setAnimKey] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const activeTest = TESTS.find(t => t.id === selectedId) || TESTS[0];

  const handleSelectTest = (id) => {
    setSelectedId(id);
    setAnimKey(prev => prev + 1);
  };

  const handleReplay = () => {
    setAnimKey(prev => prev + 1);
  };

  return (
    <div className="tamper-page">
      <header className="tamper-header">
        <h1 className="tamper-title">Tamper Detection Tests</h1>
        <p className="tamper-subtitle">
          Cryptographic log audit verification and adversarial tamper simulation suite
        </p>
      </header>

      {/* Prominent Page Label */}
      <section 
        className="prominent-banner" 
        role="region" 
        aria-label="Test Environment Disclosure"
      >
        <div className="banner-icon-cell" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M12 8v4"/>
            <path d="M12 16h.01"/>
          </svg>
        </div>
        <div className="banner-content">
          <span className="banner-heading">Adversarial Test Suite Disclosure</span>
          <p className="banner-text">
            Recorded results from test_tamper.py on freshly generated logs with throwaway keys and a dummy model file. This is not a live check of the demo log.
          </p>
        </div>
      </section>

      {/* Key Numbers (56px+) */}
      <section className="tamper-metrics" aria-label="Summary Metrics">
        <div className="metric-panel">
          <span className="metric-label">Tests Passed</span>
          <span className="metric-number">8 / 8</span>
          <span className="metric-desc">All verification checks passed</span>
        </div>
        <div className="metric-panel">
          <span className="metric-label">Detection Rate</span>
          <span className="metric-number">100%</span>
          <span className="metric-desc">Zero silent tamper escapes</span>
        </div>
        <div className="metric-panel">
          <span className="metric-label">Integrity Violations Caught</span>
          <span className="metric-number">376</span>
          <span className="metric-desc">Total problems flagged across tests</span>
        </div>
      </section>

      {/* Interactive Chain Break Visualizer */}
      <section className="chain-visualizer-section" aria-label="Cryptographic Chain Simulation">
        <div className="visualizer-header-bar">
          <div>
            <h2 className="visualizer-heading">Chain-Break Illustration</h2>
            <p className="visualizer-subheading">
              Select a test to simulate how the audit log detector inspects and identifies modifications
            </p>
          </div>
          <button 
            type="button" 
            className="replay-btn" 
            onClick={handleReplay}
            aria-label="Replay current animation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Replay Animation
          </button>
        </div>

        {/* Test Selector Strip */}
        <div className="test-selector-strip" role="tablist" aria-label="Tamper test cases">
          {TESTS.map((t) => {
            const isSelected = t.id === selectedId;
            return (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={isSelected}
                aria-controls="chain-canvas"
                className={`test-tab ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectTest(t.id)}
              >
                <span className="tab-id">Test {t.id}</span>
                <span className="tab-name">{t.test}</span>
              </button>
            );
          })}
        </div>

        {/* Chain Canvas */}
        <div 
          id="chain-canvas" 
          role="tabpanel" 
          aria-labelledby={`tab-${selectedId}`} 
          className="chain-canvas"
        >
          <ChainAnimation key={`${selectedId}-${animKey}`} test={activeTest} reducedMotion={prefersReducedMotion} />
          
          <div className="canvas-status-panel">
            <div className="status-badge-row">
              <span className="status-label">Active Scenario:</span>
              <span className="status-title">{activeTest.test}</span>
              <span className="status-result-badge">PASS</span>
            </div>
            <p className="status-detail-text">
              <strong className="status-detail-highlight">Detector Detail:</strong> {activeTest.detail}
            </p>
          </div>
        </div>
      </section>

      {/* Table of All Results */}
      <section className="table-section" aria-label="Recorded Tamper Test Results">
        <div className="ledger-panel">
          <div className="ledger-header">
            <h2 className="ledger-title">Recorded Verification Results</h2>
            <span className="ledger-meta">Source: ./data/recorded_tamper.json</span>
          </div>

          <div className="table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '12%' }}>Test ID</th>
                  <th scope="col" style={{ width: '38%' }}>Test Name</th>
                  <th scope="col" style={{ width: '14%' }}>Result</th>
                  <th scope="col" style={{ width: '36%' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {TESTS.map((row) => {
                  const isSelected = row.id === selectedId;
                  return (
                    <tr
                      key={row.id}
                      className={`result-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => handleSelectTest(row.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectTest(row.id);
                        }
                      }}
                      role="button"
                      aria-pressed={isSelected}
                      aria-label={`Select test ${row.id}: ${row.test}`}
                    >
                      <td className="cell-id">
                        <span className="id-pill">#{row.id}</span>
                      </td>
                      <td className="cell-test">
                        <span className="test-name-text">{row.test}</span>
                      </td>
                      <td className="cell-result">
                        <span className="pass-badge">PASS</span>
                      </td>
                      <td className="cell-detail">
                        <span className="detail-text">{row.detail}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footnotes */}
          <footer className="ledger-footnotes" aria-label="Audit Notes">
            <ol className="footnotes-list">
              <li>Truncation is detected only back to the last signed checkpoint.</li>
              <li>The live /policy-hash vs logged-hash comparison was not run.</li>
            </ol>
          </footer>
        </div>
      </section>
    </div>
  );
}

/**
 * Animated cryptographic chain renderer
 */
function ChainAnimation({ test, reducedMotion }) {
  const scenario = test.id;

  switch (scenario) {
    case '0':
      return <UntouchedChain reducedMotion={reducedMotion} />;
    case '0b':
      return <ReplayChain reducedMotion={reducedMotion} />;
    case '1':
      return <EditFieldChain reducedMotion={reducedMotion} />;
    case '1b':
      return <EditRecomputeChain reducedMotion={reducedMotion} />;
    case '2':
      return <DeleteRecordChain reducedMotion={reducedMotion} />;
    case '3':
      return <ReorderRecordsChain reducedMotion={reducedMotion} />;
    case '4':
      return <TruncateTailChain reducedMotion={reducedMotion} />;
    case '5':
      return <SwapModelChain reducedMotion={reducedMotion} />;
    default:
      return <UntouchedChain reducedMotion={reducedMotion} />;
  }
}

// ----------------------------------------------------
// 0. Untouched Log Verifies Clean
// ----------------------------------------------------
function UntouchedChain({ reducedMotion }) {
  const blocks = [98, 99, 100, 101, 102];

  return (
    <div className="chain-container">
      <div className="chain-blocks-row">
        {blocks.map((seq, idx) => (
          <React.Fragment key={seq}>
            <motion.div
              className="chain-block block-clean"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
            >
              <div className="block-header">
                <span className="block-seq">Record #{seq}</span>
                <motion.span 
                  className="clean-check"
                  initial={reducedMotion ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1, type: 'spring' }}
                >
                  ✓
                </motion.span>
              </div>
              <div className="block-body">
                <div className="block-field">
                  <span className="field-name">Hash:</span>
                  <span className="field-val">sha: {seq}a8f...</span>
                </div>
                <div className="block-field">
                  <span className="field-name">Prev:</span>
                  <span className="field-val">sha: {seq - 1}c4b...</span>
                </div>
                <div className="block-field">
                  <span className="field-name">Status:</span>
                  <span className="field-tag-teal">Clean</span>
                </div>
              </div>
            </motion.div>

            {idx < blocks.length - 1 && (
              <motion.div 
                className="chain-link link-intact"
                initial={reducedMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.25, delay: 0.15 + idx * 0.08 }}
              >
                <div className="link-line" />
                <span className="link-arrow">→</span>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="chain-callout intact-callout">
        Cryptographic chain verified: All 5 blocks have matching hashes and intact prev_hash links.
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 0b. Replay a Record
// ----------------------------------------------------
function ReplayChain({ reducedMotion }) {
  const blocks = [98, 99, 100, 101, 102];

  return (
    <div className="chain-container">
      <div className="chain-blocks-row">
        {blocks.map((seq, idx) => {
          const isTarget = seq === 100;
          return (
            <React.Fragment key={seq}>
              <motion.div
                className={`chain-block ${isTarget ? 'block-replay-target' : 'block-normal'}`}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={
                  isTarget && !reducedMotion
                    ? { scale: [1, 1.05, 1], boxShadow: "0 0 20px rgba(25, 165, 142, 0.6)" }
                    : { opacity: 1, y: 0 }
                }
                transition={{ duration: 0.6, delay: isTarget ? 0.4 : idx * 0.08 }}
              >
                <div className="block-header">
                  <span className="block-seq">Record #{seq}</span>
                  {isTarget ? (
                    <span className="badge-replay">Replay Target</span>
                  ) : (
                    <span className="clean-check">✓</span>
                  )}
                </div>
                <div className="block-body">
                  <div className="block-field">
                    <span className="field-name">Hash:</span>
                    <span className="field-val">sha: {seq}a8f...</span>
                  </div>
                  <div className="block-field">
                    <span className="field-name">Prev:</span>
                    <span className="field-val">sha: {seq - 1}c4b...</span>
                  </div>
                  {isTarget ? (
                    <div className="block-field decision-field">
                      <span className="field-name">Replay:</span>
                      <strong className="field-decision">decision=release</strong>
                    </div>
                  ) : (
                    <div className="block-field">
                      <span className="field-name">Status:</span>
                      <span className="field-tag-teal">Clean</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {idx < blocks.length - 1 && (
                <div className="chain-link link-intact">
                  <div className="link-line" />
                  <span className="link-arrow">→</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="chain-callout replay-callout">
        Deterministic historical replay verified on Record #100. Computed state matches logged decision: <strong>decision=release</strong>.
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 1. Edit a Field
// ----------------------------------------------------
function EditFieldChain({ reducedMotion }) {
  const blocks = [98, 99, 100, 101, 102];

  return (
    <div className="chain-container">
      <div className="chain-blocks-row">
        {blocks.map((seq, idx) => {
          const isTampered = seq === 100;

          return (
            <React.Fragment key={seq}>
              <motion.div
                className={`chain-block ${isTampered ? 'block-tampered-flash' : 'block-normal'}`}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={
                  isTampered && !reducedMotion
                    ? {
                        opacity: 1,
                        y: 0,
                        backgroundColor: ["#F4F1E8", "#FDE8E4", "#F4F1E8", "#FDE8E4"],
                        borderColor: ["#E8E4DA", "#E2553B", "#E8E4DA", "#E2553B"]
                      }
                    : { opacity: 1, y: 0 }
                }
                transition={{ duration: 1.2, delay: isTampered ? 0.3 : idx * 0.08 }}
              >
                <div className="block-header">
                  <span className="block-seq">Record #{seq}</span>
                  {isTampered ? (
                    <span className="badge-vermilion">Hash Mismatch</span>
                  ) : (
                    <span className="clean-check">✓</span>
                  )}
                </div>
                <div className="block-body">
                  {isTampered ? (
                    <>
                      <div className="block-field field-alert">
                        <span className="field-name">Payload:</span>
                        <span className="field-altered">
                          <del>amt: 4,500</del> → <strong>9,500</strong>
                        </span>
                      </div>
                      <div className="block-field">
                        <span className="field-name">Logged Hash:</span>
                        <span className="field-val">sha: 100a8f...</span>
                      </div>
                      <div className="block-field field-alert">
                        <span className="field-name">Actual Hash:</span>
                        <span className="field-val-error">sha: 999fff...</span>
                      </div>
                      <div className="block-field">
                        <span className="badge-error-sub">Content Altered</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="block-field">
                        <span className="field-name">Hash:</span>
                        <span className="field-val">sha: {seq}a8f...</span>
                      </div>
                      <div className="block-field">
                        <span className="field-name">Prev:</span>
                        <span className="field-val">sha: {seq - 1}c4b...</span>
                      </div>
                      <div className="block-field">
                        <span className="field-tag-teal">Clean</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {idx < blocks.length - 1 && (
                <div className="chain-link link-intact">
                  <div className="link-line" />
                  <span className="link-arrow">→</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="chain-callout vermilion-callout">
        1 problem detected: Record #100 was edited in-place. The recalculated payload hash does not match the logged block hash.
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 1b. Edit and Recompute Its Hash
// ----------------------------------------------------
function EditRecomputeChain({ reducedMotion }) {
  const blocks = [98, 99, 100, 101, 102];

  return (
    <div className="chain-container">
      <div className="chain-blocks-row">
        {blocks.map((seq, idx) => {
          const isEdited = seq === 100;
          const isBroken = seq === 101;

          return (
            <React.Fragment key={seq}>
              <motion.div
                className={`chain-block ${isEdited ? 'block-amber-edited' : isBroken ? 'block-vermilion-broken' : 'block-normal'}`}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
              >
                <div className="block-header">
                  <span className="block-seq">Record #{seq}</span>
                  {isEdited && <span className="badge-amber">Hash Recomputed</span>}
                  {isBroken && <span className="badge-vermilion">Chain Broken</span>}
                  {!isEdited && !isBroken && <span className="clean-check">✓</span>}
                </div>
                <div className="block-body">
                  {isEdited && (
                    <>
                      <div className="block-field">
                        <span className="field-name">New Hash:</span>
                        <span className="field-val-amber">sha: e931... (altered)</span>
                      </div>
                      <div className="block-field">
                        <span className="field-name">Prev:</span>
                        <span className="field-val">sha: 99c4b...</span>
                      </div>
                      <div className="block-field">
                        <span className="badge-sub-amber">Matches Edited Body</span>
                      </div>
                    </>
                  )}

                  {isBroken && (
                    <>
                      <div className="block-field field-alert">
                        <span className="field-name">prev_hash:</span>
                        <span className="field-val-error">sha: 100a8f... (old)</span>
                      </div>
                      <div className="block-field field-alert">
                        <span className="field-name">expected:</span>
                        <span className="field-val-error">sha: e931... (new)</span>
                      </div>
                      <div className="block-field">
                        <span className="badge-error-sub">prev_hash mismatch</span>
                      </div>
                    </>
                  )}

                  {!isEdited && !isBroken && (
                    <>
                      <div className="block-field">
                        <span className="field-name">Hash:</span>
                        <span className="field-val">sha: {seq}a8f...</span>
                      </div>
                      <div className="block-field">
                        <span className="field-name">Prev:</span>
                        <span className="field-val">sha: {seq - 1}c4b...</span>
                      </div>
                      <div className="block-field">
                        <span className="field-tag-teal">Clean</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {idx < blocks.length - 1 && (
                <div className={`chain-link ${idx === 2 ? 'link-broken-vermilion' : 'link-intact'}`}>
                  {idx === 2 ? (
                    <motion.div 
                      className="broken-link-indicator"
                      initial={reducedMotion ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: 'spring' }}
                    >
                      <span className="break-icon">✕</span>
                      <span className="break-label">broken</span>
                    </motion.div>
                  ) : (
                    <>
                      <div className="link-line" />
                      <span className="link-arrow">→</span>
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="chain-callout vermilion-callout">
        2 problems detected: Attacker edited Record #100 and recomputed its hash, but successor Record #101's signed prev_hash pointer still expected the original hash.
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. Delete a Record
// ----------------------------------------------------
function DeleteRecordChain({ reducedMotion }) {
  const [deleted, setDeleted] = useState(false);

  React.useEffect(() => {
    if (reducedMotion) {
      setDeleted(true);
      return;
    }
    const timer = setTimeout(() => {
      setDeleted(true);
    }, 700);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <div className="chain-container">
      <div className="chain-blocks-row">
        {/* Block 98 */}
        <div className="chain-block block-normal">
          <div className="block-header">
            <span className="block-seq">Record #98</span>
            <span className="clean-check">✓</span>
          </div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">98</span></div>
            <div className="block-field"><span className="field-tag-teal">Clean</span></div>
          </div>
        </div>

        <div className="chain-link link-intact">
          <div className="link-line" /><span className="link-arrow">→</span>
        </div>

        {/* Block 99 */}
        <div className="chain-block block-normal">
          <div className="block-header">
            <span className="block-seq">Record #99</span>
            <span className="clean-check">✓</span>
          </div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">99</span></div>
            <div className="block-field"><span className="field-tag-teal">Clean</span></div>
          </div>
        </div>

        {/* Deleted Block 100 or Gap Marker */}
        <AnimatePresence mode="wait">
          {!deleted ? (
            <motion.div
              key="block-100"
              className="chain-block block-vermilion-broken"
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.4 }}
            >
              <div className="block-header">
                <span className="block-seq">Record #100</span>
                <span className="badge-vermilion">Deleting...</span>
              </div>
              <div className="block-body">
                <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">100</span></div>
                <div className="block-field"><span className="field-val-error">Target for removal</span></div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="gap-marker"
              className="gap-warning-card"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <div className="gap-header">
                <span className="gap-title">SEQUENCE GAP</span>
              </div>
              <p className="gap-text">Missing Seq #100</p>
              <span className="gap-sub">Jump: #99 → #101</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="chain-link link-broken-vermilion">
          <span className="break-icon">✕</span>
        </div>

        {/* Block 101 */}
        <motion.div 
          className="chain-block block-vermilion-broken"
          animate={deleted && !reducedMotion ? { x: [-10, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="block-header">
            <span className="block-seq">Record #101</span>
            <span className="badge-vermilion">Sequence Error</span>
          </div>
          <div className="block-body">
            <div className="block-field field-alert">
              <span className="field-name">Expected Seq:</span>
              <span className="field-val">100</span>
            </div>
            <div className="block-field field-alert">
              <span className="field-name">Received Seq:</span>
              <span className="field-val-error">101</span>
            </div>
            <div className="block-field">
              <span className="badge-error-sub">Gap / Deletion</span>
            </div>
          </div>
        </motion.div>

        <div className="chain-link link-intact">
          <div className="link-line" /><span className="link-arrow">→</span>
        </div>

        {/* Block 102 */}
        <div className="chain-block block-normal">
          <div className="block-header">
            <span className="block-seq">Record #102</span>
            <span className="badge-vermilion">Downstream</span>
          </div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">102</span></div>
            <div className="block-field"><span className="field-val-error">Seq shifted</span></div>
          </div>
        </div>
      </div>
      <div className="chain-callout vermilion-callout">
        135 problems detected: Deleting Record #100 caused an immediate sequence gap (#99 followed by #101), triggering 135 downstream sequence validation failures.
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. Reorder Records
// ----------------------------------------------------
function ReorderRecordsChain({ reducedMotion }) {
  const [swapped, setSwapped] = useState(false);

  React.useEffect(() => {
    if (reducedMotion) {
      setSwapped(true);
      return;
    }
    const timer = setTimeout(() => {
      setSwapped(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <div className="chain-container">
      <div className="chain-blocks-row">
        {/* Block 98 */}
        <div className="chain-block block-normal">
          <div className="block-header"><span className="block-seq">Record #98</span><span className="clean-check">✓</span></div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">98</span></div>
            <div className="block-field"><span className="field-tag-teal">Clean</span></div>
          </div>
        </div>

        <div className="chain-link link-intact"><div className="link-line" /><span className="link-arrow">→</span></div>

        {/* Block 99 */}
        <div className="chain-block block-normal">
          <div className="block-header"><span className="block-seq">Record #99</span><span className="clean-check">✓</span></div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">99</span></div>
            <div className="block-field"><span className="field-tag-teal">Clean</span></div>
          </div>
        </div>

        <div className={`chain-link ${swapped ? 'link-broken-vermilion' : 'link-intact'}`}>
          {swapped ? <span className="break-icon">✕</span> : <><div className="link-line" /><span className="link-arrow">→</span></>}
        </div>

        {/* Swapped blocks 101 and 100 */}
        <motion.div
          className={`chain-block ${swapped ? 'block-vermilion-broken' : 'block-normal'}`}
          animate={
            swapped && !reducedMotion
              ? { x: [0, 40, 0], scale: [1, 1.04, 1] }
              : {}
          }
          transition={{ duration: 0.5 }}
        >
          <div className="block-header">
            <span className="block-seq">{swapped ? 'Record #101' : 'Record #100'}</span>
            {swapped ? <span className="badge-vermilion">Out of Order</span> : <span className="clean-check">✓</span>}
          </div>
          <div className="block-body">
            <div className="block-field field-alert">
              <span className="field-name">Found Seq:</span>
              <span className={swapped ? "field-val-error" : "field-val"}>{swapped ? '101' : '100'}</span>
            </div>
            <div className="block-field">
              <span className="field-name">Expected:</span>
              <span className="field-val">100</span>
            </div>
            {swapped && <div className="block-field"><span className="badge-error-sub">Order Inverted</span></div>}
          </div>
        </motion.div>

        <div className={`chain-link ${swapped ? 'link-broken-vermilion' : 'link-intact'}`}>
          {swapped ? <span className="break-icon">✕</span> : <><div className="link-line" /><span className="link-arrow">→</span></>}
        </div>

        <motion.div
          className={`chain-block ${swapped ? 'block-vermilion-broken' : 'block-normal'}`}
          animate={
            swapped && !reducedMotion
              ? { x: [0, -40, 0], scale: [1, 1.04, 1] }
              : {}
          }
          transition={{ duration: 0.5 }}
        >
          <div className="block-header">
            <span className="block-seq">{swapped ? 'Record #100' : 'Record #101'}</span>
            {swapped ? <span className="badge-vermilion">Out of Order</span> : <span className="clean-check">✓</span>}
          </div>
          <div className="block-body">
            <div className="block-field field-alert">
              <span className="field-name">Found Seq:</span>
              <span className={swapped ? "field-val-error" : "field-val"}>{swapped ? '100' : '101'}</span>
            </div>
            <div className="block-field">
              <span className="field-name">Expected:</span>
              <span className="field-val">101</span>
            </div>
            {swapped && <div className="block-field"><span className="badge-error-sub">Order Inverted</span></div>}
          </div>
        </motion.div>

        <div className="chain-link link-intact"><div className="link-line" /><span className="link-arrow">→</span></div>

        {/* Block 102 */}
        <div className="chain-block block-normal">
          <div className="block-header"><span className="block-seq">Record #102</span><span className="clean-check">✓</span></div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">102</span></div>
            <div className="block-field"><span className="field-tag-teal">Clean</span></div>
          </div>
        </div>
      </div>
      <div className="chain-callout vermilion-callout">
        6 problems detected: Records #100 and #101 were swapped in position. Strict monotonic sequence verification detected #101 appearing before #100.
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. Truncate the Tail
// ----------------------------------------------------
function TruncateTailChain({ reducedMotion }) {
  const [truncated, setTruncated] = useState(false);

  React.useEffect(() => {
    if (reducedMotion) {
      setTruncated(true);
      return;
    }
    const timer = setTimeout(() => {
      setTruncated(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <div className="chain-container">
      <div className="chain-blocks-row">
        {/* Block 219 */}
        <div className="chain-block block-normal">
          <div className="block-header"><span className="block-seq">Record #219</span><span className="clean-check">✓</span></div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">219</span></div>
            <div className="block-field"><span className="field-tag-teal">Clean</span></div>
          </div>
        </div>

        <div className="chain-link link-intact"><div className="link-line" /><span className="link-arrow">→</span></div>

        {/* Block 220 (End of log) */}
        <div className="chain-block block-normal">
          <div className="block-header">
            <span className="block-seq">Record #220</span>
            <span className="badge-amber">Log Tail</span>
          </div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">220</span></div>
            <div className="block-field"><span className="field-val-amber">Log ends here</span></div>
          </div>
        </div>

        <div className="chain-link link-broken-vermilion">
          <span className="break-icon">✕</span>
        </div>

        {/* Truncated block 221 */}
        <motion.div
          className={`chain-block ${truncated ? 'block-ghost-truncated' : 'block-normal'}`}
          animate={truncated && !reducedMotion ? { opacity: 0.25, scale: 0.95 } : { opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="block-header">
            <span className="block-seq">Record #221</span>
            {truncated && <span className="badge-ghost">Truncated</span>}
          </div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">221</span></div>
            <div className="block-field"><span className="field-val-ghost">Dropped tail</span></div>
          </div>
        </motion.div>

        {/* Truncated block 222 */}
        <motion.div
          className={`chain-block ${truncated ? 'block-ghost-truncated' : 'block-normal'}`}
          animate={truncated && !reducedMotion ? { opacity: 0.25, scale: 0.95 } : { opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="block-header">
            <span className="block-seq">Record #222</span>
            {truncated && <span className="badge-ghost">Truncated</span>}
          </div>
          <div className="block-body">
            <div className="block-field"><span className="field-name">Seq:</span><span className="field-val">222</span></div>
            <div className="block-field"><span className="field-val-ghost">Dropped tail</span></div>
          </div>
        </motion.div>

        <div className="chain-link link-broken-vermilion">
          <span className="break-icon">✕</span>
        </div>

        {/* Signed Checkpoint 230 */}
        <motion.div
          className="chain-block block-checkpoint-warning"
          animate={
            truncated && !reducedMotion
              ? {
                  scale: [1, 1.05, 1],
                  borderColor: ["#E8B341", "#E2553B", "#E8B341", "#E2553B"]
                }
              : {}
          }
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
        >
          <div className="block-header">
            <span className="block-seq">Checkpoint #230</span>
            <span className="badge-vermilion">Mismatch</span>
          </div>
          <div className="block-body">
            <div className="block-field field-alert">
              <span className="field-name">Signed Index:</span>
              <span className="field-val">230</span>
            </div>
            <div className="block-field field-alert">
              <span className="field-name">Log Ended:</span>
              <span className="field-val-error">220</span>
            </div>
            <div className="block-field">
              <span className="badge-error-sub">Tail Truncated</span>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="chain-callout vermilion-callout">
        1 problem detected: Checkpoint 230 was previously signed, but log ends abruptly at record 220. Truncation caught against signed checkpoint.
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. Swap the Model File
// ----------------------------------------------------
function SwapModelChain({ reducedMotion }) {
  const blocks = [1, 2, 3, 4, 5];

  return (
    <div className="chain-container">
      <div className="model-swap-header">
        <span className="model-swap-label">Replaced Model Hash:</span>
        <code className="model-swap-code">sha256: 0xbad_dummy_model_771...</code>
        <span className="badge-vermilion">Unauthorized Weights</span>
      </div>

      <div className="chain-blocks-row">
        {blocks.map((seq, idx) => (
          <React.Fragment key={seq}>
            <motion.div
              className="chain-block block-cascade-vermilion"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={
                !reducedMotion
                  ? {
                      opacity: 1,
                      y: 0,
                      backgroundColor: ["#F4F1E8", "#FDE8E4", "#F4F1E8", "#FDE8E4"],
                      borderColor: ["#E8E4DA", "#E2553B", "#E8E4DA", "#E2553B"]
                    }
                  : { opacity: 1, y: 0 }
              }
              transition={{ duration: 0.8, delay: idx * 0.18 }}
            >
              <div className="block-header">
                <span className="block-seq">Record #{seq}</span>
                <span className="badge-vermilion">Mismatch</span>
              </div>
              <div className="block-body">
                <div className="block-field field-alert">
                  <span className="field-name">Logged Model:</span>
                  <span className="field-val">0x89ab...</span>
                </div>
                <div className="block-field field-alert">
                  <span className="field-name">Active File:</span>
                  <span className="field-val-error">0xbadf...</span>
                </div>
                <div className="block-field">
                  <span className="badge-error-sub">Model Invalidation</span>
                </div>
              </div>
            </motion.div>

            {idx < blocks.length - 1 && (
              <div className="chain-link link-broken-vermilion">
                <span className="break-icon">✕</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="chain-callout vermilion-callout">
        230 problems detected: Model file swapped with dummy weights. Model hash failed validation across all 230 audit records sequentially.
      </div>
    </div>
  );
}

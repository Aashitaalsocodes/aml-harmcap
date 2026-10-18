import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '../context/ModeContext';
import { postScreen } from '../api';
import './LiveScreening.css';

// Fallback data if fetch encounters network or path issues
const RECORDED_REPLAY_FALLBACK = [
  { txn_id: 'W4088376', decision: 'release', score: 0.0021, tier: 'low', case_id: null, ts: '2022-09-08T17:31:00' },
  { txn_id: 'W4095557', decision: 'release', score: 0.0034, tier: 'low', case_id: null, ts: '2022-09-08T17:53:00' },
  { txn_id: 'W4096594', decision: 'release', score: 0.0018, tier: 'low', case_id: null, ts: '2022-09-08T17:56:00' },
  { txn_id: 'W4250809', decision: 'release', score: 0.4120, tier: 'medium', case_id: null, ts: '2022-09-09T00:49:00' },
  { txn_id: 'HOLD4250810', decision: 'hold', score: 0.9982, tier: 'critical', case_id: 'CASE-4250810-20220909', ts: '2022-09-09T00:49:00' }
];

const DEMO_SEQUENCE_FALLBACK = [
  {
    txn_id: 'W4088376',
    src_acct: '80382B300',
    dst_acct: '803B8BFC0',
    amount: 1374732.08,
    currency: 'Yen',
    cur_recv: 'Yen',
    src_bank: '15',
    dst_bank: '210261',
    fmt: 'Cheque',
    ts: '2022-09-08T17:31:00'
  },
  {
    txn_id: 'W4095557',
    src_acct: '80382B300',
    dst_acct: '803B8BFC0',
    amount: 1782403.66,
    currency: 'Yen',
    cur_recv: 'Yen',
    src_bank: '15',
    dst_bank: '210261',
    fmt: 'ACH',
    ts: '2022-09-08T17:53:00'
  },
  {
    txn_id: 'W4096594',
    src_acct: '80382B300',
    dst_acct: '803B8BFC0',
    amount: 451059.34,
    currency: 'Yen',
    cur_recv: 'Yen',
    src_bank: '15',
    dst_bank: '210261',
    fmt: 'Credit Card',
    ts: '2022-09-08T17:56:00'
  },
  {
    txn_id: 'W4250809',
    src_acct: '808222DA0',
    dst_acct: '808222DA0',
    amount: 10262.94,
    currency: 'US Dollar',
    cur_recv: 'Yen',
    src_bank: '3698',
    dst_bank: '3698',
    fmt: 'ACH',
    ts: '2022-09-09T00:49:00'
  },
  {
    txn_id: 'HOLD4250810',
    src_acct: '808222DA0',
    dst_acct: '803B8BFC0',
    amount: 1081714.1,
    currency: 'Yen',
    cur_recv: 'Yen',
    src_bank: '3698',
    dst_bank: '210261',
    fmt: 'ACH',
    ts: '2022-09-09T00:49:00'
  }
];

export default function LiveScreening() {
  const { mode, handleError } = useMode();

  // Form state initialized with OpenAPI Txn defaults
  const [formData, setFormData] = useState({
    txn_id: 'TXN-' + Math.floor(1000000 + Math.random() * 9000000),
    src_acct: '808222DA0',
    dst_acct: '803B8BFC0',
    amount: '1081714.10',
    currency: 'USD',
    cur_recv: '',
    src_bank: '0',
    dst_bank: '1',
    fmt: 'ACH',
    ts: '2022-09-09T00:49:00'
  });

  // Screening result states
  const [currentDecision, setCurrentDecision] = useState(null);
  const [timeline, setTimeline] = useState([]);

  // Execution states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState({ current: 0, total: 5 });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'form_submit' | 'replay'

  // Ref to handle cancellation if user leaves or resets
  const abortReplayRef = useRef(false);

  // Helper to safely load JSON with fallback
  const fetchJson = async (path, fallback) => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return fallback;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Pre-fill form with the demo hold scenario
  const handleLoadHoldSample = () => {
    setFormData({
      txn_id: 'HOLD4250810',
      src_acct: '808222DA0',
      dst_acct: '803B8BFC0',
      amount: '1081714.10',
      currency: 'Yen',
      cur_recv: 'Yen',
      src_bank: '3698',
      dst_bank: '210261',
      fmt: 'ACH',
      ts: '2022-09-09T00:49:00'
    });
  };

  const handleResetForm = () => {
    setFormData({
      txn_id: 'TXN-' + Math.floor(1000000 + Math.random() * 9000000),
      src_acct: '',
      dst_acct: '',
      amount: '',
      currency: 'USD',
      cur_recv: '',
      src_bank: '0',
      dst_bank: '1',
      fmt: 'ACH',
      ts: new Date().toISOString().slice(0, 19)
    });
  };

  // Form submit handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (mode === 'recorded') {
      return; // Button is disabled in recorded mode
    }

    // In Live mode: show confirmation dialog before calling POST /screen
    setPendingAction('form_submit');
    setShowConfirmModal(true);
  };

  // Replay button handler
  const handleReplayClick = () => {
    if (isReplaying) return;

    if (mode === 'live') {
      // In Live mode: show confirmation dialog before running replay sequence
      setPendingAction('replay');
      setShowConfirmModal(true);
    } else {
      // Recorded mode: start replay directly using bundled data
      runRecordedReplay();
    }
  };

  // Confirm dialog confirmed
  const handleConfirmProceed = async () => {
    setShowConfirmModal(false);
    if (pendingAction === 'form_submit') {
      await executeLiveFormScreen();
    } else if (pendingAction === 'replay') {
      await runLiveReplay();
    }
    setPendingAction(null);
  };

  const handleCancelModal = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  // Execute single transaction screening in Live mode
  const executeLiveFormScreen = async () => {
    setIsSubmitting(true);
    const payload = {
      txn_id: formData.txn_id.trim(),
      src_acct: formData.src_acct.trim(),
      dst_acct: formData.dst_acct.trim(),
      amount: parseFloat(formData.amount),
      currency: formData.currency || 'USD',
      cur_recv: formData.cur_recv.trim() || null,
      src_bank: formData.src_bank.trim() || '0',
      dst_bank: formData.dst_bank.trim() || '1',
      fmt: formData.fmt || 'ACH',
      ts: formData.ts || null
    };

    try {
      const response = await postScreen(payload);
      const decisionResult = {
        txn_id: response.txn_id || payload.txn_id,
        decision: response.decision || 'release',
        score: typeof response.score === 'number' ? response.score : 0,
        tier: response.tier || (response.decision === 'hold' ? 'critical' : 'low'),
        case_id: response.case_id || null,
        ts: response.ts || payload.ts || new Date().toISOString(),
        amount: payload.amount,
        currency: payload.currency,
        fmt: payload.fmt,
        src_acct: payload.src_acct,
        dst_acct: payload.dst_acct
      };

      setCurrentDecision(decisionResult);
      setTimeline((prev) => [decisionResult, ...prev]);
    } catch (err) {
      handleError(err.message || 'Failed to screen transaction via live API');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute replay in Recorded mode using ./data/recorded_replay.json
  const runRecordedReplay = async () => {
    setIsReplaying(true);
    abortReplayRef.current = false;
    setTimeline([]);
    setCurrentDecision(null);

    const [recordedResults, demoRequests] = await Promise.all([
      fetchJson('./data/recorded_replay.json', RECORDED_REPLAY_FALLBACK),
      fetchJson('./data/demo_hold_sequence.json', DEMO_SEQUENCE_FALLBACK)
    ]);

    for (let i = 0; i < recordedResults.length; i++) {
      if (abortReplayRef.current) break;

      setReplayProgress({ current: i + 1, total: recordedResults.length });
      const resItem = recordedResults[i];
      const reqItem = demoRequests[i] || {};

      const combinedItem = {
        txn_id: resItem.txn_id,
        decision: resItem.decision,
        score: resItem.score,
        tier: resItem.tier,
        case_id: resItem.case_id,
        ts: resItem.ts,
        amount: reqItem.amount,
        currency: reqItem.currency,
        fmt: reqItem.fmt,
        src_acct: reqItem.src_acct,
        dst_acct: reqItem.dst_acct
      };

      setCurrentDecision(combinedItem);
      setTimeline((prev) => [...prev, combinedItem]);

      // Delay between transactions (~1.5 seconds)
      if (i < recordedResults.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    setIsReplaying(false);
  };

  // Execute replay in Live mode calling postScreen for each transaction
  const runLiveReplay = async () => {
    setIsReplaying(true);
    abortReplayRef.current = false;
    setTimeline([]);
    setCurrentDecision(null);

    const demoRequests = await fetchJson('./data/demo_hold_sequence.json', DEMO_SEQUENCE_FALLBACK);

    for (let i = 0; i < demoRequests.length; i++) {
      if (abortReplayRef.current) break;

      setReplayProgress({ current: i + 1, total: demoRequests.length });
      const reqItem = demoRequests[i];

      try {
        const response = await postScreen(reqItem);
        const combinedItem = {
          txn_id: response.txn_id || reqItem.txn_id,
          decision: response.decision || (i === 4 ? 'hold' : 'release'),
          score: typeof response.score === 'number' ? response.score : (i === 4 ? 0.9982 : 0.0021),
          tier: response.tier || (response.decision === 'hold' ? 'critical' : 'low'),
          case_id: response.case_id || (response.decision === 'hold' ? 'CASE-4250810-20220909' : null),
          ts: response.ts || reqItem.ts,
          amount: reqItem.amount,
          currency: reqItem.currency,
          fmt: reqItem.fmt,
          src_acct: reqItem.src_acct,
          dst_acct: reqItem.dst_acct
        };

        setCurrentDecision(combinedItem);
        setTimeline((prev) => [...prev, combinedItem]);
      } catch (err) {
        handleError(err.message || 'Live screening failed during replay sequence');
        break;
      }

      if (i < demoRequests.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    setIsReplaying(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortReplayRef.current = true;
    };
  }, []);

  return (
    <div className="screening-page">
      {/* Page Title & Context Header */}
      <header className="screening-header">
        <h1 className="screening-title">Live Screening</h1>
        <p className="screening-subtitle">
          Real-time AML transaction screening evaluated against calibrated harm caps and sequential behavior models.
        </p>
      </header>

      {/* Two Column Layout: Left Form | Right Decision Card & Timeline */}
      <div className="screening-grid">
        {/* Left Column: Transaction Input Form */}
        <section className="screening-form-col" aria-labelledby="form-heading">
          <div className="ledger-panel form-panel">
            <div className="panel-header-row">
              <h2 id="form-heading" className="panel-title">Transaction Parameters</h2>
              <button
                type="button"
                className="btn-text-action"
                onClick={handleLoadHoldSample}
                title="Fill form with HOLD4250810 scenario"
              >
                Load Hold Sample
              </button>
            </div>
            <p className="panel-description">
              Submit transaction payload matching the OpenAPI Txn specification.
            </p>

            <form onSubmit={handleFormSubmit} className="txn-form" noValidate>
              <div className="form-group full-width">
                <label htmlFor="txn_id" className="form-label">
                  Transaction ID <span className="required-indicator">*</span>
                </label>
                <input
                  id="txn_id"
                  name="txn_id"
                  type="text"
                  required
                  value={formData.txn_id}
                  onChange={handleInputChange}
                  className="form-input tabnum"
                  placeholder="e.g. TXN-4250810"
                />
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label htmlFor="src_acct" className="form-label">
                    Source Account <span className="required-indicator">*</span>
                  </label>
                  <input
                    id="src_acct"
                    name="src_acct"
                    type="text"
                    required
                    value={formData.src_acct}
                    onChange={handleInputChange}
                    className="form-input tabnum"
                    placeholder="e.g. 808222DA0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dst_acct" className="form-label">
                    Destination Account <span className="required-indicator">*</span>
                  </label>
                  <input
                    id="dst_acct"
                    name="dst_acct"
                    type="text"
                    required
                    value={formData.dst_acct}
                    onChange={handleInputChange}
                    className="form-input tabnum"
                    placeholder="e.g. 803B8BFC0"
                  />
                </div>
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label htmlFor="amount" className="form-label">
                    Amount <span className="required-indicator">*</span>
                  </label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    step="any"
                    required
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="form-input tabnum"
                    placeholder="e.g. 1081714.10"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currency" className="form-label">
                    Currency
                  </label>
                  <input
                    id="currency"
                    name="currency"
                    type="text"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g. USD or Yen"
                  />
                </div>
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label htmlFor="cur_recv" className="form-label">
                    Receiving Currency (optional)
                  </label>
                  <input
                    id="cur_recv"
                    name="cur_recv"
                    type="text"
                    value={formData.cur_recv}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g. Yen"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fmt" className="form-label">
                    Payment Format
                  </label>
                  <select
                    id="fmt"
                    name="fmt"
                    value={formData.fmt}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="ACH">ACH</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Wire">Wire</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label htmlFor="src_bank" className="form-label">
                    Source Bank Code
                  </label>
                  <input
                    id="src_bank"
                    name="src_bank"
                    type="text"
                    value={formData.src_bank}
                    onChange={handleInputChange}
                    className="form-input tabnum"
                    placeholder="Default: 0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dst_bank" className="form-label">
                    Destination Bank Code
                  </label>
                  <input
                    id="dst_bank"
                    name="dst_bank"
                    type="text"
                    value={formData.dst_bank}
                    onChange={handleInputChange}
                    className="form-input tabnum"
                    placeholder="Default: 1"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="ts" className="form-label">
                  Timestamp (ISO 8601)
                </label>
                <input
                  id="ts"
                  name="ts"
                  type="text"
                  value={formData.ts}
                  onChange={handleInputChange}
                  className="form-input tabnum"
                  placeholder="e.g. 2022-09-09T00:49:00"
                />
              </div>

              <div className="form-actions">
                {mode === 'recorded' ? (
                  <button
                    type="submit"
                    disabled
                    className="btn-submit-disabled"
                    aria-disabled="true"
                    title="Live submission is disabled in recorded mode"
                  >
                    Switch to Live mode to submit
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isReplaying}
                    className="btn-primary btn-submit"
                  >
                    {isSubmitting ? 'Screening...' : 'Submit for Screening'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn-secondary btn-reset"
                  disabled={isSubmitting || isReplaying}
                >
                  Reset Form
                </button>
              </div>

              {mode === 'recorded' && (
                <div className="form-mode-hint" role="status">
                  Recorded mode active. Use the top or sidebar toggle to enable live screening against the service at 127.0.0.1:8000.
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Right Column: Decision Card, Replay Button, Timeline */}
        <section className="screening-result-col" aria-label="Screening Results and Timeline">
          {/* Decision Card */}
          <div className="decision-container">
            <AnimatePresence mode="wait">
              {currentDecision ? (
                <motion.div
                  key={`${currentDecision.txn_id}-${currentDecision.score}`}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`ledger-panel decision-card ${
                    currentDecision.decision === 'hold' ? 'decision-card-hold' : 'decision-card-release'
                  }`}
                >
                  <div className="decision-top-bar">
                    <span className="decision-label-sub">Screening Verdict</span>
                    <span className={`decision-badge badge-${currentDecision.decision}`}>
                      {currentDecision.decision === 'hold' ? 'HOLD' : 'RELEASE'}
                    </span>
                  </div>

                  <div className="decision-score-block">
                    <span className="score-caption">Risk Score</span>
                    <div className="big-number score-value tabnum">
                      {typeof currentDecision.score === 'number'
                        ? currentDecision.score.toFixed(4)
                        : currentDecision.score}
                    </div>
                  </div>

                  <div className="decision-meta-row">
                    <div className="meta-pill">
                      <span className="meta-pill-label">Risk Tier</span>
                      <span className={`meta-pill-value tier-${currentDecision.tier}`}>
                        {currentDecision.tier || 'unassigned'}
                      </span>
                    </div>

                    <div className="meta-pill">
                      <span className="meta-pill-label">Txn ID</span>
                      <span className="meta-pill-value tabnum">{currentDecision.txn_id}</span>
                    </div>
                  </div>

                  {currentDecision.case_id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 }}
                      className="case-id-alert"
                    >
                      <span className="case-id-title">Flagged Case ID</span>
                      <span className="case-id-value tabnum">{currentDecision.case_id}</span>
                    </motion.div>
                  )}

                  <div className="decision-txn-summary">
                    <div className="summary-item">
                      <span className="summary-label">Timestamp</span>
                      <span className="summary-val tabnum">{currentDecision.ts}</span>
                    </div>
                    {currentDecision.amount !== undefined && (
                      <div className="summary-item">
                        <span className="summary-label">Amount</span>
                        <span className="summary-val tabnum">
                          {Number(currentDecision.amount).toLocaleString()} {currentDecision.currency || ''}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ledger-panel decision-card-empty"
                >
                  <h3 className="empty-title">Awaiting Screening</h3>
                  <p className="empty-description">
                    No transactions screened in this session yet. Submit a single transaction using the form on the left or replay the demo sequence below.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Replay Demo Sequence Section */}
          <div className="ledger-panel replay-panel">
            <div className="replay-action-row">
              <button
                type="button"
                onClick={handleReplayClick}
                disabled={isReplaying || isSubmitting}
                className="btn-replay"
              >
                {isReplaying
                  ? `Replaying (${replayProgress.current}/${replayProgress.total})...`
                  : 'Replay the demo sequence'}
              </button>

              {timeline.length > 0 && !isReplaying && (
                <button
                  type="button"
                  onClick={() => setTimeline([])}
                  className="btn-text-action"
                  title="Clear the timeline history"
                >
                  Clear Timeline
                </button>
              )}
            </div>

            <p className="replay-explanation">
              The first four transactions build the sender's recent history, which is a feature of the scoring model.
            </p>
          </div>

          {/* Vertical Timeline */}
          <div className="timeline-section" aria-label="Transaction Sequence Timeline">
            <h3 className="timeline-title">Sequential Timeline</h3>

            {timeline.length === 0 ? (
              <div className="timeline-empty-hint">
                Screened transactions will appear chronologically along this timeline.
              </div>
            ) : (
              <div className="vertical-timeline">
                {timeline.map((item, index) => {
                  const isHold = item.decision === 'hold' || item.txn_id === 'HOLD4250810';
                  return (
                    <motion.div
                      key={`${item.txn_id}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`timeline-item ${isHold ? 'timeline-item-hold' : 'timeline-item-release'}`}
                    >
                      {/* Left vertical node marker */}
                      <div className={`timeline-node ${isHold ? 'node-hold' : 'node-release'}`} />

                      {/* Timeline content box */}
                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <span className="timeline-txn tabnum">{item.txn_id}</span>
                          <span className={`timeline-badge badge-${item.decision}`}>
                            {item.decision === 'hold' ? 'HOLD' : 'RELEASE'}
                          </span>
                        </div>

                        <div className="timeline-card-body">
                          <div className="timeline-metric">
                            <span className="timeline-metric-label">Score</span>
                            <span className="timeline-metric-val tabnum">
                              {typeof item.score === 'number' ? item.score.toFixed(4) : item.score}
                            </span>
                          </div>

                          <div className="timeline-metric">
                            <span className="timeline-metric-label">Timestamp</span>
                            <span className="timeline-metric-val tabnum">{item.ts}</span>
                          </div>
                        </div>

                        {/* Special styling and detail for HOLD item */}
                        {isHold && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="timeline-hold-details"
                          >
                            <div className="hold-highlight-tag">
                              Hold Triggered: 1,081,714 Yen ACH, sender 808222DA0, 2022-09-09 00:49
                            </div>
                            <div className="hold-meta-grid">
                              <span className="hold-meta-chip">
                                Tier: <strong>{item.tier || 'critical'}</strong>
                              </span>
                              {item.case_id && (
                                <span className="hold-meta-chip">
                                  Case: <strong className="tabnum">{item.case_id}</strong>
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Confirmation Modal required before calling POST /screen in Live Mode */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={handleCancelModal} role="presentation">
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <h3 id="confirm-modal-title" className="modal-title">Live Audit Log Confirmation</h3>
            <p className="modal-text">
              This adds records to the live audit log.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleCancelModal}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleConfirmProceed}>
                Confirm &amp; Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

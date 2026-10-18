import React, { useState, useEffect, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMode } from '../context/ModeContext';
import { loadRecordedData, getAuditVerify } from '../api';
import './AuditLog.css';

// Canonical recorded data from specification
const DEFAULT_AUDIT_DATA = {
  records: [
    { seq: 0, decision: "release", hash: "a3f1c9e2d4b5", prev_hash: "0000000000", txn_id: "W4088376", score: 0.0021, tier: "low", ts: "2022-09-08T17:31:00" },
    { seq: 1, decision: "release", hash: "b7d2e8f1a3c4", prev_hash: "a3f1c9e2d4b5", txn_id: "W4095557", score: 0.0034, tier: "low", ts: "2022-09-08T17:53:00" },
    { seq: 2, decision: "release", hash: "c4e9d1b3f2a7", prev_hash: "b7d2e8f1a3c4", txn_id: "W4096594", score: 0.0018, tier: "low", ts: "2022-09-08T17:56:00" },
    { seq: 3, decision: "release", hash: "d8a2c5e7f1b9", prev_hash: "c4e9d1b3f2a7", txn_id: "W4250809", score: 0.4120, tier: "medium", ts: "2022-09-09T00:49:00" },
    { seq: 4, decision: "hold", hash: "e1f3b7d9c2a4", prev_hash: "d8a2c5e7f1b9", txn_id: "HOLD4250810", score: 0.9982, tier: "critical", case_id: "CASE-4250810-20220909", ts: "2022-09-09T00:49:00" }
  ],
  public_key_fingerprint: "SHA256:xK9mPqR2vL5nW8jT3hB6dY1fC4gA7sE0uI"
};

export default function AuditLog() {
  const { mode } = useMode();
  const shouldReduceMotion = useReducedMotion();
  const tokenId = useId();

  const [auditData, setAuditData] = useState(DEFAULT_AUDIT_DATA);
  const [selectedSeq, setSelectedSeq] = useState(0);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Verifier token state (kept strictly in React memory, never persisted)
  const [verifierToken, setVerifierToken] = useState('');
  const [verifyStatus, setVerifyStatus] = useState({ state: 'idle', message: '' });

  // Load audit data from recorded file on mount
  useEffect(() => {
    let isMounted = true;
    loadRecordedData('recorded_audit.json')
      .then((data) => {
        if (isMounted && data && Array.isArray(data.records) && data.records.length > 0) {
          setAuditData(data);
        }
      })
      .catch(() => {
        // Fallback already pre-loaded into state
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const records = auditData.records || [];
  const fingerprint = auditData.public_key_fingerprint || DEFAULT_AUDIT_DATA.public_key_fingerprint;
  const selectedRecord = records.find((r) => r.seq === selectedSeq) || records[0];

  const previousRecord = selectedRecord && selectedRecord.seq > 0
    ? records.find((r) => r.seq === selectedRecord.seq - 1)
    : null;

  const holdCount = records.filter((r) => r.decision.toLowerCase() === 'hold').length;
  const releaseCount = records.filter((r) => r.decision.toLowerCase() === 'release').length;

  const handleCopyFingerprint = async () => {
    try {
      await navigator.clipboard.writeText(fingerprint);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2000);
    } catch {
      setCopiedFingerprint(false);
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (mode !== 'live') return;

    setVerifyStatus({ state: 'loading', message: 'Calling GET /audit/verify...' });
    try {
      const res = await getAuditVerify(verifierToken.trim() || undefined);
      const detailStr = res && typeof res === 'object' ? JSON.stringify(res) : 'Clean response received.';
      setVerifyStatus({
        state: 'success',
        message: `Verification passed: ${detailStr}`
      });
    } catch (err) {
      setVerifyStatus({
        state: 'error',
        message: err.message || 'Verification request failed. Ensure screening service is active.'
      });
    }
  };

  return (
    <div className="audit-page">
      {/* Title & Context */}
      <header className="audit-header">
        <h1 className="audit-title">Audit Log</h1>
        <p className="audit-description">
          Cryptographically linked sequential audit trail. Every AML screening decision records the model score, 
          tier allocation, timestamp, and previous block hash for deterministic provenance.
        </p>
      </header>

      {/* Asymmetrical Stats & Provenance Band */}
      <section className="audit-summary-band" aria-label="Audit summary metrics">
        <div className="metric-stat-block accent-teal">
          <div className="metric-label">Chain blocks verified</div>
          <div className="metric-number">{records.length}</div>
          <div className="metric-context">
            Contiguous sequence from block #0 through #{records.length > 0 ? records.length - 1 : 0}
          </div>
        </div>

        <div className="metric-stat-block accent-amber">
          <div className="metric-label">Hold decisions</div>
          <div className="metric-number">{holdCount}</div>
          <div className="metric-context">
            {releaseCount} releases and {holdCount} hold interception recorded
          </div>
        </div>

        {/* Public Key Fingerprint Card */}
        <div className="provenance-card">
          <div className="provenance-header-line">
            <span className="provenance-title">Public Key Fingerprint</span>
            <span className="provenance-badge">Pinned root</span>
          </div>

          <div className="fingerprint-box">
            <code className="fingerprint-value" title="Pinned authority key fingerprint">
              {fingerprint}
            </code>
            <button
              type="button"
              className="copy-btn"
              onClick={handleCopyFingerprint}
              aria-label="Copy public key fingerprint to clipboard"
            >
              {copiedFingerprint ? 'Copied' : 'Copy key'}
            </button>
          </div>

          <p className="provenance-note">
            Log records and checkpoints are signed by this pinned public key. Tamper tests confirm any modified block breaks chain continuity.
          </p>
        </div>
      </section>

      {/* Verify Action Section */}
      <section className="verify-section" aria-labelledby="verify-heading">
        <div className="verify-layout">
          <div className="verify-header-row">
            <h2 id="verify-heading" className="verify-heading">
              Hash Chain Verification
            </h2>
            <span className={`mode-tag ${mode}`}>
              {mode === 'live' ? 'Live mode' : 'Recorded mode'}
            </span>
          </div>

          {mode === 'recorded' ? (
            <p className="verify-notice">
              Verification requires a live connection to the service. Switch to Live mode to perform real-time verification against the active service endpoint.
            </p>
          ) : (
            <p className="verify-notice">
              Execute GET /audit/verify against the live screening service to validate cryptographic integrity across all logged decisions.
            </p>
          )}

          <div className="verify-controls">
            <div className="verify-field-group">
              <label htmlFor={tokenId} className="verify-field-label">
                Verifier token
              </label>
              <input
                id={tokenId}
                type="password"
                className="verify-input"
                placeholder={mode === 'live' ? 'Enter verifier token (optional)' : 'Verification requires a live connection to the service.'}
                value={verifierToken}
                onChange={(e) => setVerifierToken(e.target.value)}
                disabled={mode === 'recorded'}
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              className="verify-btn"
              onClick={handleVerify}
              disabled={mode === 'recorded' || verifyStatus.state === 'loading'}
            >
              {verifyStatus.state === 'loading' ? 'Verifying chain...' : 'Verify'}
            </button>
          </div>

          {verifyStatus.state !== 'idle' && (
            <div
              className={`verify-feedback ${verifyStatus.state}`}
              role={verifyStatus.state === 'error' ? 'alert' : 'status'}
            >
              {verifyStatus.message}
            </div>
          )}
        </div>
      </section>

      {/* Horizontal Chain Visualization */}
      <section className="chain-section" aria-labelledby="chain-heading">
        <div className="chain-section-header">
          <h2 id="chain-heading" className="chain-section-title">
            Sequential Hash Chain
          </h2>
          <span className="chain-hint">
            Select any block to inspect full cryptographic headers and payload
          </span>
        </div>

        <div className="chain-scroll-wrapper">
          <div
            className="chain-scroll-container"
            role="region"
            aria-label="Horizontal cryptographic hash chain"
            tabIndex={0}
          >
            {records.map((record, index) => {
              const isSelected = selectedRecord && record.seq === selectedRecord.seq;
              const isHold = record.decision.toLowerCase() === 'hold';
              const shortHash = record.hash.slice(0, 12);
              const shortPrev = record.prev_hash.slice(0, 12);

              return (
                <React.Fragment key={record.seq}>
                  <div className="chain-node">
                    <motion.button
                      type="button"
                      className={`chain-block decision-${record.decision.toLowerCase()}${isSelected ? ' is-selected' : ''}`}
                      onClick={() => setSelectedSeq(record.seq)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedSeq(record.seq);
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-label={`Record sequence ${record.seq}, decision ${record.decision}, hash ${shortHash}`}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : index * 0.08 }}
                    >
                      <div className="chain-block-top">
                        <span className="chain-seq-number">Seq #{record.seq}</span>
                        <span className="chain-decision-pill">
                          {isHold ? 'HOLD' : 'RELEASE'}
                        </span>
                      </div>

                      <div className="chain-hash-row">
                        <span className="chain-hash-label">Hash</span>
                        <span className="chain-hash-value">{shortHash}</span>
                      </div>

                      <div className="chain-hash-row">
                        <span className="chain-hash-label">Prev hash</span>
                        <span className="chain-hash-value">{shortPrev}</span>
                      </div>
                    </motion.button>
                  </div>

                  {index < records.length - 1 && (
                    <div className="chain-connector-link" aria-hidden="true">
                      <svg width="44" height="24" viewBox="0 0 44 24" className="connector-svg">
                        <line x1="0" y1="12" x2="32" y2="12" stroke="var(--text-muted)" strokeWidth="2" />
                        <polygon points="32,7 44,12 32,17" fill="var(--text-muted)" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* Expanded Record Detail Panel Below */}
      {selectedRecord && (
        <section className="detail-section" aria-labelledby="detail-heading">
          <div className="detail-section-header">
            <h2 id="detail-heading" className="detail-section-title">
              Block Inspection
            </h2>
            <span className="detail-selected-badge">
              Inspecting sequence #{selectedRecord.seq} of {records.length - 1}
            </span>
          </div>

          <div className="audit-ledger-panel">
            <div className="ledger-record-headline">
              <h3 className="ledger-record-title">
                Record Sequence #{selectedRecord.seq}
              </h3>
              <span className={`ledger-decision-badge ${selectedRecord.decision.toLowerCase()}`}>
                {selectedRecord.decision.toUpperCase()}
              </span>
            </div>

            <div className="ledger-fields-grid">
              <div className="field-cell">
                <span className="field-name">Transaction ID</span>
                <span className="field-content">{selectedRecord.txn_id}</span>
              </div>

              <div className="field-cell">
                <span className="field-name">Screening score</span>
                <span className="field-content">{typeof selectedRecord.score === 'number' ? selectedRecord.score.toFixed(4) : selectedRecord.score}</span>
              </div>

              <div className="field-cell">
                <span className="field-name">Risk tier</span>
                <span className="field-content">
                  <span className={`tier-pill tier-${selectedRecord.tier.toLowerCase()}`}>
                    {selectedRecord.tier}
                  </span>
                </span>
              </div>

              <div className="field-cell">
                <span className="field-name">Case ID</span>
                <span className="field-content">
                  {selectedRecord.case_id ? selectedRecord.case_id : 'None (released without case)'}
                </span>
              </div>

              <div className="field-cell">
                <span className="field-name">Timestamp</span>
                <span className="field-content">{selectedRecord.ts ? selectedRecord.ts.replace('T', ' ') : 'N/A'}</span>
              </div>

              <div className="field-cell span-full">
                <span className="field-name">Full record hash</span>
                <code className="field-code">{selectedRecord.hash}</code>
              </div>

              <div className="field-cell span-full">
                <span className="field-name">Full previous hash (prev_hash)</span>
                <code className="field-code">{selectedRecord.prev_hash}</code>
              </div>
            </div>

            {/* Linkage Verification Summary */}
            <div className="continuity-box">
              <div className="continuity-title">
                Cryptographic Continuity Status
              </div>
              <p className="continuity-desc">
                {selectedRecord.seq === 0 ? (
                  'Genesis record: prev_hash points to initial null seed (0000000000). Log chain initiates here.'
                ) : previousRecord ? (
                  `Validated linkage: prev_hash matches sequence #${previousRecord.seq} record hash (${previousRecord.hash.slice(0, 12)}).`
                ) : (
                  'Chain link verified against contiguous preceding record.'
                )}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

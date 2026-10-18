import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import useMode from '../context/ModeContext';
import { getHealth, getPolicy } from '../api';
import './Platform.css';

const RECORDED_HEALTH = {
  status: 'healthy',
  uptime_seconds: 86421,
  version: '0.1.0',
  platform: 'linux-s390x'
};

const RECORDED_POLICY = {
  model_hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  threshold: 0.99506049103294,
  cap: 5,
  audit_public_key_fingerprint: 'SHA256:xK9mPqR2vL5nW8jT3hB6dY1fC4gA7sE0uI'
};

const LOAD_TEST_DATA = [
  { concurrency: 1, reqPerSec: 873.2, p50: 1.08, p95: 1.32, p99: 1.82 },
  { concurrency: 10, reqPerSec: 796.2, p50: 6.53, p95: 51.57, p99: 110.23 },
  { concurrency: 50, reqPerSec: 290.5, p50: 109.10, p95: 518.41, p99: 926.62 },
  { concurrency: 100, reqPerSec: 250.4, p50: 171.19, p95: 1774.44, p99: 3350.01 }
];

function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-title">Concurrency: {label}</p>
        {payload.map((entry, index) => {
          const isThroughput = entry.dataKey === 'reqPerSec';
          return (
            <p
              key={`item-${index}`}
              className="chart-tooltip-item"
              style={{ color: entry.color }}
            >
              <span className="chart-tooltip-label">
                {isThroughput ? 'Throughput' : 'p95 Latency'}:
              </span>{' '}
              <strong className="chart-tooltip-value">
                {entry.value} {isThroughput ? 'req/s' : 'ms'}
              </strong>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
}

export default function Platform() {
  const modeContext = typeof useMode === 'function' ? useMode() : null;
  const isLive = Boolean(modeContext?.isLive || modeContext?.mode === 'live');

  const [healthData, setHealthData] = useState(RECORDED_HEALTH);
  const [policyData, setPolicyData] = useState(RECORDED_POLICY);
  const [dataSource, setDataSource] = useState('recorded');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (isLive) {
      Promise.allSettled([
        typeof getHealth === 'function' ? getHealth() : Promise.reject(new Error('getHealth undefined')),
        typeof getPolicy === 'function' ? getPolicy() : Promise.reject(new Error('getPolicy undefined'))
      ])
        .then(([healthResult, policyResult]) => {
          if (!isMounted) return;

          let healthSuccess = false;
          let policySuccess = false;

          if (healthResult.status === 'fulfilled' && healthResult.value) {
            const hData = healthResult.value.data || healthResult.value;
            if (hData && typeof hData === 'object' && hData.status) {
              setHealthData(hData);
              healthSuccess = true;
            }
          }

          if (policyResult.status === 'fulfilled' && policyResult.value) {
            const pData = policyResult.value.data || policyResult.value;
            if (pData && typeof pData === 'object' && pData.threshold !== undefined) {
              setPolicyData(pData);
              policySuccess = true;
            }
          }

          if (healthSuccess && policySuccess) {
            setDataSource('live');
            setErrorMessage('');
          } else {
            setDataSource('recorded-fallback');
            setErrorMessage('Live endpoint unavailable. Showing recorded snapshot.');
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setHealthData(RECORDED_HEALTH);
          setPolicyData(RECORDED_POLICY);
          setDataSource('recorded-fallback');
          setErrorMessage('Live fetch failed. Showing recorded snapshot.');
        });
    } else {
      setHealthData(RECORDED_HEALTH);
      setPolicyData(RECORDED_POLICY);
      setDataSource('recorded');
      setErrorMessage('');
    }

    return () => {
      isMounted = false;
    };
  }, [isLive]);

  const uptimeDays = (healthData.uptime_seconds / 86400).toFixed(1);

  return (
    <div className="platform-page">
      <header className="platform-header">
        <h1 className="platform-title">Platform</h1>
        <p className="platform-subtitle">
          Architecture specification, active runtime policies, and concurrency benchmark measurements.
        </p>
      </header>

      {errorMessage && (
        <div className="platform-notice" role="status">
          {errorMessage}
        </div>
      )}

      {/* PLATFORM ARCHITECTURE PANEL */}
      <section className="platform-architecture-panel" aria-labelledby="platform-arch-title">
        <div className="architecture-badge">System environment</div>
        <h2 id="platform-arch-title" className="architecture-statement">
          Runs as a non-root container on IBM LinuxONE (s390x, 3 CPUs).
        </h2>
        <div className="architecture-meta">
          <div className="architecture-meta-item">
            <span className="meta-label">Architecture</span>
            <span className="meta-value tabular-num">{healthData.platform || 'linux-s390x'}</span>
          </div>
          <div className="architecture-meta-item">
            <span className="meta-label">Isolation mode</span>
            <span className="meta-value">Non-root container</span>
          </div>
          <div className="architecture-meta-item">
            <span className="meta-label">Compute allocated</span>
            <span className="meta-value tabular-num">3 CPUs</span>
          </div>
          <div className="architecture-meta-item">
            <span className="meta-label">Mode status</span>
            <span className="meta-value">
              {dataSource === 'live' ? 'Live connected' : 'Recorded snapshot'}
            </span>
          </div>
        </div>
      </section>

      {/* SERVICE INFO SECTION: HEALTH AND POLICY CARDS */}
      <section className="service-info-section" aria-labelledby="service-info-heading">
        <div className="service-cards-grid">
          {/* Service Health Card */}
          <article className="service-card health-card">
            <div className="service-card-header">
              <span className="card-kicker">Service status</span>
              <span className={`status-pill ${healthData.status === 'healthy' ? 'status-pill-healthy' : 'status-pill-warning'}`}>
                {healthData.status || 'healthy'}
              </span>
            </div>

            <div className="uptime-highlight">
              <span className="uptime-label">Uptime seconds</span>
              <span className="uptime-number tabular-num">{healthData.uptime_seconds.toLocaleString()}</span>
              <span className="uptime-secondary tabular-num">
                {healthData.uptime_seconds}s ({uptimeDays} days)
              </span>
            </div>

            <div className="service-card-meta-list">
              <div className="service-meta-row">
                <span className="meta-name">Version</span>
                <span className="meta-data tabular-num">{healthData.version}</span>
              </div>
              <div className="service-meta-row">
                <span className="meta-name">Platform</span>
                <span className="meta-data tabular-num">{healthData.platform}</span>
              </div>
              <div className="service-meta-row">
                <span className="meta-name">Data origin</span>
                <span className="meta-data">
                  {dataSource === 'live' ? '/health (live)' : './data/recorded_health.json'}
                </span>
              </div>
            </div>
          </article>

          {/* Active Policy Card */}
          <article className="service-card policy-card">
            <div className="service-card-header">
              <span className="card-kicker">Policy parameters</span>
              <span className="status-pill status-pill-policy">Active policy</span>
            </div>

            <div className="policy-metrics-split">
              <div className="policy-metric-block">
                <span className="policy-metric-label">Threshold</span>
                <span className="policy-threshold-value tabular-num" title="Full precision threshold">
                  {policyData.threshold}
                </span>
                <span className="policy-metric-description">Full precision calibration</span>
              </div>

              <div className="policy-metric-block policy-cap-block">
                <span className="policy-metric-label">Harm cap</span>
                <span className="policy-cap-number tabular-num">{policyData.cap}</span>
                <span className="policy-metric-description">Maximum allowed hold limit</span>
              </div>
            </div>

            <div className="cryptographic-meta-group">
              <div className="crypto-item">
                <span className="crypto-label">Model hash</span>
                <code className="crypto-hash tabular-num" tabIndex={0} aria-label="Model hash">
                  {policyData.model_hash}
                </code>
              </div>

              <div className="crypto-item">
                <span className="crypto-label">Audit public key fingerprint</span>
                <code className="crypto-fingerprint tabular-num" tabIndex={0} aria-label="Audit public key fingerprint">
                  {policyData.audit_public_key_fingerprint}
                </code>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* LOAD TEST SECTION: CHART & LEDGER PANEL */}
      <section className="load-test-section" aria-labelledby="load-test-heading">
        <div className="section-title-wrap">
          <h2 id="load-test-heading" className="section-title">
            Load test performance benchmark
          </h2>
          <p className="section-description">
            Dual-metric analysis showing request throughput alongside 95th-percentile response latency across stepped concurrency.
          </p>
        </div>

        {/* Recharts ComposedChart Container */}
        <div className="chart-wrapper">
          <div className="chart-header-row">
            <h3 className="chart-title">Throughput vs p95 latency</h3>
            <div className="chart-legend-guide">
              <span className="legend-indicator throughput-indicator">Throughput (req/s)</span>
              <span className="legend-indicator latency-indicator">p95 Latency (ms)</span>
            </div>
          </div>

          <div className="chart-inner-container">
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart
                data={LOAD_TEST_DATA}
                margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#25384D" vertical={false} />
                <XAxis
                  dataKey="concurrency"
                  stroke="#8A9BAE"
                  tick={{ fill: '#8A9BAE', fontSize: 16 }}
                  tickLine={{ stroke: '#8A9BAE' }}
                  label={{
                    value: 'Concurrency level (workers)',
                    position: 'insideBottom',
                    offset: -10,
                    fill: '#8A9BAE',
                    fontSize: 16
                  }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#19A58E"
                  tick={{ fill: '#19A58E', fontSize: 16 }}
                  tickLine={{ stroke: '#19A58E' }}
                  label={{
                    value: 'Throughput (req/s)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#19A58E',
                    fontSize: 16
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#E8B341"
                  tick={{ fill: '#E8B341', fontSize: 16 }}
                  tickLine={{ stroke: '#E8B341' }}
                  label={{
                    value: 'p95 Latency (ms)',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#E8B341',
                    fontSize: 16
                  }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '16px' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="reqPerSec"
                  name="Throughput (req/s)"
                  fill="#19A58E"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="p95"
                  name="p95 Latency (ms)"
                  stroke="#E8B341"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#E8B341', stroke: '#0E1A24', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#E8B341', stroke: '#F4F1E8', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-footer-note" role="note">
            Single worker, test client on the same 3 CPUs, 2000 requests per level, 0 errors. This is not a production capacity benchmark.
          </div>
        </div>

        {/* LEDGER PANEL TABLE */}
        <div className="ledger-table-panel">
          <div className="ledger-panel-header">
            <h3 className="ledger-panel-title">Concurrency evaluation records</h3>
            <span className="ledger-panel-tag">Zero error execution</span>
          </div>

          <div className="ledger-table-scroll" tabIndex={0} aria-label="Load test results table">
            <table className="ledger-data-table">
              <thead>
                <tr>
                  <th scope="col">Concurrency</th>
                  <th scope="col" className="text-right">Throughput (req/s)</th>
                  <th scope="col" className="text-right">p50 Latency (ms)</th>
                  <th scope="col" className="text-right">p95 Latency (ms)</th>
                  <th scope="col" className="text-right">p99 Latency (ms)</th>
                </tr>
              </thead>
              <tbody>
                {LOAD_TEST_DATA.map((row) => (
                  <tr key={row.concurrency}>
                    <td className="row-key tabular-num">{row.concurrency}</td>
                    <td className="text-right tabular-num font-weight-medium">{row.reqPerSec.toFixed(1)}</td>
                    <td className="text-right tabular-num">{row.p50.toFixed(2)}</td>
                    <td className="text-right tabular-num p95-cell">{row.p95.toFixed(2)}</td>
                    <td className="text-right tabular-num">{row.p99.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ledger-panel-footer">
            <p className="ledger-footnote">
              Single worker, test client on the same 3 CPUs, 2000 requests per level, 0 errors. This is not a production capacity benchmark.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

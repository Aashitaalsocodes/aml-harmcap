import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useMode } from '../context/ModeContext';
import { Shield, AlertTriangle } from 'lucide-react';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', num: '1' },
  { to: '/cap-explorer', label: 'Cap Explorer', num: '2' },
  { to: '/screening', label: 'Live Screening', num: '3' },
  { to: '/audit', label: 'Audit Log', num: '4' },
  { to: '/tamper', label: 'Tamper Tests', num: '5' },
  { to: '/platform', label: 'Platform', num: '6' },
  { to: '/limits', label: 'Limits', num: '7' },
];

export default function Layout() {
  const { mode, switchToLive, switchToRecorded, error } = useMode();
  const [navOpen, setNavOpen] = useState(false);
  const [confirmLive, setConfirmLive] = useState(false);
  const location = useLocation();

  const handleModeToggle = () => {
    if (mode === 'recorded') {
      setConfirmLive(true);
    } else {
      switchToRecorded();
    }
  };

  const confirmSwitch = () => {
    setConfirmLive(false);
    switchToLive();
  };

  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <button
        className="mobile-menu-btn"
        onClick={() => setNavOpen(!navOpen)}
        aria-label="Toggle navigation"
      >
        {navOpen ? '\u2715' : '\u2630'}
      </button>

      <nav className={`nav${navOpen ? ' open' : ''}`} aria-label="Main navigation">
        <div className="nav-brand">
          <h1>
            <span className="nav-brand-icon" aria-hidden="true">
              <Shield size={16} strokeWidth={2.5} />
            </span>
            Harm Cap
          </h1>
          <div className="nav-brand-sub">AML Decision System</div>
        </div>

        <ul className="nav-links">
          {NAV_ITEMS.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={() => setNavOpen(false)}
                end={item.to === '/'}
              >
                <span className="nav-link-num">{item.num}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mode-strip">
          <div className="mode-toggle">
            <span className={`mode-indicator ${mode}`} />
            <span className="mode-label">
              {mode === 'recorded' ? 'Recorded' : 'Live'}
            </span>
            <button className="mode-switch-btn" onClick={handleModeToggle}>
              {mode === 'recorded' ? 'Go live' : 'Recorded'}
            </button>
          </div>
          {error && <div className="mode-error" role="alert">{error}</div>}
        </div>
      </nav>

      <div className="main-content">
        <div className="top-strip" aria-live="polite">
          <div className="strip-mode">
            <span className={`mode-indicator ${mode}`} />
            {mode === 'recorded' ? 'Recorded mode' : 'Live mode'}
          </div>
        </div>

        <main id="main-content" className="page-wrapper">
          <Outlet />
        </main>

        <footer className="app-footer">
          <div className="footer-left">
            <Shield size={12} />
            <span>HarmCap — Synthetic AML data only. Not production.</span>
          </div>
          <div className="footer-right">
            s390x · non-root container · FastAPI
          </div>
        </footer>
      </div>

      {confirmLive && (
        <div className="modal-overlay" onClick={() => setConfirmLive(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Switch to Live mode?</h3>
            <p>
              Live mode connects to the screening service at 127.0.0.1:8000.
              Replay and form submissions will add records to the live audit log.
              If the service is unreachable, the app falls back to Recorded mode.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmLive(false)}>Cancel</button>
              <button className="btn-primary" onClick={confirmSwitch}>Switch to Live</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

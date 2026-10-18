import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ModeProvider } from './context/ModeContext';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import CapExplorer from './pages/CapExplorer';
import LiveScreening from './pages/LiveScreening';
import AuditLog from './pages/AuditLog';
import TamperTests from './pages/TamperTests';
import Platform from './pages/Platform';
import Limits from './pages/Limits';

export default function App() {
  return (
    <ModeProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="cap-explorer" element={<CapExplorer />} />
            <Route path="screening" element={<LiveScreening />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="tamper" element={<TamperTests />} />
            <Route path="platform" element={<Platform />} />
            <Route path="limits" element={<Limits />} />
          </Route>
        </Routes>
      </HashRouter>
    </ModeProvider>
  );
}

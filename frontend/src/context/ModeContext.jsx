import React, { createContext, useContext, useState, useCallback } from 'react';

const ModeContext = createContext();

export function ModeProvider({ children }) {
  const [mode, setMode] = useState('recorded'); // 'recorded' | 'live'
  const [error, setError] = useState(null);

  const switchToLive = useCallback(() => {
    setError(null);
    setMode('live');
  }, []);

  const switchToRecorded = useCallback(() => {
    setError(null);
    setMode('recorded');
  }, []);

  const handleError = useCallback((msg) => {
    setError(msg);
    setMode('recorded');
  }, []);

  return (
    <ModeContext.Provider value={{ mode, switchToLive, switchToRecorded, error, setError, handleError }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}

export default useMode;


import React, { Suspense, lazy, memo, useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { API_BASE } from '../utils/apiClient.js';

const SpeedTapGame = lazy(() => import('./SpeedTapGame'));
const MemoryMatchGame = lazy(() => import('./MemoryMatchGame'));
const FocusFinderGame = lazy(() => import('./FocusFinderGame'));
const LogicLinkGame = lazy(() => import('./LogicLinkGame'));
const PriorityQueueGame = lazy(() => import('./PriorityQueueGame'));
const MatrixRecallGame = lazy(() => import('./MatrixRecallGame'));
const StroopShiftGame = lazy(() => import('./StroopShiftGame'));
const MentalFlexGame = lazy(() => import('./MentalFlexGame'));
const EquationBalanceGame = lazy(() => import('./EquationBalanceGame'));
const SequenceDecoderGame = lazy(() => import('./SequenceDecoderGame'));
const RouteOptimizerGame = lazy(() => import('./RouteOptimizerGame'));
const NeuroMazeGame = lazy(() => import('./NeuroMazeGame'));
const SynapseSpinGame = lazy(() => import('./SynapseSpinGame'));
const NexusMapperGame = lazy(() => import('./NexusMapperGame'));

const GameRenderer = memo(function GameRenderer({ activeGame, activeDashboardUser, handleGameFinished }) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissWarning, setDismissWarning] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return (
    <div className="game-container" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {isPortrait && !dismissWarning && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '2rem', color: '#f8fafc', backdropFilter: 'blur(10px)'
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '1.5rem', animation: 'spin 3s ease-in-out infinite' }} xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7c0-1.657 1.343-3 3-3h10c1.657 0 3 1.343 3 3v10c0 1.657-1.343 3-3 3H7c-1.657 0-3-1.343-3-3V7z" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 4v16M15 4v16" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3"/>
            <path d="M12 8v8M9 12h6" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 style={{ marginBottom: '1rem', color: '#38bdf8', letterSpacing: '0.05em' }}>Rotate Device</h2>
          <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '300px' }}>
            For the best cognitive training experience, please rotate your phone to <strong>Landscape mode</strong>.
          </p>
          <button 
            onClick={() => setDismissWarning(true)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#94a3b8', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer'
            }}
          >
            Continue in Portrait
          </button>
        </div>
      )}

      <ErrorBoundary>
        <Suspense fallback={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-card)', color: '#94a3b8' }}>
            <div className="loading-pulse" style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(192, 132, 252, 0.2)', border: '2px solid var(--color-primary)', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>LOADING NEURAL WORKSPACE...</div>
          </div>
        }>
          {activeGame === 'SpeedTap' && <SpeedTapGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'MemoryMatch' && <MemoryMatchGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'FocusFinder' && <FocusFinderGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'LogicLink' && <LogicLinkGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'PriorityQueue' && <PriorityQueueGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'MatrixRecall' && <MatrixRecallGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'StroopShift' && <StroopShiftGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'MentalFlex' && <MentalFlexGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'EquationBalance' && <EquationBalanceGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'SequenceDecoder' && <SequenceDecoderGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'RouteOptimizer' && <RouteOptimizerGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'NeuroMaze' && <NeuroMazeGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'SynapseSpin' && <SynapseSpinGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
          {activeGame === 'NexusMapper' && <NexusMapperGame username={activeDashboardUser} apiUrl={API_BASE} onGameFinished={handleGameFinished} />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});

export default GameRenderer;

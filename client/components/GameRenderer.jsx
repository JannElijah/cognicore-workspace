import React, { Suspense, lazy, memo } from 'react';
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
  return (
    <div className="game-container" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
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

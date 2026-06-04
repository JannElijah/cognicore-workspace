import React, { useState, useEffect } from 'react';
import SpeedTapGame from './components/SpeedTapGame';
import MemoryMatchGame from './components/MemoryMatchGame';
import FocusFinderGame from './components/FocusFinderGame';
import LogicLinkGame from './components/LogicLinkGame';
import MazeEscapeGame from './components/MazeEscapeGame';

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [lastGameStats, setLastGameStats] = useState(null);
  
  // Thesis Cohort evaluation states
  const [pretestInput, setPretestInput] = useState('72, 68, 75, 80, 65, 78, 70, 74, 82, 69');
  const [posttestInput, setPosttestInput] = useState('84, 76, 85, 88, 78, 88, 82, 84, 91, 80');
  const [evalResult, setEvalResult] = useState(null);
  const [evalError, setEvalError] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);

  // Dynamic Skill Scores
  // Memory, Attention, Processing Speed, Problem Solving
  const [skills, setSkills] = useState({
    memory: 76,
    attention: 64,
    processingSpeed: 70,
    problemSolving: 68
  });

  // Update dynamic skills based on the player's game telemetry
  useEffect(() => {
    if (lastGameStats) {
      if (lastGameStats.gameType === 'MemoryMatch') {
        // Scale memory game performance
        const baseAccuracy = lastGameStats.accuracy * 70; // up to 70 pts
        const difficultyBonus = lastGameStats.difficultyLevel * 6; // up to 30 pts
        const memoryScore = Math.round(baseAccuracy + difficultyBonus);
        
        setSkills(prev => ({
          ...prev,
          memory: Math.max(memoryScore, prev.memory)
        }));
      } else if (lastGameStats.gameType === 'FocusFinder') {
        // Scale attention game performance
        const baseAccuracy = lastGameStats.accuracy * 70; // up to 70 pts
        const difficultyBonus = lastGameStats.difficultyLevel * 6; // up to 30 pts
        const attentionScore = Math.round(baseAccuracy + difficultyBonus);
        
        setSkills(prev => ({
          ...prev,
          attention: Math.max(attentionScore, prev.attention)
        }));
      } else if (lastGameStats.gameType === 'LogicLink' || lastGameStats.gameType === 'MazeEscape') {
        // Scale problem solving game performance
        const baseAccuracy = lastGameStats.accuracy * 70; // up to 70 pts
        const difficultyBonus = lastGameStats.difficultyLevel * 6; // up to 30 pts
        const problemSolvingScore = Math.round(baseAccuracy + difficultyBonus);
        
        setSkills(prev => ({
          ...prev,
          problemSolving: Math.max(problemSolvingScore, prev.problemSolving)
        }));
      } else {
        // Scale game performance (accuracy & score) into a 0-100 score for Processing Speed
        const baseAccuracyFactor = lastGameStats.accuracy * 60; // Up to 60 pts
        const speedFactor = Math.min(40, (lastGameStats.score / Math.max(1, lastGameStats.hits)) / 15); // Up to 40 pts
        const calculatedSpeed = Math.round(baseAccuracyFactor + speedFactor);
        
        setSkills(prev => ({
          ...prev,
          processingSpeed: Math.max(calculatedSpeed, prev.processingSpeed),
          attention: Math.max(Math.round(lastGameStats.accuracy * 100), prev.attention)
        }));
      }
    }
  }, [lastGameStats]);

  const handleGameFinished = (stats) => {
    setLastGameStats({ ...stats, gameType: activeGame });
  };

  const handleBackToLobby = () => {
    setActiveGame(null);
  };

  const startSpeedTap = () => {
    setActiveGame('SpeedTap');
  };

  // Run Paired t-test request on Flask backend
  const runCohortEvaluation = async () => {
    setEvalLoading(true);
    setEvalError(null);
    setEvalResult(null);

    // Parse inputs into lists of numbers
    const parseList = (str) => str.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
    const preArr = parseList(pretestInput);
    const postArr = parseList(posttestInput);

    if (preArr.length !== postArr.length) {
      setEvalError('Pretest and Posttest cohorts must have the same number of scores.');
      setEvalLoading(false);
      return;
    }
    if (preArr.length < 2) {
      setEvalError('At least 2 scores are required to perform a statistical t-test.');
      setEvalLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pretest_scores: preArr,
          posttest_scores: postArr
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        setEvalResult(data);
      } else {
        throw new Error(data.message || 'Evaluation failed.');
      }
    } catch (e) {
      console.error(e);
      setEvalError(`Failed to run statistical engine: ${e.message}`);
    } finally {
      setEvalLoading(false);
    }
  };

  const loadSimulatedCohort = () => {
    setPretestInput('72, 68, 75, 80, 65, 78, 70, 74, 82, 69, 71, 73, 76, 70, 77');
    setPosttestInput('84, 82, 88, 91, 79, 89, 83, 85, 93, 82, 83, 87, 89, 81, 88');
    setEvalResult(null);
    setEvalError(null);
  };

  // Determine low score for personalized recommendation
  const getRecommendation = () => {
    const lowestKey = Object.keys(skills).reduce((a, b) => skills[a] < skills[b] ? a : b);
    const recommendations = {
      memory: {
        game: "Memory Match",
        reason: "Working Memory Capacity is below baseline",
        action: "train visual recall sequences"
      },
      attention: {
        game: "Focus Finder",
        reason: "Selective Vigilance and visual search rate can be optimized",
        action: "train continuous target selection"
      },
      processingSpeed: {
        game: "Speed Tap",
        reason: "Motor processing response time is currently your primary growth domain",
        action: "play visual reaction speed assessments"
      },
      problemSolving: {
        game: "Maze Escape",
        reason: "Executive spatial logic pathways show potential for optimization",
        action: "play spatial navigation matrices"
      }
    };
    return recommendations[lowestKey];
  };

  const rec = getRecommendation();

  return (
    <div className="portal-container">
      {/* Top Header */}
      <header className="portal-header">
        <div className="logo-glow" onClick={() => { setActiveGame(null); setShowDashboard(false); }} style={{ cursor: 'pointer' }}>
          🧠 COGNICORE
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {activeGame === null && (
            <button 
              className="dashboard-toggle-btn" 
              onClick={() => setShowDashboard(!showDashboard)}
              style={{
                background: showDashboard ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(to right, #38bdf8, #a855f7)',
                color: '#ffffff',
                border: '1px solid ' + (showDashboard ? 'rgba(255, 255, 255, 0.2)' : 'transparent'),
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: showDashboard ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {showDashboard ? '← Back to Training Hub' : '📊 Analytics Dashboard'}
            </button>
          )}
          <div className="portal-status">
            <span className="status-dot"></span> Secure Telemetry Hub
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="portal-main">
        {activeGame === 'SpeedTap' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <SpeedTapGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : activeGame === 'MemoryMatch' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <MemoryMatchGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : activeGame === 'FocusFinder' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <FocusFinderGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : activeGame === 'LogicLink' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <LogicLinkGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : activeGame === 'MazeEscape' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <MazeEscapeGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : showDashboard ? (
          // ==========================================
          // PILLAR-DRIVEN ANALYTICS DASHBOARD
          // ==========================================
          <div className="dashboard-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="intro-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2.25rem' }}>Cognitive Performance Analytics</h1>
              <p>Real-time analytics collected across validated cognitive tracks. Evaluate skill scores, track multi-session trends, and verify statistical improvement cohorts.</p>
            </div>

            {/* Cognitive Skills Score Row */}
            <h2 className="section-title">Cognitive Domain Profiling</h2>
            <div className="game-grid" style={{ marginBottom: '3rem' }}>
              <div className="game-card" style={{ padding: '1.5rem', borderLeft: '4px solid #38bdf8' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Memory Domain</span>
                <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#38bdf8' }}>{skills.memory}/100</h3>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>Short-Term sequence recall and spatial working capacity.</p>
              </div>
              <div className="game-card" style={{ padding: '1.5rem', borderLeft: '4px solid #a855f7' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Attention & Focus</span>
                <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#a855f7' }}>{skills.attention}/100</h3>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>Target search efficiency, visual vigilance, and distractor rejection.</p>
              </div>
              <div className="game-card" style={{ padding: '1.5rem', borderLeft: '4px solid #4ade80' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Processing Speed</span>
                <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#4ade80' }}>{skills.processingSpeed}/100</h3>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>Visuomotor reaction time and rapid-fire stimulus classification.</p>
              </div>
              <div className="game-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Problem Solving</span>
                <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#f59e0b' }}>{skills.problemSolving}/100</h3>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>Spatial navigation planning, matrix logic, and path optimization.</p>
              </div>
            </div>

            {/* Middle Row: Trend Vector SVG + Diagnostics */}
            <div className="dashboard-row-grid" style={{ gap: '2rem', marginBottom: '3rem' }}>
              
              {/* Trend Vector SVG */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>📈 Multi-Session Progress Trend</h3>
                <div style={{ position: 'relative', height: '180px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {/* Glowing Vector Graph */}
                  <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    
                    {/* Area under curve */}
                    <path d="M 10 120 L 90 95 L 170 110 L 250 80 L 330 65 L 410 75 L 490 35 L 490 120 Z" fill="url(#chartGrad)" />
                    
                    {/* Trend Line */}
                    <path 
                      d="M 10 120 Q 90 95 170 110 T 250 80 T 330 65 T 410 75 T 490 35" 
                      fill="none" 
                      stroke="url(#chartGrad)" 
                      strokeWidth="0" 
                    />
                    <path 
                      d="M 10 120 L 90 95 L 170 110 L 250 80 L 330 65 L 410 75 L 490 35" 
                      fill="none" 
                      stroke="#a855f7" 
                      strokeWidth="3.5" 
                      filter="drop-shadow(0px 0px 5px rgba(168, 85, 247, 0.8))"
                    />
                    
                    {/* Nodes */}
                    <circle cx="10" cy="120" r="4" fill="#ffffff" stroke="#a855f7" strokeWidth="2"/>
                    <circle cx="90" cy="95" r="4" fill="#ffffff" stroke="#a855f7" strokeWidth="2"/>
                    <circle cx="170" cy="110" r="4" fill="#ffffff" stroke="#a855f7" strokeWidth="2"/>
                    <circle cx="250" cy="80" r="4" fill="#ffffff" stroke="#a855f7" strokeWidth="2"/>
                    <circle cx="330" cy="65" r="4" fill="#ffffff" stroke="#a855f7" strokeWidth="2"/>
                    <circle cx="410" cy="75" r="4" fill="#ffffff" stroke="#a855f7" strokeWidth="2"/>
                    <circle cx="490" cy="35" r="5" fill="#ffffff" stroke="#38bdf8" strokeWidth="2.5" filter="drop-shadow(0px 0px 5px #38bdf8)"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>
                  <span>Session 1</span>
                  <span>Session 3</span>
                  <span>Session 5</span>
                  <span>Latest Training (DDA Active)</span>
                </div>
              </div>

              {/* Skill Diagnostics & Recommendations */}
              <div className="game-card" style={{ justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>🔍 Diagnostic Report</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '0.85rem' }}>💪 SKILL STRENGTH:</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        {skills.processingSpeed >= 70 ? 'Rapid Visuomotor Processing Speed. High reflexive reaction times and rapid selection.' : 'Standard motor control latency. Stabilizing baseline performance.'}
                      </p>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '0.85rem' }}>⚠️ SKILL WEAKNESS:</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        {skills.attention < 70 ? 'Selective Attention Vigilance. Accuracy decreases under visual distractor noise.' : 'Working Memory retention logic is currently your secondary optimization track.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>💡 Personalized Adviser Recommendation</div>
                  <div style={{ fontWeight: '700', color: '#c084fc', marginTop: '0.25rem', fontSize: '0.95rem' }}>
                    Train with <span style={{ textDecoration: 'underline' }}>{rec.game}</span>:
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {rec.reason}. Launch module to {rec.action}.
                  </p>
                </div>
              </div>
            </div>

            {/* PILLAR 1: Defensible Evaluation Framework Tool Panel */}
            <h2 className="section-title">Thesis Verification Panel (Pillar 1 Research Design)</h2>
            <div className="game-card" style={{ width: '100%', alignItems: 'stretch', padding: '2rem' }}>
              <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ fontWeight: 'bold', color: '#c084fc', fontSize: '0.9rem' }}>Pillar 1: Empirical Cognitive Improvement (Pretest-Posttest Design)</span>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Input pre-intervention and post-intervention scores for your research cohort. The backend will calculate the overall group Improvement Rate (%) and run a **Paired t-test** to calculate the t-statistic and p-value.
                </p>
              </div>

              {evalError && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{evalError}</div>}

              <div className="eval-inputs-grid" style={{ gap: '2rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '600' }}>Pretest Scores (comma separated)</label>
                  <input 
                    type="text" 
                    value={pretestInput} 
                    onChange={(e) => setPretestInput(e.target.value)} 
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#09090b',
                      border: '1.5px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '600' }}>Posttest Scores (comma separated)</label>
                  <input 
                    type="text" 
                    value={posttestInput} 
                    onChange={(e) => setPosttestInput(e.target.value)} 
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#09090b',
                      border: '1.5px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                  onClick={runCohortEvaluation} 
                  disabled={evalLoading}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flex: '1'
                  }}
                >
                  {evalLoading ? 'Running Statistical Engine...' : 'Calculate Paired t-test Statistics'}
                </button>
                <button 
                  onClick={loadSimulatedCohort}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Load Simulated Cohort (n=15)
                </button>
              </div>

              {/* Statistical Output Results Table */}
              {evalResult && (
                <div style={{ background: '#09090b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
                  <h4 style={{ color: '#38bdf8', marginBottom: '1rem', fontWeight: 'bold' }}>🔬 Paired t-test Evaluation Report</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cohort Sample Size (n)</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{evalResult.sample_size}</div>
                    </div>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Mean Score (Pre / Post)</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem', color: '#e2e8f0' }}>
                        {evalResult.mean_pretest} <span style={{ color: '#64748b', fontSize: '1rem' }}>→</span> <span style={{ color: '#4ade80' }}>{evalResult.mean_posttest}</span>
                      </div>
                    </div>
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Improvement Rate (%)</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem', color: '#4ade80' }}>
                        +{evalResult.overall_improvement_rate_pct}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Paired t-test Statistics</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                        t = {evalResult.t_statistic}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                        p = {evalResult.p_value}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid ' + (evalResult.statistically_significant ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                    background: evalResult.statistically_significant ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    color: evalResult.statistically_significant ? '#4ade80' : '#ef4444',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                  }}>
                    {evalResult.statistically_significant ? '✅ ' : '❌ '} {evalResult.hypothesis_result} (p &lt; 0.05)
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // ==========================================
          // ORIGINAL GAME LOBBY
          // ==========================================
          <div className="lobby-content">
            <div className="intro-card">
              <h1>Adaptive Neuro-Training Portal</h1>
              <p>Welcome to CogniCore. Access clinically validated serious game modules designed to assess cognitive processing speed, selective attention, and executive function. Real-time telemetry is recorded to construct your adaptive cognitive profile.</p>
            </div>

            <h2 className="section-title">Available Training Modules</h2>
            <div className="game-grid">
              {/* Speed Tap Active Card */}
              <div className="game-card active" onClick={startSpeedTap}>
                <div className="card-badge">Reflex</div>
                <div className="card-icon">⚡</div>
                <h3>Speed Tap</h3>
                <p>Measures visual reaction times and selective response inhibition. Avoid distractors, tap active targets.</p>
                <button className="play-btn">Launch Module</button>
              </div>

              {/* Memory Match Active Card */}
              <div className="game-card active" onClick={() => setActiveGame('MemoryMatch')}>
                <div className="card-badge">Memory</div>
                <div className="card-icon">🧩</div>
                <h3>Memory Match</h3>
                <p>Designed to analyze short-term working memory capacity and retention patterns.</p>
                <button className="play-btn">Launch Module</button>
              </div>

              {/* Focus Finder Active Card */}
              <div className="game-card active" onClick={() => setActiveGame('FocusFinder')}>
                <div className="card-badge">Attention</div>
                <div className="card-icon">🎯</div>
                <h3>Focus Finder</h3>
                <p>Designed to test continuous visual vigilance and search efficiency in cluttered visual fields.</p>
                <button className="play-btn">Launch Module</button>
              </div>

              {/* Logic Link Active Card */}
              <div className="game-card active" onClick={() => setActiveGame('LogicLink')}>
                <div className="card-badge">Reasoning</div>
                <div className="card-icon">🔗</div>
                <h3>Logic Link</h3>
                <p>Designed to analyze ascending numerical sequencing and spatial path planning.</p>
                <button className="play-btn">Launch Module</button>
              </div>

              {/* Maze Escape Active Card */}
              <div className="game-card active" onClick={() => setActiveGame('MazeEscape')}>
                <div className="card-badge">Problem Solving</div>
                <div className="card-icon">🧭</div>
                <h3>Maze Escape</h3>
                <p>Designed to analyze spatial maze navigation, planning, and multi-step execution maps.</p>
                <button className="play-btn">Launch Module</button>
              </div>

              {/* Mental Flex Locked Card */}
              <div className="game-card disabled">
                <div className="card-badge">Locked</div>
                <div className="card-icon">🌀</div>
                <h3>Mental Flex</h3>
                <p>Designed to train cognitive flexibility, set-shifting, and executive control.</p>
                <span className="lock-label">Development Sprint 5</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="portal-footer">
        <p>&copy; {new Date().getFullYear()} CogniCore Cognitive Training Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

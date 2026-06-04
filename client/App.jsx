import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

import SpeedTapGame from './components/SpeedTapGame';
import MemoryMatchGame from './components/MemoryMatchGame';
import FocusFinderGame from './components/FocusFinderGame';
import LogicLinkGame from './components/LogicLinkGame';
import MazeEscapeGame from './components/MazeEscapeGame';
import MatrixRecallGame from './components/MatrixRecallGame';
import StroopShiftGame from './components/StroopShiftGame';

// Register Chart.js modules
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [lastGameStats, setLastGameStats] = useState(null);
  const [portalView, setPortalView] = useState('participant'); // 'participant' | 'researcher'

  // Thesis Cohort evaluation states (Clinical Researcher)
  const [pretestInput, setPretestInput] = useState('72, 68, 75, 80, 65, 78, 70, 74, 82, 69');
  const [posttestInput, setPosttestInput] = useState('84, 76, 85, 88, 78, 88, 82, 84, 91, 80');
  const [evalResult, setEvalResult] = useState(null);
  const [evalError, setEvalError] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);

  // Classified cognitive profile archetype
  const [cognitiveProfile, setCognitiveProfile] = useState({
    archetype: 'Standard',
    confidence_score: 0.65
  });

  // Dynamic Skill Scores mapped to 4 core academic domains
  const [skills, setSkills] = useState({
    spatial_visual_memory: 75,
    logical_mathematical: 70,
    reflexes_and_focus: 65,
    executive_strategy: 60
  });

  // Update dynamic skills based on player game telemetry
  useEffect(() => {
    if (lastGameStats) {
      const calculatedScore = Math.round(lastGameStats.accuracy * 70 + lastGameStats.difficultyLevel * 6);
      
      if (lastGameStats.gameType === 'MemoryMatch' || lastGameStats.gameType === 'MatrixRecall') {
        setSkills(prev => ({
          ...prev,
          spatial_visual_memory: Math.max(calculatedScore, prev.spatial_visual_memory)
        }));
      } else if (lastGameStats.gameType === 'LogicLink') {
        setSkills(prev => ({
          ...prev,
          logical_mathematical: Math.max(calculatedScore, prev.logical_mathematical)
        }));
      } else if (lastGameStats.gameType === 'SpeedTap' || lastGameStats.gameType === 'FocusFinder' || lastGameStats.gameType === 'StroopShift') {
        setSkills(prev => ({
          ...prev,
          reflexes_and_focus: Math.max(calculatedScore, prev.reflexes_and_focus)
        }));
      } else if (lastGameStats.gameType === 'MazeEscape') {
        setSkills(prev => ({
          ...prev,
          executive_strategy: Math.max(calculatedScore, prev.executive_strategy)
        }));
      }

      // Update classifier profile info
      if (lastGameStats.cognitiveProfile) {
        setCognitiveProfile(lastGameStats.cognitiveProfile);
      }
    }
  }, [lastGameStats]);

  const handleGameFinished = (stats) => {
    setLastGameStats({ ...stats, gameType: activeGame });
  };

  const handleBackToLobby = () => {
    setActiveGame(null);
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

  // Determine lowest score for personalized recommendation
  const getRecommendation = () => {
    const lowestKey = Object.keys(skills).reduce((a, b) => skills[a] < skills[b] ? a : b);
    const recommendations = {
      spatial_visual_memory: {
        game: "Matrix Recall",
        reason: "Working spatial-visual memory capacity is below baseline",
        action: "train visual grid recall sequences"
      },
      logical_mathematical: {
        game: "Logic Link",
        reason: "Logical and sequential reasoning rate can be optimized",
        action: "train sequential node connection links"
      },
      reflexes_and_focus: {
        game: "Speed Tap",
        reason: "Vigilance reflexes and focus response time are your primary growth domains",
        action: "play speed tap target selection"
      },
      executive_strategy: {
        game: "Maze Escape",
        reason: "Executive spatial navigation and path planning show potential for optimization",
        action: "play maze escape spatial pathways"
      }
    };
    return recommendations[lowestKey] || recommendations.spatial_visual_memory;
  };

  const rec = getRecommendation();

  // Radar Chart Configuration data
  const radarData = {
    labels: [
      'Spatial-Visual Memory',
      'Logical-Mathematical Reasoning',
      'Reflexes & Attentional Focus',
      'Executive Strategy'
    ],
    datasets: [
      {
        label: 'Cognitive Proficiency',
        data: [
          skills.spatial_visual_memory,
          skills.logical_mathematical,
          skills.reflexes_and_focus,
          skills.executive_strategy
        ],
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: '#a855f7',
        borderWidth: 2,
        pointBackgroundColor: '#38bdf8',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#38bdf8'
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.08)'
        },
        pointLabels: {
          color: '#94a3b8',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 11,
            weight: 'bold'
          }
        },
        ticks: {
          color: '#64748b',
          backdropColor: 'transparent',
          font: {
            size: 9
          },
          stepSize: 20
        },
        min: 0,
        max: 100
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <div className="portal-container">
      {/* Top Header */}
      <header className="portal-header">
        <div className="logo-glow" onClick={() => { setActiveGame(null); setShowDashboard(false); setPortalView('participant'); }} style={{ cursor: 'pointer' }}>
          🧠 COGNICORE
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {activeGame === null && (
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button 
                onClick={() => { setPortalView('participant'); }}
                style={{
                  background: portalView === 'participant' ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                🎮 Participant Portal
              </button>
              <button 
                onClick={() => { setPortalView('researcher'); }}
                style={{
                  background: portalView === 'researcher' ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                🔬 Researcher Portal
              </button>
            </div>
          )}
          
          {activeGame === null && portalView === 'participant' && (
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
        ) : activeGame === 'MatrixRecall' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <MatrixRecallGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : activeGame === 'StroopShift' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <StroopShiftGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : portalView === 'researcher' ? (
          // ==========================================
          // CLINICAL RESEARCHER VIEW
          // ==========================================
          <div className="dashboard-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="intro-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2.25rem' }}>🔬 Clinical Research Portal</h1>
              <p>Execute Scipy-backed paired t-test cohort verifications and review statistical significance reports for experimental serious game evaluations.</p>
            </div>

            <h2 className="section-title">Thesis Verification Engine (Pillar 1 Research Design)</h2>
            <div className="game-card" style={{ width: '100%', alignItems: 'stretch', padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ fontWeight: 'bold', color: '#c084fc', fontSize: '0.9rem' }}>Pillar 1: Empirical Cognitive Improvement (Pretest-Posttest Design)</span>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Input pre-intervention and post-intervention scores for your research cohort. The backend will calculate the overall group Improvement Rate (%) and run a **Paired t-test** to calculate the t-statistic and p-value.
                </p>
              </div>

              {evalError && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{evalError}</div>}

              <div className="eval-inputs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
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
                      outline: 'none',
                      boxSizing: 'border-box'
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
                      outline: 'none',
                      boxSizing: 'border-box'
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
        ) : showDashboard ? (
          // ==========================================
          // PARTICIPANT ANALYTICS DASHBOARD
          // ==========================================
          <div className="dashboard-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="intro-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2.25rem' }}>Cognitive Performance Analytics</h1>
              <p>Real-time analytics collected across validated cognitive tracks. Evaluate skill scores, track multi-session trends, and view personalized reports.</p>
            </div>

            {/* Cognitive Skills Score Row */}
            <h2 className="section-title">Cognitive Domain Profiling</h2>
            <div className="game-grid" style={{ marginBottom: '3rem' }}>
              <div className="game-card" style={{ padding: '1.5rem', borderLeft: '4px solid #38bdf8' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Spatial-Visual Memory</span>
                <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#38bdf8' }}>{skills.spatial_visual_memory}/100</h3>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>Short-Term grid sequence recall and spatial working capacity.</p>
              </div>
              <div className="game-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Logical Reasoning</span>
                <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#f59e0b' }}>{skills.logical_mathematical}/100</h3>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>Logical sequencing, path optimization, and relational connections.</p>
              </div>
              <div className="game-card" style={{ padding: '1.5rem', borderLeft: '4px solid #a855f7' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Reflexes & Focus</span>
                <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#a855f7' }}>{skills.reflexes_and_focus}/100</h3>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>Continuous visual search, rapid target identification, and motor response.</p>
              </div>
              <div className="game-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Executive Strategy</span>
                <h3 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#10b981' }}>{skills.executive_strategy}/100</h3>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>Multi-step pathfinding and spatial maze escape navigation planning.</p>
              </div>
            </div>

            {/* Middle Row: Trend Vector SVG + Radar Chart */}
            <div className="dashboard-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              
              {/* Trend Vector SVG */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>📈 Multi-Session Progress Trend</h3>
                <div style={{ position: 'relative', height: '240px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    
                    <path d="M 10 120 L 90 95 L 170 110 L 250 80 L 330 65 L 410 75 L 490 35 L 490 120 Z" fill="url(#chartGrad)" />
                    <path 
                      d="M 10 120 L 90 95 L 170 110 L 250 80 L 330 65 L 410 75 L 490 35" 
                      fill="none" 
                      stroke="#a855f7" 
                      strokeWidth="3.5" 
                      filter="drop-shadow(0px 0px 5px rgba(168, 85, 247, 0.8))"
                    />
                    
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
                  <span>Latest (DDA Active)</span>
                </div>
              </div>

              {/* Cognitive Radar Chart */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>🕸️ Cognitive Domain Radar Chart</h3>
                <div style={{ position: 'relative', height: '240px' }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>
            </div>

            {/* Bottom Row: Behavioral Insights and Recommendations */}
            <div className="dashboard-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              
              {/* Cognitive Profile Card & Behavioral Insights */}
              <div className="game-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>👤 Classifier Profile & Behavioral Insights</h3>
                  <div style={{ textAlign: 'center', padding: '1rem 0 1.5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Classified Cognitive Profile Archetype</div>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.5rem 1.5rem',
                      borderRadius: '9999px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontWeight: 'bold',
                      marginTop: '0.5rem',
                      fontSize: '1.3rem'
                    }}>
                      {cognitiveProfile.archetype}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem', fontWeight: '500' }}>
                      Random Forest Model Confidence: {Math.round(cognitiveProfile.confidence_score * 100)}%
                    </div>
                  </div>

                  {/* Behavioral Analytics Insight Alerts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
                    {lastGameStats && lastGameStats.hesitation_ms >= 800 && lastGameStats.accuracy >= 0.85 && (
                      <div style={{ 
                        background: 'rgba(6, 182, 212, 0.08)', 
                        border: '1px solid rgba(6, 182, 212, 0.25)', 
                        padding: '0.85rem', 
                        borderRadius: '8px', 
                        color: '#22d3ee', 
                        fontSize: '0.825rem',
                        textAlign: 'left',
                        boxShadow: '0 0 10px rgba(6, 182, 212, 0.15)',
                        lineHeight: '1.4'
                      }}>
                        <strong>⚡ Methodical Assessment:</strong> Deliberate Processor: Exhibits methodical stimulus assessment patterns, prioritizing low-error execution over speed.
                      </div>
                    )}
                    {lastGameStats && lastGameStats.spam_click_count >= 3 && (
                      <div style={{ 
                        background: 'rgba(249, 115, 22, 0.08)', 
                        border: '1px solid rgba(249, 115, 22, 0.25)', 
                        padding: '0.85rem', 
                        borderRadius: '8px', 
                        color: '#fb923c', 
                        fontSize: '0.825rem',
                        textAlign: 'left',
                        boxShadow: '0 0 10px rgba(249, 115, 22, 0.15)',
                        lineHeight: '1.4'
                      }}>
                        <strong>⚠️ Frustration Alert:</strong> Impulsive Task Friction Identified: Real-time kinetic feedback indicates panic-driven or non-target execution behaviors during accelerated DDA challenge thresholds.
                      </div>
                    )}
                    {(!lastGameStats || (lastGameStats.hesitation_ms < 800 && lastGameStats.spam_click_count < 3)) && (
                      <div style={{ fontSize: '0.825rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
                        No acute behavioral anomalies or kinetic friction registered in current session. Play modules to stream live telemetry.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Skill Diagnostics & Recommendations */}
              <div className="game-card" style={{ justifyContent: 'space-between', boxSizing: 'border-box' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>🔍 Diagnostic Report</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '0.85rem' }}>💪 SKILL STRENGTH:</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        {skills.reflexes_and_focus >= 70 ? 'Rapid Visuomotor Attentional Focus. High reflexive reaction times and rapid target selection.' : 'Standard motor control latency. Stabilizing baseline performance.'}
                      </p>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '0.85rem' }}>⚠️ SKILL WEAKNESS:</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        {skills.spatial_visual_memory < 70 ? 'Short-Term Spatial sequence recall vigilance can be optimized under distractor noise.' : 'Working Memory retention logic is currently your secondary optimization track.'}
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
              <div className="game-card active" onClick={() => setActiveGame('SpeedTap')}>
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

              {/* Matrix Recall Active Card */}
              <div className="game-card active" onClick={() => setActiveGame('MatrixRecall')}>
                <div className="card-badge">Memory</div>
                <div className="card-icon">🔲</div>
                <h3>Matrix Recall</h3>
                <p>Designed to train spatial-visual memory recall and grid pattern retention capacity.</p>
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

              {/* Stroop Shift Active Card */}
              <div className="game-card active" onClick={() => setActiveGame('StroopShift')}>
                <div className="card-badge">Reflex & Focus</div>
                <div className="card-icon">🎨</div>
                <h3>Stroop Shift</h3>
                <p>Measures selective attention and cognitive control. Tap the ink/font color, override reading impulse.</p>
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

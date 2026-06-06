import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Radar, Line, Bar } from 'react-chartjs-2';

import SpeedTapGame from './components/SpeedTapGame';
import MemoryMatchGame from './components/MemoryMatchGame';
import FocusFinderGame from './components/FocusFinderGame';
import LogicLinkGame from './components/LogicLinkGame';
import MazeEscapeGame from './components/MazeEscapeGame';
import MatrixRecallGame from './components/MatrixRecallGame';
import StroopShiftGame from './components/StroopShiftGame';
import MentalFlexGame from './components/MentalFlexGame';
import EquationBalanceGame from './components/EquationBalanceGame';
import SequenceDecoderGame from './components/SequenceDecoderGame';
import RouteOptimizerGame from './components/RouteOptimizerGame';

// Register Chart.js modules
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
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

  // ISO 25010 states
  const [isoForm, setIsoForm] = useState({
    functionality_score: 5,
    usability_score: 5,
    reliability_score: 5,
    efficiency_score: 5,
    ux_score: 5
  });
  const [isoLoading, setIsoLoading] = useState(false);
  const [isoError, setIsoError] = useState(null);
  const [isoSuccess, setIsoSuccess] = useState(null);
  const [isoSummary, setIsoSummary] = useState(null);

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

  // Dashboard Visualizations (Option 2)
  const [activeDashboardUser, setActiveDashboardUser] = useState('player_one');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [latestSessionMetrics, setLatestSessionMetrics] = useState([]);
  const [cohortComparison, setCohortComparison] = useState(null);
  const [archetypeHistory, setArchetypeHistory] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState(null);

  const fetchDashboardData = async (username) => {
    setChartsLoading(true);
    setChartsError(null);
    try {
      // 1. Fetch user session history
      const historyRes = await fetch(`http://127.0.0.1:5000/api/user-session-history/${username}`);
      if (!historyRes.ok) throw new Error('Failed to load session history.');
      const historyData = await historyRes.json();
      const sessions = historyData.sessions || [];
      setSessionHistory(sessions);

      // 2. Fetch latest session metrics if a session exists
      if (sessions.length > 0) {
        const latestSid = sessions[0].session_id;
        const metricsRes = await fetch(`http://127.0.0.1:5000/api/session-metrics/${latestSid}`);
        if (!metricsRes.ok) throw new Error('Failed to load latest session metrics.');
        const metricsData = await metricsRes.json();
        setLatestSessionMetrics(metricsData.metrics || []);
      } else {
        setLatestSessionMetrics([]);
      }

      // 3. Fetch cohort comparison
      const compRes = await fetch(`http://127.0.0.1:5000/api/cohort-comparison/${username}`);
      if (!compRes.ok) throw new Error('Failed to load cohort comparison.');
      const compData = await compRes.json();
      setCohortComparison(compData);

      // 4. Fetch archetype history progression (Option 3)
      const progressionRes = await fetch(`http://127.0.0.1:5000/api/archetype-progression/${username}`);
      if (!progressionRes.ok) throw new Error('Failed to load archetype progression.');
      const progressionData = await progressionRes.json();
      setArchetypeHistory(progressionData.history || []);

    } catch (err) {
      console.error('[Dashboard Charts] Data fetch failed:', err);
      setChartsError(err.message);
    } finally {
      setChartsLoading(false);
    }
  };

  // Fetch charts data when dashboard is opened or when new game is finished (updates stats) or activeUser changes
  useEffect(() => {
    if (showDashboard && activeDashboardUser) {
      fetchDashboardData(activeDashboardUser);
    }
  }, [showDashboard, activeDashboardUser, lastGameStats]);

  // Update dynamic skills based on player game telemetry
  useEffect(() => {
    if (lastGameStats) {
      const calculatedScore = Math.round(lastGameStats.accuracy * 70 + lastGameStats.difficultyLevel * 6);
      
      if (lastGameStats.gameType === 'MemoryMatch' || lastGameStats.gameType === 'MatrixRecall') {
        setSkills(prev => ({
          ...prev,
          spatial_visual_memory: Math.max(calculatedScore, prev.spatial_visual_memory)
        }));
      } else if (lastGameStats.gameType === 'LogicLink' || lastGameStats.gameType === 'EquationBalance' || lastGameStats.gameType === 'SequenceDecoder' || lastGameStats.gameType === 'RouteOptimizer') {
        setSkills(prev => ({
          ...prev,
          logical_mathematical: Math.max(calculatedScore, prev.logical_mathematical)
        }));
      } else if (lastGameStats.gameType === 'SpeedTap' || lastGameStats.gameType === 'FocusFinder' || lastGameStats.gameType === 'StroopShift') {
        setSkills(prev => ({
          ...prev,
          reflexes_and_focus: Math.max(calculatedScore, prev.reflexes_and_focus)
        }));
      } else if (lastGameStats.gameType === 'MazeEscape' || lastGameStats.gameType === 'MentalFlex') {
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

  const loadDatabaseCohort = async () => {
    setEvalLoading(true);
    setEvalError(null);
    setEvalResult(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/cohort-db-scores');
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        if (data.count === 0) {
          throw new Error("No clinical cohort subjects found in database. Run seed utility first.");
        }
        setPretestInput(data.pretest_scores.join(', '));
        setPosttestInput(data.posttest_scores.join(', '));
      } else {
        throw new Error(data.message || 'Failed to pull cohort scores.');
      }
    } catch (e) {
      console.error(e);
      setEvalError(`Failed to load database cohort: ${e.message}`);
    } finally {
      setEvalLoading(false);
    }
  };

  // Fetch ISO summary
  const fetchIsoSummary = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/iso-evaluations/summary');
      if (!response.ok) throw new Error('Failed to fetch ISO summary');
      const data = await response.json();
      if (data.status === 'success') {
        setIsoSummary(data.summary);
      }
    } catch (e) {
      console.error("Error fetching ISO summary:", e);
    }
  };

  // Run ISO fetch when switching to researcher view
  useEffect(() => {
    if (portalView === 'researcher') {
      fetchIsoSummary();
    }
  }, [portalView]);

  // Submit ISO Evaluation
  const submitIsoEvaluation = async (e) => {
    if (e) e.preventDefault();
    setIsoLoading(true);
    setIsoError(null);
    setIsoSuccess(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/iso-evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(isoForm)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        setIsoSuccess('ISO 25010 evaluation recorded successfully!');
        // Refresh summary stats
        fetchIsoSummary();
        // Reset form
        setIsoForm({
          functionality_score: 5,
          usability_score: 5,
          reliability_score: 5,
          efficiency_score: 5,
          ux_score: 5
        });
      } else {
        throw new Error(data.message || 'Evaluation submission failed.');
      }
    } catch (e) {
      console.error(e);
      setIsoError(`Failed to submit evaluation: ${e.message}`);
    } finally {
      setIsoLoading(false);
    }
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

  const lineChartData = {
    labels: latestSessionMetrics.map((_, index) => `R${index + 1}`),
    datasets: [
      {
        label: 'Difficulty Level',
        data: latestSessionMetrics.map(m => m.difficulty_level),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderWidth: 3,
        yAxisID: 'yDiff',
        tension: 0.15,
        pointBackgroundColor: '#a855f7',
        pointRadius: 4
      },
      {
        label: 'Reaction Time (ms)',
        data: latestSessionMetrics.map(m => m.reaction_time_ms),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
        borderWidth: 2,
        yAxisID: 'yRt',
        tension: 0.2,
        pointBackgroundColor: '#38bdf8',
        pointRadius: 3,
        borderDash: [5, 5]
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e2e8f0', boxWidth: 10, font: { size: 10 } }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 9 } }
      },
      yDiff: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 1,
        max: 5,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { 
          color: '#c084fc',
          stepSize: 1,
          font: { size: 9 }
        },
        title: {
          display: true,
          text: 'Level',
          color: '#c084fc',
          font: { size: 10, weight: 'bold' }
        }
      },
      yRt: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        grid: { drawOnChartArea: false },
        ticks: { color: '#38bdf8', font: { size: 9 } },
        title: {
          display: true,
          text: 'RT (ms)',
          color: '#38bdf8',
          font: { size: 10, weight: 'bold' }
        }
      }
    }
  };

  const userRt = cohortComparison?.user_averages?.reaction_time_ms || 0;
  const userAcc = (cohortComparison?.user_averages?.accuracy_rate || 0) * 100;
  const cohortRt = cohortComparison?.cohort_averages?.reaction_time_ms || 0;
  const cohortAcc = (cohortComparison?.cohort_averages?.accuracy_rate || 0) * 100;

  const barChartData = {
    labels: ['Active User', 'Cohort Avg'],
    datasets: [
      {
        label: 'RT (ms)',
        data: [userRt, cohortRt],
        backgroundColor: 'rgba(56, 189, 248, 0.75)',
        borderColor: '#38bdf8',
        borderWidth: 1.5,
        yAxisID: 'yRt',
        borderRadius: 4
      },
      {
        label: 'Accuracy (%)',
        data: [userAcc, cohortAcc],
        backgroundColor: 'rgba(34, 197, 94, 0.75)',
        borderColor: '#22c55e',
        borderWidth: 1.5,
        yAxisID: 'yAcc',
        borderRadius: 4
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e2e8f0', boxWidth: 10, font: { size: 10 } }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      yRt: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#38bdf8', font: { size: 9 } },
        title: {
          display: true,
          text: 'RT (ms)',
          color: '#38bdf8',
          font: { size: 10, weight: 'bold' }
        }
      },
      yAcc: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: { color: '#22c55e', font: { size: 9 } },
        title: {
          display: true,
          text: 'Accuracy (%)',
          color: '#22c55e',
          font: { size: 10, weight: 'bold' }
        }
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
        ) : activeGame === 'MentalFlex' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <MentalFlexGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : activeGame === 'EquationBalance' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <EquationBalanceGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : activeGame === 'SequenceDecoder' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <SequenceDecoderGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : activeGame === 'RouteOptimizer' ? (
          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <RouteOptimizerGame username="player_one" apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />
            </div>
          </div>
        ) : portalView === 'researcher' ? (
          // ==========================================
          // CLINICAL RESEARCHER VIEW
          // ==========================================
          <div className="dashboard-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="intro-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <h1 style={{ fontSize: '2.25rem' }}>🔬 Clinical Research Portal</h1>
              <p style={{ maxWidth: '800px', margin: '0 auto' }}>Execute Scipy-backed paired t-test cohort verifications and review statistical significance reports for experimental serious game evaluations.</p>
              <a 
                href="http://127.0.0.1:5000/api/export-csv" 
                download
                className="dashboard-toggle-btn"
                style={{
                  background: 'linear-gradient(to right, #10b981, #059669)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}
                onMouseOver={(e) => e.target.style.filter = "brightness(1.1)"}
                onMouseOut={(e) => e.target.style.filter = "brightness(1.0)"}
              >
                📥 Download Cohort Telemetry Report (.CSV)
              </a>
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
                <button 
                  onClick={loadDatabaseCohort}
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
                  Load Seeded Cohort (n=30)
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

            <h2 className="section-title" style={{ marginTop: '2.5rem' }}>ISO 25010 Evaluation & Questionnaire (Pillar 2 Research Design)</h2>
            <div className="eval-inputs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem', alignItems: 'start' }}>
              
              {/* Column 1: The Interactive Questionnaire Form */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', padding: '2rem' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem' }}>📋 Submit ISO 25010 Assessment</h3>
                
                {isoSuccess && (
                  <div style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                    {isoSuccess}
                  </div>
                )}
                {isoError && (
                  <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {isoError}
                  </div>
                )}

                <form onSubmit={submitIsoEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Functionality Score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>1. Functional Suitability</span>
                      <span style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 'bold' }}>{isoForm.functionality_score} / 5</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Are all target cognitive domains and corresponding game tasks fully implemented and operational?</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={`func-${val}`}
                          type="button"
                          onClick={() => setIsoForm(prev => ({ ...prev, functionality_score: val }))}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0',
                            background: isoForm.functionality_score === val ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid ' + (isoForm.functionality_score === val ? 'transparent' : 'rgba(255, 255, 255, 0.1)'),
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Usability Score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>2. Usability</span>
                      <span style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 'bold' }}>{isoForm.usability_score} / 5</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Is the user interface layout intuitive and user inputs processed easily?</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={`usab-${val}`}
                          type="button"
                          onClick={() => setIsoForm(prev => ({ ...prev, usability_score: val }))}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0',
                            background: isoForm.usability_score === val ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid ' + (isoForm.usability_score === val ? 'transparent' : 'rgba(255, 255, 255, 0.1)'),
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reliability Score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>3. Reliability</span>
                      <span style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 'bold' }}>{isoForm.reliability_score} / 5</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Do adaptive DDA loops and machine learning archetypes determine profiles reliably?</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={`rel-${val}`}
                          type="button"
                          onClick={() => setIsoForm(prev => ({ ...prev, reliability_score: val }))}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0',
                            background: isoForm.reliability_score === val ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid ' + (isoForm.reliability_score === val ? 'transparent' : 'rgba(255, 255, 255, 0.1)'),
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Efficiency Score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>4. Performance Efficiency</span>
                      <span style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 'bold' }}>{isoForm.efficiency_score} / 5</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Are telemetry endpoints and database reads/writes running with low response latency?</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={`eff-${val}`}
                          type="button"
                          onClick={() => setIsoForm(prev => ({ ...prev, efficiency_score: val }))}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0',
                            background: isoForm.efficiency_score === val ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid ' + (isoForm.efficiency_score === val ? 'transparent' : 'rgba(255, 255, 255, 0.1)'),
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UX Score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>5. User Experience (UX) Satisfaction</span>
                      <span style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 'bold' }}>{isoForm.ux_score} / 5</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Does the platform feel visually appealing, premium, and satisfying to play?</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={`ux-${val}`}
                          type="button"
                          onClick={() => setIsoForm(prev => ({ ...prev, ux_score: val }))}
                          style={{
                            flex: 1,
                            padding: '0.5rem 0',
                            background: isoForm.ux_score === val ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid ' + (isoForm.ux_score === val ? 'transparent' : 'rgba(255, 255, 255, 0.1)'),
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isoLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(to right, #a855f7, #38bdf8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginTop: '0.5rem',
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 12px rgba(168, 85, 247, 0.25)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isoLoading ? 'Recording Assessment...' : 'Submit Evaluation'}
                  </button>
                </form>
              </div>

              {/* Column 2: Live ISO 25010 Summary Dashboard */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', padding: '2rem' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem' }}>📊 Live Quality Metric Summary</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                  Aggregate statistical quality indicators across all submitted researcher evaluations. This supplies real-time telemetry details for thesis verification.
                </p>

                {isoSummary && isoSummary.count > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Overall Evaluations Count Badge */}
                    <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f8fafc' }}>Total Submitted Evaluations</span>
                      <span style={{ background: '#38bdf8', color: '#09090b', fontWeight: '900', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.95rem' }}>n = {isoSummary.count}</span>
                    </div>

                    {/* Progress Bars for averages */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      
                      {/* Functional Suitability Avg */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: '500' }}>Functional Suitability</span>
                          <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{isoSummary.avg_functionality} / 5</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(isoSummary.avg_functionality / 5) * 100}%`, background: 'linear-gradient(to right, #38bdf8, #a855f7)', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Usability Avg */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: '500' }}>Usability</span>
                          <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{isoSummary.avg_usability} / 5</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(isoSummary.avg_usability / 5) * 100}%`, background: 'linear-gradient(to right, #38bdf8, #a855f7)', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Reliability Avg */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: '500' }}>Reliability</span>
                          <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{isoSummary.avg_reliability} / 5</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(isoSummary.avg_reliability / 5) * 100}%`, background: 'linear-gradient(to right, #38bdf8, #a855f7)', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Efficiency Avg */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: '500' }}>Performance Efficiency</span>
                          <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{isoSummary.avg_efficiency} / 5</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(isoSummary.avg_efficiency / 5) * 100}%`, background: 'linear-gradient(to right, #38bdf8, #a855f7)', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* UX Avg */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: '500' }}>UX Satisfaction</span>
                          <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{isoSummary.avg_ux} / 5</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(isoSummary.avg_ux / 5) * 100}%`, background: 'linear-gradient(to right, #38bdf8, #a855f7)', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                    </div>

                    {/* Overall Average Quality Score Indicator */}
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(168, 85, 247, 0.05)',
                      border: '1px solid rgba(168, 85, 247, 0.15)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 'bold' }}>Overall Quality Rating</div>
                      <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff', marginTop: '0.25rem' }}>
                        {((isoSummary.avg_functionality + isoSummary.avg_usability + isoSummary.avg_reliability + isoSummary.avg_efficiency + isoSummary.avg_ux) / 5).toFixed(2)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ 5</span>
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                        Excellent compliance across ISO 25010 metrics targets.
                      </p>
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
                    No evaluations submitted yet. Use the questionnaire form to submit the first entry.
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : showDashboard ? (
          // ==========================================
          // PARTICIPANT ANALYTICS DASHBOARD
          // ==========================================
          <div className="dashboard-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="intro-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'stretch' }}>
              <div>
                <h1 style={{ fontSize: '2.25rem', margin: 0 }}>Cognitive Performance Analytics</h1>
                <p style={{ margin: '0.5rem 0 0 0' }}>Real-time analytics collected across validated cognitive tracks. Evaluate skill scores, track multi-session trends, and view personalized reports.</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem 1.25rem', borderRadius: '10px', width: 'fit-content', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'bold' }}>👤 Participant Selector:</span>
                <input 
                  type="text" 
                  value={activeDashboardUser} 
                  onChange={(e) => setActiveDashboardUser(e.target.value)} 
                  placeholder="e.g. player_one" 
                  style={{
                    background: '#09090b',
                    border: '1.5px solid #4c1d95',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    width: '180px',
                    transition: 'border-color 0.2s'
                  }}
                />
                <button
                  onClick={() => fetchDashboardData(activeDashboardUser)}
                  disabled={chartsLoading}
                  style={{
                    background: 'linear-gradient(to right, #a855f7, #38bdf8)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    opacity: chartsLoading ? 0.6 : 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 10px rgba(168, 85, 247, 0.2)'
                  }}
                  onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                  onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
                >
                  {chartsLoading ? 'Loading...' : '🔄 Load Metrics'}
                </button>
              </div>
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
              
              {/* Difficulty Adaptation Plot */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>📈 Difficulty Adaptation History</h3>
                <div style={{ position: 'relative', height: '240px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                      Loading line metrics...
                    </div>
                  ) : latestSessionMetrics.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                      <span>No play metrics found in current session.</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Launch and play a game to stream DDA data.</span>
                    </div>
                  ) : (
                    <Line data={lineChartData} options={lineChartOptions} />
                  )}
                </div>
              </div>

              {/* Cohort Comparison Plot */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>📊 Cohort Comparison (vs Clinical)</h3>
                <div style={{ position: 'relative', height: '240px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                      Loading comparison data...
                    </div>
                  ) : !cohortComparison || (cohortComparison.user_averages.reaction_time_ms === 0 && cohortComparison.user_averages.accuracy_rate === 0) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                      <span>No user averages computed yet.</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Complete sessions to compare vs clinical database.</span>
                    </div>
                  ) : (
                    <Bar data={barChartData} options={barChartOptions} />
                  )}
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

              {/* Archetype Progression Timeline Card (Option 3) */}
              <div className="game-card" style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minHeight: '320px', justifyContent: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>⏱️ Archetype Progression Timeline</h3>
                
                {chartsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                    Loading progression timeline...
                  </div>
                ) : archetypeHistory.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1rem', flex: 1 }}>
                    <span>No historical progression logs recorded.</span>
                    <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Complete adaptive training sessions to trace profile progression.</span>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.25rem', 
                    maxHeight: '260px', 
                    overflowY: 'auto', 
                    paddingRight: '0.5rem',
                    textAlign: 'left',
                    flex: 1
                  }}>
                    {archetypeHistory.map((item, idx) => {
                      // Color mapping for archetypes
                      let badgeColor = 'rgba(168, 85, 247, 0.15)'; // purple
                      let textColor = '#c084fc';
                      let borderColor = 'rgba(168, 85, 247, 0.3)';

                      if (item.archetype_name === 'Advanced') {
                        badgeColor = 'rgba(34, 197, 94, 0.15)'; // green
                        textColor = '#4ade80';
                        borderColor = 'rgba(34, 197, 94, 0.3)';
                      } else if (item.archetype_name === 'Beginner') {
                        badgeColor = 'rgba(239, 68, 68, 0.15)'; // red
                        textColor = '#f87171';
                        borderColor = 'rgba(239, 68, 68, 0.3)';
                      } else if (item.archetype_name === 'Standard') {
                        badgeColor = 'rgba(56, 189, 248, 0.15)'; // blue
                        textColor = '#38bdf8';
                        borderColor = 'rgba(56, 189, 248, 0.3)';
                      }

                      return (
                        <div key={item.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                          {/* Timeline vertical connector line */}
                          {idx < archetypeHistory.length - 1 && (
                            <div style={{
                              position: 'absolute',
                              left: '9px',
                              top: '20px',
                              bottom: '-25px',
                              width: '2px',
                              background: 'rgba(255, 255, 255, 0.08)'
                            }} />
                          )}

                          {/* Dot indicator */}
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: textColor,
                            marginTop: '6px',
                            boxShadow: `0 0 8px ${textColor}`,
                            flexShrink: 0,
                            marginLeft: '5px'
                          }} />

                          {/* Content block */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ 
                                display: 'inline-block',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: badgeColor,
                                border: `1.5px solid ${borderColor}`,
                                color: textColor,
                                fontSize: '0.725rem',
                                fontWeight: 'bold'
                              }}>
                                {item.archetype_name}
                              </span>
                              <span style={{ fontSize: '0.675rem', color: '#64748b' }}>
                                {item.timestamp ? item.timestamp.split(' ')[0] : ''}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '0.25rem' }}>
                              Played <strong style={{ color: '#ffffff' }}>{item.game_type}</strong> (Session {item.session_id})
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              Model Confidence: {Math.round(item.confidence_score * 100)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

            <h2 className="section-title">Available Training Modules by Domain</h2>

            {/* Category 1: Reflexes & Focus */}
            <div className="category-container theme-reflex">
              <div className="category-header-wrapper">
                <span className="category-title">⚡ Reflexes & Attentional Focus</span>
                <p className="category-description">Assesses visuomotor response latencies, continuous visual search efficiency, and response inhibition control in variable-distractor environments.</p>
              </div>
              <div className="game-grid" style={{ marginBottom: '3.5rem' }}>
                <div className="game-card theme-reflex active" onClick={() => setActiveGame('SpeedTap')}>
                  <div className="card-target-tag">Processing Speed</div>
                  <div className="card-icon">⚡</div>
                  <h3>Speed Tap</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Identify and select highlighted target boxes under a ticking clock.</li>
                    <li>Exercise rapid response inhibition by avoiding distractor elements.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Speeds up motor reflexes and decision making under time pressure, reducing error rate when multi-tasking.
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>

                <div className="game-card theme-reflex active" onClick={() => setActiveGame('FocusFinder')}>
                  <div className="card-target-tag">Selective Attention</div>
                  <div className="card-icon">🎯</div>
                  <h3>Focus Finder</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Scan cluttered graphical fields to identify active target points.</li>
                    <li>Train continuous visual vigilance under distracting layouts.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Enhances selective visual search in busy environments (e.g. scanning files or finding objects on store shelves).
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>

                <div className="game-card theme-reflex active" onClick={() => setActiveGame('StroopShift')}>
                  <div className="card-target-tag">Cognitive Control</div>
                  <div className="card-icon">🎨</div>
                  <h3>Stroop Shift</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Override standard reading impulse and select the font/ink color.</li>
                    <li>Resist semantic word distractions during cognitive conflict.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Filters out conversational background noise or notifications to maintain high attentional focus on primary work tasks.
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>
              </div>
            </div>

            {/* Category 2: Spatial-Visual Memory */}
            <div className="category-container theme-memory">
              <div className="category-header-wrapper">
                <span className="category-title">🧩 Spatial-Visual Memory</span>
                <p className="category-description">Assesses working memory capacity, spatial orientation, and visual retention of short-term pattern arrays.</p>
              </div>
              <div className="game-grid" style={{ marginBottom: '3.5rem' }}>
                <div className="game-card theme-memory active" onClick={() => setActiveGame('MemoryMatch')}>
                  <div className="card-target-tag">Working Memory</div>
                  <div className="card-icon">🧩</div>
                  <h3>Memory Match</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Flip tiles to find matching pairs in a grid layout.</li>
                    <li>Recall tile positions and track matching trials.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Strengthens visual recall and short-term working retention, supporting mental math calculations and instructions list retention.
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>

                <div className="game-card theme-memory active" onClick={() => setActiveGame('MatrixRecall')}>
                  <div className="card-target-tag">Spatial Retention</div>
                  <div className="card-icon">🔲</div>
                  <h3>Matrix Recall</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Observe grid pattern sequences highlighted for brief intervals.</li>
                    <li>Reconstruct pattern coordinates in exact visual order.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Improves spatial orientation and mental navigation mapping, aiding recall of location coordinates and physical layouts.
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>
              </div>
            </div>

            {/* Category 3: Logical Reasoning */}
            <div className="category-container theme-reasoning">
              <div className="category-header-wrapper">
                <span className="category-title">🔗 Logical Reasoning & Sequence Logic</span>
                <p className="category-description">Assesses analytical sequencing abilities, logical node linking, and spatial path calculation.</p>
              </div>
              <div className="game-grid" style={{ marginBottom: '3.5rem' }}>
                <div className="game-card theme-reasoning active" onClick={() => setActiveGame('LogicLink')}>
                  <div className="card-target-tag">Inductive Logic</div>
                  <div className="card-icon">🔗</div>
                  <h3>Logic Link</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Connect nodes in exact ascending sequence.</li>
                    <li>Calculate path layouts avoiding node collisions.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Exercises logical path planning, pattern recognition, and mathematical structured problem solving in complex systems.
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>

                {/* Equation Balance Card */}
                <div className="game-card theme-reasoning active" onClick={() => setActiveGame('EquationBalance')}>
                  <div className="card-target-tag">Deductive Logic</div>
                  <div className="card-icon">🧮</div>
                  <h3>Equation Balance</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Select the correct operator or number to balance equations.</li>
                    <li>Solve procedural arithmetic equations under a ticking clock.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Accelerates mental math estimation, improves quantitative deduction speeds, and supports quick numerical calculations.
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>

                {/* Sequence Decoder Card */}
                <div className="game-card theme-reasoning active" onClick={() => setActiveGame('SequenceDecoder')}>
                  <div className="card-target-tag">Inductive Reasoning</div>
                  <div className="card-icon">🧩</div>
                  <h3>Sequence Decoder</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Observe a series of values following a hidden rule.</li>
                    <li>Identify the pattern and select the correct missing element.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Trains inductive abstraction: the ability to extract a general rule from specific observations — critical for analytical and scientific reasoning.
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>

                {/* Route Optimizer Card */}
                <div className="game-card theme-reasoning active" onClick={() => setActiveGame('RouteOptimizer')}>
                  <div className="card-target-tag">Combinatorial Logic</div>
                  <div className="card-icon">🕸️</div>
                  <h3>Route Optimizer</h3>

                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Navigate a weighted network from START to END.</li>
                    <li>Click through nodes to build the lowest-cost route.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Builds combinatorial optimization reasoning: evaluating multiple path trade-offs simultaneously — a skill used in logistics, resource planning, and decision analysis.
                  </div>

                  <button className="play-btn">Launch Module</button>
                </div>
              </div>
            </div>

            {/* Category 4: Executive Strategy & Flexibility */}
            <div className="category-container theme-executive">
              <div className="category-header-wrapper">
                <span className="category-title">🌀 Executive Strategy & Flexibility</span>
                <p className="category-description">Assesses set-shifting abilities, pathfinding strategies, and adaptability to sudden rules modifications.</p>
              </div>
              <div className="game-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="game-card theme-executive active" onClick={() => setActiveGame('MazeEscape')}>
                  <div className="card-target-tag">Problem Solving</div>
                  <div className="card-icon">🧭</div>
                  <h3>Maze Escape</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Navigate a character through complex visual grids.</li>
                    <li>Solve optimal escape routes and bypass barrier elements.</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Builds strategic path planning and forward-looking executive thinking for spatial navigation and route optimization.
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>

                <div className="game-card theme-executive active" onClick={() => setActiveGame('MentalFlex')}>
                  <div className="card-target-tag">Set-Shifting</div>
                  <div className="card-icon">🌀</div>
                  <h3>Mental Flex</h3>
                  
                  <div className="card-section-label">Objective & Goal</div>
                  <ul className="card-purpose-list">
                    <li>Match a central target query against multiple selection options.</li>
                    <li>Adapt swiftly to changing matching rules (color, shape, or count).</li>
                  </ul>

                  <div className="card-section-label">How it helps us</div>
                  <div className="card-benefit-box">
                    Reduces cognitive friction during rapid task switching, allowing you to transition between topics or tools seamlessly.
                  </div>
                  
                  <button className="play-btn">Launch Module</button>
                </div>
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

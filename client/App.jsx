import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
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
  Title,
  ScatterController
} from 'chart.js';
import { Radar, Line, Bar, Scatter } from 'react-chartjs-2';

import LiveDdaHud from './components/LiveDdaHud';
import ErrorBoundary from './components/ErrorBoundary';
import useCogniStore from './store/useCogniStore';
import Shop from './components/Shop';
import RewardModal from './components/RewardModal';
import LeaderboardModal from './components/LeaderboardModal';
import ProfileModal from './components/ProfileModal';
import DailyRewardModal from './components/DailyRewardModal';
import AchievementToast from './components/AchievementToast';
import DailyQuests from './components/DailyQuests';
import PretestResults from './components/PretestResults';
import SeizureDisclaimerModal from './components/SeizureDisclaimerModal';

const SpeedTapGame = lazy(() => import('./components/SpeedTapGame'));
const MemoryMatchGame = lazy(() => import('./components/MemoryMatchGame'));
const FocusFinderGame = lazy(() => import('./components/FocusFinderGame'));
const LogicLinkGame = lazy(() => import('./components/LogicLinkGame'));
const PriorityQueueGame = lazy(() => import('./components/PriorityQueueGame'));
const MatrixRecallGame = lazy(() => import('./components/MatrixRecallGame'));
const StroopShiftGame = lazy(() => import('./components/StroopShiftGame'));
const MentalFlexGame = lazy(() => import('./components/MentalFlexGame'));
const EquationBalanceGame = lazy(() => import('./components/EquationBalanceGame'));
const SequenceDecoderGame = lazy(() => import('./components/SequenceDecoderGame'));
const RouteOptimizerGame = lazy(() => import('./components/RouteOptimizerGame'));
const NeuroMazeGame = lazy(() => import('./components/NeuroMazeGame'));
const NeuralNBackGame = lazy(() => import('./components/NeuralNBackGame'));
const SynapseSpinGame = lazy(() => import('./components/SynapseSpinGame'));
const NexusMapperGame = lazy(() => import('./components/NexusMapperGame'));
import { audioDda } from './utils/audioSynth';
import audioEngine from './utils/audioEngine';
import { API_BASE } from './utils/api';


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
  Title,
  ScatterController
);

ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = 'system-ui, -apple-system, sans-serif';
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
ChartJS.defaults.plugins.tooltip.titleColor = '#f8fafc';
ChartJS.defaults.plugins.tooltip.bodyColor = '#e2e8f0';
ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(56, 189, 248, 0.3)';
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.padding = 12;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.tooltip.displayColors = true;
ChartJS.defaults.plugins.tooltip.boxPadding = 6;

const ProgressRing = ({ radius, stroke, progress, color }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(1, Math.max(0, progress)) * circumference);

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      style={{ transform: 'rotate(-90deg)', display: 'block' }}
    >
      <circle
        stroke="rgba(255, 255, 255, 0.05)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};

const DOMAIN_INFO = {
  reflexes_and_focus: { title: 'Reflexes & Focus', color: '#38bdf8', icon: '⚡' },
  spatial_visual_memory: { title: 'Memory & Recall', color: '#4ade80', icon: '🧠' },
  logical_mathematical: { title: 'Logical Reasoning', color: '#f59e0b', icon: '🔢' },
  executive_strategy: { title: 'Executive Strategy', color: '#a855f7', icon: '🧭' }
};

const DOMAIN_THEMES = {
  reflex: {
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.25)',
    btnGlow: 'rgba(56, 189, 248, 0.4)',
    bg: 'rgba(56, 189, 248, 0.03)',
    btnGradient: 'linear-gradient(to right, #38bdf8, #60a5fa)'
  },
  memory: {
    color: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.25)',
    btnGlow: 'rgba(74, 222, 128, 0.4)',
    bg: 'rgba(74, 222, 128, 0.03)',
    btnGradient: 'linear-gradient(to right, #4ade80, #34d399)'
  },
  reasoning: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)',
    btnGlow: 'rgba(245, 158, 11, 0.4)',
    bg: 'rgba(245, 158, 11, 0.03)',
    btnGradient: 'linear-gradient(to right, #f59e0b, #fbbf24)'
  },
  executive: {
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.25)',
    btnGlow: 'rgba(168, 85, 247, 0.4)',
    bg: 'rgba(168, 85, 247, 0.03)',
    btnGradient: 'linear-gradient(to right, #a855f7, #c084fc)'
  }
};

const DOMAINS_LIST = [
  {
    id: 'reflexes_and_focus',
    themeClass: 'reflex',
    title: 'Reflex & Attentional Focus',
    icon: '⚡',
    description: 'Improve your reaction time, focus, and ability to ignore distractions under pressure.',
    games: [
      {
        id: 'SpeedTap',
        title: 'Speed Tap',
        icon: '⚡',
        objective: 'Quickly tap the highlighted targets before time runs out, while ignoring the wrong ones.',
        benefit: 'Helps you make faster decisions and react quicker in fast-paced situations.'
      },
      {
        id: 'FocusFinder',
        title: 'Focus Finder',
        icon: '🎯',
        objective: 'Find the hidden targets moving around in a crowded, messy space.',
        benefit: 'Improves your ability to focus on what matters in a busy environment.'
      },
      {
        id: 'StroopShift',
        title: 'Stroop Shift',
        icon: '🎨',
        objective: 'Pick the correct color while ignoring tricky mismatched words (like the word "RED" painted in blue).',
        benefit: 'Trains your brain to overcome confusion and switch tasks easily.'
      }
    ]
  },
  {
    id: 'spatial_visual_memory',
    themeClass: 'memory',
    title: 'Spatial-Visual Memory',
    icon: '🧠',
    description: 'Boost your ability to remember patterns, shapes, and where things are located.',
    games: [
      {
        id: 'MemoryMatch',
        title: 'Memory Match',
        icon: '🃏',
        objective: 'Flip and match pairs of hidden cards on a grid.',
        benefit: 'Helps you remember information longer and recall visual details quickly.'
      },
      {
        id: 'MatrixRecall',
        title: 'Matrix Recall',
        icon: '🔲',
        objective: 'Observe grid pattern sequences highlighted for brief intervals and reconstruct coordinates.',
        benefit: 'Improves spatial orientation and visual-spatial short-term working retention.'
      },
      {
        id: 'NeuralNBack',
        title: 'Neural N-Back',
        icon: '🧩',
        objective: 'Track visual element sequences and identify target matches located N steps backwards.',
        benefit: 'Exercises active mental template updates, temporal processing, and continuous memory storage.',
        inProgress: true
      },
      {
        id: 'SynapseSpin',
        title: 'Synapse Spin',
        icon: '🔄',
        objective: 'Compare visual geometric shapes and rotate them mentally to identify matching templates.',
        benefit: 'Boosts spatial manipulation speed, mental rotation, and spatial configuration logic.'
      },
      {
        id: 'NexusMapper',
        title: 'Nexus Mapper',
        icon: '🗺️',
        objective: 'Memorize visual objects placed in complex network nodes and recall locations.',
        benefit: 'Enhances associative object-location memory bindings and structural retention.'
      }
    ]
  },
  {
    id: 'logical_mathematical',
    themeClass: 'reasoning',
    title: 'Logical-Mathematical Reasoning',
    icon: '🔢',
    description: 'Sharpen your math skills, problem-solving abilities, and logical thinking.',
    games: [
      {
        id: 'LogicLink',
        title: 'Logic Link',
        icon: '🔗',
        objective: 'Connect the dots in order without crossing lines.',
        benefit: 'Trains you to plan ahead and solve tricky puzzles efficiently.'
      },
      {
        id: 'EquationBalance',
        title: 'Equation Balance',
        icon: '⚖️',
        objective: 'Figure out the missing numbers or symbols to balance the scale.',
        benefit: 'Makes you faster and more confident with everyday math and logic.'
      },
      {
        id: 'SequenceDecoder',
        title: 'Sequence Decoder',
        icon: '🔢',
        objective: 'Examine numeric sequences (e.g. geometric, Fibonacci) and infer missing patterns.',
        benefit: 'Strengthens inductive logical reasoning, sequence detection, and mathematical extrapolation.'
      },
      {
        id: 'RouteOptimizer',
        title: 'Route Optimizer',
        icon: '📍',
        objective: 'Determine the absolute shortest route visiting all destination nodes under a time limit.',
        benefit: 'Trains combinatorial logic, spatial graph reasoning, and planning efficiency.'
      }
    ]
  },
  {
    id: 'executive_strategy',
    themeClass: 'executive',
    title: 'Executive Strategy & Planning',
    icon: '🧭',
    description: 'Train adaptive executive control, dynamic plan correction, card matching rule-switching, and decision confidence.',
    games: [
      {
        id: 'PriorityQueue',
        title: 'Priority Queue',
        icon: '📥',
        objective: 'Drag and drop incoming task cards into Urgent, Important, or Delegate bins before they scroll off the conveyor belt.',
        benefit: 'Trains executive triage, multi-priority switching, decision speed under pressure, and resource allocation.'
      },
      {
        id: 'NeuroMaze',
        title: 'Neuro Maze',
        icon: '🏃',
        objective: 'Escape dynamic grid mazes with moving barrier walls and shifting exit locations.',
        benefit: 'Improves real-time replanning, visual obstacle prediction, and quick strategic changes.'
      },
      {
        id: 'MentalFlex',
        title: 'Mental Flex',
        icon: '🤹',
        objective: 'Match incoming target items based on rapidly shifting rules (color, shape, count).',
        benefit: 'Enhances cognitive flexibility, rule induction switching, and adaptive execution.'
      }
    ]
  }
];

const getGoalProgress = (goal) => {
  if (goal.is_completed) return 1.0;
  if (!goal.current_value) return 0.0;
  
  if (goal.metric_type === 'reaction_time') {
    if (goal.current_value <= goal.target_value) return 1.0;
    return goal.target_value / goal.current_value;
  }
  
  return goal.current_value / goal.target_value;
};

const COGNITIVE_QUESTIONS = [
  {
    id: 'q1',
    domain: 'spatial_visual_memory',
    title: 'Spatial-Visual Memory (1/3)',
    text: 'Imagine a grid with 4 rows and 4 columns. Which of these options correctly points to the tiles in row 1 column 2, row 2 column 4, and row 4 column 3?',
    options: [
      { key: 'A', text: '(1,2), (2,4), (4,3)' },
      { key: 'B', text: '(2,1), (4,2), (3,4)' },
      { key: 'C', text: '(1,3), (2,4), (4,2)' },
      { key: 'D', text: '(1,2), (2,3), (4,4)' }
    ]
  },
  {
    id: 'q2',
    domain: 'logical_mathematical',
    title: 'Logical-Mathematical (1/3)',
    text: 'What number comes next in this pattern? 2, 3, 5, 8, 13, 21, ?',
    options: [
      { key: 'A', text: '29' },
      { key: 'B', text: '34' },
      { key: 'C', text: '31' },
      { key: 'D', text: '42' }
    ]
  },
  {
    id: 'q3',
    domain: 'reflexes_and_focus',
    title: 'Reflexes & Focus (1/3)',
    text: 'If you see the word "BLUE" printed in red ink, what is the color of the ink?',
    options: [
      { key: 'A', text: 'Blue' },
      { key: 'B', text: 'Green' },
      { key: 'C', text: 'Red' },
      { key: 'D', text: 'Black' }
    ]
  },
  {
    id: 'q4',
    domain: 'executive_strategy',
    title: 'Executive Strategy (1/3)',
    text: 'Imagine navigating a maze. Moving right costs 2 energy points, moving down costs 3. You can\'t move diagonally. If you need to go 3 spaces right and 3 spaces down, what\'s the total energy cost?',
    options: [
      { key: 'A', text: '15' },
      { key: 'B', text: '12' },
      { key: 'C', text: '18' },
      { key: 'D', text: '10' }
    ]
  },
  {
    id: 'q5',
    domain: 'spatial_visual_memory',
    title: 'Spatial-Visual Memory (2/3)',
    text: 'Imagine a 3x3 Rubik\'s cube face: Blue-Red-Blue on top, Green-Green-Red in the middle, Blue-Green-Red on bottom. If you rotate it 90 degrees clockwise, what are the colors of the new top row?',
    options: [
      { key: 'A', text: 'Red-Green-Blue' },
      { key: 'B', text: 'Blue-Red-Green' },
      { key: 'C', text: 'Green-Red-Red' },
      { key: 'D', text: 'Blue-Green-Blue' }
    ]
  },
  {
    id: 'q6',
    domain: 'logical_mathematical',
    title: 'Logical-Mathematical (2/3)',
    text: 'Math puzzle: A + B = 10, A * B = 24, and B is bigger than A. If you multiply B by 3 and subtract A, what number do you get?',
    options: [
      { key: 'A', text: '10' },
      { key: 'B', text: '16' },
      { key: 'C', text: '14' },
      { key: 'D', text: '12' }
    ]
  },
  {
    id: 'q7',
    domain: 'reflexes_and_focus',
    title: 'Reflexes & Focus (2/3)',
    text: 'Stroop Conflict: The word "GREEN" is written in YELLOW ink. Choose the word spelling, NOT the ink color.',
    options: [
      { key: 'A', text: 'Yellow' },
      { key: 'B', text: 'Green' },
      { key: 'C', text: 'Blue' },
      { key: 'D', text: 'Red' }
    ]
  },
  {
    id: 'q8',
    domain: 'executive_strategy',
    title: 'Executive Strategy (2/3)',
    text: 'Rule-Shifting: If Target = Blue Circle and Obstacle = Red Square, the optimal action is Action A. If the rule shifts such that Target and Obstacle swap colors, what is the action corresponding to Red Circle?',
    options: [
      { key: 'A', text: 'Action A (Treat as Target)' },
      { key: 'B', text: 'Action C (No response needed)' },
      { key: 'C', text: 'Action D (Re-initialize)' },
      { key: 'D', text: 'Action B (Treat as Obstacle)' }
    ]
  },
  {
    id: 'q9',
    domain: 'spatial_visual_memory',
    title: 'Spatial-Visual Memory (3/3)',
    text: 'A visual sequence flashes: Top-Right tile, Center-Left tile, Bottom-Center tile, Top-Center tile. Which option lists the tiles in the exact reverse sequence?',
    options: [
      { key: 'A', text: 'Top-Center, Bottom-Center, Center-Left, Top-Right' },
      { key: 'B', text: 'Top-Right, Center-Left, Bottom-Center, Top-Center' },
      { key: 'C', text: 'Top-Center, Bottom-Center, Top-Right, Center-Left' },
      { key: 'D', text: 'Center-Left, Top-Right, Top-Center, Bottom-Center' }
    ]
  },
  {
    id: 'q10',
    domain: 'logical_mathematical',
    title: 'Logical-Mathematical (3/3)',
    text: 'Identify the pattern to complete the sequence: 3, 9, 27, 81, ?',
    options: [
      { key: 'A', text: '162' },
      { key: 'B', text: '243' },
      { key: 'C', text: '324' },
      { key: 'D', text: '216' }
    ]
  },
  {
    id: 'q11',
    domain: 'reflexes_and_focus',
    title: 'Reflexes & Focus (3/3)',
    text: 'Stroop Conflict: The word "YELLOW" is written in GREEN ink. What is the actual ink color of the word?',
    options: [
      { key: 'A', text: 'Yellow' },
      { key: 'B', text: 'Red' },
      { key: 'C', text: 'Green' },
      { key: 'D', text: 'Blue' }
    ]
  },
  {
    id: 'q12',
    domain: 'executive_strategy',
    title: 'Executive Strategy (3/3)',
    text: 'Path Optimization: A drone must visit 3 nodes A, B, and C. Distances are: Start-A = 5, Start-B = 10, A-B = 3, B-C = 4, A-C = 6. What is the shortest total path length to visit all nodes starting from Start?',
    options: [
      { key: 'A', text: '12' },
      { key: 'B', text: '14' },
      { key: 'C', text: '15' },
      { key: 'D', text: '16' }
    ]
  }
];

export default function App() {
  const { coins, totalXp, inventory, fetchInventory } = useCogniStore();
  const currentLevel = totalXp ? Math.floor(totalXp / 500) + 1 : 1;
  const currentLevelXp = totalXp ? totalXp % 500 : 0;
  const xpPercent = Math.floor((currentLevelXp / 500) * 100);
  const [activeGame, setActiveGame] = useState(null);
  const [selectedGameMode, setSelectedGameMode] = useState('timed');
  const [pendingGameToLaunch, setPendingGameToLaunch] = useState(null);
  const [hoveredMode, setHoveredMode] = useState(null);

  const [appBooting, setAppBooting] = useState(true);
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    // Fake boot sequence for presentation polish
    const timer = setTimeout(() => {
      setAppBooting(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const activeTheme = inventory.find(i => i.item_type === 'theme' && i.is_equipped);
    if (activeTheme) {
      document.body.setAttribute('data-theme', activeTheme.item_id);
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [inventory]);

  useEffect(() => {
    // Poll server health using lightweight /api/health endpoint
    const checkServer = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        setServerOnline(res.ok);
      } catch (e) {
        setServerOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    window.currentGameMode = selectedGameMode;
  }, [selectedGameMode]);

  const [showDashboard, setShowDashboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [gameRewardsModal, setGameRewardsModal] = useState(null);
  const sessionRewardsRef = useRef({ xp: 0, coins: 0, leveled_up: false });
  const [lastGameStats, setLastGameStats] = useState(null);
  const [portalView, setPortalView] = useState('participant'); // 'participant' | 'researcher'

  // Quasi-Experimental Research Pipeline States
  const [currentUser, setCurrentUser] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [preTestScores, setPreTestScores] = useState(null);
  const [postTestScores, setPostTestScores] = useState(null);
  const [weakestDomain, setWeakestDomain] = useState(null);
  const [prescribedGame, setPrescribedGame] = useState(null);
  const [personalizedReport, setPersonalizedReport] = useState(null);
  const [hasPlayedPrescribed, setHasPlayedPrescribed] = useState(false);
  const [assessmentStage, setAssessmentStage] = useState('none'); // 'none' | 'pre-test' | 'post-test' | 'completed'
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '',
    q5: '', q6: '', q7: '', q8: '',
    q9: '', q10: '', q11: '', q12: ''
  });
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState(null);

  const [researchMode, setResearchMode] = useState('individual'); // 'individual' | 'aggregate'
  const [cohortAnalytics, setCohortAnalytics] = useState(null);
  const [cohortLoading, setCohortLoading] = useState(false);

  const fetchCohortAnalytics = async () => {
    setCohortLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/cohort-analytics`);
      if (!res.ok) throw new Error("Failed to fetch cohort analytics.");
      const data = await res.json();
      if (data.status === 'success') {
        setCohortAnalytics(data);
      }
    } catch (err) {
      console.warn("Could not retrieve cohort analytics:", err);
    } finally {
      setCohortLoading(false);
    }
  };

  useEffect(() => {
    if (researchMode === 'aggregate') {
      fetchCohortAnalytics();
    }
  }, [researchMode]);

  const handleCheckUserStatus = async (username) => {
    if (!username || !username.trim()) {
      setAssessmentError("Please enter a valid username.");
      return;
    }
    setAssessmentLoading(true);
    setAssessmentError(null);
    try {
      const trimmedName = username.trim();
      
      const loginRes = await fetch('http://127.0.0.1:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmedName })
      });
      if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.status === 'success') {
              useCogniStore.getState().login(loginData.user, loginData.token);
              if (loginData.daily_reward && loginData.daily_reward.granted) {
                  setDailyRewardData(loginData.daily_reward);
                  audioEngine.playSuccess();
              } else {
                  useCogniStore.getState().fetchInventory();
              }
          }
      }

      const res = await fetch(`http://127.0.0.1:5000/api/assessment-status/${trimmedName}`);

      if (!res.ok) throw new Error("Failed to connect to backend server.");
      const data = await res.json();
      if (data.status === 'success') {
        setCurrentUser(trimmedName);
        setActiveDashboardUser(trimmedName);
        
        if (data.exists && data.pre_test) {
          setPreTestScores(data.pre_test);
          setWeakestDomain(data.weakest_domain);
          setPrescribedGame(data.prescribed_game);
          setPersonalizedReport(data.personalized_report);
          
          if (data.post_test) {
            setPostTestScores(data.post_test);
            setAssessmentStage('completed');
            fetchEvaluationReport(trimmedName);
          } else {
            setAssessmentStage('none');
            // Fetch session history to check if they already played the prescribed game
            const historyRes = await fetch(`http://127.0.0.1:5000/api/user-session-history/${trimmedName}`);
            if (historyRes.ok) {
              const histData = await historyRes.json();
              const played = (histData.sessions || []).some(s => s.game_type === data.prescribed_game);
              setHasPlayedPrescribed(played);
            }
          }
        } else {
          setPreTestScores(null);
          setWeakestDomain(null);
          setPrescribedGame(null);
          setAssessmentAnswers({
            q1: '', q2: '', q3: '', q4: '',
            q5: '', q6: '', q7: '', q8: '',
            q9: '', q10: '', q11: '', q12: ''
          });
          setAssessmentStage('pre-test');
        }
      } else {
        throw new Error(data.message || "Unknown error occurred.");
      }
    } catch (err) {
      console.error(err);
      setAssessmentError(err.message);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const handleSubmitAssessment = async (e) => {
    if (e) e.preventDefault();
    
    // Check if all questions are answered
    const unanswered = COGNITIVE_QUESTIONS.filter(q => !assessmentAnswers[q.id]);
    if (unanswered.length > 0) {
      setAssessmentError(`Please answer all questions before submitting. Unanswered: ${unanswered.map(q => q.id.toUpperCase()).join(', ')}`);
      return;
    }

    setAssessmentLoading(true);
    setAssessmentError(null);
    try {
      const type = assessmentStage === 'pre-test' ? 'pre-test' : 'post-test';
      
      // Calculate correctness and scores out of 100
      const q1_corr = assessmentAnswers.q1 === 'A' ? 1 : 0;
      const q5_corr = assessmentAnswers.q5 === 'D' ? 1 : 0;
      const q9_corr = assessmentAnswers.q9 === 'A' ? 1 : 0;
      
      const q2_corr = assessmentAnswers.q2 === 'B' ? 1 : 0;
      const q6_corr = assessmentAnswers.q6 === 'C' ? 1 : 0;
      const q10_corr = assessmentAnswers.q10 === 'B' ? 1 : 0;
      
      const q3_corr = assessmentAnswers.q3 === 'C' ? 1 : 0;
      const q7_corr = assessmentAnswers.q7 === 'B' ? 1 : 0;
      const q11_corr = assessmentAnswers.q11 === 'C' ? 1 : 0;
      
      const q4_corr = assessmentAnswers.q4 === 'A' ? 1 : 0;
      const q8_corr = assessmentAnswers.q8 === 'D' ? 1 : 0;
      const q12_corr = assessmentAnswers.q12 === 'A' ? 1 : 0;
      
      const spatial_visual_score = ((q1_corr + q5_corr + q9_corr) / 3.0) * 100.0;
      const logical_math_score = ((q2_corr + q6_corr + q10_corr) / 3.0) * 100.0;
      const attention_score = ((q3_corr + q7_corr + q11_corr) / 3.0) * 100.0;
      const executive_score = ((q4_corr + q8_corr + q12_corr) / 3.0) * 100.0;

      const res = await fetch(`http://127.0.0.1:5000/api/submit-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          assessment_type: type,
          answers: {
            q1: q1_corr, q2: q2_corr, q3: q3_corr, q4: q4_corr,
            q5: q5_corr, q6: q6_corr, q7: q7_corr, q8: q8_corr,
            q9: q9_corr, q10: q10_corr, q11: q11_corr, q12: q12_corr,
            spatial_visual_score,
            logical_math_score,
            attention_score,
            executive_score
          }
        })
      });
      if (!res.ok) throw new Error("Failed to submit assessment.");
      const data = await res.json();
      if (data.status === 'success') {
        if (type === 'pre-test') {
          setPreTestScores(data.scores);
          setWeakestDomain(data.weakest_domain);
          setPrescribedGame(data.prescribed_game);
          setAssessmentStage('none');
          setHasPlayedPrescribed(false);
          setSkills({
            spatial_visual_memory: data.scores.spatial_visual_memory,
            logical_mathematical: data.scores.logical_mathematical,
            reflexes_and_focus: data.scores.reflexes_and_focus,
            executive_strategy: data.scores.executive_strategy
          });
        } else {
          setPostTestScores(data.scores);
          setAssessmentStage('completed');
          fetchEvaluationReport(currentUser);
        }
      } else {
        throw new Error(data.message || "Submit failed.");
      }
    } catch (err) {
      console.error(err);
      setAssessmentError(err.message);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const fetchEvaluationReport = async (username) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (!res.ok) throw new Error("Failed to evaluate scores.");
      const data = await res.json();
      if (data.status === 'success') {
        setEvaluationReport(data);
      }
    } catch (err) {
      console.warn("Could not retrieve evaluation report:", err);
    }
  };

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

  // Advanced Researcher Sandbox (Option B)
  const [sandboxVar1, setSandboxVar1] = useState('rule_shift_latency_ms');
  const [sandboxVar2, setSandboxVar2] = useState('spam_click_count');
  const [sandboxCohort, setSandboxCohort] = useState('all'); // 'all' | 'clinical' | 'active'
  const [correlationResult, setCorrelationResult] = useState(null);
  const [learningCurves, setLearningCurves] = useState(null);
  const [curveMetric, setCurveMetric] = useState('accuracy'); // 'accuracy' | 'reaction_time'
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState(null);

  // Cognitive Goal Tracker (Option C)
  const [goals, setGoals] = useState([]);
  const [goalDomain, setGoalDomain] = useState('reflexes_and_focus');
  const [goalMetric, setGoalMetric] = useState('accuracy');
  const [goalTarget, setGoalTarget] = useState('80');
  const [milestoneNotification, setMilestoneNotification] = useState(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Live DDA Advisor States (Option D)
  const [ddaAdvisorLogs, setDdaAdvisorLogs] = useState([]);
  const [ddaAdvisorMessage, setDdaAdvisorMessage] = useState(null);
  const prevDdaParamsRef = useRef(null);

  // Unsupervised Archetype Clustering & Retraining states
  const [activeResearcherTab, setActiveResearcherTab] = useState('cohort-stats'); // 'cohort-stats' | 'ai-sandbox'
  const [modelStatus, setModelStatus] = useState(null);
  const [retrainMetrics, setRetrainMetrics] = useState(null);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [clusterDataPoints, setClusterDataPoints] = useState([]);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [clusterError, setClusterError] = useState(null);
  const [clusterXVar, setClusterXVar] = useState('reaction_time');
  const [clusterYVar, setClusterYVar] = useState('accuracy');

  // Live Game DDA HUD States (Phase 2)
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [liveDdaParams, setLiveDdaParams] = useState(null);
  const [liveCognitiveProfile, setLiveCognitiveProfile] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState([]);
  const [globalMuted, setGlobalMuted] = useState(audioDda.isMuted);
  const [oscillatorType, setOscillatorType] = useState(audioDda.oscillatorType);
  const [bpmMultiplier, setBpmMultiplier] = useState(audioDda.bpmMultiplier);
  const [showSoundTuner, setShowSoundTuner] = useState(false);
  const [smoothingAlpha, setSmoothingAlpha] = useState(1.0);
  const [dailyRewardData, setDailyRewardData] = useState(null);
  const [activeAchievements, setActiveAchievements] = useState([]);
  const smoothingAlphaRef = useRef(1.0);

  useEffect(() => {
    smoothingAlphaRef.current = smoothingAlpha;
  }, [smoothingAlpha]);

  useEffect(() => {
    const handleAchievementsUnlocked = (e) => {
      if (e.detail && e.detail.length > 0) {
        setActiveAchievements(prev => {
          // Prevent duplicates in current active list
          const uniqueNew = e.detail.filter(id => !prev.includes(id));
          return [...prev, ...uniqueNew];
        });
      }
    };
    window.addEventListener('achievements-unlocked', handleAchievementsUnlocked);
    return () => window.removeEventListener('achievements-unlocked', handleAchievementsUnlocked);
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      let options = args[1] || {};
      
      const token = useCogniStore.getState().token;
      if (token) {
          options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${token}`
          };
          args[1] = options;
      }
      
      if (typeof url === 'string' && url.includes('/api/dda')) {
        const options = args[1] || {};
        if (options.method === 'POST') {
          try {
            let body = {};
            if (options.body) {
              body = JSON.parse(options.body);
            }
            body.smoothing_alpha = smoothingAlphaRef.current;
            options.body = JSON.stringify(body);
            args[1] = options;
          } catch (e) {
            console.error('[Fetch Interceptor] Failed to inject smoothing_alpha', e);
          }
        }
      }

      const response = await originalFetch(...args);
      if (typeof url === 'string') {
        if (url.includes('/api/start-session') && response.ok) {
          try {
            const cloned = response.clone();
            cloned.json().then(data => {
              if (data && data.status === 'success') {
                setActiveSessionId(data.session_id);
                setLiveDdaParams(data.dda_parameters);
                setLiveCognitiveProfile(null);
                setLiveMetrics([]);
                setDdaAdvisorLogs([]);
                setDdaAdvisorMessage(null);
                prevDdaParamsRef.current = null;
                
                // Initialize Audio DDA Synthesizer
                audioDda.init();
                if (data.dda_parameters && data.dda_parameters.difficulty_level) {
                  audioDda.setDifficulty(data.dda_parameters.difficulty_level);
                }
              }
            });
          } catch (e) {
            console.error('[Telemetry HUD] Error parsing start-session', e);
          }
        }
        if (url.includes('/api/submit-metrics')) {
          try {
            const options = args[1] || {};
            if (options.body) {
              const body = JSON.parse(options.body);
              let items = [];
              if (Array.isArray(body)) {
                items = body;
              } else if (body && Array.isArray(body.metrics)) {
                items = body.metrics;
              } else {
                items = [body];
              }
              
              items.forEach(item => {
                const accuracy = item.accuracy_rate !== undefined ? item.accuracy_rate : item.accuracy;
                const rt = item.reaction_time !== undefined ? item.reaction_time : item.reaction_time_ms;
                const spamClicks = item.spam_click_count || 0;
                const hesitation = item.hesitation_ms || 0;
                
                if (accuracy !== undefined && rt !== undefined) {
                  setLiveMetrics(prev => [...prev, { accuracy, rt, spamClicks, hesitation }]);
                  
                  // Play success (blip) / failure (buzz) synthesized audio tones
                  audioDda.playFeedback(accuracy === 1.0);
                  
                  // Trigger low-pass calming mode when player shows panic or high hesitation latency
                  if (spamClicks > 2 || hesitation > 1500) {
                    audioDda.setFrustration(true);
                  }
                }
              });
            }
            
            if (response.ok) {
              response.clone().json().then(data => {
                if (data && data.status === 'success' && data.rewards) {
                  sessionRewardsRef.current.xp += data.rewards.xp || 0;
                  sessionRewardsRef.current.coins += data.rewards.coins || 0;
                  if (data.rewards.leveled_up) sessionRewardsRef.current.leveled_up = true;
                }
              }).catch(e => {
                // Ignore parse errors if response isn't JSON
              });
            }
          } catch (e) {
            console.error('[Telemetry HUD] Error parsing submit-metrics', e);
          }
        }
        if (url.includes('/api/dda') && response.ok) {
          try {
            const cloned = response.clone();
            cloned.json().then(data => {
              if (data && data.status === 'success') {
                if (data.dda_parameters) {
                  setLiveDdaParams(data.dda_parameters);
                  if (data.dda_parameters.difficulty_level) {
                    audioDda.setDifficulty(data.dda_parameters.difficulty_level);
                  }
                }
                if (data.cognitive_profile) {
                  setLiveCognitiveProfile(data.cognitive_profile);
                }
                
                // Revert low-pass soothing filter back to standard focus mode when difficulty updates
                audioDda.setFrustration(false);
              }
            });
          } catch (e) {
            console.error('[Telemetry HUD] Error parsing dda', e);
          }
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Track DDA Parameter changes for Option D Advisor
  useEffect(() => {
    if (liveDdaParams) {
      if (prevDdaParamsRef.current) {
        const prev = prevDdaParamsRef.current;
        const curr = liveDdaParams;
        
        let changes = [];
        let reason = "";
        
        // 1. Difficulty Level change
        if (curr.difficulty_level !== prev.difficulty_level) {
          const dir = curr.difficulty_level > prev.difficulty_level ? 'increased' : 'decreased';
          changes.push(`Difficulty ${dir} to Level ${curr.difficulty_level}`);
          
          if (dir === 'increased') {
            reason = "Your recent metrics indicate strong response accuracy and rapid execution speeds. The DDA engine has adjusted parameters upward to maintain your flow zone.";
          } else {
            reason = "A rise in latency or error rate has been detected. The DDA engine has scaled back active difficulty parameters to allow you to restabilize focus and prevent cognitive fatigue.";
          }
        }
        
        // 2. Specific gameplay parameters
        const trackedKeys = [
          'grid_size', 'speed_multiplier', 'target_count', 'has_distractors', 
          'sequence_length', 'spawn_interval_ms', 'time_limit_ms', 'delay_ms',
          'card_count', 'grid_rows', 'grid_cols', 'max_path_length', 'ideal_steps'
        ];
        
        trackedKeys.forEach(key => {
          if (curr[key] !== undefined && prev[key] !== undefined && curr[key] !== prev[key]) {
            const cleanKey = key.replace(/_/g, ' ');
            changes.push(`${cleanKey} tuned to ${curr[key]}`);
          }
        });
        
        if (changes.length > 0) {
          const newLog = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            changes: changes,
            reason: reason || "Engine adjusted real-time parameters dynamically to balance task difficulty with your current cognitive flow profile."
          };
          
          setDdaAdvisorLogs(prevLogs => [newLog, ...prevLogs].slice(0, 10));
          setDdaAdvisorMessage(newLog);
          
          // Auto clear notification after 6 seconds
          const timerId = setTimeout(() => {
            setDdaAdvisorMessage(current => current && current.id === newLog.id ? null : current);
          }, 6000);
          
          return () => clearTimeout(timerId);
        }
      }
      prevDdaParamsRef.current = liveDdaParams;
    } else {
      prevDdaParamsRef.current = null;
    }
  }, [liveDdaParams]);

  const fetchDashboardData = async (username) => {
    setChartsLoading(true);
    setChartsError(null);
    try {
      // 1. Fetch user session history, cohort comparison, and archetype progression concurrently
      const [historyRes, compRes, progressionRes] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/user-session-history/${username}`),
        fetch(`http://127.0.0.1:5000/api/cohort-comparison/${username}`),
        fetch(`http://127.0.0.1:5000/api/archetype-progression/${username}`)
      ]);

      if (!historyRes.ok) throw new Error('Failed to load session history.');
      if (!compRes.ok) throw new Error('Failed to load cohort comparison.');
      if (!progressionRes.ok) throw new Error('Failed to load archetype progression.');

      const [historyData, compData, progressionData] = await Promise.all([
        historyRes.json(),
        compRes.json(),
        progressionRes.json()
      ]);

      const sessions = historyData.sessions || [];
      setSessionHistory(sessions);
      setCohortComparison(compData);
      setArchetypeHistory(progressionData.history || []);

      // 2. Fetch latest session metrics sequentially (dependent on latestSid from historyRes)
      if (sessions.length > 0) {
        const latestSid = sessions[0].session_id;
        const metricsRes = await fetch(`http://127.0.0.1:5000/api/session-metrics/${latestSid}`);
        if (!metricsRes.ok) throw new Error('Failed to load latest session metrics.');
        const metricsData = await metricsRes.json();
        setLatestSessionMetrics(metricsData.metrics || []);
      } else {
        setLatestSessionMetrics([]);
      }

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
      
      if (lastGameStats.gameType === 'MemoryMatch' || lastGameStats.gameType === 'MatrixRecall' || lastGameStats.gameType === 'NeuralNBack' || lastGameStats.gameType === 'SynapseSpin' || lastGameStats.gameType === 'NexusMapper') {
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
      } else if (lastGameStats.gameType === 'MazeEscape' || lastGameStats.gameType === 'PriorityQueue' || lastGameStats.gameType === 'MentalFlex') {
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

  const handleGameFinished = useCallback((stats) => {
    setLastGameStats({ ...stats, gameType: activeGame });
    setActiveSessionId(null);
    setLiveDdaParams(null);
    setLiveCognitiveProfile(null);
    setLiveMetrics([]);
    audioDda.stop();
    setHasPlayedPrescribed(true);
    
    // Check and show rewards modal if any rewards were accumulated
    if (sessionRewardsRef.current.xp > 0 || sessionRewardsRef.current.coins > 0) {
      if (sessionRewardsRef.current.leveled_up) {
        audioEngine.playLevelUp();
      } else {
        audioEngine.playSuccess();
      }
      setGameRewardsModal({ ...sessionRewardsRef.current });
      sessionRewardsRef.current = { xp: 0, coins: 0, leveled_up: false };
    }
  }, [activeGame]);

  const handleBackToLobby = () => {
    setActiveGame(null);
    setActiveSessionId(null);
    setLiveDdaParams(null);
    setLiveCognitiveProfile(null);
    setLiveMetrics([]);
    audioDda.stop();
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

  const fetchSandboxData = async (var1 = sandboxVar1, var2 = sandboxVar2, cohort = sandboxCohort) => {
    setSandboxLoading(true);
    setSandboxError(null);
    try {
      const corrRes = await fetch(`http://127.0.0.1:5000/api/research/correlations?var1=${var1}&var2=${var2}&cohort=${cohort}&username=${activeDashboardUser}`);
      if (!corrRes.ok) throw new Error('Failed to compute correlation statistics.');
      const corrData = await corrRes.json();
      if (corrData.status === 'success') {
        setCorrelationResult(corrData);
      } else {
        throw new Error(corrData.message || 'Correlation computation failed.');
      }

      const curveRes = await fetch(`http://127.0.0.1:5000/api/research/learning-curves/${activeDashboardUser}`);
      if (!curveRes.ok) throw new Error('Failed to load learning curve statistics.');
      const curveData = await curveRes.json();
      if (curveData.status === 'success') {
        setLearningCurves(curveData.curves);
      } else {
        throw new Error(curveData.message || 'Learning curves fetch failed.');
      }
    } catch (e) {
      console.error("[Sandbox Fetch] Failed:", e);
      setSandboxError(e.message);
    } finally {
      setSandboxLoading(false);
    }
  };

  const getScatterChartData = () => {
    if (!correlationResult || !correlationResult.data_points || correlationResult.data_points.length === 0) {
      return { datasets: [] };
    }

    const pts = correlationResult.data_points.map(p => ({ x: p.x, y: p.y }));
    const n = pts.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    pts.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const b = (sumY - m * sumX) / (n || 1);

    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));

    const linePoints = [
      { x: minX, y: m * minX + b },
      { x: maxX, y: m * maxX + b }
    ];

    return {
      datasets: [
        {
          label: 'Observed Telemetry Points',
          data: pts,
          backgroundColor: '#38bdf8',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
          type: 'scatter'
        },
        {
          label: 'Linear Regression Fit',
          data: linePoints,
          borderColor: '#a855f7',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          showLine: true,
          type: 'line',
          fill: false
        }
      ]
    };
  };

  const scatterChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: sandboxVar1.replace(/_/g, ' ').toUpperCase(),
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        title: {
          display: true,
          text: sandboxVar2.replace(/_/g, ' ').toUpperCase(),
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#f8fafc'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `(${context.raw.x.toFixed(2)}, ${context.raw.y.toFixed(2)})`;
          }
        }
      }
    }
  };

  const getLearningCurvesChartData = () => {
    if (!learningCurves) {
      return { labels: [], datasets: [] };
    }

    const maxSessions = Math.max(
      learningCurves.active_user.length,
      learningCurves.clinical_cohort.length,
      learningCurves.all_cohort.length
    );

    const labels = Array.from({ length: maxSessions }, (_, i) => `Session ${i + 1}`);

    const activeData = learningCurves.active_user.map(p => 
      curveMetric === 'accuracy' ? p.accuracy * 100 : p.reaction_time
    );
    const clinicalData = learningCurves.clinical_cohort.map(p => 
      curveMetric === 'accuracy' ? p.accuracy * 100 : p.reaction_time
    );
    const allData = learningCurves.all_cohort.map(p => 
      curveMetric === 'accuracy' ? p.accuracy * 100 : p.reaction_time
    );

    return {
      labels,
      datasets: [
        {
          label: `${activeDashboardUser.toUpperCase()} (Active Subject)`,
          data: activeData,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          borderWidth: 3,
          tension: 0.15,
          fill: false,
          pointRadius: 4
        },
        {
          label: 'Clinical Research Cohort (Avg)',
          data: clinicalData,
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.15,
          fill: false,
          pointRadius: 3
        },
        {
          label: 'General Cohort (All Users Avg)',
          data: allData,
          borderColor: '#fb923c',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          borderWidth: 2,
          tension: 0.15,
          fill: false,
          pointRadius: 3
        }
      ]
    };
  };

  const learningCurvesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        title: {
          display: true,
          text: curveMetric === 'accuracy' ? 'ACCURACY RATE (%)' : 'REACTION TIME (ms)',
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#f8fafc'
        }
      }
    }
  };

  // Unsupervised Archetype Clustering & Model Retraining methods
  const fetchModelStatus = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/model/status');
      if (!res.ok) throw new Error('Failed to load active model status.');
      const data = await res.json();
      if (data.status === 'success') {
        setModelStatus(data);
      }
    } catch (e) {
      console.error("[Model Status Fetch] Failed:", e);
    }
  };

  const fetchClusterPoints = async () => {
    setClusterLoading(true);
    setClusterError(null);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/model/clusters');
      if (!res.ok) throw new Error('Failed to load clustered session points.');
      const data = await res.json();
      if (data.status === 'success') {
        setClusterDataPoints(data.data_points || []);
      } else {
        throw new Error(data.message || 'Clustered session points fetch failed.');
      }
    } catch (e) {
      console.error("[Cluster Points Fetch] Failed:", e);
      setClusterError(e.message);
    } finally {
      setClusterLoading(false);
    }
  };

  const triggerModelRetrain = async () => {
    setRetrainLoading(true);
    setRetrainMetrics(null);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/model/retrain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Model retraining pipeline failed or returned an error.');
      const data = await res.json();
      if (data.status === 'success') {
        // Start polling the status until it becomes idle or error
        let pollCount = 0;
        const intervalId = setInterval(async () => {
          pollCount++;
          try {
            const statusRes = await fetch('http://127.0.0.1:5000/api/model/status');
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.training_status === 'idle') {
                clearInterval(intervalId);
                setRetrainMetrics(statusData.last_retrain_metrics);
                setRetrainLoading(false);
                fetchModelStatus();
                fetchClusterPoints();
              } else if (statusData.training_status === 'error') {
                clearInterval(intervalId);
                setRetrainLoading(false);
                alert(`Retraining failed: ${statusData.training_error || 'Pipeline error'}`);
              }
            }
          } catch (e) {
            console.error("Polling error:", e);
          }
          
          if (pollCount > 60) { // Timeout after 120 seconds (60 * 2s)
            clearInterval(intervalId);
            setRetrainLoading(false);
            alert("Retraining timed out on client side.");
          }
        }, 2000);
      } else {
        throw new Error(data.message || 'Model retraining pipeline failed.');
      }
    } catch (e) {
      console.error("[Model Retrain] Failed:", e);
      alert(`Retraining failed: ${e.message}`);
      setRetrainLoading(false);
    }
  };

  const getClusteringScatterData = () => {
    if (!clusterDataPoints || clusterDataPoints.length === 0) {
      return { datasets: [] };
    }

    const fastLearnerPoints = [];
    const plateauingPoints = [];
    const highFatiguePoints = [];

    clusterDataPoints.forEach(p => {
      const pt = {
        x: p[clusterXVar],
        y: p[clusterYVar],
        username: p.username,
        game_type: p.game_type,
        session_id: p.session_id
      };
      if (p.cluster === 'Fast Learner') {
        fastLearnerPoints.push(pt);
      } else if (p.cluster === 'Plateauing') {
        plateauingPoints.push(pt);
      } else if (p.cluster === 'High Fatigue') {
        highFatiguePoints.push(pt);
      }
    });

    return {
      datasets: [
        {
          label: 'Fast Learner',
          data: fastLearnerPoints,
          backgroundColor: '#10b981', // green/emerald
          borderColor: 'rgba(16, 185, 129, 0.4)',
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
          type: 'scatter'
        },
        {
          label: 'Plateauing',
          data: plateauingPoints,
          backgroundColor: '#f59e0b', // amber/yellow
          borderColor: 'rgba(245, 158, 11, 0.4)',
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
          type: 'scatter'
        },
        {
          label: 'High Fatigue',
          data: highFatiguePoints,
          backgroundColor: '#ef4444', // red
          borderColor: 'rgba(239, 68, 68, 0.4)',
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
          type: 'scatter'
        }
      ]
    };
  };

  const clusteringScatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: clusterXVar.replace(/_/g, ' ').toUpperCase(),
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        title: {
          display: true,
          text: clusterYVar.replace(/_/g, ' ').toUpperCase(),
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#f8fafc'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw;
            return `User: ${raw.username} | Game: ${raw.game_type} | ID: ${raw.session_id} | X: ${raw.x} | Y: ${raw.y}`;
          }
        }
      }
    }
  };

  const getCalculatedCentroids = () => {
    const archetypes = ["Fast Learner", "Plateauing", "High Fatigue"];
    const features = ["accuracy", "reaction_time", "hesitation", "spam_clicks", "path_efficiency"];
    const sums = {};
    const counts = {};
    
    // Initialize
    archetypes.forEach(arch => {
      sums[arch] = {};
      counts[arch] = 0;
      features.forEach(f => {
        sums[arch][f] = 0;
      });
    });
    
    clusterDataPoints.forEach(p => {
      const arch = p.cluster;
      if (sums[arch]) {
        counts[arch]++;
        features.forEach(f => {
          sums[arch][f] += p[f] || 0;
        });
      }
    });
    
    const centroids = {};
    archetypes.forEach(arch => {
      centroids[arch] = {};
      features.forEach(f => {
        const count = counts[arch] || 1;
        centroids[arch][f] = sums[arch][f] / count;
      });
    });
    
    return centroids;
  };

  // Run ISO & Sandbox fetch when switching to researcher view
  useEffect(() => {
    if (portalView === 'researcher') {
      fetchIsoSummary();
      fetchSandboxData(sandboxVar1, sandboxVar2, sandboxCohort);
      fetchModelStatus();
      fetchClusterPoints();
    }
  }, [portalView, sandboxVar1, sandboxVar2, sandboxCohort, activeDashboardUser, activeResearcherTab]);

  // Cognitive Goal Tracker Methods (Option C)
  const fetchGoals = async (username = activeDashboardUser) => {
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/training-goals/${username}`);
      if (!response.ok) throw new Error('Failed to load training goals.');
      const data = await response.json();
      if (data.status === 'success') {
        setGoals(data.goals || []);
        
        const completed = data.goals.filter(g => g.just_completed);
        if (completed.length > 0) {
          completed.forEach(g => {
            const cleanDomain = g.domain.replace(/_/g, ' ').toUpperCase();
            triggerMilestoneToast(`🏆 Goal Achieved in ${cleanDomain}: Reached ${g.metric_type} target of ${g.target_value}!`);
          });
        }
      } else {
        throw new Error(data.message || 'Failed to fetch goals.');
      }
    } catch (e) {
      console.error("[Goals Fetch] Failed:", e);
      setGoalsError(e.message);
    } finally {
      setGoalsLoading(false);
    }
  };

  const createGoal = async (e) => {
    if (e) e.preventDefault();
    if (!goalTarget || isNaN(parseFloat(goalTarget))) {
      alert("Please enter a valid target value.");
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:5000/api/training-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: activeDashboardUser,
          domain: goalDomain,
          metric_type: goalMetric,
          target_value: parseFloat(goalTarget)
        })
      });
      if (!response.ok) throw new Error('Failed to save goal.');
      const data = await response.json();
      if (data.status === 'success') {
        fetchGoals(activeDashboardUser);
        setGoalTarget('');
      } else {
        throw new Error(data.message || 'Failed to create goal.');
      }
    } catch (e) {
      console.error("[Goal Create] Failed:", e);
      alert(`Error creating goal: ${e.message}`);
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/training-goals/${goalId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete goal.');
      const data = await response.json();
      if (data.status === 'success') {
        fetchGoals(activeDashboardUser);
      } else {
        throw new Error(data.message || 'Failed to delete goal.');
      }
    } catch (e) {
      console.error("[Goal Delete] Failed:", e);
      alert(`Error deleting goal: ${e.message}`);
    }
  };

  const triggerMilestoneToast = (msg) => {
    setMilestoneNotification(msg);
    setTimeout(() => {
      setMilestoneNotification(null);
    }, 5000);
  };

  // Fetch training goals on user or game update
  useEffect(() => {
    if (activeDashboardUser) {
      fetchGoals(activeDashboardUser);
    }
  }, [activeDashboardUser, lastGameStats]);

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
        display: true,
        position: 'top',
        labels: {
          color: '#94a3b8',
          boxWidth: 10,
          font: { size: 10 }
        }
      }
    }
  };

  const diffLevels = latestSessionMetrics.map(m => m.difficulty_level);
  const diffPointRadii = diffLevels.map((val, idx) => {
    if (idx === 0) return 4;
    return val !== diffLevels[idx - 1] ? 8 : 4;
  });
  const diffPointColors = diffLevels.map((val, idx) => {
    if (idx === 0) return '#a855f7';
    return val !== diffLevels[idx - 1] ? '#22c55e' : '#a855f7';
  });

  const lineChartData = {
    labels: latestSessionMetrics.map((_, index) => `R${index + 1}`),
    datasets: [
      {
        label: 'Difficulty Level',
        data: diffLevels,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.12)',
        borderWidth: 3,
        yAxisID: 'yDiff',
        tension: 0.15,
        fill: true,
        pointBackgroundColor: diffPointColors,
        pointBorderColor: diffPointColors.map(c => c === '#22c55e' ? '#ffffff' : 'transparent'),
        pointBorderWidth: diffPointColors.map(c => c === '#22c55e' ? 2 : 0),
        pointRadius: diffPointRadii,
        pointHoverRadius: diffPointRadii.map(r => r + 2)
      },
      {
        label: 'Reaction Time (ms)',
        data: latestSessionMetrics.map(m => m.reaction_time_ms),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.04)',
        borderWidth: 2,
        yAxisID: 'yRt',
        tension: 0.2,
        fill: true,
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

  // ─── GAME TYPE → DOMAIN HELPER ────────────────────────────────────────────
  const GAME_DOMAIN_MAP = {
    SpeedTap: 'Reflexes', FocusFinder: 'Reflexes', StroopShift: 'Reflexes',
    MemoryMatch: 'Memory', MatrixRecall: 'Memory', NeuralNBack: 'Memory',
    SynapseSpin: 'Memory', NexusMapper: 'Memory',
    LogicLink: 'Logic', EquationBalance: 'Logic', SequenceDecoder: 'Logic', RouteOptimizer: 'Logic',
    MazeEscape: 'Strategy', PriorityQueue: 'Strategy', MentalFlex: 'Strategy', NeuroMaze: 'Strategy'
  };

  // ─── 1. MULTI-SESSION REACTION TIME TREND ─────────────────────────────────
  const validSessions = sessionHistory.filter(s => s.avg_rt > 0 && s.rounds_count > 0);
  const reversedSessions = [...validSessions].reverse();
  const trendLabels = reversedSessions.map((_, i) => `S${i + 1}`);
  const trendRt = reversedSessions.map(s => Math.round(s.avg_rt));
  const trendEma = trendRt.reduce((acc, val, i) => {
    if (i === 0) return [val];
    acc.push(Math.round(acc[i - 1] + 0.35 * (val - acc[i - 1])));
    return acc;
  }, []);
  const sessionTrendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Avg Reaction Time (ms)',
        data: trendRt,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.07)',
        borderWidth: 2,
        pointBackgroundColor: '#38bdf8',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true,
        order: 2
      },
      {
        label: 'EMA Trend',
        data: trendEma,
        borderColor: '#22c55e',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0.45,
        fill: false,
        order: 1
      }
    ]
  };
  const sessionTrendOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8', boxWidth: 10, font: { size: 10 } } },
      tooltip: {
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            const s = reversedSessions[idx];
            return s ? `${s.game_type} — ${s.game_mode}` : `Session ${idx + 1}`;
          },
          label: (item) => ` ${item.dataset.label}: ${item.raw} ms`
        },
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(56,189,248,0.4)', borderWidth: 1,
        titleColor: '#38bdf8', bodyColor: '#e2e8f0'
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#38bdf8', font: { size: 9 } },
        title: { display: true, text: 'RT (ms)', color: '#38bdf8', font: { size: 10 } }
      }
    }
  };

  // ─── 2. PER-DOMAIN ACCURACY HORIZONTAL BAR CHART ──────────────────────────
  const domainAccMap_d = { Reflexes: [], Memory: [], Logic: [], Strategy: [] };
  sessionHistory.slice(0, 20).forEach(s => {
    const domain = GAME_DOMAIN_MAP[s.game_type];
    if (domain && s.avg_acc > 0) domainAccMap_d[domain].push(s.avg_acc * 100);
  });
  const domainAccAvg = ['Reflexes', 'Memory', 'Logic', 'Strategy'].map(d => {
    const vals = domainAccMap_d[d];
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
  });
  const domainAccData = {
    labels: ['\u26a1 Reflexes', '\ud83e\udde0 Memory', '\ud83d\udd22 Logic', '\ud83e\udded Strategy'],
    datasets: [{
      label: 'Avg Accuracy (%)',
      data: domainAccAvg,
      backgroundColor: ['rgba(168,85,247,0.75)', 'rgba(56,189,248,0.75)', 'rgba(245,158,11,0.75)', 'rgba(16,185,129,0.75)'],
      borderColor: ['#a855f7', '#38bdf8', '#f59e0b', '#10b981'],
      borderWidth: 1.5,
      borderRadius: 6,
    }]
  };
  const domainAccOptions = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (item) => ` ${item.raw.toFixed(1)}% accuracy` },
        backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, bodyColor: '#e2e8f0'
      }
    },
    scales: {
      x: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
      y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { size: 11, weight: 'bold' } } }
    }
  };

  // ─── 3. PER-GAME SCORE BREAKDOWN ──────────────────────────────────────────
  const gameScoreMap = {};
  sessionHistory.forEach(s => {
    if (!s.game_type) return;
    const proxy = Math.round((s.avg_acc || 0) * 70 + (s.max_diff || 1) * 6);
    if (!gameScoreMap[s.game_type] || proxy > gameScoreMap[s.game_type]) gameScoreMap[s.game_type] = proxy;
  });
  const sortedGames = Object.entries(gameScoreMap).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const gameScoreColors = sortedGames.map((_, i, arr) => {
    const ratio = i / Math.max(arr.length - 1, 1);
    return `rgba(${Math.round(16+ratio*223)},${Math.round(185-ratio*117)},${Math.round(129-ratio*61)},0.78)`;
  });
  const perGameScoreData = {
    labels: sortedGames.map(([g]) => g),
    datasets: [{
      label: 'Best Score',
      data: sortedGames.map(([, v]) => v),
      backgroundColor: gameScoreColors,
      borderColor: gameScoreColors.map(c => c.replace('0.78','1')),
      borderWidth: 1.5, borderRadius: 5,
    }]
  };
  const perGameScoreOptions = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (item) => ` Score: ${item.raw} / 100` },
        backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, bodyColor: '#e2e8f0'
      }
    },
    scales: {
      x: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
      y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { size: 10 } } }
    }
  };

  // ─── 4. ACCURACY vs REACTION TIME SCATTER ─────────────────────────────────
  const DIFF_PALETTE = ['#22c55e','#86efac','#f59e0b','#f97316','#ef4444'];
  const scatterByDiff = [1,2,3,4,5].map(level => ({
    label: `Level ${level}`,
    data: latestSessionMetrics
      .filter(m => m.difficulty_level === level && m.reaction_time_ms > 0)
      .map(m => ({ x: Math.round(m.reaction_time_ms), y: +(m.accuracy_rate*100).toFixed(1) })),
    backgroundColor: DIFF_PALETTE[level-1] + 'bb',
    borderColor: DIFF_PALETTE[level-1],
    pointRadius: 6, pointHoverRadius: 9,
  }));
  const scatterData = { datasets: scatterByDiff.filter(d => d.data.length > 0) };
  const scatterOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8', boxWidth: 8, font: { size: 10 } } },
      tooltip: {
        callbacks: { label: (item) => ` RT: ${item.raw.x}ms   Acc: ${item.raw.y}%` },
        backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
        titleColor: '#f59e0b', bodyColor: '#e2e8f0'
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } },
        title: { display: true, text: 'Reaction Time (ms)', color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        min: 0, max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } },
        title: { display: true, text: 'Accuracy (%)', color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  // ─── RADAR UPGRADED: archetype baseline ghost overlay ────────────────────
  const ARCHETYPE_BASELINES = {
    'Advanced':        [88, 85, 90, 83],
    'Standard':        [65, 62, 68, 60],
    'Beginner':        [42, 40, 45, 38],
    'Initializing...': [55, 55, 55, 55],
  };
  const baselineValues = ARCHETYPE_BASELINES[cognitiveProfile?.archetype] || ARCHETYPE_BASELINES['Initializing...'];
  const radarDataEnhanced = {
    labels: ['Spatial-Visual Memory','Logical-Mathematical','Reflexes & Focus','Executive Strategy'],
    datasets: [
      {
        label: 'Your Profile',
        data: [skills.spatial_visual_memory, skills.logical_mathematical, skills.reflexes_and_focus, skills.executive_strategy],
        backgroundColor: 'rgba(168,85,247,0.2)',
        borderColor: '#a855f7', borderWidth: 2.5,
        pointBackgroundColor: '#38bdf8', pointBorderColor: '#ffffff',
        pointRadius: 5, pointHoverRadius: 7, order: 1
      },
      {
        label: `${cognitiveProfile?.archetype || 'Archetype'} Baseline`,
        data: baselineValues,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.22)', borderWidth: 1.5,
        borderDash: [5, 4],
        pointBackgroundColor: 'rgba(255,255,255,0.25)', pointBorderColor: 'transparent',
        pointRadius: 3, order: 2
      }
    ]
  };

  // ─── DOMAIN DELTAS FOR SCORE CARDS ─────────────────────────────────────────
  const domainDeltas = {
    spatial_visual_memory: 0,
    logical_mathematical: 0,
    reflexes_and_focus: 0,
    executive_strategy: 0
  };

  const domainSessionsMap = {
    spatial_visual_memory: [],
    logical_mathematical: [],
    reflexes_and_focus: [],
    executive_strategy: []
  };

  // Group session history by domain using the GAME_DOMAIN_MAP
  sessionHistory.forEach(s => {
    const domainName = GAME_DOMAIN_MAP[s.game_type];
    if (domainName === 'Memory') domainSessionsMap.spatial_visual_memory.push(s);
    if (domainName === 'Logic') domainSessionsMap.logical_mathematical.push(s);
    if (domainName === 'Reflexes') domainSessionsMap.reflexes_and_focus.push(s);
    if (domainName === 'Strategy') domainSessionsMap.executive_strategy.push(s);
  });

  // Calculate delta: latest session score minus previous session score
  Object.keys(domainSessionsMap).forEach(key => {
    const sList = domainSessionsMap[key];
    if (sList.length >= 2) {
      const latestScore = Math.round((sList[0].avg_acc || 0) * 70 + (sList[0].max_diff || 1) * 6);
      const prevScore = Math.round((sList[1].avg_acc || 0) * 70 + (sList[1].max_diff || 1) * 6);
      domainDeltas[key] = latestScore - prevScore;
    } else if (sList.length === 1) {
      // If there is only one session, the delta is the difference from baseline
      const latestScore = Math.round((sList[0].avg_acc || 0) * 70 + (sList[0].max_diff || 1) * 6);
      domainDeltas[key] = latestScore;
    }
  });

  return (
    <div className="portal-container" style={{ position: 'relative' }}>
      {appBooting ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="logo-glow" style={{ fontSize: '3rem', marginBottom: '2rem', animation: 'pulse 2s infinite' }}>
            CogniCore
          </div>
          <div style={{ color: '#94a3b8' }}>Initializing neural pathways...</div>
        </div>
      ) : (
        <>
          <SeizureDisclaimerModal />
        </>
      )}
      {!serverOnline && !appBooting && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(10px)',
          zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#f8fafc', fontFamily: 'system-ui'
        }}>
          <div style={{ borderTopColor: '#ef4444', borderWidth: 4, borderStyle: 'solid', borderRadius: '50%', width: 50, height: 50, marginBottom: '1rem', animation: 'spin 2s linear infinite' }} />
          <h2 style={{ letterSpacing: '0.05em' }}>Server Offline</h2>
          <p style={{ color: '#94a3b8' }}>Awaiting secure telemetry connection to backend server.</p>
        </div>
      )}
      {milestoneNotification && (
        <div className="milestone-toast-container" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #1e1b4b, #115e59)',
          border: '2px solid #a855f7',
          boxShadow: '0 0 25px rgba(168, 85, 247, 0.6), 0 10px 40px rgba(0,0,0,0.6)',
          borderRadius: '12px',
          padding: '1rem 2rem',
          color: '#ffffff',
          zIndex: 99999,
          fontWeight: 'bold',
          fontSize: '1.05rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideDownFadeIn 0.5s ease-out'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🏆</span>
          <span>{milestoneNotification}</span>
        </div>
      )}
      {ddaAdvisorMessage && (
        <div className="dda-advisor-overlay" style={{
          position: 'fixed',
          top: '90px',
          right: '20px',
          width: '320px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid #a855f7',
          boxShadow: '0 0 25px rgba(168, 85, 247, 0.4), 0 10px 40px rgba(0,0,0,0.6)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          color: '#ffffff',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🧠</span>
            <strong style={{ fontSize: '0.9rem', color: '#c084fc', letterSpacing: '0.05em' }}>DDA ADVISOR REPORT</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
            {ddaAdvisorMessage.changes.map((ch, idx) => (
              <div key={idx} style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🔧</span>
                <span>{ch}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0', lineHeight: '1.4' }}>
            {ddaAdvisorMessage.reason}
          </p>
        </div>
      )}
      {/* Top Header */}
      <header className="portal-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="logo-glow" onClick={() => { setActiveGame(null); setShowDashboard(false); setPortalView('participant'); }} style={{ cursor: 'pointer', alignSelf: 'flex-start' }}>
            🧠 COGNICORE
          </div>
          {currentUser !== '' && portalView === 'participant' && (
            <button 
              onClick={() => setShowProfileModal(true)}
              title="View Profile & Stats"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <div style={{ width: '42px', height: '42px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '2px solid #38bdf8' }}>
                {inventory.find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id === 'avatar-robot' ? '🤖' :
                 inventory.find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id === 'avatar-brain' ? '🧠' :
                 inventory.find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id === 'avatar-hacker' ? '👨‍💻' : '👤'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '120px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#f8fafc' }}>{currentUser}</span>
                  <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 'bold' }}>Lv. {currentLevel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>🪙 {coins}</span>
                  {dailyRewardData && dailyRewardData.streak > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.1rem', fontWeight: 'bold' }}>🔥 {dailyRewardData.streak}</span>
                  )}
                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${xpPercent}%`, height: '100%', background: 'linear-gradient(to right, #38bdf8, #a855f7)' }}></div>
                  </div>
                </div>
              </div>
            </button>
          )}
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="dashboard-toggle-btn" 
                title="Store"
                onClick={() => setShowShop(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px'
                }}
              >
                <span>🛒</span>
              </button>


              
              <button 
                className="dashboard-toggle-btn" 
                title="Detailed History"
                onClick={() => setShowDashboard(!showDashboard)}
                style={{
                  background: showDashboard ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(to right, #38bdf8, #a855f7)',
                  color: '#ffffff',
                  border: '1px solid ' + (showDashboard ? 'rgba(255, 255, 255, 0.2)' : 'transparent'),
                  padding: '0.5rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: showDashboard ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px'
                }}
              >
                {showDashboard ? '🔙' : '📊'}
              </button>
            </div>
          )}

          <button 
            onClick={() => {
              const nextMute = !globalMuted;
              audioDda.setMuted(nextMute);
              setGlobalMuted(nextMute);
            }}
            title={globalMuted ? "Unmute Ambient Synthesizer" : "Mute Ambient Synthesizer"}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: globalMuted ? '#94a3b8' : '#38bdf8',
              padding: '0.4rem',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              width: '32px',
              height: '32px'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            {globalMuted ? '🔇' : '🔊'}
          </button>

          <button 
            onClick={() => setShowSoundTuner(!showSoundTuner)}
            title="Ambient Soundscape Tuner"
            style={{
              background: showSoundTuner ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: showSoundTuner ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: showSoundTuner ? '#c084fc' : '#38bdf8',
              padding: '0.4rem',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              width: '32px',
              height: '32px',
              marginLeft: '0.5rem'
            }}
            onMouseOver={(e) => { if (!showSoundTuner) e.target.style.background = 'rgba(255, 255, 255, 0.1)' }}
            onMouseOut={(e) => { if (!showSoundTuner) e.target.style.background = 'rgba(255, 255, 255, 0.05)' }}
          >
            🎛️
          </button>

          <div className="portal-status" style={{ marginLeft: '1rem' }}>
            <span className="status-dot"></span> Secure Telemetry Hub
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="portal-main" key={activeGame ? 'game' : showDashboard ? 'dash' : portalView === 'researcher' ? 'research' : 'select'}>
        {showSoundTuner && (
          <div className="game-card" style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            animation: 'fadeInDown 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            alignItems: 'stretch'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🎛️</span>
                <strong style={{ fontSize: '1rem', color: '#c084fc', letterSpacing: '0.05em' }}>AMBIENT SOUNDSCAPE TUNER</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '12px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{
                    width: '3px',
                    height: '100%',
                    backgroundColor: '#38bdf8',
                    borderRadius: '1px',
                    animation: `pulseGlow 1.2s infinite ease-in-out alternate`,
                    animationDelay: `${i * 0.15}s`
                  }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
              <div style={{ flex: '1', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Waveform Shape</span>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  {['sine', 'triangle', 'square'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        audioDda.setOscillatorType(type);
                        setOscillatorType(type);
                      }}
                      style={{
                        flex: 1,
                        background: oscillatorType === type ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: oscillatorType === type ? '1.5px solid #38bdf8' : '1.5px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        color: oscillatorType === type ? '#38bdf8' : '#e2e8f0',
                        padding: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textTransform: 'uppercase'
                      }}
                    >
                      {type === 'sine' ? '🔵 Sine' : type === 'triangle' ? '🔺 Triangle' : '⬛ Square'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: '2', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Tempo Multiplier</span>
                  <span style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 'bold' }}>{bpmMultiplier.toFixed(2)}x</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>0.5x</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={bpmMultiplier}
                    onChange={(e) => {
                      const mult = parseFloat(e.target.value);
                      audioDda.setBpmMultiplier(mult);
                      setBpmMultiplier(mult);
                    }}
                    style={{
                      flex: 1,
                      accentColor: '#38bdf8',
                      height: '5px',
                      borderRadius: '3px',
                      background: 'rgba(255,255,255,0.1)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>2.0x</span>
                </div>
              </div>

              <div style={{ flex: '2', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>DDA Smoothing Damping</span>
                  <span style={{ fontSize: '0.9rem', color: '#a855f7', fontWeight: 'bold' }}>
                    {smoothingAlpha === 1.0 ? 'Instant (1.0)' : smoothingAlpha <= 0.3 ? `Heavy Damping (${smoothingAlpha.toFixed(2)})` : `EMA Filter (${smoothingAlpha.toFixed(2)})`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>0.1 (Heavy)</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={smoothingAlpha}
                    onChange={(e) => setSmoothingAlpha(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: '#a855f7',
                      height: '5px',
                      borderRadius: '3px',
                      background: 'rgba(255,255,255,0.1)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>1.0 (None)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentUser === '' && portalView === 'participant' ? (
          // ONBOARDING / LOGIN VIEW
          <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '2.5rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '3rem' }}>🧠</span>
            </div>
            <h2 style={{ color: '#ffffff', margin: '0 0 0.5rem 0', textAlign: 'center', fontSize: '1.6rem', letterSpacing: '0.05em', fontWeight: 'bold' }}>COGNICORE TRAINING PORTAL</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 2rem 0', textAlign: 'center', lineHeight: '1.5' }}>
              Enter your researcher-assigned username to synchronize session telemetry, check pre-test status, or launch training loops.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Subject Username</label>
                <input 
                  type="text" 
                  value={usernameInput} 
                  onChange={(e) => setUsernameInput(e.target.value)} 
                  placeholder="e.g. subject_01" 
                  style={{ background: '#09090b', border: '1.5px solid rgba(168, 85, 247, 0.4)', borderRadius: '8px', color: '#ffffff', padding: '0.75rem', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              {assessmentError && <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ {assessmentError}</div>}
              <button
                onClick={() => handleCheckUserStatus(usernameInput)}
                disabled={assessmentLoading}
                style={{ background: 'linear-gradient(to right, #38bdf8, #a855f7)', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', width: '100%', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)' }}
                onMouseOver={(e) => e.target.style.filter = 'brightness(1.15)'}
                onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
              >
                {assessmentLoading ? 'Verifying Profile...' : 'Begin Cognitive Evaluation'}
              </button>
            </div>
          </div>
        ) : assessmentStage === 'pre-test' || assessmentStage === 'post-test' ? (
          // QUESTIONNAIRE VIEW
          <div style={{ maxWidth: '750px', margin: '3rem auto', padding: '2.5rem', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{ color: '#ffffff', margin: '0 0 0.5rem 0', textTransform: 'uppercase', fontSize: '1.6rem', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> {assessmentStage === 'pre-test' ? 'Phase 1: Objective Pre-Test Evaluation' : 'Phase 4: Objective Post-Test Evaluation'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 2rem 0', lineHeight: '1.6' }}>
              Complete the following 12 objective cognitive challenge tasks to evaluate your performance across visual, logical, reflexes, and strategy domains. 
              Grading is strictly binary (correct/incorrect) and will determine your cognitive profile.
            </p>
            <form onSubmit={handleSubmitAssessment} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {COGNITIVE_QUESTIONS.map((q, idx) => {
                  const dom = DOMAIN_INFO[q.domain];
                  return (
                    <div key={q.id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${dom.color}33`, borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '0.75rem', fontWeight: '500', lineHeight: '1.4' }}>
                        <span style={{ color: dom.color, marginRight: '0.5rem', fontWeight: 'bold' }}>{idx + 1}. {dom.icon} {q.title}</span>
                        <div style={{ marginTop: '0.5rem', color: '#cbd5e1' }}>{q.text}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', paddingLeft: '0.5rem' }}>
                        {q.options.map((opt) => (
                          <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none', padding: '0.5rem', borderRadius: '6px', background: assessmentAnswers[q.id] === opt.key ? 'rgba(255,255,255,0.05)' : 'transparent', border: assessmentAnswers[q.id] === opt.key ? `1px solid ${dom.color}66` : '1px solid transparent', transition: 'all 0.2s' }}>
                            <input 
                              type="radio" 
                              name={q.id} 
                              value={opt.key} 
                              checked={assessmentAnswers[q.id] === opt.key}
                              onChange={() => setAssessmentAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
                              style={{ accentColor: dom.color, transform: 'scale(1.1)' }}
                            />
                            <strong style={{ color: dom.color }}>{opt.key}:</strong> {opt.text}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {assessmentError && <div style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 'bold' }}>⚠️ {assessmentError}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Subject: <strong>{currentUser}</strong></span>
                <button
                  type="submit"
                  disabled={assessmentLoading}
                  style={{ background: 'linear-gradient(to right, #38bdf8, #a855f7)', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.8rem 2rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)' }}
                  onMouseOver={(e) => e.target.style.filter = 'brightness(1.15)'}
                  onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
                >
                  {assessmentLoading ? 'Submitting Responses...' : 'Submit Assessment'}
                </button>
              </div>
            </form>
          </div>
        ) : activeGame ? (

          <div className="game-screen-wrapper">
            <button className="back-btn" onClick={handleBackToLobby}>
              ← Back to Training Hub
            </button>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '2rem',
              width: '100%',
              maxWidth: '1200px',
              margin: '1rem auto 0 auto',
              alignItems: 'flex-start',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: '1', display: 'flex', justifyContent: 'center', minWidth: '280px', width: '100%' }}>
                <ErrorBoundary onReset={handleBackToLobby}>
                  <Suspense fallback={
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      maxWidth: '800px',
                      minHeight: '400px',
                      background: 'rgba(15, 23, 42, 0.4)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#94a3b8'
                    }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem', animation: 'pulse 1.5s infinite ease-in-out' }}>🧠</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.05em', color: '#38bdf8' }}>LOADING NEURAL WORKSPACE...</div>
                    </div>
                  }>
                    {activeGame === 'SpeedTap' && <SpeedTapGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'MemoryMatch' && <MemoryMatchGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'FocusFinder' && <FocusFinderGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'LogicLink' && <LogicLinkGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'PriorityQueue' && <PriorityQueueGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'MatrixRecall' && <MatrixRecallGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'StroopShift' && <StroopShiftGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'MentalFlex' && <MentalFlexGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'EquationBalance' && <EquationBalanceGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'SequenceDecoder' && <SequenceDecoderGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'RouteOptimizer' && <RouteOptimizerGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'NeuroMaze' && <NeuroMazeGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'NeuralNBack' && <NeuralNBackGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'SynapseSpin' && <SynapseSpinGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                    {activeGame === 'NexusMapper' && <NexusMapperGame username={activeDashboardUser} apiUrl="http://127.0.0.1:5000" onGameFinished={handleGameFinished} />}
                  </Suspense>
                </ErrorBoundary>
              </div>
              
              {activeSessionId && (
                <LiveDdaHud
                  gameType={activeGame}
                  ddaParameters={liveDdaParams}
                  cognitiveProfile={liveCognitiveProfile}
                  liveMetrics={liveMetrics}
                  advisorLogs={ddaAdvisorLogs}
                  isMuted={globalMuted}
                  onToggleMute={() => {
                    const nextMute = !globalMuted;
                    audioDda.setMuted(nextMute);
                    setGlobalMuted(nextMute);
                  }}
                />
              )}
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

            {/* Tab navigation buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '0.75rem',
              width: '100%'
            }}>
              <button
                onClick={() => setActiveResearcherTab('cohort-stats')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeResearcherTab === 'cohort-stats' ? '#38bdf8' : '#94a3b8',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '0.5rem 1.25rem',
                  borderBottom: activeResearcherTab === 'cohort-stats' ? '3px solid #38bdf8' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📊 Cohort Statistics & ISO 25010
              </button>
              <button
                onClick={() => setActiveResearcherTab('ai-sandbox')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeResearcherTab === 'ai-sandbox' ? '#38bdf8' : '#94a3b8',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '0.5rem 1.25rem',
                  borderBottom: activeResearcherTab === 'ai-sandbox' ? '3px solid #38bdf8' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🤖 AI Sandbox & Clustering
              </button>
            </div>

            {activeResearcherTab === 'cohort-stats' ? (
              <>
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
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Paired t-test Statistics</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                        t = {evalResult.t_statistic}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                        p = {evalResult.p_value}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Effect Size (Cohen's d)</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.25rem', color: '#ffffff' }}>
                        d = {evalResult.cohens_d !== undefined ? evalResult.cohens_d : '0.0000'}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}>
                        Magnitude: <span style={{
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                          color: evalResult.effect_size_magnitude === 'large' ? '#4ade80' :
                                 evalResult.effect_size_magnitude === 'medium' ? '#f59e0b' :
                                 evalResult.effect_size_magnitude === 'small' ? '#06b6d4' : '#64748b'
                        }}>
                          {evalResult.effect_size_magnitude || 'negligible'}
                        </span>
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

            <h2 className="section-title" style={{ marginTop: '2.5rem' }}>🔬 Interactive Statistical Sandbox & Correlation Tool</h2>
            <div className="game-card" style={{ width: '100%', alignItems: 'stretch', padding: '2rem', marginBottom: '2rem', boxSizing: 'border-box' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '0.9rem' }}>Pillar 1 Dynamic Correlation Analysis & Cohort Comparison</span>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                  Analyze relationships between cognitive micro-behaviors and performance telemetry on-the-fly. Select any two parameters to compute the Pearson Correlation Coefficient (r), R-squared (R²), and statistical significance (p-value).
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>X-Axis Variable (Var 1):</label>
                  <select
                    value={sandboxVar1}
                    onChange={(e) => setSandboxVar1(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="reaction_time">Reaction Time (ms)</option>
                    <option value="accuracy_rate">Accuracy Rate</option>
                    <option value="difficulty_level">Challenge Level</option>
                    <option value="error_count">Error Count</option>
                    <option value="hesitation_ms">Hesitation Latency (ms)</option>
                    <option value="spam_click_count">Spam Click Count</option>
                    <option value="rule_shift_latency_ms">Rule-Shift Latency (ms)</option>
                    <option value="path_efficiency">Path Efficiency</option>
                  </select>
                </div>

                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>Y-Axis Variable (Var 2):</label>
                  <select
                    value={sandboxVar2}
                    onChange={(e) => setSandboxVar2(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="spam_click_count">Spam Click Count</option>
                    <option value="rule_shift_shift_ms">Rule-Shift Latency (ms)</option>
                    <option value="rule_shift_latency_ms">Rule-Shift Latency (ms)</option>
                    <option value="reaction_time">Reaction Time (ms)</option>
                    <option value="accuracy_rate">Accuracy Rate</option>
                    <option value="difficulty_level">Challenge Level</option>
                    <option value="error_count">Error Count</option>
                    <option value="hesitation_ms">Hesitation Latency (ms)</option>
                    <option value="path_efficiency">Path Efficiency</option>
                  </select>
                </div>

                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>Select Analysis Cohort:</label>
                  <select
                    value={sandboxCohort}
                    onChange={(e) => setSandboxCohort(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="all">All Subjects Cohort (General)</option>
                    <option value="clinical">Clinical Research Cohort (clinical_subject_*)</option>
                    <option value="active">Active Participant ({activeDashboardUser})</option>
                  </select>
                </div>
              </div>

              {sandboxLoading && <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Recalculating Pearson Correlation Matrices...</div>}
              {sandboxError && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{sandboxError}</div>}

              {!sandboxLoading && correlationResult && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                    <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
                      <h4 style={{ color: '#38bdf8', fontSize: '1.05rem', margin: '0 0 1rem 0', fontWeight: 'bold' }}>📉 Pearson Correlation Coefficient</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Pearson r Coefficient</span>
                          <span style={{ fontSize: '2rem', fontWeight: '900', color: correlationResult.r >= 0 ? '#38bdf8' : '#fb923c' }}>{correlationResult.r}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>R-squared (R²)</span>
                          <span style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff' }}>{correlationResult.r_squared}</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>p-value Significance</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: correlationResult.p_value < 0.05 ? '#4ade80' : '#f87171' }}>p = {correlationResult.p_value}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Correlation Magnitude</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'capitalize', color: correlationResult.magnitude === 'strong' ? '#4ade80' : correlationResult.magnitude === 'moderate' ? '#f59e0b' : '#94a3b8' }}>
                            {correlationResult.magnitude} ({correlationResult.direction})
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: '1.5rem', padding: '0.85rem', borderRadius: '8px', fontSize: '0.85rem', lineHeight: '1.45', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                        <strong>💡 Interpretation:</strong> {correlationResult.interpretation}
                      </div>
                    </div>

                    {learningCurves && (
                      <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
                        <h4 style={{ color: '#4ade80', fontSize: '1.05rem', margin: '0 0 0.75rem 0', fontWeight: 'bold' }}>📈 Learning Curves Analysis</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.25rem 0' }}>
                          Compare training progression rates side-by-side. View longitudinal improvement over sessions.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setCurveMetric('accuracy')}
                            style={{
                              flex: 1,
                              padding: '0.45rem',
                              borderRadius: '6px',
                              border: '1px solid ' + (curveMetric === 'accuracy' ? 'transparent' : 'rgba(255,255,255,0.1)'),
                              background: curveMetric === 'accuracy' ? 'linear-gradient(to right, #4ade80, #38bdf8)' : 'rgba(255,255,255,0.03)',
                              color: '#fff',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Accuracy Rate (%)
                          </button>
                          <button
                            onClick={() => setCurveMetric('reaction_time')}
                            style={{
                              flex: 1,
                              padding: '0.45rem',
                              borderRadius: '6px',
                              border: '1px solid ' + (curveMetric === 'reaction_time' ? 'transparent' : 'rgba(255,255,255,0.1)'),
                              background: curveMetric === 'reaction_time' ? 'linear-gradient(to right, #4ade80, #38bdf8)' : 'rgba(255,255,255,0.03)',
                              color: '#fff',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Reaction Time (ms)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '320px', boxSizing: 'border-box' }}>
                      <h4 style={{ color: '#e2e8f0', fontSize: '1rem', margin: '0 0 1rem 0', fontWeight: 'bold', textAlign: 'left' }}>Scatter Plot & Regression Line</h4>
                      <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 30px)' }}>
                        <Scatter data={getScatterChartData()} options={scatterChartOptions} />
                      </div>
                    </div>

                    {learningCurves && (
                      <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '320px', boxSizing: 'border-box' }}>
                        <h4 style={{ color: '#e2e8f0', fontSize: '1rem', margin: '0 0 1rem 0', fontWeight: 'bold', textAlign: 'left' }}>Longitudinal Cohort Comparison Curves</h4>
                        <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 30px)' }}>
                          <Line data={getLearningCurvesChartData()} options={learningCurvesChartOptions} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s ease-out', width: '100%' }}>
            <h2 className="section-title">AI Sandbox & Dynamic Archetype Clustering</h2>
            
            {/* STATUS & RETRAIN SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              
              {/* Active Model Status Card */}
              <div className="game-card" style={{ flex: '1', alignItems: 'stretch', padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🤖 Active Model Status
                </h3>
                
                {modelStatus ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Python Scikit-Learn:</span>
                      <span style={{ fontWeight: 'bold', color: modelStatus.is_sklearn_available ? '#4ade80' : '#ef4444' }}>
                        {modelStatus.is_sklearn_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loaded From Pickles:</span>
                      <span style={{ fontWeight: 'bold', color: modelStatus.is_loaded_from_disk ? '#4ade80' : '#f59e0b' }}>
                        {modelStatus.is_loaded_from_disk ? 'Yes (Disk)' : 'No (Synthetic Fallback)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Training Session Size:</span>
                      <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>
                        {modelStatus.dataset_size} sessions
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>DDA Classifiers Loaded:</span>
                      <span style={{ fontWeight: 'bold', color: modelStatus.has_rf_model ? '#4ade80' : '#ef4444' }}>
                        {modelStatus.has_rf_model ? 'Ready' : 'Not Loaded'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Clustering Model (KMeans):</span>
                      <span style={{ fontWeight: 'bold', color: modelStatus.has_clustering_model ? '#4ade80' : '#ef4444' }}>
                        {modelStatus.has_clustering_model ? 'Ready' : 'Not Loaded'}
                      </span>
                    </div>
                    
                    {modelStatus.hyperparameters && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Active Classifier Hyperparams:</span>
                        <pre style={{ margin: 0, padding: '0.75rem', background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto', color: '#38bdf8' }}>
                          {JSON.stringify({
                            n_estimators: modelStatus.hyperparameters.n_estimators || 50,
                            max_depth: modelStatus.hyperparameters.max_depth || 6,
                            min_samples_split: modelStatus.hyperparameters.min_samples_split || 2,
                            criterion: modelStatus.hyperparameters.criterion || 'gini'
                          }, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>Loading model status...</div>
                )}
              </div>

              {/* Retrain Control Panel */}
              <div className="game-card" style={{ flex: '1', alignItems: 'stretch', padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚙️ Retrain & Optimize Engine
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.5rem 0', lineHeight: '1.4' }}>
                  Trigger online retraining of the supervised DDA classifier. The engine runs unsupervised K-Means clustering ($k=3$) over 7 telemetry dimensions to form fresh player archetypes, then retrains a Random Forest Classifier via Grid Search to predict these labels.
                </p>
                
                <button
                  onClick={triggerModelRetrain}
                  disabled={retrainLoading}
                  className="dashboard-toggle-btn"
                  style={{
                    background: 'linear-gradient(to right, #38bdf8, #a855f7)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                    cursor: retrainLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    transition: 'all 0.2s',
                    marginBottom: '1rem'
                  }}
                >
                  {retrainLoading ? (
                    <>
                      <span className="spinner" style={{ display: 'inline-block', width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                      Executing Grid Search Retraining...
                    </>
                  ) : (
                    '⚡ Retrain & Tune Classifier'
                  )}
                </button>

                {retrainMetrics ? (
                  <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
                    <h4 style={{ color: '#4ade80', margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 'bold' }}>✓ Retraining Successful</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Validation Accuracy:</span>
                        <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '1.1rem' }}>{(retrainMetrics.test_accuracy * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Optimized Hyperparams:</span>
                        <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>
                          d={retrainMetrics.best_params.max_depth || 'none'}, est={retrainMetrics.best_params.n_estimators}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                    No retraining has been executed in the current session.
                  </div>
                )}
              </div>
            </div>

            {/* CENTROIDS & METRICS MATRIX */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              
              {/* Centroids Table */}
              <div className="game-card" style={{ flex: '1', alignItems: 'stretch', padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  📊 Dynamic Archetype Centroids
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                  The average performance values for each discovered archetype, computed dynamically across the database cohort:
                </p>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                        <th style={{ padding: '0.5rem' }}>Behavioral Metric</th>
                        <th style={{ padding: '0.5rem', color: '#ef4444' }}>High Fatigue</th>
                        <th style={{ padding: '0.5rem', color: '#f59e0b' }}>Plateauing</th>
                        <th style={{ padding: '0.5rem', color: '#10b981' }}>Fast Learner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'accuracy', name: 'Accuracy Rate', format: (v) => `${(v * 100).toFixed(1)}%` },
                        { key: 'reaction_time', name: 'Reaction Time', format: (v) => `${v.toFixed(0)} ms` },
                        { key: 'hesitation', name: 'Hesitation Latency', format: (v) => `${v.toFixed(0)} ms` },
                        { key: 'spam_clicks', name: 'Spam Click Count', format: (v) => v.toFixed(1) },
                        { key: 'path_efficiency', name: 'Path Efficiency', format: (v) => v.toFixed(2) }
                      ].map((metric) => {
                        const centroids = getCalculatedCentroids();
                        return (
                          <tr key={metric.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#e2e8f0' }}>{metric.name}</td>
                            <td style={{ padding: '0.5rem', color: '#f87171' }}>
                              {centroids["High Fatigue"] && centroids["High Fatigue"][metric.key] !== undefined ? metric.format(centroids["High Fatigue"][metric.key]) : 'N/A'}
                            </td>
                            <td style={{ padding: '0.5rem', color: '#fbbf24' }}>
                              {centroids["Plateauing"] && centroids["Plateauing"][metric.key] !== undefined ? metric.format(centroids["Plateauing"][metric.key]) : 'N/A'}
                            </td>
                            <td style={{ padding: '0.5rem', color: '#34d399' }}>
                              {centroids["Fast Learner"] && centroids["Fast Learner"][metric.key] !== undefined ? metric.format(centroids["Fast Learner"][metric.key]) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Classification Report Card */}
              <div className="game-card" style={{ flex: '1', alignItems: 'stretch', padding: '2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px' }}>
                <h3 style={{ color: '#38bdf8', marginBottom: '1.25rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  📈 Classification Performance Report
                </h3>
                {retrainMetrics && retrainMetrics.classification_report ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                          <th style={{ padding: '0.5rem' }}>Archetype Class</th>
                          <th style={{ padding: '0.5rem' }}>Precision</th>
                          <th style={{ padding: '0.5rem' }}>Recall</th>
                          <th style={{ padding: '0.5rem' }}>F1-Score</th>
                          <th style={{ padding: '0.5rem' }}>Support</th>
                        </tr>
                      </thead>
                      <tbody>
                        {["Fast Learner", "Plateauing", "High Fatigue"].map((clsName) => {
                          const stats = retrainMetrics.classification_report[clsName];
                          if (!stats) return null;
                          return (
                            <tr key={clsName} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '0.5rem', fontWeight: 'bold', color: clsName === 'Fast Learner' ? '#34d399' : clsName === 'Plateauing' ? '#fbbf24' : '#f87171' }}>{clsName}</td>
                              <td style={{ padding: '0.5rem' }}>{stats.precision.toFixed(3)}</td>
                              <td style={{ padding: '0.5rem' }}>{stats.recall.toFixed(3)}</td>
                              <td style={{ padding: '0.5rem' }}>{stats['f1-score'].toFixed(3)}</td>
                              <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{stats.support}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', color: '#e2e8f0' }}>
                          <td style={{ padding: '0.5rem' }}>Accuracy</td>
                          <td style={{ padding: '0.5rem' }}></td>
                          <td style={{ padding: '0.5rem' }}></td>
                          <td style={{ padding: '0.5rem' }}>{retrainMetrics.classification_report.accuracy.toFixed(3)}</td>
                          <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{retrainMetrics.classification_report.macro_avg ? retrainMetrics.classification_report.macro_avg.support : ''}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', padding: '3rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                    💡 Run model retraining to retrieve classification metrics (precision, recall, f1-score).
                  </div>
                )}
              </div>
            </div>

            {/* 2D SCATTER PLOT VIEW */}
            <div className="game-card" style={{ width: '100%', alignItems: 'stretch', padding: '2rem', boxSizing: 'border-box', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px' }}>
              <h3 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                🎯 Interactive 2D Archetype Space
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.5rem 0' }}>
                Plot sessions in a 2-dimensional scatter space colored by cluster archetype. Select metrics for X and Y axes to observe feature boundaries.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>Horizontal X-Axis Metric:</label>
                  <select
                    value={clusterXVar}
                    onChange={(e) => setClusterXVar(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="accuracy">Accuracy Rate</option>
                    <option value="reaction_time">Reaction Time (ms)</option>
                    <option value="acc_slope">Accuracy Learning Slope</option>
                    <option value="rt_slope">Reaction Time Learning Slope</option>
                    <option value="hesitation">Hesitation Latency (ms)</option>
                    <option value="spam_clicks">Spam Clicks</option>
                    <option value="path_efficiency">Path Efficiency</option>
                  </select>
                </div>

                <div style={{ flex: '1', minWidth: '200px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 'bold' }}>Vertical Y-Axis Metric:</label>
                  <select
                    value={clusterYVar}
                    onChange={(e) => setClusterYVar(e.target.value)}
                    style={{ background: '#09090b', color: '#fff', border: '1.5px solid #334155', borderRadius: '6px', padding: '0.5rem', width: '100%', outline: 'none' }}
                  >
                    <option value="accuracy">Accuracy Rate</option>
                    <option value="reaction_time">Reaction Time (ms)</option>
                    <option value="acc_slope">Accuracy Learning Slope</option>
                    <option value="rt_slope">Reaction Time Learning Slope</option>
                    <option value="hesitation">Hesitation Latency (ms)</option>
                    <option value="spam_clicks">Spam Clicks</option>
                    <option value="path_efficiency">Path Efficiency</option>
                  </select>
                </div>
              </div>

              {clusterLoading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading cluster points...</div>}
              {clusterError && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{clusterError}</div>}

              {!clusterLoading && clusterDataPoints.length > 0 && (
                <div style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '420px', boxSizing: 'border-box' }}>
                  <h4 style={{ color: '#e2e8f0', fontSize: '1rem', margin: '0 0 1rem 0', fontWeight: 'bold', textAlign: 'left' }}>Cohort Sessions Spatial Grouping</h4>
                  <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 30px)' }}>
                    <Scatter data={getClusteringScatterData()} options={clusteringScatterOptions} />
                  </div>
                </div>
              )}
              
              {!clusterLoading && clusterDataPoints.length === 0 && (
                <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  No sessions data available for clustering. Play some games first!
                </div>
              )}
            </div>
          </div>
        )}
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
              
              {/* Spatial-Visual Memory Card */}
              <div className="game-card" style={{ 
                padding: '1.25rem 1.5rem', 
                borderLeft: '4px solid #38bdf8', 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem',
                minWidth: '260px',
                boxSizing: 'border-box'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Spatial-Visual Memory</span>
                    {domainDeltas.spatial_visual_memory !== 0 && (
                      <span style={{
                        background: domainDeltas.spatial_visual_memory > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: domainDeltas.spatial_visual_memory > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: domainDeltas.spatial_visual_memory > 0 ? '#4ade80' : '#f87171',
                        fontSize: '0.65rem',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                        boxShadow: domainDeltas.spatial_visual_memory > 0 ? '0 0 6px rgba(34, 197, 94, 0.15)' : '0 0 6px rgba(239, 68, 68, 0.15)'
                      }}>
                        {domainDeltas.spatial_visual_memory > 0 ? `+${domainDeltas.spatial_visual_memory}` : domainDeltas.spatial_visual_memory}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.85rem', margin: '0.25rem 0', color: '#38bdf8', fontWeight: '800' }}>
                    {skills.spatial_visual_memory}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
                  </h3>
                  <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.35' }}>
                    Short-Term grid sequence recall and spatial working capacity.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <ProgressRing radius={30} stroke={3.5} progress={skills.spatial_visual_memory / 100} color="#38bdf8" />
                  <span style={{ position: 'absolute', fontSize: '1.1rem' }}>🧠</span>
                </div>
              </div>

              {/* Logical Reasoning Card */}
              <div className="game-card" style={{ 
                padding: '1.25rem 1.5rem', 
                borderLeft: '4px solid #f59e0b', 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem',
                minWidth: '260px',
                boxSizing: 'border-box'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Logical Reasoning</span>
                    {domainDeltas.logical_mathematical !== 0 && (
                      <span style={{
                        background: domainDeltas.logical_mathematical > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: domainDeltas.logical_mathematical > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: domainDeltas.logical_mathematical > 0 ? '#4ade80' : '#f87171',
                        fontSize: '0.65rem',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                        boxShadow: domainDeltas.logical_mathematical > 0 ? '0 0 6px rgba(34, 197, 94, 0.15)' : '0 0 6px rgba(239, 68, 68, 0.15)'
                      }}>
                        {domainDeltas.logical_mathematical > 0 ? `+${domainDeltas.logical_mathematical}` : domainDeltas.logical_mathematical}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.85rem', margin: '0.25rem 0', color: '#f59e0b', fontWeight: '800' }}>
                    {skills.logical_mathematical}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
                  </h3>
                  <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.35' }}>
                    Logical sequencing, path optimization, and relational connections.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <ProgressRing radius={30} stroke={3.5} progress={skills.logical_mathematical / 100} color="#f59e0b" />
                  <span style={{ position: 'absolute', fontSize: '1.1rem' }}>🔢</span>
                </div>
              </div>

              {/* Reflexes & Focus Card */}
              <div className="game-card" style={{ 
                padding: '1.25rem 1.5rem', 
                borderLeft: '4px solid #a855f7', 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem',
                minWidth: '260px',
                boxSizing: 'border-box'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Reflexes & Focus</span>
                    {domainDeltas.reflexes_and_focus !== 0 && (
                      <span style={{
                        background: domainDeltas.reflexes_and_focus > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: domainDeltas.reflexes_and_focus > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: domainDeltas.reflexes_and_focus > 0 ? '#4ade80' : '#f87171',
                        fontSize: '0.65rem',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                        boxShadow: domainDeltas.reflexes_and_focus > 0 ? '0 0 6px rgba(34, 197, 94, 0.15)' : '0 0 6px rgba(239, 68, 68, 0.15)'
                      }}>
                        {domainDeltas.reflexes_and_focus > 0 ? `+${domainDeltas.reflexes_and_focus}` : domainDeltas.reflexes_and_focus}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.85rem', margin: '0.25rem 0', color: '#a855f7', fontWeight: '800' }}>
                    {skills.reflexes_and_focus}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
                  </h3>
                  <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.35' }}>
                    Continuous visual search, rapid target identification, and motor response.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <ProgressRing radius={30} stroke={3.5} progress={skills.reflexes_and_focus / 100} color="#a855f7" />
                  <span style={{ position: 'absolute', fontSize: '1.1rem' }}>⚡</span>
                </div>
              </div>

              {/* Executive Strategy Card */}
              <div className="game-card" style={{ 
                padding: '1.25rem 1.5rem', 
                borderLeft: '4px solid #10b981', 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem',
                minWidth: '260px',
                boxSizing: 'border-box'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Executive Strategy</span>
                    {domainDeltas.executive_strategy !== 0 && (
                      <span style={{
                        background: domainDeltas.executive_strategy > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: domainDeltas.executive_strategy > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: domainDeltas.executive_strategy > 0 ? '#4ade80' : '#f87171',
                        fontSize: '0.65rem',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '9999px',
                        fontWeight: 'bold',
                        boxShadow: domainDeltas.executive_strategy > 0 ? '0 0 6px rgba(34, 197, 94, 0.15)' : '0 0 6px rgba(239, 68, 68, 0.15)'
                      }}>
                        {domainDeltas.executive_strategy > 0 ? `+${domainDeltas.executive_strategy}` : domainDeltas.executive_strategy}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.85rem', margin: '0.25rem 0', color: '#10b981', fontWeight: '800' }}>
                    {skills.executive_strategy}<span style={{ fontSize: '0.9rem', color: '#64748b' }}>/100</span>
                  </h3>
                  <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.35' }}>
                    Multi-step pathfinding and spatial maze escape navigation planning.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <ProgressRing radius={30} stroke={3.5} progress={skills.executive_strategy / 100} color="#10b981" />
                  <span style={{ position: 'absolute', fontSize: '1.1rem' }}>🧭</span>
                </div>
              </div>

            </div>

            {/* Middle Row: Trend Vector SVG + Radar Chart */}
            <div className="dashboard-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              
              {/* Difficulty Adaptation Plot */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>📈 Difficulty Adaptation History</h3>
                <div style={{ position: 'relative', height: '240px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%' }}>
                      <div className="skeleton-box" style={{ height: '15px', width: '30%' }}></div>
                      <div className="skeleton-box" style={{ flex: 1, width: '100%' }}></div>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%' }}>
                      <div className="skeleton-box" style={{ height: '15px', width: '40%' }}></div>
                      <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'flex-end' }}>
                        <div className="skeleton-box" style={{ height: '60%', flex: 1 }}></div>
                        <div className="skeleton-box" style={{ height: '90%', flex: 1 }}></div>
                      </div>
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
                  <Radar data={radarDataEnhanced} options={radarOptions} />
                </div>
              </div>
            </div>

            {/* Premium Analytics row */}
            <h2 className="section-title">Premium Cognitive Analytics</h2>
            <div className="dashboard-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              
              {/* Multi-Session Reaction Time Trend */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📈</span> Multi-Session RT Trend
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.25rem 0', lineHeight: '1.3' }}>
                  Progression of speed and EMA trend over previous active game sessions.
                </p>
                <div style={{ position: 'relative', height: '220px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%' }}>
                      <div className="skeleton-box" style={{ height: '15px', width: '30%' }}></div>
                      <div className="skeleton-box" style={{ flex: 1, width: '100%' }}></div>
                    </div>
                  ) : reversedSessions.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                      <span>No session history found.</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Complete sessions to plot learning trends.</span>
                    </div>
                  ) : (
                    <Line data={sessionTrendData} options={sessionTrendOptions} />
                  )}
                </div>
              </div>

              {/* Per-Domain Accuracy Breakdown */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🎯</span> Per-Domain Accuracy
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.25rem 0', lineHeight: '1.3' }}>
                  Average task precision and success rate percentages across cognitive domains.
                </p>
                <div style={{ position: 'relative', height: '220px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%', justifyContent: 'space-around' }}>
                      <div className="skeleton-box" style={{ height: '20px', width: '70%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '90%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '50%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '80%' }}></div>
                    </div>
                  ) : sessionHistory.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                      <span>No domain accuracy data.</span>
                    </div>
                  ) : (
                    <Bar data={domainAccData} options={domainAccOptions} />
                  )}
                </div>
              </div>

              {/* Per-Game Score Breakdown */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏆</span> Per-Game Best Scores
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.25rem 0', lineHeight: '1.3' }}>
                  Highest performance index achieved across specific game modules.
                </p>
                <div style={{ position: 'relative', height: '220px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', height: '100%', justifyContent: 'space-around' }}>
                      <div className="skeleton-box" style={{ height: '20px', width: '85%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '65%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '95%' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '45%' }}></div>
                    </div>
                  ) : sortedGames.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                      <span>No high scores recorded.</span>
                    </div>
                  ) : (
                    <Bar data={perGameScoreData} options={perGameScoreOptions} />
                  )}
                </div>
              </div>

              {/* Accuracy vs RT Scatter Plot */}
              <div className="game-card" style={{ width: '100%', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✨</span> Reaction Time vs Accuracy
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.25rem 0', lineHeight: '1.3' }}>
                  Execution speed mapped against success rate for the current session.
                </p>
                <div style={{ position: 'relative', height: '220px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', padding: '10px' }}>
                  {chartsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                      Loading scatter distribution...
                    </div>
                  ) : latestSessionMetrics.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                      <span>No metrics in current session.</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#4b5563' }}>Complete a training round to populate.</span>
                    </div>
                  ) : (
                    <Scatter data={scatterData} options={scatterOptions} />
                  )}
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
            {preTestScores && !hasPlayedPrescribed && (
              <div style={{ marginBottom: '3rem' }}>
                <PretestResults 
                  preTestScores={preTestScores} 
                  weakestDomain={weakestDomain} 
                  prescribedGame={prescribedGame}
                  personalizedReport={personalizedReport}
                  onStartPrescribedGame={() => {
                    const domain = DOMAINS_LIST.find(d => d.games.some(g => g.id === prescribedGame));
                    const gameInfo = domain?.games.find(g => g.id === prescribedGame);
                    if (gameInfo && domain) {
                      setPendingGameToLaunch({ ...gameInfo, themeClass: domain.themeClass });
                    }
                  }}
                />
              </div>
            )}
            
            <div className="intro-card">
              <h1>Adaptive Neuro-Training Portal</h1>
              <p>Welcome to CogniCore. Access clinically validated serious game modules designed to assess cognitive processing speed, selective attention, and executive function. Real-time telemetry is recorded to construct your adaptive cognitive profile.</p>
            </div>

            {/* Daily Personalized Workout */}
            {weakestDomain && DOMAINS_LIST.find(d => d.id === weakestDomain) && (
              <div style={{ marginBottom: '3.5rem' }}>
                <h2 className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🧠 Daily Personalized Workout <span style={{ fontSize: '1rem', color: '#a855f7', fontWeight: 'normal', marginLeft: '0.5rem' }}>— Target: {DOMAINS_LIST.find(d => d.id === weakestDomain).title}</span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {DOMAINS_LIST.find(d => d.id === weakestDomain).games.slice(0, 3).map((game) => (
                    <div key={game.id} className="game-card glass-panel" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => { audioEngine.playClick(); launchGame(game.id); }} onMouseEnter={() => audioEngine.playHover()}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #a855f7, #38bdf8)' }}></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '2.5rem', width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {game.icon}
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1.25rem' }}>{game.title}</h3>
                          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', borderRadius: '4px', fontWeight: 'bold' }}>Recommended</span>
                        </div>
                      </div>
                      <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                        {game.objective}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cognitive Targets & Milestones (Option C) */}
            <div className="goals-section-container" style={{ marginBottom: '3.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="section-title" style={{ margin: 0 }}>🎯 Cognitive Targets & Milestones</h2>
                <button
                  onClick={() => setShowGoalForm(!showGoalForm)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  {showGoalForm ? 'Close Target Creator' : '➕ Create New Target'}
                </button>
              </div>

              {/* Collapsible Glassmorphic Goal Form */}
              {showGoalForm && (
                <form onSubmit={createGoal} className="game-card" style={{
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  animation: 'fadeInDown 0.3s ease-out'
                }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#c084fc' }}>Configure Personal Training Goal</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    
                    {/* Domain Selector */}
                    <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Cognitive Domain</label>
                      <select
                        value={goalDomain}
                        onChange={(e) => setGoalDomain(e.target.value)}
                        style={{
                          background: '#09090b',
                          border: '1.5px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          padding: '0.5rem',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      >
                        <option value="reflexes_and_focus">⚡ Reflexes & Focus</option>
                        <option value="spatial_visual_memory">🧠 Memory & Recall</option>
                        <option value="logical_mathematical">🔢 Logical Reasoning</option>
                        <option value="executive_strategy">🧭 Executive Strategy</option>
                      </select>
                    </div>

                    {/* Metric Selector */}
                    <div style={{ flex: '1', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Performance Metric</label>
                      <select
                        value={goalMetric}
                        onChange={(e) => {
                          setGoalMetric(e.target.value);
                          if (e.target.value === 'accuracy') setGoalTarget('80');
                          else if (e.target.value === 'reaction_time') setGoalTarget('600');
                          else if (e.target.value === 'difficulty') setGoalTarget('3');
                        }}
                        style={{
                          background: '#09090b',
                          border: '1.5px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          padding: '0.5rem',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      >
                        <option value="accuracy">Accuracy Rate (%)</option>
                        <option value="reaction_time">Average Response Latency (ms)</option>
                        <option value="difficulty">Challenge Level (1-5)</option>
                      </select>
                    </div>

                    {/* Target Value Input */}
                    <div style={{ flex: '1', minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>
                        Target Value {goalMetric === 'accuracy' ? '(%)' : goalMetric === 'reaction_time' ? '(ms)' : '(1-5)'}
                      </label>
                      <input
                        type="number"
                        min={goalMetric === 'accuracy' ? '1' : '1'}
                        max={goalMetric === 'accuracy' ? '100' : goalMetric === 'difficulty' ? '5' : '10000'}
                        step={goalMetric === 'difficulty' ? '1' : '0.1'}
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value)}
                        style={{
                          background: '#09090b',
                          border: '1.5px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          padding: '0.5rem',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      style={{
                        background: 'linear-gradient(to right, #a855f7, #38bdf8)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(168, 85, 247, 0.25)',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                      onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
                    >
                      Establish Target Goal
                    </button>
                  </div>
                </form>
              )}

              {/* Grid Layout containing active goals and milestones */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                
                {/* Active Goals Section */}
                <div className="game-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>🎯 Active Targets</h3>
                  
                  {goalsLoading ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                      Loading personal cognitive goals...
                    </div>
                  ) : goalsError ? (
                    <div style={{ color: '#f87171', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                      ⚠️ Error loading goals: {goalsError}
                    </div>
                  ) : goals.filter(g => !g.is_completed).length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                      No active goals set. Click "Create New Target" above to define your next neuro-training milestone!
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      {goals.filter(g => !g.is_completed).map(goal => {
                        const domainObj = DOMAIN_INFO[goal.domain] || { title: goal.domain, color: '#a855f7', icon: '🎯' };
                        const progress = getGoalProgress(goal);
                        const displayProgress = Math.min(100, Math.round(progress * 100));
                        
                        return (
                          <div
                            key={goal.id}
                            style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: `1.5px solid rgba(255, 255, 255, 0.05)`,
                              borderRadius: '12px',
                              padding: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontSize: '1.1rem' }}>{domainObj.icon}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: domainObj.color }}>
                                  {domainObj.title}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                                Target: <strong style={{ color: '#ffffff' }}>{goal.target_value}{goal.metric_type === 'accuracy' ? '%' : goal.metric_type === 'reaction_time' ? 'ms' : ''}</strong> ({goal.metric_type.replace(/_/g, ' ')})
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                Current Avg/Max: <strong style={{ color: '#ffffff' }}>{goal.current_value || '0'}{goal.metric_type === 'accuracy' ? '%' : goal.metric_type === 'reaction_time' ? 'ms' : ''}</strong>
                              </div>
                            </div>

                            {/* SVG Circular Progress Ring */}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px' }}>
                              <ProgressRing radius={32} stroke={3} progress={progress} color={domainObj.color} />
                              <span style={{
                                position: 'absolute',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: '#ffffff'
                              }}>
                                {displayProgress}%
                              </span>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => deleteGoal(goal.id)}
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                fontSize: '1.1rem',
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.color = '#ef4444'}
                              onMouseOut={(e) => e.target.style.color = '#64748b'}
                              title="Delete goal"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Milestone Badges Section */}
                <div className="game-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>🏆 Completed Milestones</h3>
                  
                  {goalsLoading ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                      Loading completed milestones...
                    </div>
                  ) : goals.filter(g => g.is_completed).length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                      No completed milestones yet. Complete training targets during gameplay to unlock permanent achievement badges!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {goals.filter(g => g.is_completed).map(goal => {
                        const domainObj = DOMAIN_INFO[goal.domain] || { title: goal.domain, color: '#a855f7', icon: '🏆' };
                        
                        // Dynamic badge name/class based on domain and metric
                        let badgeTitle = "Novice Challenger";
                        if (goal.metric_type === 'accuracy') {
                          badgeTitle = `${domainObj.title.split(' ')[0]} Marksman`;
                        } else if (goal.metric_type === 'reaction_time') {
                          badgeTitle = `${domainObj.title.split(' ')[0]} Speedster`;
                        } else if (goal.metric_type === 'difficulty') {
                          badgeTitle = `${domainObj.title.split(' ')[0]} Master`;
                        }

                        return (
                          <div
                            key={goal.id}
                            style={{
                              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4), rgba(17, 94, 89, 0.4))',
                              border: `2px solid #a855f7`,
                              borderRadius: '12px',
                              padding: '0.75rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              boxShadow: '0 0 15px rgba(168, 85, 247, 0.2), inset 0 1px 1px rgba(255,255,255,0.05)',
                              animation: 'pulseGlow 2.5s infinite alternate',
                              position: 'relative'
                            }}
                          >
                            <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 5px #a855f7)' }}>🏅</span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ffffff' }}>
                                {badgeTitle}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                                Completed {goal.metric_type.replace(/_/g, ' ')}: {goal.target_value}{goal.metric_type === 'accuracy' ? '%' : goal.metric_type === 'reaction_time' ? 'ms' : ''} target ({domainObj.title})
                              </span>
                            </div>
                            
                            {/* Delete Completed Goal Button */}
                            <button
                              onClick={() => deleteGoal(goal.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.3)',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                marginLeft: '0.5rem',
                                alignSelf: 'center',
                                transition: 'color 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.color = '#ef4444'}
                              onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.3)'}
                              title="Delete milestone"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
              <DailyQuests />
            </div>

            {/* Quasi-Experimental Analytics Banner */}
            {preTestScores && (
              <div className="game-card" style={{
                padding: '2rem',
                marginBottom: '3rem',
                background: 'rgba(24, 24, 27, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1.5px dashed rgba(168, 85, 247, 0.4)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>🧭</span> Quasi-Experimental Research Track
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Subject ID: <strong>{currentUser}</strong> | Mapped Weakest Domain: <strong style={{ color: '#38bdf8' }}>{weakestDomain?.replace(/_/g, ' ').toUpperCase()}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {assessmentStage === 'completed' ? (
                      <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid #4ade80', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        ✓ Evaluation Finalized
                      </span>
                    ) : hasPlayedPrescribed ? (
                      <button
                        onClick={() => {
                          setAssessmentAnswers({
                            q1: '', q2: '', q3: '', q4: '',
                            q5: '', q6: '', q7: '', q8: '',
                            q9: '', q10: '', q11: '', q12: ''
                          });
                          setAssessmentStage('post-test');
                        }}
                        style={{
                          background: 'linear-gradient(to right, #4ade80, #38bdf8)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.5rem 1.25rem',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(74, 222, 128, 0.2)'
                        }}
                      >
                        ✍ Take Post-Test Questionnaire
                      </button>
                    ) : (
                      <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        ⌛ Play Prescribed Game to Unlock Post-Test
                      </span>
                    )}
                  </div>
                </div>

                {/* VIEW SWITCH TOGGLE */}
                <div style={{ display: 'flex', gap: '0.75rem', margin: '0.5rem 0' }}>
                  <button
                    onClick={() => setResearchMode('individual')}
                    style={{
                      background: researchMode === 'individual' ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                      border: researchMode === 'individual' ? 'none' : '1.5px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      padding: '0.4rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    👤 Individual Participant View
                  </button>
                  <button
                    onClick={() => setResearchMode('aggregate')}
                    style={{
                      background: researchMode === 'aggregate' ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'rgba(255, 255, 255, 0.05)',
                      border: researchMode === 'aggregate' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      padding: '0.4rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    📊 Aggregate Cohort Study View
                  </button>
                </div>

                {researchMode === 'individual' ? (
                  evaluationReport ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                        
                        {/* Pre vs Post Averages */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Standardized Test Mean</span>
                          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem' }}>
                            {evaluationReport.mean_pretest} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>→</span> <span style={{ color: '#4ade80' }}>{evaluationReport.mean_posttest}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.25rem', fontWeight: 'bold' }}>
                            +{evaluationReport.overall_improvement_rate_pct}% Improvement Rate
                          </div>
                        </div>

                        {/* T-Statistic */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Paired t-Statistic</span>
                          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem' }}>
                            t = {evaluationReport.t_statistic}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Sample Size (n = {evaluationReport.sample_size} Domains)
                          </div>
                        </div>

                        {/* Cohen's d / Effect Size */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Cohen's d Effect Size</span>
                          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem', textTransform: 'capitalize' }}>
                            {evaluationReport.cohens_d} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>({evaluationReport.effect_size_magnitude})</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: evaluationReport.statistically_significant ? '#4ade80' : '#f87171', marginTop: '0.25rem', fontWeight: 'bold' }}>
                            {evaluationReport.statistically_significant ? "Statistically Significant" : "Not Statistically Significant"}
                          </div>
                        </div>

                      </div>

                      {/* Hypothesis & Expose Diffs */}
                      <div style={{ padding: '1rem', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 'bold' }}>📊 Thesis Hypothesis Testing Outcome</div>
                        <div style={{ fontSize: '0.95rem', color: '#ffffff', lineHeight: '1.5' }}>
                          {evaluationReport.hypothesis_result}
                        </div>
                        
                        {evaluationReport.domain_improvements && (
                          <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>Domain Score Margin Changes:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '0.5rem' }}>
                              {Object.entries(evaluationReport.domain_improvements).map(([dom, margin]) => (
                                <div key={dom} style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                                  <span style={{ textTransform: 'capitalize', color: '#94a3b8' }}>{dom.replace(/_/g, ' ')}:</span>{' '}
                                  <strong style={{ color: margin >= 0 ? '#4ade80' : '#ef4444' }}>
                                    {margin >= 0 ? `+${margin}` : margin}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                      ⌛ Once you complete both Pre-Test and Post-Test questionnaires, this dashboard will compute dynamic empirical analytics (paired t-tests and Cohen's d effect sizes) to validate cognitive skill improvements.
                    </div>
                  )
                ) : (
                  // AGGREGATE COHORT STUDY VIEW
                  cohortLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      ⚡ Accessing Research Database & Running Paired t-tests...
                    </div>
                  ) : cohortAnalytics ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                        
                        {/* Sample Size */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Study Cohort Size (n)</span>
                          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem' }}>
                            {cohortAnalytics.sample_size} subjects
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.25rem', fontWeight: 'bold' }}>
                            100% Gating & Telemetry Logged
                          </div>
                        </div>

                        {/* Overall Improvement Margin */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Cohort Improvement Margin</span>
                          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#4ade80', marginTop: '0.5rem' }}>
                            +{cohortAnalytics.overall_improvement_rate_pct}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                            {cohortAnalytics.overall_pre_mean} Pre → {cohortAnalytics.overall_post_mean} Post
                          </div>
                        </div>

                        {/* p-value metric card */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Cohort Significance Level</span>
                          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: cohortAnalytics.statistically_significant ? '#4ade80' : '#f87171', marginTop: '0.5rem' }}>
                            p = {cohortAnalytics.cohort_p_value}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                            t-Statistic: t = {cohortAnalytics.cohort_t_statistic}
                          </div>
                        </div>

                        {/* Global Cohen's d Effect Size */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Global Cohen's d</span>
                          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem', textTransform: 'capitalize' }}>
                            d = {cohortAnalytics.cohort_cohens_d}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.25rem', fontWeight: 'bold' }}>
                            ({cohortAnalytics.effect_size_magnitude} Magnitude)
                          </div>
                        </div>

                      </div>

                      {/* Hypothesis Verdict */}
                      <div style={{ padding: '1rem', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 'bold' }}>📊 Thesis Hypothesis Testing Outcome (Aggregate)</div>
                        <div style={{ fontSize: '0.95rem', color: '#ffffff', lineHeight: '1.5' }}>
                          {cohortAnalytics.hypothesis_verdict}
                        </div>
                        
                        {cohortAnalytics.domains && (
                          <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>Group-Wide Domain Comparisons (Mean ± SD):</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                              {Object.entries(cohortAnalytics.domains).map(([dom, dStats]) => (
                                <div key={dom} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                                  <strong style={{ textTransform: 'capitalize', color: '#38bdf8', display: 'block', marginBottom: '0.25rem' }}>
                                    {dom.replace(/_/g, ' ')}
                                  </strong>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.15rem 0' }}>
                                    <span>Pre-Test:</span>
                                    <strong>{dStats.pre_mean} ± {dStats.pre_std}</strong>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.15rem 0' }}>
                                    <span>Post-Test:</span>
                                    <strong>{dStats.post_mean} ± {dStats.post_std}</strong>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.15rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.15rem', color: '#4ade80', fontWeight: 'bold' }}>
                                    <span>Improvement:</span>
                                    <span>+{dStats.improvement_pct}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                      ⌛ No research cohort statistics returned. Check backend.
                    </div>
                  )
                )}
              </div>
            )}

            {/* Game Mode Selector has been moved to the Launch Modal to eliminate clutter */}

            <h2 className="section-title">Quasi-Experimental Core Game Grid</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '-1rem 0 2rem 0' }}>
              Under our cognitive training design, the programmatically prescribed module targeting your weakest cognitive domain is highlighted. However, all modules are fully unlocked for self-directed practice.
            </p>

            {DOMAINS_LIST.map(dom => {
              const domInfo = DOMAIN_INFO[dom.id] || { title: dom.title, icon: dom.icon, color: '#ffffff' };
              return (
                <div key={dom.id} className={`category-container theme-${dom.themeClass}`} style={{ marginBottom: '3.5rem' }}>
                  <div className="category-header-wrapper" style={{ borderLeft: `4px solid ${domInfo.color}` }}>
                    <div className="category-title" style={{ color: domInfo.color, fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{domInfo.icon}</span>
                      <span>{domInfo.title}</span>
                    </div>
                    <div className="category-description" style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {dom.description}
                    </div>
                  </div>

                  <div className="game-grid">
                    {dom.games.map(game => {
                      const isPrescribed = prescribedGame === game.id;
                      const theme = DOMAIN_THEMES[dom.themeClass] || DOMAIN_THEMES.reflex;
                      
                      return (
                        <div 
                          key={game.id} 
                          className={`game-card theme-${dom.themeClass} active`}
                          onMouseEnter={() => !game.inProgress && audioEngine.playHover()}
                          onClick={() => { 
                            if (game.inProgress) return;
                            audioEngine.playClick();
                            setPendingGameToLaunch({ id: game.id, title: game.title, themeClass: dom.themeClass, icon: game.icon }); 
                          }}
                          style={{
                            border: isPrescribed ? `2.5px solid ${theme.color}` : `1px solid ${theme.color}44`,
                            boxShadow: isPrescribed ? `0 0 25px ${theme.glow}` : '0 4px 15px rgba(0, 0, 0, 0.25)',
                            background: `linear-gradient(135deg, rgba(15, 23, 42, 0.6), ${theme.bg})`,
                            opacity: game.inProgress ? 0.6 : 1.0,
                            cursor: game.inProgress ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '0.72rem', color: theme.color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{domInfo.title}</span>
                            {isPrescribed && (
                              <span style={{ background: theme.color, color: '#ffffff', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                Prescribed Track
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
                            <span style={{ fontSize: '2rem' }}>{game.icon}</span>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{game.title}</h3>
                          </div>
 
                          <div className="card-section-label">Objective & Goal</div>
                          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4' }}>{game.objective}</p>
 
                          <div className="card-section-label">How it helps us</div>
                          <div className="card-benefit-box" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', borderLeft: `3px solid ${theme.color}` }}>{game.benefit}</div>
 
                          <button 
                            className="play-btn" 
                            onMouseEnter={() => !game.inProgress && audioEngine.playHover()}
                            onClick={(e) => { 
                              if (game.inProgress) return;
                              e.stopPropagation(); 
                              audioEngine.playClick();
                              setPendingGameToLaunch({ id: game.id, title: game.title, themeClass: dom.themeClass, icon: game.icon }); 
                            }}
                            disabled={game.inProgress}
                            style={{
                              background: game.inProgress ? 'rgba(255, 255, 255, 0.05)' : isPrescribed ? theme.btnGradient : 'rgba(255, 255, 255, 0.02)',
                              border: game.inProgress ? '1.5px dashed rgba(255, 255, 255, 0.2)' : isPrescribed ? 'none' : `1.5px solid ${theme.color}`,
                              color: game.inProgress ? '#94a3b8' : isPrescribed ? '#ffffff' : theme.color,
                              marginTop: 'auto',
                              cursor: game.inProgress ? 'not-allowed' : 'pointer',
                              width: '100%',
                              padding: '0.65rem',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              boxShadow: game.inProgress ? 'none' : isPrescribed ? `0 4px 12px ${theme.btnGlow}` : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            {game.inProgress ? 'In Progress 🚧' : isPrescribed ? 'Launch Active Game' : 'Launch Game'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Dynamic Game Launcher & Mode Config Selector Modal Overlay */}
            {pendingGameToLaunch && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(9, 9, 11, 0.85)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              animation: 'fadeIn 0.25s ease-out'
            }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: `2px solid ${DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.color || '#ffffff'}`,
                borderRadius: '16px',
                padding: '2.5rem',
                width: '90%',
                maxWidth: '700px',
                boxShadow: `0 0 45px ${DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.glow || 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2.25rem' }}>{pendingGameToLaunch.icon}</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff' }}>
                        Launch {pendingGameToLaunch.title}
                      </h2>
                      <span style={{ fontSize: '0.75rem', color: DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Setup Session Config
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPendingGameToLaunch(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.color, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Select Gameplay Mode
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { id: 'timed', label: '⏱️ Standard Timed', desc: 'Standard 2-minute timed session.' },
                      { id: 'zen', label: '🌸 Zen Mode', desc: 'Unlimited time, counts up, no pressure.' },
                      { id: 'survival', label: '❤️ Survival Mode', desc: 'Start with 3 lives. Errors deduct lives.' },
                      { id: 'target', label: '🎯 Objective Target', desc: 'Ends after exactly 10 trials.' },
                      { id: 'time_attack', label: '⚡ Time Attack', desc: 'Race to get 10 correct hits.' },
                      { id: 'endurance', label: '🔋 Fatigue Endurance', desc: 'Start with 20s. Hit adds +2s, miss subtracts -5s.' }
                    ].map(mode => {
                      const isSelected = selectedGameMode === mode.id;
                      const isHovered = hoveredMode === mode.id;
                      const themeColor = DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.color || '#ffffff';
                      
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSelectedGameMode(mode.id)}
                          onMouseEnter={() => setHoveredMode(mode.id)}
                          onMouseLeave={() => setHoveredMode(null)}
                          style={{
                            background: isSelected ? `rgba(255, 255, 255, 0.05)` : 'rgba(255, 255, 255, 0.02)',
                            border: isSelected ? `2px solid ${themeColor}` : '1.5px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: isSelected ? themeColor : '#e2e8f0',
                            padding: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            transform: isHovered ? 'translateY(-2px)' : 'none',
                            boxShadow: isSelected ? `0 0 10px ${DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.glow}` : 'none'
                          }}
                        >
                          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{mode.label}</span>
                          <span style={{ fontSize: '0.75rem', color: isSelected ? '#ffffff' : '#94a3b8' }}>{mode.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hover Rules & Explanation Panel */}
                <div style={{
                  background: 'rgba(9, 9, 11, 0.5)',
                  border: `1.5px solid ${(DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.color || '#ffffff')}33`,
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all 0.3s'
                }}>
                  {(() => {
                    const activeModeId = hoveredMode || selectedGameMode || 'timed';
                    const modeDetails = {
                      timed: {
                        title: '⏱️ Standard Timed Rules',
                        explanation: 'Traditional cognitive evaluation mode.',
                        rules: 'You have exactly 2 minutes (120 seconds) to complete as many correct trials as possible. Speed and accuracy are balanced in real-time by the DDA engine to calculate difficulty adjustments.'
                      },
                      zen: {
                        title: '🌸 Zen Mode Rules',
                        explanation: 'Low-stress cognitive training & warmup practice.',
                        rules: 'Play at your own pace with no ticking timers or life counters. Perfect for warm-ups, learning the game mechanics, or relaxing without speed-accuracy time pressure.'
                      },
                      survival: {
                        title: '❤️ Survival Mode Rules',
                        explanation: 'High-stakes precision focus training.',
                        rules: 'You start the session with exactly 3 lives. Every incorrect input or element timeout subtracts 1 life. The session continues indefinitely until all lives are depleted. Focus on high accuracy!'
                      },
                      target: {
                        title: '🎯 Objective Target Rules',
                        explanation: 'Fixed-length cognitive efficiency benchmark.',
                        rules: 'The game concludes after exactly 10 trials. Your goal is to maximize accuracy rate and minimize average reaction time. Highly effective for clean pre/post benchmark scoring.'
                      },
                      time_attack: {
                        title: '⚡ Time Attack Rules',
                        explanation: 'Rapid motor execution challenge.',
                        rules: 'Race against the clock to complete exactly 10 correct matches as fast as possible. Any mistakes will delay your timer progress. Speed is key!'
                      },
                      endurance: {
                        title: '🔋 Fatigue Endurance Rules',
                        explanation: 'Adaptive threshold capacity training.',
                        rules: 'Start the session with a 20-second timer. Every correct trial adds +2 seconds of bonus time, while each incorrect trial subtracts -5 seconds. Survive and score as long as you can!'
                      }
                    }[activeModeId];

                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <strong style={{ fontSize: '0.95rem', color: DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.color || '#ffffff' }}>
                            {modeDetails.title} {hoveredMode && <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#94a3b8', marginLeft: '0.5rem' }}>Previewing</span>}
                          </strong>
                          <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#94a3b8' }}>
                            {modeDetails.explanation}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                          {modeDetails.rules}
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => setPendingGameToLaunch(null)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#cbd5e1',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'background 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveGame(pendingGameToLaunch.id);
                      setPendingGameToLaunch(null);
                    }}
                    style={{
                      flex: 2,
                      padding: '0.75rem',
                      background: DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.btnGradient || 'linear-gradient(to right, #38bdf8, #a855f7)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      boxShadow: `0 4px 15px ${DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.btnGlow || 'rgba(255,255,255,0.2)'}`,
                      transition: 'filter 0.2s'
                    }}
                  >
                    Start Training Session 🚀
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>

      {/* Footer */}
      <footer className="portal-footer">
        <p>&copy; {new Date().getFullYear()} CogniCore Cognitive Training Platform. All rights reserved.</p>
      </footer>
      
      {showShop && <Shop onClose={() => setShowShop(false)} />}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {dailyRewardData && dailyRewardData.granted && <DailyRewardModal rewardData={dailyRewardData} onClose={() => { setDailyRewardData({...dailyRewardData, granted: false}); fetchInventory(); }} />}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
      {gameRewardsModal && <RewardModal rewards={gameRewardsModal} onClose={() => { setGameRewardsModal(null); fetchInventory(); }} />}
      {activeAchievements.length > 0 && <AchievementToast achievementIds={activeAchievements} onDone={() => setActiveAchievements([])} />}
    </div>
  );
}

import { API_BASE } from './utils/apiClient.js';
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy, useMemo } from 'react';
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
import useApiInterceptor from './hooks/useApiInterceptor';
import { supabase } from './utils/supabaseClient';
import Shop from './components/Shop';
import RewardModal from './components/RewardModal';
import LeaderboardModal from './components/LeaderboardModal';
import ProfileModal from './components/ProfileModal';
import DailyRewardModal from './components/DailyRewardModal';
import AchievementToast from './components/AchievementToast';
import DailyQuests from './components/DailyQuests';
import PretestResults from './components/PretestResults';
import PostTestResults from './components/PostTestResults';
import SeizureDisclaimerModal from './components/SeizureDisclaimerModal';
import AccessibilityMenu from './components/AccessibilityMenu';
import LoginFlow from './components/LoginFlow';
import AssessmentFlow from './components/AssessmentFlow';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import KnowledgeBase from './components/KnowledgeBase';
import AppNavigation from './components/AppNavigation';
import HoverTooltip from './components/HoverTooltip';
import GameRenderer from './components/GameRenderer';

import { audioDda } from './utils/audioSynth';
import audioEngine from './utils/audioEngine';


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
ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(var(--rgb-primary), 0.3)';
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

const SvgLauncherIcon = ({ name, style }) => {
  const defaultStyle = { filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))', flexShrink: 0, ...style };
  
  if (name === 'timed') {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={defaultStyle}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  } else if (name === 'zen') {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={defaultStyle}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>;
  } else if (name === 'survival') {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={defaultStyle}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
  } else if (name === 'target') {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={defaultStyle}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
  } else if (name === 'time_attack') {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={defaultStyle}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
  } else if (name === 'endurance') {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={defaultStyle}><rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="13" x2="23" y2="11"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/></svg>;
  } else if (name === 'start') {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={defaultStyle}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
  }
  return null;
};

const OfflineCacheWarningBanner = ({ isVisible, onClose }) => {
  if (!isVisible) return null;
  return (
    <div style={{
      position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 99999, background: 'rgba(239, 68, 68, 0.95)', border: '2px solid #ef4444',
      borderRadius: '16px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 0 30px rgba(239, 68, 68, 0.5), 0 20px 40px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(12px)', animation: 'achieveSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
    }}>
      <div style={{ fontSize: '1.8rem', animation: 'achievePulse 2s infinite' }}>⚠️</div>
      <div>
        <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 'bold' }}>Offline Storage Full!</div>
        <div style={{ color: '#fee2e2', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          Please reconnect to Wi-Fi. Further gameplay telemetry cannot be saved.
        </div>
      </div>
      <button onClick={onClose} style={{
        background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', 
        borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', marginLeft: '0.5rem'
      }}>✕</button>
    </div>
  );
};

import { DOMAIN_INFO, DOMAIN_THEMES, DOMAINS_LIST, COGNITIVE_QUESTIONS, DOMAIN_LABELS } from './utils/constants.jsx';

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
  const [offlineCacheFullWarning, setOfflineCacheFullWarning] = useState(false);

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

    const activeBanner = inventory.find(i => i.item_type === 'banner' && i.is_equipped);
    if (activeBanner) {
      document.body.setAttribute('data-banner', activeBanner.item_id);
    } else {
      document.body.removeAttribute('data-banner');
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

    const handleOfflineCacheFull = () => setOfflineCacheFullWarning(true);
    window.addEventListener('offline-cache-full', handleOfflineCacheFull);

    return () => {
      clearInterval(interval);
      window.removeEventListener('offline-cache-full', handleOfflineCacheFull);
    };
  }, []);

  useEffect(() => {
    window.currentGameMode = selectedGameMode;
  }, [selectedGameMode]);

  const [showDashboard, setShowDashboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const handleToggleMute = useCallback(() => {
    setGlobalMuted(prev => {
      const nextMute = !prev;
      audioDda.setMuted(nextMute);
      return nextMute;
    });
  }, []);

  const handleCloseLeaderboard = useCallback(() => {
    setShowLeaderboard(false);
  }, []);
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
  const [aiFeedback, setAiFeedback] = useState(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '',
    q5: '', q6: '', q7: '', q8: '',
    q9: '', q10: '', q11: '', q12: ''
  });
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState(null);

  const [researchMode, setResearchMode] = useState('individual'); // 'individual' | 'aggregate'
  const [cohortAnalytics, setCohortAnalytics] = useState(null);
  const [cohortLoading, setCohortLoading] = useState(false);
  const [retrainLoading, setRetrainLoading] = useState(false);

  const handleRetrain = async () => {
    setRetrainLoading(true);
    try {
      const token = useCogniStore.getState().token || '';
      const res = await fetch(`${API_BASE}/api/admin/retrain`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Model retrained successfully! Cross-validation Accuracy: ${(data.test_accuracy * 100).toFixed(2)}%`);
      } else {
        alert(`Error during retrain: ${data.message}`);
      }
    } catch (err) {
      alert(`Failed to retrain models: ${err.message}`);
    } finally {
      setRetrainLoading(false);
    }
  };

  const fetchCohortAnalytics = async () => {
    setCohortLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cohort-analytics`, {
        method: 'GET'
      });
      if (!res.ok) throw new Error("Failed to fetch cohort data.");
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

  // Session Persistence on Refresh
  useEffect(() => {
    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data && data.session && data.session.user) {
        const user = data.session.user;
        const username = user.user_metadata?.username || user.email.split('@')[0];
        const token = data.session.access_token;
        
        try {
            const syncRes = await fetch(API_BASE + '/api/sync-user', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': Bearer 
                }
            });
            if (syncRes.ok) {
                const syncData = await syncRes.json();
                if (syncData.status === 'success') {
                    useCogniStore.getState().login(syncData.user, token);
                    useCogniStore.getState().fetchInventory();
                }
            }
            
            const res = await fetch(`${API_BASE}/api/assessment-status/`);
            if (res.ok) {
                const asmtData = await res.json();
                if (asmtData.status === 'success') {
                    setCurrentUser(username);
                    setActiveDashboardUser(username);
                    
                    if (asmtData.exists && asmtData.pre_test) {
                        setPreTestScores(asmtData.pre_test);
                        setWeakestDomain(asmtData.weakest_domain);
                        setPrescribedGame(asmtData.prescribed_game);
                        setPersonalizedReport(asmtData.personalized_report);
                        
                        if (asmtData.post_test) {
                            setPostTestScores(asmtData.post_test);
                            setAiFeedback(asmtData.ai_feedback);
                            setAssessmentStage('completed');
                            fetchEvaluationReport(username);
                        } else {
                            setAssessmentStage('none');
                            const historyRes = await fetch(`${API_BASE}/api/user-session-history/`);
                            if (historyRes.ok) {
                                const histData = await historyRes.json();
                                const played = (histData.sessions || []).some(s => s.game_type === asmtData.prescribed_game);
                                setHasPlayedPrescribed(played);
                            }
                        }
                    } else {
                        setAssessmentStage('pre-test');
                    }
                }
            }
        } catch (e) {
            console.error("Session restore failed", e);
        }
      }
    };
    restoreSession();
  }, []);

  const handleCheckUserStatus = async (username, course = null, age = null, gender = null, pwdStatus = null, password = null, isSignUp = false) => {
    if (!username || !username.trim()) {
      setAssessmentError("Please enter a valid username.");
      return;
    }
    setAssessmentLoading(true);
    setAssessmentError(null);
    setAuthSuccessMessage(null);
    try {
      const trimmedName = username.trim();
      const email = `${trimmedName}@cognicore.com`.toLowerCase();
      
      let authData;
      if (password) {
          if (isSignUp) {
              const { data, error } = await supabase.auth.signUp({ 
                  email, 
                  password,
                  options: { data: { username: trimmedName, course, age, gender, pwd_status: pwdStatus } }
              });
              if (error) throw new Error(error.message);
              if (!data.session) {
                  // Sometimes Supabase requires login after signup if auto-confirm is off, but for our setup it should return session.
                  // Try logging in just in case:
                  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
                  if (signInErr) throw new Error("Account created, but could not sign in automatically.");
                  authData = signInData;
              } else {
                  authData = data;
              }
          } else {
              const { data, error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) throw new Error("Invalid username or password.");
              authData = data;
          }
      } else {
          const anonPassword = 'cogni-core-default-pw-123';
          const { data, error } = await supabase.auth.signUp({ 
              email, 
              password: anonPassword,
              options: { data: { username: trimmedName, course, age, gender, pwd_status: pwdStatus } }
          });
          if (error) throw new Error(error.message);
          authData = data;
      }
      
      if (password && isSignUp) {
        setAuthSuccessMessage("Account created successfully! Preparing your profile...");
      } else if (password && !isSignUp) {
        setAuthSuccessMessage("Login successful! Loading dashboard...");
      } else {
        setAuthSuccessMessage("Anonymous session prepared! Entering portal...");
      }
      // Brief delay to let the user see the success message
      await new Promise(resolve => setTimeout(resolve, 1200));

      const token = authData.session.access_token;
      
      // Sync user with backend to trigger daily rewards and streak
      const syncRes = await fetch(API_BASE + '/api/sync-user', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          }
      });
      
      if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.status === 'success') {
              useCogniStore.getState().login(syncData.user, token);
              if (syncData.daily_reward && syncData.daily_reward.granted) {
                  setDailyRewardData(syncData.daily_reward);
                  audioEngine.playSuccess();
              } else {
                  useCogniStore.getState().fetchInventory();
              }
          }
      } else {
          throw new Error("Failed to securely synchronize user with backend. Please try again.");
      }

      const res = await fetch(`${API_BASE}/api/assessment-status/${trimmedName}`);

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
            setAiFeedback(data.ai_feedback);
            setAssessmentStage('completed');
            fetchEvaluationReport(trimmedName);
          } else {
            setAssessmentStage('none');
            // Fetch session history to check if they already played the prescribed game
            const historyRes = await fetch(`${API_BASE}/api/user-session-history/${trimmedName}`);
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

  const handleSubmitAssessment = async (resultsPayload) => {
    setAssessmentLoading(true);
    setAssessmentError(null);
    setAuthSuccessMessage(null);
    try {
      const type = assessmentStage === 'pre-test' ? 'pre-test' : 'post-test';
      
      // Calculate scores based on the new payload
      let spatialScore = 0, logicalScore = 0, attentionScore = 0, executiveScore = 0;
      let spatialCount = 0, logicalCount = 0, attentionCount = 0, executiveCount = 0;

      const flatAnswers = {};
      
      for (const [qId, data] of Object.entries(resultsPayload)) {
        const qDomain = COGNITIVE_QUESTIONS.find(q => q.id === qId)?.domain;
        if (qDomain === 'spatial_visual_memory') { spatialScore += data.isCorrect ? 1 : 0; spatialCount++; }
        if (qDomain === 'logical_mathematical') { logicalScore += data.isCorrect ? 1 : 0; logicalCount++; }
        if (qDomain === 'reflexes_and_focus') { attentionScore += data.isCorrect ? 1 : 0; attentionCount++; }
        if (qDomain === 'executive_strategy') { executiveScore += data.isCorrect ? 1 : 0; executiveCount++; }
        
        flatAnswers[qId] = data.isCorrect ? 1 : 0;
      }
      
      const spatial_visual_score = spatialCount ? (spatialScore / spatialCount) * 100.0 : 0;
      const logical_math_score = logicalCount ? (logicalScore / logicalCount) * 100.0 : 0;
      const attention_score = attentionCount ? (attentionScore / attentionCount) * 100.0 : 0;
      const executive_score = executiveCount ? (executiveScore / executiveCount) * 100.0 : 0;

      const res = await fetch(`${API_BASE}/api/submit-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          assessment_type: type,
          answers: {
            ...flatAnswers,
            spatial_visual_score,
            logical_math_score,
            attention_score,
            executive_score
          },
          metadata: resultsPayload
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
          setAiFeedback(data.ai_feedback);
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
      const res = await fetch(`${API_BASE}/api/evaluate`, {
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

  useApiInterceptor({
    setActiveSessionId,
    setLiveDdaParams,
    setLiveCognitiveProfile,
    setLiveMetrics,
    setDdaAdvisorLogs,
    setDdaAdvisorMessage,
    liveDdaParams,
    sessionRewardsRef,
    smoothingAlphaRef
  });

  const fetchDashboardData = async (username) => {
    setChartsLoading(true);
    setChartsError(null);
    try {
      // 1. Fetch user session history, cohort comparison, and archetype progression concurrently
      const [historyRes, compRes, progressionRes] = await Promise.all([
        fetch(`${API_BASE}/api/user-session-history/${username}`),
        fetch(`${API_BASE}/api/cohort-comparison/${username}`),
        fetch(`${API_BASE}/api/archetype-progression/${username}`)
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
        const metricsRes = await fetch(`${API_BASE}/api/session-metrics/${latestSid}`);
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
      
      if (lastGameStats.gameType === 'MemoryMatch' || lastGameStats.gameType === 'MatrixRecall' || lastGameStats.gameType === 'SynapseSpin' || lastGameStats.gameType === 'NexusMapper') {
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
      const response = await fetch(API_BASE + '/api/evaluate', {
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
      const response = await fetch(API_BASE + '/api/cohort-db-scores');
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
      const response = await fetch(API_BASE + '/api/iso-evaluations/summary');
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
      const corrRes = await fetch(`${API_BASE}/api/research/correlations?var1=${var1}&var2=${var2}&cohort=${cohort}&username=${activeDashboardUser}`);
      if (!corrRes.ok) throw new Error('Failed to compute correlation statistics.');
      const corrData = await corrRes.json();
      if (corrData.status === 'success') {
        setCorrelationResult(corrData);
      } else {
        throw new Error(corrData.message || 'Correlation computation failed.');
      }

      const curveRes = await fetch(`${API_BASE}/api/research/learning-curves/${activeDashboardUser}`);
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
          backgroundColor: 'var(--color-primary)',
          borderColor: 'rgba(var(--rgb-primary), 0.4)',
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
          type: 'scatter'
        },
        {
          label: 'Linear Regression Fit',
          data: linePoints,
          borderColor: 'var(--color-secondary)',
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
          borderColor: 'var(--color-primary)',
          backgroundColor: 'rgba(var(--rgb-primary), 0.1)',
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
      const res = await fetch(API_BASE + '/api/model/status');
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
      const res = await fetch(API_BASE + '/api/model/clusters');
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
      const res = await fetch(API_BASE + '/api/model/retrain', {
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
            const statusRes = await fetch(API_BASE + '/api/model/status');
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
      const response = await fetch(`${API_BASE}/api/training-goals/${username}`);
      if (!response.ok) throw new Error('Failed to load training goals.');
      const data = await response.json();
      if (data.status === 'success') {
        setGoals(data.goals || []);
        
        const completed = data.goals.filter(g => g.just_completed);
        if (completed.length > 0) {
          completed.forEach(g => {
            const cleanDomain = (DOMAIN_LABELS[g.domain] || g.domain.replace(/_/g, ' ')).toUpperCase();
            triggerMilestoneToast(`Goal Achieved in ${cleanDomain}: Reached ${g.metric_type} target of ${g.target_value}!`);
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
      const response = await fetch(API_BASE + '/api/training-goals', {
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
      const response = await fetch(`${API_BASE}/api/training-goals/${goalId}`, {
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
      const response = await fetch(API_BASE + '/api/iso-evaluations', {
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
        backgroundColor: 'rgba(var(--rgb-secondary), 0.2)',
        borderColor: 'var(--color-secondary)',
        borderWidth: 2,
        pointBackgroundColor: 'var(--color-primary)',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: 'var(--color-primary)'
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
    if (idx === 0) return 'var(--color-secondary)';
    return val !== diffLevels[idx - 1] ? '#22c55e' : 'var(--color-secondary)';
  });

  const lineChartData = useMemo(() => ({
    labels: latestSessionMetrics.map((_, index) => `Round ${index + 1}`),
    datasets: [
      {
        label: 'Reaction Time (ms)',
        data: latestSessionMetrics.map(m => m.reaction_time),
        borderColor: 'var(--color-primary)',
        backgroundColor: 'rgba(var(--rgb-primary), 0.1)',
        tension: 0.4,
        yAxisID: 'y',
        fill: true,
      },
      {
        label: 'Accuracy (%)',
        data: latestSessionMetrics.map(m => m.accuracy_rate),
        borderColor: 'var(--color-secondary)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  }), [latestSessionMetrics]);

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
        ticks: { color: 'var(--color-primary)', font: { size: 9 } },
        title: {
          display: true,
          text: 'RT (ms)',
          color: 'var(--color-primary)',
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
        backgroundColor: 'rgba(var(--rgb-primary), 0.75)',
        borderColor: 'var(--color-primary)',
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
        ticks: { color: 'var(--color-primary)', font: { size: 9 } },
        title: {
          display: true,
          text: 'RT (ms)',
          color: 'var(--color-primary)',
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
    MemoryMatch: 'Memory', MatrixRecall: 'Memory',
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
        borderColor: 'var(--color-primary)',
        backgroundColor: 'rgba(var(--rgb-primary),0.07)',
        borderWidth: 2,
        pointBackgroundColor: 'var(--color-primary)',
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
        borderColor: 'rgba(var(--rgb-primary),0.4)', borderWidth: 1,
        titleColor: 'var(--color-primary)', bodyColor: '#e2e8f0'
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'var(--color-primary)', font: { size: 9 } },
        title: { display: true, text: 'RT (ms)', color: 'var(--color-primary)', font: { size: 10 } }
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
      backgroundColor: ['rgba(var(--rgb-secondary),0.75)', 'rgba(var(--rgb-primary),0.75)', 'rgba(245,158,11,0.75)', 'rgba(16,185,129,0.75)'],
      borderColor: ['var(--color-secondary)', 'var(--color-primary)', '#f59e0b', '#10b981'],
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
  const radarDataEnhanced = useMemo(() => {
    const baselineValues = ARCHETYPE_BASELINES[cognitiveProfile?.archetype] || ARCHETYPE_BASELINES['Initializing...'];
    return {
      labels: ['Spatial-Visual Memory','Logical-Mathematical','Reflexes & Focus','Executive Strategy'],
      datasets: [
        {
          label: 'Your Profile',
          data: [skills.spatial_visual_memory, skills.logical_mathematical, skills.reflexes_and_focus, skills.executive_strategy],
          backgroundColor: 'rgba(var(--rgb-secondary),0.2)',
          borderColor: 'var(--color-secondary)', borderWidth: 2.5,
          pointBackgroundColor: 'var(--color-primary)', pointBorderColor: '#ffffff',
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
  }, [cognitiveProfile, skills]);

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
          border: '2px solid var(--color-secondary)',
          boxShadow: '0 0 25px rgba(var(--rgb-secondary), 0.6), 0 10px 40px rgba(0,0,0,0.6)',
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
          border: '1.5px solid var(--color-secondary)',
          boxShadow: '0 0 25px rgba(var(--rgb-secondary), 0.4), 0 10px 40px rgba(0,0,0,0.6)',
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
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
      <AppNavigation 
        currentUser={currentUser}
        portalView={portalView}
        setPortalView={setPortalView}
        setShowProfileModal={setShowProfileModal}
        activeGame={activeGame}
        setActiveGame={setActiveGame}
        showDashboard={showDashboard}
        setShowDashboard={setShowDashboard}
        coins={coins}
        totalXp={totalXp}
        currentLevel={currentLevel}
        dailyRewardData={dailyRewardData}
        xpPercent={xpPercent}
        inventory={inventory}
        globalMuted={globalMuted}
        setGlobalMuted={setGlobalMuted}
        audioDda={audioDda}
        setShowShop={setShowShop}
        showSoundTuner={showSoundTuner}
        setShowSoundTuner={setShowSoundTuner}
      />

      {/* Main Container */}
      <main className="portal-main" style={{ maxWidth: activeGame ? 'none' : '1400px' }} key={activeGame ? 'game' : showDashboard ? 'dash' : portalView === 'researcher' ? 'research' : 'select'}>
        {showSoundTuner && (
          <div className="game-card" style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(var(--rgb-secondary), 0.3)',
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 4px rgba(var(--rgb-secondary),0.7))' }}><line x1="4" y1="6" x2="20" y2="6" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/><circle cx="8" cy="6" r="2.5" fill="#c084fc"/><line x1="4" y1="12" x2="20" y2="12" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/><circle cx="16" cy="12" r="2.5" fill="#c084fc"/><line x1="4" y1="18" x2="20" y2="18" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="18" r="2.5" fill="#c084fc"/></svg>
                <strong style={{ fontSize: '1rem', color: '#c084fc', letterSpacing: '0.05em' }}>BACKGROUND AUDIO SETTINGS</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '12px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{
                    width: '3px',
                    height: '100%',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: '1px',
                    animation: `pulseGlow 1.2s infinite ease-in-out alternate`,
                    animationDelay: `${i * 0.15}s`
                  }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
              <div style={{ flex: '1', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Sound Type</span>
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
                        background: oscillatorType === type ? 'rgba(var(--rgb-primary), 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: oscillatorType === type ? '1.5px solid var(--color-primary)' : '1.5px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        color: oscillatorType === type ? 'var(--color-primary)' : '#e2e8f0',
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
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Music Speed</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>{bpmMultiplier.toFixed(2)}x</span>
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
                      accentColor: 'var(--color-primary)',
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
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Difficulty Adjustment Speed</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-secondary)', fontWeight: 'bold' }}>
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
                      accentColor: 'var(--color-secondary)',
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
          <LoginFlow 
            usernameInput={usernameInput}
            setUsernameInput={setUsernameInput}
            assessmentError={assessmentError}
              authSuccessMessage={authSuccessMessage}
            assessmentLoading={assessmentLoading}
            handleCheckUserStatus={handleCheckUserStatus}
          />
        ) : assessmentStage === 'pre-test' || assessmentStage === 'post-test' ? (
          <AssessmentFlow 
            assessmentStage={assessmentStage}
            assessmentAnswers={assessmentAnswers}
            setAssessmentAnswers={setAssessmentAnswers}
            handleSubmitAssessment={handleSubmitAssessment}
            assessmentError={assessmentError}
              authSuccessMessage={authSuccessMessage}
            currentUser={currentUser}
            assessmentLoading={assessmentLoading}
          />
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
              maxWidth: 'none',
                padding: '0 2rem',
              margin: '1rem auto 0 auto',
              alignItems: 'flex-start',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: '1 1 0%', minWidth: '280px', width: '100%' }}>
                <ErrorBoundary onReset={handleBackToLobby}>
                  <Suspense fallback={
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      maxWidth: '1200px',
                      minHeight: '400px',
                      background: 'rgba(15, 23, 42, 0.4)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#94a3b8'
                    }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem', animation: 'pulse 1.5s infinite ease-in-out' }}>🧠</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>LOADING NEURAL WORKSPACE...</div>
                    </div>
                  }>
                    <GameRenderer 
                      activeGame={activeGame} 
                      activeDashboardUser={activeDashboardUser} 
                      handleGameFinished={handleGameFinished} 
                    />
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
                  onToggleMute={handleToggleMute}
                />
              )}
            </div>
          </div>
        ) : portalView === 'researcher' ? (
          <AdminPanel 
            portalView={portalView}
            activeResearcherTab={activeResearcherTab}
            setActiveResearcherTab={setActiveResearcherTab}
            modelStatus={modelStatus}
            evalLoading={evalLoading}
            evalResult={evalResult}
            evalError={evalError}
            pretestInput={pretestInput}
            setPretestInput={setPretestInput}
            posttestInput={posttestInput}
            setPosttestInput={setPosttestInput}
            runCohortEvaluation={runCohortEvaluation}
            retrainLoading={retrainLoading}
            retrainMetrics={retrainMetrics}
            triggerModelRetrain={triggerModelRetrain}
            sandboxLoading={sandboxLoading}
            sandboxError={sandboxError}
            sandboxCohort={sandboxCohort}
            setSandboxCohort={setSandboxCohort}
            loadDatabaseCohort={loadDatabaseCohort}
            loadSimulatedCohort={loadSimulatedCohort}
            learningCurves={learningCurves}
            curveMetric={curveMetric}
            setCurveMetric={setCurveMetric}
            sandboxVar1={sandboxVar1}
            setSandboxVar1={setSandboxVar1}
            sandboxVar2={sandboxVar2}
            setSandboxVar2={setSandboxVar2}
            correlationResult={correlationResult}
            getLearningCurvesChartData={getLearningCurvesChartData}
            learningCurvesChartOptions={learningCurvesChartOptions}
            clusterLoading={clusterLoading}
            clusterError={clusterError}
            clusterDataPoints={clusterDataPoints}
            clusterXVar={clusterXVar}
            setClusterXVar={setClusterXVar}
            clusterYVar={clusterYVar}
            setClusterYVar={setClusterYVar}
            getClusteringScatterData={getClusteringScatterData}
            clusteringScatterOptions={clusteringScatterOptions}
            activeDashboardUser={activeDashboardUser}
            getScatterChartData={getScatterChartData}
            scatterChartOptions={scatterChartOptions}
            getCalculatedCentroids={getCalculatedCentroids}
          />
        ) : showDashboard ? (
          <Dashboard 
            activeDashboardUser={activeDashboardUser}
            setActiveDashboardUser={setActiveDashboardUser}
            fetchDashboardData={fetchDashboardData}
            chartsLoading={chartsLoading}
            chartsError={chartsError}
            cohortComparison={cohortComparison}
            latestSessionMetrics={latestSessionMetrics}
            radarDataEnhanced={radarDataEnhanced}
            radarOptions={radarOptions}
            lineChartData={lineChartData}
            lineChartOptions={lineChartOptions}
            barChartData={barChartData}
            barChartOptions={barChartOptions}
            sessionTrendData={sessionTrendData}
            sessionTrendOptions={sessionTrendOptions}
            domainAccData={domainAccData}
            domainAccOptions={domainAccOptions}
            perGameScoreData={perGameScoreData}
            perGameScoreOptions={perGameScoreOptions}
            scatterData={scatterData}
            scatterOptions={scatterOptions}
            sessionHistory={sessionHistory}
            archetypeHistory={archetypeHistory}
            setActiveGame={setActiveGame}
            prescribedGame={prescribedGame}
            skills={skills}
            domainDeltas={domainDeltas}
            rec={rec}
            personalizedReport={personalizedReport}
            lastGameStats={lastGameStats}
            cognitiveProfile={cognitiveProfile}
          />
        ) : portalView === 'knowledge' ? (
          <KnowledgeBase />
        ) : (
          // ==========================================
          // ORIGINAL GAME LOBBY
          // ==========================================
          <div className="lobby-content">
            
            {assessmentStage === 'completed' && (
               <PostTestResults 
                  preScores={preTestScores} 
                  postScores={postTestScores} 
                  aiFeedback={aiFeedback}
                  currentUser={currentUser} 
                  onReturn={() => setAssessmentStage('none')}
               />
            )}

            {preTestScores && assessmentStage !== 'completed' && (
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 5px rgba(192,132,252,0.7))',verticalAlign:'middle',marginRight:'6px',flexShrink:0}} xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="7" rx="7" ry="5" stroke="#c084fc" strokeWidth="2"/><path d="M5 10c0 3 3 6 7 6s7-3 7-6" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="13" x2="9" y2="19" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/><line x1="15" y1="13" x2="15" y2="19" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="19" x2="17" y2="19" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/></svg> Daily Personalized Workout <span style={{ fontSize: '1rem', color: 'var(--color-secondary)', fontWeight: 'normal', marginLeft: '0.5rem' }}>— Target: {DOMAINS_LIST.find(d => d.id === weakestDomain).title}</span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {DOMAINS_LIST.find(d => d.id === weakestDomain).games.slice(0, 3).map((game) => (
                    <HoverTooltip key={game.id} text="This game targets your weakest domain" content="This game targets your weakest domain" delay={200}>
                    <div className="game-card glass-panel" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: '1rem' }} onClick={() => { audioEngine.playClick(); launchGame(game.id); }} onMouseEnter={() => audioEngine.playHover()}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))' }}></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '2rem', width: '50px', height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {game.icon}
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1.25rem' }}>{game.title}</h3>
                          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(var(--rgb-secondary), 0.2)', color: '#c084fc', borderRadius: '4px', fontWeight: 'bold' }}>Recommended</span>
                        </div>
                      </div>
                      <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                        {game.objective}
                      </p>
                    </div>
                    </HoverTooltip>
                  ))}
                </div>
              </div>
            )}

            {/* Quasi-Experimental Analytics Banner */}
            {preTestScores && (
              <div className="game-card" style={{
                padding: '2rem',
                marginBottom: '3rem',
                background: 'rgba(24, 24, 27, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1.5px dashed rgba(var(--rgb-secondary), 0.4)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',filter:'drop-shadow(0 0 4px rgba(var(--rgb-secondary),0.7))'}} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="var(--color-secondary)" strokeWidth="1.5"/><polygon points="16,8 10,10 8,16 14,14" fill="var(--color-secondary)"/><circle cx="12" cy="12" r="1.5" fill="#1e1b4b"/></svg></span> Your Training Progress
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Subject ID: <strong>{currentUser}</strong> | Mapped Weakest Domain: <strong style={{ color: 'var(--color-primary)' }}>{weakestDomain?.replace(/_/g, ' ').toUpperCase()}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {assessmentStage === 'completed' ? (
                      <span 
                        onClick={() => setAssessmentStage('post-test')}
                        title="Take a follow-up assessment"
                        style={{ cursor: 'pointer', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid #4ade80', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s', display: 'inline-block' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        ↻ Take Follow-up Evaluation
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
                          background: 'linear-gradient(to right, #4ade80, var(--color-primary))',
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'5px'}} xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Take Post-Test Questionnaire
                      </button>
                    ) : (
                      <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'5px',filter:'drop-shadow(0 0 3px rgba(245,158,11,0.7))'}} xmlns="http://www.w3.org/2000/svg"><path d="M12 2v4M12 18v4M6 6l2 2M16 16l2 2M2 12h4M18 12h4M6 18l2-2M16 8l2-2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="4" stroke="#f59e0b" strokeWidth="1.5"/></svg> Play Prescribed Game to Unlock Post-Test
                      </span>
                    )}
                  </div>
                </div>

                {/* VIEW SWITCH TOGGLE */}
                <div style={{ display: 'flex', gap: '0.75rem', margin: '0.5rem 0' }}>
                  <button
                    onClick={() => setResearchMode('individual')}
                    style={{
                      background: researchMode === 'individual' ? 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' : 'rgba(255, 255, 255, 0.05)',
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'5px',filter:'drop-shadow(0 0 3px rgba(255,255,255,0.5))'}} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" fill="#ffffff"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/></svg> Individual Participant View
                  </button>
                  <button
                    onClick={() => setResearchMode('aggregate')}
                    style={{
                      background: researchMode === 'aggregate' ? 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' : 'rgba(255, 255, 255, 0.05)',
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'5px',filter:'drop-shadow(0 0 3px rgba(var(--rgb-primary),0.6))'}} xmlns="http://www.w3.org/2000/svg"><rect x="3" y="12" width="4" height="9" rx="1" fill="var(--color-primary)"/><rect x="10" y="6" width="4" height="15" rx="1" fill="var(--color-primary)"/><rect x="17" y="3" width="4" height="18" rx="1" fill="var(--color-primary)" fillOpacity="0.7"/></svg> Aggregate Cohort Study View
                  </button>
                </div>

                {researchMode === 'individual' ? (
                  evaluationReport ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                        
                        {/* Pre vs Post Averages */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Standardized Test Mean</span>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem' }}>
                            {evaluationReport.mean_pretest} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>→</span> <span style={{ color: '#4ade80' }}>{evaluationReport.mean_posttest}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.25rem', fontWeight: 'bold' }}>
                            +{evaluationReport.overall_improvement_rate_pct}% Improvement Rate
                          </div>
                        </div>

                        {/* T-Statistic */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Paired t-Statistic</span>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem' }}>
                            t = {evaluationReport.t_statistic}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Sample Size (n = {evaluationReport.sample_size} Domains)
                          </div>
                        </div>

                        {/* Cohen's d / Effect Size */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Cohen's d Effect Size</span>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem', textTransform: 'capitalize' }}>
                            {evaluationReport.cohens_d} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>({evaluationReport.effect_size_magnitude})</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: evaluationReport.statistically_significant ? '#4ade80' : '#f87171', marginTop: '0.25rem', fontWeight: 'bold' }}>
                            {evaluationReport.statistically_significant ? "Statistically Significant" : "Not Statistically Significant"}
                          </div>
                        </div>

                      </div>

                      {/* Hypothesis & Expose Diffs */}
                      <div style={{ padding: '1rem', background: 'rgba(var(--rgb-secondary),0.05)', border: '1px solid rgba(var(--rgb-secondary),0.15)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 'bold' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: "6px", verticalAlign: "middle"}}><path d="M4 20h16M8 16v-6M12 16V6M16 16v-3"/></svg> Thesis Hypothesis Testing Outcome</div>
                        <div style={{ fontSize: '0.95rem', color: '#ffffff', lineHeight: '1.5' }}>
                          {evaluationReport.hypothesis_result}
                        </div>
                        
                        {evaluationReport.domain_improvements && (
                          <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>Domain Score Margin Changes:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem',
                  maxHeight: '90vh',
                  overflowY: 'auto', marginTop: '0.5rem' }}>
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
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      ⚡ Accessing Research Database & Running Paired t-tests...
                    </div>
                  ) : cohortAnalytics ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                        
                        {/* Sample Size */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Study Cohort Size (n)</span>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem' }}>
                            {cohortAnalytics.sample_size} subjects
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.25rem', fontWeight: 'bold' }}>
                            100% Gating & Telemetry Logged
                          </div>
                        </div>

                        {/* Overall Improvement Margin */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Cohort Improvement Margin</span>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#4ade80', marginTop: '0.5rem' }}>
                            +{cohortAnalytics.overall_improvement_rate_pct}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                            {cohortAnalytics.overall_pre_mean} Pre → {cohortAnalytics.overall_post_mean} Post
                          </div>
                        </div>

                        {/* p-value metric card */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Cohort Significance Level</span>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: cohortAnalytics.statistically_significant ? '#4ade80' : '#f87171', marginTop: '0.5rem' }}>
                            p = {cohortAnalytics.cohort_p_value}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                            t-Statistic: t = {cohortAnalytics.cohort_t_statistic}
                          </div>
                        </div>

                        {/* Global Cohen's d Effect Size */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Global Cohen's d</span>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', marginTop: '0.5rem', textTransform: 'capitalize' }}>
                            d = {cohortAnalytics.cohort_cohens_d}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.25rem', fontWeight: 'bold' }}>
                            ({cohortAnalytics.effect_size_magnitude} Magnitude)
                          </div>
                        </div>

                      </div>

                      {/* Hypothesis Verdict */}
                      <div style={{ padding: '1rem', background: 'rgba(var(--rgb-secondary),0.05)', border: '1px solid rgba(var(--rgb-secondary),0.15)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 'bold' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: "6px", verticalAlign: "middle"}}><path d="M4 20h16M8 16v-6M12 16V6M16 16v-3"/></svg> Thesis Hypothesis Testing Outcome (Aggregate)</div>
                        <div style={{ fontSize: '0.95rem', color: '#ffffff', lineHeight: '1.5' }}>
                          {cohortAnalytics.hypothesis_verdict}
                        </div>
                        
                        {cohortAnalytics.domains && (
                          <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>Group-Wide Domain Comparisons (Mean ± SD):</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                              {Object.entries(cohortAnalytics.domains).map(([dom, dStats]) => (
                                <div key={dom} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                                  <strong style={{ textTransform: 'capitalize', color: 'var(--color-primary)', display: 'block', marginBottom: '0.25rem' }}>
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

                        {/* Force ML Retrain Button */}
                        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                          <button
                            onClick={handleRetrain}
                            disabled={retrainLoading}
                            style={{
                              background: 'linear-gradient(to right, #f59e0b, #ef4444)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.75rem 1.5rem',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              cursor: retrainLoading ? 'not-allowed' : 'pointer',
                              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s',
                              opacity: retrainLoading ? 0.7 : 1
                            }}
                          >
                            {retrainLoading ? 'Retraining Live Models...' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 3a4.5 4.5 0 100 9h5a4.5 4.5 0 100-9h-5zm0 9a4.5 4.5 0 100 9h5a4.5 4.5 0 100-9h-5z"/></svg> Trigger Live ML Retraining Loop'}
                          </button>
                        </div>
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
            {/* Cognitive Targets & Milestones (Option C) */}
            <div className="goals-section-container" style={{ marginBottom: '3.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="section-title" style={{ margin: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.7))',verticalAlign:'middle',marginRight:'6px'}} xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Cognitive Targets & Milestones</h2>
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
                  border: '1px solid rgba(var(--rgb-secondary), 0.2)',
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
                        <option value="spatial_visual_memory">Memory & Recall</option>
                        <option value="logical_mathematical">Logical Reasoning</option>
                        <option value="executive_strategy">Executive Strategy</option>
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
                        background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(var(--rgb-secondary), 0.25)',
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
                  <h3 style={{ fontSize: '1.1rem', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.7))',verticalAlign:'middle',marginRight:'5px'}} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="var(--color-primary)" strokeWidth="1.5"/><circle cx="12" cy="12" r="5" stroke="var(--color-primary)" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="var(--color-primary)"/></svg> Active Targets</h3>
                  
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
                        const domainObj = DOMAIN_INFO[goal.domain] || { title: goal.domain, color: 'var(--color-secondary)', icon: <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><circle cx='12' cy='12' r='9'/><circle cx='12' cy='12' r='5'/><circle cx='12' cy='12' r='2'/></svg> };
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
                  <h3 style={{ fontSize: '1.1rem', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(251,191,36,0.8))',verticalAlign:'middle',marginRight:'5px'}} xmlns="http://www.w3.org/2000/svg"><path d="M6 2h12v10a6 6 0 01-12 0V2z" fill="#fbbf24"/><path d="M5 7H2a4 4 0 004 4M19 7h3a4 4 0 01-4 4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="18" x2="12" y2="21" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="21" x2="16" y2="21" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/></svg> Completed Milestones</h3>
                  
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
                        const domainObj = DOMAIN_INFO[goal.domain] || { title: goal.domain, color: 'var(--color-secondary)', icon: <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M5 9v1a7 7 0 0014 0V9M5 9h14M8 21h8M12 16v5'/></svg> };
                        
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
                              border: `2px solid var(--color-secondary)`,
                              borderRadius: '12px',
                              padding: '0.75rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              boxShadow: '0 0 15px rgba(var(--rgb-secondary), 0.2), inset 0 1px 1px rgba(255,255,255,0.05)',
                              animation: 'pulseGlow 2.5s infinite alternate',
                              position: 'relative'
                            }}
                          >
                            <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 5px var(--color-secondary))' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9v1a7 7 0 0014 0V9M5 9h14M8 21h8M12 16v5"/></svg></span>
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
                        <HoverTooltip key={game.id} text={isPrescribed ? "Recommended to improve your weakest domain" : "Free play mode - Train this specific cognitive skill"} content={isPrescribed ? "Recommended to improve your weakest domain" : "Free play mode - Train this specific cognitive skill"} delay={200}>
                        <div 
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
                            {game.inProgress ? 'In Progress ' : isPrescribed ? 'Launch Active Game' : 'Launch Game'}
                          </button>
                        </div>
                        </HoverTooltip>
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
            }} className="game-mode-modal-overlay">
              <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: `2px solid ${DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.color || '#ffffff'}`,
                borderRadius: '16px',
                padding: '1.5rem',
                width: '90%',
                maxWidth: '700px',
                boxShadow: `0 0 45px ${DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.glow || 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                position: 'relative'
              }} className="game-mode-modal-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.75rem' }}>{pendingGameToLaunch.icon}</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#ffffff' }}>
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
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="game-mode-grid">
                    {[
                      { id: 'timed', label: 'Standard Timed', desc: 'Standard 2-minute timed session.' },
                      { id: 'zen', label: 'Zen Mode', desc: 'Unlimited time, counts up, no pressure.' },
                      { id: 'survival', label: 'Survival Mode', desc: 'Start with 3 lives. Errors deduct lives.' },
                      { id: 'target', label: 'Objective Target', desc: 'Ends after exactly 10 trials.' },
                      { id: 'time_attack', label: 'Time Attack', desc: 'Race to get 10 correct hits.' },
                      { id: 'endurance', label: 'Fatigue Endurance', desc: 'Start with 20s. Hit adds +2s, miss subtracts -5s.' }
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
                          className="game-mode-btn"
                          style={{
                            minHeight: '60px',
                            background: isSelected ? `rgba(255, 255, 255, 0.05)` : 'rgba(255, 255, 255, 0.02)',
                            border: isSelected ? `2px solid ${themeColor}` : '1.5px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: isSelected ? themeColor : '#e2e8f0',
                            padding: '0.6rem',
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <SvgLauncherIcon name={mode.id} style={{ color: isSelected ? themeColor : '#cbd5e1' }} />
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{mode.label}</span>
                          </div>
                          <span className="game-mode-btn-desc" style={{ fontSize: '0.75rem', color: isSelected ? '#ffffff' : '#94a3b8' }}>{mode.desc}</span>
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
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all 0.3s'
                }}>
                  {(() => {
                    const activeModeId = hoveredMode || selectedGameMode || 'timed';
                    const modeDetails = {
                      timed: {
                        title: 'Standard Timed Rules',
                        explanation: 'Traditional cognitive evaluation mode.',
                        rules: 'You have exactly 2 minutes (120 seconds) to complete as many correct trials as possible. Speed and accuracy are balanced in real-time by the DDA engine to calculate difficulty adjustments.'
                      },
                      zen: {
                        title: 'Zen Mode Rules',
                        explanation: 'Low-stress cognitive training & warmup practice.',
                        rules: 'Play at your own pace with no ticking timers or life counters. Perfect for warm-ups, learning the game mechanics, or relaxing without speed-accuracy time pressure.'
                      },
                      survival: {
                        title: 'Survival Mode Rules',
                        explanation: 'High-stakes precision focus training.',
                        rules: 'You start the session with exactly 3 lives. Every incorrect input or element timeout subtracts 1 life. The session continues indefinitely until all lives are depleted. Focus on high accuracy!'
                      },
                      target: {
                        title: 'Objective Target Rules',
                        explanation: 'Fixed-length cognitive efficiency benchmark.',
                        rules: 'The game concludes after exactly 10 trials. Your goal is to maximize accuracy rate and minimize average reaction time. Highly effective for clean pre/post benchmark scoring.'
                      },
                      time_attack: {
                        title: 'Time Attack Rules',
                        explanation: 'Rapid motor execution challenge.',
                        rules: 'Race against the clock to complete exactly 10 correct matches as fast as possible. Any mistakes will delay your timer progress. Speed is key!'
                      },
                      endurance: {
                        title: 'Fatigue Endurance Rules',
                        explanation: 'Adaptive threshold capacity training.',
                        rules: 'Start the session with a 20-second timer. Every correct trial adds +2 seconds of bonus time, while each incorrect trial subtracts -5 seconds. Survive and score as long as you can!'
                      }
                    }[activeModeId];

                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="game-mode-rules-header">
                          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.color || '#ffffff' }}>
                            <SvgLauncherIcon name={activeModeId} />
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

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }} className="game-mode-actions">
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
                      background: DOMAIN_THEMES[pendingGameToLaunch.themeClass]?.btnGradient || 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span>Start Training Session</span>
                      <SvgLauncherIcon name="start" />
                    </div>
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
      {showLeaderboard && <LeaderboardModal onClose={handleCloseLeaderboard} />}
      {gameRewardsModal && <RewardModal rewards={gameRewardsModal} onClose={() => { setGameRewardsModal(null); fetchInventory(); }} />}
      {/* Offline Storage Warning Banner */}
      <OfflineCacheWarningBanner isVisible={offlineCacheFullWarning} onClose={() => setOfflineCacheFullWarning(false)} />

      {activeAchievements.length > 0 && <AchievementToast achievementIds={activeAchievements} onDone={() => setActiveAchievements([])} />}

      {/* PWD Accessibility Menu overlaid globally */}
      <AccessibilityMenu />
    </div>
  );
}


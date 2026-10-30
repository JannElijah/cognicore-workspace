import React, { useState, useEffect, useRef } from 'react';
import { DOMAIN_INFO, COGNITIVE_QUESTIONS, DOMAINS_LIST } from '../utils/constants';
import useDeviceDetect from '../hooks/useDeviceDetect';

// Tech Corner Brackets for Cyber-HUD Aesthetic
const CyberCorner = ({ color = '#00f0ff', size = 8 }) => (
  <>
    <div style={{ position: 'absolute', top: -1, left: -1, width: size, height: size, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: -1, right: -1, width: size, height: size, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, left: -1, width: size, height: size, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, right: -1, width: size, height: size, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
  </>
);

// Front-facing Vector Icons matching Cyber-HUD
const ReflexesIcon = ({ color = '#00f0ff' }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M4 18C4 15 5 13 6 12C6 9 7 5 12 5C17 5 18 8 18 11C18 13.5 17 15 15.5 16.5C14.5 17.5 14 19 14 20" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4 18C4 19.5 5 20.5 7 21H13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9 10L10.5 8L12 12L13.5 9L15 11" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10.5" cy="8" r="1" fill={color} />
    <circle cx="13.5" cy="9" r="1" fill={color} />
  </svg>
);

const MemoryIcon = ({ color = '#818cf8' }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="1.6" fill="rgba(129, 140, 248, 0.15)"/>
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="1.6" strokeDasharray="2 2"/>
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="1.6" strokeDasharray="2 2"/>
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="1.6" fill="rgba(129, 140, 248, 0.35)"/>
  </svg>
);

const LogicIcon = ({ color = '#38bdf8' }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="3.5" stroke={color} strokeWidth="1.5" fill="rgba(56, 189, 248, 0.12)"/>
    <path d="M8 2.5V4M8 12V13.5M2.5 8H4M12 8H13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="15.5" cy="13.5" r="3" stroke={color} strokeWidth="1.5" fill="rgba(56, 189, 248, 0.12)"/>
    <path d="M15.5 9V10.2M15.5 16.8V18M11 13.5H12.2M18.8 13.5H20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <text x="3.5" y="21" fill={color} fontSize="7" fontWeight="bold" fontFamily="monospace">∑</text>
    <text x="8.5" y="21" fill={color} fontSize="7" fontWeight="bold" fontFamily="monospace">√</text>
    <text x="13.5" y="21" fill={color} fontSize="7" fontWeight="bold" fontFamily="monospace">+</text>
  </svg>
);

const StrategyIcon = ({ color = '#f43f5e' }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.6"/>
    <path d="M15.5 5.5L19.5 9.5M19.5 5.5L15.5 9.5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M8 16.5C11 14 11 10 14 8H16" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 2"/>
    <path d="M14 6L16.5 8L14 10" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DOMAIN_DETAILS = {
  all: {
    id: 'all',
    title: 'Comprehensive (All Domains)',
    badgeTitle: 'ALL DOMAINS COMPREHENSIVE',
    color: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    accentBg: 'rgba(0, 240, 255, 0.12)',
    clinicalDescription: 'Executes a standardized 4-domain psychometric battery to calibrate baseline ability parameters (θ) for closed-loop IRT difficulty modulation.',
    metrics: [
      'Global Baseline Ability (θ)',
      'Item Response Latency (ms)',
      'Cross-Domain Cognitive Variance'
    ],
    games: ['SPEED TAP', 'MEMORY MATCH', 'EQUATION BALANCE', 'ROUTE OPTIMIZER'],
    gamesCount: '12 PHASER GAMES'
  },
  reflexes_and_focus: {
    id: 'reflexes_and_focus',
    title: 'Reflexes & Focus',
    badgeTitle: 'REFLEXES & FOCUS',
    color: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    accentBg: 'rgba(0, 240, 255, 0.12)',
    clinicalDescription: 'Measures psychomotor reaction speed, sustained attention, and inhibitory control under high-speed visual stimuli.',
    metrics: [
      'Reaction Latency (ms)',
      'Distractor Suppression',
      'Decision Accuracy'
    ],
    games: ['SPEED TAP', 'FOCUS FINDER', 'STROOP SHIFT'],
    gamesCount: '3 PHASER GAMES'
  },
  spatial_visual_memory: {
    id: 'spatial_visual_memory',
    title: 'Spatial-Visual Memory',
    badgeTitle: 'SPATIAL-VISUAL MEMORY',
    color: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    accentBg: 'rgba(129, 140, 248, 0.12)',
    clinicalDescription: 'Assesses ability to recall patterns, shapes, and grid locations under working memory cognitive load.',
    metrics: [
      'Span Recall Capacity',
      'Visuospatial Accuracy',
      'Error Latency Variance'
    ],
    games: ['MEMORY MATCH', 'MATRIX RECALL', 'NEURO MAZE'],
    gamesCount: '3 PHASER GAMES'
  },
  logical_mathematical: {
    id: 'logical_mathematical',
    title: 'Logical Reasoning',
    badgeTitle: 'LOGICAL REASONING',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    accentBg: 'rgba(56, 189, 248, 0.12)',
    clinicalDescription: 'Tests quantitative problem-solving, arithmetic logic, and inductive mathematical extrapolation.',
    metrics: [
      'Quantitative Accuracy',
      'Mathematical Extrapolation',
      'Logical Pattern Induction'
    ],
    games: ['EQUATION BALANCE', 'SEQUENCE DECODER', 'LOGIC LINK'],
    gamesCount: '3 PHASER GAMES'
  },
  executive_strategy: {
    id: 'executive_strategy',
    title: 'Executive Strategy',
    badgeTitle: 'EXECUTIVE STRATEGY',
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    accentBg: 'rgba(244, 63, 94, 0.12)',
    clinicalDescription: 'Evaluates cognitive flexibility, multi-step planning, resource allocation, and adaptive decision making.',
    metrics: [
      'Multi-Step Path Efficiency',
      'Cognitive Shift Latency',
      'Strategic Resource Optimization'
    ],
    games: ['ROUTE OPTIMIZER', 'PRIORITY QUEUE', 'MENTAL FLEX'],
    gamesCount: '3 PHASER GAMES'
  }
};


export default function AssessmentFlow({
  assessmentStage,
  handleSubmitAssessment,
  assessmentError,
  currentUser,
  assessmentLoading
}) {
  const device = useDeviceDetect();
  const isMobile = device.isMobile;
  const [hoveredDomain, setHoveredDomain] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({});
  const [startTime, setStartTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [confidence, setConfidence] = useState(3);
  const [showConfidence, setShowConfidence] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('all');
  const [expectedTotal, setExpectedTotal] = useState(20);

  const [domainSequence, setDomainSequence] = useState([]);
  const [domainDiffs, setDomainDiffs] = useState({});
  const [usedIds, setUsedIds] = useState([]);

  const timerRef = useRef(null);

  const seededRandom = React.useMemo(() => {
    let seed = 0;
    const str = currentUser || 'guest';
    for (let i = 0; i < str.length; i++) {
      seed = (seed << 5) - seed + str.charCodeAt(i);
      seed |= 0; 
    }
    seed = Math.abs(seed) + 12345;
    
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }, [currentUser, hasStarted]);

  const getRandomQ = (domain, diff, avoidIds) => {
    let pool = COGNITIVE_QUESTIONS.filter(q => q.domain === domain && q.difficulty === diff && !avoidIds.includes(q.id));
    if (pool.length === 0) {
      // Fallback 1: Any difficulty that hasn't been used
      pool = COGNITIVE_QUESTIONS.filter(q => q.domain === domain && !avoidIds.includes(q.id));
    }
    if (pool.length === 0) {
      // Fallback 2: Allow repeats if somehow we completely run out
      pool = COGNITIVE_QUESTIONS.filter(q => q.domain === domain);
    }
    pool.sort((a, b) => a.id.localeCompare(b.id)); // ensure deterministic order
    return pool.length > 0 ? pool[Math.floor(seededRandom() * pool.length)] : null;
  };

  const handleStart = () => {
    const allDomains = ['spatial_visual_memory', 'logical_mathematical', 'reflexes_and_focus', 'executive_strategy'];
    
    let seq = [];
    if (selectedDomainFilter === 'all') {
      for(let i=0; i<5; i++) {
        allDomains.forEach(d => seq.push(d));
      }
      setExpectedTotal(20);
    } else {
      for(let i=0; i<5; i++) {
        seq.push(selectedDomainFilter);
      }
      setExpectedTotal(5);
    }

    const initialDiffs = {
      spatial_visual_memory: 2,
      logical_mathematical: 2,
      reflexes_and_focus: 2,
      executive_strategy: 2
    };

    const firstDomain = seq[0];
    const firstQ = getRandomQ(firstDomain, initialDiffs[firstDomain], []);
    
    setDomainSequence(seq);
    setDomainDiffs(initialDiffs);
    setUsedIds([firstQ.id]);
    setQueue([firstQ]);
    setCurrentIndex(0);
    setHasStarted(true);
    setStartTime(Date.now());
  };

  const currentQ = queue[currentIndex];

  useEffect(() => {
    if (!currentQ || showConfidence || !hasStarted) return;
    
    setTimeLeft(30);
    setStartTime(Date.now());
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, currentQ, showConfidence, hasStarted]);

  const handleTimeUp = () => {
    setSelectedAnswer('TIMEOUT');
    commitAnswer('TIMEOUT', 1, 30000);
  };

  const handleSelectAnswer = (key) => {
    clearInterval(timerRef.current);
    setSelectedAnswer(key);
    setIsHighlighting(true);
    setTimeout(() => {
      setIsHighlighting(false);
      setShowConfidence(true);
    }, 150);
  };

  const submitConfidence = () => {
    const rt = Date.now() - startTime;
    setShowCheckmark(true);
    setTimeout(() => {
      setShowCheckmark(false);
      setIsTransitioning(true);
      setTimeout(() => {
        commitAnswer(selectedAnswer, confidence, rt);
        setIsTransitioning(false);
      }, 200);
    }, 400);
  };

  const commitAnswer = (answer, conf, rt) => {
    const isCorrect = (answer === currentQ.correctAnswer);
    const newResults = { ...results, [currentQ.id]: { answer, isCorrect, rt, confidence: conf } };
    setResults(newResults);

    const currentDomain = currentQ.domain;
    let currentDiff = domainDiffs[currentDomain];
    let nextDiff = isCorrect ? Math.min(3, currentDiff + 1) : Math.max(1, currentDiff - 1);
    
    const nextDiffs = { ...domainDiffs, [currentDomain]: nextDiff };
    setDomainDiffs(nextDiffs);

    const nextIndex = currentIndex + 1;
    if (nextIndex < domainSequence.length) {
      const nextDomain = domainSequence[nextIndex];
      const nextQ = getRandomQ(nextDomain, nextDiffs[nextDomain], usedIds);
      
      setUsedIds(prev => [...prev, nextQ.id]);
      setQueue(prev => [...prev, nextQ]);
      setCurrentIndex(nextIndex);
    } else {
      handleSubmitAssessment(newResults);
    }

    setShowConfidence(false);
    setSelectedAnswer(null);
    setConfidence(3);
  };

  if (hasStarted && !currentQ) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '2rem' }}>Loading assessment protocol...</div>;

  const confidenceLabels = {1: 'Guessing', 2: 'Unsure', 3: 'Somewhat Sure', 4: 'Confident', 5: 'Certain'};

  if (!hasStarted) {
    const activeDomainKey = hoveredDomain || selectedDomainFilter || 'all';
    const activeDetail = DOMAIN_DETAILS[activeDomainKey] || DOMAIN_DETAILS.all;

    return (
      <div 
        className="assessment-hud-container" 
        style={{ 
          maxWidth: '1240px', 
          margin: isMobile ? '0.5rem auto' : '0.4rem auto', 
          padding: isMobile ? '0.5rem' : '0.5rem 1rem', 
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1rem' : '1.35rem',
          alignItems: 'stretch',
          animation: 'fadeIn 0.4s ease-out',
          boxSizing: 'border-box'
        }}
      >
        {/* ================= LEFT COLUMN: DOMAIN SPECIFICATION & CLINICAL BREAKDOWN ================= */}
        <div 
          style={{
            flex: '1',
            maxWidth: isMobile ? '100%' : '370px',
            minWidth: isMobile ? '100%' : '310px',
            background: 'radial-gradient(circle at 15% 15%, rgba(15, 23, 42, 0.96) 0%, rgba(6, 12, 26, 0.98) 100%)',
            border: '1.5px solid rgba(0, 240, 255, 0.35)',
            borderRadius: '14px',
            padding: '0.85rem 1rem',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.12), inset 0 0 20px rgba(0, 240, 255, 0.04)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          <CyberCorner color="#00f0ff" size={10} />

          {/* HUD Header */}
          <div style={{ marginBottom: '0.2rem' }}>
            <span style={{ color: '#00f0ff', fontSize: '0.74rem', fontWeight: '800', letterSpacing: '0.07em' }}>
              DOMAIN SPECIFICATION &amp; CLINICAL BREAKDOWN
            </span>
          </div>

          {/* Active Domain Title Banner */}
          <div style={{
            background: activeDetail.accentBg,
            border: `1.5px solid ${activeDetail.color}`,
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            color: activeDetail.color,
            fontWeight: '900',
            fontSize: '1rem',
            letterSpacing: '0.06em',
            boxShadow: `0 0 14px ${activeDetail.glowColor}`,
            transition: 'all 0.25s ease'
          }}>
            {activeDetail.badgeTitle}
          </div>

          {/* Clinical Description */}
          <p style={{
            color: '#cbd5e1',
            fontSize: '0.82rem',
            lineHeight: '1.45',
            marginTop: '0.65rem',
            marginBottom: '0.35rem',
            minHeight: isMobile ? 'auto' : '55px'
          }}>
            {activeDetail.clinicalDescription}
          </p>

          {/* TARGET METRICS */}
          <div style={{ marginTop: '0.35rem' }}>
            <div style={{ color: '#00f0ff', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
              TARGET METRICS
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#e2e8f0', fontSize: '0.72rem',
              lineHeight: '1.35' }}>
              {activeDetail.metrics.map((m, idx) => (
                <li key={idx} style={{ color: '#cbd5e1' }}>
                  <span style={{ color: '#f1f5f9' }}>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* MAPPED MINI-GAMES */}
          <div style={{ marginTop: '0.45rem' }}>
            <div style={{ color: '#00f0ff', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              MAPPED MINI-GAMES
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {activeDetail.games.map((g, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'rgba(2, 6, 23, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '6px',
                    padding: '0.2rem 0.45rem',
                    color: '#f1f5f9',
                    fontSize: '0.66rem',
                    fontWeight: '800',
                    letterSpacing: '0.04em',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                  }}
                >
                  {g}
                </div>
              ))}
            </div>
          </div>

          {/* TESTING GUIDELINES (Participant Instructions) */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '0.45rem',
            borderTop: '1px solid rgba(0, 240, 255, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.25rem'
            }}>
              <span style={{
                color: '#00f0ff',
                fontSize: '0.7rem',
                fontWeight: '800',
                letterSpacing: '0.07em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ fontSize: '0.85rem' }}>📋</span> TESTING GUIDELINES
              </span>
              <span style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '0.58rem',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '4px',
                letterSpacing: '0.03em'
              }}>
                STANDARDIZED
              </span>
            </div>

            <div style={{
              background: 'rgba(2, 6, 23, 0.75)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div>
                <div style={{ color: '#f1f5f9', fontSize: '0.72rem',
                  fontWeight: '800',
                  marginBottom: '0.05rem' }}>
                  1. Pacing &amp; Time Limit
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.66rem',
                  lineHeight: '1.3' }}>
                  You have 30 seconds per item. Answer promptly to reflect natural cognitive processing.
                </div>
              </div>

              <div>
                <div style={{ color: '#f1f5f9', fontSize: '0.72rem',
                  fontWeight: '800',
                  marginBottom: '0.05rem' }}>
                  2. Confidence Rating
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.66rem',
                  lineHeight: '1.3' }}>
                  After each answer, rate your certainty to measure metacognitive self-awareness.
                </div>
              </div>

              <div>
                <div style={{ color: '#f1f5f9', fontSize: '0.72rem',
                  fontWeight: '800',
                  marginBottom: '0.05rem' }}>
                  3. Dynamic Calibration
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.66rem',
                  lineHeight: '1.3' }}>
                  Questions adapt dynamically to your skill level. There is no penalty for unfamiliar patterns.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: COGNITIVE EVALUATION SELECTOR ================= */}
        <div 
          style={{
            flex: '1.6',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem',
            minWidth: isMobile ? '100%' : '520px',
            boxSizing: 'border-box'
          }}
        >
          {/* Main Title & Subtitle */}
          <div>
            <h1 style={{ 
              color: '#ffffff', 
              fontSize: isMobile ? '1.4rem' : '1.75rem',
              fontWeight: '900',
              margin: '0 0 0.25rem 0',
              letterSpacing: '0.02em',
              textAlign: isMobile ? 'center' : 'left'
            }}>
              Cognitive Evaluation
            </h1>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '0.88rem',
              margin: '0 0 0.45rem 0',
              textAlign: isMobile ? 'center' : 'left'
            }}>
              Select which domains you wish to test
            </p>
          </div>

          {/* Top Hero Option: Comprehensive (All Domains) */}
          <div 
            onClick={() => setSelectedDomainFilter('all')}
            onMouseEnter={() => setHoveredDomain('all')}
            onMouseLeave={() => setHoveredDomain(null)}
            style={{
              background: selectedDomainFilter === 'all' 
                ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)' 
                : 'rgba(15, 23, 42, 0.65)',
              border: selectedDomainFilter === 'all' 
                ? '1.5px solid #00f0ff' 
                : '1px solid rgba(0, 240, 255, 0.3)',
              boxShadow: selectedDomainFilter === 'all' 
                ? '0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 15px rgba(0, 240, 255, 0.08)' 
                : 'none',
              borderRadius: '12px',
              padding: '0.65rem 0.95rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
          >
            {selectedDomainFilter === 'all' && <CyberCorner color="#00f0ff" size={9} />}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ color: '#00f0ff',
                fontWeight: '900',
                fontSize: '0.98rem', letterSpacing: '0.02em' }}>
                Comprehensive (All Domains) — RECOMMENDED
              </div>
              <div style={{ 
                width: '18px', 
                height: '18px', 
                borderRadius: '50%', 
                border: '1.5px solid #00f0ff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: selectedDomainFilter === 'all' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                boxShadow: selectedDomainFilter === 'all' ? '0 0 8px #00f0ff' : 'none'
              }}>
                {selectedDomainFilter === 'all' && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f0ff' }} />
                )}
              </div>
            </div>
            <div style={{ color: '#cbd5e1',
              fontSize: '0.8rem',
              lineHeight: '1.35' }}>
              A full baseline test covering all 4 cognitive domains. Recommended for first-time users.
            </div>
          </div>

          {/* 2x2 Domain Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '0.65rem',
            margin: '0.25rem 0'
          }}>
            {[
              {
                id: 'reflexes_and_focus',
                title: 'Reflexes & Focus',
                desc: 'Trains reaction speed, sustained attention, and resistance to visual interference.',
                icon: <ReflexesIcon color={selectedDomainFilter === 'reflexes_and_focus' ? '#00f0ff' : '#38bdf8'} />,
                color: '#00f0ff'
              },
              {
                id: 'spatial_visual_memory',
                title: 'Spatial-Visual Memory',
                desc: 'Assesses ability to recall patterns, shapes, and grid locations.',
                icon: <MemoryIcon color={selectedDomainFilter === 'spatial_visual_memory' ? '#818cf8' : '#64748b'} />,
                color: '#818cf8'
              },
              {
                id: 'logical_mathematical',
                title: 'Logical Reasoning',
                desc: 'Tests quantitative problem-solving and mathematical extrapolation.',
                icon: <LogicIcon color={selectedDomainFilter === 'logical_mathematical' ? '#38bdf8' : '#64748b'} />,
                color: '#38bdf8'
              },
              {
                id: 'executive_strategy',
                title: 'Executive Strategy',
                desc: 'Evaluates cognitive flexibility, multi-step planning, and adaptive decision making.',
                icon: <StrategyIcon color={selectedDomainFilter === 'executive_strategy' ? '#f43f5e' : '#64748b'} />,
                color: '#f43f5e'
              }
            ].map((d) => {
              const isSelected = selectedDomainFilter === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDomainFilter(d.id)}
                  onMouseEnter={() => setHoveredDomain(d.id)}
                  onMouseLeave={() => setHoveredDomain(null)}
                  style={{
                    background: isSelected 
                      ? 'radial-gradient(circle at 10% 10%, rgba(15, 23, 42, 0.98) 0%, rgba(6, 12, 26, 0.98) 100%)' 
                      : 'rgba(15, 23, 42, 0.5)',
                    border: isSelected 
                      ? `1.5px solid ${d.color}` 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected 
                      ? `0 0 18px ${d.color}50, inset 0 0 12px ${d.color}15` 
                      : 'none',
                    borderRadius: '12px',
                    padding: '0.7rem 0.95rem',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  {isSelected && <CyberCorner color={d.color} size={8} />}
                  
                  {/* Icon */}
                  {d.icon}

                  {/* Text Container */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: isSelected ? '#ffffff' : '#e2e8f0', 
                      fontSize: '1rem', 
                      fontWeight: isSelected ? '800' : '700',
                      marginBottom: '0.25rem',
                      letterSpacing: '0.02em'
                    }}>
                      {d.title}
                    </div>
                    <div style={{ 
                      color: isSelected ? '#cbd5e1' : '#94a3b8', 
                      fontSize: '0.8rem', 
                      lineHeight: '1.4' 
                    }}>
                      {d.desc}
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    borderRadius: '50%', 
                    border: `1.5px solid ${isSelected ? d.color : 'rgba(255, 255, 255, 0.25)'}`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isSelected ? `${d.color}25` : 'transparent',
                    boxShadow: isSelected ? `0 0 8px ${d.color}` : 'none'
                  }}>
                    {isSelected && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.color }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Notice Strip */}
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.08)', 
            border: '1px solid rgba(239, 68, 68, 0.35)', 
            color: '#f87171',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            fontSize: '0.84rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1rem' }}>⏱️</span>
            You have exactly 30 seconds per question.
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.35rem' }}>
            <button 
              onClick={handleStart}
              style={{ 
                background: 'linear-gradient(to right, #38bdf8 0%, #818cf8 100%)', 
                color: '#020617', 
                border: 'none', 
                borderRadius: '8px', 
                padding: '0.75rem 3.5rem',
                fontSize: '1.1rem', 
                fontWeight: '900', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                letterSpacing: '0.02em'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.filter = 'brightness(1.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.filter = 'brightness(1.0)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              Begin Assessment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dom = DOMAIN_INFO[currentQ.domain] || {
    title: 'Cognitive Evaluation',
    color: '#00f0ff',
    icon: '🧠'
  };

  const textMatch = currentQ.text ? currentQ.text.match(/(.*)(?:\s+)([^.]*\?)$/) : null;
  const scenarioText = textMatch ? textMatch[1] : currentQ.text;
  const questionText = textMatch ? textMatch[2] : '';

  return (
    <div 
      className="assessment-hud-session-container" 
      style={{ 
        maxWidth: '1360px', 
        margin: '0.15rem auto 0.6rem auto', 
        padding: isMobile ? '0.35rem' : '0.2rem 1rem', 
        animation: 'fadeIn 0.3s ease-out', 
        opacity: isTransitioning ? 0 : 1, 
        transition: 'opacity 0.2s ease-in-out',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Navigation Strip: Exit / Back to Domain Selection & Active Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.4rem',
        paddingBottom: '0.3rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            setHasStarted(false);
            setSelectedAnswer(null);
            setShowConfidence(false);
          }}
          title="Return to Domain Selection"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#cbd5e1',
            borderRadius: '8px',
            padding: '0.3rem 0.8rem',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#00f0ff';
            e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.5)';
            e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#cbd5e1';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>←</span> Exit to Domain Selection
        </button>

        <span style={{
          color: '#00f0ff',
          fontSize: '0.72rem',
          fontWeight: '800',
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00f0ff',
            boxShadow: '0 0 8px #00f0ff',
            display: 'inline-block'
          }} />
          SECURE PROTOCOL ACTIVE
        </span>
      </div>

      {/* Main 2-Column Split Layout */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0.85rem' : '1.35rem',
        alignItems: 'stretch'
      }}>
        {/* ================= LEFT COLUMN: STIMULUS & SCENARIO CARD ================= */}
        <div 
          style={{
            flex: isMobile ? '1' : '1.25',
            background: 'radial-gradient(circle at 15% 15%, rgba(15, 23, 42, 0.96) 0%, rgba(6, 12, 26, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: isMobile ? '0.85rem' : '1rem 1.4rem',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxSizing: 'border-box'
          }}
        >
          <div>
            {/* Top Row: Title + Scenario count + Mini Timer Ring */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.3rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '1.15rem' }}>🧠</span>
                <span style={{
                  color: '#ffffff',
                  fontSize: isMobile ? '0.92rem' : '1.08rem',
                  fontWeight: '800',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  {assessmentStage === 'pre-test' ? 'Adaptive Pre-Test Evaluation' : 'Adaptive Post-Test Evaluation'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: '700' }}>
                  Scenario {currentIndex + 1} of {expectedTotal}
                </span>

                {/* Mini Timer Ring synced with countdown */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${timeLeft <= 5 ? '#ef4444' : timeLeft <= 15 ? '#f97316' : '#00f0ff'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: timeLeft <= 5 ? '#ef4444' : timeLeft <= 15 ? '#f97316' : '#00f0ff',
                  fontSize: '0.7rem',
                  fontWeight: '900',
                  boxShadow: `0 0 6px ${timeLeft <= 5 ? 'rgba(239, 68, 68, 0.5)' : timeLeft <= 15 ? 'rgba(249, 115, 22, 0.4)' : 'rgba(0, 240, 255, 0.4)'}`
                }}>
                  {timeLeft}
                </div>
              </div>
            </div>

            {/* Gradient Progress Bar */}
            <div style={{
              height: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '0.65rem'
            }}>
              <div style={{
                height: '100%',
                width: `${((currentIndex + 1) / expectedTotal) * 100}%`,
                background: 'linear-gradient(90deg, #00f0ff 0%, #a855f7 100%)',
                boxShadow: '0 0 10px #00f0ff',
                transition: 'width 0.35s ease'
              }} />
            </div>

            {/* Domain Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: `${dom.color}18`,
              border: `1px solid ${dom.color}55`,
              color: dom.color,
              padding: '2px 9px',
              borderRadius: '16px',
              fontSize: '0.7rem',
              fontWeight: '800',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '0.45rem'
            }}>
              <span>{dom.icon}</span>
              <span>{DOMAINS_LIST.find(d => d.id === currentQ.domain)?.title || dom.title}</span>
            </div>

            {/* Question Title */}
            <h2 style={{
              color: '#ffffff',
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '800',
              margin: '0 0 0.35rem 0',
              letterSpacing: '0.02em'
            }}>
              {currentQ.title}
            </h2>

            {/* Scenario & Question Prompt */}
            <p style={{
              color: '#cbd5e1',
              fontSize: isMobile ? '0.82rem' : '0.88rem',
              lineHeight: '1.45',
              margin: '0 0 0.65rem 0'
            }}>
              {scenarioText} {questionText && <strong style={{ color: '#ffffff' }}>{questionText}</strong>}
            </p>
          </div>

          {/* Visual Stimulus Frame */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.75)',
            border: '1px solid rgba(0, 240, 255, 0.22)',
            borderRadius: '12px',
            padding: '0.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '180px',
            maxHeight: isMobile ? '220px' : '260px',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 240, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <CyberCorner color="rgba(0, 240, 255, 0.4)" size={7} />
            {currentQ.visual ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {currentQ.visual}
              </div>
            ) : (
              <div style={{
                color: '#94a3b8',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                letterSpacing: '0.05em'
              }}>
                [ STANDARDIZED SYMBOLIC COGNITIVE PROBE ]
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: DECISION CONSOLE ================= */}
        <div 
          style={{
            flex: isMobile ? '1' : '1',
            background: 'radial-gradient(circle at 80% 15%, rgba(15, 23, 42, 0.96) 0%, rgba(6, 12, 26, 0.98) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.28)',
            borderRadius: '16px',
            padding: isMobile ? '0.85rem' : '1rem 1.4rem',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 240, 255, 0.08)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          {/* Cyber HUD Corner Brackets */}
          <CyberCorner color="#00f0ff" size={12} />

          {/* Decorative Monospace HUD metadata */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '12px',
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            color: 'rgba(0, 240, 255, 0.45)',
            letterSpacing: '0.05em',
            pointerEvents: 'none'
          }}>
            [ 0F18 SEQ {currentIndex + 1}01 ]
          </div>

          <div style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            color: 'rgba(0, 240, 255, 0.45)',
            letterSpacing: '0.05em',
            pointerEvents: 'none'
          }}>
            HUD: ACTIVE
          </div>

          <div>
            {/* Header: DECISION CONSOLE */}
            <div style={{ textAlign: 'center', marginTop: '0.2rem', marginBottom: '0.65rem' }}>
              <div style={{
                color: '#00f0ff',
                fontSize: '1.2rem',
                fontWeight: '900',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textShadow: '0 0 12px rgba(0, 240, 255, 0.6)'
              }}>
                {showConfidence ? 'CONFIDENCE CALIBRATION' : 'DECISION CONSOLE'}
              </div>
            </div>

            {/* Cybernetic Countdown Gauge Widget */}
            {!showConfidence && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.1rem',
                marginBottom: '0.75rem',
                background: 'rgba(2, 6, 23, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '0.45rem 0.75rem'
              }}>
                {/* Left Label */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{
                    color: timeLeft <= 5 ? '#ef4444' : timeLeft <= 15 ? '#f97316' : '#00f0ff',
                    fontSize: '0.6rem',
                    fontWeight: '900',
                    letterSpacing: '0.08em'
                  }}>
                    CYBERNETIC
                  </span>
                  <span style={{
                    color: timeLeft <= 5 ? '#ef4444' : timeLeft <= 15 ? '#f97316' : '#00f0ff',
                    fontSize: '0.6rem',
                    fontWeight: '900',
                    letterSpacing: '0.08em'
                  }}>
                    COUNTDOWN
                  </span>
                </div>

                {/* Center SVG Progress Ring */}
                <div style={{ position: 'relative', width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="68" height="68" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="5" />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="32" 
                      fill="none" 
                      stroke={timeLeft <= 5 ? '#ef4444' : timeLeft <= 15 ? '#f97316' : '#00f0ff'} 
                      strokeWidth="5" 
                      strokeDasharray="201" 
                      strokeDashoffset={201 - (timeLeft / 30) * 201} 
                      strokeLinecap="round"
                      style={{
                        transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease',
                        filter: `drop-shadow(0 0 6px ${timeLeft <= 5 ? '#ef4444' : timeLeft <= 15 ? '#f97316' : '#00f0ff'})`
                      }} 
                    />
                  </svg>
                  <span style={{ 
                    position: 'absolute', 
                    color: '#ffffff', 
                    fontWeight: '900', 
                    fontSize: '1.35rem', 
                    letterSpacing: '-0.02em',
                    textShadow: `0 0 10px ${timeLeft <= 5 ? 'rgba(239, 68, 68, 0.8)' : timeLeft <= 15 ? 'rgba(249, 115, 22, 0.8)' : 'rgba(0, 240, 255, 0.8)'}` 
                  }}>
                    {timeLeft}s
                  </span>
                </div>

                {/* Right Label */}
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'monospace' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.04em' }}>
                    CYBERNETIC COUNTDOWN
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.52rem' }}>
                    TIMER: T0 - 30S
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.52rem' }}>
                    COUNTEES: 2.00-45TS/02S
                  </span>
                </div>
              </div>
            )}

            {/* Prompt Subheading */}
            <div style={{
              color: '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: '800',
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              marginBottom: '0.6rem'
            }}>
              {showConfidence ? 'SELECT YOUR CERTAINTY (1-5 LIKERT)' : 'SELECT YOUR RESPONSE'}
            </div>

            {/* Choice Options Stack or Confidence Rating */}
            {!showConfidence ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAnswer === opt.key;
                  return (
                    <div
                      key={opt.key}
                      className="assessment-option-row"
                      onClick={() => setSelectedAnswer(opt.key)}
                      style={{
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.16) 0%, rgba(168, 85, 247, 0.12) 100%)' 
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected 
                          ? '1.5px solid #00f0ff' 
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: isSelected 
                          ? '0 0 16px rgba(0, 240, 255, 0.4), 0 0 24px rgba(168, 85, 247, 0.25), inset 0 0 10px rgba(0, 240, 255, 0.12)' 
                          : 'none',
                        borderRadius: '11px',
                        padding: '0.65rem 0.95rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.8rem',
                        transition: 'all 0.18s ease',
                        boxSizing: 'border-box'
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.4)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }
                      }}
                    >
                      {/* Left: Key Badge & Text */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <span style={{
                          color: isSelected ? '#00f0ff' : '#38bdf8',
                          fontSize: '1.05rem',
                          fontWeight: '900',
                          minWidth: '18px',
                          textShadow: isSelected ? '0 0 10px #00f0ff' : 'none'
                        }}>
                          {opt.key}
                        </span>
                        <span style={{
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                          fontSize: '0.88rem',
                          fontWeight: isSelected ? '700' : '500',
                          lineHeight: '1.35'
                        }}>
                          {opt.text}
                        </span>
                      </div>

                      {/* Right Indicator: Radio dot or Checkmark */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: isSelected ? 'none' : '1.5px solid rgba(255, 255, 255, 0.25)',
                        background: isSelected ? '#00f0ff' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isSelected ? '0 0 10px #00f0ff' : 'none',
                        color: '#020617',
                        fontWeight: '900',
                        fontSize: '0.8rem'
                      }}>
                        {isSelected && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Metacognitive Confidence Rating inside Decision Console */
              <div style={{ textAlign: 'center', padding: '0.4rem 0' }}>
                {showCheckmark ? (
                  <div style={{ fontSize: '3.2rem', color: '#00f0ff', padding: '1.25rem 0', animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                    ✓
                    <div style={{ color: '#ffffff', fontSize: '1.1rem', marginTop: '0.4rem', fontWeight: '800' }}>Response Recorded</div>
                  </div>
                ) : (
                  <>
                    <p style={{ color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                      Rate your certainty in the response chosen for this scenario:
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 4, 5].map(val => (
                        <div key={val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', width: '62px' }}>
                          <button
                            onClick={() => setConfidence(val)}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: confidence === val ? '#00f0ff' : 'rgba(255,255,255,0.05)',
                              color: confidence === val ? '#020617' : '#ffffff',
                              border: `2px solid ${confidence === val ? '#00f0ff' : 'rgba(255,255,255,0.2)'}`,
                              fontSize: '1.05rem',
                              fontWeight: '900',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              transform: confidence === val ? 'scale(1.12)' : 'scale(1)',
                              boxShadow: confidence === val ? '0 0 12px #00f0ff' : 'none'
                            }}
                          >
                            {val}
                          </button>
                          <span style={{
                            color: confidence === val ? '#00f0ff' : '#64748b',
                            fontSize: '0.6rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            textAlign: 'center'
                          }}>
                            {confidenceLabels[val]}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={submitConfidence}
                      style={{
                        background: 'linear-gradient(135deg, #00f0ff 0%, #6366f1 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '9px',
                        padding: '0.65rem 2.2rem',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: '0 0 18px rgba(0, 240, 255, 0.4)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.15)'}
                      onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1.0)'}
                    >
                      Lock Response &amp; Proceed →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Decorative Monospace HUD metadata at bottom */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            color: 'rgba(0, 240, 255, 0.35)',
            letterSpacing: '0.05em',
            marginTop: '0.6rem',
            textAlign: 'right',
            pointerEvents: 'none'
          }}>
            TEL: CONSOLE // IRT CALIBRATION MODE
          </div>
        </div>
      </div>

      {/* ================= BOTTOM BAR: TELEMETRY & SUBMIT ANSWER ACTION ================= */}
      <div style={{
        marginTop: '0.65rem',
        padding: '0.55rem 0.4rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        {/* Telemetry Indicators (matches screenshot) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00f0ff', fontSize: '0.76rem', fontWeight: '800' }}>
            <span style={{ fontSize: '0.9rem' }}>((•))</span> LATENCY: 240ms
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1', fontSize: '0.76rem', fontWeight: '800' }}>
            <span style={{ border: '1px solid #64748b', borderRadius: '3px', padding: '0 4px', fontSize: '0.68rem' }}>0</span> PANIC FRICTION: 0
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.76rem', fontWeight: '800' }}>
            <span>✓</span> SECURE TELEMETRY ACTIVE
          </span>
        </div>

        {/* Submit Answer Button (matches screenshot) */}
        {!showConfidence && (
          <button
            disabled={!selectedAnswer}
            onClick={() => {
              if (!selectedAnswer) return;
              clearInterval(timerRef.current);
              setShowConfidence(true);
            }}
            style={{
              background: selectedAnswer 
                ? 'linear-gradient(135deg, #00f0ff 0%, #6366f1 100%)' 
                : 'rgba(255, 255, 255, 0.06)',
              color: selectedAnswer ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '9px',
              padding: '0.65rem 2rem',
              fontSize: '0.96rem',
              fontWeight: '800',
              cursor: selectedAnswer ? 'pointer' : 'not-allowed',
              boxShadow: selectedAnswer ? '0 0 20px rgba(0, 240, 255, 0.45)' : 'none',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '0.02em'
            }}
            onMouseOver={(e) => {
              if (selectedAnswer) e.currentTarget.style.filter = 'brightness(1.15)';
            }}
            onMouseOut={(e) => {
              if (selectedAnswer) e.currentTarget.style.filter = 'brightness(1.0)';
            }}
          >
            Submit Answer →
          </button>
        )}
      </div>

      {assessmentError && (
        <div style={{ color: '#f87171', fontSize: '0.88rem', fontWeight: 'bold', marginTop: '0.75rem', textAlign: 'center' }}>
          ⚠️ {assessmentError}
        </div>
      )}
      
      {assessmentLoading && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '26px', height: '26px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTop: '3px solid #00f0ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <div style={{ color: '#00f0ff', fontSize: '0.88rem', fontWeight: 'bold' }}>Calibrating Baseline Ability Parameters (θ)...</div>
        </div>
      )}
      <style>{`
        @keyframes pulse { 0% { opacity: 1; transform: scale(1) rotate(-90deg); } 50% { opacity: 0.8; transform: scale(1.05) rotate(-90deg); } 100% { opacity: 1; transform: scale(1) rotate(-90deg); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes scaleIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

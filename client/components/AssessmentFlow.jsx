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
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M4 18C4 15 5 13 6 12C6 9 7 5 12 5C17 5 18 8 18 11C18 13.5 17 15 15.5 16.5C14.5 17.5 14 19 14 20" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4 18C4 19.5 5 20.5 7 21H13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9 10L10.5 8L12 12L13.5 9L15 11" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10.5" cy="8" r="1" fill={color} />
    <circle cx="13.5" cy="9" r="1" fill={color} />
  </svg>
);

const MemoryIcon = ({ color = '#818cf8' }) => (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="1.6" fill="rgba(129, 140, 248, 0.15)"/>
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="1.6" strokeDasharray="2 2"/>
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="1.6" strokeDasharray="2 2"/>
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="1.6" fill="rgba(129, 140, 248, 0.35)"/>
  </svg>
);

const LogicIcon = ({ color = '#38bdf8' }) => (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
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
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
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
          margin: isMobile ? '0.75rem auto' : '1.15rem auto', 
          padding: isMobile ? '0.75rem' : '1.5rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1.25rem' : '1.75rem',
          alignItems: 'stretch',
          animation: 'fadeIn 0.4s ease-out',
          boxSizing: 'border-box'
        }}
      >
        {/* ================= LEFT COLUMN: DOMAIN SPECIFICATION & CLINICAL BREAKDOWN ================= */}
        <div 
          style={{
            flex: '1',
            maxWidth: isMobile ? '100%' : '380px',
            minWidth: isMobile ? '100%' : '320px',
            background: 'radial-gradient(circle at 15% 15%, rgba(15, 23, 42, 0.96) 0%, rgba(6, 12, 26, 0.98) 100%)',
            border: '1.5px solid rgba(0, 240, 255, 0.35)',
            borderRadius: '14px',
            padding: '1.1rem 1.25rem',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.12), inset 0 0 20px rgba(0, 240, 255, 0.04)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          <CyberCorner color="#00f0ff" size={10} />

          {/* HUD Header */}
          <div style={{ marginBottom: '0.85rem' }}>
            <span style={{ color: '#00f0ff', fontSize: '0.74rem', fontWeight: '800', letterSpacing: '0.07em' }}>
              DOMAIN SPECIFICATION &amp; CLINICAL BREAKDOWN
            </span>
          </div>

          {/* Active Domain Title Banner */}
          <div style={{
            background: activeDetail.accentBg,
            border: `1.5px solid ${activeDetail.color}`,
            borderRadius: '8px',
            padding: '0.6rem 0.85rem',
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
            lineHeight: '1.55',
            marginTop: '0.85rem',
            marginBottom: '0.5rem',
            minHeight: isMobile ? 'auto' : '65px'
          }}>
            {activeDetail.clinicalDescription}
          </p>

          {/* TARGET METRICS */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ color: '#00f0ff', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
              TARGET METRICS
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
              {activeDetail.metrics.map((m, idx) => (
                <li key={idx} style={{ color: '#cbd5e1' }}>
                  <span style={{ color: '#f1f5f9' }}>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* MAPPED MINI-GAMES */}
          <div style={{ marginTop: '0.8rem' }}>
            <div style={{ color: '#00f0ff', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
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
                    padding: '0.4rem 0.6rem',
                    color: '#f1f5f9',
                    fontSize: '0.68rem',
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

          {/* ADAPTIVE CALIBRATION PROTOCOL (IRT Engine) */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(0, 240, 255, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.55rem'
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
                <span style={{ fontSize: '0.85rem' }}>⚙️</span> ADAPTIVE CALIBRATION PROTOCOL
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
                2-PL IRT
              </span>
            </div>

            <div style={{
              background: 'rgba(2, 6, 23, 0.75)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: '8px',
              padding: '0.7rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div>
                <div style={{ color: '#f1f5f9', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.12rem' }}>
                  Item Response Theory (IRT)
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', lineHeight: '1.4' }}>
                  Continuous dynamic ability estimation (<span style={{ color: '#00f0ff', fontWeight: 'bold' }}>θ</span>) modulates item difficulty in real time.
                </div>
              </div>

              <div>
                <div style={{ color: '#f1f5f9', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.12rem' }}>
                  Cognitive Latency Telemetry
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', lineHeight: '1.4' }}>
                  Millisecond reaction tracking distinguishes cognitive processing speed from random guessing.
                </div>
              </div>

              <div>
                <div style={{ color: '#f1f5f9', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.12rem' }}>
                  Bayesian Posterior Ingest
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', lineHeight: '1.4' }}>
                  Reduces estimation error variance to establish accurate baseline skill vectors.
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
            gap: '1rem',
            minWidth: isMobile ? '100%' : '520px',
            boxSizing: 'border-box'
          }}
        >
          {/* Main Title & Subtitle */}
          <div>
            <h1 style={{ 
              color: '#ffffff', 
              fontSize: isMobile ? '1.5rem' : '1.9rem', 
              fontWeight: '900', 
              margin: '0 0 0.35rem 0',
              letterSpacing: '0.02em',
              textAlign: isMobile ? 'center' : 'left'
            }}>
              Cognitive Evaluation
            </h1>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '0.92rem', 
              margin: '0 0 0.75rem 0',
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
              padding: '0.9rem 1.25rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
          >
            {selectedDomainFilter === 'all' && <CyberCorner color="#00f0ff" size={9} />}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ color: '#00f0ff', fontWeight: '900', fontSize: '1.05rem', letterSpacing: '0.03em' }}>
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
            <div style={{ color: '#cbd5e1', fontSize: '0.84rem', lineHeight: '1.45' }}>
              A full baseline test covering all 4 cognitive domains. Recommended for first-time users.
            </div>
          </div>

          {/* 2x2 Domain Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '0.75rem',
            margin: '0.35rem 0'
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
                    padding: '0.85rem 1.1rem',
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
            padding: '0.75rem 1rem', 
            borderRadius: '8px', 
            fontSize: '0.86rem',
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
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <button 
              onClick={handleStart}
              style={{ 
                background: 'linear-gradient(to right, #38bdf8 0%, #818cf8 100%)', 
                color: '#020617', 
                border: 'none', 
                borderRadius: '8px', 
                padding: '0.8rem 3rem', 
                fontSize: '1.15rem', 
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

  const dom = DOMAIN_INFO[currentQ.domain];
  const textMatch = currentQ.text.match(/(.*)(?:\s+)([^.]*\?)$/);
  const scenarioText = textMatch ? textMatch[1] : currentQ.text;
  const questionText = textMatch ? textMatch[2] : '';

  return (
    <div className="assessment-flow-card" style={{ maxWidth: '800px', margin: '3rem auto', padding: '2.5rem', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(var(--rgb-secondary), 0.4)', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', animation: 'fadeIn 0.4s ease-out', opacity: isTransitioning ? 0 : 1, transition: 'opacity 0.2s ease-in-out' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ color: '#ffffff', margin: 0, textTransform: 'uppercase', fontSize: '1.4rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🧠</span> {assessmentStage === 'pre-test' ? 'Adaptive Pre-Test Evaluation' : 'Adaptive Post-Test Evaluation'}
          </h2>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Scenario {currentIndex + 1} of {expectedTotal}
          </div>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(currentIndex / expectedTotal) * 100}%`, background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', transition: 'width 0.4s ease-out' }}></div>
        </div>
      </div>
      
      {!showConfidence ? (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ background: dom.color + '20', color: dom.color, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', border: `1px solid ${dom.color}40` }}>
                {dom.icon} {DOMAINS_LIST.find(d => d.id === currentQ.domain)?.title || dom.title}
              </div>
              <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {currentQ.title}
              </span>
            </div>
            
            <div style={{ position: 'relative', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="50" height="50" viewBox="0 0 50 50" style={{ position: 'absolute', transform: 'rotate(-90deg)', animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none' }}>
                <circle cx="25" cy="25" r="22" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle cx="25" cy="25" r="22" fill="none" stroke={timeLeft <= 10 ? '#ef4444' : dom.color} strokeWidth="4" strokeDasharray="138" strokeDashoffset={138 - (timeLeft / 30) * 138} style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }} strokeLinecap="round" />
              </svg>
              <span style={{ color: timeLeft <= 10 ? '#ef4444' : '#fff', fontWeight: 'bold', fontSize: '1.1rem', zIndex: 2 }}>{timeLeft}</span>
            </div>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '10px', borderLeft: `4px solid ${dom.color}`, marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: questionText ? '1rem' : '0' }}>
              {scenarioText}
            </div>
            {questionText && (
              <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 'bold', lineHeight: '1.4' }}>
                {questionText}
              </div>
            )}
          </div>
          
          {currentQ.visual && (
            <div className="assessment-question-visual" style={{ marginBottom: '2rem' }}>
              {currentQ.visual}
            </div>
          )}

          <div className="eval-inputs-grid" style={{ display: 'grid', gap: '1rem' }}>
            {currentQ.options.map((opt) => (
              <button 
                key={opt.key} 
                onClick={() => handleSelectAnswer(opt.key)}
                style={{ textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '0.8rem', color: (isHighlighting && selectedAnswer === opt.key) ? '#000' : '#cbd5e1', fontSize: '0.95rem', cursor: 'pointer', padding: '1rem', borderRadius: '10px', background: (isHighlighting && selectedAnswer === opt.key) ? dom.color : 'rgba(255,255,255,0.03)', border: `1px solid ${(isHighlighting && selectedAnswer === opt.key) ? dom.color : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.15s ease-out', outline: 'none', transform: (isHighlighting && selectedAnswer === opt.key) ? 'scale(1.02)' : 'scale(1)' }}
                onMouseOver={(e) => { if(!isHighlighting) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = dom.color; } }}
                onMouseOut={(e) => { if(!isHighlighting) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
              >
                <strong style={{ color: (isHighlighting && selectedAnswer === opt.key) ? '#000' : dom.color, fontSize: '1.1rem', marginTop: '-2px' }}>{opt.key}</strong> 
                <span style={{ lineHeight: '1.4', fontWeight: (isHighlighting && selectedAnswer === opt.key) ? 'bold' : 'normal' }}>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.3s ease-out', textAlign: 'center', padding: '3rem 1rem' }}>
          {showCheckmark ? (
            <div style={{ fontSize: '5rem', color: dom.color, animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              ✓
              <h3 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '0.8rem' }}>Recorded</h3>
            </div>
          ) : (
            <>
              <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>How confident are you?</h3>
              <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>Rate your certainty in the answer you just selected.</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map(val => (
                  <div key={val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', width: '80px' }}>
                    <button
                      onClick={() => setConfidence(val)}
                      style={{ width: '50px', height: '50px', borderRadius: '25px', background: confidence === val ? dom.color : 'rgba(255,255,255,0.05)', color: confidence === val ? '#000' : '#fff', border: `2px solid ${confidence === val ? dom.color : 'rgba(255,255,255,0.2)'}`, fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', transform: confidence === val ? 'scale(1.1)' : 'scale(1)' }}
                    >
                      {val}
                    </button>
                    <span style={{ color: confidence === val ? '#fff' : '#64748b', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', transition: 'color 0.2s' }}>
                      {confidenceLabels[val]}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={submitConfidence}
                style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '1rem 3rem', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(var(--rgb-secondary), 0.4)' }}
                onMouseOver={(e) => e.target.style.filter = 'brightness(1.15)'}
                onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
              >
                Lock Response
              </button>
            </>
          )}
        </div>
      )}

      {assessmentError && <div style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '1.5rem', textAlign: 'center' }}>⚠️ {assessmentError}</div>}
      
      {assessmentLoading && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '30px', height: '30px', border: '3px solid rgba(96, 165, 250, 0.2)', borderTop: '3px solid #60a5fa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <div style={{ color: '#60a5fa', fontSize: '0.95rem', fontWeight: 'bold' }}>Analyzing your results...</div>
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

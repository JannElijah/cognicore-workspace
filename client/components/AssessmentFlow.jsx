import React, { useState, useEffect, useRef } from 'react';
import { DOMAIN_INFO, COGNITIVE_QUESTIONS, DOMAINS_LIST } from '../utils/constants';

export default function AssessmentFlow({
  assessmentStage,
  handleSubmitAssessment,
  assessmentError,
  currentUser,
  assessmentLoading
}) {
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
    return (
      <div style={{ maxWidth: '650px', margin: '4rem auto', padding: '3rem', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(var(--rgb-primary), 0.4)', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
        <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1rem' }}>Cognitive Evaluation</h1>
        <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          This assessment measures your baseline cognitive capacity. Select which domains you wish to test.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
          {[
            { id: 'all', title: 'Comprehensive (All Domains)', desc: 'A full baseline test covering all 4 cognitive areas. Recommended for first-time users.', color: 'var(--color-primary)' },
            { id: 'reflexes_and_focus', title: 'Reflexes & Focus', desc: 'Measures your reaction time and ability to ignore rapid visual distractions.', color: 'var(--color-secondary)' },
            { id: 'spatial_visual_memory', title: 'Spatial-Visual Memory', desc: 'Assesses your ability to recall patterns, shapes, and grid locations.', color: '#4ade80' },
            { id: 'logical_mathematical', title: 'Logical Reasoning', desc: 'Tests your quantitative problem-solving and mathematical extrapolation.', color: '#f59e0b' },
            { id: 'executive_strategy', title: 'Executive Strategy', desc: 'Evaluates cognitive flexibility, multi-step planning, and adaptive decision making.', color: '#10b981' }
          ].map(d => (
             <label key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', background: selectedDomainFilter === d.id ? `${d.color}20` : 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${selectedDomainFilter === d.id ? d.color : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.2s' }}>
                <input 
                  type="radio" 
                  name="domainSelect" 
                  value={d.id} 
                  checked={selectedDomainFilter === d.id} 
                  onChange={() => setSelectedDomainFilter(d.id)} 
                  style={{ accentColor: d.color, width: '18px', height: '18px', marginTop: '4px' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: selectedDomainFilter === d.id ? '#fff' : '#e2e8f0', fontSize: '1.1rem', fontWeight: selectedDomainFilter === d.id ? 'bold' : '600' }}>{d.title}</span>
                  <span style={{ color: selectedDomainFilter === d.id ? '#cbd5e1' : '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>{d.desc}</span>
                </div>
             </label>
          ))}
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontWeight: 'bold' }}>
          ⏱️ You have exactly 30 seconds per question. 
        </div>
        <button 
          onClick={handleStart}
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '1rem 3rem', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(var(--rgb-primary), 0.4)' }}
          onMouseOver={(e) => e.target.style.filter = 'brightness(1.15)'}
          onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
        >
          Begin Assessment
        </button>
      </div>
    );
  }

  const dom = DOMAIN_INFO[currentQ.domain];
  const textMatch = currentQ.text.match(/(.*)(?:\s+)([^.]*\?)$/);
  const scenarioText = textMatch ? textMatch[1] : currentQ.text;
  const questionText = textMatch ? textMatch[2] : '';

  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '2.5rem', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(var(--rgb-secondary), 0.4)', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', animation: 'fadeIn 0.4s ease-out', opacity: isTransitioning ? 0 : 1, transition: 'opacity 0.2s ease-in-out' }}>
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
            <div style={{ marginBottom: '2rem' }}>
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
              <h3 style={{ color: '#fff', fontSize: '1.5rem', marginTop: '1rem' }}>Recorded</h3>
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

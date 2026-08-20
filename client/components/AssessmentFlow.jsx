import React, { useState, useEffect, useRef } from 'react';
import { DOMAIN_INFO, COGNITIVE_QUESTIONS } from '../utils/constants';

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
  const timerRef = useRef(null);

  // Initialize Queue with Level 2 questions for all 4 domains
  useEffect(() => {
    const domains = ['spatial_visual_memory', 'logical_mathematical', 'reflexes_and_focus', 'executive_strategy'];
    const initial = domains.map(d => COGNITIVE_QUESTIONS.find(q => q.domain === d && q.difficulty === 2));
    setQueue(initial);
    setStartTime(Date.now());
  }, []);

  const currentQ = queue[currentIndex];

  useEffect(() => {
    if (!currentQ || showConfidence) return;
    
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
  }, [currentIndex, currentQ, showConfidence]);

  const handleTimeUp = () => {
    // If they run out of time, mark as incorrect with 0 confidence
    setSelectedAnswer('TIMEOUT');
    commitAnswer('TIMEOUT', 1, 30000);
  };

  const handleSelectAnswer = (key) => {
    clearInterval(timerRef.current);
    setSelectedAnswer(key);
    setShowConfidence(true);
  };

  const submitConfidence = () => {
    const rt = Date.now() - startTime;
    commitAnswer(selectedAnswer, confidence, rt);
  };

  const commitAnswer = (answer, conf, rt) => {
    const isCorrect = (
      (currentQ.id === 'q1' && answer === 'A') ||
      (currentQ.id === 'q5' && answer === 'D') ||
      (currentQ.id === 'q9' && answer === 'A') ||
      (currentQ.id === 'q2' && answer === 'B') ||
      (currentQ.id === 'q6' && answer === 'C') ||
      (currentQ.id === 'q10' && answer === 'B') ||
      (currentQ.id === 'q3' && answer === 'C') ||
      (currentQ.id === 'q7' && answer === 'B') ||
      (currentQ.id === 'q11' && answer === 'C') ||
      (currentQ.id === 'q4' && answer === 'A') ||
      (currentQ.id === 'q8' && answer === 'A') ||
      (currentQ.id === 'q12' && answer === 'A')
    );

    const newResults = { ...results, [currentQ.id]: { answer, isCorrect, rt, confidence: conf } };
    setResults(newResults);

    // Adaptive Branching Logic
    const newQueue = [...queue];
    if (currentQ.difficulty === 2) {
      const nextDiff = isCorrect ? 3 : 1;
      const nextQ = COGNITIVE_QUESTIONS.find(q => q.domain === currentQ.domain && q.difficulty === nextDiff);
      if (nextQ) {
        newQueue.splice(currentIndex + 1, 0, nextQ);
      }
    }

    setQueue(newQueue);
    setShowConfidence(false);
    setSelectedAnswer(null);
    setConfidence(3);

    if (currentIndex + 1 >= newQueue.length) {
      // Test complete
      handleSubmitAssessment(newResults);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!currentQ) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '2rem' }}>Loading assessment protocol...</div>;

  const dom = DOMAIN_INFO[currentQ.domain];
  
  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '2.5rem', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(var(--rgb-secondary), 0.4)', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
        <h2 style={{ color: '#ffffff', margin: 0, textTransform: 'uppercase', fontSize: '1.4rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🧠</span> {assessmentStage === 'pre-test' ? 'Adaptive Pre-Test Evaluation' : 'Adaptive Post-Test Evaluation'}
        </h2>
        <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>
          Scenario {currentIndex + 1} of {queue.length}
        </div>
      </div>
      
      {!showConfidence ? (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: dom.color, fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {dom.icon} {currentQ.title}
            </span>
            <div style={{ background: timeLeft <= 5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', padding: '0.3rem 0.8rem', borderRadius: '20px', color: timeLeft <= 5 ? '#ef4444' : '#e2e8f0', fontWeight: 'bold', border: `1px solid ${timeLeft <= 5 ? '#ef4444' : 'rgba(255,255,255,0.2)'}`, transition: 'all 0.3s' }}>
              ⏱️ {timeLeft}s
            </div>
          </div>
          
          <div style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: '1.5rem', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '10px', borderLeft: `4px solid ${dom.color}` }}>
            {currentQ.text}
          </div>
          
          {currentQ.visual && (
            <div style={{ marginBottom: '2rem' }}>
              {currentQ.visual}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {currentQ.options.map((opt) => (
              <button 
                key={opt.key} 
                onClick={() => handleSelectAnswer(opt.key)}
                style={{ textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '0.8rem', color: '#cbd5e1', fontSize: '0.95rem', cursor: 'pointer', padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', outline: 'none' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = dom.color; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <strong style={{ color: dom.color, fontSize: '1.1rem', marginTop: '-2px' }}>{opt.key}</strong> 
                <span style={{ lineHeight: '1.4' }}>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.3s ease-out', textAlign: 'center', padding: '3rem 1rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>How confident are you?</h3>
          <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>Rate your certainty in the answer you just selected.</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                onClick={() => setConfidence(val)}
                style={{ width: '50px', height: '50px', borderRadius: '25px', background: confidence === val ? dom.color : 'rgba(255,255,255,0.05)', color: confidence === val ? '#000' : '#fff', border: `2px solid ${confidence === val ? dom.color : 'rgba(255,255,255,0.2)'}`, fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {val}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', marginTop: '-2rem', marginBottom: '3rem' }}>
            <span>Pure Guess</span>
            <span>Absolute Certainty</span>
          </div>

          <button
            onClick={submitConfidence}
            style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '1rem 3rem', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(var(--rgb-secondary), 0.4)' }}
            onMouseOver={(e) => e.target.style.filter = 'brightness(1.15)'}
            onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
          >
            Lock Response
          </button>
        </div>
      )}

      {assessmentError && <div style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '1.5rem', textAlign: 'center' }}>⚠️ {assessmentError}</div>}
      {assessmentLoading && <div style={{ color: '#60a5fa', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '1.5rem', textAlign: 'center' }}>Transmitting Telemetry...</div>}
    </div>
  );
}

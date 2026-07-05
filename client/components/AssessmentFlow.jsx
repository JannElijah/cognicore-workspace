import React from 'react';
import { DOMAIN_INFO, COGNITIVE_QUESTIONS } from '../utils/constants';

export default function AssessmentFlow({
  assessmentStage,
  assessmentAnswers,
  setAssessmentAnswers,
  handleSubmitAssessment,
  assessmentError,
  currentUser,
  assessmentLoading
}) {
  return (
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
  );
}

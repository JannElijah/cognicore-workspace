import React from 'react';

const PretestResults = ({ 
  preTestScores, 
  weakestDomain, 
  prescribedGame, 
  personalizedReport,
  onStartPrescribedGame 
}) => {
  if (!preTestScores) return null;

  const getDomainTheme = (domain) => {
    const themes = {
      spatial_visual_memory: { color: '#4ade80', name: 'Memory & Recall' },
      logical_mathematical: { color: '#f59e0b', name: 'Logical Reasoning' },
      reflexes_and_focus: { color: '#38bdf8', name: 'Reflexes & Focus' },
      executive_strategy: { color: '#a855f7', name: 'Executive Strategy' }
    };
    return themes[domain] || themes.reflexes_and_focus;
  };

  const weakestTheme = getDomainTheme(weakestDomain);

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      padding: '2rem',
      border: '1px solid rgba(51, 65, 85, 0.5)',
      maxWidth: '900px',
      margin: '0 auto',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glow Effect */}
      <div 
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '256px',
          height: '256px',
          borderRadius: '50%',
          opacity: 0.2,
          filter: 'blur(80px)',
          backgroundColor: weakestTheme.color
        }}
      />

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #60a5fa, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          Cognitive Assessment Complete
        </h2>
        <p style={{ color: '#94a3b8' }}>
          Based on your baseline testing, we have analyzed your cognitive profile and generated a personalized training regimen.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Baseline Metrics */}
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(51, 65, 85, 0.3)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.5rem' }}>📊</span> Baseline Metrics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(preTestScores).map(([domain, score]) => {
              const theme = getDomainTheme(domain);
              const scorePercent = Math.min(100, Math.max(0, (score / 100) * 100));
              const isWeakest = domain === weakestDomain;
              
              return (
                <div key={domain}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: isWeakest ? 'bold' : 'normal', color: isWeakest ? theme.color : '#94a3b8' }}>
                      {theme.name} {isWeakest && '(Target)'}
                    </span>
                    <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{Math.round(score)}</span>
                  </div>
                  <div style={{ width: '100%', background: '#1e293b', borderRadius: '9999px', height: '10px', overflow: 'hidden', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                    <div 
                      style={{ 
                        height: '100%',
                        borderRadius: '9999px',
                        transition: 'all 1s ease-out',
                        width: `${scorePercent}%`, 
                        backgroundColor: theme.color,
                        boxShadow: isWeakest ? `0 0 10px ${theme.color}` : 'none'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personalized AI Report */}
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(51, 65, 85, 0.3)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.5rem' }}>🧠</span> AI Profile Analysis
          </h3>
          
          {personalizedReport ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(20, 83, 45, 0.2)', border: '1px solid rgba(22, 101, 52, 0.3)', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ color: '#4ade80', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cognitive Strengths</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.875rem', lineHeight: '1.6' }}>
                  {(personalizedReport.pros || []).map((pro, i) => <li key={i}>{pro}</li>)}
                </ul>
              </div>
              <div style={{ background: 'rgba(127, 29, 29, 0.2)', border: '1px solid rgba(153, 27, 27, 0.3)', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ color: '#f87171', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Weakness</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.875rem', lineHeight: '1.6' }}>
                  {(personalizedReport.weaknesses || []).map((con, i) => <li key={i}>{con}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>
              Your profile indicates a primary training opportunity in <strong style={{ color: weakestTheme.color }}>{weakestTheme.name}</strong>.
            </div>
          )}
        </div>
      </div>

      {/* Prescribed Action */}
      <div style={{ background: 'linear-gradient(to bottom right, #1e293b, #0f172a)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(51, 65, 85, 0.5)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ fontSize: '1.125rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Recommended First Exercise</h3>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: weakestTheme.color }}>
          {prescribedGame}
        </div>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '42rem', margin: '0 auto 1.5rem auto' }}>
          We have generated a custom training curriculum starting with {prescribedGame}. This module is specifically designed to isolate and strengthen your {weakestTheme.name.toLowerCase()} pathways.
        </p>
        <button
          onClick={onStartPrescribedGame}
          style={{ 
            backgroundColor: weakestTheme.color,
            boxShadow: `0 0 20px ${weakestTheme.color}40`,
            padding: '1rem 2rem',
            borderRadius: '9999px',
            fontWeight: 'bold',
            color: '#0f172a',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'transform 0.1s'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Begin Prescribed Training 🚀
        </button>
      </div>
    </div>
  );
};

export default PretestResults;

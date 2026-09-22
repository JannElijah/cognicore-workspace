import React from 'react';

export default function PostTestResults({ preScores, postScores, aiFeedback, currentUser, onReturn }) {
  const domains = [
    { key: 'spatial_visual_memory', label: 'Spatial-Visual', color: '#4ade80' },
    { key: 'logical_mathematical', label: 'Logical-Math', color: '#f59e0b' },
    { key: 'reflexes_and_focus', label: 'Reflexes & Focus', color: '#60a5fa' },
    { key: 'executive_strategy', label: 'Executive Strategy', color: '#c084fc' }
  ];

  // Simple Markdown Parser for the AI Output
  const renderFeedback = (text) => {
    if (!text) return <p style={{ color: '#94a3b8', fontStyle: 'italic', padding: '1rem' }}>AI Profiling is unavailable. This usually occurs if a baseline Pre-Test was not found for comparison.</p>;
    return text.split('\n\n').map((paragraph, i) => {
      if (paragraph.startsWith('### ')) {
        return <h3 key={i} style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{paragraph.replace('### ', '')}</h3>;
      }
      
      const formatted = paragraph.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} style={{ color: '#e2e8f0' }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return <p key={i} style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '1.25rem' }}>{formatted}</p>;
    });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '3rem', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(var(--rgb-secondary), 0.5)', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', animation: 'fadeIn 0.5s ease-out' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: '#ffffff', fontSize: '2.5rem', margin: '0 0 1rem 0', letterSpacing: '0.02em', background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Clinical Assessment Complete
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Subject: <strong>{currentUser}</strong> | Post-Intervention Analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
        
        {/* Quantitative Delta Chart */}
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Quantitative Delta (Pre vs Post)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {domains.map(d => {
              const pre = preScores ? preScores[d.key] : 0;
              const post = postScores ? postScores[d.key] : 0;
              const delta = post - pre;
              const isPositive = delta > 0;
              
              return (
                <div key={d.key} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold' }}>{d.label}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                    {/* Pre Bar */}
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', width: `${pre}%`, borderRadius: '4px' }}></div>
                    {/* Delta Segment */}
                    {isPositive ? (
                      <div style={{ height: '8px', background: d.color, width: `${delta}%`, borderRadius: '4px', boxShadow: `0 0 10px ${d.color}80` }}></div>
                    ) : (
                      <div style={{ height: '8px', background: '#ef4444', width: `${Math.abs(delta)}%`, borderRadius: '4px', opacity: 0.8 }}></div>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'right', fontSize: '1rem', fontWeight: 'bold', color: isPositive ? d.color : (delta < 0 ? '#ef4444' : '#94a3b8') }}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '4px', background: 'rgba(255,255,255,0.2)'}}></div> Baseline (Pre-Test)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '4px', background: '#4ade80'}}></div> Improvement</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '4px', background: '#ef4444'}}></div> Regression</span>
            </div>
          </div>
        </div>

        {/* AI Qualitative Feedback */}
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🤖 AI Qualitative Profiling
          </h2>
          <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(var(--rgb-secondary), 0.3)', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, var(--color-primary), var(--color-secondary))' }}></div>
            {renderFeedback(aiFeedback)}
          </div>
        </div>

      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <button 
          onClick={onReturn || (() => window.location.reload())}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
          onMouseOver={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
          onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        >
          Close Assessment
        </button>
      </div>

    </div>
  );
}

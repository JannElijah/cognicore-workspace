import React from 'react';
import GameIcon from './GameIcon';

export default function PostTestResults({ preScores, postScores, aiFeedback, currentUser, onReturn }) {
  const domains = [
    { key: 'spatial_visual_memory', label: 'Spatial-Visual', color: '#4ade80' },
    { key: 'logical_mathematical', label: 'Logical-Math', color: '#f59e0b' },
    { key: 'reflexes_and_focus', label: 'Reflexes & Focus', color: '#60a5fa' },
    { key: 'executive_strategy', label: 'Executive Strategy', color: '#c084fc' }
  ];

  // Calculate Stats for D2
  const totalPre = domains.reduce((sum, d) => sum + (preScores?.[d.key] || 0), 0);
  const totalPost = domains.reduce((sum, d) => sum + (postScores?.[d.key] || 0), 0);
  const netChange = totalPost - totalPre;
  
  let maxGrowth = { label: 'None', delta: -999, color: '#94a3b8' };
  domains.forEach(d => {
    const delta = (postScores?.[d.key] || 0) - (preScores?.[d.key] || 0);
    if (delta > maxGrowth.delta) maxGrowth = { label: d.label, delta, color: d.color };
  });

  // Simple Markdown Parser (D3)
  const renderFeedback = (text) => {
    if (!text) return <p style={{ color: '#94a3b8', fontStyle: 'italic', padding: '1rem' }}>AI Profiling is unavailable.</p>;
    
    const lines = text.split('\n');
    let elements = [];
    let currentList = [];

    const formatText = (str) => {
      let res = str.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #e2e8f0">$1</strong>');
      res = res.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em style="color: #cbd5e1">$1</em>');
      return res;
    };

    lines.forEach((line, i) => {
      line = line.trim();
      if (!line) return;

      if (line.startsWith('### ')) {
        if (currentList.length > 0) { elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem' }}>{currentList}</ul>); currentList = []; }
        elements.push(<h3 key={`h3-${i}`} style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }} dangerouslySetInnerHTML={{ __html: formatText(line.replace('### ', '')) }} />);
      } else if (line.startsWith('## ')) {
        if (currentList.length > 0) { elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem' }}>{currentList}</ul>); currentList = []; }
        elements.push(<h2 key={`h2-${i}`} style={{ color: '#fff', fontSize: '1.6rem', marginBottom: '1rem', marginTop: '1.5rem' }} dangerouslySetInnerHTML={{ __html: formatText(line.replace('## ', '')) }} />);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        currentList.push(<li key={`li-${i}`} style={{ color: '#94a3b8', marginBottom: '0.5rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: formatText(line.substring(2)) }} />);
      } else {
        if (currentList.length > 0) { elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem' }}>{currentList}</ul>); currentList = []; }
        elements.push(<p key={`p-${i}`} style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '1.25rem' }} dangerouslySetInnerHTML={{ __html: formatText(line) }} />);
      }
    });
    if (currentList.length > 0) elements.push(<ul key={`ul-end`} style={{ paddingLeft: '1.5rem', marginBottom: '1.25rem' }}>{currentList}</ul>);
    return elements;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '3rem', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(var(--rgb-secondary), 0.5)', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', animation: 'fadeIn 0.5s ease-out' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: '#ffffff', fontSize: '2.5rem', margin: '0 0 1rem 0', letterSpacing: '0.02em', background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Cognitive Assessment Complete
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Subject: <strong style={{color: '#fff'}}>{currentUser || 'Guest'}</strong> | Post-Intervention Analysis</p>
      </div>

      {/* D2: Headline Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5rem' }}>Net Cognitive Shift</div>
          <div style={{ color: netChange >= 0 ? '#4ade80' : '#ef4444', fontSize: '2.5rem', fontWeight: 'bold' }}>{netChange > 0 ? '+' : ''}{Math.round(netChange)} <span style={{fontSize: '1rem'}}>pts</span></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5rem' }}>Highest Growth Area</div>
          <div style={{ color: maxGrowth.color, fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{maxGrowth.label}</div>
          <div style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '0.2rem' }}>+{Math.round(maxGrowth.delta)} pts</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5rem' }}>Global Percentile</div>
          <div style={{ color: '#60a5fa', fontSize: '2.5rem', fontWeight: 'bold' }}>Top 12%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
        
        {/* D1: Stacked Delta Chart & D4: Tabular Breakdown */}
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GameIcon name="barChart" inline /> Quantitative Delta & Metrics
          </h2>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '1rem' }}>Domain</th>
                  <th style={{ paddingBottom: '1rem', textAlign: 'center' }}>Pre-Test</th>
                  <th style={{ paddingBottom: '1rem', textAlign: 'center' }}>Post-Test</th>
                  <th style={{ paddingBottom: '1rem', textAlign: 'right' }}>Delta</th>
                </tr>
              </thead>
              <tbody>
                {domains.map(d => {
                  const pre = preScores ? preScores[d.key] : 0;
                  const post = postScores ? postScores[d.key] : 0;
                  const delta = post - pre;
                  const isPositive = delta > 0;
                  return (
                    <tr key={d.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem 0', color: d.color, fontWeight: 'bold' }}>{d.label}</td>
                      <td style={{ padding: '1rem 0', textAlign: 'center', color: '#cbd5e1' }}>{Math.round(pre)}</td>
                      <td style={{ padding: '1rem 0', textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>{Math.round(post)}</td>
                      <td style={{ padding: '1rem 0', textAlign: 'right', color: isPositive ? '#4ade80' : (delta < 0 ? '#ef4444' : '#94a3b8'), fontWeight: 'bold' }}>
                        {delta > 0 ? '+' : ''}{Math.round(delta)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* D1: True Stacked Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {domains.map(d => {
                const pre = preScores ? preScores[d.key] : 0;
                const post = postScores ? postScores[d.key] : 0;
                const delta = post - pre;
                
                return (
                  <div key={d.key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 60px', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{d.label}</div>
                    <div style={{ position: 'relative', height: '10px', background: 'rgba(255,255,255,0.05)', width: '100%', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, Math.max(0, pre))}%`, background: 'rgba(255,255,255,0.2)' }}></div>
                      {delta > 0 && <div style={{ position: 'absolute', left: `${Math.min(100, pre)}%`, top: 0, height: '100%', width: `${Math.min(100 - pre, delta)}%`, background: d.color, boxShadow: `0 0 8px ${d.color}80` }}></div>}
                      {delta < 0 && <div style={{ position: 'absolute', left: `${Math.max(0, post)}%`, top: 0, height: '100%', width: `${Math.min(pre, Math.abs(delta))}%`, background: '#ef4444' }}></div>}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem', color: delta > 0 ? d.color : (delta < 0 ? '#ef4444' : '#94a3b8') }}>
                      {delta > 0 ? '↗' : (delta < 0 ? '↘' : '→')}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem', fontSize: '0.8rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '4px', background: 'rgba(255,255,255,0.2)'}}></div> Baseline</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '4px', background: '#4ade80'}}></div> Improvement</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '4px', background: '#ef4444'}}></div> Regression</span>
            </div>
          </div>
        </div>

        {/* AI Qualitative Feedback */}
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GameIcon name="brain" inline /> AI Qualitative Profiling
          </h2>
          <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(var(--rgb-secondary), 0.3)', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.4)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, var(--color-primary), var(--color-secondary))' }}></div>
            {renderFeedback(aiFeedback)}
          </div>
        </div>

      </div>

      {/* D5: CTAs */}
      <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => alert("Routing to weakest domain training module...")}
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', border: 'none', color: '#fff', padding: '1rem 2.5rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(var(--rgb-primary), 0.4)' }}
          onMouseOver={(e) => e.target.style.filter = 'brightness(1.15)'}
          onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
        >
          Train Weakest Domain
        </button>
      </div>

    </div>
  );
}

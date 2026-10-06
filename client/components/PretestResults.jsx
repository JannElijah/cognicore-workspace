import React from 'react';
import { DOMAIN_INFO, DOMAINS_LIST } from '../utils/constants';


const SvgArchetype = ({ icon, color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: `drop-shadow(0 0 5px ${color}80)`, display: 'inline-block', verticalAlign: 'middle', marginLeft: '8px' }} xmlns="http://www.w3.org/2000/svg">
    {icon === '🏛️' && <path d="M4 10h16M4 14h16M12 3l9 5H3l9-5zM6 14v6m4-6v6m4-6v6m4-6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {icon === '♟️' && <path d="M12 4a2 2 0 100 4 2 2 0 000-4zM8 20h8M10 12l-2 8h8l-2-8-2-4-2 4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {icon === '⚡' && <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {icon === '📊' && <path d="M4 20h16M8 16v-6M12 16V6M16 16v-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {icon === '🛡️' && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {icon === '🌌' && <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeDasharray="3 3"/>}
    {icon === '🎼' && <path d="M9 18V5l12-2v13M9 9l12-2M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-1a3 3 0 11-6 0 3 3 0 016 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {icon === '🚀' && <path d="M13.5 6.5l4 4M12 22l-2.5-2.5-4-1 2.5-3.5L4 11l-2-2c6-3 12-4 18-6-2 6-3 12-6 18l-2-2-4 2.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {icon === '💡' && <path d="M9 18h6M10 22h4M12 2a6 6 0 00-6 6c0 2.2 1.8 4 3 5.5V15h6v-1.5c1.2-1.5 3-3.3 3-5.5a6 6 0 00-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);

const SvgIcon = ({ name, color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ filter: `drop-shadow(0 0 4px ${color}80)`, display: 'inline-block', verticalAlign: 'middle' }} xmlns="http://www.w3.org/2000/svg">
    {name === '🧠' && <path d="M9.5 3a4.5 4.5 0 100 9h5a4.5 4.5 0 100-9h-5zm0 9a4.5 4.5 0 100 9h5a4.5 4.5 0 100-9h-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === '🧩' && <path d="M19 12h-2a3 3 0 010-6h2M5 12h2a3 3 0 000-6H5M12 19v-2a3 3 0 00-6 0v2M12 5v2a3 3 0 01-6 0V5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === '⚡' && <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === '🔄' && <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === '🌟' && <path d="M12 2l3 6.5L22 9l-5 5 1.5 7.5L12 18l-6.5 3.5L7 14 2 9l7-1.5L12 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === '📈' && <path d="M3 3v18h18M7 14l4-4 4 4 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === '🤖' && <path d="M12 2v4M8 6h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2zm-3 5v4m14-4v4m-9-3v2m4-2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === '📊' && <path d="M4 20h16M8 16v-6M12 16V6M16 16v-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);
const PretestResults = ({ 
  preTestScores, 
  weakestDomain, 
  prescribedGame, 
  personalizedReport,
  onStartPrescribedGame 
}) => {
  if (!preTestScores) return null;

  // De-jargonized domains
  const getDomainInfo = (domain) => {
    const info = DOMAIN_INFO[domain] || DOMAIN_INFO.reflexes_and_focus;
    const listInfo = DOMAINS_LIST.find(d => d.id === domain) || {};
    return { color: info.color, name: info.title, icon: info.icon, description: listInfo.description };
  };
  const weakestTheme = getDomainInfo(weakestDomain);

  // Mapping archetypes to engaging personalities
  const archetypeNames = {
    "Fast Learner": <><span style={{color: '#f8fafc'}}>Fast Learner</span><SvgArchetype icon='🚀' color='#4ade80'/></>,
    "Steady Improver": <><span style={{color: '#f8fafc'}}>Steady Improver</span><SvgArchetype icon='📈' color='#f59e0b'/></>,
    "High Fatigue": <><span style={{color: '#f8fafc'}}>High Fatigue</span><SvgArchetype icon='🔋' color='#ef4444'/></>
  };

  const archetypeTitle = personalizedReport?.archetype 
    ? (archetypeNames[personalizedReport.archetype] || personalizedReport.archetype) 
    : <><span style={{color: '#f8fafc'}}>The Learner</span><SvgArchetype icon='💡' color='#e2e8f0'/></>;

  
  // C7: Map game title
  const getGameTitle = (gameId) => {
    for (const d of DOMAINS_LIST) {
      const g = d.games.find(x => x.id === gameId);
      if (g) return g.title;
    }
    return gameId;
  };
  const friendlyGameName = getGameTitle(prescribedGame);

  // C5: Radar Chart Setup
  const scoresArray = [
    preTestScores.spatial_visual_memory || 0,
    preTestScores.logical_mathematical || 0,
    preTestScores.reflexes_and_focus || 0,
    preTestScores.executive_strategy || 0
  ];
  // Calculate max score gap (C3)
  const maxScore = Math.max(...scoresArray);
  const minScore = Math.min(...scoresArray);
  const scoreGap = maxScore - minScore;
  
  const getRadarPoint = (val, angle) => {
    const r = (Math.max(10, Math.min(100, val)) / 100) * 80;
    const rad = angle * (Math.PI / 180);
    return `${100 + r * Math.sin(rad)},${100 - r * Math.cos(rad)}`;
  };
  const polygonPoints = `
    ${getRadarPoint(preTestScores.spatial_visual_memory || 0, 0)} 
    ${getRadarPoint(preTestScores.logical_mathematical || 0, 90)} 
    ${getRadarPoint(preTestScores.reflexes_and_focus || 0, 180)} 
    ${getRadarPoint(preTestScores.executive_strategy || 0, 270)}
  `;

  // C2: Dynamic Prediction text
  const dynamicPrediction = `Based on your pre-test scores (ranging from ${Math.round(minScore)} to ${Math.round(maxScore)}), our model sees the most room for rapid improvement in ${weakestTheme.name}. By focusing here, you can quickly close the ${Math.round(scoreGap)}-point gap in your cognitive profile.`;

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: '24px',
      padding: '2.5rem',
      border: '1px solid rgba(51, 65, 85, 0.5)',
      maxWidth: '1200px',
      margin: '0 auto',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Glow Effect */}
      <div 
        style={{
          position: 'absolute',
          top: '-150px',
          right: '-150px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          opacity: 0.15,
          filter: 'blur(80px)',
          backgroundColor: weakestTheme.color,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
        <h2 style={{
          fontSize: '2.25rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          Your Unique Cognitive Profile
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          We've analyzed your initial gameplay to understand how your mind works. Here is your personalized assessment and training plan.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem', position: 'relative', zIndex: 1, alignItems: 'start' }}>
        
        {/* Personalized AI Report (Left side) */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', fontWeight: '600' }}>Your Archetype</span>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc', marginTop: '0.5rem' }}>
              {archetypeTitle}
            </div>
            {personalizedReport?.confidence_score && (
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                AI Match Confidence: {(personalizedReport.confidence_score * 100).toFixed(0)}%
              </div>
            )}
          </div>
          
          {personalizedReport ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ background: 'rgba(20, 83, 45, 0.15)', borderLeft: '4px solid #22c55e', borderRadius: '4px 12px 12px 4px', padding: '1.25rem' }}>
                <h4 style={{ color: '#4ade80', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SvgIcon name='🌟' color='#4ade80' /> Your Strengths
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {(personalizedReport.pros || []).map((pro, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{pro}</li>)}
                </ul>
              </div>
              <div style={{ background: 'rgba(127, 29, 29, 0.15)', borderLeft: '4px solid #ef4444', borderRadius: '4px 12px 12px 4px', padding: '1.25rem' }}>
                <h4 style={{ color: '#f87171', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SvgIcon name='📈' color='#f87171' /> Growth Areas
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {(personalizedReport.weaknesses || []).map((con, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{con}</li>)}
                </ul>
              </div>
              <div style={{ background: 'rgba(var(--rgb-primary), 0.15)', borderLeft: '4px solid var(--color-primary)', borderRadius: '4px 12px 12px 4px', padding: '1.25rem' }}>
                <h4 style={{ color: 'var(--color-primary)', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SvgIcon name='🤖' color='var(--color-primary)' /> AI Prediction Breakdown
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                            <span>Performance Gap (Opportunity)</span>
                            <span>{Math.round(scoreGap)} pts</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, scoreGap)}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), #818cf8)' }} />
                        </div>
                    </div>
                </div>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {dynamicPrediction}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '1rem', fontStyle: 'italic', textAlign: 'center' }}>
              Your profile indicates a primary training opportunity in <strong style={{ color: weakestTheme.color }}>{weakestTheme.name}</strong>.
            </div>
          )}
        </div>

        {/* Baseline Metrics (Right side) */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(51, 65, 85, 0.4)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SvgIcon name='📊' color='#e2e8f0' /> Your Skill Breakdown
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '2rem' }}>
            Here's a simplified look at your cognitive performance across 4 key areas. Higher is better!
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <circle cx="100" cy="100" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              
              <polygon points={polygonPoints} fill="rgba(var(--rgb-primary), 0.3)" stroke="var(--color-primary)" strokeWidth="2" style={{ transition: 'all 1s ease' }}/>
              <circle cx={getRadarPoint(preTestScores.spatial_visual_memory || 0, 0).split(',')[0]} cy={getRadarPoint(preTestScores.spatial_visual_memory || 0, 0).split(',')[1]} r="4" fill="#4ade80"/>
              <circle cx={getRadarPoint(preTestScores.logical_mathematical || 0, 90).split(',')[0]} cy={getRadarPoint(preTestScores.logical_mathematical || 0, 90).split(',')[1]} r="4" fill="#f59e0b"/>
              <circle cx={getRadarPoint(preTestScores.reflexes_and_focus || 0, 180).split(',')[0]} cy={getRadarPoint(preTestScores.reflexes_and_focus || 0, 180).split(',')[1]} r="4" fill="var(--color-primary)"/>
              <circle cx={getRadarPoint(preTestScores.executive_strategy || 0, 270).split(',')[0]} cy={getRadarPoint(preTestScores.executive_strategy || 0, 270).split(',')[1]} r="4" fill="var(--color-secondary)"/>
            </svg>
          </div>

          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {Object.entries(preTestScores).map(([domain, score]) => {
              const theme = getDomainInfo(domain);
              const scorePercent = Math.min(100, Math.max(0, (score / 100) * 100));
              const isWeakest = domain === weakestDomain;
              
              return (
                <div key={domain}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: '600', color: isWeakest ? theme.color : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                        <span>{theme.icon}</span> {theme.name}
                        {isWeakest && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: theme.color + '30', color: theme.color, borderRadius: '12px', marginLeft: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Target Focus</span>}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{theme.description}</div>
                    </div>
                    <span style={{ color: isWeakest ? theme.color : '#cbd5e1', fontWeight: '700', fontSize: '1.2rem' }}>{Math.round(score)} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ 100</span></span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(0,0,0,0.4)', borderRadius: '9999px', height: '20px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                    <div 
                      style={{ 
                        height: '100%',
                        borderRadius: '9999px',
                        transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        width: `${scorePercent}%`, 
                        background: `linear-gradient(90deg, ${theme.color}, ${theme.color})`,
                        boxShadow: isWeakest ? `0 0 12px ${theme.color}80` : 'none',
                        position: 'relative'
                      }}
                    >
                       <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 'bold', color: '#0f172a', textShadow: '0 1px 2px rgba(255,255,255,0.25)' }}>{Math.round(scorePercent)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Prescribed Action */}
      <div style={{ 
        background: `linear-gradient(135deg, ${weakestTheme.color}15, rgba(15, 23, 42, 0.8))`, 
        borderRadius: '16px', 
        padding: '2.5rem', 
        textAlign: 'center', 
        border: `1px solid ${weakestTheme.color}40`, 
        position: 'relative', 
        zIndex: 1 
      }}>
        <h3 style={{ fontSize: '1.25rem', color: '#e2e8f0', marginBottom: '1rem', fontWeight: '600' }}>Your Personalized Training Plan</h3>
        <p style={{ fontSize: '1.05rem', color: '#cbd5e1', marginBottom: '2rem', maxWidth: '48rem', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
          Based on your profile, the best way to level up your brain is to practice <strong>{weakestTheme.name}</strong>. 
          We recommend starting with the <strong style={{ color: weakestTheme.color, fontSize: '1.2rem' }}>{friendlyGameName}</strong> exercise to build those neural pathways!
        </p>
        <button
          onClick={onStartPrescribedGame}
          style={{ 
            backgroundColor: weakestTheme.color,
            color: '#0f172a',
            border: 'none',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            padding: '1.25rem 3rem',
            borderRadius: '9999px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: `0 8px 25px ${weakestTheme.color}60`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = `0 12px 30px ${weakestTheme.color}80`;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = `0 8px 25px ${weakestTheme.color}60`;
          }}
        >
          Start {friendlyGameName} Training
        </button>
      </div>
    </div>
  );
};

export default PretestResults;

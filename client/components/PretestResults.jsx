import React from 'react';

const PretestResults = ({ 
  preTestScores, 
  weakestDomain, 
  prescribedGame, 
  personalizedReport,
  onStartPrescribedGame 
}) => {
  if (!preTestScores) return null;

  // De-jargonized domains
  const domainMapping = {
    spatial_visual_memory: { color: '#4ade80', name: 'Spatial Visual Memory', icon: '🧠', description: 'How well you remember patterns and locations.' },
    logical_mathematical: { color: '#f59e0b', name: 'Logical Mathematical', icon: '🧩', description: 'Your ability to figure out patterns and rules.' },
    reflexes_and_focus: { color: '#38bdf8', name: 'Reflexes and Focus', icon: '⚡', description: 'How fast you react and maintain attention.' },
    executive_strategy: { color: '#a855f7', name: 'Executive Strategy', icon: '🔄', description: 'How quickly you adjust to changing situations.' }
  };

  const getDomainInfo = (domain) => domainMapping[domain] || domainMapping.reflexes_and_focus;
  const weakestTheme = getDomainInfo(weakestDomain);

  // Mapping archetypes to engaging personalities
  const archetypeNames = {
    "The Architect": "The Architect 🏛️",
    "The Strategist": "The Strategist ♟️",
    "The Catalyst": "The Catalyst ⚡",
    "The Analyst": "The Analyst 📊",
    "The Guardian": "The Guardian 🛡️",
    "The Visionary": "The Visionary 🌌",
    "The Maestro": "The Maestro 🎼",
    "The Vanguard": "The Vanguard 🚀"
  };

  const archetypeTitle = personalizedReport?.archetype 
    ? (archetypeNames[personalizedReport.archetype] || personalizedReport.archetype) 
    : "The Learner 💡";

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: '24px',
      padding: '2.5rem',
      border: '1px solid rgba(51, 65, 85, 0.5)',
      maxWidth: '900px',
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
        
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(20, 83, 45, 0.15)', borderLeft: '4px solid #22c55e', borderRadius: '4px 12px 12px 4px', padding: '1.25rem' }}>
                <h4 style={{ color: '#4ade80', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🌟</span> Your Strengths
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {(personalizedReport.pros || []).map((pro, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{pro}</li>)}
                </ul>
              </div>
              <div style={{ background: 'rgba(127, 29, 29, 0.15)', borderLeft: '4px solid #ef4444', borderRadius: '4px 12px 12px 4px', padding: '1.25rem' }}>
                <h4 style={{ color: '#f87171', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📈</span> Growth Areas
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {(personalizedReport.weaknesses || []).map((con, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{con}</li>)}
                </ul>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', borderLeft: '4px solid #38bdf8', borderRadius: '4px 12px 12px 4px', padding: '1.25rem' }}>
                <h4 style={{ color: '#38bdf8', fontWeight: '700', marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🤖</span> AI Prediction Breakdown
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                            <span>Growth Potential</span>
                            <span>High ({(personalizedReport.confidence_score * 100).toFixed(0)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${personalizedReport.confidence_score * 100}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
                        </div>
                    </div>
                </div>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Based on your initial latency and accuracy patterns, our predictive model suggests you will likely excel in <strong style={{ color: weakestTheme.color }}>{weakestTheme.name}</strong> if you train consistently. You are projected to hit the <strong>Level 3 Difficulty Milestone</strong> within your next 5 sessions.
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
            <span>📊</span> Your Skill Breakdown
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '2rem' }}>
            Here's a simplified look at your cognitive performance across 4 key areas. Higher is better!
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1, justifyContent: 'center' }}>
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
                    <span style={{ color: isWeakest ? theme.color : '#cbd5e1', fontWeight: '700', fontSize: '1.2rem' }}>{Math.round(score)}</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(0,0,0,0.4)', borderRadius: '9999px', height: '12px', overflow: 'hidden', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                    <div 
                      style={{ 
                        height: '100%',
                        borderRadius: '9999px',
                        transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        width: `${scorePercent}%`, 
                        background: `linear-gradient(90deg, ${theme.color}aa, ${theme.color})`,
                        boxShadow: isWeakest ? `0 0 12px ${theme.color}80` : 'none'
                      }}
                    />
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
          We recommend starting with the <strong style={{ color: weakestTheme.color, fontSize: '1.2rem' }}>{prescribedGame}</strong> exercise to build those neural pathways!
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
          Start {prescribedGame} Training
        </button>
      </div>
    </div>
  );
};

export default PretestResults;

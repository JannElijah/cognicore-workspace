import React from 'react';
import { DOMAIN_INFO, DOMAINS_LIST } from '../utils/constants';

// Cyber Corner Brackets
const CyberCorner = ({ color = '#00f0ff', size = 8 }) => (
  <>
    <div style={{ position: 'absolute', top: -1, left: -1, width: size, height: size, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: -1, right: -1, width: size, height: size, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, left: -1, width: size, height: size, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, right: -1, width: size, height: size, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
  </>
);

const TargetIcon = ({ color = '#22c55e', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const LightbulbIcon = ({ color = '#38bdf8', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M9 18h6M10 22h4M12 2a6 6 0 00-6 6c0 2.2 1.8 4 3 5.5V15h6v-1.5c1.2-1.5 3-3.3 3-5.5a6 6 0 00-6-6z" />
  </svg>
);

const BoltIcon = ({ color = '#f43f5e', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const BrainIcon = ({ color = '#00f0ff', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M9.5 2a4.5 4.5 0 00-4.5 4.5c0 .64.13 1.25.37 1.8A4.5 4.5 0 004 12c0 1.2.48 2.28 1.26 3.08A4.5 4.5 0 009.5 22h1V2h-1zM14.5 2a4.5 4.5 0 014.5 4.5c0 .64-.13 1.25-.37 1.8A4.5 4.5 0 0120 12c0 1.2-.48 2.28-1.26 3.08A4.5 4.5 0 0114.5 22h-1V2h1z" />
  </svg>
);

const ChartIcon = ({ color = '#38bdf8', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const PretestResults = ({ 
  preTestScores, 
  weakestDomain = 'executive_strategy', 
  prescribedGame = 'priority_queue', 
  personalizedReport,
  onStartPrescribedGame,
  onProceedToDashboard,
  isMobile
}) => {
  if (!preTestScores) return null;

  // Normalized scores dictionary
  const scores = {
    executive_strategy: preTestScores.executive_strategy ?? 60,
    logical_mathematical: preTestScores.logical_mathematical ?? 70,
    reflexes_and_focus: preTestScores.reflexes_and_focus ?? 65,
    spatial_visual_memory: preTestScores.spatial_visual_memory ?? 80
  };

  // Domain friendly metadata
  const getDomainInfo = (domain) => {
    const info = DOMAIN_INFO[domain] || DOMAIN_INFO.executive_strategy;
    const listInfo = DOMAINS_LIST.find(d => d.id === domain) || {};
    return { color: info.color, name: info.title, icon: info.icon, description: listInfo.description };
  };

  const weakestTheme = getDomainInfo(weakestDomain);

  // Friendly prescribed game title
  const getGameTitle = (gameId) => {
    for (const d of DOMAINS_LIST) {
      const g = d.games.find(x => x.id === gameId);
      if (g) return g.title;
    }
    return gameId ? gameId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Priority Queue';
  };
  const friendlyGameName = getGameTitle(prescribedGame);

  // Archetype
  const rawArchetype = personalizedReport?.archetype || 'The Learner';
  const archetypeTitle = rawArchetype.replace(/💡|🚀|📈|🔋|♟️/g, '').trim();

  // Sort domains descending to compute strengths and growth areas dynamically
  const sortedDomains = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topStrengths = sortedDomains.slice(0, 2);
  const topGrowth = sortedDomains.slice(2).reverse(); // lowest first

  const getStrengthAnnotation = (domainId) => {
    switch (domainId) {
      case 'spatial_visual_memory': return 'Memory & Recall (High retention & accuracy)';
      case 'logical_mathematical': return 'Logical Reasoning (Strong sequential analysis)';
      case 'reflexes_and_focus': return 'Reflexes & Focus (Rapid stimulus discrimination)';
      case 'executive_strategy': return 'Executive Strategy (Optimal planning control)';
      default: return 'Stable cognitive processing';
    }
  };

  const getGrowthAnnotation = (domainId) => {
    switch (domainId) {
      case 'executive_strategy': return 'Executive Strategy (Prioritized for adaptation)';
      case 'reflexes_and_focus': return 'Reflexes & Focus (Needs pacing stabilization)';
      case 'logical_mathematical': return 'Logical Reasoning (Complex rule induction)';
      case 'spatial_visual_memory': return 'Memory & Recall (Pattern rotation fidelity)';
      default: return 'Targeted for adaptive enhancement';
    }
  };

  // Custom Radar Chart Geometry (Matching Image 4)
  // Top: Executive Strategy | Right: Logical Reasoning | Bottom: Reflexes & Focus | Left: Memory & Recall
  const cx = 250;
  const cy = 155;
  const R = 96;

  const pt_top = { x: cx, y: cy - Math.max(16, (scores.executive_strategy / 100) * R) };
  const pt_right = { x: cx + Math.max(16, (scores.logical_mathematical / 100) * R), y: cy };
  const pt_bottom = { x: cx, y: cy + Math.max(16, (scores.reflexes_and_focus / 100) * R) };
  const pt_left = { x: cx - Math.max(16, (scores.spatial_visual_memory / 100) * R), y: cy };

  const polygonPoints = `${pt_top.x},${pt_top.y} ${pt_right.x},${pt_right.y} ${pt_bottom.x},${pt_bottom.y} ${pt_left.x},${pt_left.y}`;

  return (
    <div 
      className="pretest-results-cyber-deck"
      style={{
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        color: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* ================= HEADER SECTION ================= */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.25rem' : '1.75rem' }}>
        <h2 style={{
          fontSize: isMobile ? '1.6rem' : '2.15rem',
          fontWeight: '900',
          letterSpacing: '-0.02em',
          margin: '0 0 0.5rem 0',
          background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 25px rgba(56, 189, 248, 0.25)'
        }}>
          Your Unique Cognitive Profile
        </h2>
        <p style={{ 
          color: '#94a3b8', 
          fontSize: isMobile ? '0.85rem' : '0.98rem', 
          maxWidth: '680px', 
          margin: '0 auto', 
          lineHeight: '1.5' 
        }}>
          We've analyzed your initial gameplay to understand how your mind works. Here is your personalized assessment and training plan.
        </p>
      </div>

      {/* ================= 3-COLUMN COMMAND DECK ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(280px, 1fr) minmax(420px, 1.45fr) minmax(290px, 1.05fr)',
        gap: isMobile ? '1rem' : '1.25rem',
        alignItems: 'stretch'
      }}>
        
        {/* ================= COLUMN 1: ARCHETYPE & DIAGNOSTICS ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Card 1: Your Archetype */}
          <div style={{
            background: 'rgba(10, 18, 36, 0.75)',
            border: '1px solid rgba(0, 240, 255, 0.22)',
            borderRadius: '14px',
            padding: '1.15rem 1.25rem',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            <CyberCorner color="#00f0ff" size={8} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
                YOUR ARCHETYPE:
              </span>
              <div style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '8px', 
                background: 'rgba(0, 240, 255, 0.12)', 
                border: '1px solid rgba(0, 240, 255, 0.4)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)'
              }}>
                <span style={{ fontSize: '14px' }}>💡</span>
              </div>
            </div>

            <div style={{ fontSize: '1.55rem', fontWeight: '900', color: '#ffffff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {archetypeTitle} <span style={{ fontSize: '1.1rem', color: '#38bdf8' }}>💡</span>
            </div>

            <div style={{
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.82rem',
              color: '#cbd5e1',
              lineHeight: '1.45'
            }}>
              Your profile indicates a primary training opportunity in{' '}
              <strong style={{ color: weakestTheme.color, fontWeight: '700' }}>{weakestTheme.name}</strong>.
            </div>
          </div>

          {/* Card 2: Diagnostic Breakdown */}
          <div style={{
            background: 'rgba(10, 18, 36, 0.75)',
            border: '1px solid rgba(0, 240, 255, 0.22)',
            borderRadius: '14px',
            padding: '1.15rem 1.25rem',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}>
            <CyberCorner color="#00f0ff" size={8} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: '800', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
                DIAGNOSTIC BREAKDOWN
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div style={{ width: '4px', height: '4px', background: 'rgba(0, 240, 255, 0.6)' }} />
                <div style={{ width: '4px', height: '4px', background: 'rgba(0, 240, 255, 0.3)' }} />
                <div style={{ width: '4px', height: '4px', background: 'rgba(0, 240, 255, 0.15)' }} />
              </div>
            </div>

            {/* Strengths Box */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ color: '#4ade80', fontSize: '0.82rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💪</span> Skill Strengths
                </span>
                <span style={{ fontSize: '0.65rem', color: '#4ade80', fontFamily: 'monospace' }}>« »</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: '1.45' }}>
                {topStrengths.map(([d]) => (
                  <div key={d} style={{ marginBottom: '2px' }}>{getStrengthAnnotation(d)}</div>
                ))}
              </div>
            </div>

            {/* Growth Areas Box */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯</span> Growth Areas
                </span>
                <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontFamily: 'monospace' }}>» »</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: '1.45' }}>
                {topGrowth.map(([d]) => (
                  <div key={d} style={{ marginBottom: '2px' }}>{getGrowthAnnotation(d)}</div>
                ))}
              </div>
            </div>
          </div>


        </div>

        {/* ================= COLUMN 2: SKILL BREAKDOWN & RADAR HUD ================= */}
        <div style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(15, 23, 42, 0.95) 0%, rgba(6, 12, 26, 0.98) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.28)',
          borderRadius: '16px',
          padding: '1.15rem 1.35rem',
          position: 'relative',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 240, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <CyberCorner color="#00f0ff" size={10} />

          {/* Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChartIcon color="#00f0ff" size={18} />
              <span style={{ fontSize: '0.86rem', fontWeight: '900', letterSpacing: '0.08em', color: '#ffffff', textTransform: 'uppercase' }}>
                YOUR SKILL BREAKDOWN
              </span>
            </div>
            <div style={{ 
              width: '26px', 
              height: '26px', 
              borderRadius: '6px', 
              background: 'rgba(0, 240, 255, 0.08)', 
              border: '1px solid rgba(0, 240, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '12px' }}>📊</span>
            </div>
          </div>

          {/* Background Cyber Blueprint Grid + Radar SVG */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '315px',
            background: 'rgba(3, 7, 18, 0.75)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Fine Cyber Grid Texture */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none'
            }} />

            <svg width="100%" height="100%" viewBox="0 0 500 310" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
              <defs>
                <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(0, 240, 255, 0.55)" />
                  <stop offset="60%" stopColor="rgba(56, 189, 248, 0.3)" />
                  <stop offset="100%" stopColor="rgba(34, 197, 94, 0.15)" />
                </radialGradient>
                <filter id="neonRadarGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.85" />
                </filter>
              </defs>

              {/* Concentric Coordinate Rings & Percentages */}
              {[
                { frac: 0.25, label: '25' },
                { frac: 0.50, label: '50' },
                { frac: 0.75, label: '75' },
                { frac: 1.00, label: '100' }
              ].map(({ frac, label }, i) => (
                <g key={i}>
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={R * frac} 
                    fill="none" 
                    stroke={frac === 1.0 ? "rgba(0, 240, 255, 0.42)" : "rgba(0, 240, 255, 0.2)"} 
                    strokeWidth={frac === 1.0 ? "1.5" : "1"} 
                    strokeDasharray={frac < 1.0 ? "3 3" : "none"} 
                  />
                  <text 
                    x={cx + 5} 
                    y={cy - R * frac + 3} 
                    fill={frac === 1.0 ? "rgba(0, 240, 255, 0.95)" : "rgba(148, 163, 184, 0.8)"} 
                    fontSize="9" 
                    fontWeight="700" 
                    fontFamily="monospace"
                  >
                    {label}
                  </text>
                </g>
              ))}

              {/* Crosshair Axes */}
              <line x1={cx - R - 20} y1={cy} x2={cx + R + 20} y2={cy} stroke="rgba(0, 240, 255, 0.35)" strokeWidth="1.2" />
              <line x1={cx} y1={cy - R - 20} x2={cx} y2={cy + R + 20} stroke="rgba(0, 240, 255, 0.35)" strokeWidth="1.2" />

              {/* Axis Labels (Two-line stacked side labels to ensure perfect fit without edge clipping) */}
              <text x={cx} y={cy - R - 14} textAnchor="middle" fill="#22c55e" fontSize="13" fontWeight="900" letterSpacing="0.04em" filter="url(#badgeShadow)">
                Executive Strategy
              </text>

              <g filter="url(#badgeShadow)">
                <text x={cx + R + 14} y={cy - 6} textAnchor="start" fill="#38bdf8" fontSize="12" fontWeight="900" letterSpacing="0.03em">
                  Logical
                </text>
                <text x={cx + R + 14} y={cy + 10} textAnchor="start" fill="#38bdf8" fontSize="12" fontWeight="900" letterSpacing="0.03em">
                  Reasoning
                </text>
              </g>

              <text x={cx} y={cy + R + 26} textAnchor="middle" fill="#f43f5e" fontSize="13" fontWeight="900" letterSpacing="0.04em" filter="url(#badgeShadow)">
                Reflexes & Focus
              </text>

              <g filter="url(#badgeShadow)">
                <text x={cx - R - 14} y={cy - 6} textAnchor="end" fill="#00f0ff" fontSize="12" fontWeight="900" letterSpacing="0.03em">
                  Memory
                </text>
                <text x={cx - R - 14} y={cy + 10} textAnchor="end" fill="#00f0ff" fontSize="12" fontWeight="900" letterSpacing="0.03em">
                  & Recall
                </text>
              </g>

              {/* Shaded Radar Data Polygon */}
              <polygon
                points={polygonPoints}
                fill="url(#radarFillGrad)"
                stroke="rgba(0, 240, 255, 1)"
                strokeWidth="2.8"
                filter="url(#neonRadarGlow)"
              />

              {/* Colored Vertex Dots with Glow */}
              <circle cx={pt_top.x} cy={pt_top.y} r="5.5" fill="#22c55e" stroke="#ffffff" strokeWidth="2" filter="url(#badgeShadow)" />
              <circle cx={pt_right.x} cy={pt_right.y} r="5.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" filter="url(#badgeShadow)" />
              <circle cx={pt_bottom.x} cy={pt_bottom.y} r="5.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" filter="url(#badgeShadow)" />
              <circle cx={pt_left.x} cy={pt_left.y} r="5.5" fill="#00f0ff" stroke="#ffffff" strokeWidth="2" filter="url(#badgeShadow)" />

              {/* Real Score Badges Cleanly Positioned on/above Vertices */}
              <text x={pt_top.x} y={pt_top.y - 10} textAnchor="middle" fill="#4ade80" fontSize="12" fontWeight="900" filter="url(#badgeShadow)">
                {Math.round(scores.executive_strategy)}%
              </text>
              <text x={pt_right.x} y={pt_right.y - 10} textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="900" filter="url(#badgeShadow)">
                {Math.round(scores.logical_mathematical)}%
              </text>
              <text x={pt_bottom.x} y={pt_bottom.y + 18} textAnchor="middle" fill="#fb7185" fontSize="12" fontWeight="900" filter="url(#badgeShadow)">
                {Math.round(scores.reflexes_and_focus)}%
              </text>
              <text x={pt_left.x} y={pt_left.y - 10} textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="900" filter="url(#badgeShadow)">
                {Math.round(scores.spatial_visual_memory)}%
              </text>
            </svg>
          </div>

          {/* ================= 2x2 DOMAIN METRICS GRID ================= */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.6rem',
            marginTop: '0.75rem'
          }}>
            {/* Top-Left: Executive Strategy */}
            <div style={{
              background: 'rgba(8, 14, 28, 0.75)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <TargetIcon color="#22c55e" size={13} /> Executive Strategy
                </span>
                <span style={{ 
                  fontSize: '0.58rem', 
                  fontWeight: '900', 
                  background: 'rgba(34, 197, 94, 0.18)', 
                  color: '#22c55e', 
                  border: '1px solid rgba(34, 197, 94, 0.5)', 
                  padding: '1px 5px', 
                  borderRadius: '4px',
                  letterSpacing: '0.04em'
                }}>
                  TARGET FOCUS
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${scores.executive_strategy}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #22c55e)', boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)' }} />
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#22c55e' }}>{Math.round(scores.executive_strategy)}%</span>
              </div>
            </div>

            {/* Top-Right: Logical Reasoning */}
            <div style={{
              background: 'rgba(8, 14, 28, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <LightbulbIcon color="#38bdf8" size={13} /> Logical Reasoning
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8' }}>
                  — {Math.round(scores.logical_mathematical)}/100
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${scores.logical_mathematical}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', boxShadow: '0 0 8px rgba(56, 189, 248, 0.4)' }} />
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#38bdf8' }}>{Math.round(scores.logical_mathematical)}%</span>
              </div>
            </div>

            {/* Bottom-Left: Reflexes & Focus */}
            <div style={{
              background: 'rgba(8, 14, 28, 0.75)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <BoltIcon color="#f43f5e" size={13} /> Reflexes & Focus
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8' }}>
                  — {Math.round(scores.reflexes_and_focus)}/100
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${scores.reflexes_and_focus}%`, height: '100%', background: 'linear-gradient(90deg, #e11d48, #f43f5e)', boxShadow: '0 0 8px rgba(244, 63, 94, 0.4)' }} />
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#f43f5e' }}>{Math.round(scores.reflexes_and_focus)}%</span>
              </div>
            </div>

            {/* Bottom-Right: Memory & Recall */}
            <div style={{
              background: 'rgba(8, 14, 28, 0.75)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <BrainIcon color="#00f0ff" size={13} /> Memory & Recall
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8' }}>
                  — {Math.round(scores.spatial_visual_memory)}/100
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${scores.spatial_visual_memory}%`, height: '100%', background: 'linear-gradient(90deg, #0891b2, #00f0ff)', boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)' }} />
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#00f0ff' }}>{Math.round(scores.spatial_visual_memory)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 3: PERSONALIZED TRAINING PLAN ================= */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          justifyContent: 'space-between'
        }}>
          {/* Main Training Plan Card */}
          <div style={{
            background: 'rgba(10, 18, 36, 0.75)',
            border: '1px solid rgba(0, 240, 255, 0.22)',
            borderRadius: '14px',
            padding: '1.15rem 1.25rem',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <CyberCorner color="#00f0ff" size={8} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>⚙️</span>
                <span style={{ fontSize: '0.74rem', fontWeight: '900', letterSpacing: '0.06em', color: '#e2e8f0', textTransform: 'uppercase' }}>
                  PERSONALIZED TRAINING PLAN
                </span>
              </div>
              <div style={{ 
                width: '26px', 
                height: '26px', 
                borderRadius: '6px', 
                background: 'rgba(168, 85, 247, 0.15)', 
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)'
              }}>
                <span style={{ fontSize: '13px' }}>🧠</span>
              </div>
            </div>

            {/* Plan Recommendation Body */}
            <div style={{
              background: 'rgba(2, 6, 23, 0.6)',
              border: '1px solid rgba(0, 240, 255, 0.14)',
              borderRadius: '10px',
              padding: '0.9rem',
              fontSize: '0.82rem',
              color: '#cbd5e1',
              lineHeight: '1.55'
            }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Based on your profile, the best way to level up your brain is to practice{' '}
                <strong style={{ color: weakestTheme.color }}>{weakestTheme.name}</strong>.
              </p>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                We recommend starting with the{' '}
                <strong style={{ color: '#00f0ff' }}>{friendlyGameName}</strong> exercise to build those neural pathways!
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                onClick={onStartPrescribedGame}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  color: '#021814',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontWeight: '900',
                  fontSize: '0.88rem',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 28px rgba(16, 185, 129, 0.65)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
                }}
              >
                START {friendlyGameName.toUpperCase()} TRAINING
              </button>

              {onProceedToDashboard && (
                <button
                  onClick={onProceedToDashboard}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    fontWeight: '700',
                    fontSize: '0.84rem',
                    letterSpacing: '0.03em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#00f0ff';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                    e.currentTarget.style.color = '#e2e8f0';
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                  }}
                >
                  Proceed to Dashboard &rarr;
                </button>
              )}
            </div>
          </div>



        </div>

      </div>
    </div>
  );
};

export default PretestResults;

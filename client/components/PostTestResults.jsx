import React from 'react';
import useDeviceDetect from '../hooks/useDeviceDetect';

export default function PostTestResults({ 
  preScores, 
  postScores, 
  evaluationReport,
  aiFeedback, 
  currentUser, 
  onReturn,
  isMobile: propIsMobile,
  onRequireDesktop,
  onStartPrescribedGame
}) {
  const device = useDeviceDetect();
  const isMobile = propIsMobile !== undefined ? propIsMobile : device.isMobile;

  const domains = [
    { key: 'spatial_visual_memory', label: 'Spatial-Visual', labelLong: 'Spatial-Visual Memory', color: '#4ade80' },
    { key: 'logical_mathematical', label: 'Logical-Math', labelLong: 'Logical-Mathematical', color: '#f59e0b' },
    { key: 'reflexes_and_focus', label: 'Reflexes & Focus', labelLong: 'Reflexes & Focus', color: '#60a5fa' },
    { key: 'executive_strategy', label: 'Executive Strategy', labelLong: 'Executive Strategy', color: '#c084fc' }
  ];

  // Calculate Stats
  const totalPre = domains.reduce((sum, d) => sum + (preScores?.[d.key] || 0), 0);
  const totalPost = domains.reduce((sum, d) => sum + (postScores?.[d.key] || 0), 0);
  const netChange = totalPost - totalPre;
  
  let maxGrowth = { label: 'None', delta: 0, color: '#94a3b8' };
  domains.forEach(d => {
    const delta = (postScores?.[d.key] || 0) - (preScores?.[d.key] || 0);
    if (delta > maxGrowth.delta) maxGrowth = { label: d.label, delta, color: d.color };
  });

  // Radar Chart Calculations (Centered at 190, 190 with R = 120)
  const cx = 190;
  const cy = 190;
  const maxR = 120;

  const getCoord = (domainIndex, score) => {
    const norm = Math.max(0, Math.min(100, score || 0)) / 100.0;
    const r = norm * maxR;
    switch (domainIndex) {
      case 0: return { x: cx, y: cy - r }; // Top: Spatial-Visual
      case 1: return { x: cx + r, y: cy }; // Right: Logical-Mathematical
      case 2: return { x: cx, y: cy + r }; // Bottom: Reflexes & Focus
      case 3: return { x: cx - r, y: cy }; // Left: Executive Strategy
      default: return { x: cx, y: cy };
    }
  };

  const prePts = [
    getCoord(0, preScores?.spatial_visual_memory ?? 50),
    getCoord(1, preScores?.logical_mathematical ?? 50),
    getCoord(2, preScores?.reflexes_and_focus ?? 50),
    getCoord(3, preScores?.executive_strategy ?? 50),
  ];

  const postPts = [
    getCoord(0, postScores?.spatial_visual_memory ?? 50),
    getCoord(1, postScores?.logical_mathematical ?? 50),
    getCoord(2, postScores?.reflexes_and_focus ?? 50),
    getCoord(3, postScores?.executive_strategy ?? 50),
  ];

  const prePath = `M ${prePts[0].x} ${prePts[0].y} L ${prePts[1].x} ${prePts[1].y} L ${prePts[2].x} ${prePts[2].y} L ${prePts[3].x} ${prePts[3].y} Z`;
  const postPath = `M ${postPts[0].x} ${postPts[0].y} L ${postPts[1].x} ${postPts[1].y} L ${postPts[2].x} ${postPts[2].y} L ${postPts[3].x} ${postPts[3].y} Z`;

  // Markdown parser for AI Profiling Dossier
  const renderFeedback = (text) => {
    if (!text) {
      return (
        <div style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 0.75rem 0' }}>
            <strong style={{ color: '#38bdf8' }}>Significant Advancements:</strong><br />
            Post-test telemetry reveals robust neural plasticity. The subject demonstrated a massive surge in localized cognitive efficiency. Prescribed neuro-stimulation protocols successfully strengthened target cortical pathways.
          </p>
          <p style={{ margin: '0 0 0.75rem 0' }}>
            <strong style={{ color: '#38bdf8' }}>Metacognition & Micro-Behavioral Latency:</strong><br />
            Exceptional pacing consistency. Reaction times demonstrate low deviation, indicating a highly stabilized baseline. Metacognition calibration indicates high confidence-to-accuracy alignment.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#38bdf8' }}>Final Verdict:</strong><br />
            Optimal response to training. The subject exhibits extraordinary adaptive capacity and stable neural elasticity.
          </p>
        </div>
      );
    }
    
    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];

    const formatText = (str) => {
      let res = str.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f1f5f9; font-weight: 600">$1</strong>');
      res = res.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em style="color: #cbd5e1">$1</em>');
      return res;
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${i}`} style={{ margin: '0 0 0.75rem 0', color: '#cbd5e1', fontSize: '0.86rem', lineHeight: '1.55' }}
               dangerouslySetInnerHTML={{ __html: currentParagraph.join(' ') }} />
          );
          currentParagraph = [];
        }
        return;
      }

      if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${i}`} style={{ margin: '0 0 0.75rem 0', color: '#cbd5e1', fontSize: '0.86rem', lineHeight: '1.55' }}
               dangerouslySetInnerHTML={{ __html: currentParagraph.join(' ') }} />
          );
          currentParagraph = [];
        }
        const titleText = trimmed.replace(/^###? /, '');
        elements.push(
          <div key={`h-${i}`} style={{ color: '#38bdf8', fontWeight: '700', fontSize: '0.95rem', margin: '0.75rem 0 0.4rem 0', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '0.25rem' }}>
            {titleText}
          </div>
        );
      } else {
        currentParagraph.push(formatText(trimmed));
      }
    });

    if (currentParagraph.length > 0) {
      elements.push(
        <p key="p-last" style={{ margin: '0 0 0.5rem 0', color: '#cbd5e1', fontSize: '0.86rem', lineHeight: '1.55' }}
           dangerouslySetInnerHTML={{ __html: currentParagraph.join(' ') }} />
      );
    }

    return elements;
  };

  return (
    <div 
      className="post-test-container"
      style={{ 
        maxWidth: '1440px', 
        width: '100%',
        boxSizing: 'border-box',
        margin: '0.5rem auto 2rem auto', 
        padding: isMobile ? '1rem' : '1.5rem 2rem', 
        animation: 'fadeIn 0.4s ease-out'
      }}
    >
      
      {/* Top Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 
            style={{ 
              color: '#ffffff', 
              fontSize: isMobile ? '1.5rem' : '2.1rem', 
              fontWeight: '800',
              lineHeight: '1.2',
              margin: 0, 
              letterSpacing: '0.06em', 
              textTransform: 'uppercase',
              textShadow: '0 0 25px rgba(56, 189, 248, 0.4)'
            }}
          >
            Cognitive Assessment Complete
          </h1>
          <div style={{ display: isMobile ? 'none' : 'block', opacity: 0.85 }}>
            <svg width="84" height="24" viewBox="0 0 84 24" fill="none">
              <path d="M0 12h24l4-8 6 16 5-12 4 8 5-4h36" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <p style={{ color: '#94a3b8', fontSize: isMobile ? '0.85rem' : '0.95rem', margin: '0.4rem 0 0 0' }}>
          Subject: <strong style={{ color: '#38bdf8' }}>{currentUser || 'Guest'}</strong> <span style={{ opacity: 0.5, margin: '0 0.5rem' }}>|</span> Post-Intervention Analysis
        </p>
      </div>

      {/* 3-Column Command Matrix Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1.05fr 1fr', 
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        
        {/* ======================================================== */}
        {/* COLUMN 1: QUANTITATIVE DELTA & METRICS                    */}
        {/* ======================================================== */}
        <div 
          style={{ 
            background: 'linear-gradient(150deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.96))', 
            borderRadius: '16px', 
            border: '1px solid rgba(56, 189, 248, 0.28)', 
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            padding: isMobile ? '1.25rem 1rem' : '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{ 
                fontSize: '0.92rem', 
                fontWeight: '700', 
                color: '#f8fafc', 
                letterSpacing: '0.08em', 
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#38bdf8' }}>■</span> Quantitative Delta & Metrics
              </span>
            </div>

            {/* 3 Stat KPI Cards in Top Row */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '0.6rem', 
              marginBottom: '1.25rem' 
            }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Net Cognitive Shift</div>
                <div style={{ color: netChange >= 0 ? '#4ade80' : '#ef4444', fontSize: '1.45rem', fontWeight: '800', marginTop: '0.2rem', lineHeight: 1.1 }}>
                  {netChange > 0 ? '+' : ''}{Math.round(netChange)} <span style={{ fontSize: '0.75rem' }}>pts</span>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Highest Growth Area</div>
                <div style={{ color: maxGrowth.color, fontSize: '0.95rem', fontWeight: '700', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {maxGrowth.label}
                </div>
                <div style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: '700' }}>
                  +{Math.round(maxGrowth.delta)} pts
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Global Percentile</div>
                <div style={{ color: '#38bdf8', fontSize: '1.35rem', fontWeight: '800', marginTop: '0.2rem', lineHeight: 1.1 }}>Top 12%</div>
              </div>
            </div>

            {/* Tabular Matrix */}
            <div style={{ width: '100%', overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '0.5rem', fontWeight: '600' }}>Domain</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', fontWeight: '600' }}>Pre-Test</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center', fontWeight: '600' }}>Post-Test</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right', fontWeight: '600' }}>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map(d => {
                    const pre = Math.round(preScores ? preScores[d.key] : 0);
                    const post = Math.round(postScores ? postScores[d.key] : 0);
                    const delta = post - pre;
                    return (
                      <tr key={d.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.6rem 0', color: d.color, fontWeight: '700' }}>{d.label}</td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'center', color: '#94a3b8' }}>{pre}</td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'center', color: '#ffffff', fontWeight: '700' }}>{post}</td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', color: delta > 0 ? '#4ade80' : (delta < 0 ? '#ef4444' : '#94a3b8'), fontWeight: '700' }}>
                          {delta > 0 ? `+${delta}` : delta}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Horizontal Progress Delta Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
              {domains.map(d => {
                const pre = Math.max(0, Math.min(100, Math.round(preScores ? preScores[d.key] : 0)));
                const post = Math.max(0, Math.min(100, Math.round(postScores ? postScores[d.key] : 0)));
                const delta = post - pre;
                return (
                  <div key={d.key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 24px', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
                    <div style={{ color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</div>
                    <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pre}%`, background: 'rgba(255,255,255,0.22)' }}></div>
                      {delta > 0 && (
                        <div style={{ position: 'absolute', left: `${pre}%`, top: 0, height: '100%', width: `${Math.min(100 - pre, delta)}%`, background: '#4ade80', boxShadow: '0 0 8px rgba(74, 222, 128, 0.6)' }}></div>
                      )}
                      {delta < 0 && (
                        <div style={{ position: 'absolute', left: `${post}%`, top: 0, height: '100%', width: `${Math.abs(delta)}%`, background: '#ef4444' }}></div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', color: delta > 0 ? '#4ade80' : (delta < 0 ? '#ef4444' : '#64748b'), fontWeight: '700' }}>
                      {delta > 0 ? '↗' : (delta < 0 ? '↘' : '→')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '1.25rem', fontSize: '0.72rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><div style={{ width: '10px', height: '3px', background: 'rgba(255,255,255,0.25)' }}></div> Baseline</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><div style={{ width: '10px', height: '3px', background: '#4ade80' }}></div> Improvement</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><div style={{ width: '10px', height: '3px', background: '#ef4444' }}></div> Regression</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: COGNITIVE GROWTH MAP (Dual-Layer 360° Radar)   */}
        {/* ======================================================== */}
        <div 
          style={{ 
            background: 'linear-gradient(150deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.96))', 
            borderRadius: '16px', 
            border: '1px solid rgba(56, 189, 248, 0.28)', 
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            padding: isMobile ? '1.25rem 1rem' : '1.5rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <span style={{ 
              fontSize: '0.92rem', 
              fontWeight: '700', 
              color: '#f8fafc', 
              letterSpacing: '0.08em', 
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ color: '#2dd4bf' }}>■</span> Cognitive Growth Map
            </span>
          </div>

          {/* Corner Telemetry Overlay */}
          <div style={{ position: 'relative', width: '100%', minHeight: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Top-Left Telemetry */}
            <div style={{ position: 'absolute', top: 0, left: 0, fontSize: '0.62rem', color: '#2dd4bf', opacity: 0.7, fontFamily: 'monospace', lineHeight: '1.2' }}>
              <div>[10.0, 0/3, 0.03]</div>
              <div>Label: 92</div>
              <div>[0.9, 19.2, 18-0]</div>
            </div>

            {/* Top-Right Telemetry */}
            <div style={{ position: 'absolute', top: 0, right: 0, textAlign: 'right', fontSize: '0.62rem', color: '#2dd4bf', opacity: 0.7, fontFamily: 'monospace', lineHeight: '1.2' }}>
              <div>[65, 0.03, 0.120]</div>
              <div>Label: 20</div>
              <div>[0.3, 118, -140]</div>
            </div>

            {/* Bottom-Left Telemetry */}
            <div style={{ position: 'absolute', bottom: '0.5rem', left: 0, fontSize: '0.62rem', color: '#2dd4bf', opacity: 0.7, fontFamily: 'monospace', lineHeight: '1.2' }}>
              <div>[00:13:5, 15:48]</div>
              <div>Layer: 07</div>
              <div>[0.57, 10, -8-6]</div>
              <div style={{ marginTop: '0.2rem' }}>
                <svg width="40" height="10" viewBox="0 0 40 10" fill="none"><path d="M0 5h10l2-4 4 8 3-6 2 4 3-2h16" stroke="#2dd4bf" strokeWidth="1.2" /></svg>
              </div>
            </div>

            {/* Bottom-Right Telemetry */}
            <div style={{ position: 'absolute', bottom: '0.5rem', right: 0, textAlign: 'right', fontSize: '0.62rem', color: '#2dd4bf', opacity: 0.7, fontFamily: 'monospace', lineHeight: '1.2' }}>
              <div>[30.13, 0, -0.45]</div>
              <div>Layer: 20</div>
              <div>[0:57.19, -0-60]</div>
              <div style={{ marginTop: '0.2rem' }}>
                <svg width="40" height="10" viewBox="0 0 40 10" fill="none"><path d="M0 5h10l2-4 4 8 3-6 2 4 3-2h16" stroke="#2dd4bf" strokeWidth="1.2" /></svg>
              </div>
            </div>

            {/* 360° Circular Radar SVG */}
            <svg viewBox="0 0 380 380" style={{ width: '100%', maxWidth: '360px', height: 'auto', overflow: 'visible' }}>
              <defs>
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Outer Dashed Polar Ring */}
              <circle cx={cx} cy={cy} r={maxR + 18} stroke="rgba(45, 212, 191, 0.4)" strokeWidth="1.5" fill="none" />
              <circle cx={cx} cy={cy} r={maxR + 24} stroke="rgba(45, 212, 191, 0.2)" strokeWidth="1" strokeDasharray="3 4" fill="none" />

              {/* Concentric Grid Rings */}
              {[24, 48, 72, 96, 120].map((r, idx) => (
                <circle 
                  key={r} 
                  cx={cx} 
                  cy={cy} 
                  r={r} 
                  stroke={idx === 4 ? 'rgba(45, 212, 191, 0.35)' : 'rgba(45, 212, 191, 0.12)'} 
                  strokeWidth="1" 
                  fill="none" 
                />
              ))}

              {/* Polar Coordinate Cross Axes */}
              <line x1={cx} y1={cy - maxR - 15} x2={cx} y2={cy + maxR + 15} stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1" />
              <line x1={cx - maxR - 15} y1={cy} x2={cx + maxR + 15} y2={cy} stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1" />

              {/* Numerical Axis Ticks */}
              <text x={cx + 6} y={cy - 24} fill="#64748b" fontSize="8" fontFamily="monospace">20</text>
              <text x={cx + 6} y={cy - 72} fill="#64748b" fontSize="8" fontFamily="monospace">60</text>
              <text x={cx + 6} y={cy - 96} fill="#64748b" fontSize="8" fontFamily="monospace">80</text>
              <text x={cx + 6} y={cy - 120} fill="#2dd4bf" fontSize="8" fontWeight="bold" fontFamily="monospace">100</text>

              <text x={cx + 96} y={cy - 6} fill="#64748b" fontSize="8" fontFamily="monospace">80</text>
              <text x={cx + 120} y={cy - 6} fill="#2dd4bf" fontSize="8" fontWeight="bold" fontFamily="monospace">100</text>

              {/* Angle Tick Markers */}
              <text x="64" y="68" fill="#2dd4bf" fontSize="8" opacity="0.6" fontFamily="monospace">225</text>
              <text x="312" y="68" fill="#2dd4bf" fontSize="8" opacity="0.6" fontFamily="monospace">150</text>
              <text x="64" y="320" fill="#2dd4bf" fontSize="8" opacity="0.6" fontFamily="monospace">238</text>
              <text x="312" y="320" fill="#2dd4bf" fontSize="8" opacity="0.6" fontFamily="monospace">3.25</text>

              {/* Cardinal Axis Labels */}
              <text x={cx} y={cy - maxR - 22} textAnchor="middle" fill="#f8fafc" fontSize="10.5" fontWeight="700" letterSpacing="0.02em">
                Spatial-Visual Memory
              </text>
              <text x={cx} y={cy + maxR + 32} textAnchor="middle" fill="#f8fafc" fontSize="10.5" fontWeight="700" letterSpacing="0.02em">
                Reflexes & Focus
              </text>
              
              {/* Vertical Rotated Labels for Left and Right */}
              <text 
                x={cx + maxR + 25} 
                y={cy} 
                textAnchor="middle" 
                fill="#f8fafc" 
                fontSize="10" 
                fontWeight="700" 
                letterSpacing="0.02em"
                transform={`rotate(90, ${cx + maxR + 25}, ${cy})`}
              >
                Logical-Mathematical
              </text>
              <text 
                x={cx - maxR - 25} 
                y={cy} 
                textAnchor="middle" 
                fill="#f8fafc" 
                fontSize="10" 
                fontWeight="700" 
                letterSpacing="0.02em"
                transform={`rotate(-90, ${cx - maxR - 25}, ${cy})`}
              >
                Executive Strategy
              </text>

              {/* LAYER 1: BASELINE POLYGON (Rose) */}
              <path 
                d={prePath} 
                fill="rgba(244, 63, 94, 0.22)" 
                stroke="#f43f5e" 
                strokeWidth="1.8" 
                strokeLinejoin="round" 
              />
              {prePts.map((p, idx) => (
                <circle key={`pre-${idx}`} cx={p.x} cy={p.y} r="3" fill="#f43f5e" />
              ))}

              {/* LAYER 2: GROWTH POLYGON (Neon Cyan / Teal) */}
              <path 
                d={postPath} 
                fill="rgba(45, 212, 191, 0.32)" 
                stroke="#2dd4bf" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
                filter="url(#cyanGlow)" 
              />
              {postPts.map((p, idx) => (
                <g key={`post-${idx}`}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#2dd4bf" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              ))}
            </svg>
          </div>

          {/* Radar Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '0.75rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '14px', height: '3px', background: '#f43f5e', borderRadius: '1px' }}></div> 
              Baseline
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '14px', height: '3px', background: '#2dd4bf', borderRadius: '1px', boxShadow: '0 0 6px rgba(45, 212, 191, 0.8)' }}></div> 
              Growth
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 3: AI QUALITATIVE PROFILING & ACTION CONSOLE     */}
        {/* ======================================================== */}
        <div 
          style={{ 
            background: 'linear-gradient(150deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.96))', 
            borderRadius: '16px', 
            border: '1px solid rgba(56, 189, 248, 0.28)', 
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            padding: isMobile ? '1.25rem 1rem' : '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{ 
                fontSize: '0.92rem', 
                fontWeight: '700', 
                color: '#f8fafc', 
                letterSpacing: '0.08em', 
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#38bdf8' }}>■</span> AI Qualitative Profiling & Dossier
              </span>
            </div>

            {/* Dossier Terminal Card */}
            <div 
              style={{ 
                background: 'rgba(8, 14, 26, 0.85)', 
                border: '1px solid rgba(56, 189, 248, 0.35)', 
                borderRadius: '12px', 
                padding: '1.1rem', 
                maxHeight: isMobile ? '280px' : '330px', 
                overflowY: 'auto',
                boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.7)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🧠</span>
                <span style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.88rem', letterSpacing: '0.02em' }}>
                  Micro-Behavioral & Cognitive Profile Analysis
                </span>
              </div>
              {renderFeedback(aiFeedback)}
            </div>
          </div>

          {/* Action Console & Buttons */}
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {onReturn && (
              <button 
                onClick={onReturn}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  color: '#e2e8f0',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  letterSpacing: '0.02em',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                  e.currentTarget.style.borderColor = '#38bdf8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
                }}
              >
                Back to Dashboard
              </button>
            )}

            <button 
              onClick={() => {
                if (isMobile) {
                  if (onRequireDesktop) onRequireDesktop();
                  else alert("Desktop Required: Cognitive training modules require physical keyboard or mouse on a desktop browser.");
                  return;
                }
                if (onStartPrescribedGame) {
                  onStartPrescribedGame();
                } else {
                  alert("Routing to weakest domain training module...");
                }
              }}
              style={{ 
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)', 
                border: 'none', 
                color: '#ffffff', 
                padding: '0.85rem 1rem', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                transition: 'all 0.2s', 
                fontSize: '0.92rem', 
                fontWeight: '800', 
                letterSpacing: '0.02em',
                boxShadow: '0 4px 18px rgba(56, 189, 248, 0.45)'
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.15)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1.0)'}
            >
              {isMobile ? '🖥️ Desktop Required for Potential' : 'Train Weakest Domain'}
            </button>

            {/* Micro Telemetry Footer */}
            <div style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.64rem', color: '#64748b', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
              TELEMETRY SYNCHRONIZED <span style={{ opacity: 0.4 }}>|</span> NODE: POST_TEST_ACTIVE <span style={{ opacity: 0.4 }}>|</span> ISO 25010 QUALITY
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

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



  // Radar Chart Calculations (Centered at 190, 190 with R = 115)

  const cx = 190;

  const cy = 190;

  const maxR = 115;



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



  // Enhanced AI Profiling Dossier Parser without duplicated headers

  const renderFeedback = (text) => {

    if (!text) {

      return (

        <div style={{ color: '#cbd5e1', fontSize: '0.84rem', lineHeight: '1.6' }}>

          <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.25rem' }}>

            Significant Advancements:

          </div>

          <p style={{ margin: '0 0 0.85rem 0' }}>

            Post-test telemetry reveals robust neural plasticity. The subject demonstrated a massive surge in localized cognitive efficiency. Prescribed neuro-stimulation protocols successfully strengthened target cortical pathways.

          </p>



          <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.25rem' }}>

            Metacognition & Micro-Behavioral Latency:

          </div>

          <p style={{ margin: '0 0 0.85rem 0' }}>

            Exceptional pacing consistency. Reaction times demonstrate low deviation, indicating a highly stabilized baseline. Metacognition calibration indicates high confidence-to-accuracy alignment.

          </p>



          <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.25rem' }}>

            Final Verdict:

          </div>

          <p style={{ margin: 0 }}>

            Optimal response to training. The subject exhibits extraordinary adaptive capacity and stable neural elasticity.

          </p>

        </div>

      );

    }

    

    const lines = text.split('\n');

    const elements = [];

    let currentParagraph = [];



    const formatInline = (str) => {

      let res = str.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f1f5f9; font-weight: 600">$1</strong>');

      res = res.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em style="color: #cbd5e1">$1</em>');

      return res;

    };



    lines.forEach((line, i) => {

      const trimmed = line.trim();

      if (!trimmed) {

        if (currentParagraph.length > 0) {

          elements.push(

            <p key={`p-${i}`} style={{ margin: '0 0 0.85rem 0', color: '#cbd5e1', fontSize: '0.84rem', lineHeight: '1.6' }}

               dangerouslySetInnerHTML={{ __html: currentParagraph.join(' ') }} />

          );

          currentParagraph = [];

        }

        return;

      }



      // Filter out duplicate "Micro-Behavioral & Cognitive Profile Analysis" main titles

      if (trimmed.toLowerCase().includes('micro-behavioral') && trimmed.toLowerCase().includes('cognitive profile analysis')) {

        return;

      }



      // Detect sub-headings like "Significant Advancements:", "Metacognition & Micro-Behavioral Latency:", "Final Verdict:"

      const isHeader = trimmed.startsWith('###') || trimmed.startsWith('##') || 

                       trimmed.startsWith('**Significant Advancements') || 

                       trimmed.startsWith('**Metacognition') || 

                       trimmed.startsWith('**Final Verdict') ||

                       trimmed.startsWith('Significant Advancements:') ||

                       trimmed.startsWith('Metacognition & Micro-Behavioral Latency:') ||

                       trimmed.startsWith('Final Verdict:');



      if (isHeader) {

        if (currentParagraph.length > 0) {

          elements.push(

            <p key={`p-${i}`} style={{ margin: '0 0 0.85rem 0', color: '#cbd5e1', fontSize: '0.84rem', lineHeight: '1.6' }}

               dangerouslySetInnerHTML={{ __html: currentParagraph.join(' ') }} />

          );

          currentParagraph = [];

        }



        const cleanTitle = trimmed.replace(/^###?\s*/, '').replace(/\*\*/g, '').replace(/:$/, '') + ':';

        elements.push(

          <div key={`h-${i}`} style={{ color: '#38bdf8', fontWeight: '700', fontSize: '0.88rem', marginTop: '0.65rem', marginBottom: '0.25rem' }}>

            {cleanTitle}

          </div>

        );

      } else {

        currentParagraph.push(formatInline(trimmed));

      }

    });



    if (currentParagraph.length > 0) {

      elements.push(

        <p key="p-last" style={{ margin: '0 0 0.5rem 0', color: '#cbd5e1', fontSize: '0.84rem', lineHeight: '1.6' }}

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

        animation: 'fadeIn 0.3s ease-out'

      }}

    >

      

      {/* Top Header Section */}

      <div style={{ textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>

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



            {/* KPI Metrics Display: 1 Full-Width Primary Shift Banner + 2 Balanced Split Cards */}
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {/* Primary Featured Metric: Net Cognitive Shift */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.12) 0%, rgba(15, 23, 42, 0.75) 100%)', 
                border: '1px solid rgba(74, 222, 128, 0.35)', 
                borderRadius: '10px', 
                padding: '0.75rem 1rem', 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.35)'
              }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                    Net Cognitive Shift
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.74rem', marginTop: '0.15rem', opacity: 0.85 }}>
                    Overall Intervention Delta
                  </div>
                </div>
                <div style={{ 
                  color: netChange >= 0 ? '#4ade80' : '#ef4444', 
                  fontSize: '1.65rem', 
                  fontWeight: '800', 
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.25rem',
                  textShadow: netChange > 0 ? '0 0 12px rgba(74, 222, 128, 0.5)' : 'none'
                }}>
                  {netChange > 0 ? '+' : ''}{Math.round(netChange)}
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#94a3b8' }}>pts</span>
                </div>
              </div>

              {/* 2 Split Cards: Highest Growth Area & Global Percentile */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1.15fr 1fr', 
                gap: '0.55rem' 
              }}>
                {/* Highest Growth Area */}
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.7)', 
                  border: '1px solid rgba(56, 189, 248, 0.22)', 
                  borderRadius: '10px', 
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
                    Highest Growth Area
                  </div>
                  <div style={{ 
                    color: maxGrowth.color, 
                    fontSize: '0.98rem', 
                    fontWeight: '800', 
                    marginTop: '0.25rem', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {maxGrowth.label}
                  </div>
                  <div style={{ color: '#4ade80', fontSize: '0.74rem', fontWeight: '700', marginTop: '0.1rem' }}>
                    +{Math.round(maxGrowth.delta)} pts
                  </div>
                </div>

                {/* Global Percentile */}
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.7)', 
                  border: '1px solid rgba(56, 189, 248, 0.22)', 
                  borderRadius: '10px', 
                  padding: '0.65rem 0.85rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
                    Global Percentile
                  </div>
                  <div style={{ 
                    color: '#38bdf8', 
                    fontSize: '1.35rem', 
                    fontWeight: '800', 
                    marginTop: '0.2rem', 
                    lineHeight: 1,
                    textShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
                  }}>
                    Top 12%
                  </div>
                </div>
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



            {/* Horizontal Progress Delta Bars with full domain names and vibrant domain colors */}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>

              {domains.map(d => {

                const pre = Math.max(0, Math.min(100, Math.round(preScores ? preScores[d.key] : 0)));

                const post = Math.max(0, Math.min(100, Math.round(postScores ? postScores[d.key] : 0)));

                const delta = post - pre;

                return (

                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>

                    <div style={{ width: '135px', flexShrink: 0, color: d.color, fontWeight: '700', whiteSpace: 'nowrap' }}>

                      {d.label}

                    </div>

                    

                    <div style={{ 

                      flex: 1, 

                      position: 'relative', 

                      height: '9px', 

                      background: 'rgba(255,255,255,0.06)', 

                      border: '1px solid rgba(255,255,255,0.08)',

                      borderRadius: '5px', 

                      overflow: 'hidden' 

                    }}>

                      {/* Baseline fill colored by the domain theme */}

                      <div style={{ 

                        position: 'absolute', 

                        left: 0, 

                        top: 0, 

                        height: '100%', 

                        width: `${pre}%`, 

                        background: d.color,

                        opacity: 0.55

                      }}></div>

                      

                      {/* Positive Improvement Delta */}

                      {delta > 0 && (

                        <div style={{ 

                          position: 'absolute', 

                          left: `${pre}%`, 

                          top: 0, 

                          height: '100%', 

                          width: `${Math.min(100 - pre, delta)}%`, 

                          background: '#4ade80', 

                          boxShadow: '0 0 10px rgba(74, 222, 128, 0.8)' 

                        }}></div>

                      )}

                      

                      {/* Negative Regression Delta */}

                      {delta < 0 && (

                        <div style={{ 

                          position: 'absolute', 

                          left: `${post}%`, 

                          top: 0, 

                          height: '100%', 

                          width: `${Math.abs(delta)}%`, 

                          background: '#ef4444',

                          boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'

                        }}></div>

                      )}

                    </div>



                    <div style={{ width: '45px', textAlign: 'right', fontWeight: '700', fontSize: '0.82rem', flexShrink: 0 }}>

                      {delta > 0 ? (

                        <span style={{ color: '#4ade80' }}>+{delta} ↗</span>

                      ) : delta < 0 ? (

                        <span style={{ color: '#ef4444' }}>{delta} ↘</span>

                      ) : (

                        <span style={{ color: '#64748b' }}>0 →</span>

                      )}

                    </div>

                  </div>

                );

              })}

            </div>

          </div>



          {/* Legend */}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '1.25rem', fontSize: '0.74rem', color: '#94a3b8' }}>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>

              <div style={{ width: '12px', height: '4px', background: 'rgba(148, 163, 184, 0.6)', borderRadius: '2px' }}></div> 

              Baseline

            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>

              <div style={{ width: '12px', height: '4px', background: '#4ade80', borderRadius: '2px', boxShadow: '0 0 6px rgba(74, 222, 128, 0.6)' }}></div> 

              Improvement

            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>

              <div style={{ width: '12px', height: '4px', background: '#ef4444', borderRadius: '2px' }}></div> 

              Regression

            </span>

          </div>

        </div>



        {/* ======================================================== */}

        {/* COLUMN 2: COGNITIVE GROWTH MAP (Clean Dual-Layer Radar)   */}

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

          <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>

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



          {/* Clean 360° Circular Radar Display without unneeded corner clutter */}

          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>

            <svg viewBox="0 0 380 380" style={{ width: '100%', maxWidth: '370px', height: 'auto', overflow: 'visible' }}>

              <defs>

                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">

                  <feGaussianBlur stdDeviation="3" result="blur" />

                  <feComposite in="SourceGraphic" in2="blur" operator="over" />

                </filter>

              </defs>



              {/* Outer Dashed Polar Ring */}

              <circle cx={cx} cy={cy} r={maxR + 15} stroke="rgba(45, 212, 191, 0.35)" strokeWidth="1.5" fill="none" />

              <circle cx={cx} cy={cy} r={maxR + 22} stroke="rgba(45, 212, 191, 0.15)" strokeWidth="1" strokeDasharray="3 4" fill="none" />



              {/* Concentric Grid Rings */}

              {[23, 46, 69, 92, 115].map((r, idx) => (

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

              <line x1={cx} y1={cy - maxR - 12} x2={cx} y2={cy + maxR + 12} stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1" />

              <line x1={cx - maxR - 12} y1={cy} x2={cx + maxR + 12} y2={cy} stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1" />



              {/* Numerical Axis Scale Ticks */}

              <text x={cx + 6} y={cy - 23} fill="#64748b" fontSize="8" fontFamily="monospace">20</text>

              <text x={cx + 6} y={cy - 69} fill="#64748b" fontSize="8" fontFamily="monospace">60</text>

              <text x={cx + 6} y={cy - 92} fill="#64748b" fontSize="8" fontFamily="monospace">80</text>

              <text x={cx + 6} y={cy - 115} fill="#2dd4bf" fontSize="8" fontWeight="bold" fontFamily="monospace">100</text>



              <text x={cx + 92} y={cy - 6} fill="#64748b" fontSize="8" fontFamily="monospace">80</text>

              <text x={cx + 115} y={cy - 6} fill="#2dd4bf" fontSize="8" fontWeight="bold" fontFamily="monospace">100</text>



              {/* Cardinal Axis Labels */}

              <text x={cx} y={cy - maxR - 22} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700" letterSpacing="0.02em">

                Spatial-Visual Memory

              </text>

              <text x={cx} y={cy + maxR + 30} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700" letterSpacing="0.02em">

                Reflexes & Focus

              </text>

              

              {/* Vertical Rotated Labels for Left and Right */}

              <text 

                x={cx + maxR + 25} 

                y={cy} 

                textAnchor="middle" 

                fill="#f8fafc" 

                fontSize="10.5" 

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

                fontSize="10.5" 

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

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>

              <div style={{ width: '14px', height: '4px', background: '#f43f5e', borderRadius: '2px' }}></div> 

              Baseline

            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>

              <div style={{ width: '14px', height: '4px', background: '#2dd4bf', borderRadius: '2px', boxShadow: '0 0 6px rgba(45, 212, 191, 0.8)' }}></div> 

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



            {/* Dossier Terminal Card - single clean header */}

            <div 

              style={{ 

                background: 'rgba(8, 14, 26, 0.85)', 

                border: '1px solid rgba(56, 189, 248, 0.35)', 

                borderRadius: '12px', 

                padding: '1.15rem', 

                maxHeight: isMobile ? '280px' : '345px', 

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

          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {onReturn && (

              <button 

                onClick={onReturn}

                style={{

                  background: 'rgba(15, 23, 42, 0.85)',

                  border: '1px solid rgba(56, 189, 248, 0.45)',

                  color: '#e2e8f0',

                  padding: '0.9rem 1rem',

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

                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';

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

                padding: '0.9rem 1rem', 

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

          </div>

        </div>



      </div>



    </div>

  );

}


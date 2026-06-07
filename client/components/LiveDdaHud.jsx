import React, { useState } from 'react';
import { audioDda } from '../utils/audioSynth';

export default function LiveDdaHud({ gameType = 'Game', ddaParameters, cognitiveProfile, liveMetrics = [], advisorLogs = [], isMuted = false, onToggleMute }) {
    const handleToggleMute = onToggleMute;

    // Determine archetype details
    const archetype = cognitiveProfile?.archetype || 'Plateauing';
    const confidence = cognitiveProfile?.confidence_score !== undefined ? Math.round(cognitiveProfile.confidence_score * 100) : 75;
    
    // Calculate real-time Cognitive Load state
    let cognitiveLoad = 'Optimal'; // 'Optimal', 'Moderate', 'High'
    let loadColor = '#4ade80'; // Flow 🟢
    let loadLabel = 'Flow Zone';
    let coachMessage = 'Maintain a steady rhythm to enter your flow zone.';

    if (liveMetrics && liveMetrics.length > 0) {
        const lastMetric = liveMetrics[liveMetrics.length - 1];
        const last3Metrics = liveMetrics.slice(-3);
        const avgAccuracy = last3Metrics.reduce((sum, m) => sum + m.accuracy, 0) / last3Metrics.length;

        const isHighFriction = lastMetric.spamClicks > 2 || avgAccuracy < 0.7;
        const isModerateFocus = !isHighFriction && avgAccuracy === 1.0 && (lastMetric.rt > 1500 || lastMetric.hesitation > 1200);

        if (isHighFriction) {
            cognitiveLoad = 'High';
            loadColor = '#f87171'; // Red 🔴
            loadLabel = 'Cognitive Friction';
        } else if (isModerateFocus) {
            cognitiveLoad = 'Moderate';
            loadColor = '#fbbf24'; // Orange/Yellow 🟡
            loadLabel = 'Methodical Focus';
        } else {
            cognitiveLoad = 'Optimal';
            loadColor = '#4ade80'; // Green 🟢
            loadLabel = 'Flow Zone';
        }

        // Coach message rules
        const last2Metrics = liveMetrics.slice(-2);
        const isPerfectStreak = last2Metrics.length >= 2 && last2Metrics.every(m => m.accuracy === 1.0);

        if (lastMetric.spamClicks > 2) {
            coachMessage = "Kinetic friction detected. Slow down your selections to focus on accuracy.";
        } else if (isPerfectStreak && lastMetric.rt <= 1500) {
            coachMessage = "Perfect streak! Try tapping targets faster to trigger the next challenge tier.";
        } else if (cognitiveLoad === 'Moderate') {
            coachMessage = "Response latency is steady. Scan the board carefully before choosing.";
        }
    }

    // OLS Slopes
    const accSlope = cognitiveProfile?.accuracy_slope || 0;
    const rtSlope = cognitiveProfile?.reaction_time_slope || 0;
    
    // Current difficulty level
    const diffLevel = ddaParameters?.difficulty_level || 1;
    
    // Format slopes
    const accSlopePercent = accSlope * 100;
    const accSlopeFormatted = (accSlopePercent > 0 ? '+' : '') + accSlopePercent.toFixed(1) + '%';
    const rtSlopeFormatted = (rtSlope > 0 ? '+' : '') + rtSlope.toFixed(0) + 'ms';
    
    const isAccImproving = accSlope > 0.001;
    const isAccDeclining = accSlope < -0.001;
    const isRtImproving = rtSlope < -1.0; // RT getting faster/decreasing is positive improvement
    const isRtWorsening = rtSlope > 1.0;  // RT getting slower is negative/fatigue

    // Game specific parameter mappings
    const renderActiveParameters = () => {
        if (!ddaParameters) return <p style={{color: '#94a3b8', fontSize: '0.85rem', margin: 0}}>Awaiting metrics...</p>;
        
        const params = { ...ddaParameters };
        delete params.difficulty_level; // already shown in gauge
        
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                {Object.entries(params).map(([key, val]) => {
                    const cleanKey = key.replace(/_/g, ' ').toUpperCase();
                    let formattedVal = String(val);
                    if (Array.isArray(val)) {
                        formattedVal = val.join(', ');
                    } else if (typeof val === 'boolean') {
                        formattedVal = val ? 'ON' : 'OFF';
                    } else if (typeof val === 'number') {
                        if (key.includes('time') || key.includes('delay') || key.includes('lifespan')) {
                            formattedVal = `${val}ms`;
                        } else if (key.includes('ratio') || key.includes('probability')) {
                            formattedVal = `${Math.round(val * 100)}%`;
                        }
                    }
                    return (
                        <div key={key} style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>{cleanKey}</span>
                            <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: '600', marginTop: '0.15rem' }}>{formattedVal}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            width: '320px',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
            padding: '1.5rem',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            alignSelf: 'stretch',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, background: 'linear-gradient(to right, #a855f7, #38bdf8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>DDA ENGINE HUD</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>GAME: {gameType.toUpperCase()}</span>
                        <button 
                            onClick={handleToggleMute}
                            title={isMuted ? "Unmute Synthesizer" : "Mute Synthesizer"}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                color: isMuted ? '#64748b' : '#38bdf8',
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: 0,
                                margin: 0,
                                transition: 'color 0.2s'
                            }}
                        >
                            {isMuted ? '🔇' : '🔊'}
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '9999px' }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#4ade80',
                        borderRadius: '50%',
                        boxShadow: '0 0 8px #4ade80',
                        display: 'inline-block'
                    }} />
                    <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 'bold', textTransform: 'uppercase' }}>Active</span>
                </div>
            </div>

            {/* Level Gauge */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>CHALLENGE LEVEL</span>
                    <span style={{ fontSize: '1.25rem', color: '#a855f7', fontWeight: '900' }}>Lvl {diffLevel} <span style={{fontSize: '0.8rem', color: '#64748b', fontWeight: '500'}}>/ 5</span></span>
                </div>
                <div style={{ display: 'flex', gap: '4px', width: '100%', height: '8px' }}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                        <div key={lvl} style={{
                            flex: 1,
                            borderRadius: '2px',
                            background: lvl <= diffLevel ? 'linear-gradient(to right, #a855f7, #c084fc)' : 'rgba(255, 255, 255, 0.05)',
                            boxShadow: lvl <= diffLevel ? '0 0 10px rgba(168, 85, 247, 0.4)' : 'none',
                            transition: 'all 0.3s ease'
                        }} />
                    ))}
                </div>
            </div>

            {/* Cognitive Load Indicator */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>COGNITIVE LOAD</span>
                    <span style={{ fontSize: '0.9rem', color: loadColor, fontWeight: 'bold', textShadow: `0 0 8px ${loadColor}40` }}>{loadLabel}</span>
                </div>
                
                {/* 3-segment visual bar */}
                <div style={{ display: 'flex', gap: '6px', width: '100%', height: '6px' }}>
                    <div style={{
                        flex: 1,
                        borderRadius: '3px',
                        backgroundColor: '#4ade80',
                        opacity: cognitiveLoad === 'Optimal' ? 1.0 : 0.2,
                        boxShadow: cognitiveLoad === 'Optimal' ? '0 0 10px rgba(74, 222, 128, 0.6)' : 'none',
                        transition: 'all 0.3s ease'
                    }} title="Flow Zone" />
                    <div style={{
                        flex: 1,
                        borderRadius: '3px',
                        backgroundColor: '#fbbf24',
                        opacity: cognitiveLoad === 'Moderate' ? 1.0 : 0.2,
                        boxShadow: cognitiveLoad === 'Moderate' ? '0 0 10px rgba(251, 191, 36, 0.6)' : 'none',
                        transition: 'all 0.3s ease'
                    }} title="Methodical Focus" />
                    <div style={{
                        flex: 1,
                        borderRadius: '3px',
                        backgroundColor: '#f87171',
                        opacity: cognitiveLoad === 'High' ? 1.0 : 0.2,
                        boxShadow: cognitiveLoad === 'High' ? '0 0 10px rgba(248, 113, 113, 0.6)' : 'none',
                        transition: 'all 0.3s ease'
                    }} title="Cognitive Friction" />
                </div>
            </div>

            {/* Focus Coach Chatbox */}
            <div style={{
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.15)',
                borderRadius: '12px',
                padding: '0.85rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
                <div style={{
                    fontSize: '1.5rem',
                    background: 'rgba(56, 189, 248, 0.1)',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid rgba(56, 189, 248, 0.2)'
                }}>
                    🤖
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold', letterSpacing: '0.03em' }}>FOCUS COACH</span>
                    <p style={{
                        fontSize: '0.8rem',
                        color: '#e2e8f0',
                        margin: 0,
                        lineHeight: '1.4',
                        fontStyle: 'italic'
                    }}>
                        "{coachMessage}"
                    </p>
                </div>
            </div>

            {/* Cognitive Profile */}
            <div style={{
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
                borderRadius: '12px',
                padding: '0.85rem',
                textAlign: 'center'
            }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>COGNITIVE ARCHETYPE</span>
                <span style={{
                    fontSize: '1.2rem',
                    fontWeight: '800',
                    color: archetype === 'Fast Learner' ? '#4ade80' : archetype === 'High Fatigue' ? '#f87171' : '#c084fc',
                    display: 'block',
                    textShadow: archetype === 'Fast Learner' ? '0 0 12px rgba(74, 222, 128, 0.3)' : archetype === 'High Fatigue' ? '0 0 12px rgba(248, 113, 113, 0.3)' : '0 0 12px rgba(192, 132, 252, 0.3)'
                }}>{archetype}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>CONFIDENCE: {confidence}%</span>
            </div>

            {/* Slopes */}
            <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>LONGITUDINAL PROGRESS SLOPES</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: '500' }}>Accuracy Slope</span>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color: isAccImproving ? '#4ade80' : isAccDeclining ? '#f87171' : '#e2e8f0'
                        }}>
                            {accSlopeFormatted} / session
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: '500' }}>Latency Slope</span>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color: isRtImproving ? '#4ade80' : isRtWorsening ? '#f87171' : '#e2e8f0'
                        }}>
                            {rtSlopeFormatted} / session
                        </span>
                    </div>
                </div>
            </div>

            {/* Active Variables */}
            <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>ACTIVE ENGINE VARIABLES</span>
                {renderActiveParameters()}
            </div>

            {/* Telemetry Feed */}
            {liveMetrics && liveMetrics.length > 0 && (
                <div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>ROUND TELEMETRY FEED</span>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        maxHeight: '110px',
                        overflowY: 'auto'
                    }}>
                        {liveMetrics.slice().reverse().map((m, index) => (
                            <div key={index} style={{
                                fontSize: '0.75rem',
                                color: '#94a3b8',
                                display: 'flex',
                                justifyContent: 'space-between',
                                borderBottom: index < liveMetrics.length - 1 ? '1px solid rgba(255, 255, 255, 0.02)' : 'none',
                                paddingBottom: '2px'
                            }}>
                                <span>Round {liveMetrics.length - index}</span>
                                <span style={{ color: '#e2e8f0' }}>Acc: {Math.round(m.accuracy * 100)}% | RT: {m.rt.toFixed(0)}ms</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DDA Advisor Log Feed */}
            {advisorLogs && advisorLogs.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>🧠 DDA ADVISOR LOGS</span>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        maxHeight: '120px',
                        overflowY: 'auto'
                    }}>
                        {advisorLogs.map((log) => (
                            <div key={log.id} style={{
                                fontSize: '0.75rem',
                                color: '#94a3b8',
                                display: 'flex',
                                flexDirection: 'column',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                paddingBottom: '4px',
                                gap: '2px',
                                textAlign: 'left'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a855f7', fontWeight: 'bold' }}>
                                    <span>Tuned @ {log.timestamp}</span>
                                </div>
                                <div style={{ color: '#4ade80', fontWeight: '600' }}>
                                    {log.changes.join(', ')}
                                </div>
                                <span style={{ color: '#cbd5e1', fontSize: '0.7rem', fontStyle: 'italic', lineHeight: '1.3' }}>{log.reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

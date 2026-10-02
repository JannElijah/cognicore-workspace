import React, { useState, memo } from 'react';
import { audioDda } from '../utils/audioSynth';

const LiveDdaHud = memo(function LiveDdaHud({ gameType = 'Game', ddaParameters, cognitiveProfile, liveMetrics = [], advisorLogs = [], isMuted = false, onToggleMute }) {
    const handleToggleMute = onToggleMute;
    const [showDevStats, setShowDevStats] = useState(false);

    // Determine archetype details
    const archetype = cognitiveProfile?.archetype || 'Steady Focus';
    const confidence = cognitiveProfile?.confidence_score !== undefined ? Math.round(cognitiveProfile.confidence_score * 100) : 75;
    
    // Calculate real-time Cognitive Load state
    let cognitiveLoad = 'Optimal'; // 'Optimal', 'Moderate', 'High'
    let loadColor = 'var(--color-success)'; // Green
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
            loadColor = 'var(--color-danger)'; // Red
            loadLabel = 'Cognitive Friction';
        } else if (isModerateFocus) {
            cognitiveLoad = 'Moderate';
            loadColor = '#fbbf24'; // Orange/Yellow
            loadLabel = 'Methodical Focus';
        } else {
            cognitiveLoad = 'Optimal';
            loadColor = 'var(--color-success)'; // Green
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
    const isRtImproving = rtSlope < -1.0; 
    const isRtWorsening = rtSlope > 1.0;

    // Game specific parameter mappings
    const renderActiveParameters = () => {
        if (!ddaParameters) return <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0}}>Awaiting metrics...</p>;
        
        const params = { ...ddaParameters };
        delete params.difficulty_level;
        
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
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{cleanKey}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600', marginTop: '0.15rem' }}>{formattedVal}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="telemetry-hud-container" style={{
            minWidth: '480px', maxWidth: '620px', flex: 1,
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
            padding: '1.5rem',
            color: 'var(--text-main)',
            fontFamily: 'var(--font-body)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            alignSelf: 'flex-start',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>DDA ENGINE HUD</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>GAME: {gameType.toUpperCase()}</span>
                        <button 
                            onClick={handleToggleMute}
                            aria-label={isMuted ? "Unmute Synthesizer" : "Mute Synthesizer"}
                            tabIndex={0}
                            title={isMuted ? "Unmute Synthesizer" : "Mute Synthesizer"}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                color: isMuted ? 'var(--text-muted)' : 'var(--color-primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: 0,
                                margin: 0,
                                transition: 'color 0.2s, transform 0.2s'
                            }}
                        >
                            {isMuted ? '🔇' : '🔊'}
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '9999px' }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: 'var(--color-success)',
                        borderRadius: '50%',
                        boxShadow: '0 0 8px var(--color-success)',
                        display: 'inline-block'
                    }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 'bold', textTransform: 'uppercase' }}>Active</span>
                </div>
            </div>

            {cognitiveProfile?.fatigue_warning && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}>
                    <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                    <div>
                        <div style={{ color: '#ef4444', marginBottom: '0.2rem' }}>High Fatigue Detected</div>
                        <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 'normal' }}>Your reaction times and inputs are degrading. Consider resting to maintain data quality.</div>
                    </div>
                </div>
            )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Level Gauge */}
                <div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>⚡ CHALLENGE LEVEL</span>
                        <span style={{ fontSize: '1.25rem', color: 'var(--color-secondary)', fontWeight: '900', fontFamily: 'var(--font-title)' }}>Lvl {diffLevel} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500'}}>/ 5</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', width: '100%', height: '8px' }}>
                        {[1, 2, 3, 4, 5].map((lvl) => (
                            <div key={lvl} style={{
                                flex: 1,
                                borderRadius: '999px',
                                background: lvl <= diffLevel ? 'linear-gradient(to right, var(--color-secondary), #a78bfa)' : 'rgba(255, 255, 255, 0.05)',
                                boxShadow: lvl <= diffLevel ? '0 0 10px rgba(139, 92, 246, 0.4)' : 'none',
                                transition: 'all 0.3s ease'
                            }} />
                        ))}
                    </div>
                </div>

                {/* Cognitive Load Indicator */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px', width: '100%', boxSizing: 'border-box',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    flex: 1
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>🧠 COGNITIVE LOAD</span>
                        <span style={{ fontSize: '0.9rem', color: loadColor, fontWeight: 'bold', textShadow: `0 0 8px ${loadColor}40` }}>{loadLabel}</span>
                    </div>
                    
                    {/* 3-segment visual bar */}
                    <div style={{ display: 'flex', gap: '6px', width: '100%', height: '6px' }}>
                        <div style={{
                            flex: 1,
                            borderRadius: '999px',
                            backgroundColor: 'var(--color-success)',
                            opacity: cognitiveLoad === 'Optimal' ? 1.0 : 0.2,
                            boxShadow: cognitiveLoad === 'Optimal' ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none',
                            transition: 'all 0.3s ease'
                        }} title="Flow Zone" />
                        <div style={{
                            flex: 1,
                            borderRadius: '999px',
                            backgroundColor: '#fbbf24',
                            opacity: cognitiveLoad === 'Moderate' ? 1.0 : 0.2,
                            boxShadow: cognitiveLoad === 'Moderate' ? '0 0 10px rgba(251, 191, 36, 0.6)' : 'none',
                            transition: 'all 0.3s ease'
                        }} title="Methodical Focus" />
                        <div style={{
                            flex: 1,
                            borderRadius: '999px',
                            backgroundColor: 'var(--color-danger)',
                            opacity: cognitiveLoad === 'High' ? 1.0 : 0.2,
                            boxShadow: cognitiveLoad === 'High' ? '0 0 10px rgba(239, 68, 68, 0.6)' : 'none',
                            transition: 'all 0.3s ease'
                        }} title="Cognitive Friction" />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Confidence Visualizer */}
                <div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>🎯 DECISION CONFIDENCE</span>
                        <span style={{ fontSize: '1.05rem', color: 'var(--color-primary)', fontWeight: '900', fontFamily: 'var(--font-title)' }}>{confidence}%</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', width: '100%', height: '8px', position: 'relative', overflow: 'hidden', borderRadius: '999px', background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, height: '100%',
                            width: `${confidence}%`,
                            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.5), var(--color-primary))',
                            transition: 'width 0.5s ease-out',
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
                        }} />
                    </div>
                </div>

                {/* Cognitive Profile */}
                <div style={{
                    background: 'rgba(139, 92, 246, 0.05)',
                    borderRadius: '12px', width: '100%', boxSizing: 'border-box',
                    padding: '0.85rem',
                    textAlign: 'center',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    flex: 1
                }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>✨ COGNITIVE ARCHETYPE</span>
                    <span style={{
                        fontSize: '1.2rem',
                        fontWeight: '800',
                        fontFamily: 'var(--font-title)',
                        color: archetype === 'Fast Learner' ? 'var(--color-success)' : archetype === 'High Fatigue' ? 'var(--color-danger)' : 'var(--color-secondary)',
                        display: 'block',
                        textShadow: archetype === 'Fast Learner' ? '0 0 12px rgba(16, 185, 129, 0.3)' : archetype === 'High Fatigue' ? '0 0 12px rgba(239, 68, 68, 0.3)' : '0 0 12px rgba(139, 92, 246, 0.3)'
                    }}>{archetype}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>CONFIDENCE: {confidence}%</span>
                </div>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
            {/* Focus Coach Chatbox */}
            <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '12px', width: '100%', boxSizing: 'border-box',
                padding: '0.85rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    fontSize: '1.5rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    🤖
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'bold', letterSpacing: '0.03em' }}>FOCUS COACH</span>
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        margin: 0,
                        lineHeight: '1.4',
                        fontStyle: 'italic'
                    }}>
                        "{coachMessage}"
                    </p>
                </div>
            </div>

            {/* Slopes */}
            <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>LONGITUDINAL PROGRESS SLOPES</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '500' }}>🎯 Accuracy Slope</span>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color: isAccImproving ? 'var(--color-success)' : isAccDeclining ? 'var(--color-danger)' : 'var(--text-main)'
                        }}>
                            {accSlopeFormatted} / session
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '500' }}>⏱️ Latency Slope</span>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color: isRtImproving ? 'var(--color-success)' : isRtWorsening ? 'var(--color-danger)' : 'var(--text-main)'
                        }}>
                            {rtSlopeFormatted} / session
                        </span>
                    </div>
                </div>
            </div>

        </div>

            {/* Developer Toggle */}
            <button 
                onClick={() => setShowDevStats(!showDevStats)}
                style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                    transition: 'all 0.2s'
                }}
            >
                <span>DEVELOPER TELEMETRY</span>
                <span>{showDevStats ? '▲' : '▼'}</span>
            </button>

            {/* Hidden Dev Stats */}
            {showDevStats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease-out' }}>
                    {/* Active Variables */}
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>ACTIVE ENGINE VARIABLES</span>
                        {renderActiveParameters()}
                    </div>

                    {/* Telemetry Feed */}
                    {liveMetrics && liveMetrics.length > 0 && (
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>ROUND TELEMETRY FEED</span>
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid var(--border-glass)',
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
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        borderBottom: index < liveMetrics.length - 1 ? '1px solid rgba(255, 255, 255, 0.02)' : 'none',
                                        paddingBottom: '2px'
                                    }}>
                                        <span>Round {liveMetrics.length - index}</span>
                                        <span style={{ color: 'var(--text-main)' }}>Acc: {Math.round(m.accuracy * 100)}% | RT: {m.rt.toFixed(0)}ms</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DDA Advisor Log Feed */}
                    {advisorLogs && advisorLogs.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>🧠 DDA ADVISOR LOGS</span>
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid var(--border-glass)',
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
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                        paddingBottom: '4px',
                                        gap: '2px',
                                        textAlign: 'left'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-secondary)', fontWeight: 'bold' }}>
                                            <span>Tuned @ {log.timestamp}</span>
                                        </div>
                                        <div style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                                            {log.changes.join(', ')}
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontStyle: 'italic', lineHeight: '1.3' }}>{log.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

export default LiveDdaHud;

import React from 'react';

export default function LiveDdaHud({ gameType = 'Game', ddaParameters, cognitiveProfile, liveMetrics = [] }) {
    // Determine archetype details
    const archetype = cognitiveProfile?.archetype || 'Plateauing';
    const confidence = cognitiveProfile?.confidence_score !== undefined ? Math.round(cognitiveProfile.confidence_score * 100) : 75;
    
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
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>GAME: {gameType.toUpperCase()}</span>
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
        </div>
    );
}

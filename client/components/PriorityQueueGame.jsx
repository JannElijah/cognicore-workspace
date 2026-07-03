import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PriorityQueueScene from '../games/PriorityQueueScene';
import PauseOverlay from './PauseOverlay';

export default function PriorityQueueGame({
    username = 'default_player',
    apiUrl   = API_BASE,
    onGameFinished
}) {
    const gameContainerRef  = useRef(null);
    const phaserInstanceRef = useRef(null);

    const [sessionId,        setSessionId]        = useState(null);
    const [ddaParameters,    setDdaParameters]    = useState(null);
    const [gameState,        setGameState]        = useState('IDLE');
    const [inputUsername,    setInputUsername]    = useState(username);
    const [finalStats,       setFinalStats]       = useState(null);
    const [cognitiveProfile, setCognitiveProfile] = useState(null);
    const [error,            setError]            = useState(null);
    const [isPaused,         setIsPaused]         = useState(false);

    const startTrainingSession = async () => {
        setGameState('LOADING');
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/api/start-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: inputUsername, game_type: 'PriorityQueue' })
            });
            if (!response.ok) throw new Error(`Server status: ${response.status}`);
            const data = await response.json();
            if (data.status === 'success') {
                setSessionId(data.session_id);
                setDdaParameters(data.dda_parameters);
                if (data.cognitive_profile) setCognitiveProfile(data.cognitive_profile);
                setGameState('PLAYING');
            } else {
                throw new Error(data.message || 'Unknown server error');
            }
        } catch (err) {
            setError('Could not connect to the training server. Ensure the Flask server is running.');
            setGameState('IDLE');
        }
    };

    useEffect(() => {
        if (gameState !== 'PLAYING' || !sessionId || !gameContainerRef.current) return;

        const config = {
            type: Phaser.AUTO,
            parent: gameContainerRef.current,
            backgroundColor: '#020209',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 800, height: 600
            },
            scene: [PriorityQueueScene]
        };

        const game = new Phaser.Game(config);
        phaserInstanceRef.current = game;
        window.phaserGame = game;

        game.scene.start('PriorityQueueScene', {
            sessionId, apiUrl, ddaParameters, cognitiveProfile,
            onGameOver: async (stats) => {
                setFinalStats(stats);
                let profileInfo = null;
                try {
                    const pr = await fetch(`${apiUrl}/api/dda`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_id: sessionId })
                    });
                    if (pr.ok) {
                        const pd = await pr.json();
                        if (pd.status === 'success' && pd.cognitive_profile) {
                            setCognitiveProfile(pd.cognitive_profile);
                            profileInfo = pd.cognitive_profile;
                        }
                    }
                } catch (e) { /* silent */ }
                setGameState('FINISHED');
                if (onGameFinished) onGameFinished({ ...stats, cognitiveProfile: profileInfo });
            }
        });

        return () => {
            if (phaserInstanceRef.current) {
                phaserInstanceRef.current.destroy(true);
                phaserInstanceRef.current = null;
                window.phaserGame = null;
            }
        };
    }, [gameState, sessionId]);

    // Pause handler
    useEffect(() => {
        if (phaserInstanceRef.current && gameState === 'PLAYING') {
            const game = phaserInstanceRef.current;
            if (isPaused) {
                game.scene.scenes.forEach(s => { if (s.scene.isActive()) { s.scene.pause(); s.time.paused = true; } });
            } else {
                game.scene.scenes.forEach(s => { if (s.scene.isPaused()) { s.scene.resume(); s.time.paused = false; } });
            }
        }
    }, [isPaused, gameState]);

    useEffect(() => {
        if (gameState !== 'PLAYING') { setIsPaused(false); return; }
        const handleKey = (e) => { if (e.key === 'p' || e.key === 'P') setIsPaused(prev => !prev); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState]);

    const handleRestart = () => {
        setGameState('IDLE');
        setSessionId(null);
        setDdaParameters(null);
        setFinalStats(null);
        setCognitiveProfile(null);
    };

    // ── Styles ── (green-tinted executive theme) ─────────────
    const S = {
        overlay: {
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            width: '100%', maxWidth: '800px', minHeight: '600px',
            background: 'linear-gradient(135deg, #020209 0%, #041208 50%, #020a04 100%)',
            color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6), inset 0 1px 1px rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.12)',
            padding: '2rem', textAlign: 'center', boxSizing: 'border-box'
        },
        card: {
            background: 'rgba(4,18,8,0.7)', backdropFilter: 'blur(16px)',
            borderRadius: '18px', border: '1px solid rgba(34,197,94,0.14)',
            padding: '2.5rem', width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        },
        title: {
            fontSize: '2.4rem', fontWeight: '800',
            background: 'linear-gradient(to right, #22c55e, #4ade80)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent', color: 'transparent',
            marginBottom: '0.4rem', letterSpacing: '-0.02em', display: 'inline-block'
        },
        subtitle: { fontSize: '0.92rem', color: '#94a3b8', marginBottom: '0.5rem', lineHeight: '1.5' },
        badge: {
            display: 'inline-block', padding: '0.2rem 0.8rem', borderRadius: '9999px',
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
            color: '#4ade80', fontSize: '0.75rem', fontWeight: '600',
            marginBottom: '1.8rem', letterSpacing: '0.05em'
        },
        featureGrid: {
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem', marginBottom: '2rem', textAlign: 'left'
        },
        featureItem: {
            background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)',
            borderRadius: '10px', padding: '0.75rem',
            fontSize: '0.78rem', color: '#94a3b8'
        },
        featureIcon: { fontSize: '1.1rem', display: 'block', marginBottom: '0.3rem' },
        inputLabel: {
            display: 'block', fontSize: '0.8rem', color: '#64748b',
            fontWeight: '600', marginBottom: '0.4rem',
            textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em'
        },
        input: {
            width: '100%', padding: '0.75rem 1rem',
            background: '#020209', border: '1.5px solid #14532d',
            borderRadius: '8px', color: '#ffffff', fontSize: '1rem',
            marginBottom: '1.25rem', outline: 'none', boxSizing: 'border-box'
        },
        button: {
            width: '100%', padding: '0.85rem 1.5rem',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            border: 'none', borderRadius: '10px', color: '#ffffff',
            fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(34,197,94,0.2)', letterSpacing: '0.03em'
        },
        errorMsg: {
            color: '#ef4444', background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            padding: '0.75rem', borderRadius: '8px',
            fontSize: '0.85rem', marginBottom: '1.25rem'
        },
        canvasWrapper: {
            width: '100%', maxWidth: '800px', aspectRatio: '4/3',
            borderRadius: '14px', overflow: 'hidden',
            border: '1px solid rgba(34,197,94,0.18)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 60px rgba(34,197,94,0.04)'
        },
        statRow: {
            display: 'flex', justifyContent: 'space-between',
            padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)'
        },
        statVal: { fontWeight: '700', color: '#22c55e' },
        archetypeBadge: {
            display: 'inline-block', padding: '0.5rem 1.2rem', borderRadius: '9999px',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.28)',
            color: '#4ade80', fontWeight: 'bold', marginTop: '0.5rem', fontSize: '1.05rem'
        }
    };

    if (gameState === 'IDLE') return (
        <div style={S.overlay}>
            <div style={S.card}>
                <h1 style={S.title}>PRIORITY QUEUE</h1>
                <p style={S.subtitle}>Executive Triage &amp; Resource Allocation Under Pressure</p>
                <div style={S.badge}>🧭 EXECUTIVE STRATEGY · TRIAGE TRAINING</div>

                <div style={S.featureGrid}>
                    <div style={S.featureItem}><span style={S.featureIcon}>🏃</span>Animated conveyor belt</div>
                    <div style={S.featureItem}><span style={S.featureIcon}>✋</span>Drag &amp; drop sorting</div>
                    <div style={S.featureItem}><span style={S.featureIcon}>🎯</span>Eisenhower matrix logic</div>
                    <div style={S.featureItem}><span style={S.featureIcon}>⚡</span>Speed-bonus scoring</div>
                </div>

                {error && <div style={S.errorMsg}>{error}</div>}

                <label style={S.inputLabel}>Player Username</label>
                <input
                    type="text" value={inputUsername}
                    onChange={e => setInputUsername(e.target.value)}
                    placeholder="Enter username" style={S.input}
                />
                <button onClick={startTrainingSession} style={S.button}>
                    Begin Triage Training
                </button>
            </div>
        </div>
    );

    if (gameState === 'LOADING') return (
        <div style={S.overlay}>
            <div style={S.card}>
                <div style={{
                    width: '42px', height: '42px',
                    border: '4px solid rgba(34,197,94,0.15)',
                    borderTop: '4px solid #22c55e',
                    borderRadius: '50%', margin: '0 auto 1.5rem auto',
                    animation: 'spin 1s linear infinite'
                }} />
                <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
                <h3 style={{ color: '#4ade80', marginBottom: '0.5rem' }}>Loading Task Queue...</h3>
                <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>Calibrating triage difficulty...</p>
            </div>
        </div>
    );

    if (gameState === 'PLAYING') return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <div style={S.canvasWrapper} ref={gameContainerRef} />
            <PauseOverlay isPaused={isPaused} onTogglePause={() => setIsPaused(false)} />
        </div>
    );

    if (gameState === 'FINISHED') {
        const acc   = Math.round((finalStats?.accuracy || 0) * 100);
        const grade = acc >= 80 ? '#4ade80' : acc >= 50 ? '#f59e0b' : '#ef4444';
        return (
            <div style={S.overlay}>
                <div style={S.card}>
                    <h1 style={{ ...S.title }}>TRIAGE COMPLETE</h1>
                    <p style={S.subtitle}>Task allocation metrics synchronized to cognitive profile.</p>

                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        {[
                            ['🏆 Final Score',         finalStats?.score,              '#4ade80'],
                            ['✅ Correct Triage',      finalStats?.hits,               '#22c55e'],
                            ['❌ Missed / Wrong Bin',  finalStats?.misses,             '#ef4444'],
                            ['🎯 Triage Accuracy',     `${acc}%`,                      grade],
                            ['📈 Peak DDA Level',      `Level ${finalStats?.difficultyLevel}`, '#22c55e'],
                        ].map(([label, val, col]) => (
                            <div key={label} style={S.statRow}>
                                <span>{label}</span>
                                <span style={{ ...S.statVal, color: col }}>{val}</span>
                            </div>
                        ))}
                    </div>

                    {cognitiveProfile && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                Predicted Cognitive Archetype
                            </div>
                            <div style={S.archetypeBadge}>{cognitiveProfile.archetype}</div>
                            <div style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: '0.3rem' }}>
                                Confidence: {Math.round(cognitiveProfile.confidence_score * 100)}%
                            </div>
                        </div>
                    )}

                    <button onClick={handleRestart} style={S.button}>
                        Begin Next Session
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

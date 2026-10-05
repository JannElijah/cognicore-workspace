import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import RouteOptimizerScene from '../games/RouteOptimizerScene';
import PauseOverlay from './PauseOverlay';
import { usePhaserEngine } from '../hooks/usePhaserEngine';


export default function RouteOptimizerGame({
    username = 'default_player',
    apiUrl   = API_BASE,
    onGameFinished
}) {
    const gameContainerRef  = useRef(null);

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
                headers: { 'Content-Type': 'application/json',
                            'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify({ username: inputUsername, game_type: 'RouteOptimizer' })
            });
            if (!response.ok) throw new Error(`Server status: ${response.status}`);
            const data = await response.json();
            if (data.status === 'success') {
                setSessionId(data.session_id);
                setDdaParameters(data.dda_parameters);
                if (data.cognitive_profile) {
                    setCognitiveProfile(data.cognitive_profile);
                }
                setGameState('PLAYING');
            } else {
                throw new Error(data.message || 'Unknown server error');
            }
        } catch (err) {
            setError('Could not connect to the training server. Ensure the Flask server is running.');
            setGameState('IDLE');
        }
    };

    // Handle Phaser engine initialization and lifecycle via generic hook
    const sceneData = React.useMemo(() => ({
        sessionId: sessionId,
        apiUrl: apiUrl,
        ddaParameters: ddaParameters,
        cognitiveProfile: cognitiveProfile,
        onGameOver: async (stats) => {
            setFinalStats(stats);
            setGameState('FINISHED');
            let profileInfo = null;
            try {
                const profileRes = await fetch(`${apiUrl}/api/dda`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${useCogniStore.getState().token}`},
                    body: JSON.stringify({ session_id: sessionId })
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData.status === 'success' && profileData.cognitive_profile) {
                        setCognitiveProfile(profileData.cognitive_profile);
                        profileInfo = profileData.cognitive_profile;
                    }
                }
            } catch (e) {
                console.warn('[React Wrapper] Failed to fetch final cognitive profile:', e);
            }

            if (onGameFinished) {
                onGameFinished({ ...stats, cognitiveProfile: profileInfo });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [sessionId, apiUrl, ddaParameters]);

    const phaserInstanceRef = usePhaserEngine(
        gameContainerRef, 
        gameState, 
        RouteOptimizerScene, 
        'RouteOptimizerScene', 
        sceneData
    );


    // Handle pause state transitions
    useEffect(() => {
        if (phaserInstanceRef.current && gameState === 'PLAYING') {
            const game = phaserInstanceRef.current;
            if (isPaused) {
                game.scene.scenes.forEach(scene => {
                    if (scene.scene.isActive()) {
                        scene.scene.pause();
                        scene.time.paused = true;
                        if (scene.countdownTimer) scene.countdownTimer.paused = true;
                    }
                });
            } else {
                game.scene.scenes.forEach(scene => {
                    if (scene.scene.isPaused()) {
                        scene.scene.resume();
                        scene.time.paused = false;
                        if (scene.countdownTimer) scene.countdownTimer.paused = false;
                    }
                });
            }
        }
    }, [isPaused, gameState]);

    // Handle global "P" key for pause toggling
    useEffect(() => {
        if (gameState !== 'PLAYING') {
            setIsPaused(false);
            return;
        }

        const handleKeyDown = (e) => {
            if (e.key === 'p' || e.key === 'P') {
                setIsPaused(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameState]);


    const handleRestart = () => {
        setGameState('IDLE');
        setSessionId(null);
        setDdaParameters(null);
        setFinalStats(null);
        setCognitiveProfile(null);
    };

    // ── Design: emerald/green theme ──────────────────────
    const S = {
        overlay: {
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            width: '100%', maxWidth: '1200px', minHeight: 'auto',
            background: 'linear-gradient(135deg, #020617 0%, #041a0d 50%, #0f172a 100%)',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6), inset 0 1px 1px rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.12)',
            padding: '2rem', textAlign: 'center', boxSizing: 'border-box'
        },
        card: {
            background: 'rgba(4, 26, 13, 0.55)',
            backdropFilter: 'blur(16px)',
            borderRadius: '18px',
            border: '1px solid rgba(34,197,94,0.12)',
            padding: '2.5rem',
            width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4), 0 0 40px rgba(34,197,94,0.04)'
        },
        title: {
            fontSize: '2.4rem', fontWeight: '800',
            background: 'linear-gradient(to right, #22c55e, #a78bfa)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent', color: 'transparent',
            marginBottom: '0.4rem', letterSpacing: '-0.02em', display: 'inline-block'
        },
        subtitle: { fontSize: '0.92rem', color: '#64748b', marginBottom: '0.5rem', lineHeight: '1.5' },
        badge: {
            display: 'inline-block', padding: '0.2rem 0.8rem',
            borderRadius: '9999px',
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)',
            color: '#22c55e', fontSize: '0.75rem', fontWeight: '600',
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
            display: 'block', fontSize: '0.8rem', color: '#475569',
            fontWeight: '600', marginBottom: '0.4rem',
            textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em'
        },
        input: {
            width: '100%', padding: '0.75rem 1rem',
            background: '#020617', border: '1.5px solid #1e293b',
            borderRadius: '8px', color: '#ffffff', fontSize: '1rem',
            marginBottom: '1.25rem', outline: 'none', transition: 'border-color 0.2s',
            boxSizing: 'border-box'
        },
        button: {
            width: '100%', padding: '0.85rem 1.5rem',
            background: 'linear-gradient(135deg, #16a34a, #7c3aed)',
            border: 'none', borderRadius: '10px', color: '#ffffff',
            fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(34,197,94,0.2)',
            transition: 'all 0.2s', letterSpacing: '0.03em'
        },
        errorMsg: {
            color: '#ef4444', background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            padding: '0.75rem', borderRadius: '8px',
            fontSize: '0.85rem', marginBottom: '1.25rem'
        },
        canvasWrapper: {
            width: '100%', height: '85vh', 
            borderRadius: '14px', overflow: 'hidden',
            border: '1px solid rgba(34,197,94,0.18)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 60px rgba(34,197,94,0.05)'
        },
        statRow: {
            display: 'flex', justifyContent: 'space-between',
            padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)'
        },
        statVal: { fontWeight: '700', color: '#22c55e' },
        archetypeBadge: {
            display: 'inline-block', padding: '0.5rem 1.2rem',
            borderRadius: '9999px',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.28)',
            color: '#22c55e', fontWeight: 'bold', marginTop: '0.5rem', fontSize: '1.05rem'
        }
    };

    // ── IDLE ────────────────────────────────────────────
    if (gameState === 'IDLE') {
        return (
            <div style={S.overlay}>
                <div style={S.card}>
                    <h1 style={S.title}>ROUTE OPTIMIZER</h1>
                    <p style={S.subtitle}>Combinatorial Network Optimization & Path Planning</p>
                    <div style={S.badge}>🕸️ COMBINATORIAL LOGIC · NETWORK REASONING</div>

                    <div style={S.featureGrid}>
                        <div style={S.featureItem}>
                            <span style={S.featureIcon}>🗺️</span>
                            Weighted Graph Networks
                        </div>
                        <div style={S.featureItem}>
                            <span style={S.featureIcon}>⚖️</span>
                            Multi-Path Cost Comparison
                        </div>
                        <div style={S.featureItem}>
                            <span style={S.featureIcon}>🎯</span>
                            Dijkstra Challenge
                        </div>
                        <div style={S.featureItem}>
                            <span style={S.featureIcon}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(192,132,252,0.7))'}} xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="7" rx="7" ry="5" stroke="#c084fc" strokeWidth="1.8"/><path d="M5 10c0 3 3 6 7 6s7-3 7-6" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="13" x2="9" y2="19" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/><line x1="15" y1="13" x2="15" y2="19" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="19" x2="17" y2="19" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                            Greedy Trap Avoidance
                        </div>
                    </div>

                    {error && <div style={S.errorMsg}>{error}</div>}

                    <label style={S.inputLabel}>Player Username</label>
                    <input
                        type="text"
                        value={inputUsername}
                        onChange={e => setInputUsername(e.target.value)}
                        placeholder="Enter username"
                        style={S.input}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#1e293b'}
                    />
                    <button
                        onClick={startTrainingSession}
                        style={S.button}
                        onMouseOver={e => e.target.style.filter = 'brightness(1.12)'}
                        onMouseOut={e => e.target.style.filter = 'brightness(1)'}
                    >
                        Begin Network Training
                    </button>
                </div>
            </div>
        );
    }

    // ── LOADING ─────────────────────────────────────────
    if (gameState === 'LOADING') {
        return (
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
                    <h3 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>Building Network Graph...</h3>
                    <p style={{ color: '#475569', fontSize: '0.875rem' }}>Calculating optimal routes...</p>
                </div>
            </div>
        );
    }

    // ── PLAYING ─────────────────────────────────────────
    if (gameState === 'PLAYING') {
        return (
            <div key="playing-state" style={{ position: 'relative', width: '100%', height: '85vh', margin: '0 auto' }}>
                <div style={S.canvasWrapper} ref={gameContainerRef} className="game-canvas-wrapper" />
                <PauseOverlay isPaused={isPaused} onTogglePause={() => setIsPaused(false)} onPauseRequest={() => setIsPaused(true)} />
            </div>
        );
    }


    // ── FINISHED ────────────────────────────────────────
    if (gameState === 'FINISHED') {
        const acc   = Math.round((finalStats?.accuracy || 0) * 100);
        const grade = acc >= 80 ? '#4ade80' : acc >= 50 ? '#f59e0b' : '#ef4444';
        return (
            <div style={S.overlay}>
                <div style={S.card}>
                    <h1 style={{
                        ...S.title,
                        background: 'linear-gradient(to right, #4ade80, #22c55e)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text'
                    }}>SESSION COMPLETE</h1>
                    <p style={S.subtitle}>Network optimization telemetry synced.</p>

                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <div style={S.statRow}>
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px',filter:'drop-shadow(0 0 4px rgba(251,191,36,0.8))'}} xmlns="http://www.w3.org/2000/svg"><path d="M6 2h12v10a6 6 0 01-12 0V2z" fill="#fbbf24"/><path d="M5 7H2a4 4 0 004 4M19 7h3a4 4 0 01-4 4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="18" x2="12" y2="21" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="21" x2="16" y2="21" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/></svg> Final Score</span>
                            <span style={{ ...S.statVal, color: '#4ade80' }}>{finalStats?.score}</span>
                        </div>
                        <div style={S.statRow}>
                            <span>Optimal Routes Found</span>
                            <span style={S.statVal}>{finalStats?.hits}</span>
                        </div>
                        <div style={S.statRow}>
                            <span>Suboptimal Routes</span>
                            <span style={{ ...S.statVal, color: '#ef4444' }}>{finalStats?.misses}</span>
                        </div>
                        <div style={S.statRow}>
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px',filter:'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.7))'}} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="var(--color-primary)" strokeWidth="1.5"/><circle cx="12" cy="12" r="5" stroke="var(--color-primary)" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="var(--color-primary)"/></svg> Optimization Accuracy</span>
                            <span style={{ ...S.statVal, color: grade }}>{acc}%</span>
                        </div>
                        <div style={S.statRow}>
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px',filter:'drop-shadow(0 0 4px rgba(74,222,128,0.7))'}} xmlns="http://www.w3.org/2000/svg"><polyline points="2,17 8,11 13,16 22,7" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17,7 22,7 22,12" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Max Difficulty Reached</span>
                            <span style={{ ...S.statVal, color: '#a78bfa' }}>Level {finalStats?.difficultyLevel}</span>
                        </div>
                        <div style={S.statRow}>
                            <span>Path Resets Used</span>
                            <span style={{ ...S.statVal, color: 'var(--color-primary)' }}>{finalStats?.backtrack_count ?? 0}</span>
                        </div>
                        <div style={{ ...S.statRow, border: 'none' }}>
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px',filter:'drop-shadow(0 0 4px rgba(250,204,21,0.9))'}} xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#facc15"/></svg> First Move Latency</span>
                            <span style={{ ...S.statVal, color: '#94a3b8' }}>
                                {finalStats?.hesitation_ms ? `${Math.round(finalStats.hesitation_ms)}ms` : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {cognitiveProfile && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.4rem' }}>
                                Cognitive Profile Archetype
                            </div>
                            <div style={S.archetypeBadge}>{cognitiveProfile.archetype}</div>
                            <div style={{ fontSize: '0.72rem', color: '#334155', marginTop: '0.3rem' }}>
                                Confidence: {Math.round(cognitiveProfile.confidence_score * 100)}%
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleRestart}
                        style={S.button}
                        onMouseOver={e => e.target.style.filter = 'brightness(1.12)'}
                        onMouseOut={e => e.target.style.filter = 'brightness(1)'}
                    >
                        Restart Training
                    </button>
                </div>
            </div>
        );
    }

    return null;
}


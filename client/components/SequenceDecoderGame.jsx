import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import SequenceDecoderScene from '../games/SequenceDecoderScene';
import PauseOverlay from './PauseOverlay';

export default function SequenceDecoderGame({ username = 'default_player', apiUrl = API_BASE, onGameFinished }) {
    const gameContainerRef   = useRef(null);
    const phaserInstanceRef  = useRef(null);

    const [sessionId,       setSessionId]       = useState(null);
    const [ddaParameters,   setDdaParameters]   = useState(null);
    const [gameState,       setGameState]       = useState('IDLE'); // IDLE | LOADING | PLAYING | FINISHED
    const [inputUsername,   setInputUsername]   = useState(username);
    const [finalStats,      setFinalStats]      = useState(null);
    const [cognitiveProfile, setCognitiveProfile] = useState(null);
    const [error,           setError]           = useState(null);
    const [isPaused, setIsPaused] = useState(false);

    const startTrainingSession = async () => {
        setGameState('LOADING');
        setError(null);

        try {
            console.log('[React SD Wrapper] Initializing SequenceDecoder session...');
            const response = await fetch(`${apiUrl}/api/start-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: inputUsername,
                    game_type: 'SequenceDecoder'
                })
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
            console.error('[React SD Wrapper] Session init failed:', err);
            setError('Could not connect to the training server. Please ensure the Flask server is running.');
            setGameState('IDLE');
        }
    };

    useEffect(() => {
        if (gameState !== 'PLAYING' || !sessionId || !gameContainerRef.current) return;

        console.log('[React SD Wrapper] Starting Phaser SequenceDecoder instance...');

        const config = {
            type: Phaser.AUTO,
            parent: gameContainerRef.current,
            backgroundColor: '#020617',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 800,
                height: 600
            },
            scene: [SequenceDecoderScene]
        };

        const game = new Phaser.Game(config);
        phaserInstanceRef.current = game;
        window.phaserGame = game;

        game.scene.start('SequenceDecoderScene', {
            sessionId,
            apiUrl,
            ddaParameters,
            cognitiveProfile,
            onGameOver: async (stats) => {
                setFinalStats(stats);

                let profileInfo = null;
                try {
                    const profileRes = await fetch(`${apiUrl}/api/dda`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_id: sessionId })
                    });
                    if (profileRes.ok) {
                        const pd = await profileRes.json();
                        if (pd.status === 'success' && pd.cognitive_profile) {
                            setCognitiveProfile(pd.cognitive_profile);
                            profileInfo = pd.cognitive_profile;
                        }
                    }
                } catch (e) {
                    console.warn('[React SD Wrapper] Final profile fetch failed:', e);
                }

                setGameState('FINISHED');
                if (onGameFinished) {
                    onGameFinished({ ...stats, cognitiveProfile: profileInfo });
                }
            }
        });

        return () => {
            if (phaserInstanceRef.current) {
                console.log('[React SD Wrapper] Destroying Phaser instance...');
                phaserInstanceRef.current.destroy(true);
                phaserInstanceRef.current = null;
                window.phaserGame = null;
            }
        };
    }, [gameState, sessionId, apiUrl, ddaParameters, onGameFinished]);

    
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

    // ── Styles: cyan/teal theme distinct from EquationBalance amber
    const styles = {
        overlay: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '800px',
            minHeight: '600px',
            height: 'auto',
            background: 'linear-gradient(135deg, #020617 0%, #0c1a2e 50%, #0f172a 100%)',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6), inset 0 1px 1px rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.15)',
            padding: '2rem',
            textAlign: 'center',
            boxSizing: 'border-box'
        },
        card: {
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            borderRadius: '18px',
            border: '1px solid rgba(6,182,212,0.12)',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4), 0 0 40px rgba(6,182,212,0.04)'
        },
        title: {
            fontSize: '2.4rem',
            fontWeight: '800',
            background: 'linear-gradient(to right, #06b6d4, #a78bfa)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            marginBottom: '0.4rem',
            letterSpacing: '-0.02em',
            display: 'inline-block'
        },
        subtitle: {
            fontSize: '0.95rem',
            color: '#64748b',
            marginBottom: '0.5rem',
            lineHeight: '1.5'
        },
        badge: {
            display: 'inline-block',
            padding: '0.2rem 0.8rem',
            borderRadius: '9999px',
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.2)',
            color: '#06b6d4',
            fontSize: '0.75rem',
            fontWeight: '600',
            marginBottom: '1.8rem',
            letterSpacing: '0.05em'
        },
        featureGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginBottom: '2rem',
            textAlign: 'left'
        },
        featureItem: {
            background: 'rgba(6,182,212,0.05)',
            border: '1px solid rgba(6,182,212,0.1)',
            borderRadius: '10px',
            padding: '0.75rem',
            fontSize: '0.8rem',
            color: '#94a3b8'
        },
        featureIcon: {
            fontSize: '1.1rem',
            display: 'block',
            marginBottom: '0.3rem'
        },
        inputLabel: {
            display: 'block',
            fontSize: '0.8rem',
            color: '#475569',
            fontWeight: '600',
            marginBottom: '0.4rem',
            textAlign: 'left',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
        },
        input: {
            width: '100%',
            padding: '0.75rem 1rem',
            background: '#020617',
            border: '1.5px solid #1e293b',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '1rem',
            marginBottom: '1.25rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
        },
        button: {
            width: '100%',
            padding: '0.85rem 1.5rem',
            background: 'linear-gradient(135deg, #0891b2, #7c3aed)',
            border: 'none',
            borderRadius: '10px',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(6,182,212,0.25)',
            transition: 'all 0.2s',
            letterSpacing: '0.03em'
        },
        errorMsg: {
            color: '#ef4444',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
        },
        canvasWrapper: {
            width: '100%',
            maxWidth: '800px',
            aspectRatio: '4/3',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid rgba(6,182,212,0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 60px rgba(6,182,212,0.06)'
        },
        statRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.75rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)'
        },
        statVal: {
            fontWeight: '700',
            color: '#06b6d4'
        },
        archetypeBadge: {
            display: 'inline-block',
            padding: '0.5rem 1.2rem',
            borderRadius: '9999px',
            background: 'rgba(6,182,212,0.12)',
            border: '1px solid rgba(6,182,212,0.3)',
            color: '#06b6d4',
            fontWeight: 'bold',
            marginTop: '0.5rem',
            fontSize: '1.05rem'
        }
    };

    // ── IDLE screen
    if (gameState === 'IDLE') {
        return (
            <div className='premium-overlay'>
                <div className='premium-glass-card'>
                    <h1 className='premium-title'>SEQUENCE DECODER</h1>
                    <p className='premium-subtitle'>Inductive Pattern Reasoning & Rule Abstraction Training</p>
                    <div style={styles.badge}>🧩 LOGICAL REASONING · PATTERN INDUCTION</div>

                    <div style={styles.featureGrid}>
                        <div style={styles.featureItem}>
                            <span style={styles.featureIcon}>🔢</span>
                            Arithmetic & Geometric Sequences
                        </div>
                        <div style={styles.featureItem}>
                            <span style={styles.featureIcon}>🌀</span>
                            Dual-Rule Interleaved Patterns
                        </div>
                        <div style={styles.featureItem}>
                            <span style={styles.featureIcon}>🌿</span>
                            Fibonacci-Like Series
                        </div>
                        <div style={styles.featureItem}>
                            <span style={styles.featureIcon}>🔁</span>
                            Alternating Delta Rules
                        </div>
                    </div>

                    {error && <div style={styles.errorMsg}>{error}</div>}

                    <label style={styles.inputLabel}>Player Username</label>
                    <input
                        type="text"
                        value={inputUsername}
                        onChange={e => setInputUsername(e.target.value)}
                        placeholder="Enter username"
                        style={styles.input}
                        onFocus={e => e.target.style.borderColor = '#06b6d4'}
                        onBlur={e => e.target.style.borderColor = '#1e293b'}
                    />

                    <button
                        onClick={startTrainingSession}
                        className='premium-button'
                        onMouseOver={e => e.target.style.filter = 'brightness(1.12)'}
                        onMouseOut={e => e.target.style.filter = 'brightness(1.0)'}
                    >
                        Begin Pattern Training
                    </button>
                </div>
            </div>
        );
    }

    // ── LOADING screen
    if (gameState === 'LOADING') {
        return (
            <div className='premium-overlay'>
                <div className='premium-glass-card'>
                    <div style={{
                        width: '42px', height: '42px',
                        border: '4px solid rgba(6,182,212,0.15)',
                        borderTop: '4px solid #06b6d4',
                        borderRadius: '50%',
                        margin: '0 auto 1.5rem auto',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
                    <h3 style={{ color: '#06b6d4', marginBottom: '0.5rem' }}>Initializing Pattern Engine...</h3>
                    <p style={{ color: '#475569', fontSize: '0.875rem' }}>Connecting to telemetry database...</p>
                </div>
            </div>
        );
    }

    // ── PLAYING screen
    if (gameState === 'PLAYING') {
        return (
            <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                <div style={styles.canvasWrapper} ref={gameContainerRef} />
                <PauseOverlay isPaused={isPaused} onTogglePause={() => setIsPaused(false)} />
            </div>
        );
    }

    // ── FINISHED screen
    if (gameState === 'FINISHED') {
        const accuracy = Math.round((finalStats?.accuracy || 0) * 100);
        const grade = accuracy >= 80 ? '#4ade80' : accuracy >= 50 ? '#f59e0b' : '#ef4444';

        return (
            <div className='premium-overlay'>
                <div className='premium-glass-card'>
                    <h1 style={{
                        ...styles.title,
                        background: 'linear-gradient(to right, #4ade80, #06b6d4)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text'
                    }}>SESSION COMPLETE</h1>
                    <p className='premium-subtitle'>Pattern induction telemetry synced to database.</p>

                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <div className='stat-row'>
                            <span>🏆 Final Score</span>
                            <span className="stat-val" style={{ color: '#4ade80'  }}>{finalStats?.score}</span>
                        </div>
                        <div className='stat-row'>
                            <span>✅ Patterns Decoded</span>
                            <span className='stat-val'>{finalStats?.hits}</span>
                        </div>
                        <div className='stat-row'>
                            <span>❌ Pattern Errors</span>
                            <span className="stat-val" style={{ color: '#ef4444'  }}>{finalStats?.misses}</span>
                        </div>
                        <div className='stat-row'>
                            <span>🎯 Induction Accuracy</span>
                            <span className="stat-val" style={{ color: grade  }}>{accuracy}%</span>
                        </div>
                        <div className='stat-row'>
                            <span>📈 Max Difficulty Achieved</span>
                            <span className="stat-val" style={{ color: '#a78bfa'  }}>Level {finalStats?.difficultyLevel}</span>
                        </div>
                        <div style={{ ...styles.statRow, border: 'none' }}>
                            <span>⚡ First Response Latency</span>
                            <span className="stat-val" style={{ color: '#38bdf8'  }}>
                                {finalStats?.hesitation_ms ? `${Math.round(finalStats.hesitation_ms)}ms` : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {cognitiveProfile && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.4rem' }}>
                                Cognitive Profile Archetype
                            </div>
                            <div style={styles.archetypeBadge}>
                                {cognitiveProfile.archetype}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#334155', marginTop: '0.3rem' }}>
                                Confidence: {Math.round(cognitiveProfile.confidence_score * 100)}%
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleRestart}
                        className='premium-button'
                        onMouseOver={e => e.target.style.filter = 'brightness(1.12)'}
                        onMouseOut={e => e.target.style.filter = 'brightness(1.0)'}
                    >
                        Restart Training
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

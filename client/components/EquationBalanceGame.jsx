import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import EquationBalanceScene from '../games/EquationBalanceScene';
import PauseOverlay from './PauseOverlay';

export default function EquationBalanceGame({ username = 'default_player', apiUrl = API_BASE, onGameFinished }) {
    const gameContainerRef = useRef(null);
    const phaserInstanceRef = useRef(null);

    const [sessionId, setSessionId] = useState(null);
    const [ddaParameters, setDdaParameters] = useState(null);
    const [gameState, setGameState] = useState('IDLE'); // IDLE | LOADING | PLAYING | FINISHED
    const [inputUsername, setInputUsername] = useState(username);
    const [finalStats, setFinalStats] = useState(null);
    const [cognitiveProfile, setCognitiveProfile] = useState(null);
    const [error, setError] = useState(null);
    const [isPaused, setIsPaused] = useState(false);

    const startTrainingSession = async () => {
        setGameState('LOADING');
        setError(null);

        try {
            console.log('[React EB Wrapper] Initializing session on Flask API...');
            const response = await fetch(`${apiUrl}/api/start-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                            'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify({
                    username: inputUsername,
                    game_type: 'EquationBalance'
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned status code: ${response.status}`);
            }

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
            console.error('[React EB Wrapper] Connection to database API failed:', err);
            setError('Could not connect to the database server. Please verify the Flask server is running.');
            setGameState('IDLE');
        }
    };

    useEffect(() => {
        if (gameState !== 'PLAYING' || !sessionId || !gameContainerRef.current) {
            return;
        }

        console.log('[React EB Wrapper] Starting Phaser game instance...');
        
        const config = {
            type: Phaser.AUTO,
            parent: gameContainerRef.current,
            backgroundColor: '#09090b',
                        render: {
                powerPreference: 'high-performance',
                antialias: true,
                roundPixels: true,
                batchSize: 4096
            },
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                // Mobile-responsive: use viewport width on portrait phones, fixed 800x600 on desktop
                width: '100%',
                height: '100%',
            },
            scene: [EquationBalanceScene]
        };

        const game = new Phaser.Game(config);
        phaserInstanceRef.current = game;
        window.phaserGame = game;

        game.scene.start('EquationBalanceScene', {
            sessionId: sessionId,
            apiUrl: apiUrl,
            ddaParameters: ddaParameters,
            cognitiveProfile: cognitiveProfile,
            onGameOver: async (stats) => {
                setFinalStats(stats);
                
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
                    console.warn('[React EB Wrapper] Failed to fetch final cognitive profile:', e);
                }

                setGameState('FINISHED');
                if (onGameFinished) {
                    onGameFinished({ ...stats, cognitiveProfile: profileInfo });
                }
            }
        });

        return () => {
            if (phaserInstanceRef.current) {
                console.log('[React EB Wrapper] Destroying Phaser instance...');
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

    const styles = {
        overlay: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '1200px',
            minHeight: 'auto',
            height: 'auto',
            background: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            border: '1px solid #312e81',
            padding: '2rem',
            textAlign: 'center',
            boxSizing: 'border-box'
        },
        card: {
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        },
        title: {
            fontSize: '2.5rem',
            fontWeight: '800',
            background: 'linear-gradient(to right, #f59e0b, #e0f2fe)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em',
            display: 'inline-block'
        },
        subtitle: {
            fontSize: '1rem',
            color: '#94a3b8',
            marginBottom: '2rem'
        },
        input: {
            width: '100%',
            padding: '0.75rem 1rem',
            background: '#09090b',
            border: '1.5px solid #334155',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '1rem',
            marginBottom: '1.5rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
        },
        button: {
            width: '100%',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(to right, #f59e0b, #7c3aed)',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            transition: 'all 0.2s'
        },
        errorMessage: {
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
        },
        canvasWrapper: {
            width: '100%',
            height: '85vh',
            
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #312e81',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
        },
        statRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.75rem 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        },
        statVal: {
            fontWeight: '700',
            color: '#f59e0b'
        },
        archetypeBadge: {
            display: 'inline-block',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            fontWeight: 'bold',
            marginTop: '0.5rem',
            fontSize: '1.1rem'
        }
    };

    if (gameState === 'IDLE') {
        return (
            <div className='premium-overlay'>
                <div className='premium-glass-card'>
                    <h1 className='premium-title'>EQUATION BALANCE</h1>
                    <p className='premium-subtitle'>Deductive Reasoning & Operational Balance Training</p>
                    
                    {error && <div style={styles.errorMessage}>{error}</div>}

                    <div style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Player Username</label>
                    </div>
                    <input 
                        type="text" 
                        value={inputUsername} 
                        onChange={(e) => setInputUsername(e.target.value)} 
                        placeholder="Enter username" 
                        style={styles.input}
                    />

                    <button 
                        onClick={startTrainingSession}
                        className='premium-button'
                        onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                        onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
                    >
                        Begin Training Session
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'LOADING') {
        return (
            <div className='premium-overlay'>
                <div className='premium-glass-card'>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid rgba(245, 158, 11, 0.2)',
                        borderTop: '4px solid #f59e0b',
                        borderRadius: '50%',
                        margin: '0 auto 1.5rem auto',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <h3>Initializing Telemetry Session...</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Connecting to Supabase PostgreSQL database...</p>
                </div>
            </div>
        );
    }

    if (gameState === 'PLAYING') {
        return (
            <div style={{ position: 'relative', width: '100%', height: '85vh', margin: '0 auto' }}>
                <div style={styles.canvasWrapper} ref={gameContainerRef} className="game-canvas-wrapper" />
                <PauseOverlay isPaused={isPaused} onTogglePause={() => setIsPaused(false)} onPauseRequest={() => setIsPaused(true)} />
            </div>
        );
    }

    if (gameState === 'FINISHED') {
        return (
            <div className='premium-overlay'>
                <div className='premium-glass-card'>
                    <h1 style={{ 
                        ...styles.title, 
                        background: 'linear-gradient(to right, #4ade80, #f59e0b)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text' 
                    }}>SESSION COMPLETE</h1>
                    <p className='premium-subtitle'>Reasoning telemetry successfully synced to database.</p>

                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <div className='stat-row'>
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px',filter:'drop-shadow(0 0 4px rgba(251,191,36,0.8))'}} xmlns="http://www.w3.org/2000/svg"><path d="M6 2h12v10a6 6 0 01-12 0V2z" fill="#fbbf24"/><path d="M5 7H2a4 4 0 004 4M19 7h3a4 4 0 01-4 4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="18" x2="12" y2="21" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="21" x2="16" y2="21" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/></svg> Final Score</span>
                            <span className="stat-val" style={{ color: '#4ade80'  }}>{finalStats?.score}</span>
                        </div>
                        <div className='stat-row'>
                            <span>Equations Balanced</span>
                            <span className='stat-val'>{finalStats?.hits}</span>
                        </div>
                        <div className='stat-row'>
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px',filter:'drop-shadow(0 0 4px rgba(239,68,68,0.7))'}} xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/></svg> Deductive Errors</span>
                            <span className="stat-val" style={{ color: '#ef4444'  }}>{finalStats?.misses}</span>
                        </div>
                        <div className='stat-row'>
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px',filter:'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.7))'}} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="var(--color-primary)" strokeWidth="1.5"/><circle cx="12" cy="12" r="5" stroke="var(--color-primary)" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="var(--color-primary)"/></svg> Success Rate Accuracy</span>
                            <span className='stat-val'>{Math.round((finalStats?.accuracy || 0) * 100)}%</span>
                        </div>
                        <div className='stat-row'>
                            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px',filter:'drop-shadow(0 0 4px rgba(74,222,128,0.7))'}} xmlns="http://www.w3.org/2000/svg"><polyline points="2,17 8,11 13,16 22,7" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17,7 22,7 22,12" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Max Difficulty Achieved</span>
                            <span className="stat-val" style={{ color: '#c084fc'  }}>Level {finalStats?.difficultyLevel}</span>
                        </div>
                    </div>

                    {cognitiveProfile && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Classified Cognitive Profile Archetype</div>
                            <div style={styles.archetypeBadge}>
                                {cognitiveProfile.archetype}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                Confidence: {Math.round(cognitiveProfile.confidence_score * 100)}%
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleRestart}
                        className='premium-button'
                        onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                        onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
                    >
                        Restart Training
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

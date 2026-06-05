/**
 * ================================================================================
 * Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
 * - Pattern: Model-View-Controller (MVC) / Container-Presenter
 * - Component: Controller/Presenter (React Integration Wrapper)
 * - Separation of Concerns: Renders the UI wrapper, manages React lifecycle states,
 *   initializes/cleans up the Phaser game engine instance, and mediates between React
 *   state and Phaser scenes.
 * - Error Handling: Implements catch blocks for initial API connections, presenting
 *   user-friendly warning overlays if the Flask server is unreachable.
 * ================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MentalFlexScene from '../games/MentalFlexScene';

export default function MentalFlexGame({ username = 'default_player', apiUrl = 'http://127.0.0.1:5000', onGameFinished }) {
    const gameContainerRef = useRef(null);
    const phaserInstanceRef = useRef(null);

    const [sessionId, setSessionId] = useState(null);
    const [ddaParameters, setDdaParameters] = useState(null);
    const [gameState, setGameState] = useState('IDLE'); // IDLE | LOADING | PLAYING | FINISHED
    const [inputUsername, setInputUsername] = useState(username);
    const [finalStats, setFinalStats] = useState(null);
    const [cognitiveProfile, setCognitiveProfile] = useState(null);
    const [error, setError] = useState(null);

    // Initial session start handshake with Flask server
    const startTrainingSession = async () => {
        setGameState('LOADING');
        setError(null);

        try {
            console.log('[React Wrapper] Initializing session on Flask API for MentalFlex...');
            const response = await fetch(`${apiUrl}/api/start-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: inputUsername,
                    game_type: 'MentalFlex'
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned status code: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'success') {
                setSessionId(data.session_id);
                setDdaParameters(data.dda_parameters);
                setGameState('PLAYING');
            } else {
                throw new Error(data.message || 'Unknown server error');
            }
        } catch (err) {
            console.error('[React Wrapper] Connection to database API failed:', err);
            setError('Could not connect to the database server. Please verify the Flask server is running.');
            setGameState('IDLE');
        }
    };

    // Initialize Phaser game when state changes to PLAYING
    useEffect(() => {
        if (gameState !== 'PLAYING' || !sessionId || !gameContainerRef.current) {
            return;
        }

        console.log('[React Wrapper] Starting Phaser game instance for MentalFlex...');
        
        // Phaser configuration with auto-scaling Scale Manager for mobile responsiveness
        const config = {
            type: Phaser.AUTO,
            parent: gameContainerRef.current,
            backgroundColor: '#09090b',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 800,
                height: 600
            },
            physics: {
                default: 'arcade',
                arcade: { debug: false }
            },
            scene: [MentalFlexScene]
        };

        // Instantiate Phaser
        const game = new Phaser.Game(config);
        phaserInstanceRef.current = game;

        // Boot and pass the state objects to Phaser MentalFlexScene
        game.scene.start('MentalFlexScene', {
            sessionId: sessionId,
            apiUrl: apiUrl,
            ddaParameters: ddaParameters,
            onGameOver: async (stats) => {
                setFinalStats(stats);
                
                let profileInfo = null;
                // Fetch final cognitive profile archetype updates from the database
                try {
                    const profileRes = await fetch(`${apiUrl}/api/dda`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
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

                setGameState('FINISHED');
                if (onGameFinished) {
                    onGameFinished({ ...stats, cognitiveProfile: profileInfo });
                }
            }
        });

        // Cleanup: destroy Phaser instance on component unmount
        return () => {
            if (phaserInstanceRef.current) {
                console.log('[React Wrapper] Destroying Phaser instance...');
                phaserInstanceRef.current.destroy(true);
                phaserInstanceRef.current = null;
            }
        };
    }, [gameState, sessionId, apiUrl, ddaParameters, onGameFinished]);

    const handleRestart = () => {
        setGameState('IDLE');
        setSessionId(null);
        setDdaParameters(null);
        setFinalStats(null);
        setCognitiveProfile(null);
    };

    // Premium Glassmorphic Styling
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
            background: 'linear-gradient(135deg, #09090b 0%, #160f29 100%)',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            border: '1px solid #3c1e6d',
            padding: '2rem',
            textAlign: 'center',
            boxSizing: 'border-box'
        },
        card: {
            background: 'rgba(24, 15, 41, 0.45)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        },
        title: {
            fontSize: '2.5rem',
            fontWeight: '800',
            background: 'linear-gradient(to right, #a855f7, #38bdf8)',
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
            border: '1.5px solid #4c1d95',
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
            background: 'linear-gradient(to right, #a855f7, #0284c7)',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
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
            maxWidth: '800px',
            aspectRatio: '4/3',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #3c1e6d',
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
            color: '#c084fc'
        },
        archetypeBadge: {
            display: 'inline-block',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: '#c084fc',
            fontWeight: 'bold',
            marginTop: '0.5rem',
            fontSize: '1.1rem'
        }
    };

    if (gameState === 'IDLE') {
        return (
            <div style={styles.overlay}>
                <div style={styles.card}>
                    <h1 style={styles.title}>MENTAL FLEX</h1>
                    <p style={styles.subtitle}>Cognitive Flexibility & Set-Shifting Training</p>
                    
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
                        style={styles.button}
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
            <div style={styles.overlay}>
                <div style={styles.card}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid rgba(168, 85, 247, 0.2)',
                        borderTop: '4px solid #a855f7',
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
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Connecting to SQLite secure database...</p>
                </div>
            </div>
        );
    }

    if (gameState === 'PLAYING') {
        return (
            <div style={styles.canvasWrapper} ref={gameContainerRef} />
        );
    }

    if (gameState === 'FINISHED') {
        return (
            <div style={styles.overlay}>
                <div style={styles.card}>
                    <h1 style={{ 
                        ...styles.title, 
                        background: 'linear-gradient(to right, #4ade80, #a855f7)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text' 
                    }}>SESSION COMPLETE</h1>
                    <p style={styles.subtitle}>Telemetry successfully synced to database.</p>

                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <div style={styles.statRow}>
                            <span>Final Score</span>
                            <span style={{ ...styles.statVal, color: '#4ade80' }}>{finalStats?.score}</span>
                        </div>
                        <div style={styles.statRow}>
                            <span>Matches Made</span>
                            <span style={styles.statVal}>{finalStats?.hits}</span>
                        </div>
                        <div style={styles.statRow}>
                            <span>Misses / Timeouts</span>
                            <span style={{ ...styles.statVal, color: '#ef4444' }}>{finalStats?.misses}</span>
                        </div>
                        <div style={styles.statRow}>
                            <span>Response Accuracy</span>
                            <span style={styles.statVal}>{Math.round((finalStats?.accuracy || 0) * 100)}%</span>
                        </div>
                        <div style={styles.statRow}>
                            <span>Max Difficulty Achieved</span>
                            <span style={{ ...styles.statVal, color: '#a855f7' }}>Level {finalStats?.difficultyLevel}</span>
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
                        style={styles.button}
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

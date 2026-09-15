import React from 'react';

/**
 * PauseOverlay Component
 * Renders a premium, glassmorphic pause screen overlaying the active game canvas.
 * Also renders a floating mobile-only pause button above the canvas.
 *
 * Props:
 * @param {boolean} isPaused - Controls visibility of the full pause overlay.
 * @param {function} onTogglePause - Callback function to resume the game.
 * @param {function} onPauseRequest - Callback to trigger pause (used by mobile tap button).
 */
export default function PauseOverlay({ isPaused, onTogglePause, onPauseRequest }) {
    return (
        <>
            {/* Floating pause button — CSS hides this on desktop, shows on mobile */}
            {!isPaused && (
                <button
                    className="mobile-pause-btn"
                    onClick={onPauseRequest || onTogglePause}
                    aria-label="Pause game"
                    title="Pause"
                >
                    ⏸
                </button>
            )}

            {/* Full-screen pause overlay — shown when isPaused is true */}
            {isPaused && (
                <div className="pause-overlay">
                    <div className="pause-card">
                        <div className="pause-icon">⏸️</div>
                        <h2 className="pause-title">TRAINING PAUSED</h2>
                        <p className="pause-description">
                            Telemetry capture and cognitive metrics logging are temporarily suspended.
                        </p>
                        <button
                            className="pause-resume-btn"
                            onClick={onTogglePause}
                            onMouseOver={(e) => e.target.style.filter = 'brightness(1.15)'}
                            onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
                        >
                            RESUME SESSION
                        </button>
                        <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '500', letterSpacing: '0.05em' }}>
                            Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', color: '#f8fafc', fontFamily: 'monospace' }}>P</kbd> or tap <strong style={{ color: '#94a3b8' }}>⏸</strong> to pause
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

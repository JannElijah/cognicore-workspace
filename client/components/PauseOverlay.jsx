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
            {/* Floating pause button - permanently visible to inform users */}
            {!isPaused && (
                <button
                    className="pause-hud-indicator"
                    onClick={onPauseRequest || onTogglePause}
                    aria-label="Pause game"
                    title="Pause (Press P)"
                    style={{
                        position: "absolute",
                        top: "1.5rem",
                        right: "1.5rem",
                        zIndex: 9999,
                        background: "rgba(15, 23, 42, 0.4)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        color: "#f8fafc",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        backdropFilter: "blur(4px)",
                        fontFamily: "monospace",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        transition: "all 0.2s ease",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(15, 23, 42, 0.8)";
                        e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.5)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(15, 23, 42, 0.4)";
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                    }}
                >
                    <span style={{ fontSize: "1.1rem" }}>||</span> {/* Or pause symbol */}
                    <span className="hide-on-mobile">PAUSE (P)</span>
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

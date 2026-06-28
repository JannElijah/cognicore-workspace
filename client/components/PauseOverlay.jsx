import React from 'react';

/**
 * PauseOverlay Component
 * Renders a premium, glassmorphic pause screen overlaying the active game canvas.
 * 
 * Props:
 * @param {boolean} isPaused - Controls visibility of the overlay.
 * @param {function} onTogglePause - Callback function to resume the game.
 */
export default function PauseOverlay({ isPaused, onTogglePause }) {
    if (!isPaused) return null;

    return (
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
                    Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', color: '#f8fafc', fontFamily: 'monospace' }}>P</kbd> to toggle pause
                </div>
            </div>
        </div>
    );
}

import React from 'react';

/**
 * ErrorBoundary Component
 * Captures serious game runtime and canvas exceptions, providing a safe,
 * glassmorphic fallback UI and preventing whole-page application crashes.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[Serious Game ErrorBoundary] Caught exception:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: '800px',
                    minHeight: '400px',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                    borderRadius: '16px',
                    border: '1.5px solid #f43f5e',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    padding: '2.5rem',
                    color: '#f8fafc',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: '800',
                        color: '#f43f5e',
                        marginBottom: '0.75rem'
                    }}>SERIOUS GAME RUNTIME EXCEPTION</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.5' }}>
                        The game engine encountered an unexpected runtime exception. Attentional metrics logging has been temporarily halted.
                    </p>
                    <div style={{
                        background: 'rgba(0,0,0,0.4)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        color: '#cbd5e1',
                        marginBottom: '2rem',
                        width: '100%',
                        overflowX: 'auto',
                        textAlign: 'left',
                        whiteSpace: 'pre-wrap',
                        boxSizing: 'border-box'
                    }}>
                        {this.state.error?.stack || this.state.error?.toString() || 'Unknown Exception'}
                    </div>
                    <button
                        onClick={this.handleReset}
                        style={{
                            background: 'linear-gradient(to right, #f43f5e, #e11d48)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem 2rem',
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)'
                        }}
                        onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                        onMouseOut={(e) => e.target.style.filter = 'brightness(1.0)'}
                    >
                        Return to Lobby
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

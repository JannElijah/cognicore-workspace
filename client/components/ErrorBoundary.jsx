import React from 'react';
import { isChunkLoadError } from '../utils/chunkRecovery.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const chunkError = isChunkLoadError(this.state.error);
      return (
        <div style={{ padding: '2rem', background: '#450a0a', color: '#fca5a5', borderRadius: '12px', zIndex: 9999, position: 'relative' }}>
          <h2>
            {chunkError
              ? 'New Update Available or Module Failed to Load'
              : `Something went wrong in ${this.props.name || 'Component'}.`}
          </h2>
          {chunkError && (
            <p style={{ color: '#fecaca', margin: '0.5rem 0 1rem 0', fontSize: '0.95rem' }}>
              Your browser tab is running an older cached build after a recent update. Reload the page to fetch the latest game module.
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
            {this.props.onReset && (
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  this.props.onReset();
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(254, 202, 202, 0.35)',
                  background: 'transparent',
                  color: '#fecaca',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Back to Training Hub
              </button>
            )}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{this.state.error && this.state.error.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.7rem', marginTop: '1rem' }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

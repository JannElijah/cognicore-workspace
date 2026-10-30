import React, { useState, useEffect } from 'react';
import GameIcon from './GameIcon';
import useCogniStore from '../store/useCogniStore';

const SeizureDisclaimerModal = () => {
  const [show, setShow] = useState(false);
  const { setReduceFlashes } = useCogniStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceShow = params.get('disclaimer') === 'true' || params.has('disclaimer');
    const accepted = localStorage.getItem('cognicore_seizure_disclaimer');
    if (!accepted || forceShow) {
      setShow(true);
    }
  }, []);

  const handleAccept = (safeMode) => {
    try {
      if (safeMode) {
        if (typeof setReduceFlashes === 'function') {
          setReduceFlashes(true);
        }
        localStorage.setItem('cognicore_reduce_flashes', 'true');
      }
      localStorage.setItem('cognicore_seizure_disclaimer', 'true');

      // Clear ?disclaimer query param if present
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        if (url.searchParams.has('disclaimer')) {
          url.searchParams.delete('disclaimer');
          window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
        }
      }
    } catch (err) {
      console.error('Error in handleAccept:', err);
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(2, 6, 23, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(0.75rem, 2vh, 1.25rem)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid rgba(239, 68, 68, 0.45)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '94vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.35), 0 0 30px rgba(239, 68, 68, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(1.25rem, 3vh, 1.75rem)',
        textAlign: 'center',
        margin: 'auto',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Warning Icon Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '0.75rem',
          flexShrink: 0
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)'
          }}>
            <GameIcon name="warning" size="1.4em" />
          </div>
        </div>

        <h2 style={{
          fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
          fontWeight: '700',
          color: '#f8fafc',
          margin: '0 0 1rem 0',
          letterSpacing: '0.015em',
          flexShrink: 0
        }}>
          Photosensitivity Warning
        </h2>

        {/* Text Container with natural height to prevent clipping */}
        <div style={{
          width: '100%',
          marginBottom: '1.25rem',
          textAlign: 'left'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            marginBottom: '0.75rem'
          }}>
            <p style={{ color: '#f1f5f9', fontSize: '0.85rem', lineHeight: '1.55', margin: 0 }}>
              CogniCore contains intense visual patterns, rapidly flashing colors, and animations that may trigger seizures in people with photosensitive epilepsy.
            </p>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.825rem', lineHeight: '1.55', margin: 0 }}>
            If you or anyone in your family has an epileptic condition, consult your physician before playing. If you experience dizziness, altered vision, eye or muscle twitches, or involuntary movements, <strong style={{ color: '#f87171' }}>stop playing immediately</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          flexShrink: 0
        }}>
          <button
            onClick={() => handleAccept(false)}
            style={{
              background: 'linear-gradient(to right, #38bdf8, #818cf8)',
              color: '#0f172a',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.925rem',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, filter 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.25)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.filter = 'brightness(1.08)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.filter = 'none';
            }}
          >
            I Understand — Continue Normally
          </button>
          
          <button
            onClick={() => handleAccept(true)}
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              color: '#10b981',
              border: '1.5px solid #10b981',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.18)';
              e.currentTarget.style.borderColor = '#34d399';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
          >
            <GameIcon name="check" size="1.1em" inline={true} />
            Enable Seizure-Safe Mode (Reduce Flashes)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeizureDisclaimerModal;

import React, { useState, useEffect } from 'react';
import useCogniStore from '../store/useCogniStore';

const SeizureDisclaimerModal = () => {
  const [show, setShow] = useState(false);
  const { setReduceFlashes } = useCogniStore();

  useEffect(() => {
    const accepted = localStorage.getItem('cognicore_seizure_disclaimer');
    if (!accepted) {
      setShow(true);
    }
  }, []);

  const handleAccept = (safeMode) => {
    if (safeMode) {
      setReduceFlashes(true);
    }
    localStorage.setItem('cognicore_seizure_disclaimer', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(2, 6, 23, 0.95)',
      backdropFilter: 'blur(12px)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid #ef4444',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2.5rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '1rem' }}>Photosensitivity Warning</h2>
        <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          CogniCore contains intense visual patterns, rapidly flashing colors, and animations that may trigger seizures in people with photosensitive epilepsy. 
          <br /><br />
          If you or anyone in your family has an epileptic condition, consult your physician before playing. If you experience dizziness, altered vision, eye or muscle twitches, or any involuntary movements, <strong>stop playing immediately</strong>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={() => handleAccept(false)}
            style={{
              background: 'linear-gradient(to right, var(--color-primary), #60a5fa)',
              color: '#0f172a',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
          >
            I Understand - Continue Normally
          </button>
          
          <button
            onClick={() => handleAccept(true)}
            style={{
              background: 'transparent',
              color: '#10b981',
              border: '2px solid #10b981',
              padding: '1rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.target.style.background = 'rgba(16, 185, 129, 0.1)'}
            onMouseOut={e => e.target.style.background = 'transparent'}
          >
            Enable Seizure-Safe Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeizureDisclaimerModal;

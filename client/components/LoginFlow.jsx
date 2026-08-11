import React, { useState } from 'react';

export default function LoginFlow({
  usernameInput,
  setUsernameInput,
  assessmentError,
  assessmentLoading,
  handleCheckUserStatus
}) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '2.5rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img src="/logo.png" alt="CogniCore" style={{ maxWidth: '380px', width: '100%', height: 'auto', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 6px 24px rgba(168, 85, 247, 0.5))' }} />
      </div>
      <h2 style={{ color: '#ffffff', margin: '0.5rem 0 0.5rem 0', textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.05em', fontWeight: 'bold' }}>TRAINING PORTAL</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 2rem 0', textAlign: 'center', lineHeight: '1.5' }}>
        Enter your researcher-assigned username to synchronize session telemetry, check pre-test status, or launch training loops.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Subject Username</label>
          <input 
            type="text" 
            value={usernameInput} 
            onChange={(e) => setUsernameInput(e.target.value)} 
            placeholder="e.g. subject_01" 
            style={{ background: '#09090b', border: '1.5px solid rgba(168, 85, 247, 0.4)', borderRadius: '8px', color: '#ffffff', padding: '0.75rem', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !assessmentLoading && agreed) {
                handleCheckUserStatus(usernameInput);
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.5rem' }}>
          <input 
            type="checkbox" 
            id="disclaimerAgree" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)} 
            style={{ marginTop: '0.25rem', transform: 'scale(1.2)', accentColor: '#a855f7', cursor: 'pointer' }}
          />
          <label htmlFor="disclaimerAgree" style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4', cursor: 'pointer' }}>
            I acknowledge the Cognitive Training Medical Disclaimer and consent to performance telemetry collection.
          </label>
        </div>

        {assessmentError && <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ {assessmentError}</div>}
        <button
          onClick={() => { if(agreed) handleCheckUserStatus(usernameInput); }}
          disabled={assessmentLoading || !agreed}
          style={{ background: agreed ? 'linear-gradient(to right, #38bdf8, #a855f7)' : '#334155', color: agreed ? '#ffffff' : '#94a3b8', border: 'none', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem', fontWeight: 'bold', cursor: agreed ? 'pointer' : 'not-allowed', transition: 'all 0.2s', width: '100%', boxShadow: agreed ? '0 4px 12px rgba(168, 85, 247, 0.3)' : 'none' }}
          onMouseOver={(e) => { if(agreed) e.target.style.filter = 'brightness(1.15)' }}
          onMouseOut={(e) => { if(agreed) e.target.style.filter = 'brightness(1.0)' }}
        >
          {assessmentLoading ? 'Verifying Profile...' : 'Begin Cognitive Evaluation'}
        </button>
      </div>
    </div>
  );
}

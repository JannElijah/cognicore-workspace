import React, { useState } from 'react';

export default function LoginFlow({
  usernameInput,
  setUsernameInput,
  assessmentError,
  assessmentLoading,
  handleCheckUserStatus
}) {
  const [agreed, setAgreed] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [course, setCourse] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [pwdStatus, setPwdStatus] = useState('');

  const submitLogin = () => {
    if (!agreed) return;
    if (isAnonymous) {
      if (!course || !age || !gender || !pwdStatus) {
        alert("Please fill in Course, Age, Gender, and PWD Status for anonymous registration.");
        return;
      }
      const guestId = 'Anon_' + Math.random().toString(36).substring(2, 6).toUpperCase();
      setUsernameInput(guestId);
      handleCheckUserStatus(guestId, course, age, gender, pwdStatus);
    } else {
      handleCheckUserStatus(usernameInput);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '2.5rem', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(var(--rgb-secondary), 0.3)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img src="/logo.png" alt="CogniCore" style={{ maxWidth: '380px', width: '100%', height: 'auto', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 6px 24px rgba(var(--rgb-secondary), 0.5))' }} />
      </div>
      <h2 style={{ color: '#ffffff', margin: '0.5rem 0 0.5rem 0', textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.05em', fontWeight: 'bold' }}>TRAINING PORTAL</h2>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.3rem' }}>
        <button 
          onClick={() => setIsAnonymous(false)}
          style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', background: !isAnonymous ? 'rgba(255,255,255,0.1)' : 'transparent', color: !isAnonymous ? '#fff' : '#94a3b8' }}
        >Standard Login</button>
        <button 
          onClick={() => setIsAnonymous(true)}
          style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', background: isAnonymous ? 'rgba(255,255,255,0.1)' : 'transparent', color: isAnonymous ? '#fff' : '#94a3b8' }}
        >Anonymous Participant</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {!isAnonymous ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Subject Username</label>
            <input 
              type="text" 
              value={usernameInput} 
              onChange={(e) => setUsernameInput(e.target.value)} 
              placeholder="e.g. subject_01" 
              style={{ background: '#09090b', border: '1.5px solid rgba(var(--rgb-secondary), 0.4)', borderRadius: '8px', color: '#ffffff', padding: '0.75rem', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !assessmentLoading && agreed) {
                  submitLogin();
                }
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.5rem 0', lineHeight: '1.4' }}>
              Your identity will remain completely anonymous. We only collect the demographic data below for cohort analysis.
            </p>
            <input type="text" placeholder="Course / Program (e.g. BSCS)" value={course} onChange={e=>setCourse(e.target.value)} style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', padding: '0.7rem', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
              <input type="number" placeholder="Age" value={age} onChange={e=>setAge(e.target.value)} style={{ flex: 1, minWidth: 0, background: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', padding: '0.7rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              <select value={gender} onChange={e=>setGender(e.target.value)} style={{ flex: 1, minWidth: 0, background: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', padding: '0.7rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}>
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <select value={pwdStatus} onChange={e=>setPwdStatus(e.target.value)} style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', padding: '0.7rem', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}>
              <option value="" disabled>PWD Status (Person with Disability)</option>
              <option value="None">None</option>
              <option value="Visual Impairment">Visual Impairment</option>
              <option value="Hearing Impairment">Hearing Impairment</option>
              <option value="Motor/Physical Disability">Motor/Physical Disability</option>
              <option value="Cognitive/Learning Disability">Cognitive/Learning Disability</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.5rem' }}>
          <input 
            type="checkbox" 
            id="disclaimerAgree" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)} 
            style={{ marginTop: '0.25rem', transform: 'scale(1.2)', accentColor: 'var(--color-secondary)', cursor: 'pointer' }}
          />
          <label htmlFor="disclaimerAgree" style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4', cursor: 'pointer' }}>
            <strong>Data Privacy Agreement:</strong> I acknowledge that my performance telemetry and assessment results will be collected and strictly used for academic research purposes only.
          </label>
        </div>

        {assessmentError && <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ {assessmentError}</div>}
        
        <button
          onClick={submitLogin}
          disabled={assessmentLoading || !agreed}
          style={{ background: agreed ? 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' : '#334155', color: agreed ? '#ffffff' : '#94a3b8', border: 'none', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem', fontWeight: 'bold', cursor: agreed ? 'pointer' : 'not-allowed', transition: 'all 0.2s', width: '100%', boxShadow: agreed ? '0 4px 12px rgba(var(--rgb-secondary), 0.3)' : 'none', marginTop: '0.5rem' }}
          onMouseOver={(e) => { if(agreed) e.target.style.filter = 'brightness(1.15)' }}
          onMouseOut={(e) => { if(agreed) e.target.style.filter = 'brightness(1.0)' }}
        >
          {assessmentLoading ? 'Verifying Profile...' : 'Begin Cognitive Evaluation'}
        </button>
      </div>
    </div>
  );
}


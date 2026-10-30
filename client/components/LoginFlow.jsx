import React, { useState, useRef } from 'react';
import useDeviceDetect from '../hooks/useDeviceDetect';

export default function LoginFlow({
  usernameInput,
  setUsernameInput,
  assessmentError,
  assessmentLoading,
  handleCheckUserStatus,
  authSuccessMessage,
  isMobile: isMobileProp
}) {
  const device = useDeviceDetect();
  const isMobile = isMobileProp !== undefined ? isMobileProp : device.isMobile;
  const [showMobileRoadmap, setShowMobileRoadmap] = useState(false);

  const [agreed, setAgreed] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [course, setCourse] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [pwdStatus, setPwdStatus] = useState('');
  const [formError, setFormError] = useState('');
  const [highlightPortal, setHighlightPortal] = useState(false);

  const usernameRef = useRef(null);
  const portalRef = useRef(null);

  const triggerPortalFocus = () => {
    setHighlightPortal(true);
    setTimeout(() => setHighlightPortal(false), 1200);
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
    if (portalRef.current && window.innerWidth < 1024) {
      portalRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const submitLogin = () => {
    setFormError('');
    if (!agreed) {
      setFormError("Please agree to the Data Privacy Agreement before proceeding.");
      return;
    }
    if (isAnonymous) {
      if (!course || !age || !gender || !pwdStatus) {
        setFormError("Please fill in Course, Age, Gender, and PWD Status. You may select 'Prefer not to say'.");
        return;
      }
      const guestId = 'Anon_' + Math.random().toString(36).substring(2, 6).toUpperCase();
      setUsernameInput(guestId);
      handleCheckUserStatus(guestId, course, age, gender, pwdStatus, null, false);
    } else {
      if (!usernameInput) {
        setFormError("Subject username is required.");
        return;
      }
      if (!passwordInput) {
        setFormError("Password is required.");
        return;
      }
      if (isSignUp && passwordInput !== confirmPasswordInput) {
        setFormError("Passwords do not match.");
        return;
      }
      handleCheckUserStatus(usernameInput, null, null, null, null, passwordInput, isSignUp);
    }
  };

  // Reusable Research Roadmap Component (Desktop & Mobile)
  const renderResearchRoadmap = (isMobileMode = false) => (
    <div 
      className={isMobileMode ? "cognicore-mobile-roadmap" : "cognicore-desktop-roadmap"}
      style={{
        flex: '1.4',
        minWidth: isMobileMode ? '100%' : 'min(100%, 560px)',
        maxWidth: isMobileMode ? '100%' : '740px',
        width: '100%',
        margin: isMobileMode ? '0.75rem auto 0 auto' : '0',
        display: isMobileMode && !showMobileRoadmap ? 'none' : 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '0.5rem',
        padding: '0 0.25rem'
      }}>
        <div style={{
          fontSize: '1.05rem',
          fontWeight: '900',
          letterSpacing: '0.12em',
          color: '#ffffff',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textShadow: '0 0 12px rgba(0, 240, 255, 0.4)'
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#00f0ff',
            boxShadow: '0 0 8px #00f0ff, 0 0 14px #00f0ff'
          }} />
          RESEARCH ROADMAP
        </div>
      </div>

      {/* Outer Glass Card */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(155deg, rgba(12, 19, 36, 0.94) 0%, rgba(6, 10, 22, 0.98) 100%)',
        border: '1.5px solid rgba(0, 240, 255, 0.45)',
        borderRadius: '16px',
        padding: isMobileMode ? '1.5rem 0.75rem 0.85rem 0.75rem' : '1.65rem 1.35rem 1rem 1.35rem',
        boxShadow: '0 0 25px rgba(0, 240, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 20px 50px rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        boxSizing: 'border-box'
      }}>
        {/* Top Center Floating Badge */}
        <div style={{
          position: 'absolute',
          top: '-13px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#060a14',
          border: '1.5px solid #00f0ff',
          borderRadius: '9999px',
          padding: '0.28rem 1.25rem',
          color: '#00f0ff',
          fontSize: '0.72rem',
          fontWeight: '900',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          boxShadow: '0 0 18px rgba(0, 240, 255, 0.45), inset 0 0 10px rgba(0, 240, 255, 0.2)',
          textShadow: '0 0 8px rgba(0, 240, 255, 0.8)',
          whiteSpace: 'nowrap'
        }}>
          Cognitive Research Pipeline
        </div>

        {/* Top Right Mini Indicators */}
        <div style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', display: 'flex', gap: '4px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }} />
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 6px #818cf8' }} />
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#d946ef', boxShadow: '0 0 6px #d946ef' }} />
        </div>

        {/* Timeline Spine & 3 Stages */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
          marginTop: '0.1rem'
        }}>
          {/* Continuous Vertical Timeline Spine */}
          <div style={{
            position: 'absolute',
            left: isMobileMode ? '17px' : '21px',
            top: '24px',
            bottom: '24px',
            width: '2px',
            background: 'linear-gradient(to bottom, #00f0ff 0%, #d946ef 50%, #10b981 100%)',
            boxShadow: '0 0 6px rgba(0, 240, 255, 0.6)',
            zIndex: 1
          }} />

          {/* ---------------- STAGE 01 ---------------- */}
          <div style={{ display: 'flex', alignItems: isMobileMode ? 'flex-start' : 'center', gap: isMobileMode ? '0.65rem' : '0.9rem', position: 'relative', zIndex: 2 }}>
            <div style={{
              width: isMobileMode ? '36px' : '44px',
              height: isMobileMode ? '36px' : '44px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(18, 30, 58, 0.95) 0%, rgba(6, 12, 26, 0.98) 100%)',
              border: '1.5px solid #00f0ff',
              boxShadow: '0 0 16px rgba(0, 240, 255, 0.4), inset 0 0 10px rgba(0, 240, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: isMobileMode ? '0.35rem' : '0',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-4px',
                background: '#020617',
                border: '1px solid #00f0ff',
                color: '#00f0ff',
                fontSize: '0.52rem',
                fontWeight: '900',
                padding: '0 4px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                boxShadow: '0 0 6px rgba(0, 240, 255, 0.6)'
              }}>
                01
              </span>
              <svg width={isMobileMode ? "17" : "21"} height={isMobileMode ? "17" : "21"} viewBox="0 0 24 24" fill="none">
                <rect x="5" y="4" width="14" height="17" rx="3" stroke="#00f0ff" strokeWidth="1.8" />
                <path d="M9 2H15C15.5523 2 16 2.44772 16 3V4C16 4.55228 15.5523 5 15 5H9C8.44772 5 8 4.55228 8 4V3C8 2.44772 8.44772 2 9 2Z" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="1.5" />
                <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{
              flex: 1,
              minWidth: 0,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              borderRadius: '12px',
              padding: isMobileMode ? '0.65rem 0.75rem' : '0.75rem 1.1rem',
              display: 'flex',
              flexDirection: isMobileMode ? 'column' : 'row',
              alignItems: isMobileMode ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: isMobileMode ? '0.65rem' : '0.9rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(0, 240, 255, 0.04)',
              boxSizing: 'border-box'
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: isMobileMode ? '0.82rem' : '0.88rem',
                  fontWeight: '900',
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                  marginBottom: '0.18rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  flexWrap: 'wrap'
                }}>
                  <span>STAGE 01: PRE-TEST ASSESSMENT</span>
                  <span style={{ fontSize: '0.62rem', background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                    BASELINE
                  </span>
                </div>
                <div style={{
                  fontSize: isMobileMode ? '0.74rem' : '0.78rem',
                  color: '#cbd5e1',
                  lineHeight: '1.4'
                }}>
                  Complete the initial psychometric inventory to establish your baseline and uncover specific skill vectors.
                </div>
              </div>

              <button
                type="button"
                onClick={triggerPortalFocus}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
                  border: '1.5px solid #00f0ff',
                  color: '#00f0ff',
                  padding: isMobileMode ? '0.45rem 0.5rem' : '0.45rem 1rem',
                  borderRadius: isMobileMode ? '8px' : '9999px',
                  fontSize: isMobileMode ? '0.62rem' : '0.72rem',
                  fontWeight: '900',
                  letterSpacing: isMobileMode ? '0.02em' : '0.06em',
                  cursor: 'pointer',
                  whiteSpace: 'normal',
                  boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  width: isMobileMode ? '100%' : 'auto',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  textAlign: 'center',
                  lineHeight: '1.25'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#00f0ff';
                  e.currentTarget.style.color = '#020617';
                  e.currentTarget.style.boxShadow = '0 0 18px rgba(0, 240, 255, 0.8)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)';
                  e.currentTarget.style.color = '#00f0ff';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                START BASELINE →
              </button>
            </div>
          </div>

          {/* ---------------- STAGE 02 ---------------- */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobileMode ? '0.65rem' : '0.9rem', position: 'relative', zIndex: 2 }}>
            <div style={{
              width: isMobileMode ? '36px' : '44px',
              height: isMobileMode ? '36px' : '44px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(40, 16, 52, 0.95) 0%, rgba(14, 8, 26, 0.98) 100%)',
              border: '1.5px solid #e879f9',
              boxShadow: '0 0 16px rgba(232, 121, 249, 0.45), inset 0 0 10px rgba(232, 121, 249, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: isMobileMode ? '0.35rem' : '0.5rem',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-4px',
                background: '#020617',
                border: '1px solid #e879f9',
                color: '#e879f9',
                fontSize: '0.52rem',
                fontWeight: '900',
                padding: '0 4px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                boxShadow: '0 0 6px rgba(232, 121, 249, 0.6)'
              }}>
                02
              </span>
              <svg width={isMobileMode ? "18" : "22"} height={isMobileMode ? "18" : "22"} viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="12" rx="6" stroke="#e879f9" strokeWidth="1.8" fill="rgba(232, 121, 249, 0.12)" />
                <line x1="6" y1="12" x2="10" y2="12" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="10" x2="8" y2="14" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" />
                <circle cx="15" cy="13" r="1.3" fill="#e879f9" />
                <circle cx="18" cy="11" r="1.3" fill="#e879f9" />
              </svg>
            </div>

            <div style={{
              flex: 1,
              minWidth: 0,
              background: 'linear-gradient(145deg, rgba(20, 16, 40, 0.9) 0%, rgba(12, 16, 32, 0.92) 100%)',
              border: '1.5px solid rgba(217, 70, 239, 0.55)',
              borderRadius: '12px',
              padding: isMobileMode ? '0.75rem 0.85rem' : '0.85rem 1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(217, 70, 239, 0.08)',
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{
                  fontSize: isMobileMode ? '0.82rem' : '0.88rem',
                  fontWeight: '900',
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                  marginBottom: '0.18rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  flexWrap: 'wrap'
                }}>
                  <span>STAGE 02: ADAPTIVE TRAINING</span>
                  <span style={{ fontSize: '0.62rem', background: 'rgba(217, 70, 239, 0.2)', color: '#f472b6', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(217, 70, 239, 0.4)' }}>
                    CLOSED-LOOP DDA
                  </span>
                </div>
                <div style={{
                  fontSize: isMobileMode ? '0.74rem' : '0.78rem',
                  color: '#cbd5e1',
                  lineHeight: '1.4'
                }}>
                  Engage with interactive Phaser 3 game scenes continuously modulated in real-time by IRT and Elo dynamic difficulty.
                </div>
              </div>

              {/* 4 Connected Domains: 2x2 Grid on Mobile, Flex on Desktop */}
              <div style={{
                display: isMobileMode ? 'grid' : 'flex',
                gridTemplateColumns: isMobileMode ? 'repeat(2, 1fr)' : undefined,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: isMobileMode ? '0.5rem' : '0.4rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {/* Domain 1: Spatial-Visual */}
                <div style={{
                  background: 'rgba(2, 6, 23, 0.65)',
                  border: '1px solid rgba(0, 240, 255, 0.35)',
                  borderRadius: '8px',
                  padding: '0.35rem 0.55rem',
                  textAlign: 'center',
                  flex: isMobileMode ? undefined : 1,
                  minWidth: isMobileMode ? '0' : '78px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ color: '#00f0ff', marginBottom: '2px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', filter: 'drop-shadow(0 0 4px #00f0ff)' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 12h18M12 3v18" />
                    </svg>
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.15' }}>
                    Spatial-Visual<br />Memory
                  </div>
                </div>

                {/* Connector 1 (Desktop Only) */}
                {!isMobileMode && (
                  <div style={{ display: 'flex', alignItems: 'center', opacity: 0.8, flexShrink: 0 }}>
                    <div style={{ width: '6px', height: '1.5px', background: '#00f0ff' }} />
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }} />
                    <div style={{ width: '6px', height: '1.5px', background: '#00f0ff' }} />
                  </div>
                )}

                {/* Domain 2: Logical Math */}
                <div style={{
                  background: 'rgba(2, 6, 23, 0.65)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '8px',
                  padding: '0.35rem 0.55rem',
                  textAlign: 'center',
                  flex: isMobileMode ? undefined : 1,
                  minWidth: isMobileMode ? '0' : '78px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ color: '#38bdf8', marginBottom: '2px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', filter: 'drop-shadow(0 0 4px #38bdf8)' }}>
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.15' }}>
                    Logical<br />Math
                  </div>
                </div>

                {/* Connector 2 (Desktop Only) */}
                {!isMobileMode && (
                  <div style={{ display: 'flex', alignItems: 'center', opacity: 0.8, flexShrink: 0 }}>
                    <div style={{ width: '6px', height: '1.5px', background: '#00f0ff' }} />
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }} />
                    <div style={{ width: '6px', height: '1.5px', background: '#00f0ff' }} />
                  </div>
                )}

                {/* Domain 3: Reflex & Focus */}
                <div style={{
                  background: 'rgba(2, 6, 23, 0.65)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  borderRadius: '8px',
                  padding: '0.35rem 0.55rem',
                  textAlign: 'center',
                  flex: isMobileMode ? undefined : 1,
                  minWidth: isMobileMode ? '0' : '78px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ color: '#f43f5e', marginBottom: '2px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', filter: 'drop-shadow(0 0 4px #f43f5e)' }}>
                      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.15' }}>
                    Reflex<br />&amp; Focus
                  </div>
                </div>

                {/* Connector 3 (Desktop Only) */}
                {!isMobileMode && (
                  <div style={{ display: 'flex', alignItems: 'center', opacity: 0.8, flexShrink: 0 }}>
                    <div style={{ width: '6px', height: '1.5px', background: '#00f0ff' }} />
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 4px #00f0ff' }} />
                    <div style={{ width: '6px', height: '1.5px', background: '#00f0ff' }} />
                  </div>
                )}

                {/* Domain 4: Executive Strategy */}
                <div style={{
                  background: 'rgba(2, 6, 23, 0.65)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '8px',
                  padding: '0.35rem 0.55rem',
                  textAlign: 'center',
                  flex: isMobileMode ? undefined : 1,
                  minWidth: isMobileMode ? '0' : '78px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ color: '#10b981', marginBottom: '2px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', filter: 'drop-shadow(0 0 4px #10b981)' }}>
                      <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.15' }}>
                    Executive<br />Strategy
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------- STAGE 03 ---------------- */}
          <div style={{ display: 'flex', alignItems: isMobileMode ? 'flex-start' : 'center', gap: isMobileMode ? '0.65rem' : '0.9rem', position: 'relative', zIndex: 2 }}>
            <div style={{
              width: isMobileMode ? '36px' : '44px',
              height: isMobileMode ? '36px' : '44px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(10, 36, 28, 0.95) 0%, rgba(6, 16, 14, 0.98) 100%)',
              border: '1.5px solid #10b981',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.45), inset 0 0 10px rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: isMobileMode ? '0.35rem' : '0',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-4px',
                background: '#020617',
                border: '1px solid #10b981',
                color: '#10b981',
                fontSize: '0.52rem',
                fontWeight: '900',
                padding: '0 4px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
              }}>
                03
              </span>
              <svg width={isMobileMode ? "17" : "21"} height={isMobileMode ? "17" : "21"} viewBox="0 0 24 24" fill="none">
                <rect x="4" y="14" width="3.5" height="7" rx="1" fill="#00f0ff" fillOpacity="0.75" />
                <rect x="10.25" y="10" width="3.5" height="11" rx="1" fill="#38bdf8" fillOpacity="0.85" />
                <rect x="16.5" y="5" width="3.5" height="16" rx="1" fill="#10b981" />
                <path d="M4 11L10.5 6L14 8.5L20 3" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16.5 3H20V6.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{
              flex: 1,
              minWidth: 0,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              borderRadius: '12px',
              padding: isMobileMode ? '0.65rem 0.75rem' : '0.75rem 1.1rem',
              display: 'flex',
              flexDirection: isMobileMode ? 'column' : 'row',
              alignItems: isMobileMode ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: isMobileMode ? '0.65rem' : '0.9rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(0, 240, 255, 0.04)',
              boxSizing: 'border-box'
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: isMobileMode ? '0.82rem' : '0.88rem',
                  fontWeight: '900',
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                  marginBottom: '0.18rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  flexWrap: 'wrap'
                }}>
                  <span>STAGE 03: POST-TEST EVALUATION</span>
                  <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    VERIFY
                  </span>
                </div>
                <div style={{
                  fontSize: isMobileMode ? '0.74rem' : '0.78rem',
                  color: '#cbd5e1',
                  lineHeight: '1.4'
                }}>
                  Retake the post-test after training to analyze, visualize, and prove statistically significant cognitive progression.
                </div>
              </div>

              <button
                type="button"
                onClick={triggerPortalFocus}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
                  border: '1.5px solid #00f0ff',
                  color: '#00f0ff',
                  padding: isMobileMode ? '0.45rem 0.5rem' : '0.45rem 1rem',
                  borderRadius: isMobileMode ? '8px' : '9999px',
                  fontSize: isMobileMode ? '0.62rem' : '0.72rem',
                  fontWeight: '900',
                  letterSpacing: isMobileMode ? '0.02em' : '0.06em',
                  cursor: 'pointer',
                  whiteSpace: 'normal',
                  boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  width: isMobileMode ? '100%' : 'auto',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  textAlign: 'center',
                  lineHeight: '1.25'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#00f0ff';
                  e.currentTarget.style.color = '#020617';
                  e.currentTarget.style.boxShadow = '0 0 18px rgba(0, 240, 255, 0.8)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)';
                  e.currentTarget.style.color = '#00f0ff';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                MEASURE IMPROVEMENT →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom HUD: Scientific Telemetry Bracket + Live Waveform */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.85rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '0.85rem',
          flexWrap: isMobileMode ? 'wrap' : 'nowrap'
        }}>
          <div style={{
            position: 'relative',
            padding: '0.4rem 0.75rem',
            background: 'rgba(0, 240, 255, 0.04)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '6px',
            flex: isMobileMode ? 1 : undefined,
            minWidth: 0
          }}>
            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '6px', height: '6px', borderTop: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff' }} />
            <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '6px', height: '6px', borderBottom: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff' }} />
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', borderTop: '2px solid #00f0ff', borderRight: '2px solid #00f0ff' }} />
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '6px', height: '6px', borderBottom: '2px solid #00f0ff', borderRight: '2px solid #00f0ff' }} />

            <div style={{ fontSize: '0.68rem', fontWeight: '900', color: '#f8fafc', letterSpacing: '0.06em' }}>
              RESEARCH NODE: <span style={{ color: '#10b981', textShadow: '0 0 8px #10b981' }}>ONLINE</span>
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: '900', color: '#cbd5e1', letterSpacing: '0.06em', marginTop: '1px' }}>
              COHORT DATA INGEST <span style={{ color: '#00f0ff', textShadow: '0 0 8px #00f0ff' }}>ACTIVE</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: isMobileMode ? 'center' : 'flex-end' }}>
            <div style={{
              width: isMobileMode ? '80px' : '95px',
              height: '30px',
              background: 'rgba(4, 8, 20, 0.95)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '6px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8)'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 95 32" preserveAspectRatio="none">
                <line x1="0" y1="8" x2="95" y2="8" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                <line x1="0" y1="16" x2="95" y2="16" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                <line x1="0" y1="24" x2="95" y2="24" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                <line x1="24" y1="0" x2="24" y2="32" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                <line x1="48" y1="0" x2="48" y2="32" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                <line x1="72" y1="0" x2="72" y2="32" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                <path d="M0 18 L25 18 L30 8 L36 24 L42 12 L50 18 L60 18 L66 6 L72 18 L95 18" fill="none" stroke="#00f0ff" strokeWidth="1.8" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }} />
              </svg>
            </div>

            <div style={{
              width: '50px',
              height: '30px',
              background: 'rgba(4, 8, 20, 0.95)',
              border: '1px solid rgba(217, 70, 239, 0.3)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '3px',
              padding: '3px 4px',
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8)'
            }}>
              <div style={{ width: '5px', height: '10px', background: 'rgba(217, 70, 239, 0.5)', borderRadius: '1px' }} />
              <div style={{ width: '5px', height: '16px', background: 'rgba(217, 70, 239, 0.85)', borderRadius: '1px' }} />
              <div style={{ width: '5px', height: '24px', background: '#00f0ff', borderRadius: '1px', boxShadow: '0 0 6px #00f0ff' }} />
              <div style={{ width: '5px', height: '12px', background: 'rgba(217, 70, 239, 0.65)', borderRadius: '1px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      maxWidth: '1360px',
      margin: '0.35rem auto 1rem auto',
      padding: '0 1rem',
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Responsive Styles for Desktop vs Mobile */}
      <style>{`
        @media (max-width: 1023px) {
          .cognicore-desktop-roadmap {
            display: none !important;
          }
          .cognicore-portal-column {
            width: 100% !important;
            max-width: 440px !important;
            margin: 0 auto !important;
          }
        }
        @media (min-width: 1024px) {
          .cognicore-mobile-roadmap-toggle,
          .cognicore-mobile-roadmap {
            display: none !important;
          }
          .cognicore-desktop-roadmap {
            display: flex !important;
          }
        }
      `}</style>

      {/* Background Cyber Constellation Network */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        left: '0',
        right: '0',
        bottom: '-10px',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.22,
        overflow: 'hidden'
      }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="cyberGlow" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.32" />
              <stop offset="45%" stopColor="#06b6d4" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
            <pattern id="dotGrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.1" fill="#38bdf8" fillOpacity="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" />
          <rect width="100%" height="100%" fill="url(#cyberGlow)" />
          <line x1="8%" y1="18%" x2="28%" y2="42%" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" />
          <line x1="28%" y1="42%" x2="48%" y2="24%" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.3" />
          <line x1="48%" y1="24%" x2="68%" y2="48%" stroke="#c084fc" strokeWidth="1" strokeOpacity="0.25" />
          <line x1="68%" y1="48%" x2="92%" y2="32%" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.25" />
          <circle cx="28%" cy="42%" r="3" fill="#38bdf8" />
          <circle cx="48%" cy="24%" r="3" fill="#c084fc" />
          <circle cx="68%" cy="48%" r="3" fill="#38bdf8" />
        </svg>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        gap: '1.35rem',
        alignItems: 'stretch',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* ========================================================================= */}
        {/* DESKTOP: RESEARCH ROADMAP (Shown side-by-side on >= 1024px)               */}
        {/* ========================================================================= */}
        {renderResearchRoadmap(false)}

        {/* ========================================================================= */}
        {/* TRAINING PORTAL (AUTHENTICATION & ONBOARDING) - Primary on Mobile & PC     */}
        {/* ========================================================================= */}
        <div 
          ref={portalRef}
          className="cognicore-portal-column"
          style={{
            flex: '1',
            maxWidth: '430px',
            minWidth: 'min(100%, 320px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header Title aligned with left on desktop */}
          <div style={{
            fontSize: '1.05rem',
            fontWeight: '900',
            letterSpacing: '0.12em',
            color: 'transparent',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            userSelect: 'none',
            padding: '0 0.25rem',
            display: isMobile ? 'none' : 'block'
          }}>
            PORTAL ACCESS
          </div>

          <div style={{
            position: 'relative',
            background: 'linear-gradient(155deg, rgba(14, 20, 38, 0.95) 0%, rgba(8, 12, 24, 0.98) 100%)',
            border: highlightPortal ? '2px solid #00f0ff' : '1.5px solid rgba(168, 85, 247, 0.5)',
            borderRadius: '16px',
            padding: '1.25rem 1.4rem 1rem 1.4rem',
            boxShadow: highlightPortal 
              ? '0 0 35px rgba(0, 240, 255, 0.5), 0 20px 50px rgba(0, 0, 0, 0.85)' 
              : '0 0 25px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 20px 50px rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1
          }}>
            {/* Top Logo */}
            <div style={{ textAlign: 'center', marginBottom: '0.4rem' }}>
              <img
                src="/logo.png"
                alt="CogniCore"
                style={{
                  maxHeight: '38px',
                  width: 'auto',
                  margin: '0 auto',
                  display: 'block',
                  filter: 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.6))'
                }}
              />
            </div>

            <h2 style={{
              color: '#ffffff',
              margin: '0 0 0.65rem 0',
              textAlign: 'center',
              fontSize: '1.05rem',
              letterSpacing: '0.12em',
              fontWeight: '900',
              textTransform: 'uppercase',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}>
              TRAINING PORTAL
            </h2>

            {/* Segmented Control: Standard Login vs Anonymous Participant */}
            <div style={{
              display: 'flex',
              gap: '0.35rem',
              marginBottom: '0.65rem',
              background: 'rgba(2, 6, 23, 0.8)',
              borderRadius: '8px',
              padding: '0.25rem',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                type="button"
                onClick={() => setIsAnonymous(false)}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.3rem',
                  border: !isAnonymous ? '1px solid #00f0ff' : '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '0.76rem',
                  letterSpacing: '0.03em',
                  background: !isAnonymous ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                  color: !isAnonymous ? '#ffffff' : '#94a3b8',
                  boxShadow: !isAnonymous ? '0 0 10px rgba(0, 240, 255, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Standard Login
              </button>
              <button
                type="button"
                onClick={() => setIsAnonymous(true)}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.3rem',
                  border: isAnonymous ? '1px solid #d946ef' : '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '0.76rem',
                  letterSpacing: '0.03em',
                  background: isAnonymous ? 'rgba(217, 70, 239, 0.2)' : 'transparent',
                  color: isAnonymous ? '#ffffff' : '#94a3b8',
                  boxShadow: isAnonymous ? '0 0 10px rgba(217, 70, 239, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Anonymous Participant
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {!isAnonymous ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {/* Sub-Toggle: Log In vs Create Account */}
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    background: 'rgba(2, 6, 23, 0.6)',
                    borderRadius: '6px',
                    padding: '0.2rem',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      style={{
                        flex: 1,
                        padding: '0.35rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.74rem',
                        background: !isSignUp ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                        color: !isSignUp ? '#ffffff' : '#94a3b8'
                      }}
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      style={{
                        flex: 1,
                        padding: '0.35rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.74rem',
                        background: isSignUp ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                        color: isSignUp ? '#ffffff' : '#94a3b8'
                      }}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* Subject Username Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <label style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      SUBJECT USERNAME
                    </label>
                    <input
                      ref={usernameRef}
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="e.g. subject_01"
                      style={{
                        height: '38px',
                        background: 'rgba(2, 6, 23, 0.85)',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        padding: '0 0.75rem',
                        fontSize: '0.88rem',
                        fontWeight: '600',
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.6)'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#00f0ff'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)'}
                    />
                  </div>

                  {/* Password Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <label style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      PASSWORD
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter password"
                        style={{
                          height: '38px',
                          background: 'rgba(2, 6, 23, 0.85)',
                          border: '1px solid rgba(168, 85, 247, 0.5)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          padding: '0 2.2rem 0 0.75rem',
                          fontSize: '0.88rem',
                          fontWeight: '600',
                          outline: 'none',
                          width: '100%',
                          boxSizing: 'border-box',
                          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.6)'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = '#00f0ff'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)'}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !assessmentLoading && agreed) {
                            submitLogin();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.45rem',
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.25rem',
                          outline: 'none'
                        }}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="23" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        CONFIRM PASSWORD
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          placeholder="Confirm password"
                          style={{
                            height: '38px',
                            background: 'rgba(2, 6, 23, 0.85)',
                            border: '1px solid rgba(168, 85, 247, 0.5)',
                            borderRadius: '6px',
                            color: '#ffffff',
                            padding: '0 2.2rem 0 0.75rem',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = '#00f0ff'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)'}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !assessmentLoading && agreed) {
                              submitLogin();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '0.45rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.25rem',
                            outline: 'none'
                          }}
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                              <line x1="1" y1="23" x2="23" y2="23"></line>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <p style={{ color: '#cbd5e1', fontSize: '0.76rem', margin: '0', lineHeight: '1.35' }}>
                    Demographic data below is collected strictly for cohort analysis.
                  </p>
                  <input
                    type="text"
                    placeholder="Course / Program (e.g. BSCS)"
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                    style={{ height: '36px', background: 'rgba(2, 6, 23, 0.85)', border: '1px solid rgba(217, 70, 239, 0.45)', borderRadius: '6px', color: '#ffffff', padding: '0 0.7rem', fontSize: '0.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '0.45rem', width: '100%', boxSizing: 'border-box' }}>
                    <input
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      style={{ height: '36px', flex: 1, width: '100%', minWidth: 0, background: 'rgba(2, 6, 23, 0.85)', border: '1px solid rgba(217, 70, 239, 0.45)', borderRadius: '6px', color: '#ffffff', padding: '0 0.7rem', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      style={{ height: '36px', flex: 1, width: '100%', minWidth: 0, background: '#020617', border: '1px solid rgba(217, 70, 239, 0.45)', borderRadius: '6px', color: '#ffffff', padding: '0 0.5rem', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="" disabled>Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <select
                    value={pwdStatus}
                    onChange={e => setPwdStatus(e.target.value)}
                    style={{ height: '36px', background: '#020617', border: '1px solid rgba(217, 70, 239, 0.45)', borderRadius: '6px', color: '#ffffff', padding: '0 0.5rem', fontSize: '0.82rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="" disabled>PWD Status</option>
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

              {/* Data Privacy Agreement Checkbox Card */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                margin: '0.15rem 0',
                background: 'rgba(0, 240, 255, 0.05)',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(0, 240, 255, 0.25)'
              }}>
                <input
                  type="checkbox"
                  id="disclaimerAgree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{
                    minWidth: '18px',
                    minHeight: '18px',
                    accentColor: '#00f0ff',
                    cursor: 'pointer',
                    marginTop: '2px',
                    flexShrink: 0
                  }}
                />
                <label htmlFor="disclaimerAgree" style={{ fontSize: '0.76rem', color: '#e2e8f0', lineHeight: '1.4', cursor: 'pointer' }}>
                  <strong style={{ color: '#ffffff' }}>Data Privacy Agreement:</strong> I acknowledge that my performance telemetry and assessment results will be collected and strictly used for academic research purposes only.
                </label>
              </div>

              {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.45rem', borderRadius: '6px', fontSize: '0.76rem', textAlign: 'center', fontWeight: '700' }}>
                  ⚠️ {formError}
                </div>
              )}

              {assessmentError && (
                <div style={{ color: '#f87171', fontSize: '0.76rem', fontWeight: 'bold', textAlign: 'center' }}>
                  ⚠️ {assessmentError}
                </div>
              )}

              {/* Action Button: Log In & Begin */}
              <button
                type="button"
                onClick={submitLogin}
                disabled={assessmentLoading || !agreed}
                style={{
                  background: agreed
                    ? 'linear-gradient(135deg, #00d2ff 0%, #3a86ff 60%, #8b5cf6 100%)'
                    : '#1e293b',
                  color: agreed ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.68rem',
                  fontSize: '0.92rem',
                  fontWeight: '900',
                  letterSpacing: '0.05em',
                  cursor: agreed ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  boxShadow: agreed 
                    ? '0 0 20px rgba(0, 210, 255, 0.45), 0 4px 12px rgba(0,0,0,0.6)' 
                    : 'none',
                  marginTop: '0.1rem',
                  textTransform: 'uppercase'
                }}
                onMouseOver={(e) => {
                  if (agreed) {
                    e.currentTarget.style.filter = 'brightness(1.15)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (agreed) {
                    e.currentTarget.style.filter = 'brightness(1.0)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                {assessmentLoading ? 'Verifying Profile...' : (isAnonymous || isSignUp ? 'Create Account & Begin →' : 'Log In & Begin →')}
              </button>

              {/* Bottom Footer Callout: PARTICIPANT ACCESS SECURED */}
              <div style={{
                textAlign: 'center',
                marginTop: '0.35rem',
                paddingTop: '0.45rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  PARTICIPANT ACCESS SECURED
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 5px #00f0ff' }} />
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 5px #818cf8' }} />
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#d946ef', boxShadow: '0 0 5px #d946ef' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Accordion Toggle for Research Roadmap */}
          <div className="cognicore-mobile-roadmap-toggle" style={{ width: '100%', textAlign: 'center', marginTop: '0.85rem' }}>
            <button
              type="button"
              onClick={() => setShowMobileRoadmap(!showMobileRoadmap)}
              style={{
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '8px',
                color: '#00f0ff',
                padding: '0.6rem 1rem',
                fontSize: '0.78rem',
                fontWeight: '800',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{showMobileRoadmap ? '▲ Hide Research Roadmap' : '▼ View Research Roadmap (Stages 01–03)'}</span>
            </button>
          </div>

          {/* Render Mobile Roadmap if expanded */}
          {renderResearchRoadmap(true)}
        </div>
      </div>
    </div>
  );
}

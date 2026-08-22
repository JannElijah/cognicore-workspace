import React, { memo } from 'react';

const AppNavigation = memo(function AppNavigation({
  currentUser, portalView, setPortalView, setShowProfileModal, activeGame,
  showDashboard, setShowDashboard, coins, totalXp, level, inventory,
  setActiveGame, currentLevel, dailyRewardData, xpPercent,
  globalMuted, setGlobalMuted, audioDda,
  setShowShop, showSoundTuner, setShowSoundTuner
}) {
  return (
      <header className="portal-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="logo-glow" onClick={() => { setActiveGame(null); setShowDashboard(false); setPortalView('participant'); }} style={{ cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="CogniCore" style={{ height: '42px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 12px rgba(var(--rgb-secondary), 0.45))' }} />
          </div>
          {currentUser !== '' && portalView === 'participant' && (
            <button 
              onClick={() => setShowProfileModal(true)}
              title="View Profile & Stats"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <div style={{ width: '42px', height: '42px', background: 'rgba(var(--rgb-primary), 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '2px solid var(--color-primary)' }}>
                 {inventory.find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id === 'avatar-robot' ? (
                   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.5))' }}><path d="M12 2v2M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9zm-4 2h2m10 0h2" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 ) : inventory.find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id === 'avatar-brain' ? (
                   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.5))' }}><path d="M9.5 3a4.5 4.5 0 100 9h5a4.5 4.5 0 100-9h-5zm0 9a4.5 4.5 0 100 9h5a4.5 4.5 0 100-9h-5z" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 ) : inventory.find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id === 'avatar-hacker' ? (
                   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.5))' }}><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.5))' }}><circle cx="12" cy="8" r="4" fill="var(--color-primary)"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/></svg>
                 )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '120px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.2rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{currentUser}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>Lv. {currentLevel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="11" fill="#fbbf24"/>
                      <circle cx="12" cy="12" r="8" fill="#f59e0b"/>
                      <text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f" fontFamily="Arial">C</text>
                    </svg>
                    {coins}
                  </span>
                  {dailyRewardData && dailyRewardData.streak > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
                      <svg width="13" height="14" viewBox="0 0 13 16" fill="none" style={{ filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.85))', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.5 0C6.5 0 2 5 2 9C2 11.761 4.015 14 6.5 14C8.985 14 11 11.761 11 9C11 6.8 9.8 5 8.5 3.8C8.5 5.3 7.5 6.3 6.5 6.3C5.5 6.3 4.5 5.3 4.5 4.2C4.5 3.1 5.5 1.5 6.5 0Z" fill="#ef4444"/>
                        <circle cx="6.5" cy="10.5" r="2" fill="#fbbf24"/>
                      </svg>
                      {dailyRewardData.streak}
                    </span>
                  )}
                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${xpPercent}%`, height: '100%', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}></div>
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {activeGame === null && (
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button 
                onClick={() => { setPortalView('participant'); }}
                style={{
                  background: portalView === 'participant' ? 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' : 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.4))' }} xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="5" y="7" width="3" height="3" rx="0.5" fill="currentColor"/><rect x="11" y="7" width="3" height="3" rx="0.5" fill="currentColor"/><rect x="5" y="12" width="3" height="3" rx="0.5" fill="currentColor"/><rect x="11" y="12" width="3" height="3" rx="0.5" fill="currentColor"/></svg> Participant Portal
              </button>
              <button 
                onClick={() => { setPortalView('researcher'); }}
                style={{
                  background: portalView === 'researcher' ? 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' : 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.4))' }} xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/></svg> Researcher Portal
              </button>
              <button 
                onClick={() => { setPortalView('knowledge'); setActiveGame(null); setShowDashboard(false); }}
                style={{
                  background: portalView === 'knowledge' ? 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' : 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.4))' }} xmlns="http://www.w3.org/2000/svg"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zm20 0h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Knowledge Base
              </button>
            </div>
          )}
          
          {activeGame === null && portalView === 'participant' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="dashboard-toggle-btn" 
                title="Store"
                onClick={() => setShowShop(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.7))' }} xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill="#fbbf24" fillOpacity="0.15" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 6h18" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M16 10a4 4 0 01-8 0" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>


              
              <button 
                className="dashboard-toggle-btn" 
                title="Detailed History"
                onClick={() => {
                  setShowDashboard(true);
                  setActiveGame(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  background: showDashboard ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                  color: '#ffffff',
                  border: '1px solid ' + (showDashboard ? 'rgba(255, 255, 255, 0.2)' : 'transparent'),
                  padding: '0.5rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: showDashboard ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px'
                }}
              >
                {showDashboard
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }} xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 5px rgba(var(--rgb-primary),0.7))' }} xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="12" width="4" height="9" rx="1" fill="var(--color-primary)"/>
                      <rect x="10" y="6" width="4" height="15" rx="1" fill="var(--color-primary)"/>
                      <rect x="17" y="3" width="4" height="18" rx="1" fill="var(--color-primary)" fillOpacity="0.7"/>
                    </svg>
                }
              </button>

              <button 
                className="dashboard-toggle-btn" 
                title="Sign Out"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  marginLeft: '0.5rem'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.7))' }} xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 17l5-5-5-5M21 12H9" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}

          <button 
            onClick={() => {
              const nextMute = !globalMuted;
              audioDda.setMuted(nextMute);
              setGlobalMuted(nextMute);
            }}
            title={globalMuted ? "Unmute Ambient Synthesizer" : "Mute Ambient Synthesizer"}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: globalMuted ? '#94a3b8' : 'var(--color-primary)',
              padding: '0.4rem',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              width: '32px',
              height: '32px'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            {globalMuted
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
                  <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.6))' }} xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
                  <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            }
          </button>

          <button 
            onClick={() => setShowSoundTuner(!showSoundTuner)}
            title="Ambient Soundscape Tuner"
            style={{
              background: showSoundTuner ? 'rgba(var(--rgb-secondary), 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: showSoundTuner ? '1px solid var(--color-secondary)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: showSoundTuner ? '#c084fc' : 'var(--color-primary)',
              padding: '0.4rem',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              width: '32px',
              height: '32px',
              marginLeft: '0.5rem'
            }}
            onMouseOver={(e) => { if (!showSoundTuner) e.target.style.background = 'rgba(255, 255, 255, 0.1)' }}
            onMouseOut={(e) => { if (!showSoundTuner) e.target.style.background = 'rgba(255, 255, 255, 0.05)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 4px rgba(var(--rgb-secondary),0.7))' }}>
              <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="8" cy="6" r="2.5" fill="currentColor"/>
              <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="16" cy="12" r="2.5" fill="currentColor"/>
              <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="18" r="2.5" fill="currentColor"/>
            </svg>
          </button>

          <div className="portal-status" style={{ marginLeft: '1rem' }}>
            <span className="status-dot"></span> Secure Telemetry Hub
          </div>
        </div>
      </header>

  );
});

export default AppNavigation;

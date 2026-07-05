import React from 'react';

export default function AppNavigation({
  currentUser, portalView, setPortalView, setShowProfileModal, activeGame,
  showDashboard, setShowDashboard, coins, totalXp, level, inventory,
  setActiveGame, currentLevel, dailyRewardData, xpPercent,
  globalMuted, setGlobalMuted, audioDda,
  setShowShop, showSoundTuner, setShowSoundTuner
}) {
  return (
      <header className="portal-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="logo-glow" onClick={() => { setActiveGame(null); setShowDashboard(false); setPortalView('participant'); }} style={{ cursor: 'pointer', alignSelf: 'flex-start' }}>
            🧠 COGNICORE
          </div>
          {currentUser !== '' && portalView === 'participant' && (
            <button 
              onClick={() => setShowProfileModal(true)}
              title="View Profile & Stats"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <div style={{ width: '42px', height: '42px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '2px solid #38bdf8' }}>
                {inventory.find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id === 'avatar-robot' ? '🤖' :
                 inventory.find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id === 'avatar-brain' ? '🧠' :
                 inventory.find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id === 'avatar-hacker' ? '👨‍💻' : '👤'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '120px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#f8fafc' }}>{currentUser}</span>
                  <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 'bold' }}>Lv. {currentLevel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>🪙 {coins}</span>
                  {dailyRewardData && dailyRewardData.streak > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.1rem', fontWeight: 'bold' }}>🔥 {dailyRewardData.streak}</span>
                  )}
                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${xpPercent}%`, height: '100%', background: 'linear-gradient(to right, #38bdf8, #a855f7)' }}></div>
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
                  background: portalView === 'participant' ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'transparent',
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
                🎮 Participant Portal
              </button>
              <button 
                onClick={() => { setPortalView('researcher'); }}
                style={{
                  background: portalView === 'researcher' ? 'linear-gradient(to right, #38bdf8, #a855f7)' : 'transparent',
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
                🔬 Researcher Portal
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
                <span>🛒</span>
              </button>


              
              <button 
                className="dashboard-toggle-btn" 
                title="Detailed History"
                onClick={() => setShowDashboard(!showDashboard)}
                style={{
                  background: showDashboard ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(to right, #38bdf8, #a855f7)',
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
                {showDashboard ? '🔙' : '📊'}
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
              color: globalMuted ? '#94a3b8' : '#38bdf8',
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
            {globalMuted ? '🔇' : '🔊'}
          </button>

          <button 
            onClick={() => setShowSoundTuner(!showSoundTuner)}
            title="Ambient Soundscape Tuner"
            style={{
              background: showSoundTuner ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: showSoundTuner ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: showSoundTuner ? '#c084fc' : '#38bdf8',
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
            🎛️
          </button>

          <div className="portal-status" style={{ marginLeft: '1rem' }}>
            <span className="status-dot"></span> Secure Telemetry Hub
          </div>
        </div>
      </header>

  );
}

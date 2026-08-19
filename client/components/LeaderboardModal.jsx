import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import HoverTooltip from './HoverTooltip';

const LeaderboardModal = memo(({ onClose }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    
    // Subscribe to realtime changes on user_profiles
    const channel = supabase.channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('Leaderboard update received!', payload);
          fetchLeaderboard(); // Refetch when profiles change
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(API_BASE + '/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setLeaders(data.leaderboard);
        }
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRankColor = (index) => {
    if (index === 0) return 'linear-gradient(to right, #fbbf24, #f59e0b)'; // Gold
    if (index === 1) return 'linear-gradient(to right, #94a3b8, #cbd5e1)'; // Silver
    if (index === 2) return 'linear-gradient(to right, #b45309, #d97706)'; // Bronze
    return 'rgba(255, 255, 255, 0.05)';
  };

  const getAvatarIcon = (itemId) => {
    if (itemId === 'avatar-robot') return '🤖';
    if (itemId === 'avatar-brain') return '🧠';
    if (itemId === 'avatar-hacker') return '👨‍💻';
    if (itemId === 'avatar-speed-demon') return '⚡';
    return '👤';
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏆</span> Global Leaderboard
          </h2>
          <button 
            onClick={onClose}
            aria-label="Close leaderboard"
            tabIndex={0}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s'
            }}
            onMouseOver={e => e.target.style.color = '#f8fafc'}
            onMouseOut={e => e.target.style.color = '#94a3b8'}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {loading ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Loading rankings...</div>
          ) : leaders.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No players found.</div>
          ) : (
            leaders.map((player, idx) => (
              <HoverTooltip key={idx} text={`Rank: #${idx + 1} | Level ${player.level} | ${player.xp} XP`} delay={200}>
              <div style={{
                background: getRankColor(idx),
                padding: '1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ width: '40px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: idx < 3 ? '#0f172a' : '#94a3b8' }}>
                  #{idx + 1}
                </div>
                
                <div style={{ 
                  width: '40px', height: '40px', 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '1.2rem',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}>
                  {getAvatarIcon(player.equipped_avatar)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: idx < 3 ? '#0f172a' : '#f8fafc' }}>
                    {player.username}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: idx < 3 ? 'rgba(15,23,42,0.8)' : '#94a3b8' }}>
                    Level {player.level}
                  </div>
                </div>
                
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: idx < 3 ? '#0f172a' : '#38bdf8' }}>
                  {player.xp} XP
                </div>
              </div>
              </HoverTooltip>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

export default LeaderboardModal;

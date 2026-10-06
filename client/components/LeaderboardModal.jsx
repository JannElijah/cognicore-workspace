import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import HoverTooltip from './HoverTooltip';

const CATEGORIES = [
  { id: 'xp', label: '🌟 Global XP' },
  { id: 'coins', label: '💰 High Roller' },
  { id: 'accuracy', label: '🎯 Perfectionist' },
  { id: 'speed', label: '⚡ Speedrunner' },
  { id: 'difficulty', label: '🧠 Grandmaster' }
];

const DOMAINS = [
  { id: 'all', label: 'All Domains' },
  { id: 'spatial_visual_memory', label: 'Spatial-Visual' },
  { id: 'logical_mathematical', label: 'Logical-Math' },
  { id: 'reflexes_and_focus', label: 'Reflexes' },
  { id: 'executive_strategy', label: 'Executive Strategy' }
];

const LeaderboardModal = memo(({ onClose }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [category, setCategory] = useState('xp');
  const [domain, setDomain] = useState('all');

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
  }, [category, domain]);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaderboard?category=${category}&domain=${domain}`);
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
  }, [category, domain]);

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

  const renderScore = (player, idx) => {
    const isTop3 = idx < 3;
    const color = isTop3 ? '#0f172a' : 'var(--color-primary)';
    
    let displayScore = `${player.xp} XP`;
    if (category === 'coins') displayScore = `${player.coins} Coins`;
    if (category === 'accuracy' && player.score) displayScore = `${(player.score * 100).toFixed(1)}% Acc`;
    if (category === 'speed' && player.score) displayScore = `${Math.round(player.score)} ms`;
    if (category === 'difficulty' && player.score) displayScore = `Lvl ${player.score}`;

    return (
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color }}>
        {displayScore}
      </div>
    );
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
        width: '95%',
        maxWidth: '700px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏆</span> Global Leaderboards
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
            ✖ 
          </button>
        </div>

        {/* Categories Tab */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: '0.5rem 1rem',
                background: category === cat.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                color: category === cat.id ? '#0f172a' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: category === cat.id ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Domains Filter (Only show for game-specific metrics) */}
        {['accuracy', 'speed', 'difficulty'].includes(category) && (
          <div style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', background: 'rgba(0,0,0,0.2)' }}>
            {DOMAINS.map(dom => (
              <button
                key={dom.id}
                onClick={() => setDomain(dom.id)}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: domain === dom.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: domain === dom.id ? '#f8fafc' : '#64748b',
                  border: '1px solid',
                  borderColor: domain === dom.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {dom.label}
              </button>
            ))}
          </div>
        )}

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
                  width: '45px', height: '45px', 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '1.4rem',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}>
                  {getAvatarIcon(player.equipped_avatar)}
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: idx < 3 ? '#0f172a' : '#f8fafc' }}>
                      {player.username}
                    </span>
                    {(player.current_streak > 0) && (
                      <span style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#f59e0b' }}>
                        🔥 {player.current_streak}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: idx < 3 ? 'rgba(15,23,42,0.8)' : '#94a3b8' }}>
                    <span>Lvl {player.level}</span>
                    <span>•</span>
                    <span style={{ fontStyle: 'italic' }}>
                      {player.archetype_name || player.equipped_title || 'Unclassified'}
                    </span>
                  </div>
                </div>
                
                {renderScore(player, idx)}
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

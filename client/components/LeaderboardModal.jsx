import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import HoverTooltip from './HoverTooltip';

const CATEGORIES = [
  { id: 'xp', label: <span style={{display: 'flex', alignItems: 'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> XP</span> },
  { id: 'coins', label: <span style={{display: 'flex', alignItems: 'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.6))'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Coins</span> },
  { id: 'accuracy', label: <span style={{display: 'flex', alignItems: 'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.6))'}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> Accuracy</span> },
  { id: 'speed', label: <span style={{display: 'flex', alignItems: 'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', filter: 'drop-shadow(0 0 4px rgba(56,189,248,0.6))'}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Speed</span> },
  { id: 'difficulty', label: <span style={{display: 'flex', alignItems: 'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', filter: 'drop-shadow(0 0 4px rgba(192,132,252,0.6))'}}><path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v1A2.5 2.5 0 0 0 4.5 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h.5a2.5 2.5 0 0 0 2.5 2.5v1a2.5 2.5 0 0 0 5 0v-1a2.5 2.5 0 0 0 2.5-2.5h.5a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5A2.5 2.5 0 0 0 17 5.5v-1A2.5 2.5 0 0 0 14.5 2h-5z"/></svg> Max Level</span> }
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
    if (itemId === 'avatar-robot') return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>;
    if (itemId === 'avatar-brain') return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v1A2.5 2.5 0 0 0 4.5 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h.5a2.5 2.5 0 0 0 2.5 2.5v1a2.5 2.5 0 0 0 5 0v-1a2.5 2.5 0 0 0 2.5-2.5h.5a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5A2.5 2.5 0 0 0 17 5.5v-1A2.5 2.5 0 0 0 14.5 2h-5z"/></svg>;
    if (itemId === 'avatar-hacker') return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="8 7 12 11 8 15"/><line x1="13" y1="15" x2="17" y2="15"/></svg>;
    if (itemId === 'avatar-speed-demon') return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #38bdf8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{filter: 'drop-shadow(0 0 4px rgba(56,189,248,0.5))'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
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
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color, whiteSpace: 'nowrap' }}>
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
        <div style={{ flexShrink: 0, padding: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))'}}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></span> Global Leaderboards
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
        <div style={{ flexShrink: 0, padding: '1rem 1.5rem', display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                flexShrink: 1,
                padding: '0.4rem 0.8rem',
                background: category === cat.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                color: category === cat.id ? '#0f172a' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
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
          <div style={{ flexShrink: 0, padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
            <label htmlFor="domain-select" style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>
              Domain Filter:
            </label>
            <select
              id="domain-select"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              style={{
                padding: '0.4rem 0.8rem',
                background: 'rgba(15, 23, 42, 0.9)',
                color: '#f8fafc',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                outline: 'none',
                fontWeight: 'bold'
              }}
            >
              {DOMAINS.map(dom => (
                <option key={dom.id} value={dom.id}>
                  {dom.label}
                </option>
              ))}
            </select>
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
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: idx < 3 ? '#0f172a' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.username}
                    </span>
                    {(player.current_streak > 0) && (
                      <span style={{ flexShrink: 0, fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '3px', filter: 'drop-shadow(0 0 2px rgba(245,158,11,0.8))'}}><path d="M12 2c0 0-4.5 5.5-4.5 9.5a4.5 4.5 0 0 0 9 0C16.5 7.5 12 2 12 2z"/><path d="M12 11c-1 0-2 1-2 2a2 2 0 0 0 4 0c0-1-1-2-2-2z"/></svg> {player.current_streak}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: idx < 3 ? 'rgba(15,23,42,0.8)' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span>Lvl {player.level}</span>
                    <span>•</span>
                    <span style={{ fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.archetype_name || player.equipped_title || 'Unclassified'}
                    </span>
                  </div>
                </div>
                
                <div style={{ flexShrink: 0 }}>
                  {renderScore(player, idx)}
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

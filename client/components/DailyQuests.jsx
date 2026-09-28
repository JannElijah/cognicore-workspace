import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect, memo } from 'react';
import useCogniStore from '../store/useCogniStore';
import HoverTooltip from './HoverTooltip';

const DailyQuests = () => {
  const { token, fetchInventory } = useCogniStore();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const res = await fetch(API_BASE + '/api/quests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setQuests(data.quests);
        }
      }
    } catch (e) {
      console.error('Failed to fetch quests', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (questId) => {
    try {
      const res = await fetch(`${API_BASE}/api/quests/claim/${questId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchQuests();
        fetchInventory();
      }
    } catch (e) {
      console.error('Failed to claim quest', e);
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(var(--rgb-primary),0.7))',verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg"><rect x="8" y="2" width="8" height="4" rx="1" fill="var(--color-primary)" fillOpacity="0.2" stroke="var(--color-primary)" strokeWidth="1.5"/><rect x="4" y="4" width="16" height="18" rx="2" stroke="var(--color-primary)" strokeWidth="1.5"/><line x1="8" y1="10" x2="16" y2="10" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="14" x2="16" y2="14" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="18" x2="13" y2="18" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/></svg></span> Daily Quests
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <>
            <div className="skeleton-box" style={{ height: '110px', borderRadius: '12px' }}></div>
            <div className="skeleton-box" style={{ height: '110px', borderRadius: '12px' }}></div>
            <div className="skeleton-box" style={{ height: '110px', borderRadius: '12px' }}></div>
          </>
        ) : quests.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '1rem' }}>No quests available today.</div>
        ) : (
          quests.map(quest => {
            const progress = Math.min(quest.current_amount, quest.target_amount);
            const percent = Math.floor((progress / quest.target_amount) * 100);
            const isCompleted = quest.is_completed === true || quest.is_completed === 1;
            const canClaim = progress >= quest.target_amount && !isCompleted;
            const isClaimed = isCompleted;

            return (
              <div key={quest.id} style={{
                background: isClaimed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isClaimed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <HoverTooltip text={isCompleted ? "Quest completed!" : "Complete this task to earn coins"} delay={200}>
                    <h4 style={{ color: '#e2e8f0', margin: 0, fontSize: '0.95rem' }}>{quest.task_description}</h4>
                  </HoverTooltip>
                  <HoverTooltip text="Reward for completing this quest" delay={200}>
                    <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {quest.reward_coins} <svg width="15" height="15" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))', flexShrink: 0, verticalAlign: 'middle' }} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#fbbf24"/><circle cx="12" cy="12" r="8" fill="#f59e0b"/><text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f" fontFamily="Arial">C</text></svg>
                    </div>
                  </HoverTooltip>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ flex: 1, marginRight: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                      <span>Progress</span>
                      <span>{progress} / {quest.target_amount}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${percent}%`, 
                        height: '100%', 
                        background: isClaimed ? '#10b981' : 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleClaim(quest.id)}
                    disabled={!canClaim}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      border: 'none',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      cursor: canClaim ? 'pointer' : 'not-allowed',
                      background: isClaimed ? 'transparent' : canClaim ? '#10b981' : '#334155',
                      color: isClaimed ? '#10b981' : canClaim ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isClaimed ? 'Claimed' : 'Claim'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default memo(DailyQuests);

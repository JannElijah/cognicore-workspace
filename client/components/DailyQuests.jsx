import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect } from 'react';
import useCogniStore from '../store/useCogniStore';

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
        <span>📋</span> Daily Quests
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <div style={{ color: '#94a3b8', padding: '1rem' }}>Loading quests...</div>
        ) : quests.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '1rem' }}>No quests available today.</div>
        ) : (
          quests.map(quest => {
            const progress = Math.min(quest.current_amount, quest.target_amount);
            const percent = Math.floor((progress / quest.target_amount) * 100);
            const canClaim = progress >= quest.target_amount && quest.is_completed === 0;
            const isClaimed = quest.is_completed === 1;

            return (
              <div key={quest.id} style={{
                background: isClaimed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isClaimed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ color: '#e2e8f0', margin: 0, fontSize: '0.95rem' }}>{quest.task_description}</h4>
                  <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {quest.reward_coins} <span>🪙</span>
                  </div>
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
                        background: isClaimed ? '#10b981' : 'linear-gradient(to right, #38bdf8, #a855f7)',
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

export default DailyQuests;

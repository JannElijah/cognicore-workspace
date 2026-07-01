import React, { useState, useEffect } from 'react';
import useCogniStore from '../store/useCogniStore';
import audioEngine from '../utils/audioEngine';

const SHOP_ITEMS = [
  { id: 'theme-red', type: 'theme', name: 'Crimson Synapse', description: 'Deep red energetic UI theme.', price: 200, category: 'Themes' },
  { id: 'theme-blue', type: 'theme', name: 'Azure Neuro', description: 'Calming blue focus theme.', price: 200, category: 'Themes' },
  { id: 'theme-purple', type: 'theme', name: 'Void Cortex', description: 'Dark purple mysterious aesthetic.', price: 250, category: 'Themes' },
  { id: 'theme-yellow', type: 'theme', name: 'Solar Glial', description: 'Bright vibrant yellow theme.', price: 200, category: 'Themes' },
  { id: 'avatar-robot', type: 'avatar', name: 'Mech-Node', description: 'Robotic cognitive assistant avatar.', price: 500, category: 'Avatars' },
  { id: 'avatar-brain', type: 'avatar', name: 'Cerebrum Prime', description: 'Glowing brain master avatar.', price: 500, category: 'Avatars' },
  { id: 'avatar-hacker', type: 'avatar', name: 'Data Runner', description: 'Cyberpunk hacker aesthetic avatar.', price: 750, category: 'Avatars' },
];

const Shop = ({ onClose }) => {
  const { user, token, fetchInventory } = useCogniStore();
  const [coins, setCoins] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseMsg, setPurchaseMsg] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/user-inventory/${user}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success') {
          setCoins(data.coins);
          setInventory(data.inventory);
          // Also sync to global store
          fetchInventory();
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to fetch inventory.');
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      loadUserData();
    }
  }, [user, token, fetchInventory]);

  const handlePurchase = async (itemId) => {
    audioEngine.playClick();
    setPurchaseMsg(null);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user, item_id: itemId })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        audioEngine.playSuccess();
        setCoins(data.coins);
        setInventory([...inventory, data.item]);
        setPurchaseMsg(`Successfully purchased!`);
        fetchInventory(); // sync global
        setTimeout(() => setPurchaseMsg(null), 3000);
      } else {
        audioEngine.playError();
        setPurchaseMsg(`Failed: ${data.message}`);
        setTimeout(() => setPurchaseMsg(null), 3000);
      }
    } catch (err) {
      audioEngine.playError();
      setPurchaseMsg('Error during purchase.');
    }
  };

  const handleEquip = async (itemId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/equip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user, item_id: itemId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        // Update local state to reflect equipping
        setInventory(inventory.map(item => ({
          ...item,
          is_equipped: (item.item_type === data.item_type) ? (item.item_id === itemId) : item.is_equipped
        })));
        fetchInventory(); // Sync global
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(2, 6, 23, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid #1e293b',
          position: 'sticky',
          top: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(4px)',
          zIndex: 10
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>Neuro-Shop</h2>
            <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>Spend NeuroCoins on cosmetics</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #334155' }}>
              <span style={{ color: '#fbbf24' }}>🪙</span>
              <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>{loading ? '...' : coins}</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              onMouseOver={e => e.target.style.color = '#f8fafc'}
              onMouseOut={e => e.target.style.color = '#94a3b8'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {purchaseMsg && (
            <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: purchaseMsg.includes('Failed') ? 'rgba(153, 27, 27, 0.2)' : 'rgba(22, 101, 52, 0.2)', border: purchaseMsg.includes('Failed') ? '1px solid #7f1d1d' : '1px solid #14532d', color: purchaseMsg.includes('Failed') ? '#fca5a5' : '#86efac', textAlign: 'center', fontWeight: 'bold' }}>
              {purchaseMsg}
            </div>
          )}

          {['Themes', 'Avatars'].map(category => (
            <div key={category} style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1e293b' }}>
                {category}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {SHOP_ITEMS.filter(item => item.category === category).map(item => {
                  const ownedItem = inventory.find(i => i.item_id === item.id);
                  const isOwned = !!ownedItem;
                  const isEquipped = ownedItem?.is_equipped;

                  return (
                    <div key={item.id} style={{
                      background: '#1e293b',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: isEquipped ? '2px solid #38bdf8' : '2px solid transparent',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
                          {item.id === 'theme-red' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }}></div>}
                          {item.id === 'theme-blue' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></div>}
                          {item.id === 'theme-purple' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px #a855f7' }}></div>}
                          {item.id === 'theme-yellow' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308', boxShadow: '0 0 8px #eab308' }}></div>}
                          <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>{item.name}</h4>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0, minHeight: '40px' }}>{item.description}</p>
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {!isOwned ? (
                          <div style={{ color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>🪙</span> {item.price}
                          </div>
                        ) : (
                          <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                            ✓ Owned
                          </div>
                        )}

                        {!isOwned ? (
                          <button
                            onClick={() => handlePurchase(item.id)}
                            disabled={coins < item.price}
                            style={{
                              background: coins >= item.price ? '#38bdf8' : '#334155',
                              color: coins >= item.price ? '#0f172a' : '#94a3b8',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              cursor: coins >= item.price ? 'pointer' : 'not-allowed',
                              transition: 'all 0.2s'
                            }}
                          >
                            Buy
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(item.id)}
                            style={{
                              background: isEquipped ? 'transparent' : '#10b981',
                              color: isEquipped ? '#38bdf8' : '#ffffff',
                              border: isEquipped ? '1px solid #38bdf8' : 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              cursor: isEquipped ? 'default' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isEquipped ? 'Equipped' : 'Equip'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;

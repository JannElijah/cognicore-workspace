import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/apiClient.js';
import useApiInterceptor from '../hooks/useApiInterceptor';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Platform metrics
  const [metrics, setMetrics] = useState(null);
  
  // Player Card Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/metrics`);
      const data = await res.json();
      if (data.status === 'success') {
        setMetrics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users?search=${searchQuery}`);
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.users);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    // basic debounce
    setTimeout(() => {
      fetchUsers(e.target.value);
    }, 300);
  };

  const openPlayerCard = async (username) => {
    setSelectedUser(username);
    setModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${username}`);
      const data = await res.json();
      if (data.status === 'success') {
        setPlayerData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const closePlayerCard = () => {
    setSelectedUser(null);
    setPlayerData(null);
  };

  const exportPdf = () => {
    const input = document.getElementById('player-card-content');
    if (!input) return;
    
    html2canvas(input, { backgroundColor: '#1e293b' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedUser}_Cognitive_Profile.pdf`);
    });
  };

  const suspendUser = async (username) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${username}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended' })
      });
      if (res.ok) {
        fetchUsers(search);
        if (selectedUser === username && playerData) {
          setPlayerData({...playerData, user: {...playerData.user, status: 'suspended'}});
        }
      }
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '2rem', color: '#e2e8f0', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <h1 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem' }}>Global Platform Overview</h1>
      
      {/* 1. Dashboard Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={cardStyle}>
          <h3>Total Users</h3>
          <p style={metricStyle}>{metrics?.total_registered_users || 0}</p>
        </div>
        <div style={cardStyle}>
          <h3>Active Users (7d)</h3>
          <p style={metricStyle}>{metrics?.active_users || 0}</p>
        </div>
        <div style={cardStyle}>
          <h3>Total Games Played</h3>
          <p style={metricStyle}>{metrics?.total_sessions || 0}</p>
        </div>
        <div style={cardStyle}>
          <h3>System Health</h3>
          <p style={{ ...metricStyle, color: '#10b981' }}>{metrics?.system_health || 'Checking...'}</p>
        </div>
      </div>

      {/* 2. User Management Roster */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>User Management & Roster</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search username..." 
            value={search}
            onChange={handleSearch}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: '#fff' }}
          />
          <CSVLink 
            data={users} 
            filename="cognicore_users.csv"
            style={{ padding: '0.5rem 1rem', background: 'var(--color-secondary)', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}
          >
            Export CSV
          </CSVLink>
        </div>
      </div>

      {loading ? <p>Loading users...</p> : error ? <p style={{color: '#ef4444'}}>{error}</p> : (
        <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '2px solid #334155' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Date Joined</th>
                <th style={thStyle}>Level</th>
                <th style={thStyle}>XP / Coins</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={tdStyle}>{u.id}</td>
                  <td style={{...tdStyle, color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => openPlayerCard(u.username)}>
                    {u.username}
                  </td>
                  <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={tdStyle}>{u.level || 1}</td>
                  <td style={tdStyle}>{u.xp || 0} XP / {u.coins || 0} 🪙</td>
                  <td style={tdStyle}>
                    <span style={{ color: u.status === 'suspended' ? '#ef4444' : '#10b981' }}>{u.status || 'active'}</span>
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => suspendUser(u.username)}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="7" style={{padding: '1rem', textAlign: 'center'}}>No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Player Card Modal */}
      {selectedUser && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>Player Card: {selectedUser}</h2>
              <div>
                <button onClick={exportPdf} style={{ marginRight: '1rem', background: 'var(--color-secondary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Export PDF</button>
                <button onClick={closePlayerCard} style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
              </div>
            </div>

            <div id="player-card-content" style={{ padding: '1rem', background: '#0f172a', borderRadius: '8px' }}>
              {modalLoading ? <p>Loading player data...</p> : playerData ? (
                <>
                  <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                    <div>
                      <p style={{ margin: 0, color: '#94a3b8' }}>Cognitive Archetype</p>
                      <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.5rem' }}>{playerData.archetype}</h3>
                    </div>
                    <div>
                      <p style={{ margin: 0, color: '#94a3b8' }}>Training Streak</p>
                      <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.5rem' }}>{playerData.streak} Days 🔥</h3>
                    </div>
                    <div>
                      <p style={{ margin: 0, color: '#94a3b8' }}>Total XP</p>
                      <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.5rem' }}>{playerData.user.xp || 0} XP</h3>
                    </div>
                  </div>

                  <h4 style={{ borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Game-by-Game Breakdown</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: '#334155' }}>
                        <th style={thStyle}>Game Module</th>
                        <th style={thStyle}>Plays</th>
                        <th style={thStyle}>Avg Accuracy</th>
                        <th style={thStyle}>Avg Difficulty Reached</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerData.game_breakdown.map((g, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={tdStyle}>{g.game_type}</td>
                          <td style={tdStyle}>{g.plays}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, background: '#0f172a', height: '8px', borderRadius: '4px' }}>
                                <div style={{ width: `${(g.avg_acc || 0)*100}%`, background: (g.avg_acc > 0.8) ? '#10b981' : (g.avg_acc > 0.5) ? '#f59e0b' : '#ef4444', height: '100%', borderRadius: '4px' }}></div>
                              </div>
                              <span style={{ width: '40px' }}>{Math.round((g.avg_acc || 0)*100)}%</span>
                            </div>
                          </td>
                          <td style={tdStyle}>Level {Math.round(g.avg_diff || 1)}</td>
                        </tr>
                      ))}
                      {playerData.game_breakdown.length === 0 && <tr><td colSpan="4" style={tdStyle}>No gameplay data yet.</td></tr>}
                    </tbody>
                  </table>
                  
                  <div style={{ marginTop: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #ef4444' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Moderation Tools</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#cbd5e1' }}>Warning: Changing status affects user login immediately.</p>
                    <button 
                      onClick={() => suspendUser(selectedUser)}
                      style={{ background: playerData.user.status === 'suspended' ? '#10b981' : '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {playerData.user.status === 'suspended' ? 'Unsuspend User' : 'Suspend User'}
                    </button>
                  </div>
                </>
              ) : <p>Error loading data.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: '#1e293b',
  padding: '1.5rem',
  borderRadius: '8px',
  border: '1px solid #334155',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

const metricStyle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: 'var(--color-primary)',
  margin: '0.5rem 0 0 0'
};

const thStyle = {
  padding: '1rem',
  color: '#94a3b8',
  fontWeight: '600'
};

const tdStyle = {
  padding: '1rem',
  color: '#e2e8f0'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(4px)'
};

const modalContentStyle = {
  background: '#1e293b',
  padding: '2rem',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '800px',
  maxHeight: '90vh',
  overflowY: 'auto',
  border: '1px solid #475569',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

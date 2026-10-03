import React, { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Radar, Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [retrainStatus, setRetrainStatus] = useState('Idle');
  const [retrainMessage, setRetrainMessage] = useState('');
  const USERS_PER_PAGE = 10;

  const triggerRetrain = async () => {
    setRetrainStatus('Training...');
    try {
      const res = await fetch(`${API_BASE}/api/model/retrain`, {
        method: 'POST',
        headers: { 'Cron-Secret': 'capstone_cron_secret_789' }
      });
      const data = await res.json();
      if (res.ok) {
        setRetrainStatus('Success');
        setRetrainMessage(data.message || 'Model retrained successfully');
      } else {
        setRetrainStatus('Failed');
        setRetrainMessage(data.error || 'Failed to retrain');
      }
    } catch (err) {
      setRetrainStatus('Error');
      setRetrainMessage(err.toString());
    }
    setTimeout(() => { setRetrainStatus('Idle'); setRetrainMessage(''); }, 5000);
  };

  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [playerHistory, setPlayerHistory] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [cohortAnalytics, setCohortAnalytics] = useState(null);

  const getArchetypeColor = (arch) => {
    if (!arch || arch === 'Unknown') return '#64748b';
    if (arch.toLowerCase().includes('fast')) return '#38bdf8';
    if (arch.toLowerCase().includes('fatigue') || arch.toLowerCase().includes('plateau')) return '#f59e0b';
    return '#c084fc';
  };


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

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users?search=${searchQuery}`);
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCohortAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cohort-analytics`);
      const data = await res.json();
      if (data.status === 'success') setCohortAnalytics(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchCohortAnalytics();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const suspendUser = async (username) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${username}/suspend`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        fetchUsers();
        if (selectedUser === username) {
          setPlayerData(prev => ({ ...prev, user: { ...prev.user, status: data.new_status }}));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openPlayerCard = async (username) => {
    setSelectedUser(username);
    setModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${username}`);
      const data = await res.json();
      const histRes = await fetch(`${API_BASE}/api/user-session-history/${username}`);
      const histData = await histRes.json();
      
      if (data.status === 'success') {
        setPlayerData(data);
      }
      if (histData.status === 'success') {
        setPlayerHistory(histData.sessions.reverse());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  const closePlayerCard = () => {
    setSelectedUser(null);
    setPlayerData(null);
  };

  const exportRawTelemetry = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/api/admin/export-telemetry`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === 'success' && data.telemetry?.length > 0) {
        const headers = Object.keys(data.telemetry[0]).join(',');
        const rows = data.telemetry.map(row => Object.values(row).join(','));
        const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'raw_telemetry_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else { alert('Failed to export telemetry.'); }
    } catch (e) { console.error('Export error:', e); }
  };

  const exportSubjectTelemetry = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/api/admin/export-telemetry/${selectedUser}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === 'success' && data.telemetry?.length > 0) {
        const headers = Object.keys(data.telemetry[0]).join(',');
        const rows = data.telemetry.map(row => Object.values(row).join(','));
        const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${selectedUser}_telemetry.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else { alert('Failed to export telemetry.'); }
    } catch (e) { console.error('Export error:', e); }
  };

  const exportPdf = () => {
    const input = document.getElementById('player-card-content');
    if (!input) return;
    html2canvas(input, { backgroundColor: '#0f172a' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`player_card_${selectedUser}.pdf`);
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.5rem', 
          background: 'linear-gradient(to right, #c084fc, #38bdf8)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          textShadow: '0px 0px 20px rgba(192, 132, 252, 0.3)'
        }}>
          Global Platform Overview
        </h1>
      </div>

      {/* 1. METRICS GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '4rem' 
      }}>
        <div style={cardStyle}>
          <div style={cardIconStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <h3 style={cardLabelStyle}>Total Users</h3>
          <p style={{...metricStyle, color: '#38bdf8'}}>{metrics?.total_registered_users || 0}</p>
        </div>
        <div style={cardStyle}>
          <div style={cardIconStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <h3 style={cardLabelStyle}>Active Users (7d)</h3>
          <p style={{...metricStyle, color: '#c084fc'}}>{metrics?.active_users || 0}</p>
        </div>
        <div style={cardStyle}>
          <div style={cardIconStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M12 12h.01M17 12h.01M7 12h.01"></path></svg>
          </div>
          <h3 style={cardLabelStyle}>Total Games Played</h3>
          <p style={{...metricStyle, color: '#10b981'}}>{metrics?.total_sessions || 0}</p>
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={cardIconStyle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <h3 style={cardLabelStyle}>ML Pipeline</h3>
              <p style={{...metricStyle, fontSize: '1.8rem', color: retrainStatus === 'Failed' || retrainStatus === 'Error' ? '#ef4444' : retrainStatus === 'Success' ? '#10b981' : '#f8fafc'}}>
                {retrainStatus === 'Idle' ? 'Active' : retrainStatus}
              </p>
              {retrainMessage && <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>{retrainMessage}</p>}
            </div>
            <button onClick={triggerRetrain} disabled={retrainStatus === 'Training...'} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', transition: 'all 0.2s' }}>
              {retrainStatus === 'Training...' ? 'Processing...' : 'Force Retrain'}
            </button>
          </div>
        </div>
      </div>

            {/* MACRO VIEW: COHORT ANALYTICS */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#f8fafc' }}>Macro View: Cohort Analytics</h2>
          <button onClick={exportRawTelemetry} style={{ background: 'linear-gradient(to right, #10b981, #059669)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.25)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Raw Telemetry (.CSV)
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          {/* Radar Chart */}
          <div style={cardStyle}>
            <h3 style={cardLabelStyle}>Cohort Cognitive Profile</h3>
            {metrics?.domain_breakdown ? (
              <div style={{ width: '100%', height: '250px' }}>
                <Radar 
                  data={{
                    labels: Object.keys(metrics.domain_breakdown).map(d => d.replace('_', ' ').toUpperCase()),
                    datasets: [{
                      label: 'Avg Accuracy (%)',
                      data: Object.values(metrics.domain_breakdown).map(d => d.average_accuracy),
                      backgroundColor: 'rgba(56, 189, 248, 0.2)',
                      borderColor: '#38bdf8',
                      pointBackgroundColor: '#c084fc',
                      borderWidth: 2,
                    }]
                  }}
                  options={{ maintainAspectRatio: false, scales: { r: { ticks: { color: '#94a3b8', backdropColor: 'transparent' }, grid: { color: '#334155' }, angleLines: { color: '#334155' }, pointLabels: { color: '#cbd5e1' } } }, plugins: { legend: { display: false } } }}
                />
              </div>
            ) : <p style={{color: '#64748b'}}>Loading...</p>}
          </div>

          {/* Pre vs Post Bar Chart */}
          <div style={cardStyle}>
            <h3 style={cardLabelStyle}>Pre-test vs Post-test (T-Test)</h3>
            {cohortAnalytics ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: '180px', position: 'relative' }}>
                  <Bar 
                    data={{
                      labels: ['Baseline (Pre)', 'Final (Post)'],
                      datasets: [{ label: 'Overall Mean Score', data: [cohortAnalytics.overall_pre_mean, cohortAnalytics.overall_post_mean], backgroundColor: ['#475569', '#10b981'], borderRadius: 6 }]
                    }}
                    options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } }, plugins: { legend: { display: false } } }}
                  />
                </div>
                {(() => {
                  const isSig = cohortAnalytics.cohort_p_value < 0.05;
                  const bg = isSig ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                  const border = isSig ? '#10b981' : '#f59e0b';
                  const text = isSig ? '#6ee7b7' : '#fcd34d';
                  return (
                    <div style={{ marginTop: '1rem', padding: '0.8rem', background: bg, borderRadius: '6px', borderLeft: `4px solid ${border}` }}>
                      <p style={{margin: 0, fontSize: '0.85rem', color: text, fontWeight: 'bold'}}>{cohortAnalytics.hypothesis_verdict}</p>
                      <p style={{margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8'}}>p-value: {cohortAnalytics.cohort_p_value} | Cohen\'s d: {cohortAnalytics.cohort_cohens_d}</p>
                    </div>
                  );
                })()}
              </div>
            ) : <p style={{color: '#64748b'}}>Calculating...</p>}
          </div>

          {/* Archetype Doughnut */}
          <div style={cardStyle}>
            <h3 style={cardLabelStyle}>Archetype Distribution</h3>
            {metrics?.archetype_distribution && Object.keys(metrics.archetype_distribution).length > 0 ? (
              <div style={{ width: '100%', height: '250px' }}>
                <Doughnut 
                  data={{
                    labels: Object.keys(metrics.archetype_distribution),
                    datasets: [{ data: Object.values(metrics.archetype_distribution), backgroundColor: ['#38bdf8', '#c084fc', '#f59e0b', '#ef4444', '#10b981'], borderColor: '#1e293b', borderWidth: 2 }]
                  }}
                  options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 20 } } }, cutout: '65%' }}
                />
              </div>
            ) : <div style={{ height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}><circle cx="12" cy="12" r="10"></circle><path d="M12 2v20"></path></svg>
                  <p style={{color: '#64748b', textAlign: 'center'}}>Insufficient data to compute<br/>Archetype Distribution.</p>
                </div>}
          </div>
        </div>
      </div>

      {/* 2. USER MANAGEMENT SECTION */}
      <div style={{ 
        background: '#1e293b', 
        borderRadius: '12px', 
        border: '1px solid #334155',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '1.5rem 2rem', 
          borderBottom: '1px solid #334155', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>User Management & Roster</h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search username..." 
                value={searchQuery} 
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ 
                  background: '#0f172a', 
                  border: '1px solid #475569', 
                  color: '#fff', 
                  padding: '0.6rem 1rem 0.6rem 2.5rem',
                  borderRadius: '6px',
                  outline: 'none',
                  width: '200px',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
            <select 
              value={archetypeFilter}
              onChange={(e) => { setArchetypeFilter(e.target.value); setCurrentPage(1); }}
              style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '0.6rem 1rem', borderRadius: '6px', outline: 'none' }}
            >
              <option value="All">All Archetypes</option>
              <option value="Fast Learner">Fast Learner</option>
              <option value="Steady Improver">Steady Improver</option>
              <option value="Plateauing">Plateauing</option>
              <option value="Fatigue Prone">Fatigue Prone</option>
              <option value="Unknown">Unknown</option>
            </select>
            <CSVLink 
              data={users} 
              filename="cognicore_users.csv"
              style={{
                background: 'linear-gradient(to right, #c084fc, #a855f7)',
                color: '#fff',
                textDecoration: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 6px rgba(168, 85, 247, 0.25)',
                transition: 'transform 0.1s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV
            </CSVLink>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
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
              {(() => {
                  let filtered = users;
                  if (searchQuery) {
                    filtered = filtered.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));
                  }
                  if (archetypeFilter !== 'All') {
                    filtered = filtered.filter(u => (u.cognitive_archetype || 'Unknown') === archetypeFilter);
                  }
                  const startIdx = (currentPage - 1) * USERS_PER_PAGE;
                  const paginated = filtered.slice(startIdx, startIdx + USERS_PER_PAGE);
                  
                  if (paginated.length === 0) return <tr><td colSpan="7" style={{padding: '3rem', textAlign: 'center', color: '#94a3b8'}}>No users found matching your criteria.</td></tr>;

                  return paginated.map((u, i) => (
                <tr key={u.id} style={{ 
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  borderTop: '1px solid #334155',
                  transition: 'background 0.2s'
                }} className="table-row-hover">
                  <td style={tdStyle}>{u.id}</td>
                  <td style={{...tdStyle, color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => openPlayerCard(u.username)}>
                    {u.username}
                  </td>
                  <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td style={tdStyle}>
                    <span style={{ background: '#334155', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>Lv. {u.level || 1}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>{u.xp || 0} XP</span>
                      <span style={{ color: '#475569' }}>|</span>
                      <span style={{ color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>
                        {u.coins || 0}
                      </span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ 
                      background: u.status === 'suspended' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: u.status === 'suspended' ? '#fca5a5' : '#6ee7b7',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => suspendUser(u.username)}
                      style={{ 
                        background: u.status === 'suspended' ? '#334155' : 'rgba(239, 68, 68, 0.1)', 
                        color: u.status === 'suspended' ? '#f8fafc' : '#ef4444', 
                        border: u.status === 'suspended' ? '1px solid #475569' : '1px solid rgba(239, 68, 68, 0.3)', 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                      }}
                    >
                      {u.status === 'suspended' ? 'Restore' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ));
              })()}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {(() => {
            const filtered = archetypeFilter === 'All' ? users : users.filter(u => (u.cognitive_archetype || 'Unknown') === archetypeFilter);
            const totalPages = Math.ceil(filtered.length / USERS_PER_PAGE);
            if (totalPages <= 1) return null;
            return (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ background: currentPage === 1 ? '#1e293b' : '#334155', color: currentPage === 1 ? '#475569' : '#f8fafc', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ background: currentPage === totalPages ? '#1e293b' : '#334155', color: currentPage === totalPages ? '#475569' : '#f8fafc', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            );
          })()}
        </div>

      {/* 3. Player Card Modal */}
      {selectedUser && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                  {selectedUser.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#f8fafc' }}>{selectedUser}</h2>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>CogniCore Subject Data</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={exportSubjectTelemetry} style={{ background: 'linear-gradient(to right, #10b981, #059669)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export CSV
                </button>
                <button onClick={exportPdf} style={{ background: 'var(--color-secondary)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Export PDF
                </button>
                <button onClick={closePlayerCard} style={{ background: '#334155', color: '#f8fafc', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
              </div>
            </div>

            <div id="player-card-content" style={{ padding: '0.5rem' }}>
              {modalLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#38bdf8' }}>
                  <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto', display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                  Loading telemetry...
                </div>
              ) : playerData ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Cognitive Archetype</p>
                      <h3 style={{ margin: 0, color: getArchetypeColor(playerData.archetype), fontSize: '1.2rem', background: `${getArchetypeColor(playerData.archetype)}22`, padding: '0.4rem 0.8rem', borderRadius: '6px', display: 'inline-block' }}>{playerData.archetype}</h3>
                    </div>
                    <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Training Streak</p>
                      <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" color="#f59e0b"><path d="M17.5 19c-1.9 0-3.5-1.6-3.5-3.5 0-2.3 2.5-5.9 3.1-6.8.2-.2.5-.2.7 0 .6.9 3.1 4.5 3.1 6.8 0 1.9-1.6 3.5-3.5 3.5z"></path><path d="M11 21c-3.9 0-7-3.1-7-7 0-4.7 5.1-11.7 6.2-13.3.4-.6 1.3-.6 1.7 0 1.1 1.6 6.2 8.6 6.2 13.3 0 3.9-3.1 7-7 7z"></path></svg>
                        {playerData.streak} Days
                      </h3>
                    </div>
                    <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total XP Earned</p>
                      <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.5rem' }}>{playerData.user.xp || 0} XP</h3>
                    </div>
                  </div>

                  {/* Micro View: Longitudinal Chart */}
                  {playerHistory && playerHistory.length === 0 && (
                    <div style={{ background: '#0f172a', padding: '3rem 1.5rem', borderRadius: '8px', border: '1px dashed #334155', marginBottom: '2rem', textAlign: 'center' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '1.1rem' }}>Baseline Telemetry Pending</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>Subject has not completed any cognitive training modules. Longitudinal data will appear here once sessions are recorded.</p>
                    </div>
                  )}
                  {playerHistory && playerHistory.length > 0 && (
                    <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '2rem' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>Longitudinal Learning Curve</h4>
                      <div style={{ width: '100%', height: '220px' }}>
                        <Line 
                          data={{
                            labels: playerHistory.map((_, i) => 'S' + (i + 1)),
                            datasets: [
                              {
                                label: 'Avg Accuracy (%)',
                                data: playerHistory.map(s => s.avg_acc * 100),
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                yAxisID: 'y'
                              },
                              {
                                label: 'Reaction Time (ms)',
                                data: playerHistory.map(s => s.avg_rt),
                                borderColor: '#38bdf8',
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                yAxisID: 'y1'
                              }
                            ]
                          }}
                          options={{
                            maintainAspectRatio: false,
                            scales: {
                              x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                              y: { type: 'linear', position: 'left', min: 0, max: 100, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                              y1: { type: 'linear', position: 'right', grid: { display: false }, ticks: { color: '#94a3b8' } }
                            },
                            plugins: { legend: { labels: { color: '#cbd5e1' } } }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"></path></svg>
                    Behavioral Micro-Metrics & Performance Breakdown
                  </h4>
                  
                  <div style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#0f172a' }}>
                      <thead>
                        <tr style={{ background: '#1e293b' }}>
                          <th style={thStyle}>Game Module</th>
                          <th style={thStyle}>Sessions</th>
                          <th style={thStyle}>Avg Accuracy</th>
                          <th style={thStyle}>Avg Reaction</th>
                          <th style={thStyle}>Avg Hesitation</th>
                          <th style={thStyle}>Panic Clicks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerData.game_breakdown.map((g, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #1e293b' }}>
                            <td style={{...tdStyle, fontWeight: 'bold'}}>{g.game_type}</td>
                            <td style={tdStyle}>{g.plays}</td>
                            <td style={tdStyle}>
                              <span style={{ color: g.avg_acc > 0.8 ? '#10b981' : g.avg_acc > 0.5 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                                {Math.round((g.avg_acc || 0)*100)}%
                              </span>
                            </td>
                            <td style={tdStyle}>{Math.round(g.avg_rt || 0)} ms</td>
                            <td style={tdStyle}>{Math.round(g.avg_hesitation || 0)} ms</td>
                            <td style={tdStyle}>
                              <span style={{ color: (g.avg_spam_clicks > 5) ? '#ef4444' : '#94a3b8' }}>
                                {Math.round(g.avg_spam_clicks || 0)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {playerData.game_breakdown.length === 0 && <tr><td colSpan="6" style={{...tdStyle, textAlign: 'center', color: '#64748b', padding: '2rem'}}>No gameplay telemetry available.</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b', padding: '0 0.5rem' }}>
                    <span><strong style={{ color: '#94a3b8' }}>Hesitation:</strong> Avg MS elapsed before first interaction.</span>
                    <span><strong style={{ color: '#94a3b8' }}>Panic Clicks:</strong> Non-target rapid clicks indicating frustration or guessing.</span>
                  </div>
                  
                  <div style={{ marginTop: '2.5rem', background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.2rem 0', color: '#fca5a5', fontSize: '1.1rem' }}>Moderation & Control</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Restrict or restore this subject's access to the training platform.</p>
                      </div>
                      <button 
                        onClick={() => suspendUser(selectedUser)}
                        style={{ 
                          background: playerData.user.status === 'suspended' ? '#10b981' : '#ef4444', 
                          color: '#fff', 
                          border: 'none', 
                          padding: '0.6rem 1.2rem', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: playerData.user.status === 'suspended' ? '0 4px 10px rgba(16, 185, 129, 0.3)' : '0 4px 10px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        {playerData.user.status === 'suspended' ? (
                          <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Restore Access</>
                        ) : (
                          <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Suspend Subject</>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : <p style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>Failed to retrieve telemetry profile.</p>}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .table-row-hover:hover {
          background: rgba(56, 189, 248, 0.05) !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const cardStyle = {
  background: '#1e293b',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #334155',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
};

const cardIconStyle = {
  position: 'absolute',
  top: '1.5rem',
  right: '1.5rem',
  color: '#475569',
  opacity: 0.5
};

const cardLabelStyle = {
  margin: '0 0 0.5rem 0',
  color: '#94a3b8',
  fontSize: '1rem',
  fontWeight: '500'
};

const metricStyle = {
  fontSize: '2.5rem',
  fontWeight: '800',
  margin: 0,
  letterSpacing: '-1px'
};

const thStyle = {
  padding: '1.2rem 1.5rem',
  color: '#94a3b8',
  fontWeight: '600',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tdStyle = {
  padding: '1.2rem 1.5rem',
  color: '#e2e8f0',
  fontSize: '0.95rem'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(15, 23, 42, 0.85)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(8px)'
};

const modalContentStyle = {
  background: '#1e293b',
  padding: '0',
  borderRadius: '16px',
  width: '95%',
  maxWidth: '900px',
  maxHeight: '90vh',
  overflowY: 'auto',
  border: '1px solid #334155',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset'
};

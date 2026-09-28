import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect, useMemo } from 'react';
import useCogniStore from '../store/useCogniStore';
import cogniFX from '../utils/cogniFX';
import { Radar, Line, Scatter } from 'react-chartjs-2';
import HoverTooltip from './HoverTooltip';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale);

const ProfileModal = ({ onClose }) => {
  const { user, token, coins, inventory, totalXp, reduceFlashes, fetchInventory } = useCogniStore();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [profileData, setProfileData] = useState(null);
  const [domainStats, setDomainStats] = useState([]);
  const [timelineStats, setTimelineStats] = useState([]);
  const [cognitiveProfile, setCognitiveProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  const [hoveredBadge, setHoveredBadge] = useState(null);
  const [metricToggle, setMetricToggle] = useState('accuracy'); // 'accuracy' or 'reactionTime'
  const [kpis, setKpis] = useState({ total_games: 0, highest_level: 1, overall_accuracy: 0 });
  const [loading, setLoading] = useState(true);

  // Settings State
  const [isSaving, setIsSaving] = useState(false);
  const [localReduceFlashes, setLocalReduceFlashes] = useState(reduceFlashes);
  const [localVolume, setLocalVolume] = useState(cogniFX._masterVolume || 0.18);
  const [localDistractors, setLocalDistractors] = useState(cogniFX._distractorsEnabled !== false);

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setLocalVolume(vol);
    cogniFX.setMasterVolume(vol);
  };

  const handleDistractorsToggle = () => {
    const val = !localDistractors;
    setLocalDistractors(val);
    cogniFX.setDistractorsEnabled(val);
  };

  const username = typeof user === 'object' && user !== null ? user.username : user;

  const RARITY_STYLES = {
    common: { gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', glow: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', label: 'Common', labelColor: '#94a3b8' },
    rare: { gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', label: 'Rare', labelColor: '#60a5fa' },
    epic: { gradient: 'linear-gradient(135deg, var(--color-secondary), #c084fc)', glow: 'rgba(var(--rgb-secondary), 0.15)', border: 'rgba(var(--rgb-secondary), 0.4)', label: 'Epic', labelColor: '#c084fc' },
    legendary: { gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', label: 'Legendary', labelColor: '#fbbf24' },
  };

  const achievementMeta = {
    'first_steps': { title: 'First Steps', icon: '👣', description: 'Complete your first cognitive training game.', reward: '100 Coins', target: 1, rarity: 'common' },
    'consistency': { title: 'Consistent Trainer', icon: '🔥', description: 'Complete 50 cognitive training games.', reward: '500 Coins', target: 50, rarity: 'rare' },
    'sharpshooter': { title: 'Sharpshooter', icon: '🏹', description: 'Achieve 90%+ accuracy 20 times.', reward: '500 Coins', target: 20, rarity: 'rare' },
    'versatile_mind': { title: 'Versatile Mind', icon: '🎮', description: 'Play all 5 different game types.', reward: '400 Coins', target: 5, rarity: 'rare' },
    'on_fire': { title: 'On Fire', icon: '🔥', description: 'Achieve a 7-day login streak.', reward: '750 Coins', target: 7, rarity: 'rare' },
    'speed_demon': { title: 'Speed Demon', icon: '⚡', description: 'Achieve a reaction time under 400ms 10 times.', reward: 'Exclusive Avatar', target: 10, rarity: 'epic' },
    'scholar': { title: 'Scholar', icon: '🎓', description: 'Reach Level 10.', reward: 'Exclusive Banner', target: 1, rarity: 'epic' },
    'lightning_reflexes': { title: 'Lightning Reflexes', icon: '⚡', description: 'Achieve a reaction time under 300ms.', reward: '200 Coins + Exclusive Banner', target: 1, rarity: 'epic' },
    'brain_marathon': { title: 'Brain Marathon', icon: '🧠', description: 'Complete 10 cognitive games in a single day.', reward: '300 Coins', target: 10, rarity: 'epic' },
    'accuracy_master': { title: 'Accuracy Master', icon: '🎯', description: 'Achieve a perfect 100% accuracy score 5 times.', reward: '1,000 Coins', target: 5, rarity: 'legendary' },
    'peak_performer': { title: 'Peak Performer', icon: '🏔️', description: 'Reach maximum difficulty level 5.', reward: '1,000 Coins', target: 1, rarity: 'legendary' },
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Leaderboard to find own profile data (XP, Level, etc)
      const lbRes = await fetch(API_BASE + '/api/leaderboard');
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        const me = lbData.leaderboard.find(p => p.username === username);
        if (me) setProfileData(me);
      }

      const anRes = await fetch(`${API_BASE}/api/user-analytics/${username}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (anRes.ok) {
        const anData = await anRes.json();
        if (anData.status === 'success') {
          setTimelineStats(anData.timeline_stats || []);
          setDomainStats(anData.domain_stats || []);
          if (anData.cognitive_profile) {
            setCognitiveProfile(anData.cognitive_profile);
          }
          if (anData.recent_activity) {
            setRecentActivity(anData.recent_activity);
          }
          if (anData.kpis) {
            setKpis(anData.kpis);
          }
        }
      }

      const achRes = await fetch(API_BASE + '/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } });
      if (achRes.ok) {
        const achData = await achRes.json();
        setAchievements(achData.achievements || []);
      }

      const goalRes = await fetch(`${API_BASE}/api/training-goals/${username}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setActiveGoals(goalData.goals?.filter(g => !g.is_completed) || []);
      }

    } catch (e) {
      console.error('Failed fetching profile data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlashes = async () => {
    const newValue = !localReduceFlashes;
    setLocalReduceFlashes(newValue);
    setIsSaving(true);
    try {
      const res = await fetch(API_BASE + '/api/settings/accessibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reduce_flashes: newValue })
      });
      if (res.ok) await fetchInventory();
    } catch (e) {
      setLocalReduceFlashes(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  const equippedAvatar = (inventory || []).find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id;
  const avatarIcon = equippedAvatar === 'avatar-robot' ? '🤖' : equippedAvatar === 'avatar-brain' ? '🧠' : equippedAvatar === 'avatar-hacker' ? '👨‍💻' : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 5px rgba(var(--rgb-primary),0.5))' }}><circle cx="12" cy="8" r="4" fill="var(--color-primary)"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/></svg>;

  const equippedBanner = (inventory || []).find(i => i.item_type === 'banner' && i.is_equipped)?.item_id;
  const bannerBackgrounds = {
    'banner-neon': 'linear-gradient(135deg, rgba(255, 0, 127, 0.2) 0%, rgba(121, 40, 202, 0.2) 100%)',
    'banner-stellar': 'linear-gradient(135deg, rgba(15, 32, 39, 0.5) 0%, rgba(32, 58, 67, 0.5) 50%, rgba(44, 83, 100, 0.5) 100%)',
    'banner-cyber': 'linear-gradient(135deg, rgba(0, 180, 219, 0.2) 0%, rgba(0, 131, 176, 0.2) 100%)',
  };
  const headerBg = equippedBanner && bannerBackgrounds[equippedBanner] ? bannerBackgrounds[equippedBanner] : 'transparent';

  const radarData = useMemo(() => ({
    labels: domainStats.map(d => (d.cognitive_domain || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')),
    datasets: [{
      label: 'Accuracy %',
      data: domainStats.map(d => (d.avg_accuracy * 100).toFixed(1)),
      backgroundColor: 'rgba(var(--rgb-primary), 0.4)',
      borderColor: 'rgba(var(--rgb-primary), 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(var(--rgb-primary), 1)',
    }]
  }), [domainStats]);
  const radarOptions = { scales: { r: { angleLines: { color: 'rgba(255, 255, 255, 0.1)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, pointLabels: { color: '#e2e8f0', font: { size: 11 } }, ticks: { backdropColor: 'transparent', color: '#94a3b8', min: 0, max: 100 } } }, plugins: { legend: { display: false } }, maintainAspectRatio: false };

  const lineData = useMemo(() => ({
    labels: timelineStats.map(d => {
      const dateObj = new Date(d.day);
      return isNaN(dateObj.getTime()) ? d.day : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{ 
      label: metricToggle === 'accuracy' ? 'Accuracy (%)' : 'Reaction Time (ms)', 
      data: timelineStats.map(d => metricToggle === 'accuracy' ? (d.avg_accuracy * 100).toFixed(1) : d.avg_rt), 
      borderColor: metricToggle === 'accuracy' ? '#10b981' : 'var(--color-secondary)', 
      backgroundColor: metricToggle === 'accuracy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(var(--rgb-secondary), 0.2)', 
      fill: true, 
      tension: 0.4 
    }]
  }), [timelineStats, metricToggle]);
  const lineOptions = { scales: { x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' }, min: metricToggle === 'accuracy' ? 0 : undefined, max: metricToggle === 'accuracy' ? 100 : undefined } }, plugins: { legend: { display: false } }, maintainAspectRatio: false };

  const scatterData = useMemo(() => ({
    datasets: [
      {
        label: 'Fast Learner Core',
        data: [{ x: 950, y: 85 }],
        backgroundColor: 'rgba(var(--rgb-primary), 0.1)',
        borderColor: 'rgba(var(--rgb-primary), 0.4)',
        pointRadius: 40,
        pointHoverRadius: 40
      },
      {
        label: 'Plateauing Core',
        data: [{ x: 1200, y: 65 }],
        backgroundColor: 'rgba(192, 132, 252, 0.1)',
        borderColor: 'rgba(192, 132, 252, 0.4)',
        pointRadius: 40,
        pointHoverRadius: 40
      },
      {
        label: 'High Fatigue Core',
        data: [{ x: 2000, y: 40 }],
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
        pointRadius: 40,
        pointHoverRadius: 40
      },
      {
        label: 'Your Position',
        data: [{ 
          x: timelineStats.length > 0 ? timelineStats.reduce((acc, curr) => acc + curr.avg_rt, 0) / timelineStats.length : 1200, 
          y: kpis.overall_accuracy * 100 || 60
        }],
        backgroundColor: '#ffffff',
        borderColor: '#ffffff',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'circle'
      }
    ]
  }), [timelineStats, kpis]);

  const scatterOptions = {
    scales: {
      x: { title: { display: true, text: 'Reaction Time (ms) - Faster is Better', color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' }, reverse: true, min: 200, max: 3000 },
      y: { title: { display: true, text: 'Accuracy (%)', color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' }, min: 0, max: 100 }
    },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ctx.dataset.label } } },
    maintainAspectRatio: false
  };

  const getArchetypeTheme = (name) => {
    switch (name) {
      case 'Fast Learner': return { color: 'var(--color-primary)', icon: '⚡', gradient: 'rgba(var(--rgb-primary), 0.15)' };
      case 'High Fatigue': return { color: '#f59e0b', icon: '🔋', gradient: 'rgba(245, 158, 11, 0.15)' };
      case 'Plateauing': return { color: '#c084fc', icon: '📈', gradient: 'rgba(192, 132, 252, 0.15)' };
      default: return { color: '#94a3b8', icon: '🧠', gradient: 'rgba(148, 163, 184, 0.15)' };
    }
  };

  const xp = profileData ? profileData.xp : (totalXp || 0);
  const level = profileData ? profileData.level : (Math.floor((totalXp || 0) / 500) + 1);
  const xpForNextLevel = level * 500;
  const currentLevelXp = xp - ((level - 1) * 500);
  const xpPercent = Math.min(100, Math.floor((currentLevelXp / 500) * 100));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '16px', width: '95%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', background: headerBg }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(var(--rgb-primary), 0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '2px solid var(--color-primary)' }}>
                {avatarIcon}
              </div>
              <div>
                <h2 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{username}</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><svg width="16" height="16" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#fbbf24"/><circle cx="12" cy="12" r="8" fill="#f59e0b"/><text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f" fontFamily="Arial">C</text></svg> {coins} Coins</span>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-secondary)" style={{ filter: 'drop-shadow(0 0 4px rgba(var(--rgb-secondary),0.8))', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="var(--color-secondary)"/>
                    </svg>
                    Level {level}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={{ display: 'flex', px: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
            {['overview', 'stats', 'ai report', 'badges', 'settings'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '1rem', background: 'transparent', border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--color-primary)' : '#94a3b8',
                fontWeight: 'bold', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s'
              }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: 0.7 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="skeleton-box" style={{ height: '80px', borderRadius: '12px' }}></div>
                <div className="skeleton-box" style={{ height: '80px', borderRadius: '12px' }}></div>
                <div className="skeleton-box" style={{ height: '80px', borderRadius: '12px' }}></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="skeleton-box" style={{ height: '300px', borderRadius: '12px' }}></div>
                <div className="skeleton-box" style={{ height: '300px', borderRadius: '12px' }}></div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                      <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>Level Progression</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94a3b8' }}>
                        <span>Level {level}</span>
                        <span>Level {level + 1}</span>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: '#1e293b', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ width: `${xpPercent}%`, height: '100%', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }} />
                      </div>
                      <div style={{ textAlign: 'center', color: 'var(--color-secondary)', fontSize: '0.85rem' }}>
                        {currentLevelXp} / 500 XP to next level (+500 Coins Reward!)
                      </div>
                    </div>
                    
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(var(--rgb-primary), 0.2)' }}>
                      <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{color: 'var(--color-primary)'}}>🎯</span> Current Active Goal
                      </h3>
                      {activeGoals.length > 0 ? (
                        <div>
                          <div style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                            {activeGoals[0].domain.replace(/_/g, ' ')} - {activeGoals[0].metric_type}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                            <span>Progress</span>
                            <span>{activeGoals[0].current_value.toFixed(1)} / {activeGoals[0].target_value}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (activeGoals[0].current_value / activeGoals[0].target_value) * 100)}%`, height: '100%', background: 'var(--color-primary)' }} />
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>No active training goals. Play games to set one!</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Training Consistency</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                          🔥 {timelineStats.length > 0 ? timelineStats.length : 0} Days
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {Array.from({length: 21}).map((_, i) => {
                          const hasActivity = timelineStats.length > 0 && i < timelineStats.length; 
                          const stat = hasActivity ? timelineStats[i] : null;
                          const intensity = stat ? stat.avg_accuracy : 0;
                          
                          const bg = intensity >= 0.8 ? '#10b981' : 
                                     intensity >= 0.5 ? 'rgba(16, 185, 129, 0.6)' : 
                                     intensity > 0 ? 'rgba(16, 185, 129, 0.3)' : '#1e293b';
                                     
                          return <div key={i} style={{ width: '24px', height: '24px', borderRadius: '6px', background: bg, flexShrink: 0 }} title={stat ? `Day: ${stat.day}\nAccuracy: ${(stat.avg_accuracy * 100).toFixed(0)}%` : `No activity`} />
                        })}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Recent Badges</h3>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {achievements.slice(0, 3).map(ach => {
                          const meta = achievementMeta[ach.achievement_id];
                          if (!meta) return null;
                          const isHovered = hoveredBadge === ach.achievement_id;
                          return (
                            <div 
                              key={ach.achievement_id} 
                              style={{ position: 'relative' }}
                              onMouseEnter={() => setHoveredBadge(ach.achievement_id)}
                              onMouseLeave={() => setHoveredBadge(null)}
                            >
                              <div style={{ 
                                width: '48px', height: '48px', 
                                background: RARITY_STYLES[meta.rarity].glow, 
                                border: `1px solid ${RARITY_STYLES[meta.rarity].border}`, 
                                borderRadius: '12px', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', fontSize: '1.5rem', cursor: 'help',
                                transform: isHovered ? 'translateY(-2px) scale(1.05)' : 'none',
                                transition: 'all 0.2s ease',
                                boxShadow: isHovered ? `0 4px 12px ${RARITY_STYLES[meta.rarity].glow}` : 'none'
                              }}>
                                {meta.icon}
                              </div>
                              
                              {isHovered && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: 'calc(100% + 10px)',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '220px',
                                  background: 'rgba(15, 23, 42, 0.95)',
                                  border: `1px solid ${RARITY_STYLES[meta.rarity].border}`,
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px ' + RARITY_STYLES[meta.rarity].glow,
                                  zIndex: 50,
                                  pointerEvents: 'none',
                                  backdropFilter: 'blur(4px)'
                                }}>
                                  <div style={{ color: RARITY_STYLES[meta.rarity].labelColor, fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{meta.title}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{meta.rarity.toUpperCase()}</span>
                                  </div>
                                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                    {meta.description}
                                  </div>
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '-6px',
                                    left: '50%',
                                    transform: 'translateX(-50%) rotate(45deg)',
                                    width: '10px',
                                    height: '10px',
                                    background: 'rgba(15, 23, 42, 0.95)',
                                    borderRight: `1px solid ${RARITY_STYLES[meta.rarity].border}`,
                                    borderBottom: `1px solid ${RARITY_STYLES[meta.rarity].border}`,
                                  }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {achievements.length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No badges yet</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>Recent Sessions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {recentActivity.length > 0 ? recentActivity.map((session, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '36px', height: '36px', background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                              {session.game_type.includes('Speed') ? '⚡' : session.game_type.includes('Memory') ? '🧠' : '🎮'}
                            </div>
                            <div>
                              <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{session.game_type}</div>
                              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{new Date(session.start_time).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{(session.accuracy_rate * 100).toFixed(0)}% Acc</div>
                            <div style={{ color: 'var(--color-secondary)', fontSize: '0.75rem' }}>Lvl {session.difficulty_level}</div>
                          </div>
                        </div>
                      )) : (
                        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No recent activity found.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* KPI Cards Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <HoverTooltip text="Total number of valid neuro-training sessions recorded." delay={200}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(var(--rgb-primary), 0.1)' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Games Played</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>{kpis.total_games}</div>
                    </div>
                    </HoverTooltip>
                    <HoverTooltip text="The maximum difficulty tier you have achieved across all games." delay={200}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(var(--rgb-secondary), 0.1)' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Highest Level Reached</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>{kpis.highest_level}</div>
                    </div>
                    </HoverTooltip>
                    <HoverTooltip text="Average precision rate across all cognitive domains." delay={200}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Overall Accuracy</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>{(kpis.overall_accuracy * 100).toFixed(1)}%</div>
                    </div>
                    </HoverTooltip>
                  </div>

                  {/* Charts Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    
                    {/* Radar Chart */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', minHeight: '350px' }}>
                      <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', textAlign: 'center' }}>Cognitive Strengths</h3>
                      <div style={{ width: '100%', height: '250px' }}>
                        {domainStats.length > 0 ? <Radar data={radarData} options={radarOptions} /> : <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '100px' }}>No data</div>}
                      </div>
                    </div>

                    {/* Timeline Line Chart */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#f8fafc' }}>Performance Trend</h3>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px' }}>
                          <button 
                            onClick={() => setMetricToggle('accuracy')}
                            style={{ background: metricToggle === 'accuracy' ? 'var(--color-primary)' : 'transparent', color: metricToggle === 'accuracy' ? '#0f172a' : '#94a3b8', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Accuracy
                          </button>
                          <button 
                            onClick={() => setMetricToggle('reactionTime')}
                            style={{ background: metricToggle === 'reactionTime' ? 'var(--color-secondary)' : 'transparent', color: metricToggle === 'reactionTime' ? '#f8fafc' : '#94a3b8', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Reaction Time
                          </button>
                        </div>
                      </div>
                      <div style={{ width: '100%', height: '250px' }}>
                        {timelineStats.length > 0 ? <Line data={lineData} options={lineOptions} /> : <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '100px' }}>No data</div>}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Domain Breakdown */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>Domain Breakdown</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      {domainStats.map(d => {
                        const score = d.avg_accuracy * 100;
                        const domainName = (d.cognitive_domain || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                        return (
                          <div key={d.cognitive_domain} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.95rem' }}>
                              <span>{domainName}</span>
                              <span style={{ fontWeight: 'bold', color: score >= 80 ? '#10b981' : score >= 50 ? '#fbbf24' : '#ef4444' }}>{score.toFixed(1)}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${score}%`, height: '100%', background: score >= 80 ? '#10b981' : score >= 50 ? '#fbbf24' : '#ef4444', borderRadius: '4px' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai report' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {cognitiveProfile ? (() => {
                    const theme = getArchetypeTheme(cognitiveProfile.archetype_name);
                    return (
                      <>
                        {/* Archetype Banner */}
                        <div style={{ background: `linear-gradient(135deg, ${theme.gradient}, rgba(15, 23, 42, 0))`, padding: '2rem', borderRadius: '12px', border: `1px solid ${theme.color}40`, display: 'flex', alignItems: 'center', gap: '2rem' }}>
                          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${theme.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: `0 0 20px ${theme.color}40` }}>
                            {theme.icon}
                          </div>
                          <HoverTooltip text="Your cognitive archetype based on clustering analysis of your neuro-metrics." delay={200}>
                          <div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Current Archetype</div>
                            <div style={{ color: theme.color, fontWeight: 'bold', fontSize: '2rem', textShadow: `0 0 10px ${theme.color}60` }}>
                              {cognitiveProfile.archetype_name}
                            </div>
                            <HoverTooltip text="Confidence probability that you match this archetype cluster." delay={200}>
                            <div style={{ color: '#cbd5e1', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                              Predictive Match: <strong style={{ color: '#f8fafc' }}>{Math.round(cognitiveProfile.confidence_score * 100)}%</strong>
                            </div>
                            </HoverTooltip>
                          </div>
                          </HoverTooltip>
                        </div>

                        {/* AI Insights Bubble */}
                        <HoverTooltip text="Personalized coaching tips generated dynamically using AI based on your gameplay data." delay={200}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--color-primary)', position: 'relative' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🤖</span> AI Coaching Insight
                          </h4>
                          <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.6', fontSize: '1.05rem', fontStyle: 'italic' }}>
                            "{cognitiveProfile.insight_text}"
                          </p>
                        </div>
                        </HoverTooltip>

                        {/* Strengths & Bottlenecks */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>⭐</span> Top Strength</div>
                            <div style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 'bold' }}>
                              {cognitiveProfile.top_strength ? cognitiveProfile.top_strength.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                            </div>
                          </div>
                          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🚧</span> Primary Bottleneck</div>
                            <div style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                              {cognitiveProfile.primary_bottleneck ? cognitiveProfile.primary_bottleneck.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                              Recommended Game: <strong style={{ color: '#f8fafc' }}>{cognitiveProfile.recommended_game}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Cluster Map */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>Cluster Positioning Map</h4>
                          <div style={{ width: '100%', height: '300px' }}>
                            <Scatter data={scatterData} options={scatterOptions} />
                          </div>
                        </div>
                      </>
                    );
                  })() : (
                    <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                      Play more games to generate your AI Cognitive Profile.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'badges' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {Object.keys(achievementMeta).map(id => {
                    const meta = achievementMeta[id];
                    const serverData = achievements.find(a => a.achievement_id === id);
                    const current = serverData ? serverData.current_amount : 0;
                    const completed = serverData ? !!serverData.is_completed : false;
                    const progress = Math.min(current, meta.target);
                    const percent = Math.floor((progress / meta.target) * 100);
                    const rarity = RARITY_STYLES[meta.rarity] || RARITY_STYLES.common;

                    return (
                      <div key={id} style={{
                        background: completed ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${completed ? rarity.border : 'rgba(255, 255, 255, 0.05)'}`,
                        boxShadow: completed ? `0 0 15px ${rarity.glow}` : 'none',
                        padding: '1.5rem', 
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        opacity: completed ? 1 : 0.6,
                        filter: completed ? 'none' : 'grayscale(0.8)',
                        transition: 'all 0.3s ease',
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ 
                              width: '50px', height: '50px', borderRadius: '12px', 
                              background: completed ? rarity.glow : 'rgba(255,255,255,0.05)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
                              border: `1px solid ${completed ? rarity.border : 'transparent'}`
                            }}>
                              {meta.icon}
                            </div>
                            <div style={{ 
                              background: rarity.gradient,
                              padding: '4px 10px', borderRadius: '12px',
                              fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase',
                              color: '#fff', letterSpacing: '0.05em',
                              boxShadow: `0 2px 5px ${rarity.glow}`
                            }}>
                              {rarity.label}
                            </div>
                          </div>
                          
                          <h3 style={{ color: completed ? rarity.labelColor : '#cbd5e1', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                            {meta.title}
                          </h3>
                          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem 0', lineHeight: '1.4' }}>{meta.description}</p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: completed ? '#fbbf24' : '#64748b', fontWeight: 'bold' }}>🎁 {meta.reward}</span>
                            <span style={{ fontSize: '0.8rem', color: completed ? rarity.labelColor : '#64748b', fontWeight: 'bold' }}>
                              {completed ? 'COMPLETED' : `${progress} / ${meta.target}`}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${percent}%`, height: '100%',
                              background: completed ? rarity.gradient : '#475569',
                              borderRadius: '3px',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0' }}>Reduce Flashing Effects</h3>
                      <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>Disables intense visual strobing and animations.</p>
                    </div>
                    <button onClick={handleToggleFlashes} disabled={isSaving} style={{ width: '50px', height: '26px', borderRadius: '13px', background: localReduceFlashes ? '#10b981' : '#334155', border: 'none', position: 'relative', cursor: 'pointer' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', position: 'absolute', top: '2px', left: localReduceFlashes ? '26px' : '2px', transition: 'left 0.3s' }} />
                    </button>
                  </div>
                  
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <h3 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0' }}>Master Audio Volume</h3>
                      <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>Adjust overall sound effects level.</p>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={localVolume} 
                      onChange={handleVolumeChange} 
                      style={{ width: '120px', accentColor: 'var(--color-secondary)' }}
                    />
                  </div>
                  
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0' }}>Adaptive Distractors</h3>
                      <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>Enable auditory/visual noise during high-difficulty challenges.</p>
                    </div>
                    <button onClick={handleDistractorsToggle} style={{ width: '50px', height: '26px', borderRadius: '13px', background: localDistractors ? 'var(--color-secondary)' : '#334155', border: 'none', position: 'relative', cursor: 'pointer' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', position: 'absolute', top: '2px', left: localDistractors ? '26px' : '2px', transition: 'left 0.3s' }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

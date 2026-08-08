import { API_BASE } from '../utils/apiClient.js';
import React, { useState, useEffect } from 'react';
import useCogniStore from '../store/useCogniStore';
import { Radar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale);

const ProfileModal = ({ onClose }) => {
  const { user, token, coins, inventory, reduceFlashes, fetchInventory } = useCogniStore();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [profileData, setProfileData] = useState(null);
  const [domainStats, setDomainStats] = useState([]);
  const [timelineStats, setTimelineStats] = useState([]);
  const [cognitiveProfile, setCognitiveProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [isSaving, setIsSaving] = useState(false);
  const [localReduceFlashes, setLocalReduceFlashes] = useState(reduceFlashes);

  const username = typeof user === 'object' && user !== null ? user.username : user;

  const RARITY_STYLES = {
    common: { gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', glow: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', label: 'Common', labelColor: '#94a3b8' },
    rare: { gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', label: 'Rare', labelColor: '#60a5fa' },
    epic: { gradient: 'linear-gradient(135deg, #a855f7, #c084fc)', glow: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', label: 'Epic', labelColor: '#c084fc' },
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

      // 2. Fetch Analytics
      const anRes = await fetch(`${API_BASE}/api/user-analytics/${username}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (anRes.ok) {
        const anData = await anRes.json();
        setDomainStats(anData.domain_stats || []);
        setTimelineStats(anData.timeline_stats || []);
        if (anData.cognitive_profile) {
          setCognitiveProfile(anData.cognitive_profile);
        }
      }

      // 3. Fetch Achievements
      const achRes = await fetch(API_BASE + '/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } });
      if (achRes.ok) {
        const achData = await achRes.json();
        setAchievements(achData.achievements || []);
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

  const radarData = {
    labels: domainStats.map(d => d.cognitive_domain.toUpperCase()),
    datasets: [{
      label: 'Accuracy %',
      data: domainStats.map(d => (d.avg_accuracy * 100).toFixed(1)),
      backgroundColor: 'rgba(56, 189, 248, 0.4)',
      borderColor: 'rgba(56, 189, 248, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(56, 189, 248, 1)',
    }]
  };
  const radarOptions = { scales: { r: { angleLines: { color: 'rgba(255, 255, 255, 0.1)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, pointLabels: { color: '#e2e8f0', font: { size: 10 } }, ticks: { backdropColor: 'transparent', color: '#94a3b8', min: 0, max: 100 } } }, plugins: { legend: { display: false } }, maintainAspectRatio: false };

  const lineData = {
    labels: timelineStats.map(d => d.day),
    datasets: [{ label: 'Avg Accuracy (%)', data: timelineStats.map(d => (d.avg_accuracy * 100).toFixed(1)), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)', fill: true, tension: 0.4 }]
  };
  const lineOptions = { scales: { x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' }, min: 0, max: 100 } }, plugins: { legend: { display: false } }, maintainAspectRatio: false };

  const equippedAvatar = (inventory || []).find(i => i.item_type === 'avatar' && i.is_equipped)?.item_id;
  const avatarIcon = equippedAvatar === 'avatar-robot' ? '🤖' : equippedAvatar === 'avatar-brain' ? '🧠' : equippedAvatar === 'avatar-hacker' ? '👨‍💻' : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 5px rgba(56,189,248,0.5))' }}><circle cx="12" cy="8" r="4" fill="#38bdf8"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/></svg>;

  const equippedBanner = (inventory || []).find(i => i.item_type === 'banner' && i.is_equipped)?.item_id;
  const bannerBackgrounds = {
    'banner-neon': 'linear-gradient(135deg, rgba(255, 0, 127, 0.2) 0%, rgba(121, 40, 202, 0.2) 100%)',
    'banner-stellar': 'linear-gradient(135deg, rgba(15, 32, 39, 0.5) 0%, rgba(32, 58, 67, 0.5) 50%, rgba(44, 83, 100, 0.5) 100%)',
    'banner-cyber': 'linear-gradient(135deg, rgba(0, 180, 219, 0.2) 0%, rgba(0, 131, 176, 0.2) 100%)',
  };
  const headerBg = equippedBanner && bannerBackgrounds[equippedBanner] ? bannerBackgrounds[equippedBanner] : 'transparent';

  // XP Calculations
  const xp = profileData ? profileData.xp : 0;
  const level = profileData ? profileData.level : 1;
  const xpForNextLevel = level * 500;
  const currentLevelXp = xp - ((level - 1) * 500);
  const xpPercent = Math.min(100, Math.floor((currentLevelXp / 500) * 100));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '16px', width: '95%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
        
        {/* Header (Avatar & Tabs) */}
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', background: headerBg }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '2px solid #38bdf8' }}>
                {avatarIcon}
              </div>
              <div>
                <h2 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{username}</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><svg width="16" height="16" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#fbbf24"/><circle cx="12" cy="12" r="8" fill="#f59e0b"/><text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f" fontFamily="Arial">C</text></svg> {coins} Coins</span>
                  <span style={{ color: '#a855f7', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#a855f7" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#a855f7"/>
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
                borderBottom: activeTab === tab ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === tab ? '#38bdf8' : '#94a3b8',
                fontWeight: 'bold', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s'
              }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Loading profile data...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>Level Progression</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94a3b8' }}>
                      <span>Level {level}</span>
                      <span>Level {level + 1}</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: '#1e293b', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                      <div style={{ width: `${xpPercent}%`, height: '100%', background: 'linear-gradient(to right, #38bdf8, #a855f7)' }} />
                    </div>
                    <div style={{ textAlign: 'center', color: '#a855f7', fontSize: '0.85rem' }}>
                      {currentLevelXp} / 500 XP to next level (+500 Coins Reward!)
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', height: '300px' }}>
                    <h3 style={{ color: '#e2e8f0', margin: '0 0 1rem 0', fontSize: '1.1rem', textAlign: 'center' }}>Cognitive Strengths</h3>
                    {domainStats.length > 0 ? <Radar data={radarData} options={radarOptions} /> : <div style={{ color: '#94a3b8', textAlign: 'center' }}>No data</div>}
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', height: '300px' }}>
                    <h3 style={{ color: '#e2e8f0', margin: '0 0 1rem 0', fontSize: '1.1rem', textAlign: 'center' }}>Accuracy Trend</h3>
                    {timelineStats.length > 0 ? <Line data={lineData} options={lineOptions} /> : <div style={{ color: '#94a3b8', textAlign: 'center' }}>No data</div>}
                  </div>
                </div>
              )}

              {activeTab === 'ai report' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Cognitive AI Diagnostics</h3>
                    {cognitiveProfile ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `conic-gradient(#38bdf8 ${Math.round(cognitiveProfile.confidence_score * 100)}%, rgba(255,255,255,0.1) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                              <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '1.2rem' }}>{Math.round(cognitiveProfile.confidence_score * 100)}%</span>
                              <span style={{ color: '#94a3b8', fontSize: '0.6rem', textTransform: 'uppercase' }}>Match</span>
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Current Archetype</div>
                            <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '1.8rem', textShadow: '0 0 10px rgba(56, 189, 248, 0.3)' }}>{cognitiveProfile.archetype_name}</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px' }}>
                             <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📈</span> Projected Growth</h4>
                             <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Based on learning curves, +15% accuracy expected in next 3 sessions.</p>
                          </div>
                          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '12px' }}>
                             <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🎯</span> Next Milestone</h4>
                             <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Reach Level 4 in Spatial-Visual games to unlock 'The Visionary'.</p>
                          </div>
                        </div>

                        <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(15, 23, 42, 0))', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #a855f7' }}>
                          <h4 style={{ margin: '0 0 0.75rem 0', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 4px rgba(192,132,252,0.7))',verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="7" rx="7" ry="5" stroke="#c084fc" strokeWidth="1.8"/><path d="M5 10c0 3 3 6 7 6s7-3 7-6" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="13" x2="9" y2="19" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/><line x1="15" y1="13" x2="15" y2="19" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="19" x2="17" y2="19" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/></svg></span> AI Trajectory Prediction</h4>
                          <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.6', fontSize: '0.95rem' }}>{cognitiveProfile.trajectory_msg}</p>
                          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ flex: 1, height: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                               <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #c084fc, #38bdf8)' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Predictive Confidence: High</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                        Play more games to generate your AI Cognitive Profile.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'badges' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.keys(achievementMeta).map(id => {
                    const meta = achievementMeta[id];
                    const serverData = achievements.find(a => a.achievement_id === id);
                    const current = serverData ? serverData.current_amount : 0;
                    const completed = serverData ? serverData.is_completed === 1 : false;
                    const progress = Math.min(current, meta.target);
                    const percent = Math.floor((progress / meta.target) * 100);
                    const rarity = RARITY_STYLES[meta.rarity] || RARITY_STYLES.common;

                    return (
                      <div key={id} style={{
                        background: completed ? rarity.glow : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${completed ? rarity.border : 'rgba(255, 255, 255, 0.05)'}`,
                        padding: '1rem', borderRadius: '12px',
                        opacity: completed ? 1 : 0.85,
                        transition: 'all 0.3s ease',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '1.4rem' }}>{meta.icon}</span>
                            <div>
                              <h3 style={{ color: completed ? rarity.labelColor : '#e2e8f0', margin: 0, fontSize: '0.95rem' }}>
                                {meta.title} {completed && '✅'}
                              </h3>
                              <span style={{
                                fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                background: rarity.gradient,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                              }}>
                                {rarity.label}
                              </span>
                            </div>
                          </div>
                          <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 'bold' }}>🎁 {meta.reward}</div>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>{meta.description}</p>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                            <span>Progress</span><span>{progress} / {meta.target}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px' }}>
                            <div style={{
                              width: `${percent}%`, height: '100%',
                              background: completed ? rarity.gradient : '#38bdf8',
                              borderRadius: '4px',
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
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0' }}>Reduce Flashing Effects</h3>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>Disables intense visual strobing and animations.</p>
                  </div>
                  <button onClick={handleToggleFlashes} disabled={isSaving} style={{ width: '50px', height: '26px', borderRadius: '13px', background: localReduceFlashes ? '#10b981' : '#334155', border: 'none', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', position: 'absolute', top: '2px', left: localReduceFlashes ? '26px' : '2px', transition: 'left 0.3s' }} />
                  </button>
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

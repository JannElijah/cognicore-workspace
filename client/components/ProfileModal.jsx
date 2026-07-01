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
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [isSaving, setIsSaving] = useState(false);
  const [localReduceFlashes, setLocalReduceFlashes] = useState(reduceFlashes);

  const username = typeof user === 'object' && user !== null ? user.username : user;

  const achievementMeta = {
    'speed_demon': { title: 'Speed Demon', description: 'Achieve a reaction time under 400ms 10 times.', reward: 'Exclusive Avatar: ⚡', target: 10 },
    'scholar': { title: 'Scholar', description: 'Reach Level 10.', reward: 'Exclusive Banner: Scholar', target: 1 },
    'first_steps': { title: 'First Steps', description: 'Complete your first cognitive training game.', reward: '100 Coins', target: 1 },
    'consistency': { title: 'Consistent Trainer', description: 'Complete 50 cognitive training games.', reward: '500 Coins', target: 50 },
    'accuracy_master': { title: 'Accuracy Master', description: 'Achieve a perfect 100% accuracy score 5 times.', reward: '1,000 Coins', target: 5 }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Leaderboard to find own profile data (XP, Level, etc)
      const lbRes = await fetch('http://127.0.0.1:5000/api/leaderboard');
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        const me = lbData.leaderboard.find(p => p.username === username);
        if (me) setProfileData(me);
      }

      // 2. Fetch Analytics
      const anRes = await fetch(`http://127.0.0.1:5000/api/user-analytics/${username}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (anRes.ok) {
        const anData = await anRes.json();
        setDomainStats(anData.domain_stats || []);
        setTimelineStats(anData.timeline_stats || []);
      }

      // 3. Fetch Achievements
      const achRes = await fetch('http://127.0.0.1:5000/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } });
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
      const res = await fetch('http://127.0.0.1:5000/api/settings/accessibility', {
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
  const avatarIcon = equippedAvatar === 'avatar-robot' ? '🤖' : equippedAvatar === 'avatar-brain' ? '🧠' : equippedAvatar === 'avatar-hacker' ? '👨‍💻' : equippedAvatar === 'avatar-speed-demon' ? '⚡' : '👤';

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
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '2px solid #38bdf8' }}>
                {avatarIcon}
              </div>
              <div>
                <h2 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{username}</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>🪙 {coins} Coins</span>
                  <span style={{ color: '#a855f7', fontWeight: 'bold' }}>⭐ Level {level}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={{ display: 'flex', px: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
            {['overview', 'stats', 'badges', 'settings'].map(tab => (
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

              {activeTab === 'badges' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.keys(achievementMeta).map(id => {
                    const meta = achievementMeta[id];
                    const serverData = achievements.find(a => a.achievement_id === id);
                    const current = serverData ? serverData.current_amount : 0;
                    const completed = serverData ? serverData.is_completed === 1 : false;
                    const progress = Math.min(current, meta.target);
                    const percent = Math.floor((progress / meta.target) * 100);

                    return (
                      <div key={id} style={{ background: completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)', border: `1px solid ${completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`, padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <h3 style={{ color: completed ? '#10b981' : '#e2e8f0', margin: 0 }}>{meta.title} {completed && '✅'}</h3>
                          <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 'bold' }}>🎁 {meta.reward}</div>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>{meta.description}</p>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                            <span>Progress</span><span>{progress} / {meta.target}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: completed ? '#10b981' : '#38bdf8', borderRadius: '4px' }} />
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

import React, { useState, useEffect } from 'react';
import audioEngine from '../utils/audioEngine';

const ACHIEVEMENT_META = {
  'speed_demon': { title: 'Speed Demon', icon: '⚡', rarity: 'epic', reward: 'Exclusive Avatar' },
  'scholar': { title: 'Scholar', icon: '🎓', rarity: 'epic', reward: 'Exclusive Banner' },
  'first_steps': { title: 'First Steps', icon: '👣', rarity: 'common', reward: '100 Coins' },
  'consistency': { title: 'Consistent Trainer', icon: '🔥', rarity: 'rare', reward: '500 Coins' },
  'accuracy_master': { title: 'Accuracy Master', icon: '🎯', rarity: 'legendary', reward: '1,000 Coins' },
  'sharpshooter': { title: 'Sharpshooter', icon: '🏹', rarity: 'rare', reward: '500 Coins' },
  'lightning_reflexes': { title: 'Lightning Reflexes', icon: '⚡', rarity: 'epic', reward: '200 Coins + Banner' },
  'peak_performer': { title: 'Peak Performer', icon: '🏔️', rarity: 'legendary', reward: '1,000 Coins' },
  'versatile_mind': { title: 'Versatile Mind', icon: '🎮', rarity: 'rare', reward: '400 Coins' },
  'brain_marathon': { title: 'Brain Marathon', icon: '🧠', rarity: 'epic', reward: '300 Coins' },
  'on_fire': { title: 'On Fire', icon: '🔥', rarity: 'rare', reward: '750 Coins' },
};

const RARITY_STYLES = {
  common: { gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', glow: 'rgba(148, 163, 184, 0.4)', label: 'Common' },
  rare: { gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59, 130, 246, 0.5)', label: 'Rare' },
  epic: { gradient: 'linear-gradient(135deg, #a855f7, #c084fc)', glow: 'rgba(168, 85, 247, 0.5)', label: 'Epic' },
  legendary: { gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245, 158, 11, 0.6)', label: 'Legendary' },
};

export default function AchievementToast({ achievementIds, onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!achievementIds || achievementIds.length === 0) return;
    setVisible(true);
    audioEngine.playSuccess();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setExiting(false);
        setVisible(false);
        if (currentIndex + 1 < achievementIds.length) {
          setCurrentIndex(prev => prev + 1);
          setTimeout(() => {
            setVisible(true);
            audioEngine.playSuccess();
          }, 300);
        } else {
          if (onDone) onDone();
        }
      }, 500);
    }, 4000);
    return () => clearTimeout(timer);
  }, [visible, currentIndex]);

  if (!achievementIds || achievementIds.length === 0 || !visible) return null;

  const id = achievementIds[currentIndex];
  const meta = ACHIEVEMENT_META[id] || { title: id, icon: '🏆', rarity: 'common', reward: 'Unknown' };
  const rarity = RARITY_STYLES[meta.rarity] || RARITY_STYLES.common;

  return (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 99999,
      animation: exiting ? 'achieveSlideOut 0.5s ease-in forwards' : 'achieveSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: `2px solid ${rarity.glow.replace(/[\d.]+\)$/, '0.6)')}`,
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        boxShadow: `0 0 30px ${rarity.glow}, 0 20px 40px rgba(0,0,0,0.4)`,
        backdropFilter: 'blur(12px)',
        minWidth: '340px', maxWidth: '420px',
      }}>
        <div style={{
          width: '56px', height: '56px',
          background: rarity.gradient,
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem',
          boxShadow: `0 0 20px ${rarity.glow}`,
          animation: 'achievePulse 2s ease-in-out infinite',
          flexShrink: 0,
        }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem',
          }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase',
              letterSpacing: '0.1em', color: '#fbbf24',
            }}>
              🏆 Achievement Unlocked!
            </span>
          </div>
          <div style={{
            color: '#f8fafc', fontSize: '1.05rem', fontWeight: 'bold',
            marginBottom: '0.3rem',
          }}>
            {meta.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase',
              background: rarity.gradient,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em',
            }}>
              {rarity.label}
            </span>
            <span style={{ color: '#475569', fontSize: '0.7rem' }}>•</span>
            <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: '600' }}>
              🎁 {meta.reward}
            </span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes achieveSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes achieveSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(120%); opacity: 0; }
        }
        @keyframes achievePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

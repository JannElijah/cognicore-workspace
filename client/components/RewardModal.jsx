import React from 'react';
import HoverTooltip from './HoverTooltip';

const RewardModal = ({ rewards, onClose }) => {
  if (!rewards) return null;

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
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        padding: '2rem'
      }}>
        {rewards.leveled_up && (
          <div style={{ marginBottom: '1rem', color: '#fbbf24', fontSize: '3rem', animation: 'bounce 1s infinite' }}>
            🌟
          </div>
        )}
        
        <h2 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>
          {rewards.leveled_up ? 'Level Up!' : 'Game Complete!'}
        </h2>
        
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          {rewards.leveled_up 
            ? 'Congratulations! You reached a new level and earned a bonus!'
            : 'Here is what you earned this session.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <HoverTooltip text="Experience points contribute to your overall level and unlock new features." delay={200}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>XP Gained</span>
            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.25rem' }}>+{rewards.xp} XP</span>
          </div>
          </HoverTooltip>
          <HoverTooltip text="Coins can be used in the shop to purchase new themes and avatars." delay={200}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>Coins Earned</span>
            <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.25rem' }}>
              +{rewards.coins} <svg width="20" height="20" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.8))', flexShrink: 0, verticalAlign: 'middle' }} xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#fbbf24"/><circle cx="12" cy="12" r="8" fill="#f59e0b"/><text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f" fontFamily="Arial">C</text></svg>
            </span>
          </div>
          </HoverTooltip>
        </div>

        <button 
          onClick={onClose}
          style={{
            background: 'linear-gradient(to right, var(--color-primary), #818cf8)',
            border: 'none',
            color: '#ffffff',
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%',
            transition: 'transform 0.2s, filter 0.2s'
          }}
          onMouseOver={e => { e.target.style.transform = 'scale(1.02)'; e.target.style.filter = 'brightness(1.1)'; }}
          onMouseOut={e => { e.target.style.transform = 'scale(1)'; e.target.style.filter = 'brightness(1)'; }}
        >
          Awesome!
        </button>
      </div>
      
      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </div>
  );
};

export default RewardModal;

import React from 'react';
import audioEngine from '../utils/audioEngine';

export default function DailyRewardModal({ rewardData, onClose }) {
  if (!rewardData || !rewardData.granted) return null;

  const handleClaim = () => {
    audioEngine.playClick();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        borderRadius: '24px',
        padding: '3rem',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(168, 85, 247, 0.2)',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{ 
          fontSize: '4rem', 
          marginBottom: '1rem',
          animation: 'pulseGlow 2s infinite'
        }}>
          🔥
        </div>
        <h2 style={{
          fontSize: '2rem',
          margin: '0 0 0.5rem 0',
          background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          fontFamily: 'var(--font-title)'
        }}>
          {rewardData.streak} Day Streak!
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          marginBottom: '2rem'
        }}>
          You've logged in for {rewardData.streak} consecutive days. Keep it up!
        </p>
        
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Reward</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span>+{rewardData.coins}</span>
            <span style={{ fontSize: '1.5rem' }}>🪙</span>
          </div>
        </div>

        <button 
          onClick={handleClaim}
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'white',
            border: 'none',
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '9999px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            width: '100%'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.6)';
            audioEngine.playHover();
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.4)';
          }}
        >
          Claim Reward
        </button>
      </div>
    </div>
  );
}

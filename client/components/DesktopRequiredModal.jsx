import React, { useState } from 'react';

export default function DesktopRequiredModal({ isOpen, onClose, gameTitle }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = window.location.origin;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
          border: '1px solid rgba(var(--rgb-primary, 56, 189, 248), 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(var(--rgb-primary, 56, 189, 248), 0.2)',
          borderRadius: '20px',
          maxWidth: '460px',
          width: '100%',
          padding: '2rem 1.75rem',
          textAlign: 'center',
          position: 'relative',
          color: '#f8fafc',
          boxSizing: 'border-box'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title="Dismiss"
        >
          ✕
        </button>

        {/* Desktop Monitor SVG Illustration */}
        <div style={{ margin: '0 auto 1.25rem', display: 'flex', justifyContent: 'center' }}>
          <div 
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              background: 'radial-gradient(circle, rgba(var(--rgb-primary, 56, 189, 248), 0.25) 0%, rgba(15, 23, 42, 0) 70%)',
              border: '1px solid rgba(var(--rgb-primary, 56, 189, 248), 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(var(--rgb-primary, 56, 189, 248), 0.35)'
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #38bdf8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <path d="M7 8h10M7 12h5" strokeOpacity="0.5" />
            </svg>
          </div>
        </div>

        {/* Badge */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            padding: '0.3rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}
        >
          <span>🖥️ Desktop Platform Required</span>
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#ffffff' }}>
          {gameTitle ? `Play ${gameTitle} on PC` : 'Play Training Games on PC'}
        </h2>

        {/* Narrative text with Steam companion analogy */}
        <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.55', margin: '0 0 1.25rem 0' }}>
          Like Steam, our cognitive games are built exclusively for <strong style={{ color: '#e2e8f0' }}>Desktop Web</strong> to ensure scientific measurement validity (sub-10ms input precision and full-screen stimulus tracking).
        </p>

        {/* Mobile Companion capabilities card */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            textAlign: 'left',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
            color: '#cbd5e1'
          }}
        >
          <div style={{ fontWeight: 'bold', color: 'var(--color-primary, #38bdf8)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>📱 Mobile Companion Features:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
            <div>📊 View Cognitive Scores</div>
            <div>🎯 Track Daily Quests</div>
            <div>🎒 Inspect Inventory</div>
            <div>🏆 Live Leaderboards</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button
            onClick={handleCopyLink}
            style={{
              padding: '0.85rem 1.25rem',
              background: copied ? '#10b981' : 'linear-gradient(to right, var(--color-primary, #0284c7), var(--color-secondary, #a855f7))',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {copied ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                <span>Link Copied! Open on your PC</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                <span>Copy Link to Play on PC</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#cbd5e1',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Continue in Mobile Companion Mode
          </button>
        </div>
      </div>
    </div>
  );
}

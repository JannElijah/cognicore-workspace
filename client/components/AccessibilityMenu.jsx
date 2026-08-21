import React, { useState, useEffect } from 'react';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('pwd_highContrast') === 'true');
  const [colorBlind, setColorBlind] = useState(() => localStorage.getItem('pwd_colorBlind') === 'true');
  const [dyslexiaFont, setDyslexiaFont] = useState(() => localStorage.getItem('pwd_dyslexiaFont') === 'true');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('pwd_reducedMotion') === 'true');

  useEffect(() => {
    localStorage.setItem('pwd_highContrast', highContrast);
    if (highContrast) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('pwd_colorBlind', colorBlind);
    if (colorBlind) document.body.classList.add('color-blind');
    else document.body.classList.remove('color-blind');
  }, [colorBlind]);

  useEffect(() => {
    localStorage.setItem('pwd_dyslexiaFont', dyslexiaFont);
    if (dyslexiaFont) document.body.classList.add('dyslexia-font');
    else document.body.classList.remove('dyslexia-font');
  }, [dyslexiaFont]);

  useEffect(() => {
    localStorage.setItem('pwd_reducedMotion', reducedMotion);
    if (reducedMotion) document.body.classList.add('reduced-motion');
    else document.body.classList.remove('reduced-motion');
  }, [reducedMotion]);

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: '0',
          marginBottom: '1rem',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '2px solid rgba(168, 85, 247, 0.5)',
          borderRadius: '12px',
          padding: '1.25rem',
          width: '260px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(168, 85, 247, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ♿ Accessibility (PWD)
          </h3>
          
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem' }}>
            <span>High Contrast Mode</span>
            <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem' }}>
            <span>Color Blind Filter</span>
            <input type="checkbox" checked={colorBlind} onChange={(e) => setColorBlind(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem' }}>
            <span>Dyslexia Font</span>
            <input type="checkbox" checked={dyslexiaFont} onChange={(e) => setDyslexiaFont(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem' }}>
            <span>Reduced Motion</span>
            <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
          </label>
          
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(var(--rgb-secondary), 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        title="Accessibility Options"
      >
        ♿
      </button>
    </div>
  );
}

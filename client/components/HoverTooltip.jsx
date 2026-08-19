import React, { useState } from 'react';

export default function HoverTooltip({ content, children, delay = 200, style = {}, tooltipStyle = {} }) {
  const [isHovered, setIsHovered] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsHovered(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsHovered(false);
  };

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block', ...style }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isHovered && content && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translate(-50%, -12px)',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.8), 0 0 20px rgba(56, 189, 248, 0.15)',
          pointerEvents: 'none',
          minWidth: '220px',
          textAlign: 'center',
          color: '#e2e8f0',
          fontSize: '0.85rem',
          lineHeight: '1.5',
          ...tooltipStyle
        }}>
          {content}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: '6px',
            borderStyle: 'solid',
            borderColor: 'rgba(56, 189, 248, 0.3) transparent transparent transparent'
          }} />
        </div>
      )}
    </div>
  );
}

import os

filepath = r'd:\cognicore-workspace\client\components\GameRenderer.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.replace(
    "import React, { Suspense, lazy, memo } from 'react';",
    "import React, { Suspense, lazy, memo, useState, useEffect } from 'react';"
)

component_start = new_content.find("const GameRenderer = memo(function GameRenderer({ activeGame, activeDashboardUser, handleGameFinished }) {")
component_body = new_content[component_start:]

hook_code = """
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissWarning, setDismissWarning] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);
"""

new_component_body = component_body.replace(
    "const GameRenderer = memo(function GameRenderer({ activeGame, activeDashboardUser, handleGameFinished }) {",
    "const GameRenderer = memo(function GameRenderer({ activeGame, activeDashboardUser, handleGameFinished }) {" + hook_code
)

overlay_code = """
      {isPortrait && !dismissWarning && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '2rem', color: '#f8fafc', backdropFilter: 'blur(10px)'
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '1.5rem', animation: 'spin 3s ease-in-out infinite' }} xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7c0-1.657 1.343-3 3-3h10c1.657 0 3 1.343 3 3v10c0 1.657-1.343 3-3 3H7c-1.657 0-3-1.343-3-3V7z" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 4v16M15 4v16" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3"/>
            <path d="M12 8v8M9 12h6" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 style={{ marginBottom: '1rem', color: '#38bdf8', letterSpacing: '0.05em' }}>Rotate Device</h2>
          <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '300px' }}>
            For the best cognitive training experience, please rotate your phone to <strong>Landscape mode</strong>.
          </p>
          <button 
            onClick={() => setDismissWarning(true)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#94a3b8', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer'
            }}
          >
            Continue in Portrait
          </button>
        </div>
      )}
"""

new_component_body = new_component_body.replace(
    "<ErrorBoundary>",
    overlay_code + "\n      <ErrorBoundary>"
)

final_content = new_content[:component_start] + new_component_body

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(final_content)

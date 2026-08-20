import React from 'react';

export default function KnowledgeBase() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#f8fafc', marginBottom: '0.5rem' }}>🧠 Knowledge Base</h1>
      <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Documentation and reference guides for CogniCore training modules.</p>
      
      <div className="game-card" style={{ marginBottom: '2rem', background: 'rgba(30, 41, 59, 0.7)' }}>
        <h2 style={{ color: '#c084fc', marginBottom: '1rem', borderBottom: '1px solid rgba(192, 132, 252, 0.3)', paddingBottom: '0.5rem' }}>What is Adaptive Task Staircasing?</h2>
        <p style={{ color: '#e2e8f0', lineHeight: '1.6' }}>
          Adaptive Task Staircasing is our Dynamic Difficulty Adjustment (DDA) engine. It constantly analyzes your performance telemetry (reaction times, accuracy, and hesitation) in real-time. If you perform well consecutively, the difficulty increases (e.g. less time, more distractors). If you struggle, the game scales down the difficulty to prevent frustration and keep you in the optimal learning zone.
        </p>
      </div>

      <div className="game-card" style={{ marginBottom: '2rem', background: 'rgba(30, 41, 59, 0.7)' }}>
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem', borderBottom: '1px solid rgba(var(--rgb-primary), 0.3)', paddingBottom: '0.5rem' }}>Scoring & Standardized Metrics</h2>
        <p style={{ color: '#e2e8f0', lineHeight: '1.6' }}>
          Our scoring algorithms are aligned with standard clinical neuropsychological baselines. Your score isn't just about speed—accuracy is heavily weighted. We also track 'spam clicking' and 'latency' to measure your decision-making methodicalness versus impulsivity. This creates a holistic view of your cognitive playstyle.
        </p>
      </div>

      <div className="game-card" style={{ marginBottom: '2rem', background: 'rgba(30, 41, 59, 0.7)' }}>
        <h2 style={{ color: '#f472b6', marginBottom: '1rem', borderBottom: '1px solid rgba(244, 114, 182, 0.3)', paddingBottom: '0.5rem' }}>Cognitive Domains</h2>
        <ul style={{ color: '#e2e8f0', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
          <li><strong style={{ color: '#f8fafc' }}>Spatial-Visual Memory:</strong> Training working memory and object permanence (e.g. Memory Match, Sequence Decoder).</li>
          <li><strong style={{ color: '#f8fafc' }}>Reflex & Attentional Focus:</strong> Enhancing reaction times and sustained vigilance against visual distractors (e.g. Speed Tap, Focus Finder).</li>
          <li><strong style={{ color: '#f8fafc' }}>Logical-Mathematical Strategy:</strong> Problem-solving and dynamic rule-shifting tasks (e.g. Mental Flex, Logic Link).</li>
        </ul>
      </div>

      <div className="game-card" style={{ marginBottom: '2rem', background: 'rgba(30, 41, 59, 0.7)' }}>
        <h2 style={{ color: '#10b981', marginBottom: '1rem', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', paddingBottom: '0.5rem' }}>Settings & Accessibility</h2>
        <p style={{ color: '#e2e8f0', lineHeight: '1.6' }}>
          You can customize your experience by clicking your Profile avatar in the top right. In the <strong>Settings</strong> tab, you can disable flashing visual effects, control the master audio volume, and toggle Adaptive Distractors (background noise/glitches) used in high-difficulty levels.
        </p>
      </div>
    </div>
  );
}

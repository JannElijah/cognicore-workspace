import React from 'react';

export const SvgGameIcon = ({ name, color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: `drop-shadow(0 0 5px ${color}80)`, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
    {name === 'Lightning' && <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === 'Target' && <><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2"/><circle cx="12" cy="12" r="2" fill={color}/></>}
    {name === 'Palette' && <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.18-.62-1.61-.38-.43-.63-.98-.63-1.55 0-1.25 1.01-2.26 2.26-2.26h2.15c2.95 0 5.34-2.39 5.34-5.34C23 6.64 18.06 2 12 2zm-5 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm2-5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm2 5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" stroke={color} strokeWidth="2" fill="none"/>}
    {name === 'Brain' && <path d="M9.5 3a4.5 4.5 0 100 9h5a4.5 4.5 0 100-9h-5zm0 9a4.5 4.5 0 100 9h5a4.5 4.5 0 100-9h-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === 'Cards' && <><rect x="4" y="6" width="10" height="14" rx="2" stroke={color} strokeWidth="2"/><rect x="10" y="4" width="10" height="14" rx="2" stroke={color} strokeWidth="2" fill="#0f172a"/></>}
    {name === 'Grid' && <><rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2"/><path d="M3 12h18M12 3v18" stroke={color} strokeWidth="2"/></>}
    {name === 'Puzzle' && <path d="M19 12h-2a3 3 0 010-6h2M5 12h2a3 3 0 000-6H5M12 19v-2a3 3 0 00-6 0v2M12 5v2a3 3 0 01-6 0V5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === 'Sync' && <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === 'Map' && <path d="M9 4L3 7v13l6-3m0-13l6 3m-6-3v13m6-13l6-3v13l-6 3m0-13v13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === 'Numbers' && <text x="12" y="17" fill={color} fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">123</text>}
    {name === 'Link' && <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>}
    {name === 'Scale' && <path d="M12 22V2m-7 5h14M5 7v5a7 7 0 0014 0V7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === 'Pin' && <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>}
    {name === 'Compass' && <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>}
    {name === 'Inbox' && <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === 'Maze' && <path d="M3 3h18v18H3zM3 9h5M8 3v6M16 21v-6M11 15h5M11 9v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {name === 'Juggler' && <><circle cx="6" cy="16" r="3" stroke={color} strokeWidth="2"/><circle cx="18" cy="16" r="3" stroke={color} strokeWidth="2"/><circle cx="12" cy="8" r="3" stroke={color} strokeWidth="2"/></>}
  </svg>
);

export const DOMAIN_INFO = {
  reflexes_and_focus: { title: 'Reflexes & Focus', color: 'var(--color-primary)', icon: <SvgGameIcon name="Lightning" color="var(--color-primary)" /> },
  spatial_visual_memory: { title: 'Memory & Recall', color: '#4ade80', icon: <SvgGameIcon name="Brain" color="#4ade80" /> },
  logical_mathematical: { title: 'Logical Reasoning', color: '#f59e0b', icon: <SvgGameIcon name="Numbers" color="#f59e0b" /> },
  executive_strategy: { title: 'Executive Strategy', color: 'var(--color-secondary)', icon: <SvgGameIcon name="Compass" color="var(--color-secondary)" /> }
};

export const DOMAIN_LABELS = {
  reflexes_and_focus: 'Reflexes & Focus',
  spatial_visual_memory: 'Memory & Recall',
  logical_mathematical: 'Logical Reasoning',
  executive_strategy: 'Strategy & Planning'
};

export const DOMAIN_THEMES = {
  reflex: {
    color: 'var(--color-primary)',
    glow: 'rgba(var(--rgb-primary), 0.25)',
    btnGlow: 'rgba(var(--rgb-primary), 0.4)',
    bg: 'rgba(var(--rgb-primary), 0.03)',
    btnGradient: 'linear-gradient(to right, var(--color-primary), #60a5fa)'
  },
  memory: {
    color: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.25)',
    btnGlow: 'rgba(74, 222, 128, 0.4)',
    bg: 'rgba(74, 222, 128, 0.03)',
    btnGradient: 'linear-gradient(to right, #4ade80, #34d399)'
  },
  reasoning: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)',
    btnGlow: 'rgba(245, 158, 11, 0.4)',
    bg: 'rgba(245, 158, 11, 0.03)',
    btnGradient: 'linear-gradient(to right, #f59e0b, #fbbf24)'
  },
  executive: {
    color: 'var(--color-secondary)',
    glow: 'rgba(var(--rgb-secondary), 0.25)',
    btnGlow: 'rgba(var(--rgb-secondary), 0.4)',
    bg: 'rgba(var(--rgb-secondary), 0.03)',
    btnGradient: 'linear-gradient(to right, var(--color-secondary), #c084fc)'
  }
};

export const DOMAINS_LIST = [
  {
    id: 'reflexes_and_focus',
    themeClass: 'reflex',
    title: 'Reflex & Attentional Focus',
    icon: <SvgGameIcon name="Lightning" color="var(--color-primary)" />,
    description: 'Improve your reaction time, focus, and ability to ignore distractions under pressure.',
    games: [
      {
        id: 'SpeedTap',
        title: 'Speed Tap',
        icon: <SvgGameIcon name="Lightning" color="var(--color-primary)" />,
        objective: 'Quickly tap the highlighted targets before time runs out, while ignoring the wrong ones.',
        benefit: 'Helps you make faster decisions and react quicker in fast-paced situations.'
      },
      {
        id: 'FocusFinder',
        title: 'Focus Finder',
        icon: <SvgGameIcon name="Target" color="var(--color-primary)" />,
        objective: 'Find the hidden targets moving around in a crowded, messy space.',
        benefit: 'Improves your ability to focus on what matters in a busy environment.'
      },
      {
        id: 'StroopShift',
        title: 'Stroop Shift',
        icon: <SvgGameIcon name="Palette" color="var(--color-primary)" />,
        objective: 'Pick the correct color while ignoring tricky mismatched words (like the word "RED" painted in blue).',
        benefit: 'Trains your brain to overcome confusion and switch tasks easily.'
      }
    ]
  },
  {
    id: 'spatial_visual_memory',
    themeClass: 'memory',
    title: 'Spatial-Visual Memory',
    icon: <SvgGameIcon name="Brain" color="#4ade80" />,
    description: 'Boost your ability to remember patterns, shapes, and where things are located.',
    games: [
      {
        id: 'MemoryMatch',
        title: 'Memory Match',
        icon: <SvgGameIcon name="Cards" color="#4ade80" />,
        objective: 'Flip and match pairs of hidden cards on a grid.',
        benefit: 'Helps you remember information longer and recall visual details quickly.'
      },
      {
        id: 'MatrixRecall',
        title: 'Matrix Recall',
        icon: <SvgGameIcon name="Grid" color="#4ade80" />,
        objective: 'Observe grid pattern sequences highlighted for brief intervals and reconstruct coordinates.',
        benefit: 'Improves spatial orientation and visual-spatial short-term working retention.'
      },
      {
        id: 'SynapseSpin',
        title: 'Synapse Spin',
        icon: <SvgGameIcon name="Sync" color="#4ade80" />,
        objective: 'Compare visual geometric shapes and rotate them mentally to identify matching templates.',
        benefit: 'Boosts spatial manipulation speed, mental rotation, and spatial configuration logic.'
      },
      {
        id: 'NexusMapper',
        title: 'Nexus Mapper',
        icon: <SvgGameIcon name="Map" color="#4ade80" />,
        objective: 'Memorize visual objects placed in complex network nodes and recall locations.',
        benefit: 'Enhances associative object-location memory bindings and structural retention.'
      }
    ]
  },
  {
    id: 'logical_mathematical',
    themeClass: 'reasoning',
    title: 'Logical-Mathematical Reasoning',
    icon: <SvgGameIcon name="Numbers" color="#f59e0b" />,
    description: 'Sharpen your math skills, problem-solving abilities, and logical thinking.',
    games: [
      {
        id: 'LogicLink',
        title: 'Logic Link',
        icon: <SvgGameIcon name="Link" color="#f59e0b" />,
        objective: 'Connect the dots in order without crossing lines.',
        benefit: 'Trains you to plan ahead and solve tricky puzzles efficiently.'
      },
      {
        id: 'EquationBalance',
        title: 'Equation Balance',
        icon: <SvgGameIcon name="Scale" color="#f59e0b" />,
        objective: 'Figure out the missing numbers or symbols to balance the scale.',
        benefit: 'Makes you faster and more confident with everyday math and logic.'
      },
      {
        id: 'SequenceDecoder',
        title: 'Sequence Decoder',
        icon: <SvgGameIcon name="Numbers" color="#f59e0b" />,
        objective: 'Examine numeric sequences (e.g. geometric, Fibonacci) and infer missing patterns.',
        benefit: 'Strengthens inductive logical reasoning, sequence detection, and mathematical extrapolation.'
      },
      {
        id: 'RouteOptimizer',
        title: 'Route Optimizer',
        icon: <SvgGameIcon name="Pin" color="#f59e0b" />,
        objective: 'Determine the absolute shortest route visiting all destination nodes under a time limit.',
        benefit: 'Trains combinatorial logic, spatial graph reasoning, and planning efficiency.'
      }
    ]
  },
  {
    id: 'executive_strategy',
    themeClass: 'executive',
    title: 'Executive Strategy & Planning',
    icon: <SvgGameIcon name="Compass" color="var(--color-secondary)" />,
    description: 'Train adaptive executive control, dynamic plan correction, card matching rule-switching, and decision confidence.',
    games: [
      {
        id: 'PriorityQueue',
        title: 'Priority Queue',
        icon: <SvgGameIcon name="Inbox" color="var(--color-secondary)" />,
        objective: 'Drag and drop incoming task cards into Urgent, Important, or Delegate bins before they scroll off the conveyor belt.',
        benefit: 'Trains executive triage, multi-priority switching, decision speed under pressure, and resource allocation.'
      },
      {
        id: 'NeuroMaze',
        title: 'Neuro Maze',
        icon: <SvgGameIcon name="Maze" color="var(--color-secondary)" />,
        objective: 'Escape dynamic grid mazes with moving barrier walls and shifting exit locations.',
        benefit: 'Improves real-time replanning, visual obstacle prediction, and quick strategic changes.'
      },
      {
        id: 'MentalFlex',
        title: 'Mental Flex',
        icon: <SvgGameIcon name="Juggler" color="var(--color-secondary)" />,
        objective: 'Match incoming target items based on rapidly shifting rules (color, shape, count).',
        benefit: 'Enhances cognitive flexibility, rule induction switching, and adaptive execution.'
      }
    ]
  }
];

export const COGNITIVE_QUESTIONS = [
  {
    id: 'q1',
    domain: 'spatial_visual_memory',
    difficulty: 1,
    title: 'Air Traffic Control',
    text: 'You are an air traffic controller. Your radar screen suddenly goes black. 3 seconds ago, you saw Flight Alpha in the top-left quadrant moving right, Flight Beta in the bottom-right moving left, and Flight Gamma in the center moving down. Assuming constant speeds, where are they now?',
    visual: <div style={{width:'100%', height:'120px', background:'rgba(74, 222, 128, 0.1)', border:'1px solid #4ade80', borderRadius:'8px', position:'relative'}}><div style={{position:'absolute', top:'10px', left:'10px', color:'#4ade80'}}>✈️ ➔</div><div style={{position:'absolute', bottom:'10px', right:'10px', color:'#4ade80'}}>⬅️ ✈️</div><div style={{position:'absolute', top:'45px', left:'50%', transform:'translateX(-50%)', color:'#4ade80'}}>✈️ ⬇️</div></div>,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'Alpha: Top-Center | Beta: Bottom-Center | Gamma: Bottom-Center' },
      { key: 'B', text: 'Alpha: Top-Right | Beta: Bottom-Left | Gamma: Center' },
      { key: 'C', text: 'Alpha: Center | Beta: Top-Right | Gamma: Bottom-Left' },
      { key: 'D', text: 'Alpha: Top-Center | Beta: Center | Gamma: Top-Right' }
    ]
  },
  {
    id: 'q2',
    domain: 'logical_mathematical',
    difficulty: 1,
    title: 'Resource Allocation',
    text: 'A hospital ER is rationing 100 units of medicine. Protocol mandates Ward A gets twice as much as Ward B, and Ward C gets 10 units less than Ward A. If all units are distributed, how many units does Ward B receive?',
    visual: <div style={{display:'flex', justifyContent:'space-around', alignItems:'center', background:'rgba(245, 158, 11, 0.1)', padding:'20px', borderRadius:'8px', border:'1px solid #f59e0b'}}><span style={{color:'#f59e0b', fontWeight:'bold'}}>A = 2B</span><span style={{color:'#f59e0b', fontWeight:'bold'}}>C = A - 10</span><span style={{color:'#f59e0b', fontWeight:'bold'}}>A+B+C = 100</span></div>,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: '18 units' },
      { key: 'B', text: '22 units' },
      { key: 'C', text: '20 units' },
      { key: 'D', text: '25 units' }
    ]
  },
  {
    id: 'q3',
    domain: 'reflexes_and_focus',
    difficulty: 1,
    title: 'High-Speed Driving',
    text: 'You are driving at 60 mph on a wet road. A digital traffic sign abruptly flashes the word "STOP" but the sign\'s actual LED color is GREEN. According to your strict training to ONLY obey the light color and ignore the text, what is your immediate reflex?',
    visual: <div style={{textAlign:'center', background:'#000', padding:'30px', borderRadius:'8px', border:'2px solid #333'}}><span style={{color:'#4ade80', fontSize:'2.5rem', fontWeight:'900', fontFamily:'monospace', letterSpacing:'4px'}}>STOP</span></div>,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: 'Slam on the brakes immediately' },
      { key: 'B', text: 'Slow down cautiously' },
      { key: 'C', text: 'Maintain speed and proceed' },
      { key: 'D', text: 'Pull over to the side' }
    ]
  },
  {
    id: 'q4',
    domain: 'executive_strategy',
    difficulty: 1,
    title: 'Triage Protocol',
    text: 'You manage a server farm. Server X is critical but takes 4 hours to fix. Server Y is non-critical but takes 30 minutes to fix. Server Z is critical and takes 1 hour to fix. You have one technician. To minimize critical downtime, what is the optimal repair sequence?',
    visual: <div style={{display:'flex', flexDirection:'column', gap:'10px', background:'rgba(192, 132, 252, 0.1)', padding:'15px', borderRadius:'8px', border:'1px solid #c084fc', color:'#c084fc'}}><div>🔥 [CRITICAL] X: 4 Hrs</div><div>ℹ️ [MINOR] Y: 0.5 Hrs</div><div>🔥 [CRITICAL] Z: 1 Hr</div></div>,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'Fix Z first, then X, then Y' },
      { key: 'B', text: 'Fix Y first, then Z, then X' },
      { key: 'C', text: 'Fix X first, then Z, then Y' },
      { key: 'D', text: 'Fix Z first, then Y, then X' }
    ]
  },
  {
    id: 'q5',
    domain: 'spatial_visual_memory',
    difficulty: 2,
    title: 'Assembly Blueprint',
    text: 'You are assembling a satellite array. Component 1 is an L-shaped bracket facing UP. Component 2 is an identical bracket facing RIGHT. If you mentally rotate Component 2 90 degrees counter-clockwise and overlay it on Component 1, what shape is formed?',
    visual: <div style={{display:'flex', justifyContent:'center', gap:'20px', padding:'20px', background:'rgba(74, 222, 128, 0.1)', borderRadius:'8px', border:'1px solid #4ade80'}}><div style={{width:'40px', height:'40px', borderBottom:'6px solid #4ade80', borderLeft:'6px solid #4ade80'}}></div> <span style={{color:'#4ade80', fontSize:'2rem'}}>+</span> <div style={{width:'40px', height:'40px', borderTop:'6px solid #4ade80', borderLeft:'6px solid #4ade80'}}></div></div>,
    correctAnswer: 'D',
    options: [
      { key: 'A', text: 'A perfect square' },
      { key: 'B', text: 'A cross (+)' },
      { key: 'C', text: 'A T-shape' },
      { key: 'D', text: 'They perfectly overlap into an L-shape' }
    ]
  },
  {
    id: 'q6',
    domain: 'logical_mathematical',
    difficulty: 2,
    title: 'Cyber Cryptography',
    text: 'A cryptographic key increments by a specific algorithmic pattern: 1, 4, 13, 40... What is the next number required to decrypt the payload?',
    visual: <div style={{textAlign:'center', background:'rgba(245, 158, 11, 0.1)', padding:'20px', borderRadius:'8px', border:'1px solid #f59e0b', color:'#f59e0b', fontFamily:'monospace', letterSpacing:'2px', fontSize:'1.2rem'}}>1 ➔ 4 ➔ 13 ➔ 40 ➔ ?</div>,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: '80' },
      { key: 'B', text: '120' },
      { key: 'C', text: '121' },
      { key: 'D', text: '113' }
    ]
  },
  {
    id: 'q7',
    domain: 'reflexes_and_focus',
    difficulty: 2,
    title: 'Security Surveillance',
    text: 'You are monitoring 4 security feeds. Your directive is to press the ALARM button ONLY if a person wearing a RED hat enters Zone A. A person wearing a red jacket and a BLUE hat enters Zone A, while a flashing RED strobe light goes off in the background. Do you press the alarm?',
    visual: <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', background:'rgba(96, 165, 250, 0.1)', padding:'10px', borderRadius:'8px', border:'1px solid #60a5fa'}}><div style={{border:'2px dashed #60a5fa', height:'60px', display:'flex', alignItems:'center', justifyContent:'center', color:'#f87171', fontSize:'1.2rem'}}>Zone A: 🧢+🧥</div><div style={{border:'2px dashed #60a5fa', height:'60px', background:'rgba(248, 113, 113, 0.2)'}}></div></div>,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Yes, the red jacket and strobe justify an alarm' },
      { key: 'B', text: 'No, the criteria (red hat) was not explicitly met' },
      { key: 'C', text: 'Yes, the person is in Zone A with red items' },
      { key: 'D', text: 'Yes, but only a silent alarm' }
    ]
  },
  {
    id: 'q8',
    domain: 'executive_strategy',
    difficulty: 2,
    title: 'Shifting Paradigms',
    text: 'During manufacturing, Rule Set Alpha dictates: Reject flawed items (Action X). Suddenly, a contamination protocol (Rule Set Beta) is triggered, overriding Alpha. Under Beta, flawed items must be quarantined (Action Y), and perfect items must be destroyed (Action Z). A perfect item arrives. What is your action?',
    visual: <div style={{textAlign:'center', background:'rgba(192, 132, 252, 0.1)', padding:'15px', borderRadius:'8px', border:'1px solid #c084fc', color:'#c084fc'}}><strong>OVERRIDE: PROTOCOL BETA ACTIVE</strong><br/><br/>Item Scan: [PERFECT CONDITION]</div>,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'Action Z (Destroy the perfect item)' },
      { key: 'B', text: 'Action Y (Quarantine it)' },
      { key: 'C', text: 'Action X (Reject it)' },
      { key: 'D', text: 'Pass it through normally' }
    ]
  },
  {
    id: 'q9',
    domain: 'spatial_visual_memory',
    difficulty: 3,
    title: 'Route Traceback',
    text: 'You are a taxi driver. You took a detour: North for 2 blocks, East for 3 blocks, North for 1 block. The passenger suddenly asks to return to the exact starting point. Without U-turning, what is the cardinal direction sequence to retrace your path in reverse?',
    visual: <div style={{width:'100%', height:'100px', background:'rgba(74, 222, 128, 0.1)', border:'1px solid #4ade80', borderRadius:'8px', position:'relative'}}><svg width="100%" height="100%"><path d="M 30 80 L 30 50 L 150 50 L 150 20" fill="none" stroke="#4ade80" strokeWidth="3" strokeDasharray="5,5" /><circle cx="30" cy="80" r="6" fill="#4ade80" /><circle cx="150" cy="20" r="6" fill="#ef4444" /><text x="35" y="65" fill="#4ade80" fontSize="12">2 blocks N</text><text x="90" y="40" fill="#4ade80" fontSize="12">3 blocks E</text><text x="155" y="35" fill="#4ade80" fontSize="12">1 block N</text><text x="8" y="20" fill="#4ade80" fontSize="12">N▲</text></svg></div>,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'South 1 block, West 3 blocks, South 2 blocks' },
      { key: 'B', text: 'South 2 blocks, West 3 blocks, South 1 block' },
      { key: 'C', text: 'North 1 block, East 3 blocks, North 2 blocks' },
      { key: 'D', text: 'West 3 blocks, South 3 blocks, East 1 block' }
    ]
  },
  {
    id: 'q10',
    domain: 'logical_mathematical',
    difficulty: 3,
    title: 'Logistics Network',
    text: 'A supply chain network uses drones. Drone A can carry 5kg and takes 10 mins per trip. Drone B can carry 8kg and takes 15 mins per trip. You need to deliver 26kg in exactly 30 minutes using both drones efficiently. How many trips should Drone A and Drone B make?',
    visual: <div style={{display:'flex', justifyContent:'space-around', background:'rgba(245, 158, 11, 0.1)', padding:'15px', borderRadius:'8px', border:'1px solid #f59e0b', color:'#f59e0b'}}><div>🛸 A: 5kg / 10m</div><div>🛸 B: 8kg / 15m</div><div>📦 Target: 26kg</div></div>,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Drone A: 1, Drone B: 3' },
      { key: 'B', text: 'Drone A: 2, Drone B: 2' },
      { key: 'C', text: 'Drone A: 4, Drone B: 1' },
      { key: 'D', text: 'Drone A: 3, Drone B: 1' }
    ]
  },
  {
    id: 'q11',
    domain: 'reflexes_and_focus',
    difficulty: 3,
    title: 'Auditory-Visual Sync',
    text: 'In a noisy command center, you must click the "SYNC" button ONLY when a high-pitched tone plays while the main monitor flashes YELLOW. The monitor flashes YELLOW, but a low-pitched tone plays alongside a loud siren. What is your action?',
    visual: <div style={{textAlign:'center', background:'#facc15', padding:'20px', borderRadius:'8px', border:'2px solid #eab308', color:'#000', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'20px', fontSize:'1.2rem'}}><span>⚠️ WARNING</span> <span>🔊 (Low Pitch + Siren)</span></div>,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: 'Click SYNC immediately' },
      { key: 'B', text: 'Click SYNC twice due to the siren' },
      { key: 'C', text: 'Do nothing, the exact auditory condition failed' },
      { key: 'D', text: 'Wait 3 seconds then click SYNC' }
    ]
  },
  {
    id: 'q12',
    domain: 'executive_strategy',
    difficulty: 3,
    title: 'PERT Optimization',
    text: 'You are managing a critical software launch. Task A (UI design) takes 3 days. Task B (Backend logic) takes 5 days. Both must finish before Task C (Integration), which takes 2 days. If you start A and B today simultaneously, what is the absolute minimum number of days until the launch is ready?',
    visual: <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', background:'rgba(192, 132, 252, 0.1)', padding:'15px', borderRadius:'8px', border:'1px solid #c084fc', color:'#c084fc'}}><div style={{display:'flex', flexDirection:'column', gap:'5px'}}><span style={{border:'1px solid #c084fc', padding:'4px 8px', borderRadius:'4px'}}>A: 3d</span><span style={{border:'1px solid #c084fc', padding:'4px 8px', borderRadius:'4px'}}>B: 5d</span></div><span style={{fontSize:'1.5rem'}}>➔</span><span style={{border:'1px solid #c084fc', padding:'4px 8px', borderRadius:'4px'}}>C: 2d</span></div>,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: '7 days' },
      { key: 'B', text: '10 days' },
      { key: 'C', text: '5 days' },
      { key: 'D', text: '8 days' }
    ]
  }
];

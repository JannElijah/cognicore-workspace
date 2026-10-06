import React from 'react';
import GameIcon from '../components/GameIcon';

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
    title: 'Grid Memory',
    text: 'A glowing dot starts in the TOP-LEFT corner of a 3x3 grid. It moves one space RIGHT, then one space DOWN. Where is the dot now?',
    visual: <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'5px', width:'100px', margin:'0 auto', background:'rgba(74, 222, 128, 0.1)', padding:'10px', borderRadius:'8px', border:'2px solid #4ade80'}}>{[...Array(9)].map((_,i) => <div key={i} style={{height:'25px', borderRadius:'4px', background: i === 4 ? '#4ade80' : 'rgba(255,255,255,0.1)', boxShadow: i === 4 ? '0 0 10px #4ade80' : 'none'}}></div>)}</div>,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Top-Right' },
      { key: 'B', text: 'Center' },
      { key: 'C', text: 'Bottom-Right' },
      { key: 'D', text: 'Bottom-Left' }
    ]
  },
  {
    id: 'q2',
    domain: 'logical_mathematical',
    difficulty: 1,
    title: 'Basic Supply',
    text: 'A spaceship has 10 energy cells total. The shields use 4 cells. The engines use 3 cells. How many energy cells are left for life support?',
    visual: <div style={{display:'flex', justifyContent:'center', gap:'15px', alignItems:'center', background:'rgba(245, 158, 11, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #f59e0b', color:'#f59e0b', fontSize:'1.5rem', fontWeight:'bold'}}><span>🔋 10</span> <span>- 🛡️ 4</span> <span>- 🚀 3</span> <span>= ?</span></div>,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: '2 cells' },
      { key: 'B', text: '3 cells' },
      { key: 'C', text: '4 cells' },
      { key: 'D', text: '5 cells' }
    ]
  },
  {
    id: 'q3',
    domain: 'reflexes_and_focus',
    difficulty: 1,
    title: 'Quick Reaction',
    text: 'Your dashboard has a "LAUNCH" button. You are told to press it ONLY when the status light turns GREEN. The light currently turns RED. What should you do?',
    visual: <div style={{textAlign:'center', background:'rgba(239, 68, 68, 0.1)', padding:'30px', borderRadius:'8px', border:'2px solid #ef4444', display:'flex', flexDirection:'column', alignItems:'center', gap:'15px'}}><div style={{width:'50px', height:'50px', borderRadius:'25px', background:'#ef4444', boxShadow:'0 0 20px #ef4444'}}></div><div style={{color:'#ef4444', fontWeight:'bold', fontSize:'1.2rem'}}>STATUS: RED</div></div>,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: 'Press the button immediately' },
      { key: 'B', text: 'Press the button twice' },
      { key: 'C', text: 'Do NOT press the button' },
      { key: 'D', text: 'Hold the button down' }
    ]
  },
  {
    id: 'q4',
    domain: 'executive_strategy',
    difficulty: 1,
    title: 'Simple Triage',
    text: 'You have a broken pipe leaking water rapidly (Urgent) and a squeaky door (Not Urgent). You can only fix one thing at a time. Which one should you fix first?',
    visual: <div style={{display:'flex', justifyContent:'center', gap:'20px', background:'rgba(192, 132, 252, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #c084fc', color:'#fff'}}><div style={{textAlign:'center', padding:'10px', background:'rgba(239, 68, 68, 0.2)', borderRadius:'8px', border:'1px solid #ef4444'}}>💧 Leaking Pipe</div><div style={{textAlign:'center', padding:'10px', background:'rgba(255, 255, 255, 0.1)', borderRadius:'8px', border:'1px solid #666'}}>🚪 Squeaky Door</div></div>,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'The leaking pipe' },
      { key: 'B', text: 'The squeaky door' },
      { key: 'C', text: 'Fix neither' },
      { key: 'D', text: 'Take a break' }
    ]
  },
  {
    id: 'q5',
    domain: 'spatial_visual_memory',
    difficulty: 2,
    title: 'Shape Rotation',
    text: 'Imagine a standard triangle pointing UP (▲). If you rotate it exactly 180 degrees (upside down), which direction is it pointing now?',
    visual: <div style={{display:'flex', justifyContent:'center', gap:'20px', alignItems:'center', padding:'20px', background:'rgba(74, 222, 128, 0.1)', borderRadius:'8px', border:'2px solid #4ade80', color:'#4ade80', fontSize:'2rem'}}><div style={{transform:'rotate(0deg)'}}>▲</div> <span>↻ 180°</span> <span>= ?</span></div>,
    correctAnswer: 'D',
    options: [
      { key: 'A', text: 'Left' },
      { key: 'B', text: 'Right' },
      { key: 'C', text: 'Up' },
      { key: 'D', text: 'Down' }
    ]
  },
  {
    id: 'q6',
    domain: 'logical_mathematical',
    difficulty: 2,
    title: 'Number Pattern',
    text: 'Look at the following number sequence: 2, 4, 6, 8, ... What is the next logical number in this pattern?',
    visual: <div style={{textAlign:'center', background:'rgba(245, 158, 11, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #f59e0b', color:'#f59e0b', fontSize:'1.5rem', fontWeight:'bold', letterSpacing:'4px'}}>2 ➔ 4 ➔ 6 ➔ 8 ➔ ?</div>,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: '10' },
      { key: 'B', text: '9' },
      { key: 'C', text: '12' },
      { key: 'D', text: '16' }
    ]
  },
  {
    id: 'q7',
    domain: 'reflexes_and_focus',
    difficulty: 2,
    title: 'Color Focus',
    text: 'You must sound the alarm ONLY if you see a RED CIRCLE. On the screen, you see a BLUE SQUARE, a GREEN CIRCLE, and a RED SQUARE. Do you sound the alarm?',
    visual: <div style={{display:'flex', justifyContent:'center', gap:'20px', background:'rgba(96, 165, 250, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #60a5fa'}}><div style={{width:'40px', height:'40px', background:'#3b82f6'}}></div><div style={{width:'40px', height:'40px', background:'#22c55e', borderRadius:'20px'}}></div><div style={{width:'40px', height:'40px', background:'#ef4444'}}></div></div>,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Yes, because there is a red shape' },
      { key: 'B', text: 'No, because there is no red circle' },
      { key: 'C', text: 'Yes, because there is a circle' },
      { key: 'D', text: 'Yes, because there are three shapes' }
    ]
  },
  {
    id: 'q8',
    domain: 'executive_strategy',
    difficulty: 2,
    title: 'Rule Override',
    text: 'Normally, you pack apples in RED boxes and bananas in YELLOW boxes. A new urgent rule is announced: "Pack ALL fruits in BLUE boxes today." You receive a banana. Which box do you use?',
    visual: <div style={{textAlign:'center', background:'rgba(192, 132, 252, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #c084fc', color:'#fff'}}><div style={{color:'#c084fc', fontWeight:'bold', marginBottom:'15px', fontSize:'1.1rem'}}>⚠️ NEW RULE: ALL FRUITS ➔ BLUE BOX</div><div style={{fontSize:'2rem'}}>🍌 ➔ 📦 ?</div></div>,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: 'Yellow Box' },
      { key: 'B', text: 'Red Box' },
      { key: 'C', text: 'Blue Box' },
      { key: 'D', text: 'Green Box' }
    ]
  },
  {
    id: 'q9',
    domain: 'spatial_visual_memory',
    difficulty: 3,
    title: 'Route Traceback',
    text: 'You walk 3 blocks North, then 2 blocks East, then 3 blocks South. How do you get back to your starting point in the shortest straight line?',
    visual: <div style={{width:'100%', display:'flex', justifyContent:'center', padding:'20px', background:'rgba(74, 222, 128, 0.1)', border:'2px solid #4ade80', borderRadius:'8px'}}><svg width="150" height="100"><path d="M 20 80 L 20 20 L 120 20 L 120 80" fill="none" stroke="#4ade80" strokeWidth="4" /><circle cx="20" cy="80" r="8" fill="#4ade80" /><circle cx="120" cy="80" r="8" fill="#ef4444" /><text x="50" y="50" fill="#4ade80" fontSize="14" fontWeight="bold">Path Taken</text></svg></div>,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'Walk 2 blocks West' },
      { key: 'B', text: 'Walk 2 blocks East' },
      { key: 'C', text: 'Walk 3 blocks North' },
      { key: 'D', text: 'Walk 3 blocks South' }
    ]
  },
  {
    id: 'q10',
    domain: 'logical_mathematical',
    difficulty: 3,
    title: 'Logistics Network',
    text: 'Drone A carries exactly 2 packages per trip. Drone B carries exactly 3 packages per trip. If you need to deliver exactly 7 packages, how many trips should each drone make?',
    visual: <div style={{display:'flex', justifyContent:'space-around', background:'rgba(245, 158, 11, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #f59e0b', color:'#f59e0b', fontSize:'1.2rem', fontWeight:'bold'}}><div>🚁 Drone A: 2 📦</div><div>🚁 Drone B: 3 📦</div><div>🎯 Target: 7 📦</div></div>,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Drone A: 1 trip, Drone B: 1 trip' },
      { key: 'B', text: 'Drone A: 2 trips, Drone B: 1 trip' },
      { key: 'C', text: 'Drone A: 3 trips, Drone B: 1 trip' },
      { key: 'D', text: 'Drone A: 1 trip, Drone B: 2 trips' }
    ]
  },
  {
    id: 'q11',
    domain: 'reflexes_and_focus',
    difficulty: 3,
    title: 'Dual Condition Check',
    text: 'You must approve access ONLY if the ID badge is GREEN AND the password is "123". The person standing in front of you has a GREEN badge, but their password is "XYZ". Do you approve access?',
    visual: <div style={{textAlign:'center', background:'rgba(234, 179, 8, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #eab308', color:'#fff', display:'flex', justifyContent:'center', gap:'20px', alignItems:'center'}}><div><div style={{padding:'10px 20px', background:'#22c55e', borderRadius:'4px', fontWeight:'bold', color:'#000'}}>GREEN BADGE</div></div><div><div style={{padding:'10px 20px', background:'rgba(0,0,0,0.5)', border:'1px solid #666', borderRadius:'4px', fontFamily:'monospace', letterSpacing:'2px'}}>PASS: XYZ</div></div></div>,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: 'Yes, because the badge is green' },
      { key: 'B', text: 'Yes, the password doesn\'t matter' },
      { key: 'C', text: 'No, because the password is incorrect' },
      { key: 'D', text: 'Yes, but report it later' }
    ]
  },
  {
    id: 'q12',
    domain: 'executive_strategy',
    difficulty: 3,
    title: 'Task Priority',
    text: 'You need to boil pasta (takes 10 mins) and make sauce (takes 5 mins). If you want them both to finish at the EXACT same time so the meal is hot, when should you start the sauce?',
    visual: <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'20px', background:'rgba(192, 132, 252, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #c084fc', color:'#fff', fontWeight:'bold'}}><div>🍝 Pasta: 10m</div><div>+</div><div>🍅 Sauce: 5m</div></div>,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: '5 minutes after starting the pasta' },
      { key: 'B', text: 'At the exact same time as the pasta' },
      { key: 'C', text: '5 minutes before starting the pasta' },
      { key: 'D', text: '10 minutes after starting the pasta' }
    ]
  }
];
// Advanced procedural generation for rich, varied, and challenging cognitive questions
const prng = (function(){ let seed = 123456789; return function() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })();
const generateAdvancedQuestions = () => {
  const domainsList = ['spatial_visual_memory', 'logical_mathematical', 'reflexes_and_focus', 'executive_strategy'];
  
  domainsList.forEach(domain => {
    for (let diff = 1; diff <= 3; diff++) {
      // Generate 12 questions per difficulty to ensure plenty of unique content
      for (let i = 1; i <= 12; i++) {
        let q = {
          id: `q_adv_${domain}_d${diff}_${i}`,
          domain: domain,
          difficulty: diff,
          title: '',
          text: '',
          visual: null,
          correctAnswer: 'A',
          options: []
        };
        
        if (domain === 'logical_mathematical') {
          if (i % 3 === 0) {
            // Sequence Decoder
            const start = Math.floor(prng() * 5) + 2;
            const multiplier = diff === 1 ? 2 : (diff === 2 ? 3 : 4);
            const seq = [start, start * multiplier, start * multiplier * multiplier, start * Math.pow(multiplier, 3)];
            const ans = start * Math.pow(multiplier, 4);
            
            q.title = `Sequence Decoder L${diff}`;
            q.text = `Analyze the data stream pattern. What is the next exact integer in the sequence?`;
            q.visual = <div style={{display:'flex', justifyContent:'center', gap:'10px', background:'rgba(245, 158, 11, 0.1)', padding:'15px', borderRadius:'8px', border:'2px solid #f59e0b', color:'#f59e0b', fontSize:'1.2rem', fontWeight:'bold'}}>{seq.join(' ➔ ')} ➔ ?</div>;
            
            q.correctAnswer = 'A';
            q.options = [
              { key: 'A', text: `${ans}` },
              { key: 'B', text: `${ans + multiplier}` },
              { key: 'C', text: `${ans - start}` },
              { key: 'D', text: `${ans * 2}` }
            ];
          } else if (i % 3 === 1) {
            // Cryptarithm / System Logic
            const a = Math.floor(prng() * (5 * diff)) + 3;
            const b = Math.floor(prng() * (4 * diff)) + 2;
            const sum = a + b;
            const prod = a * b;
            
            q.title = `Logic Link L${diff}`;
            q.text = `System variables Alpha (α) and Beta (β) satisfy two conditions. α + β = ${sum}. α × β = ${prod}. If α > β, what is the value of α?`;
            q.visual = <div style={{display:'flex', flexDirection:'column', alignItems:'center', background:'rgba(245, 158, 11, 0.1)', padding:'15px', borderRadius:'8px', border:'1px dashed #f59e0b', color:'#fff', fontFamily:'monospace'}}><div>[SYS.COND 1] α + β = {sum}</div><div>[SYS.COND 2] α * β = {prod}</div></div>;
            
            q.correctAnswer = 'A';
            q.options = [
              { key: 'A', text: `${a}` },
              { key: 'B', text: `${b}` },
              { key: 'C', text: `${a + 2}` },
              { key: 'D', text: `${b - 1}` }
            ];
          } else {
            // Equation Balance
            const leftTarget = (Math.floor(prng() * 10) + 5) * diff;
            const rightFactor = Math.floor(prng() * 4) + 2;
            const ans = leftTarget / rightFactor;
            
            q.title = `Equation Balance L${diff}`;
            q.text = `The network payload must be perfectly balanced. The left node has a weight of ${leftTarget}. The right node is scaled by ${rightFactor}×. What must the base weight (W) be on the right?`;
            q.visual = <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'15px', background:'rgba(245, 158, 11, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #f59e0b', color:'#f59e0b', fontSize:'1.5rem', fontWeight:'bold'}}><span>⚖️ {leftTarget}</span> <span>=</span> <span>{rightFactor} × W</span></div>;
            
            q.correctAnswer = 'A';
            q.options = [
              { key: 'A', text: `${ans % 1 === 0 ? ans : ans.toFixed(1)}` },
              { key: 'B', text: `${ans + rightFactor}` },
              { key: 'C', text: `${leftTarget - rightFactor}` },
              { key: 'D', text: `${ans * 2}` }
            ];
          }
        } else if (domain === 'spatial_visual_memory') {
          const gridSize = diff + 2; // 3x3, 4x4, 5x5
          const startX = Math.floor(prng() * gridSize);
          const startY = Math.floor(prng() * gridSize);
          
          let curX = startX;
          let curY = startY;
          const moves = [];
          const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
          
          for (let m = 0; m < diff + 2; m++) {
            const validDirs = [];
            if (curY > 0) validDirs.push('UP');
            if (curY < gridSize - 1) validDirs.push('DOWN');
            if (curX > 0) validDirs.push('LEFT');
            if (curX < gridSize - 1) validDirs.push('RIGHT');
            
            const dir = validDirs[Math.floor(prng() * validDirs.length)];
            moves.push(dir);
            if (dir === 'UP') curY--;
            if (dir === 'DOWN') curY++;
            if (dir === 'LEFT') curX--;
            if (dir === 'RIGHT') curX++;
          }
          
          const gridCells = [];
          for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
              const isStart = row === startY && col === startX;
              gridCells.push(
                <div key={`${row}-${col}`} style={{
                  height: '25px', borderRadius: '4px',
                  background: isStart ? '#4ade80' : 'rgba(255,255,255,0.1)',
                  boxShadow: isStart ? '0 0 10px #4ade80' : 'none',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px'
                }}>{isStart ? '●' : ''}</div>
              );
            }
          }
          
          q.title = `Nexus Mapper L${diff}`;
          q.text = `A data packet originates at the highlighted node in the ${gridSize}x${gridSize} grid. It routes: ${moves.join(' ➔ ')}. Where does the packet terminate?`;
          q.visual = <div style={{display:'grid', gridTemplateColumns:`repeat(${gridSize}, 1fr)`, gap:'5px', width:`${gridSize * 30 + 20}px`, margin:'0 auto', background:'rgba(74, 222, 128, 0.1)', padding:'10px', borderRadius:'8px', border:'2px solid #4ade80'}}>{gridCells}</div>;
          
          q.correctAnswer = 'A';
          q.options = [
            { key: 'A', text: `Row ${curY + 1}, Col ${curX + 1}` },
            { key: 'B', text: `Row ${startY + 1}, Col ${startX + 1}` },
            { key: 'C', text: `Row ${Math.max(1, curY)}, Col ${Math.max(1, curX)}` },
            { key: 'D', text: `Row ${curX + 1}, Col ${curY + 1}` }
          ];
        } else if (domain === 'reflexes_and_focus') {
          if (i % 2 === 0) {
            // Stroop Effect
            const colorNames = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];
            const hexes = { 'RED': '#ef4444', 'BLUE': '#3b82f6', 'GREEN': '#22c55e', 'YELLOW': '#eab308', 'PURPLE': '#a855f7' };
            const word = colorNames[Math.floor(prng() * colorNames.length)];
            let paintColor = colorNames[Math.floor(prng() * colorNames.length)];
            
            // Ensure mismatch for difficulty > 1
            if (diff > 1) {
              while (paintColor === word) paintColor = colorNames[Math.floor(prng() * colorNames.length)];
            }
            
            const askForColor = prng() > 0.5;
            
            q.title = `Stroop Shift L${diff}`;
            q.text = askForColor ? `Identify the physical INK COLOR of the text below, ignoring what the word says.` : `Identify what the word actually SAYS, ignoring the ink color it is painted with.`;
            q.visual = <div style={{textAlign:'center', background:'rgba(255,255,255,0.05)', padding:'30px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)'}}><div style={{color: hexes[paintColor], fontSize:'3rem', fontWeight:'900', letterSpacing:'4px'}}>{word}</div></div>;
            
            q.correctAnswer = 'A';
            q.options = [
              { key: 'A', text: askForColor ? paintColor : word },
              { key: 'B', text: askForColor ? word : paintColor },
              { key: 'C', text: colorNames.find(c => c !== word && c !== paintColor) || 'BLACK' },
              { key: 'D', text: colorNames.find(c => c !== word && c !== paintColor && c !== 'BLACK') || 'WHITE' }
            ];
          } else {
            // Object Recognition Distraction
            const shapes = ['Circle', 'Square', 'Triangle', 'Diamond'];
            const colors = ['Red', 'Blue', 'Green'];
            const targetShape = shapes[Math.floor(prng() * shapes.length)];
            const targetColor = colors[Math.floor(prng() * colors.length)];
            
            q.title = `Focus Finder L${diff}`;
            q.text = `SECURITY PROTOCOL: You must ONLY approve entry for a ${targetColor.toUpperCase()} ${targetShape.toUpperCase()}. The scanner detects a shape with 4 equal sides, colored ${targetColor.toUpperCase()}. Do you approve entry?`;
            
            let isMatch = (targetShape === 'Square' || targetShape === 'Diamond');
            
            q.visual = <div style={{textAlign:'center', background:'rgba(59, 130, 246, 0.1)', padding:'20px', borderRadius:'8px', border:'2px solid #3b82f6', color:'#fff'}}>🔍 SCANNER LOG:<br/>Object: Equilateral Quadrilateral<br/>Spectrometer: {targetColor.toUpperCase()}</div>;
            
            q.correctAnswer = 'A';
            q.options = [
              { key: 'A', text: isMatch ? 'Approve Entry' : 'Deny Entry' },
              { key: 'B', text: isMatch ? 'Deny Entry' : 'Approve Entry' },
              { key: 'C', text: 'Quarantine Object' },
              { key: 'D', text: 'Request Manual Review' }
            ];
          }
        } else if (domain === 'executive_strategy') {
          if (i % 2 === 0) {
            // Rule Shift
            const sortingRules = ['Sort by File Size', 'Sort by File Type', 'Sort by Date Created'];
            const currentRule = sortingRules[Math.floor(prng() * sortingRules.length)];
            
            const fileNames = ['video.mp4', 'report.pdf', 'archive.zip', 'photo.jpg', 'system.log'];
            const fileSizes = ['500MB', '2MB', '1.5GB', '450KB', '10MB'];
            const fileDates = ['Created Today', 'Created Yesterday', 'Created Last Week', 'Created 2021'];
            
            const file = fileNames[Math.floor(prng() * fileNames.length)];
            const size = fileSizes[Math.floor(prng() * fileSizes.length)];
            const date = fileDates[Math.floor(prng() * fileDates.length)];
            
            const oldRules = ['Alphabetical Order', 'Ascending Order', 'Reverse Alphabetical'];
            const oldRule = oldRules[Math.floor(prng() * oldRules.length)];
            
            q.title = `Mental Flex L${diff}`;
            q.text = `The system was previously sorting by ${oldRule}. An override command has just been issued. You receive a new file: "${file}" (${size}, ${date}). Under the CURRENT active rule, which bin does this file go into?`;
            
            q.visual = <div style={{display:'flex', flexDirection:'column', gap:'10px', background:'rgba(168, 85, 247, 0.1)', padding:'15px', borderRadius:'8px', border:'2px solid #a855f7', color:'#fff'}}><div>⚠️ SYSTEM OVERRIDE</div><div style={{fontWeight:'bold', color:'#a855f7'}}>NEW RULE: {currentRule.toUpperCase()}</div></div>;
            
            let correctBin = '';
            if (currentRule.includes('Size')) correctBin = 'Large Files Bin';
            if (currentRule.includes('Type')) correctBin = 'Media Files Bin';
            if (currentRule.includes('Date')) correctBin = 'Recent Files Bin';
            
            q.correctAnswer = 'A';
            q.options = [
              { key: 'A', text: correctBin },
              { key: 'B', text: 'Alphabetical Bin (V)' },
              { key: 'C', text: 'Archived Files Bin' },
              { key: 'D', text: 'System Files Bin' }
            ];
          } else {
            // Priority Queue
            const taskPool = [
              'Server Patch', 'UI Update', 'DB Backup', 'API Refactor', 'Security Audit', 'Cache Clear', 'User Migration', 'Log Rotation'
            ];
            const taskCounts = diff === 1 ? 3 : (diff === 2 ? 4 : 5);
            const times = [15, 20, 12, 10];
            const timeLimit = times[Math.floor(prng() * times.length)];
            
            const t1 = taskPool.splice(Math.floor(prng()*taskPool.length), 1)[0];
            const t2 = taskPool.splice(Math.floor(prng()*taskPool.length), 1)[0];
            const t3 = taskPool.splice(Math.floor(prng()*taskPool.length), 1)[0];
            
            const tasks = [
              `${t1} (Critical, 10m)`,
              `${t2} (Low, 2m)`,
              `${t3} (High, 5m)`
            ];
            
            q.title = `Priority Queue L${diff}`;
            q.text = `You have ${taskCounts} pending operations. You only have ${timeLimit} minutes before system lock. To maximize impact, you must complete the highest priority tasks first without exceeding the time limit. What is the optimal sequence?`;
            
            q.visual = <div style={{display:'flex', flexDirection:'column', gap:'8px', background:'rgba(168, 85, 247, 0.1)', padding:'15px', borderRadius:'8px', border:'2px solid #a855f7', color:'#cbd5e1', fontSize:'0.9rem'}}>{tasks.map((t, idx) => <div key={idx}>- {t}</div>)}</div>;
            
            q.correctAnswer = 'A';
            q.options = [
              { key: 'A', text: `${t1} ➔ ${t3}` },
              { key: 'B', text: `${t2} ➔ ${t3} ➔ ${t1}` },
              { key: 'C', text: `${t3} ➔ ${t1} ➔ ${t2}` },
              { key: 'D', text: `${t1} ➔ ${t2}` }
            ];
          }
        }
        
        COGNITIVE_QUESTIONS.push(q);
      }
    }
  });
};
generateAdvancedQuestions();

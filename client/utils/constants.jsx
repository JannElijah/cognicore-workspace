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
  reflexes_and_focus: { title: 'Reflexes & Focus', color: '#ef4444', icon: <SvgGameIcon name="Lightning" color="#ef4444" /> },
  spatial_visual_memory: { title: 'Memory & Recall', color: '#06b6d4', icon: <SvgGameIcon name="Brain" color="#06b6d4" /> },
  logical_mathematical: { title: 'Logical Reasoning', color: '#14b8a6', icon: <SvgGameIcon name="Numbers" color="#14b8a6" /> },
  executive_strategy: { title: 'Executive Strategy', color: '#10b981', icon: <SvgGameIcon name="Compass" color="#10b981" /> }
};

export const DOMAIN_LABELS = {
  reflexes_and_focus: 'Reflexes & Focus',
  spatial_visual_memory: 'Memory & Recall',
  logical_mathematical: 'Logical Reasoning',
  executive_strategy: 'Strategy & Planning'
};

export const DOMAIN_THEMES = {
  reflex: {
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.25)',
    btnGlow: 'rgba(239, 68, 68, 0.4)',
    bg: 'rgba(239, 68, 68, 0.03)',
    btnGradient: 'linear-gradient(to right, #ef4444, #f87171)'
  },
  memory: {
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.25)',
    btnGlow: 'rgba(6, 182, 212, 0.4)',
    bg: 'rgba(6, 182, 212, 0.03)',
    btnGradient: 'linear-gradient(to right, #06b6d4, #22d3ee)'
  },
  reasoning: {
    color: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.25)',
    btnGlow: 'rgba(20, 184, 166, 0.4)',
    bg: 'rgba(20, 184, 166, 0.03)',
    btnGradient: 'linear-gradient(to right, #14b8a6, #2dd4bf)'
  },
  executive: {
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.25)',
    btnGlow: 'rgba(16, 185, 129, 0.4)',
    bg: 'rgba(16, 185, 129, 0.03)',
    btnGradient: 'linear-gradient(to right, #10b981, #34d399)'
  }
};

export const DOMAINS_LIST = [
  {
    id: 'reflexes_and_focus',
    themeClass: 'reflex',
    title: 'Reflex & Attentional Focus',
    icon: <SvgGameIcon name="Lightning" color="#ef4444" />,
    description: 'Improve your reaction time, focus, and ability to ignore distractions under pressure.',
    games: [
      {
        id: 'SpeedTap',
        title: 'Speed Tap',
        icon: <SvgGameIcon name="Lightning" color="#ef4444" />,
        objective: 'Quickly tap the highlighted targets before time runs out, while ignoring the wrong ones.',
        benefit: 'Helps you make faster decisions and react quicker in fast-paced situations.'
      },
      {
        id: 'FocusFinder',
        title: 'Focus Finder',
        icon: <SvgGameIcon name="Target" color="#ef4444" />,
        objective: 'Find the hidden targets moving around in a crowded, messy space.',
        benefit: 'Improves your ability to focus on what matters in a busy environment.'
      },
      {
        id: 'StroopShift',
        title: 'Stroop Shift',
        icon: <SvgGameIcon name="Palette" color="#ef4444" />,
        objective: 'Pick the correct color while ignoring tricky mismatched words (like the word "RED" painted in blue).',
        benefit: 'Trains your brain to overcome confusion and switch tasks easily.'
      }
    ]
  },
  {
    id: 'spatial_visual_memory',
    themeClass: 'memory',
    title: 'Spatial-Visual Memory',
    icon: <SvgGameIcon name="Brain" color="#06b6d4" />,
    description: 'Boost your ability to remember patterns, shapes, and where things are located.',
    games: [
      {
        id: 'MemoryMatch',
        title: 'Memory Match',
        icon: <SvgGameIcon name="Cards" color="#06b6d4" />,
        objective: 'Flip and match pairs of hidden cards on a grid.',
        benefit: 'Helps you remember information longer and recall visual details quickly.'
      },
      {
        id: 'MatrixRecall',
        title: 'Matrix Recall',
        icon: <SvgGameIcon name="Grid" color="#06b6d4" />,
        objective: 'Observe grid pattern sequences highlighted for brief intervals and reconstruct coordinates.',
        benefit: 'Improves spatial orientation and visual-spatial short-term working retention.'
      },
      {
        id: 'SynapseSpin',
        title: 'Synapse Spin',
        icon: <SvgGameIcon name="Sync" color="#06b6d4" />,
        objective: 'Compare visual geometric shapes and rotate them mentally to identify matching templates.',
        benefit: 'Boosts spatial manipulation speed, mental rotation, and spatial configuration logic.'
      },
      {
        id: 'NexusMapper',
        title: 'Nexus Mapper',
        icon: <SvgGameIcon name="Map" color="#06b6d4" />,
        objective: 'Memorize visual objects placed in complex network nodes and recall locations.',
        benefit: 'Enhances associative object-location memory bindings and structural retention.'
      }
    ]
  },
  {
    id: 'logical_mathematical',
    themeClass: 'reasoning',
    title: 'Logical-Mathematical Reasoning',
    icon: <SvgGameIcon name="Numbers" color="#14b8a6" />,
    description: 'Sharpen your math skills, problem-solving abilities, and logical thinking.',
    games: [
      {
        id: 'LogicLink',
        title: 'Logic Link',
        icon: <SvgGameIcon name="Link" color="#14b8a6" />,
        objective: 'Connect the dots in order without crossing lines.',
        benefit: 'Trains you to plan ahead and solve tricky puzzles efficiently.'
      },
      {
        id: 'EquationBalance',
        title: 'Equation Balance',
        icon: <SvgGameIcon name="Scale" color="#14b8a6" />,
        objective: 'Figure out the missing numbers or symbols to balance the scale.',
        benefit: 'Makes you faster and more confident with everyday math and logic.'
      },
      {
        id: 'SequenceDecoder',
        title: 'Sequence Decoder',
        icon: <SvgGameIcon name="Numbers" color="#14b8a6" />,
        objective: 'Examine numeric sequences (e.g. geometric, Fibonacci) and infer missing patterns.',
        benefit: 'Strengthens inductive logical reasoning, sequence detection, and mathematical extrapolation.'
      },
      {
        id: 'RouteOptimizer',
        title: 'Route Optimizer',
        icon: <SvgGameIcon name="Pin" color="#14b8a6" />,
        objective: 'Determine the absolute shortest route visiting all destination nodes under a time limit.',
        benefit: 'Trains combinatorial logic, spatial graph reasoning, and planning efficiency.'
      }
    ]
  },
  {
    id: 'executive_strategy',
    themeClass: 'executive',
    title: 'Executive Strategy & Planning',
    icon: <SvgGameIcon name="Compass" color="#10b981" />,
    description: 'Train adaptive executive control, dynamic plan correction, card matching rule-switching, and decision confidence.',
    games: [
      {
        id: 'PriorityQueue',
        title: 'Priority Queue',
        icon: <SvgGameIcon name="Inbox" color="#10b981" />,
        objective: 'Drag and drop incoming task cards into Urgent, Important, or Delegate bins before they scroll off the conveyor belt.',
        benefit: 'Trains executive triage, multi-priority switching, decision speed under pressure, and resource allocation.'
      },
      {
        id: 'NeuroMaze',
        title: 'Neuro Maze',
        icon: <SvgGameIcon name="Maze" color="#10b981" />,
        objective: 'Escape dynamic grid mazes with moving barrier walls and shifting exit locations.',
        benefit: 'Improves real-time replanning, visual obstacle prediction, and quick strategic changes.'
      },
      {
        id: 'MentalFlex',
        title: 'Mental Flex',
        icon: <SvgGameIcon name="Juggler" color="#10b981" />,
        objective: 'Match incoming target items based on rapidly shifting rules (color, shape, count).',
        benefit: 'Enhances cognitive flexibility, rule induction switching, and adaptive execution.'
      }
    ]
  }
];

export const COGNITIVE_QUESTIONS = [
  {
    id: 'q_ref_1',
    domain: 'reflexes_and_focus',
    difficulty: 1,
    title: 'Security Protocol Override',
    text: 'SECURITY PROTOCOL: You must ONLY approve entry for a RED CIRCLE. The scanner detects the displayed shape. Do you approve entry?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/security_scanner.png" 
          alt="Biometric Security Scanner" 
          style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Yes, approve entry' },
      { key: 'B', text: 'No, reject (It is not a circle)' },
      { key: 'C', text: 'Yes, it is RED' },
      { key: 'D', text: 'Bypass security scanner' },
    ],
  },
  {
    id: 'q_ref_2',
    domain: 'reflexes_and_focus',
    difficulty: 1,
    title: 'Radar Target Discrimination',
    text: 'RADAR SCAN OVERRIDE: Three quadrants transmit standard cyan circle signals, while one rogue quadrant transmits an anomalous amber warning triangle. In which quadrant is the rogue target located?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/radar_discrimination.png" 
          alt="Radar Target Discrimination" 
          style={{ maxHeight: '190px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Top-Left (Quadrant I)' },
      { key: 'B', text: 'Top-Right (Quadrant II)' },
      { key: 'C', text: 'Bottom-Left (Quadrant III)' },
      { key: 'D', text: 'Bottom-Right (Quadrant IV)' },
    ],
  },
  {
    id: 'q_ref_3',
    domain: 'reflexes_and_focus',
    difficulty: 2,
    title: 'Stroop Interference: Traffic',
    text: 'The word "GO" is written in RED ink. The rule is to obey the INK COLOR, not the word. What should you do?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'4rem', color:'#ef4444', fontWeight:'bold', padding:'20px'}}>GO</div>,
    correctAnswer: 'B',
    options: [
      {key: 'A', text: 'Accelerate'},
      {key: 'B', text: 'Stop'},
      {key: 'C', text: 'Yield'},
      {key: 'D', text: 'Reverse'},
    ],
  },
  {
    id: 'q_ref_4',
    domain: 'reflexes_and_focus',
    difficulty: 2,
    title: 'Eriksen Flanker Filter',
    text: 'TARGET OVERRIDE: Focus ONLY on the CENTER arrow. Disregard all surrounding distractor arrows. Which direction is the center arrow pointing?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/flanker_arrows.png" 
          alt="Flanker Arrow Task" 
          style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'Right (→)' },
      { key: 'B', text: 'Left (←)' },
      { key: 'C', text: 'Up (↑)' },
      { key: 'D', text: 'Down (↓)' },
    ],
  },
  {
    id: 'q_ref_5',
    domain: 'reflexes_and_focus',
    difficulty: 3,
    title: 'Cognitive Load: Alpha-Num',
    text: 'If a number is EVEN, press LEFT. If a letter is a VOWEL, press RIGHT. You see: 8, E, 3, B. What is the sequence of presses for the first two items?',
    visual: <div style={{display:'flex', justifyContent:'space-around', fontSize:'2rem', padding:'20px', background:'rgba(255,255,255,0.1)', borderRadius:'8px'}}><span>8</span><span>E</span><span>3</span><span>B</span></div>,
    correctAnswer: 'A',
    options: [
      {key: 'A', text: 'LEFT, RIGHT'},
      {key: 'B', text: 'LEFT, LEFT'},
      {key: 'C', text: 'RIGHT, LEFT'},
      {key: 'D', text: 'RIGHT, RIGHT'},
    ],
  },
  {
    id: 'q_spat_1',
    domain: 'spatial_visual_memory',
    difficulty: 1,
    title: 'Matrix Pattern Completion',
    text: 'Analyze the 2x2 progressive matrix. Which geometric shape logically replaces the question mark (?) in the bottom-right cell?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/matrix_pattern.png" 
          alt="Matrix Pattern Completion" 
          style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'Circle completely filled (4/4)' },
      { key: 'B', text: 'Empty circle outline' },
      { key: 'C', text: 'Square completely filled' },
      { key: 'D', text: 'Half circle rotated' },
    ],
  },
  {
    id: 'q_spat_2',
    domain: 'spatial_visual_memory',
    difficulty: 1,
    title: 'Mental Rotation: Letter F',
    text: 'If the reference shape "F" is rotated 90° clockwise as indicated by the arrow, which direction will its two horizontal arms point?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/shape_rotation_f.png" 
          alt="Letter F 90 Degree Rotation" 
          style={{ maxHeight: '190px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Pointing Up (↑)' },
      { key: 'B', text: 'Pointing Down (↓)' },
      { key: 'C', text: 'Pointing Left (←)' },
      { key: 'D', text: 'Unchanged (→)' },
    ],
  },
  {
    id: 'q_spat_3',
    domain: 'spatial_visual_memory',
    difficulty: 2,
    title: '3x3 Grid Dot Tracker',
    text: 'A tracking dot begins in the center cell of the 3x3 grid. It moves: 1 step UP, 1 step LEFT, and 1 step RIGHT. Which cell is it currently occupying?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/dot_tracker_grid.png" 
          alt="3x3 Grid Dot Tracker" 
          style={{ maxHeight: '190px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'Top Center' },
      { key: 'B', text: 'Center' },
      { key: 'C', text: 'Top Right' },
      { key: 'D', text: 'Top Left' },
    ],
  },
  {
    id: 'q_spat_4',
    domain: 'spatial_visual_memory',
    difficulty: 2,
    title: 'Mirror Image',
    text: 'Look at the pattern: GREEN, BLUE, RED. What is the exact mirror image of this sequence from right to left?',
    visual: <div style={{display:'flex', justifyContent:'center', gap:'12px', fontSize:'1.5rem', padding:'20px', fontWeight:'bold'}}><span style={{color:'#22c55e'}}>[GREEN]</span><span style={{color:'#3b82f6'}}>[BLUE]</span><span style={{color:'#ef4444'}}>[RED]</span><span>[MIRROR]</span></div>,
    correctAnswer: 'B',
    options: [
      {key: 'A', text: 'GREEN, BLUE, RED'},
      {key: 'B', text: 'RED, BLUE, GREEN'},
      {key: 'C', text: 'BLUE, RED, GREEN'},
      {key: 'D', text: 'RED, GREEN, BLUE'},
    ],
  },
  {
    id: 'q_spat_5',
    domain: 'spatial_visual_memory',
    difficulty: 3,
    title: '3D Cube Net Folding',
    text: 'A 2D cross-shaped flat net of 6 squares is folded along its seams into a 3D cube. If the RED square forms the bottom (base), and the BLUE square is directly adjacent to it, can the BLUE square ever form the top face?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/cube_net_fold.png" 
          alt="3D Cube Net Folding" 
          style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Yes, always' },
      { key: 'B', text: 'No, never (It folds into a side wall)' },
      { key: 'C', text: 'Only if rotated 90 degrees' },
      { key: 'D', text: 'Depends on folding sequence' },
    ],
  },
  {
    id: 'q_log_1',
    domain: 'logical_mathematical',
    difficulty: 1,
    title: 'Number Sequence',
    text: 'Find the missing number: 2, 5, 10, 17, ?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', padding:'20px', letterSpacing:'5px'}}>2 5 10 17 ?</div>,
    correctAnswer: 'C',
    options: [
      {key: 'A', text: '24'},
      {key: 'B', text: '25'},
      {key: 'C', text: '26'},
      {key: 'D', text: '27'},
    ],
  },
  {
    id: 'q_log_2',
    domain: 'logical_mathematical',
    difficulty: 1,
    title: 'Equilibrium Weight Logic',
    text: 'The digital scale is currently in perfect equilibrium. Based on the diagram, 1 Cyan Cube is equal in weight to how many Purple Spheres?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/balance_scale.png" 
          alt="Digital Balance Scale" 
          style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'B',
    options: [
      { key: 'A', text: '1 Sphere' },
      { key: 'B', text: '2 Spheres' },
      { key: 'C', text: '3 Spheres' },
      { key: 'D', text: '4 Spheres' },
    ],
  },
  {
    id: 'q_log_3',
    domain: 'logical_mathematical',
    difficulty: 2,
    title: 'Data Stream Sorting',
    text: 'A server receives packets at 5 MB/s. Another sends packets at 3 MB/s. If the buffer starts empty, how much data is in the buffer after 10 seconds?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', padding:'20px'}}>?? 5 MB/s &nbsp;&nbsp; ?? 3 MB/s</div>,
    correctAnswer: 'B',
    options: [
      {key: 'A', text: '80 MB'},
      {key: 'B', text: '20 MB'},
      {key: 'C', text: '15 MB'},
      {key: 'D', text: '50 MB'},
    ],
  },
  {
    id: 'q_log_4',
    domain: 'logical_mathematical',
    difficulty: 2,
    title: 'Cryptarithm',
    text: 'If APPLE + APPLE = 10, and APPLE x BANANA = 15, what is the value of BANANA?',
    visual: <div style={{display:'flex', flexDirection:'column', alignItems:'center', fontSize:'1.5rem', padding:'20px'}}><div>APPLE + APPLE = 10</div><div>APPLE x BANANA = 15</div></div>,
    correctAnswer: 'A',
    options: [
      {key: 'A', text: '3'},
      {key: 'B', text: '4'},
      {key: 'C', text: '5'},
      {key: 'D', text: '6'},
    ],
  },
  {
    id: 'q_log_5',
    domain: 'logical_mathematical',
    difficulty: 3,
    title: 'Network Topology',
    text: 'There are 4 computers connected in a ring. A virus spreads to adjacent nodes every 1 minute. If node 1 is infected at 0:00, when will node 3 be infected?',
    visual: <div style={{display:'flex', justifyContent:'center', gap:'18px', fontSize:'1.5rem', padding:'20px', fontWeight:'bold'}}>COMPUTER [SYNC] COMPUTER</div>,
    correctAnswer: 'C',
    options: [
      {key: 'A', text: '1 minute'},
      {key: 'B', text: '1.5 minutes'},
      {key: 'C', text: '2 minutes'},
      {key: 'D', text: '3 minutes'},
    ],
  },
  {
    id: 'q_exe_1',
    domain: 'executive_strategy',
    difficulty: 1,
    title: 'Triage File Sorting',
    text: 'You are organizing files. Rule: Docs go left (←), Images go right (→). An incoming .JPG file is detected. Where does it go?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/triage_sorting.png" 
          alt="Triage File Sorting" 
          style={{ maxHeight: '190px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Left (Documents Folder)' },
      { key: 'B', text: 'Right (Images Folder)' },
      { key: 'C', text: 'Archive Quarantine' },
      { key: 'D', text: 'Delete File' },
    ],
  },
  {
    id: 'q_exe_2',
    domain: 'executive_strategy',
    difficulty: 1,
    title: 'Rule Shift',
    text: 'Rule 1: Sort by Color. Rule 2 (Override): Sort by Shape. You receive a RED SQUARE. Under the override, which bin does it go into?',
    visual: <div style={{display:'flex', flexDirection:'column', alignItems:'center', padding:'20px', border:'2px dashed #a855f7', borderRadius:'8px', color:'#a855f7'}}><div>WARNING: OVERRIDE ACTIVE</div><div style={{fontSize:'2rem', color:'#ef4444'}}>[RED]</div></div>,
    correctAnswer: 'A',
    options: [
      {key: 'A', text: 'Square Bin'},
      {key: 'B', text: 'Red Bin'},
      {key: 'C', text: 'Color Bin'},
      {key: 'D', text: 'Reject Bin'},
    ],
  },
  {
    id: 'q_exe_3',
    domain: 'executive_strategy',
    difficulty: 2,
    title: 'Resource Budget Optimization',
    text: 'You have a fixed budget of $100. Task A costs $60 (High Priority), Task B costs $50 (Medium Priority), and Task C costs $30 (Low Priority). Which combination maximizes priority without overspending?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/resource_allocation.png" 
          alt="Resource Budget Optimization" 
          style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Task A and Task B ($110)' },
      { key: 'B', text: 'Task A and Task C ($90)' },
      { key: 'C', text: 'Task B and Task C ($80)' },
      { key: 'D', text: 'Only Task A ($60)' },
    ],
  },
  {
    id: 'q_exe_4',
    domain: 'executive_strategy',
    difficulty: 2,
    title: 'Schedule Conflict Resolution',
    text: 'Analyze the timeline schedule. Meeting X runs 2:00–3:00 PM, Meeting Y runs 2:30–3:15 PM, and Meeting Z runs 3:00–4:00 PM. Which two meetings can be fully attended without overlap?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <img 
          src="/assessments/schedule_timeline.png" 
          alt="Schedule Timeline Conflict" 
          style={{ width: '100%', maxHeight: '235px', objectFit: 'contain', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.35)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)' }} 
        />
      </div>
    ),
    correctAnswer: 'C',
    options: [
      { key: 'A', text: 'Meeting X and Meeting Y' },
      { key: 'B', text: 'Meeting Y and Meeting Z' },
      { key: 'C', text: 'Meeting X and Meeting Z' },
      { key: 'D', text: 'All three meetings simultaneously' },
    ],
  },
  {
    id: 'q_exe_5',
    domain: 'executive_strategy',
    difficulty: 3,
    title: 'Optimal Pathfinding',
    text: 'You must route telemetry packets from Node A (Start) to Node D (Target) with the lowest total latency cost. Which route is optimal?',
    visual: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/assessments/network_route.png" 
          alt="Network Routing Diagram" 
          style={{ maxHeight: '210px', maxWidth: '100%', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)' }} 
        />
      </div>
    ),
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'Route A → B → D (Total Cost: 6)' },
      { key: 'B', text: 'Route A → C → D (Total Cost: 8)' },
      { key: 'C', text: 'Route A → C → B → D (Total Cost: 10)' },
      { key: 'D', text: 'Both paths have equal cost' },
    ],
  },
];


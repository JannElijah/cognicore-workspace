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
    id: 'q_ref_1',
    domain: 'reflexes_and_focus',
    difficulty: 1,
    title: 'Focus Finder: Neon Grid',
    text: 'SECURITY PROTOCOL: You must ONLY approve entry for a RED CIRCLE. The scanner detects a shape with 4 equal sides, colored RED. Do you approve entry?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'3rem', padding:'20px'}}>🚨 🟥 🛑</div>,
    correctAnswer: 'B',
    options: [
      {key: 'A', text: 'Yes, it is RED'},
      {key: 'B', text: 'No, it is not a CIRCLE'},
      {key: 'C', text: 'Yes, it has 4 sides'},
      {key: 'D', text: 'Cannot be determined'},
    ],
  },
  {
    id: 'q_ref_2',
    domain: 'reflexes_and_focus',
    difficulty: 1,
    title: 'Reaction Match',
    text: 'Target is YELLOW. The sequence flashes: PURPLE, YELLOW, YELLOW. How many times did the target appear?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'3rem', padding:'20px'}}>🟪 🟨 🟨</div>,
    correctAnswer: 'C',
    options: [
      {key: 'A', text: '0'},
      {key: 'B', text: '1'},
      {key: 'C', text: '2'},
      {key: 'D', text: '3'},
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
    title: 'Audio-Visual Sync',
    text: 'You hear a HIGH beep while seeing a DOWN arrow. The correct pairing is HIGH-UP or LOW-DOWN. Is the current signal valid?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'3rem', padding:'20px'}}>🔊 ⬇️</div>,
    correctAnswer: 'B',
    options: [
      {key: 'A', text: 'Yes, valid'},
      {key: 'B', text: 'No, invalid'},
      {key: 'C', text: 'Need more info'},
      {key: 'D', text: 'Warning: Signal lost'},
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
    title: 'Dot Tracker',
    text: 'A dot starts in the center of a 3x3 grid. It moves: UP, LEFT, RIGHT. Where is it relative to the center?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', padding:'20px'}}>⬆️ ⬅️ ➡️</div>,
    correctAnswer: 'A',
    options: [
      {key: 'A', text: 'Top Center'},
      {key: 'B', text: 'Center'},
      {key: 'C', text: 'Top Right'},
      {key: 'D', text: 'Top Left'},
    ],
  },
  {
    id: 'q_spat_2',
    domain: 'spatial_visual_memory',
    difficulty: 1,
    title: 'Shape Rotation',
    text: 'Imagine a letter "L". Rotate it 90 degrees clockwise. Which way does the long stem point?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'4rem', padding:'20px'}}>L 🔄</div>,
    correctAnswer: 'C',
    options: [
      {key: 'A', text: 'Up'},
      {key: 'B', text: 'Down'},
      {key: 'C', text: 'Right'},
      {key: 'D', text: 'Left'},
    ],
  },
  {
    id: 'q_spat_3',
    domain: 'spatial_visual_memory',
    difficulty: 2,
    title: 'Pathfinder',
    text: 'A mouse is in a maze. It goes Forward 2 spaces, turns Left, goes Forward 1 space, turns Right, and goes Forward 2 spaces. If it turns around (180 degrees), what is its sequence back to the start?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', padding:'20px'}}>🐭 ⬆️⬆️ ⬅️ ⬆️ ➡️ ⬆️⬆️</div>,
    correctAnswer: 'D',
    options: [
      {key: 'A', text: 'F2, L, F1, R, F2'},
      {key: 'B', text: 'F2, R, F1, L, F2'},
      {key: 'C', text: 'F2, L, F2, R, F1'},
      {key: 'D', text: 'F2, L, F1, R, F2'},
    ],
  },
  {
    id: 'q_spat_4',
    domain: 'spatial_visual_memory',
    difficulty: 2,
    title: 'Mirror Image',
    text: 'Look at the pattern: 🟩 🟦 🟥. What is the exact mirror image of this sequence from right to left?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'3rem', padding:'20px'}}>🟩 🟦 🟥 🪞</div>,
    correctAnswer: 'B',
    options: [
      {key: 'A', text: '🟩 🟦 🟥'},
      {key: 'B', text: '🟥 🟦 🟩'},
      {key: 'C', text: '🟦 🟥 🟩'},
      {key: 'D', text: '🟥 🟩 🟦'},
    ],
  },
  {
    id: 'q_spat_5',
    domain: 'spatial_visual_memory',
    difficulty: 3,
    title: '3D Cube Fold',
    text: 'A cross-shaped flat net of 6 squares is folded into a cube. If the RED square is on the bottom, and the BLUE square is adjacent to it, can the BLUE square ever be on top?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'3rem', padding:'20px'}}>🧊 🔴 🔵</div>,
    correctAnswer: 'B',
    options: [
      {key: 'A', text: 'Yes, always'},
      {key: 'B', text: 'No, never'},
      {key: 'C', text: 'Only if rotated'},
      {key: 'D', text: 'Depends on the other colors'},
    ],
  },
  {
    id: 'q_log_1',
    domain: 'logical_mathematical',
    difficulty: 1,
    title: 'Number Sequence',
    text: 'Find the missing number: 2, 5, 10, 17, ?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', padding:'20px', letterSpacing:'5px'}}>2 5 10 17 ❓</div>,
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
    title: 'Basic Algebra',
    text: 'If 3x + 5 = 20, what is the value of x?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'3rem', padding:'20px', fontFamily:'monospace'}}>3x + 5 = 20</div>,
    correctAnswer: 'A',
    options: [
      {key: 'A', text: '5'},
      {key: 'B', text: '15'},
      {key: 'C', text: '25/3'},
      {key: 'D', text: '10'},
    ],
  },
  {
    id: 'q_log_3',
    domain: 'logical_mathematical',
    difficulty: 2,
    title: 'Data Stream Sorting',
    text: 'A server receives packets at 5 MB/s. Another sends packets at 3 MB/s. If the buffer starts empty, how much data is in the buffer after 10 seconds?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', padding:'20px'}}>📥 5 MB/s &nbsp;&nbsp; 📤 3 MB/s</div>,
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
    text: 'If 🍎 + 🍎 = 10, and 🍎 × 🍌 = 15, what is the value of 🍌?',
    visual: <div style={{display:'flex', flexDirection:'column', alignItems:'center', fontSize:'2rem', padding:'20px'}}><div>🍎 + 🍎 = 10</div><div>🍎 × 🍌 = 15</div></div>,
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
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'3rem', padding:'20px'}}>💻 🔄 💻</div>,
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
    title: 'Triage Sorting',
    text: 'You are organizing files. Rule: Docs go left, Images go right. You get a .JPG file. Where does it go?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', padding:'20px'}}>📄 ⬅️ &nbsp;|&nbsp; ➡️ 🖼️</div>,
    correctAnswer: 'B',
    options: [
      {key: 'A', text: 'Left'},
      {key: 'B', text: 'Right'},
      {key: 'C', text: 'Archive'},
      {key: 'D', text: 'Delete'},
    ],
  },
  {
    id: 'q_exe_2',
    domain: 'executive_strategy',
    difficulty: 1,
    title: 'Rule Shift',
    text: 'Rule 1: Sort by Color. Rule 2 (Override): Sort by Shape. You receive a RED SQUARE. Under the override, which bin does it go into?',
    visual: <div style={{display:'flex', flexDirection:'column', alignItems:'center', padding:'20px', border:'2px dashed #a855f7', borderRadius:'8px', color:'#a855f7'}}><div>⚠️ OVERRIDE ACTIVE</div><div style={{fontSize:'2rem'}}>🟥</div></div>,
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
    title: 'Resource Allocation',
    text: 'You have $100. Task A costs $60 (High Priority). Task B costs $50 (Medium). Task C costs $30 (Low). Which combination maximizes priority without overspending?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', padding:'20px'}}>💰 $100</div>,
    correctAnswer: 'B',
    options: [
      {key: 'A', text: 'A and B'},
      {key: 'B', text: 'A and C'},
      {key: 'C', text: 'B and C'},
      {key: 'D', text: 'Only A'},
    ],
  },
  {
    id: 'q_exe_4',
    domain: 'executive_strategy',
    difficulty: 2,
    title: 'Scheduling Conflict',
    text: 'Meeting X is at 2:00 PM (1 hr). Meeting Y is at 2:30 PM (30 mins). Meeting Z is at 3:00 PM (1 hr). Which meetings can you attend fully?',
    visual: <div style={{display:'flex', justifyContent:'center', fontSize:'2rem', padding:'20px'}}>📅 🕒</div>,
    correctAnswer: 'C',
    options: [
      {key: 'A', text: 'X and Y'},
      {key: 'B', text: 'Y and Z'},
      {key: 'C', text: 'X and Z'},
      {key: 'D', text: 'All of them'},
    ],
  },
  {
    id: 'q_exe_5',
    domain: 'executive_strategy',
    difficulty: 3,
    title: 'Multi-Constraint Optimization',
    text: 'Ship A needs to leave before Ship B. Ship C needs to leave after Ship B but before Ship D. What is the only valid departure sequence?',
    visual: <div style={{display:'flex', justifyContent:'space-around', fontSize:'2rem', padding:'20px'}}>🚢 A &nbsp; 🚢 B &nbsp; 🚢 C &nbsp; 🚢 D</div>,
    correctAnswer: 'A',
    options: [
      {key: 'A', text: 'A, B, C, D'},
      {key: 'B', text: 'B, A, C, D'},
      {key: 'C', text: 'A, C, B, D'},
      {key: 'D', text: 'D, C, B, A'},
    ],
  },
];

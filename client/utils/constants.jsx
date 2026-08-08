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
  reflexes_and_focus: { title: 'Reflexes & Focus', color: '#38bdf8', icon: <SvgGameIcon name="Lightning" color="#38bdf8" /> },
  spatial_visual_memory: { title: 'Memory & Recall', color: '#4ade80', icon: <SvgGameIcon name="Brain" color="#4ade80" /> },
  logical_mathematical: { title: 'Logical Reasoning', color: '#f59e0b', icon: <SvgGameIcon name="Numbers" color="#f59e0b" /> },
  executive_strategy: { title: 'Executive Strategy', color: '#a855f7', icon: <SvgGameIcon name="Compass" color="#a855f7" /> }
};

export const DOMAIN_LABELS = {
  reflexes_and_focus: 'Reflexes & Focus',
  spatial_visual_memory: 'Memory & Recall',
  logical_mathematical: 'Logical Reasoning',
  executive_strategy: 'Strategy & Planning'
};

export const DOMAIN_THEMES = {
  reflex: {
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.25)',
    btnGlow: 'rgba(56, 189, 248, 0.4)',
    bg: 'rgba(56, 189, 248, 0.03)',
    btnGradient: 'linear-gradient(to right, #38bdf8, #60a5fa)'
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
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.25)',
    btnGlow: 'rgba(168, 85, 247, 0.4)',
    bg: 'rgba(168, 85, 247, 0.03)',
    btnGradient: 'linear-gradient(to right, #a855f7, #c084fc)'
  }
};

export const DOMAINS_LIST = [
  {
    id: 'reflexes_and_focus',
    themeClass: 'reflex',
    title: 'Reflex & Attentional Focus',
    icon: <SvgGameIcon name="Lightning" color="#38bdf8" />,
    description: 'Improve your reaction time, focus, and ability to ignore distractions under pressure.',
    games: [
      {
        id: 'SpeedTap',
        title: 'Speed Tap',
        icon: <SvgGameIcon name="Lightning" color="#38bdf8" />,
        objective: 'Quickly tap the highlighted targets before time runs out, while ignoring the wrong ones.',
        benefit: 'Helps you make faster decisions and react quicker in fast-paced situations.'
      },
      {
        id: 'FocusFinder',
        title: 'Focus Finder',
        icon: <SvgGameIcon name="Target" color="#38bdf8" />,
        objective: 'Find the hidden targets moving around in a crowded, messy space.',
        benefit: 'Improves your ability to focus on what matters in a busy environment.'
      },
      {
        id: 'StroopShift',
        title: 'Stroop Shift',
        icon: <SvgGameIcon name="Palette" color="#38bdf8" />,
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
        id: 'NeuralNBack',
        title: 'Neural N-Back',
        icon: <SvgGameIcon name="Puzzle" color="#4ade80" />,
        objective: 'Track visual element sequences and identify target matches located N steps backwards.',
        benefit: 'Exercises active mental template updates, temporal processing, and continuous memory storage.',
        inProgress: true
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
    icon: <SvgGameIcon name="Compass" color="#a855f7" />,
    description: 'Train adaptive executive control, dynamic plan correction, card matching rule-switching, and decision confidence.',
    games: [
      {
        id: 'PriorityQueue',
        title: 'Priority Queue',
        icon: <SvgGameIcon name="Inbox" color="#a855f7" />,
        objective: 'Drag and drop incoming task cards into Urgent, Important, or Delegate bins before they scroll off the conveyor belt.',
        benefit: 'Trains executive triage, multi-priority switching, decision speed under pressure, and resource allocation.'
      },
      {
        id: 'NeuroMaze',
        title: 'Neuro Maze',
        icon: <SvgGameIcon name="Maze" color="#a855f7" />,
        objective: 'Escape dynamic grid mazes with moving barrier walls and shifting exit locations.',
        benefit: 'Improves real-time replanning, visual obstacle prediction, and quick strategic changes.'
      },
      {
        id: 'MentalFlex',
        title: 'Mental Flex',
        icon: <SvgGameIcon name="Juggler" color="#a855f7" />,
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
    title: 'Spatial-Visual Memory (1/3)',
    text: 'Imagine a grid with 4 rows and 4 columns. Which of these options correctly points to the tiles in row 1 column 2, row 2 column 4, and row 4 column 3?',
    options: [
      { key: 'A', text: '(1,2), (2,4), (4,3)' },
      { key: 'B', text: '(2,1), (4,2), (3,4)' },
      { key: 'C', text: '(1,3), (2,4), (4,2)' },
      { key: 'D', text: '(1,2), (2,3), (4,4)' }
    ]
  },
  {
    id: 'q2',
    domain: 'logical_mathematical',
    title: 'Logical-Mathematical (1/3)',
    text: 'What number comes next in this pattern? 2, 3, 5, 8, 13, 21, ?',
    options: [
      { key: 'A', text: '29' },
      { key: 'B', text: '34' },
      { key: 'C', text: '31' },
      { key: 'D', text: '42' }
    ]
  },
  {
    id: 'q3',
    domain: 'reflexes_and_focus',
    title: 'Reflexes & Focus (1/3)',
    text: 'If you see the word "BLUE" printed in red ink, what is the color of the ink?',
    options: [
      { key: 'A', text: 'Blue' },
      { key: 'B', text: 'Green' },
      { key: 'C', text: 'Red' },
      { key: 'D', text: 'Black' }
    ]
  },
  {
    id: 'q4',
    domain: 'executive_strategy',
    title: 'Executive Strategy (1/3)',
    text: 'Imagine navigating a maze. Moving right costs 2 energy points, moving down costs 3. You can\'t move diagonally. If you need to go 3 spaces right and 3 spaces down, what\'s the total energy cost?',
    options: [
      { key: 'A', text: '15' },
      { key: 'B', text: '12' },
      { key: 'C', text: '18' },
      { key: 'D', text: '10' }
    ]
  },
  {
    id: 'q5',
    domain: 'spatial_visual_memory',
    title: 'Spatial-Visual Memory (2/3)',
    text: 'Imagine a 3x3 Rubik\'s cube face: Blue-Red-Blue on top, Green-Green-Red in the middle, Blue-Green-Red on bottom. If you rotate it 90 degrees clockwise, what are the colors of the new top row?',
    options: [
      { key: 'A', text: 'Red-Green-Blue' },
      { key: 'B', text: 'Blue-Red-Green' },
      { key: 'C', text: 'Green-Red-Red' },
      { key: 'D', text: 'Blue-Green-Blue' }
    ]
  },
  {
    id: 'q6',
    domain: 'logical_mathematical',
    title: 'Logical-Mathematical (2/3)',
    text: 'Math puzzle: A + B = 10, A * B = 24, and B is bigger than A. If you multiply B by 3 and subtract A, what number do you get?',
    options: [
      { key: 'A', text: '10' },
      { key: 'B', text: '16' },
      { key: 'C', text: '14' },
      { key: 'D', text: '12' }
    ]
  },
  {
    id: 'q7',
    domain: 'reflexes_and_focus',
    title: 'Reflexes & Focus (2/3)',
    text: 'Stroop Conflict: The word "GREEN" is written in YELLOW ink. Choose the word spelling, NOT the ink color.',
    options: [
      { key: 'A', text: 'Yellow' },
      { key: 'B', text: 'Green' },
      { key: 'C', text: 'Blue' },
      { key: 'D', text: 'Red' }
    ]
  },
  {
    id: 'q8',
    domain: 'executive_strategy',
    title: 'Executive Strategy (2/3)',
    text: 'Rule-Shifting: If Target = Blue Circle and Obstacle = Red Square, the optimal action is Action A. If the rule shifts such that Target and Obstacle swap colors, what is the action corresponding to Red Circle?',
    options: [
      { key: 'A', text: 'Action A (Treat as Target)' },
      { key: 'B', text: 'Action C (No response needed)' },
      { key: 'C', text: 'Action D (Re-initialize)' },
      { key: 'D', text: 'Action B (Treat as Obstacle)' }
    ]
  },
  {
    id: 'q9',
    domain: 'spatial_visual_memory',
    title: 'Spatial-Visual Memory (3/3)',
    text: 'A visual sequence flashes: Top-Right tile, Center-Left tile, Bottom-Center tile, Top-Center tile. Which option lists the tiles in the exact reverse sequence?',
    options: [
      { key: 'A', text: 'Top-Center, Bottom-Center, Center-Left, Top-Right' },
      { key: 'B', text: 'Top-Right, Center-Left, Bottom-Center, Top-Center' },
      { key: 'C', text: 'Top-Center, Bottom-Center, Top-Right, Center-Left' },
      { key: 'D', text: 'Center-Left, Top-Right, Top-Center, Bottom-Center' }
    ]
  },
  {
    id: 'q10',
    domain: 'logical_mathematical',
    title: 'Logical-Mathematical (3/3)',
    text: 'Identify the pattern to complete the sequence: 3, 9, 27, 81, ?',
    options: [
      { key: 'A', text: '162' },
      { key: 'B', text: '243' },
      { key: 'C', text: '324' },
      { key: 'D', text: '216' }
    ]
  },
  {
    id: 'q11',
    domain: 'reflexes_and_focus',
    title: 'Reflexes & Focus (3/3)',
    text: 'Stroop Conflict: The word "YELLOW" is written in GREEN ink. What is the actual ink color of the word?',
    options: [
      { key: 'A', text: 'Yellow' },
      { key: 'B', text: 'Red' },
      { key: 'C', text: 'Green' },
      { key: 'D', text: 'Blue' }
    ]
  },
  {
    id: 'q12',
    domain: 'executive_strategy',
    title: 'Executive Strategy (3/3)',
    text: 'Path Optimization: A drone must visit 3 nodes A, B, and C. Distances are: Start-A = 5, Start-B = 10, A-B = 3, B-C = 4, A-C = 6. What is the shortest total path length to visit all nodes starting from Start?',
    options: [
      { key: 'A', text: '12' },
      { key: 'B', text: '14' },
      { key: 'C', text: '15' },
      { key: 'D', text: '16' }
    ]
  }
];

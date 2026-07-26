export const DOMAIN_INFO = {
  reflexes_and_focus: { title: 'Reflexes & Focus', color: '#38bdf8', icon: '⚡' },
  spatial_visual_memory: { title: 'Memory & Recall', color: '#4ade80', icon: '🧠' },
  logical_mathematical: { title: 'Logical Reasoning', color: '#f59e0b', icon: '🔢' },
  executive_strategy: { title: 'Executive Strategy', color: '#a855f7', icon: '🧭' }
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
    icon: '⚡',
    description: 'Improve your reaction time, focus, and ability to ignore distractions under pressure.',
    games: [
      {
        id: 'SpeedTap',
        title: 'Speed Tap',
        icon: '⚡',
        objective: 'Quickly tap the highlighted targets before time runs out, while ignoring the wrong ones.',
        benefit: 'Helps you make faster decisions and react quicker in fast-paced situations.'
      },
      {
        id: 'FocusFinder',
        title: 'Focus Finder',
        icon: '🎯',
        objective: 'Find the hidden targets moving around in a crowded, messy space.',
        benefit: 'Improves your ability to focus on what matters in a busy environment.'
      },
      {
        id: 'StroopShift',
        title: 'Stroop Shift',
        icon: '🎨',
        objective: 'Pick the correct color while ignoring tricky mismatched words (like the word "RED" painted in blue).',
        benefit: 'Trains your brain to overcome confusion and switch tasks easily.'
      }
    ]
  },
  {
    id: 'spatial_visual_memory',
    themeClass: 'memory',
    title: 'Spatial-Visual Memory',
    icon: '🧠',
    description: 'Boost your ability to remember patterns, shapes, and where things are located.',
    games: [
      {
        id: 'MemoryMatch',
        title: 'Memory Match',
        icon: '🃏',
        objective: 'Flip and match pairs of hidden cards on a grid.',
        benefit: 'Helps you remember information longer and recall visual details quickly.'
      },
      {
        id: 'MatrixRecall',
        title: 'Matrix Recall',
        icon: '🔲',
        objective: 'Observe grid pattern sequences highlighted for brief intervals and reconstruct coordinates.',
        benefit: 'Improves spatial orientation and visual-spatial short-term working retention.'
      },
      {
        id: 'NeuralNBack',
        title: 'Neural N-Back',
        icon: '🧩',
        objective: 'Track visual element sequences and identify target matches located N steps backwards.',
        benefit: 'Exercises active mental template updates, temporal processing, and continuous memory storage.',
        inProgress: true
      },
      {
        id: 'SynapseSpin',
        title: 'Synapse Spin',
        icon: '🔄',
        objective: 'Compare visual geometric shapes and rotate them mentally to identify matching templates.',
        benefit: 'Boosts spatial manipulation speed, mental rotation, and spatial configuration logic.'
      },
      {
        id: 'NexusMapper',
        title: 'Nexus Mapper',
        icon: '🗺️',
        objective: 'Memorize visual objects placed in complex network nodes and recall locations.',
        benefit: 'Enhances associative object-location memory bindings and structural retention.'
      }
    ]
  },
  {
    id: 'logical_mathematical',
    themeClass: 'reasoning',
    title: 'Logical-Mathematical Reasoning',
    icon: '🔢',
    description: 'Sharpen your math skills, problem-solving abilities, and logical thinking.',
    games: [
      {
        id: 'LogicLink',
        title: 'Logic Link',
        icon: '🔗',
        objective: 'Connect the dots in order without crossing lines.',
        benefit: 'Trains you to plan ahead and solve tricky puzzles efficiently.'
      },
      {
        id: 'EquationBalance',
        title: 'Equation Balance',
        icon: '⚖️',
        objective: 'Figure out the missing numbers or symbols to balance the scale.',
        benefit: 'Makes you faster and more confident with everyday math and logic.'
      },
      {
        id: 'SequenceDecoder',
        title: 'Sequence Decoder',
        icon: '🔢',
        objective: 'Examine numeric sequences (e.g. geometric, Fibonacci) and infer missing patterns.',
        benefit: 'Strengthens inductive logical reasoning, sequence detection, and mathematical extrapolation.'
      },
      {
        id: 'RouteOptimizer',
        title: 'Route Optimizer',
        icon: '📍',
        objective: 'Determine the absolute shortest route visiting all destination nodes under a time limit.',
        benefit: 'Trains combinatorial logic, spatial graph reasoning, and planning efficiency.'
      }
    ]
  },
  {
    id: 'executive_strategy',
    themeClass: 'executive',
    title: 'Executive Strategy & Planning',
    icon: '🧭',
    description: 'Train adaptive executive control, dynamic plan correction, card matching rule-switching, and decision confidence.',
    games: [
      {
        id: 'PriorityQueue',
        title: 'Priority Queue',
        icon: '📥',
        objective: 'Drag and drop incoming task cards into Urgent, Important, or Delegate bins before they scroll off the conveyor belt.',
        benefit: 'Trains executive triage, multi-priority switching, decision speed under pressure, and resource allocation.'
      },
      {
        id: 'NeuroMaze',
        title: 'Neuro Maze',
        icon: '🏃',
        objective: 'Escape dynamic grid mazes with moving barrier walls and shifting exit locations.',
        benefit: 'Improves real-time replanning, visual obstacle prediction, and quick strategic changes.'
      },
      {
        id: 'MentalFlex',
        title: 'Mental Flex',
        icon: '🤹',
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

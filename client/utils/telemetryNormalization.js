const GAME_TYPE_ALIASES = {
  speedtap: 'SpeedTap',
  speed_tap: 'SpeedTap',
  focusfinder: 'FocusFinder',
  focus_finder: 'FocusFinder',
  logiclink: 'LogicLink',
  logic_link: 'LogicLink',
  priorityqueue: 'PriorityQueue',
  priority_queue: 'PriorityQueue',
  matrixrecall: 'MatrixRecall',
  matrix_recall: 'MatrixRecall',
  stroopshift: 'StroopShift',
  stroop_shift: 'StroopShift',
  mentalflex: 'MentalFlex',
  mental_flex: 'MentalFlex',
  equationbalance: 'EquationBalance',
  equation_balance: 'EquationBalance',
  sequencedecoder: 'SequenceDecoder',
  sequence_decoder: 'SequenceDecoder',
  routeoptimizer: 'RouteOptimizer',
  route_optimizer: 'RouteOptimizer',
  neuromaze: 'NeuroMaze',
  neuro_maze: 'NeuroMaze',
  neuralnback: 'NeuralNBack',
  neural_n_back: 'NeuralNBack',
  synapsespin: 'SynapseSpin',
  synapse_spin: 'SynapseSpin',
  nexusmapper: 'NexusMapper',
  nexus_mapper: 'NexusMapper',
  ruleshifter: 'RuleShifter',
  rule_shifter: 'RuleShifter'
};

const DOMAIN_BY_GAME = {
  SpeedTap: 'reflexes_and_focus',
  FocusFinder: 'reflexes_and_focus',
  StroopShift: 'reflexes_and_focus',
  MemoryMatch: 'spatial_visual_memory',
  MatrixRecall: 'spatial_visual_memory',
  NeuralNBack: 'spatial_visual_memory',
  SynapseSpin: 'spatial_visual_memory',
  NexusMapper: 'spatial_visual_memory',
  LogicLink: 'logical_mathematical',
  EquationBalance: 'logical_mathematical',
  SequenceDecoder: 'logical_mathematical',
  RouteOptimizer: 'logical_mathematical',
  PriorityQueue: 'executive_strategy',
  NeuroMaze: 'executive_strategy',
  MentalFlex: 'executive_strategy',
  RuleShifter: 'executive_strategy'
};

export function normalizeGameType(gameType) {
  if (gameType === null || gameType === undefined) return 'SpeedTap';

  const value = String(gameType).trim();
  if (!value) return 'SpeedTap';

  const aliasKey = value.toLowerCase().replace(/[-\s]+/g, '_');
  return GAME_TYPE_ALIASES[aliasKey] || value;
}

export function resolveCognitiveDomain(gameType) {
  return DOMAIN_BY_GAME[normalizeGameType(gameType)] || 'reflexes_and_focus';
}

export function normalizeTelemetryMetric(metric) {
  if (!metric || typeof metric !== 'object') return metric;

  const normalizedGameType = normalizeGameType(metric.game_type);
  const normalized = {
    ...metric,
    game_type: normalizedGameType,
    cognitive_domain: metric.cognitive_domain || resolveCognitiveDomain(normalizedGameType),
    error_count: Number.isFinite(Number(metric.error_count)) ? Number(metric.error_count) : 0,
    hesitation_ms: Number.isFinite(Number(metric.hesitation_ms)) ? Number(metric.hesitation_ms) : 0,
    spam_click_count: Number.isFinite(Number(metric.spam_click_count)) ? Number(metric.spam_click_count) : 0,
    rule_shift_latency_ms: metric.rule_shift_latency_ms === undefined || metric.rule_shift_latency_ms === null
      ? null
      : Number(metric.rule_shift_latency_ms),
    path_efficiency: metric.path_efficiency === undefined || metric.path_efficiency === null
      ? null
      : Number(metric.path_efficiency)
  };

  return normalized;
}

export function normalizeTelemetryBatch(payload) {
  if (!payload) return payload;

  if (Array.isArray(payload.telemetry)) {
    return {
      ...payload,
      telemetry: payload.telemetry.map(normalizeTelemetryMetric)
    };
  }

  if (Array.isArray(payload.metrics)) {
    return {
      ...payload,
      metrics: payload.metrics.map(normalizeTelemetryMetric)
    };
  }

  return normalizeTelemetryMetric(payload);
}
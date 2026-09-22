import math

def safe_float(val, default=0.0):
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


GAME_TO_DOMAIN = {
    "MemoryMatch": "spatial_visual_memory",
    "memory_match": "spatial_visual_memory",
    "LogicLink": "logical_mathematical",
    "logic_link": "logical_mathematical",
    "EquationBalance": "logical_mathematical",
    "equation_balance": "logical_mathematical",
    "SequenceDecoder": "logical_mathematical",
    "sequence_decoder": "logical_mathematical",
    "RouteOptimizer": "logical_mathematical",
    "route_optimizer": "logical_mathematical",
    "SpeedTap": "reflexes_and_focus",
    "speed_tap": "reflexes_and_focus",
    "FocusFinder": "reflexes_and_focus",
    "focus_finder": "reflexes_and_focus",
    "MazeEscape": "executive_strategy",
    "maze_escape": "executive_strategy",
    "PriorityQueue": "executive_strategy",
    "priority_queue": "executive_strategy",
    "NeuroMaze": "executive_strategy",
    "neuro_maze": "executive_strategy",
    "MatrixRecall": "spatial_visual_memory",
    "matrix_recall": "spatial_visual_memory",
    "StroopShift": "reflexes_and_focus",
    "stroop_shift": "reflexes_and_focus",
    "MentalFlex": "executive_strategy",
    "mental_flex": "executive_strategy",
    "NeuralNBack": "spatial_visual_memory",
    "neural_n_back": "spatial_visual_memory",
    "SynapseSpin": "spatial_visual_memory",
    "synapse_spin": "spatial_visual_memory",
    "NexusMapper": "spatial_visual_memory",
    "nexus_mapper": "spatial_visual_memory"
}



def calculate_ols_slope(y_vals):
    """
    Computes the slope of the OLS linear regression for sequence y_vals,
    where x_vals is index list [0, 1, ..., len(y_vals)-1].
    """
    n = len(y_vals)
    if n < 2:
        return 0.0
    x_vals = list(range(n))
    sum_x = sum(x_vals)
    sum_y = sum(y_vals)
    sum_xx = sum(x ** 2 for x in x_vals)
    sum_xy = sum(x_vals[i] * y_vals[i] for i in range(n))
    
    denominator = n * sum_xx - sum_x ** 2
    if denominator == 0:
        return 0.0
    slope = (n * sum_xy - sum_x * sum_y) / denominator
    return slope



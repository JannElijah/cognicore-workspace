import math

try:
    from scipy import stats as _scipy_stats
    SCIPY_AVAILABLE = True
except ImportError:
    _scipy_stats = None
    SCIPY_AVAILABLE = False

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
    "RuleShifter": "executive_strategy",
    "rule_shifter": "executive_strategy",
    "NeuralNBack": "spatial_visual_memory",
    "neural_n_back": "spatial_visual_memory",
    "SynapseSpin": "spatial_visual_memory",
    "synapse_spin": "spatial_visual_memory",
    "NexusMapper": "spatial_visual_memory",
    "nexus_mapper": "spatial_visual_memory",
}

_NORMALIZED_GAME_TO_DOMAIN = {
    "".join(ch for ch in k.lower() if ch.isalnum()): v
    for k, v in GAME_TO_DOMAIN.items()
}

DOMAIN_TITLE_MAP = {
    "reflexes_and_focus": "title-reflex-demon",
    "spatial_visual_memory": "title-zen-architect",
    "logical_mathematical": "title-logic-weaver",
    "executive_strategy": "title-strategist",
}

def get_domain_for_game(game_type, default="reflexes_and_focus"):
    """Resolve canonical cognitive domain for a game identifier, handling case/underscore variants."""
    if not game_type:
        return default
    if game_type in GAME_TO_DOMAIN:
        return GAME_TO_DOMAIN[game_type]
    norm = "".join(ch for ch in str(game_type).lower() if ch.isalnum())
    return _NORMALIZED_GAME_TO_DOMAIN.get(norm, default)



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


def calculate_approx_t_p_value(t_stat, df):
    """
    Compute a mathematical approximation of the two-sided p-value for a
    Student's t-distribution with `df` degrees of freedom without external libraries.
    """
    if df < 1:
        return 1.0

    t_abs = abs(t_stat)

    # Exact calculation for df = 1 (Cauchy distribution)
    if df == 1:
        return 1.0 - (2.0 / math.pi) * math.atan(t_abs)
    # Exact calculation for df = 2
    if df == 2:
        return 1.0 - t_abs / math.sqrt(2.0 + t_abs * t_abs)
    # Exact calculation for df = 3
    if df == 3:
        term1 = t_abs / (math.pi * math.sqrt(3.0) * (1.0 + t_abs * t_abs / 3.0))
        term2 = math.atan(t_abs / math.sqrt(3.0)) / math.pi
        return max(0.0, min(1.0, 2.0 * (0.5 - term1 - term2)))
    # Exact calculation for df = 4
    if df == 4:
        term = (t_abs / (2.0 * math.sqrt(4.0 + t_abs * t_abs))) * (1.0 + 2.0 / (4.0 + t_abs * t_abs))
        return max(0.0, min(1.0, 2.0 * (0.5 - term)))

    # Peizer-Pratt adjusted normal approximation for df >= 5
    z = t_abs * (1.0 - 1.0 / (4.0 * df)) / math.sqrt(1.0 + t_abs * t_abs / (2.0 * df))

    # Standard normal CDF approximation (Abramowitz & Stegun formula 26.2.17)
    p = 0.2316419
    b1 = 0.319381530
    b2 = -0.356563782
    b3 = 1.781477937
    b4 = -1.821255978
    b5 = 1.330274429

    t = 1.0 / (1.0 + p * z)
    exponential = math.exp(-0.5 * z * z)
    prob = 1.0 - (1.0 / math.sqrt(2.0 * math.pi)) * exponential * (
        b1 * t + b2 * (t ** 2) + b3 * (t ** 3) + b4 * (t ** 4) + b5 * (t ** 5)
    )

    two_sided_p = 2.0 * (1.0 - prob)
    return max(0.0, min(1.0, two_sided_p))


def compute_paired_ttest_stats(pre_values, post_values):
    """
    Compute paired pre-vs-post descriptive and inferential statistics.

    Returns mean_pre, mean_post, mean_shift (net post - pre delta),
    improvement_pct (relative %), paired t-statistic, two-sided p-value,
    Cohen's d effect size, magnitude label, and significance flag. When fewer
    than 2 paired observations exist, inferential fields are returned as None.
    """
    n = min(len(pre_values), len(post_values))
    if n == 0:
        return {
            "sample_size": 0,
            "mean_pre": 0.0,
            "mean_post": 0.0,
            "mean_shift": 0.0,
            "improvement_pct": 0.0,
            "t_statistic": None,
            "p_value": None,
            "cohens_d": None,
            "effect_size_magnitude": "insufficient_data",
            "statistically_significant": False,
        }

    mean_pre = sum(pre_values[:n]) / n
    mean_post = sum(post_values[:n]) / n
    mean_shift = mean_post - mean_pre
    improvement_pct = ((mean_post - mean_pre) / mean_pre * 100.0) if mean_pre != 0 else 0.0

    if n < 2:
        return {
            "sample_size": n,
            "mean_pre": round(mean_pre, 2),
            "mean_post": round(mean_post, 2),
            "mean_shift": round(mean_shift, 2),
            "improvement_pct": round(improvement_pct, 2),
            "t_statistic": None,
            "p_value": None,
            "cohens_d": None,
            "effect_size_magnitude": "insufficient_data",
            "statistically_significant": False,
        }

    diffs = [post_values[i] - pre_values[i] for i in range(n)]
    mean_diff = sum(diffs) / n
    var_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1)
    sd_diff = var_diff ** 0.5

    if SCIPY_AVAILABLE:
        t_stat, p_val = _scipy_stats.ttest_rel(post_values[:n], pre_values[:n])
        t_stat = float(t_stat)
        p_val = float(p_val)
    else:
        se_diff = sd_diff / (n ** 0.5)
        t_stat = mean_diff / se_diff if se_diff != 0 else 0.0
        p_val = calculate_approx_t_p_value(t_stat, n - 1)

    if math.isnan(t_stat) or math.isinf(t_stat):
        t_stat = 0.0
    if math.isnan(p_val) or math.isinf(p_val):
        p_val = 1.0

    cohens_d = mean_diff / sd_diff if sd_diff > 0 else 0.0
    if math.isnan(cohens_d) or math.isinf(cohens_d):
        cohens_d = 0.0

    abs_d = abs(cohens_d)
    if abs_d < 0.2:
        effect_magnitude = "negligible"
    elif abs_d < 0.5:
        effect_magnitude = "small"
    elif abs_d < 0.8:
        effect_magnitude = "medium"
    else:
        effect_magnitude = "large"

    return {
        "sample_size": n,
        "mean_pre": round(mean_pre, 2),
        "mean_post": round(mean_post, 2),
        "mean_shift": round(mean_shift, 2),
        "improvement_pct": round(improvement_pct, 2),
        "t_statistic": round(t_stat, 4),
        "p_value": round(p_val, 6),
        "cohens_d": round(cohens_d, 4),
        "effect_size_magnitude": effect_magnitude,
        "statistically_significant": bool(p_val < 0.05),
    }


def compute_pearson_correlation(xs, ys):
    """
    Compute Pearson correlation coefficient `r` and two-sided `p_value` for
    paired numeric sequences `(xs, ys)` without database dialect dependencies.
    """
    n = min(len(xs), len(ys))
    if n < 2:
        return 0.0, 1.0

    mean_x = sum(xs[:n]) / n
    mean_y = sum(ys[:n]) / n
    dx = [xs[i] - mean_x for i in range(n)]
    dy = [ys[i] - mean_y for i in range(n)]

    denom = math.sqrt(sum(val * val for val in dx) * sum(val * val for val in dy))
    if denom == 0.0:
        return 0.0, 1.0

    r_coeff = max(-1.0, min(1.0, sum(dx[i] * dy[i] for i in range(n)) / denom))
    if abs(r_coeff) >= 1.0:
        return float(r_coeff), 0.0

    p_value = 1.0
    if n > 2:
        t_stat = r_coeff * math.sqrt((n - 2) / (1.0 - r_coeff * r_coeff))
        p_value = calculate_approx_t_p_value(t_stat, n - 2)

    return float(r_coeff), float(p_value)



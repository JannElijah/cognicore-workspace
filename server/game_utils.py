from utils import safe_float

GAME_TO_DOMAIN = {'MemoryMatch': 'spatial_visual_memory', 'memory_match': 'spatial_visual_memory', 'LogicLink': 'logical_mathematical', 'logic_link': 'logical_mathematical', 'EquationBalance': 'logical_mathematical', 'equation_balance': 'logical_mathematical', 'SequenceDecoder': 'logical_mathematical', 'sequence_decoder': 'logical_mathematical', 'RouteOptimizer': 'logical_mathematical', 'route_optimizer': 'logical_mathematical', 'SpeedTap': 'reflexes_and_focus', 'speed_tap': 'reflexes_and_focus', 'FocusFinder': 'reflexes_and_focus', 'focus_finder': 'reflexes_and_focus', 'MazeEscape': 'executive_strategy', 'maze_escape': 'executive_strategy', 'PriorityQueue': 'executive_strategy', 'priority_queue': 'executive_strategy', 'NeuroMaze': 'executive_strategy', 'neuro_maze': 'executive_strategy', 'MatrixRecall': 'spatial_visual_memory', 'matrix_recall': 'spatial_visual_memory', 'StroopShift': 'reflexes_and_focus', 'stroop_shift': 'reflexes_and_focus', 'MentalFlex': 'executive_strategy', 'mental_flex': 'executive_strategy', 'NeuralNBack': 'spatial_visual_memory', 'neural_n_back': 'spatial_visual_memory', 'SynapseSpin': 'spatial_visual_memory', 'synapse_spin': 'spatial_visual_memory', 'NexusMapper': 'spatial_visual_memory', 'nexus_mapper': 'spatial_visual_memory'}

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


def generate_pros_cons(scores_map):
    # Map technical jargon to plain English
    human_map = {
        "spatial_visual_memory": "Visual Memory & Spatial Awareness",
        "logical_mathematical": "Logic & Problem Solving",
        "reflexes_and_focus": "Quick Thinking & Attention",
        "executive_strategy": "Planning & Adaptability"
    }
    
    sorted_domains = sorted(scores_map.items(), key=lambda x: x[1], reverse=True)
    top_domain = sorted_domains[0]
    weakest_domain = sorted_domains[-1]
    
    top_name = human_map[top_domain[0]]
    weakest_name = human_map[weakest_domain[0]]
    
    pros = []
    if top_domain[0] == "spatial_visual_memory":
        pros.append(f"Your {top_name} is excellent! You excel at remembering visual details and navigating complex spaces.")
    elif top_domain[0] == "logical_mathematical":
        pros.append(f"Your {top_name} is outstanding! You have a strong ability to recognize patterns and solve problems logically.")
    elif top_domain[0] == "reflexes_and_focus":
        pros.append(f"Your {top_name} is sharp! You react quickly and maintain focus even when distractions are present.")
    else:
        pros.append(f"Your {top_name} is great! You are highly adaptable and excel at shifting strategies on the fly.")
        
    weaknesses = []
    if weakest_domain[0] == "spatial_visual_memory":
        weaknesses.append(f"You might occasionally struggle with {weakest_name}. Remembering exact locations or visual sequences can be challenging.")
    elif weakest_domain[0] == "logical_mathematical":
        weaknesses.append(f"Your {weakest_name} could use a boost. Complex math or multi-step logic puzzles might take you longer to process.")
    elif weakest_domain[0] == "reflexes_and_focus":
        weaknesses.append(f"Your {weakest_name} is your weak point. You might find your attention drifting or reactions slowing when overwhelmed.")
    else:
        weaknesses.append(f"Your {weakest_name} needs training. Adapting to sudden rule changes or juggling multiple tasks can feel stressful.")
        
    return {
        "top_skill": top_name,
        "weakest_skill": weakest_name,
        "pros": pros,
        "weaknesses": weaknesses,
        "summary_message": f"Overall, you show great potential in {top_name}, but your {weakest_name} needs targeted training. We recommend playing the prescribed games daily."
    }


def calculate_dda_parameters(difficulty_level, game_type='SpeedTap', user_avg_rt=None):
    # Bound difficulty level between 1 and 5
    level = max(1, min(5, int(difficulty_level)))
    
    if game_type == 'MemoryMatch':
        # Map levels to game-specific variables for the Memory Match game
        configs = {
            1: {
                "difficulty_level": 1,
                "grid_size": 3,
                "sequence_length": 3,
                "flash_duration": 1000  # ms tile is highlighted
            },
            2: {
                "difficulty_level": 2,
                "grid_size": 3,
                "sequence_length": 4,
                "flash_duration": 800
            },
            3: {
                "difficulty_level": 3,
                "grid_size": 4,
                "sequence_length": 4,
                "flash_duration": 700
            },
            4: {
                "difficulty_level": 4,
                "grid_size": 4,
                "sequence_length": 5,
                "flash_duration": 600
            },
            5: {
                "difficulty_level": 5,
                "grid_size": 5,
                "sequence_length": 6,
                "flash_duration": 500
            }
        }
    elif game_type == 'FocusFinder':
        # Map levels to game-specific variables for the Focus Finder game (Attention)
        configs = {
            1: {
                "difficulty_level": 1,
                "distractors": 5,
                "speed": 0,
                "similarity": "low"
            },
            2: {
                "difficulty_level": 2,
                "distractors": 10,
                "speed": 0,
                "similarity": "low"
            },
            3: {
                "difficulty_level": 3,
                "distractors": 15,
                "speed": 40,
                "similarity": "medium"
            },
            4: {
                "difficulty_level": 4,
                "distractors": 20,
                "speed": 60,
                "similarity": "medium"
            },
            5: {
                "difficulty_level": 5,
                "distractors": 25,
                "speed": 90,
                "similarity": "high"
            }
        }
    elif game_type == 'LogicLink':
        # Map levels to game-specific variables for the Logic Link game (Problem Solving)
        configs = {
            1: {
                "difficulty_level": 1,
                "grid_size": 3,
                "sequence_length": 3,
                "distractors": 0
            },
            2: {
                "difficulty_level": 2,
                "grid_size": 3,
                "sequence_length": 4,
                "distractors": 1
            },
            3: {
                "difficulty_level": 3,
                "grid_size": 4,
                "sequence_length": 4,
                "distractors": 2
            },
            4: {
                "difficulty_level": 4,
                "grid_size": 4,
                "sequence_length": 5,
                "distractors": 3
            },
            5: {
                "difficulty_level": 5,
                "grid_size": 5,
                "sequence_length": 6,
                "distractors": 4
            }
        }
    elif game_type == 'MazeEscape':
        # Map levels to game-specific variables for the Maze Escape game (Problem Solving)
        configs = {
            1: {
                "difficulty_level": 1,
                "grid_size": 6,
                "max_moves": 20,
                "blocked_ratio": 0.1
            },
            2: {
                "difficulty_level": 2,
                "grid_size": 7,
                "max_moves": 25,
                "blocked_ratio": 0.15
            },
            3: {
                "difficulty_level": 3,
                "grid_size": 8,
                "max_moves": 30,
                "blocked_ratio": 0.2
            },
            4: {
                "difficulty_level": 4,
                "grid_size": 9,
                "max_moves": 35,
                "blocked_ratio": 0.22
            },
            5: {
                "difficulty_level": 5,
                "grid_size": 10,
                "max_moves": 40,
                "blocked_ratio": 0.25
            }
        }
    elif game_type in ['PriorityQueue', 'priority_queue']:
        # Priority Queue: conveyor belt triage. Higher difficulty = faster belt,
        # more concurrent cards, shorter spawn intervals, less label context.
        configs = {
            1: {
                "difficulty_level": 1,
                "belt_speed": 30,        # px/sec (slow)
                "spawn_interval": 5000,  # ms between new cards
                "max_cards": 2,
                "ambiguity_level": 0,    # full labels shown
                "time_limit": 75000
            },
            2: {
                "difficulty_level": 2,
                "belt_speed": 38,
                "spawn_interval": 4200,
                "max_cards": 3,
                "ambiguity_level": 0,
                "time_limit": 75000
            },
            3: {
                "difficulty_level": 3,
                "belt_speed": 48,
                "spawn_interval": 3500,
                "max_cards": 3,
                "ambiguity_level": 1,    # category label hidden
                "time_limit": 70000
            },
            4: {
                "difficulty_level": 4,
                "belt_speed": 60,
                "spawn_interval": 2800,
                "max_cards": 4,
                "ambiguity_level": 1,
                "time_limit": 65000
            },
            5: {
                "difficulty_level": 5,
                "belt_speed": 75,
                "spawn_interval": 2200,
                "max_cards": 4,
                "ambiguity_level": 2,    # both dots and category hidden
                "time_limit": 60000
            }
        }
    elif game_type in ['NeuroMaze', 'neuro_maze']:
        # Map levels to game-specific variables for the Neuro Maze game (Problem Solving)
        configs = {
            1: {
                "difficulty_level": 1,
                "grid_size": 6,
                "max_moves": 20,
                "blocked_ratio": 0.1,
                "speed_multiplier": 1.0
            },
            2: {
                "difficulty_level": 2,
                "grid_size": 7,
                "max_moves": 25,
                "blocked_ratio": 0.13,
                "speed_multiplier": 1.2
            },
            3: {
                "difficulty_level": 3,
                "grid_size": 8,
                "max_moves": 30,
                "blocked_ratio": 0.17,
                "speed_multiplier": 1.4
            },
            4: {
                "difficulty_level": 4,
                "grid_size": 9,
                "max_moves": 35,
                "blocked_ratio": 0.21,
                "speed_multiplier": 1.6
            },
            5: {
                "difficulty_level": 5,
                "grid_size": 10,
                "max_moves": 40,
                "blocked_ratio": 0.25,
                "speed_multiplier": 1.8
            }
        }
    elif game_type in ['NeuralNBack', 'neural_n_back']:
        # Map levels to game-specific variables for the Neural N-Back game (Working Memory)
        configs = {
            1: {"difficulty_level": 1, "n_value": 1, "step_delay": 2500},
            2: {"difficulty_level": 2, "n_value": 1, "step_delay": 2000},
            3: {"difficulty_level": 3, "n_value": 2, "step_delay": 2000},
            4: {"difficulty_level": 4, "n_value": 2, "step_delay": 1600},
            5: {"difficulty_level": 5, "n_value": 3, "step_delay": 1500}
        }
    elif game_type in ['SynapseSpin', 'synapse_spin']:
        # Map levels to game-specific variables for the Synapse Spin game (Mental Rotation)
        configs = {
            1: {"difficulty_level": 1, "vertices": 4, "rotation_step": 90},
            2: {"difficulty_level": 2, "vertices": 5, "rotation_step": 45},
            3: {"difficulty_level": 3, "vertices": 6, "rotation_step": 30},
            4: {"difficulty_level": 4, "vertices": 7, "rotation_step": 15},
            5: {"difficulty_level": 5, "vertices": 8, "rotation_step": 0}
        }
    elif game_type in ['NexusMapper', 'nexus_mapper']:
        # Map levels to game-specific variables for the Nexus Mapper game (Object-Location Memory)
        configs = {
            1: {"difficulty_level": 1, "grid_size": 3, "target_count": 2, "flash_duration": 2000},
            2: {"difficulty_level": 2, "grid_size": 3, "target_count": 3, "flash_duration": 1800},
            3: {"difficulty_level": 3, "grid_size": 4, "target_count": 3, "flash_duration": 1500},
            4: {"difficulty_level": 4, "grid_size": 4, "target_count": 4, "flash_duration": 1200},
            5: {"difficulty_level": 5, "grid_size": 5, "target_count": 5, "flash_duration": 1000}
        }
    elif game_type in ['MatrixRecall', 'matrix_recall']:
        # Map levels to game-specific variables for the Matrix Recall game (Spatial-Visual Memory)
        configs = {
            1: {
                "difficulty_level": 1,
                "grid_cols": 3,
                "grid_rows": 3,
                "target_count": 3,
                "flash_duration": 1200
            },
            2: {
                "difficulty_level": 2,
                "grid_cols": 3,
                "grid_rows": 4,
                "target_count": 4,
                "flash_duration": 1000
            },
            3: {
                "difficulty_level": 3,
                "grid_cols": 4,
                "grid_rows": 4,
                "target_count": 5,
                "flash_duration": 800
            },
            4: {
                "difficulty_level": 4,
                "grid_cols": 5,
                "grid_rows": 5,
                "target_count": 6,
                "flash_duration": 700
            },
            5: {
                "difficulty_level": 5,
                "grid_cols": 6,
                "grid_rows": 6,
                "target_count": 7,
                "flash_duration": 600
            }
        }
    elif game_type in ['StroopShift', 'stroop_shift']:
        # Map levels to game-specific variables for the Stroop Shift game (Attention/Reflex)
        configs = {
            1: {
                "difficulty_level": 1,
                "spawn_delay": 2500,
                "conflict_probability": 0.0,
                "static_text_rotation": False,
                "dynamic_text_spin": False,
                "distractor_flashes": False
            },
            2: {
                "difficulty_level": 2,
                "spawn_delay": 2000,
                "conflict_probability": 0.5,
                "static_text_rotation": False,
                "dynamic_text_spin": False,
                "distractor_flashes": False
            },
            3: {
                "difficulty_level": 3,
                "spawn_delay": 1500,
                "conflict_probability": 0.8,
                "static_text_rotation": False,
                "dynamic_text_spin": False,
                "distractor_flashes": False
            },
            4: {
                "difficulty_level": 4,
                "spawn_delay": 1100,
                "conflict_probability": 1.0,
                "static_text_rotation": True,
                "dynamic_text_spin": False,
                "distractor_flashes": False
            },
            5: {
                "difficulty_level": 5,
                "spawn_delay": 800,
                "conflict_probability": 1.0,
                "static_text_rotation": True,
                "dynamic_text_spin": True,
                "distractor_flashes": True
            }
        }
    elif game_type in ['MentalFlex', 'mental_flex']:
        # Map levels to game-specific variables for the Mental Flex game
        configs = {
            1: {
                "difficulty_level": 1,
                "rule_shift_frequency": 5,      # Shift rule every 5 correct matches
                "choices_count": 2,             # 2 cards to choose from
                "time_limit": 6000,             # ms to make a decision
                "rules_pool": ["color", "shape"] # Only two potential rules
            },
            2: {
                "difficulty_level": 2,
                "rule_shift_frequency": 4,
                "choices_count": 3,
                "time_limit": 5000,
                "rules_pool": ["color", "shape"]
            },
            3: {
                "difficulty_level": 3,
                "rule_shift_frequency": 3,
                "choices_count": 3,
                "time_limit": 4200,
                "rules_pool": ["color", "shape", "count"] # Introduces count rule
            },
            4: {
                "difficulty_level": 4,
                "rule_shift_frequency": 3,
                "choices_count": 4,
                "time_limit": 3500,
                "rules_pool": ["color", "shape", "count"]
            },
            5: {
                "difficulty_level": 5,
                "rule_shift_frequency": 2,      # Shifting rules very frequently
                "choices_count": 4,
                "time_limit": 3000,             # Extremely fast reaction required
                "rules_pool": ["color", "shape", "count"]
            }
        }
        
        # Apply dynamic AI scaling for time_limit based on user performance
        if user_avg_rt is not None and user_avg_rt > 0:
            for lvl in configs:
                # Base formula: 120% of User's average RT + (6 - difficulty) * 1500ms grace period
                dynamic_limit = (user_avg_rt * 1.2) + ((6 - lvl) * 1500)
                min_floor = 2000 if lvl == 5 else 2500
                configs[lvl]["time_limit"] = int(max(min_floor, min(10000, dynamic_limit)))
    elif game_type in ['EquationBalance', 'equation_balance']:
        # Map levels to game-specific variables for the Equation Balance game
        configs = {
            1: {
                "difficulty_level": 1,
                "num_range": 10,
                "operators": ["+", "-"],
                "missing_type": "operator",
                "time_limit": 10000
            },
            2: {
                "difficulty_level": 2,
                "num_range": 20,
                "operators": ["+", "-", "*"],
                "missing_type": "operand",
                "time_limit": 8000
            },
            3: {
                "difficulty_level": 3,
                "num_range": 30,
                "operators": ["+", "-", "*"],
                "missing_type": "random",
                "time_limit": 6000
            },
            4: {
                "difficulty_level": 4,
                "num_range": 50,
                "operators": ["+", "-", "*", "/"],
                "missing_type": "complex",
                "time_limit": 5000
            },
            5: {
                "difficulty_level": 5,
                "num_range": 100,
                "operators": ["+", "-", "*", "/"],
                "missing_type": "complex_random",
                "time_limit": 4000
            }
        }
    elif game_type in ['SequenceDecoder', 'sequence_decoder']:
        # Map levels to game-specific variables for the Sequence Decoder game (Inductive Pattern Reasoning)
        configs = {
            1: {
                "difficulty_level": 1,
                "sequence_length": 4,             # tiles shown including the %s tile
                "pattern_types": ["arithmetic"],  # only simple +d patterns
                "missing_position": "last",        # always the last tile is hidden
                "time_limit": 12000               # 12 seconds per round
            },
            2: {
                "difficulty_level": 2,
                "sequence_length": 5,
                "pattern_types": ["arithmetic", "geometric"],
                "missing_position": "last",
                "time_limit": 10000
            },
            3: {
                "difficulty_level": 3,
                "sequence_length": 5,
                "pattern_types": ["arithmetic", "geometric", "alternating"],
                "missing_position": "last",
                "time_limit": 9000
            },
            4: {
                "difficulty_level": 4,
                "sequence_length": 6,
                "pattern_types": ["arithmetic", "geometric", "alternating", "fibonacci"],
                "missing_position": "second_last",  # harder: missing element is not the last
                "time_limit": 8000
            },
            5: {
                "difficulty_level": 5,
                "sequence_length": 6,
                "pattern_types": ["arithmetic", "geometric", "alternating", "fibonacci", "dual_rule"],
                "missing_position": "second_last",
                "time_limit": 6000              # 6 seconds - expert speed
            }
        }
    elif game_type in ['RouteOptimizer', 'route_optimizer']:
        # Map levels to game-specific variables for the Route Optimizer (Combinatorial Network Logic)
        configs = {
            1: {
                "difficulty_level": 1,
                "node_count": 4,          # 4 nodes: simple fork topology
                "min_weight": 1,
                "max_weight": 9,
                "time_limit": 30000       # 30 seconds per round
            },
            2: {
                "difficulty_level": 2,
                "node_count": 5,
                "min_weight": 1,
                "max_weight": 12,
                "time_limit": 27000
            },
            3: {
                "difficulty_level": 3,
                "node_count": 6,          # grid topology, 3 paths
                "min_weight": 1,
                "max_weight": 15,
                "time_limit": 24000
            },
            4: {
                "difficulty_level": 4,
                "node_count": 7,          # diamond with bypass shortcuts
                "min_weight": 2,
                "max_weight": 20,
                "time_limit": 22000
            },
            5: {
                "difficulty_level": 5,
                "node_count": 8,          # complex 8-node web
                "min_weight": 2,
                "max_weight": 25,
                "time_limit": 18000       # 18 seconds - expert speed
            }
        }
    else:
        # Map levels to game-specific variables for the Speed Tap game
        configs = {
            1: {
                "difficulty_level": 1, 
                "spawn_delay": 1500,     # milliseconds between target spawns
                "target_lifespan": 2000, # milliseconds a target stays on screen
                "target_scale": 1.2,     # size modifier
                "distractor_ratio": 0.0, # probability of distractor spawns (0%)
                "object_count": 1        # maximum concurrent active targets
            },
            2: {
                "difficulty_level": 2, 
                "spawn_delay": 1200, 
                "target_lifespan": 1800, 
                "target_scale": 1.0, 
                "distractor_ratio": 0.1, 
                "object_count": 1
            },
            3: {
                "difficulty_level": 3, 
                "spawn_delay": 1000, 
                "target_lifespan": 1500, 
                "target_scale": 0.8, 
                "distractor_ratio": 0.2, 
                "object_count": 2
            },
            4: {
                "difficulty_level": 4, 
                "spawn_delay": 800, 
                "target_lifespan": 1200, 
                "target_scale": 0.7, 
                "distractor_ratio": 0.3, 
                "object_count": 2
            },
            5: {
                "difficulty_level": 5, 
                "spawn_delay": 600, 
                "target_lifespan": 900, 
                "target_scale": 0.5, 
                "distractor_ratio": 0.4, 
                "object_count": 3
            }
        }
    return configs[level]


from model import archetype_classifier

import collections

class LRUCache(collections.OrderedDict):
    def __init__(self, maxsize=1000, *args, **kwds):
        self.maxsize = maxsize
        super().__init__(*args, **kwds)

    def __getitem__(self, key):
        value = super().__getitem__(key)
        self.move_to_end(key)
        return value

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        if len(self) > self.maxsize:
            oldest = next(iter(self))
            del self[oldest]

ml_history_cache = LRUCache(maxsize=1000)

def calculate_pearson_r(x, y):
    n = len(x)
    if n <= 1:
        return 0.0, 1.0
    
    sum_x = sum(x)
    sum_y = sum(y)
    sum_x2 = sum(xi * xi for xi in x)
    sum_y2 = sum(yi * yi for yi in y)
    sum_xy = sum(xi * yi for xi, yi in zip(x, y))
    
    numerator = n * sum_xy - sum_x * sum_y
    denominator = ((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)) ** 0.5
    
    if denominator == 0:
        return 0.0, 1.0
        
    r = numerator / denominator
    
    # Try scipy if available (it was imported in app.py originally)
    try:
        from scipy import stats
        r_exact, p_val = stats.pearsonr(x, y)
        return float(r_exact), float(p_val)
    except ImportError:
        pass
            
    try:
        df = n - 2
        if df > 0 and abs(r) < 1.0:
            t = r * ((df / (1 - r * r)) ** 0.5)
            z = abs(t)
            t_approx = 1 / (1 + 0.2316419 * z)
            d = 0.3989423 * (2.7182818 ** (-z * z / 2))
            prob = d * t_approx * (0.3193815 + t_approx * (-0.3565638 + t_approx * (1.7814779 + t_approx * (-1.821256 + t_approx * 1.330274))))
            p_val = 2.0 * prob
            p_val = max(0.0, min(1.0, p_val))
    except Exception:
        p_val = 0.05 if abs(r) > 0.3 else 0.5
        
    return float(r), float(p_val)



def safe_int(val, default=None):
    try:
        return int(val) if val is not None else default
    except (ValueError, TypeError):
        return default

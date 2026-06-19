"""
================================================================================
Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
- Pattern: Model-View-Controller (MVC) / Layered Architecture
- Component: Controller (API / Routing Layer) and SQLite Model interaction
- Data Integrity: Directly interacts with game_sessions, users, performance_metrics,
  and cognitive_profiles tables using parameterized SQL queries to prevent SQL injection.
- Dynamic Difficulty Adjustment (DDA): Provides /api/dda and /api/start-session hooks 
  to adjust game variables (spawn_delay, target_lifespan, target_scale, etc.) based on
  player performance telemetry, implementing a closed-loop feedback design pattern.
- Error Handling: Implements strict try-except blocks, returns appropriate HTTP status codes,
  and logs internal issues for debugging.
================================================================================
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

# Import Machine Learning Classifier Strategy
from model import archetype_classifier

# Try importing scipy.stats for Paired t-test
try:
    from scipy import stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

app = Flask(__name__)
# CORS allows your React/Phaser frontend to communicate with this backend
CORS(app) 

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cognicore.db')

def safe_float(val, default=None):
    try:
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default

def safe_int(val, default=None):
    try:
        return int(val) if val is not None else default
    except (ValueError, TypeError):
        return default

def calculate_approx_t_p_value(t_stat, df):
    """
    Computes a highly accurate mathematical approximation of the two-sided p-value
    for a Student's t-distribution with given degrees of freedom, without external libraries.
    """
    import math
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
    # Highly accurate transformation from t-statistic to standard normal z-score
    z = t_abs * (1.0 - 1.0 / (4.0 * df)) / math.sqrt(1.0 + t_abs * t_abs / (2.0 * df))
    
    # Standard normal CDF approximation (Abramowitz & Stegun formula 26.2.17, error < 7.5e-8)
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
    
    # Return two-sided p-value
    two_sided_p = 2.0 * (1.0 - prob)
    return max(0.0, min(1.0, two_sided_p))


# 4-Tier Cognitive Domain Categorization Framework Configuration Mapping
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

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

# Programmatic Schema Migration / Initialization
def init_db():
    # Set WAL mode once on the database file at startup
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.close()

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Ensure core tables exist before running migrations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            game_type TEXT NOT NULL,
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS performance_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            reaction_time REAL,
            accuracy_rate REAL,
            difficulty_level INTEGER,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES game_sessions(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cognitive_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            archetype_name TEXT,
            confidence_score REAL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    
    cursor.execute("PRAGMA table_info(performance_metrics)")
    columns = [row['name'] for row in cursor.fetchall()]
    
    # Programmatic column migrations:
    # 1. Rename reaction_time_ms to reaction_time if it exists and reaction_time does not
    if "reaction_time_ms" in columns and "reaction_time" not in columns:
        cursor.execute("ALTER TABLE performance_metrics RENAME COLUMN reaction_time_ms TO reaction_time")
        print("[DB Migration] Renamed reaction_time_ms to reaction_time")
    # 2. Rename timestamp to recorded_at if it exists and recorded_at does not
    if "timestamp" in columns and "recorded_at" not in columns:
        cursor.execute("ALTER TABLE performance_metrics RENAME COLUMN timestamp TO recorded_at")
        print("[DB Migration] Renamed timestamp to recorded_at")
        
    # Re-fetch table info after potential renaming
    cursor.execute("PRAGMA table_info(performance_metrics)")
    columns = [row['name'] for row in cursor.fetchall()]

    if "cognitive_domain" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN cognitive_domain TEXT")
    if "game_type" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN game_type TEXT")
    if "error_count" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN error_count INTEGER")
    if "hesitation_ms" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN hesitation_ms REAL")
    if "spam_click_count" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN spam_click_count INTEGER")
    if "rule_shift_latency_ms" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN rule_shift_latency_ms REAL")
    if "path_efficiency" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN path_efficiency REAL")
    
    # Create iso_evaluations table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS iso_evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            functionality_score INTEGER NOT NULL,
            usability_score INTEGER NOT NULL,
            reliability_score INTEGER NOT NULL,
            efficiency_score INTEGER NOT NULL,
            ux_score INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create cognitive_assessments table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cognitive_assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            assessment_type TEXT CHECK(assessment_type IN ('pre-test', 'post-test')),
            spatial_visual_score REAL NOT NULL,
            logical_math_score REAL NOT NULL,
            attention_score REAL NOT NULL,
            executive_score REAL NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create archetype_history table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS archetype_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id INTEGER,
            archetype_name TEXT NOT NULL,
            confidence_score REAL NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (session_id) REFERENCES game_sessions(id)
        )
    """)

    # Create training_goals table if it doesn't exist (Option C)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS training_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            domain TEXT NOT NULL,
            metric_type TEXT NOT NULL,
            target_value REAL NOT NULL,
            is_completed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Programmatic column migrations:
    # Add current_smooth_difficulty to game_sessions if it doesn't exist
    try:
        cursor.execute("ALTER TABLE game_sessions ADD COLUMN current_smooth_difficulty REAL DEFAULT 1.0")
        print("[DB Migration] Added current_smooth_difficulty column to game_sessions")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE game_sessions ADD COLUMN game_mode TEXT DEFAULT 'timed'")
        print("[DB Migration] Added game_mode column to game_sessions")
    except sqlite3.OperationalError:
        pass
    
    # Create indexes for query optimizations
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_performance_metrics_session ON performance_metrics (session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions (user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cognitive_assessments_user ON cognitive_assessments (user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_performance_metrics_domain ON performance_metrics (cognitive_domain)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded ON performance_metrics (recorded_at)")
    
    conn.commit()
    conn.close()

# Run database schema migration on startup
init_db()

# Helper function to map difficulty levels to gameplay parameters
def calculate_dda_parameters(difficulty_level, game_type='SpeedTap'):
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
                "time_limit": 4000,             # ms to make a decision
                "rules_pool": ["color", "shape"] # Only two potential rules
            },
            2: {
                "difficulty_level": 2,
                "rule_shift_frequency": 4,
                "choices_count": 3,
                "time_limit": 3200,
                "rules_pool": ["color", "shape"]
            },
            3: {
                "difficulty_level": 3,
                "rule_shift_frequency": 3,
                "choices_count": 3,
                "time_limit": 2500,
                "rules_pool": ["color", "shape", "count"] # Introduces count rule
            },
            4: {
                "difficulty_level": 4,
                "rule_shift_frequency": 3,
                "choices_count": 4,
                "time_limit": 2000,
                "rules_pool": ["color", "shape", "count"]
            },
            5: {
                "difficulty_level": 5,
                "rule_shift_frequency": 2,      # Shifting rules very frequently
                "choices_count": 4,
                "time_limit": 1500,             # Extremely fast reaction required
                "rules_pool": ["color", "shape", "count"]
            }
        }
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
                "sequence_length": 4,             # tiles shown including the ? tile
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

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "message": "CogniCore Telemetry & DDA API is running successfully.",
        "endpoints": {
            "/api/start-session": "POST - Initialize session & fetch initial difficulty parameters",
            "/api/submit-assessment": "POST - Submit pre/post test questionnaire answers",
            "/api/submit-metrics": "POST - Record player performance metrics",
            "/api/dda": "POST - Query active feedback loop DDA updates & cognitive profile classifications"
        }
    }), 200

@app.route('/api/submit-assessment', methods=['POST'])
def submit_assessment():
    """
    Submits user pre-test or post-test assessment scores.
    Determines cognitive domain strengths/weaknesses and prescribes the target game module.
    """
    try:
        data = request.get_json() or {}
        username = str(data.get('username', 'default_player')).strip()
        if not username:
            username = 'default_player'
        assessment_type = str(data.get('assessment_type', 'pre-test')).strip().lower()
        if assessment_type not in ('pre-test', 'post-test'):
            return jsonify({"status": "error", "message": "assessment_type must be either 'pre-test' or 'post-test'."}), 400
            
        answers = data.get('answers') or {}
        
        # Defensive score computation
        spatial_visual_score = safe_float(answers.get('spatial_visual_score'))
        logical_math_score = safe_float(answers.get('logical_math_score'))
        attention_score = safe_float(answers.get('attention_score'))
        executive_score = safe_float(answers.get('executive_score'))
        
        # Check q1-q12 mapping fallback if scores not directly specified
        if spatial_visual_score is None:
            sv_vals = [safe_float(answers.get(q)) for q in ('q1', 'q5', 'q9') if answers.get(q) is not None]
            lm_vals = [safe_float(answers.get(q)) for q in ('q2', 'q6', 'q10') if answers.get(q) is not None]
            at_vals = [safe_float(answers.get(q)) for q in ('q3', 'q7', 'q11') if answers.get(q) is not None]
            ex_vals = [safe_float(answers.get(q)) for q in ('q4', 'q8', 'q12') if answers.get(q) is not None]
            
            def calc_score(vals):
                if not vals:
                    return 50.0 # middle fallback score
                avg = sum(vals) / len(vals)
                if max(vals) <= 1.0:
                    # Binary correctness: map directly to percentage
                    return avg * 100.0
                elif max(vals) <= 5.0:
                    # Likert 1-5 scale: map to 0-100 range
                    return ((avg - 1.0) / 4.0) * 100.0
                return avg

            spatial_visual_score = calc_score(sv_vals)
            logical_math_score = calc_score(lm_vals)
            attention_score = calc_score(at_vals)
            executive_score = calc_score(ex_vals)
            
        if any(x is None for x in (spatial_visual_score, logical_math_score, attention_score, executive_score)):
            return jsonify({"status": "error", "message": "Failed to compute or parse scores for all 4 cognitive domains."}), 400

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                # Get or create user
                cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
                user = cursor.fetchone()
                if user:
                    user_id = user['id']
                else:
                    cursor.execute("INSERT INTO users (username) VALUES (?)", (username,))
                    user_id = cursor.lastrowid
                
                # Insert into cognitive_assessments
                cursor.execute(
                    """
                    INSERT INTO cognitive_assessments 
                    (user_id, assessment_type, spatial_visual_score, logical_math_score, attention_score, executive_score)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, assessment_type, spatial_visual_score, logical_math_score, attention_score, executive_score)
                )
        finally:
            conn.close()

        # Map weakest domain to its core prescribed Phaser game module
        scores_map = {
            "spatial_visual_memory": spatial_visual_score,
            "logical_mathematical": logical_math_score,
            "reflexes_and_focus": attention_score,
            "executive_strategy": executive_score
        }
        weakest_domain = min(scores_map, key=scores_map.get)
        
        domain_to_game = {
            "spatial_visual_memory": "MatrixRecall",
            "logical_mathematical": "LogicLink",
            "reflexes_and_focus": "SpeedTap",
            "executive_strategy": "MazeEscape"
        }
        prescribed_game = domain_to_game[weakest_domain]

        return jsonify({
            "status": "success",
            "user_id": user_id,
            "assessment_type": assessment_type,
            "scores": {
                "spatial_visual_memory": round(spatial_visual_score, 2),
                "logical_mathematical": round(logical_math_score, 2),
                "reflexes_and_focus": round(attention_score, 2),
                "executive_strategy": round(executive_score, 2)
            },
            "weakest_domain": weakest_domain,
            "prescribed_game": prescribed_game
        }), 201

    except Exception as e:
        app.logger.error(f"Error in submit_assessment: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

@app.route('/api/assessment-status/<username>', methods=['GET'])
def get_assessment_status(username):
    try:
        username = str(username).strip()
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
                user = cursor.fetchone()
                if not user:
                    return jsonify({
                        "status": "success",
                        "exists": False,
                        "pre_test": None,
                        "post_test": None,
                        "prescribed_game": None
                    }), 200
                
                user_id = user['id']
                
                # Fetch pre-test
                cursor.execute(
                    """
                    SELECT spatial_visual_score, logical_math_score, attention_score, executive_score 
                    FROM cognitive_assessments 
                    WHERE user_id = ? AND assessment_type = 'pre-test'
                    ORDER BY completed_at DESC, id DESC LIMIT 1
                    """,
                    (user_id,)
                )
                pre_row = cursor.fetchone()
                
                # Fetch latest post-test
                cursor.execute(
                    """
                    SELECT spatial_visual_score, logical_math_score, attention_score, executive_score 
                    FROM cognitive_assessments 
                    WHERE user_id = ? AND assessment_type = 'post-test'
                    ORDER BY completed_at DESC, id DESC LIMIT 1
                    """,
                    (user_id,)
                )
                post_row = cursor.fetchone()
                
                pre_data = None
                prescribed_game = None
                weakest_domain = None
                if pre_row:
                    pre_data = {
                        "spatial_visual_memory": pre_row['spatial_visual_score'],
                        "logical_mathematical": pre_row['logical_math_score'],
                        "reflexes_and_focus": pre_row['attention_score'],
                        "executive_strategy": pre_row['executive_score']
                    }
                    # Calculate weakest
                    weakest_domain = min(pre_data, key=pre_data.get)
                    domain_to_game = {
                        "spatial_visual_memory": "MatrixRecall",
                        "logical_mathematical": "LogicLink",
                        "reflexes_and_focus": "SpeedTap",
                        "executive_strategy": "MazeEscape"
                    }
                    prescribed_game = domain_to_game[weakest_domain]
                    
                post_data = None
                if post_row:
                    post_data = {
                        "spatial_visual_memory": post_row['spatial_visual_score'],
                        "logical_mathematical": post_row['logical_math_score'],
                        "reflexes_and_focus": post_row['attention_score'],
                        "executive_strategy": post_row['executive_score']
                    }
                    
                return jsonify({
                    "status": "success",
                    "exists": True,
                    "pre_test": pre_data,
                    "post_test": post_data,
                    "weakest_domain": weakest_domain,
                    "prescribed_game": prescribed_game
                }), 200
        finally:
            conn.close()
    except Exception as e:
        app.logger.error(f"Error in get_assessment_status: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/start-session', methods=['POST'])
def start_session():
    """
    Starts a new game session. If the user doesn't exist, it creates one.
    Returns: session_id, user_id, and initial DDA game parameters.
    """
    try:
        data = request.get_json() or {}
        username = str(data.get('username', 'default_player')).strip()
        if not username:
            username = 'default_player'
        game_type = str(data.get('game_type', 'SpeedTap')).strip()
        game_mode = str(data.get('game_mode', 'timed')).strip().lower()
        
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                
                # Get or create user
                cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
                user = cursor.fetchone()
                if user:
                    user_id = user['id']
                else:
                    cursor.execute("INSERT INTO users (username) VALUES (?)", (username,))
                    user_id = cursor.lastrowid
                    
                # Create game session
                cursor.execute(
                    "INSERT INTO game_sessions (user_id, game_type, game_mode) VALUES (?, ?, ?)",
                    (user_id, game_type, game_mode)
                )
                session_id = cursor.lastrowid
                
                # Get initial DDA parameters based on parent domain history for this user
                domain = GAME_TO_DOMAIN.get(game_type, "reflexes_and_focus")
                domain_games = [g for g, d in GAME_TO_DOMAIN.items() if d == domain]
                placeholders = ",".join("?" for _ in domain_games)
                
                query = f"""
                    SELECT pm.difficulty_level 
                    FROM performance_metrics pm
                    JOIN game_sessions gs ON pm.session_id = gs.id
                    WHERE gs.user_id = ? AND (pm.cognitive_domain = ? OR gs.game_type IN ({placeholders}))
                    ORDER BY pm.recorded_at DESC, pm.id DESC LIMIT 1
                """
                cursor.execute(query, [user_id, domain] + domain_games)
                row = cursor.fetchone()
                if row:
                    initial_difficulty = row['difficulty_level']
                else:
                    initial_difficulty = 1
                    
                # Initialize smooth difficulty state for the session
                cursor.execute(
                    "UPDATE game_sessions SET current_smooth_difficulty = ? WHERE id = ?",
                    (float(initial_difficulty), session_id)
                )
                
                # Fetch existing cognitive profile archetype if available
                cursor.execute(
                    "SELECT archetype_name, confidence_score FROM cognitive_profiles WHERE user_id = ?",
                    (user_id,)
                )
                prof = cursor.fetchone()
                if prof:
                    cognitive_profile = {
                        "archetype": prof["archetype_name"],
                        "confidence_score": prof["confidence_score"]
                    }
                else:
                    cognitive_profile = {
                        "archetype": "Initializing...",
                        "confidence_score": 0.0
                    }
        finally:
            conn.close()
        
        # Get initial DDA parameters
        initial_params = calculate_dda_parameters(initial_difficulty, game_type)
        
        return jsonify({
            "status": "success",
            "session_id": session_id,
            "user_id": user_id,
            "game_mode": game_mode,
            "dda_parameters": initial_params,
            "cognitive_profile": cognitive_profile
        }), 201
        
    except Exception as e:
        app.logger.error(f"Error in start_session: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

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

@app.route('/api/dda', methods=['POST'])
def adjust_difficulty():
    """
    Analyzes recent performance telemetry for a session, updates difficulty parameters, 
    and classifies/updates the user's cognitive profile archetype.
    """
    try:
        data = request.get_json() or {}
        session_id = safe_int(data.get('session_id'))
        if not session_id or session_id <= 0:
            return jsonify({"status": "error", "message": "Valid positive session_id is required."}), 400
            
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                
                # Verify session and get user_id and game_type
                cursor.execute("SELECT user_id, game_type FROM game_sessions WHERE id = ?", (session_id,))
                session = cursor.fetchone()
                if not session:
                    return jsonify({"status": "error", "message": "Invalid session_id"}), 404
                user_id = session['user_id']
                game_type = session['game_type']
                
                domain = GAME_TO_DOMAIN.get(game_type, "reflexes_and_focus")
        
                # Determine sliding window size k based on game type (Option C Volatility Windows)
                if game_type in ("SpeedTap", "StroopShift", "speed_tap", "stroop_shift"):
                    k = 10
                elif game_type in ("MazeEscape", "RouteOptimizer", "maze_escape", "route_optimizer"):
                    k = 3
                else:
                    k = 5
        
                # Fetch the last k performance metrics for this session and specific cognitive domain
                cursor.execute(
                    """
                    SELECT reaction_time, accuracy_rate, difficulty_level 
                    FROM performance_metrics 
                    WHERE session_id = ? AND (cognitive_domain = ? OR game_type = ?)
                    ORDER BY recorded_at DESC, id DESC LIMIT ?
                    """,
                    (session_id, domain, game_type, k)
                )
                metrics = cursor.fetchall()
                
                # Fallback if no matching records found with domain
                if not metrics:
                    cursor.execute(
                        """
                        SELECT reaction_time, accuracy_rate, difficulty_level 
                        FROM performance_metrics 
                        WHERE session_id = ? 
                        ORDER BY recorded_at DESC, id DESC LIMIT ?
                        """,
                        (session_id, k)
                    )
                    metrics = cursor.fetchall()
                
                # Default difficulty configuration
                if not metrics:
                    return jsonify({
                        "status": "success",
                        "dda_parameters": calculate_dda_parameters(1, game_type)
                    }), 200
                    
                # Calculate averages
                avg_rt = sum(m['reaction_time'] for m in metrics) / len(metrics)
                avg_accuracy = sum(m['accuracy_rate'] for m in metrics) / len(metrics)
                current_difficulty = metrics[0]['difficulty_level']
                
                # Retrieve smoothing alpha coefficient (Option C Volatility Damping filter)
                # Default: 1.0 (no smoothing, backwards compatible)
                alpha = safe_float(data.get('smoothing_alpha'), 1.0)
                alpha = max(0.1, min(1.0, alpha))
                
                # Fetch current smooth difficulty from session
                cursor.execute("SELECT current_smooth_difficulty FROM game_sessions WHERE id = ?", (session_id,))
                sess_row = cursor.fetchone()
                if sess_row and sess_row['current_smooth_difficulty'] is not None:
                    current_smooth_difficulty = sess_row['current_smooth_difficulty']
                else:
                    current_smooth_difficulty = float(current_difficulty)
                    
                # Calculate raw target difficulty level based on standard 3-tier rules
                if avg_accuracy > 0.90:
                    raw_diff = min(5.0, float(current_difficulty) + 1.0)
                elif avg_accuracy < 0.70:
                    raw_diff = max(1.0, float(current_difficulty) - 1.0)
                else:
                    raw_diff = float(current_difficulty)
                    
                # Apply EMA filter
                smooth_diff = alpha * raw_diff + (1.0 - alpha) * current_smooth_difficulty
                
                # Clamp and round
                new_difficulty = int(round(smooth_diff))
                new_difficulty = max(1, min(5, new_difficulty))
                
                # Save updated smooth difficulty to database
                cursor.execute(
                    "UPDATE game_sessions SET current_smooth_difficulty = ? WHERE id = ?",
                    (smooth_diff, session_id)
                )
                    
                # Calculate new parameters
                dda_params = calculate_dda_parameters(new_difficulty, game_type)
                
                # Cognitive Profiling Archetype Determination using Random Forest
                # Features: avg_accuracy, avg_rt, acc_slope, rt_slope
                
                # Query preceding and current session averages for this user to compute slopes, limiting to latest 20 sessions
                cursor.execute(
                    """
                    SELECT session_id, avg_accuracy, avg_rt FROM (
                        SELECT 
                            gs.id AS session_id,
                            AVG(pm.accuracy_rate) AS avg_accuracy,
                            AVG(pm.reaction_time) AS avg_rt
                        FROM game_sessions gs
                        JOIN performance_metrics pm ON gs.id = pm.session_id
                        WHERE gs.user_id = ? AND gs.id <= ?
                        GROUP BY gs.id
                        ORDER BY gs.id DESC
                        LIMIT 20
                    ) ORDER BY session_id ASC
                    """,
                    (user_id, session_id)
                )
                session_rows = cursor.fetchall()
                
                history_acc = []
                history_rt = []
                found_current = False
                for r in session_rows:
                    if r['session_id'] == session_id:
                        found_current = True
                        history_acc.append(avg_accuracy)
                        history_rt.append(avg_rt)
                    else:
                        history_acc.append(r['avg_accuracy'])
                        history_rt.append(r['avg_rt'])
                
                if not found_current:
                    history_acc.append(avg_accuracy)
                    history_rt.append(avg_rt)
                    
                acc_slope = calculate_ols_slope(history_acc)
                rt_slope = calculate_ols_slope(history_rt)
                
                pred_res = archetype_classifier.predict(avg_accuracy, avg_rt, acc_slope, rt_slope)
                archetype = pred_res["archetype"]
                confidence = pred_res["confidence_score"]
                        
                # Insert or update cognitive profile
                cursor.execute("SELECT id FROM cognitive_profiles WHERE user_id = ?", (user_id,))
                profile = cursor.fetchone()
                if profile:
                    cursor.execute(
                        """
                        UPDATE cognitive_profiles 
                        SET archetype_name = ?, confidence_score = ?, updated_at = CURRENT_TIMESTAMP 
                        WHERE user_id = ?
                        """,
                        (archetype, confidence, user_id)
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO cognitive_profiles (user_id, archetype_name, confidence_score) 
                        VALUES (?, ?, ?)
                        """,
                        (user_id, archetype, confidence)
                    )
                    
                # Log this archetype classification in archetype_history for longitudinal tracking
                cursor.execute(
                    """
                    INSERT INTO archetype_history (user_id, session_id, archetype_name, confidence_score) 
                    VALUES (?, ?, ?, ?)
                    """,
                    (user_id, session_id, archetype, confidence)
                )
        finally:
            conn.close()
        
        return jsonify({
            "status": "success",
            "dda_parameters": dda_params,
            "cognitive_profile": {
                "archetype": archetype,
                "confidence_score": confidence,
                "accuracy_slope": acc_slope,
                "reaction_time_slope": rt_slope,
                "history_accuracy": history_acc,
                "history_reaction_time": history_rt
            }
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in adjust_difficulty: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

@app.route('/api/submit-metrics', methods=['POST'])
def submit_metrics():
    """
    Submits game metrics telemetry to database.
    """
    try:
        data = request.get_json() or {}
        
        session_id = safe_int(data.get('session_id'))
        
        # Support reaction_time and reaction_time_ms
        rt_val = data.get('reaction_time') if data.get('reaction_time') is not None else data.get('reaction_time_ms')
        reaction_time = safe_float(rt_val)
        
        # Support accuracy_rate and accuracy
        acc_val = data.get('accuracy_rate') if data.get('accuracy_rate') is not None else data.get('accuracy')
        accuracy = safe_float(acc_val)
        
        # Support difficulty and difficulty_level
        diff_val = data.get('difficulty') if data.get('difficulty') is not None else data.get('difficulty_level')
        difficulty = safe_int(diff_val)
        
        if session_id is None or reaction_time is None or accuracy is None or difficulty is None:
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
        # Bounds validation
        if session_id <= 0:
            return jsonify({"status": "error", "message": "session_id must be a positive integer."}), 400
        if reaction_time < 0:
            return jsonify({"status": "error", "message": "reaction_time cannot be negative."}), 400
        if not (0.0 <= accuracy <= 1.0):
            return jsonify({"status": "error", "message": "accuracy_rate must be between 0.0 and 1.0."}), 400
        if not (1 <= difficulty <= 5):
            return jsonify({"status": "error", "message": "difficulty_level must be between 1 and 5."}), 400
        
        cognitive_domain = data.get('cognitive_domain')
        if cognitive_domain is not None:
            cognitive_domain = str(cognitive_domain)
            
        game_type = data.get('game_type')
        if game_type is not None:
            game_type = str(game_type)
            
        error_count = safe_int(data.get('error_count'), 0)
        hesitation_ms = safe_float(data.get('hesitation_ms'), 0.0)
        spam_click_count = safe_int(data.get('spam_click_count'), 0)
        
        rule_shift_latency_ms = safe_float(data.get('rule_shift_latency_ms'))
        path_efficiency = safe_float(data.get('path_efficiency'))
 
        # Infer game_type and cognitive_domain if not provided
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                
                if not game_type:
                    cursor.execute("SELECT game_type FROM game_sessions WHERE id = ?", (session_id,))
                    session_row = cursor.fetchone()
                    if session_row:
                        game_type = session_row['game_type']
                        
                if game_type and not cognitive_domain:
                    cognitive_domain = GAME_TO_DOMAIN.get(game_type)
                    
                if error_count is None:
                    error_count = 0
 
                # Insert performance metric
                cursor.execute(
                    """
                    INSERT INTO performance_metrics 
                    (session_id, reaction_time, accuracy_rate, difficulty_level, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (session_id, reaction_time, accuracy, difficulty, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency)
                )
        finally:
            conn.close()
 
        return jsonify({"status": "success", "message": "Metrics recorded"}), 201
 
    except Exception as e:
        app.logger.error(f"Error in submit_metrics: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

@app.route('/api/submit-metrics/batch', methods=['POST'])
def submit_metrics_batch():
    """
    Submits a batch of game metrics telemetry to database in a single transaction.
    """
    try:
        data = request.get_json() or {}
        if isinstance(data, list):
            metrics_list = data
        elif isinstance(data, dict) and "metrics" in data:
            metrics_list = data["metrics"]
        else:
            return jsonify({"status": "error", "message": "Expected list of metrics or dictionary with 'metrics' key."}), 400
            
        if not metrics_list:
            return jsonify({"status": "success", "message": "No metrics to record"}), 201
            
        conn = get_db_connection()
        recorded_count = 0
        try:
            with conn:
                cursor = conn.cursor()
                session_game_types = {}
                for item in metrics_list:
                    session_id = safe_int(item.get('session_id'))
                    rt_val = item.get('reaction_time') if item.get('reaction_time') is not None else item.get('reaction_time_ms')
                    reaction_time = safe_float(rt_val)
                    acc_val = item.get('accuracy_rate') if item.get('accuracy_rate') is not None else item.get('accuracy')
                    accuracy = safe_float(acc_val)
                    diff_val = item.get('difficulty') if item.get('difficulty') is not None else item.get('difficulty_level')
                    difficulty = safe_int(diff_val)
                    
                    if session_id is None or reaction_time is None or accuracy is None or difficulty is None:
                        continue
                    if session_id <= 0 or reaction_time < 0 or not (0.0 <= accuracy <= 1.0) or not (1 <= difficulty <= 5):
                        continue
                        
                    cognitive_domain = item.get('cognitive_domain')
                    if cognitive_domain is not None:
                        cognitive_domain = str(cognitive_domain)
                    game_type = item.get('game_type')
                    if game_type is not None:
                        game_type = str(game_type)
                        
                    error_count = safe_int(item.get('error_count'), 0)
                    hesitation_ms = safe_float(item.get('hesitation_ms'), 0.0)
                    spam_click_count = safe_int(item.get('spam_click_count'), 0)
                    
                    rule_shift_latency_ms = safe_float(item.get('rule_shift_latency_ms'))
                    path_efficiency = safe_float(item.get('path_efficiency'))
                    
                    if not game_type:
                        if session_id in session_game_types:
                            game_type = session_game_types[session_id]
                        else:
                            cursor.execute("SELECT game_type FROM game_sessions WHERE id = ?", (session_id,))
                            session_row = cursor.fetchone()
                            if session_row:
                                game_type = session_row['game_type']
                                session_game_types[session_id] = game_type
                    else:
                        session_game_types[session_id] = game_type
                            
                    if game_type and not cognitive_domain:
                        cognitive_domain = GAME_TO_DOMAIN.get(game_type)
                        
                    cursor.execute(
                        """
                        INSERT INTO performance_metrics 
                        (session_id, reaction_time, accuracy_rate, difficulty_level, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (session_id, reaction_time, accuracy, difficulty, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency)
                    )
                    recorded_count += 1
        finally:
            conn.close()
            
        return jsonify({"status": "success", "message": f"{recorded_count} metrics recorded"}), 201
        
    except Exception as e:
        app.logger.error(f"Error in submit_metrics_batch: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

@app.route('/api/evaluate', methods=['POST'])
def evaluate_thesis():
    """
    Pillar 1: Empirical Cognitive Improvement (Pretest-Posttest Analysis).
    Calculates individual and average improvement rates, and performs a Paired t-test
    to determine if improvements are statistically significant.
    Supports querying user's matching pre-test and post-test values from the database
    if a 'username' is provided.
    """
    try:
        data = request.get_json() or {}
        username = data.get('username')
        
        pretest = None
        posttest = None
        db_queried = False
        
        if username:
            username = str(username).strip()
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                # Resolve user ID
                cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
                user_row = cursor.fetchone()
                if not user_row:
                    return jsonify({"status": "error", "message": f"User '{username}' not found."}), 404
                user_id = user_row['id']
                
                # Fetch latest pre-test
                cursor.execute(
                    """
                    SELECT spatial_visual_score, logical_math_score, attention_score, executive_score 
                    FROM cognitive_assessments 
                    WHERE user_id = ? AND assessment_type = 'pre-test'
                    ORDER BY completed_at DESC, id DESC LIMIT 1
                    """,
                    (user_id,)
                )
                pre_row = cursor.fetchone()
                
                # Fetch latest post-test
                cursor.execute(
                    """
                    SELECT spatial_visual_score, logical_math_score, attention_score, executive_score 
                    FROM cognitive_assessments 
                    WHERE user_id = ? AND assessment_type = 'post-test'
                    ORDER BY completed_at DESC, id DESC LIMIT 1
                    """,
                    (user_id,)
                )
                post_row = cursor.fetchone()
                
                if pre_row and post_row:
                    pretest = [
                        pre_row['spatial_visual_score'],
                        pre_row['logical_math_score'],
                        pre_row['attention_score'],
                        pre_row['executive_score']
                    ]
                    posttest = [
                        post_row['spatial_visual_score'],
                        post_row['logical_math_score'],
                        post_row['attention_score'],
                        post_row['executive_score']
                    ]
                    db_queried = True
            finally:
                conn.close()
                
        # If DB query was not executed or returned nothing, fall back to direct score arrays
        if not db_queried:
            pretest = data.get('pretest_scores')
            posttest = data.get('posttest_scores')
            
        if not isinstance(pretest, list) or not isinstance(posttest, list) or len(pretest) != len(posttest):
            return jsonify({
                "status": "error", 
                "message": "Both pretest_scores and posttest_scores (or database pre-test/post-test records) must be lists of equal length."
            }), 400
            
        # Parse arrays defensively
        pretest = [safe_float(x) for x in pretest]
        posttest = [safe_float(x) for x in posttest]
        
        if any(x is None for x in pretest) or any(x is None for x in posttest):
            return jsonify({
                "status": "error",
                "message": "All scores in pretest and posttest lists must be valid numbers."
            }), 400
            
        n = len(pretest)
        if n < 2:
            return jsonify({
                "status": "error",
                "message": "At least 2 subject scores are required to perform a Paired t-test."
            }), 400
            
        # Calculate individual improvement rates
        improvement_rates = []
        diffs = []
        for pre, post in zip(pretest, posttest):
            diffs.append(post - pre)
            rate = ((post - pre) / pre * 100) if pre != 0 else 0.0
            improvement_rates.append(rate)
            
        mean_pre = sum(pretest) / n
        mean_post = sum(posttest) / n
        
        # Calculate overall group improvement rate using the formula from Pillar 1:
        # Improvement Rate = ((Mean Posttest - Mean Pretest) / Mean Pretest) * 100
        overall_improvement_rate = ((mean_post - mean_pre) / mean_pre * 100) if mean_pre != 0 else 0.0
        
        # Compute Paired t-test t-statistic and p-value
        import math
        if SCIPY_AVAILABLE:
            t_stat, p_val = stats.ttest_rel(posttest, pretest)
        else:
            # Fallback manual calculation
            mean_diff = sum(diffs) / n
            variance_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1)
            sd_diff = variance_diff ** 0.5
            se_diff = sd_diff / (n ** 0.5)
            t_stat = mean_diff / se_diff if se_diff != 0 else 0.0
            # Continuous advanced mathematical approximation lookup
            p_val = calculate_approx_t_p_value(t_stat, n - 1)
            
        # Handle nan/inf cases in float formatting
        if math.isnan(t_stat) or math.isinf(t_stat):
            t_stat = 0.0
        if math.isnan(p_val) or math.isinf(p_val):
            p_val = 1.0
 
        # Calculate Cohen's d effect size for paired samples
        mean_diff_d = sum(diffs) / n
        if n > 1:
            var_diff_d = sum((d_val - mean_diff_d) ** 2 for d_val in diffs) / (n - 1)
            sd_diff_d = math.sqrt(var_diff_d)
        else:
            sd_diff_d = 0.0
 
        if sd_diff_d > 0:
            cohens_d = mean_diff_d / sd_diff_d
        else:
            cohens_d = 0.0
 
        # Handle nan/inf cases for Cohen's d
        if math.isnan(cohens_d) or math.isinf(cohens_d):
            cohens_d = 0.0
 
        # Determine effect size magnitude interpretation
        abs_d = abs(cohens_d)
        if abs_d < 0.2:
            effect_magnitude = "negligible"
        elif abs_d < 0.5:
            effect_magnitude = "small"
        elif abs_d < 0.8:
            effect_magnitude = "medium"
        else:
            effect_magnitude = "large"
            
        significant = p_val < 0.05
        
        response_data = {
            "status": "success",
            "sample_size": n,
            "mean_pretest": round(mean_pre, 2),
            "mean_posttest": round(mean_post, 2),
            "mean_difference": round(mean_post - mean_pre, 2),
            "overall_improvement_rate_pct": round(overall_improvement_rate, 2),
            "t_statistic": round(t_stat, 4),
            "p_value": round(p_val, 6),
            "cohens_d": round(cohens_d, 4),
            "effect_size_magnitude": effect_magnitude,
            "statistically_significant": bool(significant),
            "hypothesis_result": "Reject Null Hypothesis: Significant improvement detected!" if significant else "Fail to Reject Null Hypothesis: Improvement is not statistically significant."
        }
        
        if db_queried:
            response_data["domain_improvements"] = {
                "spatial_visual_memory": round(posttest[0] - pretest[0], 2),
                "logical_mathematical": round(posttest[1] - pretest[1], 2),
                "reflexes_and_focus": round(posttest[2] - pretest[2], 2),
                "executive_strategy": round(posttest[3] - pretest[3], 2)
            }
            
        return jsonify(response_data), 200
        
    except Exception as e:
        app.logger.error(f"Error in evaluate_thesis: {e}")
        return jsonify({"status": "error", "message": f"Statistical engine error: {str(e)}"}), 500

@app.route('/api/cohort-analytics', methods=['GET'])
def get_cohort_analytics():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Query matched pre and post scores for research subjects
        cursor.execute(
            """
            SELECT 
                ca_pre.spatial_visual_score AS pre_sv,
                ca_pre.logical_math_score AS pre_lm,
                ca_pre.attention_score AS pre_at,
                ca_pre.executive_score AS pre_ex,
                ca_post.spatial_visual_score AS post_sv,
                ca_post.logical_math_score AS post_lm,
                ca_post.attention_score AS post_at,
                ca_post.executive_score AS post_ex
            FROM users u
            JOIN cognitive_assessments ca_pre ON u.id = ca_pre.user_id AND ca_pre.assessment_type = 'pre-test'
            JOIN cognitive_assessments ca_post ON u.id = ca_post.user_id AND ca_post.assessment_type = 'post-test'
            WHERE u.username LIKE 'research_subject_%'
            """
        )
        rows = cursor.fetchall()
        
        if not rows:
            return jsonify({
                "status": "error",
                "message": "No research cohort subjects found in database. Please run the seeding script first."
            }), 404
            
        n = len(rows)
        
        pre_sv_list = []
        pre_lm_list = []
        pre_at_list = []
        pre_ex_list = []
        
        post_sv_list = []
        post_lm_list = []
        post_at_list = []
        post_ex_list = []
        
        pre_averages = []
        post_averages = []
        
        for r in rows:
            pre_sv = safe_float(r['pre_sv'])
            pre_lm = safe_float(r['pre_lm'])
            pre_at = safe_float(r['pre_at'])
            pre_ex = safe_float(r['pre_ex'])
            
            post_sv = safe_float(r['post_sv'])
            post_lm = safe_float(r['post_lm'])
            post_at = safe_float(r['post_at'])
            post_ex = safe_float(r['post_ex'])
            
            pre_sv_list.append(pre_sv)
            pre_lm_list.append(pre_lm)
            pre_at_list.append(pre_at)
            pre_ex_list.append(pre_ex)
            
            post_sv_list.append(post_sv)
            post_lm_list.append(post_lm)
            post_at_list.append(post_at)
            post_ex_list.append(post_ex)
            
            pre_averages.append((pre_sv + pre_lm + pre_at + pre_ex) / 4.0)
            post_averages.append((post_sv + post_lm + post_at + post_ex) / 4.0)
            
        # Helper standard deviation
        def get_mean_std(lst):
            length = len(lst)
            if length == 0:
                return 0.0, 0.0
            mean = sum(lst) / length
            if length > 1:
                var = sum((x - mean) ** 2 for x in lst) / (length - 1)
                std = var ** 0.5
            else:
                std = 0.0
            return mean, std
            
        mean_pre_sv, std_pre_sv = get_mean_std(pre_sv_list)
        mean_post_sv, std_post_sv = get_mean_std(post_sv_list)
        
        mean_pre_lm, std_pre_lm = get_mean_std(pre_lm_list)
        mean_post_lm, std_post_lm = get_mean_std(post_lm_list)
        
        mean_pre_at, std_pre_at = get_mean_std(pre_at_list)
        mean_post_at, std_post_at = get_mean_std(post_at_list)
        
        mean_pre_ex, std_pre_ex = get_mean_std(pre_ex_list)
        mean_post_ex, std_post_ex = get_mean_std(post_ex_list)
        
        overall_pre_mean = sum(pre_averages) / n
        overall_post_mean = sum(post_averages) / n
        overall_improvement_rate = ((overall_post_mean - overall_pre_mean) / overall_pre_mean * 100) if overall_pre_mean != 0 else 0.0
        
        # Paired t-test
        import math
        diffs = [post_averages[i] - pre_averages[i] for i in range(n)]
        mean_diff = sum(diffs) / n
        
        if SCIPY_AVAILABLE:
            t_stat, p_val = stats.ttest_rel(post_averages, pre_averages)
        else:
            var_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1) if n > 1 else 0.0
            sd_diff = var_diff ** 0.5
            se_diff = sd_diff / (n ** 0.5) if n > 0 else 0.0
            t_stat = mean_diff / se_diff if se_diff != 0 else 0.0
            p_val = calculate_approx_t_p_value(t_stat, n - 1)
            
        if math.isnan(t_stat) or math.isinf(t_stat):
            t_stat = 0.0
        if math.isnan(p_val) or math.isinf(p_val):
            p_val = 1.0
            
        # Cohen's d for cohort
        var_diff_d = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1) if n > 1 else 0.0
        sd_diff_d = var_diff_d ** 0.5
        cohens_d = mean_diff / sd_diff_d if sd_diff_d > 0 else 0.0
        
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
            
        significant = p_val < 0.05
        
        response_data = {
            "status": "success",
            "sample_size": n,
            "overall_pre_mean": round(overall_pre_mean, 2),
            "overall_post_mean": round(overall_post_mean, 2),
            "overall_improvement_rate_pct": round(overall_improvement_rate, 2),
            "cohort_t_statistic": round(t_stat, 4),
            "cohort_p_value": round(p_val, 6),
            "cohort_cohens_d": round(cohens_d, 4),
            "effect_size_magnitude": effect_magnitude,
            "statistically_significant": bool(significant),
            "hypothesis_verdict": "Reject Null Hypothesis: Significant improvement detected across the cohort." if significant else "Fail to Reject Null Hypothesis: Improvement is not statistically significant.",
            "domains": {
                "spatial_visual_memory": {
                    "pre_mean": round(mean_pre_sv, 2),
                    "pre_std": round(std_pre_sv, 2),
                    "post_mean": round(mean_post_sv, 2),
                    "post_std": round(std_post_sv, 2),
                    "improvement_pct": round(((mean_post_sv - mean_pre_sv) / mean_pre_sv * 100) if mean_pre_sv != 0 else 0.0, 2)
                },
                "logical_mathematical": {
                    "pre_mean": round(mean_pre_lm, 2),
                    "pre_std": round(std_pre_lm, 2),
                    "post_mean": round(mean_post_lm, 2),
                    "post_std": round(std_post_lm, 2),
                    "improvement_pct": round(((mean_post_lm - mean_pre_lm) / mean_pre_lm * 100) if mean_pre_lm != 0 else 0.0, 2)
                },
                "reflexes_and_focus": {
                    "pre_mean": round(mean_pre_at, 2),
                    "pre_std": round(std_pre_at, 2),
                    "post_mean": round(mean_post_at, 2),
                    "post_std": round(std_post_at, 2),
                    "improvement_pct": round(((mean_post_at - mean_pre_at) / mean_pre_at * 100) if mean_pre_at != 0 else 0.0, 2)
                },
                "executive_strategy": {
                    "pre_mean": round(mean_pre_ex, 2),
                    "pre_std": round(std_pre_ex, 2),
                    "post_mean": round(mean_post_ex, 2),
                    "post_std": round(std_post_ex, 2),
                    "improvement_pct": round(((mean_post_ex - mean_pre_ex) / mean_pre_ex * 100) if mean_pre_ex != 0 else 0.0, 2)
                }
            }
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_cohort_analytics: {e}")
        return jsonify({"status": "error", "message": f"Cohort evaluation error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/api/iso-evaluations', methods=['POST'])
def submit_iso_evaluation():
    try:
        data = request.get_json() or {}
        
        # Extract scores
        f_score = data.get('functionality_score')
        u_score = data.get('usability_score')
        r_score = data.get('reliability_score')
        e_score = data.get('efficiency_score')
        ux_score = data.get('ux_score')
        
        # Validate that all exist and are integers between 1 and 5
        scores = [f_score, u_score, r_score, e_score, ux_score]
        if any(x is None for x in scores):
            return jsonify({"status": "error", "message": "All scores are required (functionality, usability, reliability, efficiency, ux)."}), 400
            
        try:
            scores = [int(x) for x in scores]
        except (ValueError, TypeError):
            return jsonify({"status": "error", "message": "All scores must be integers."}), 400
            
        if any(x < 1 or x > 5 for x in scores):
            return jsonify({"status": "error", "message": "All scores must be between 1 and 5 (Likert scale)."}), 400
            
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO iso_evaluations 
                    (functionality_score, usability_score, reliability_score, efficiency_score, ux_score) 
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    scores
                )
        finally:
            conn.close()
        
        return jsonify({"status": "success", "message": "ISO 25010 evaluation recorded successfully."}), 201
        
    except Exception as e:
        app.logger.error(f"Error in submit_iso_evaluation: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

@app.route('/api/iso-evaluations', methods=['GET'])
def get_iso_evaluations():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, functionality_score, usability_score, reliability_score, efficiency_score, ux_score, created_at FROM iso_evaluations ORDER BY created_at DESC"
        )
        rows = cursor.fetchall()
        
        evaluations = []
        for r in rows:
            evaluations.append({
                "id": r["id"],
                "functionality_score": r["functionality_score"],
                "usability_score": r["usability_score"],
                "reliability_score": r["reliability_score"],
                "efficiency_score": r["efficiency_score"],
                "ux_score": r["ux_score"],
                "created_at": r["created_at"]
            })
            
        return jsonify({
            "status": "success",
            "evaluations": evaluations
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_iso_evaluations: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/api/iso-evaluations/summary', methods=['GET'])
def get_iso_evaluations_summary():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                AVG(functionality_score) as avg_func,
                AVG(usability_score) as avg_usab,
                AVG(reliability_score) as avg_rel,
                AVG(efficiency_score) as avg_eff,
                AVG(ux_score) as avg_ux,
                COUNT(*) as count
            FROM iso_evaluations
            """
        )
        row = cursor.fetchone()
        
        if row and row["count"] > 0:
            summary = {
                "avg_functionality": round(row["avg_func"], 2),
                "avg_usability": round(row["avg_usab"], 2),
                "avg_reliability": round(row["avg_rel"], 2),
                "avg_efficiency": round(row["avg_eff"], 2),
                "avg_ux": round(row["avg_ux"], 2),
                "count": row["count"]
            }
        else:
            summary = {
                "avg_functionality": 0.0,
                "avg_usability": 0.0,
                "avg_reliability": 0.0,
                "avg_efficiency": 0.0,
                "avg_ux": 0.0,
                "count": 0
            }
            
        return jsonify({
            "status": "success",
            "summary": summary
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_iso_evaluations_summary: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/api/cohort-db-scores', methods=['GET'])
def get_cohort_db_scores():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get all users starting with clinical_subject_
        cursor.execute("SELECT id, username FROM users WHERE username LIKE 'clinical_subject_%' ORDER BY username ASC")
        users = cursor.fetchall()
        
        pretest_scores = []
        posttest_scores = []
        
        for u in users:
            uid = u['id']
            # Fetch all performance metrics for this user
            cursor.execute(
                """
                SELECT pm.accuracy_rate 
                FROM performance_metrics pm
                JOIN game_sessions gs ON pm.session_id = gs.id
                WHERE gs.user_id = ?
                ORDER BY gs.start_time ASC, pm.id ASC
                """,
                (uid,)
            )
            rows = cursor.fetchall()
            accuracies = [r['accuracy_rate'] for r in rows]
            
            if len(accuracies) >= 10:
                # Pretest is average of first 5 rounds (Session 1)
                pre_avg = sum(accuracies[:5]) / 5.0 * 100
                # Posttest is average of last 5 rounds (Session 8)
                post_avg = sum(accuracies[-5:]) / 5.0 * 100
                
                pretest_scores.append(round(pre_avg, 1))
                posttest_scores.append(round(post_avg, 1))
            elif len(accuracies) > 0:
                # Fallback if less than 10
                pretest_scores.append(round(accuracies[0] * 100, 1))
                posttest_scores.append(round(accuracies[-1] * 100, 1))
        
        return jsonify({
            "status": "success",
            "pretest_scores": pretest_scores,
            "posttest_scores": posttest_scores,
            "count": len(pretest_scores)
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_cohort_db_scores: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/api/export-csv', methods=['GET'])
def export_csv():
    conn = get_db_connection()
    try:
        from flask import Response
        import csv
        import io
        
        cursor = conn.cursor()
        
        query = """
            SELECT 
                pm.id AS metric_id,
                pm.session_id,
                gs.user_id,
                u.username,
                pm.cognitive_domain,
                pm.game_type,
                pm.reaction_time,
                pm.accuracy_rate,
                pm.difficulty_level,
                pm.error_count,
                pm.hesitation_ms,
                pm.spam_click_count,
                pm.rule_shift_latency_ms,
                pm.path_efficiency,
                pm.recorded_at
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            ORDER BY pm.recorded_at DESC, pm.id DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers matching professor telemetry specifications
        writer.writerow([
            "Metric ID", "Session ID", "User ID", "Username", 
            "Cognitive Domain", "Game Type", "Reaction Time (ms)", 
            "Accuracy Rate", "Difficulty Level", "Error Count", 
            "Hesitation (ms)", "Spam Click Count", "Rule-Shift Latency (ms)", "Path Efficiency", "Timestamp"
        ])
        
        for r in rows:
            writer.writerow([
                r["metric_id"], r["session_id"], r["user_id"], r["username"],
                r["cognitive_domain"], r["game_type"], r["reaction_time"],
                r["accuracy_rate"], r["difficulty_level"], r["error_count"],
                r["hesitation_ms"], r["spam_click_count"], r["rule_shift_latency_ms"], r["path_efficiency"], r["recorded_at"]
            ])
            
        output.seek(0)
        csv_data = output.getvalue()
        
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=cohort_telemetry_report.csv"}
        )
    except Exception as e:
        app.logger.error(f"Error in export_csv: {e}")
        return jsonify({"status": "error", "message": f"Export failed: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/api/user-session-history/<username>', methods=['GET'])
def get_user_session_history(username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get user
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "success", "sessions": []}), 200
        user_id = user['id']
        
        # Fetch sessions with precomputed stats in a single join query
        cursor.execute(
            """
            SELECT 
                gs.id AS session_id, 
                gs.game_type, 
                gs.game_mode, 
                gs.start_time,
                AVG(pm.reaction_time) AS avg_rt,
                AVG(pm.accuracy_rate) AS avg_acc,
                MAX(pm.difficulty_level) AS max_diff,
                COUNT(pm.id) AS rounds_count
            FROM game_sessions gs
            LEFT JOIN performance_metrics pm ON gs.id = pm.session_id
            WHERE gs.user_id = ?
            GROUP BY gs.id
            ORDER BY gs.start_time DESC
            """,
            (user_id,)
        )
        sessions_rows = cursor.fetchall()
        
        sessions = []
        for s in sessions_rows:
            sessions.append({
                "session_id": s["session_id"],
                "game_type": s["game_type"],
                "game_mode": s["game_mode"] if s["game_mode"] else "timed",
                "start_time": s["start_time"],
                "avg_rt": round(s["avg_rt"], 2) if s["avg_rt"] is not None else 0.0,
                "avg_acc": round(s["avg_acc"], 4) if s["avg_acc"] is not None else 0.0,
                "max_diff": s["max_diff"] if s["max_diff"] is not None else 1,
                "rounds_count": s["rounds_count"]
            })
            
        return jsonify({"status": "success", "sessions": sessions}), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_user_session_history: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/api/session-metrics/<int:session_id>', methods=['GET'])
def get_session_metrics(session_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Verify if session exists
        cursor.execute("SELECT id FROM game_sessions WHERE id = ?", (session_id,))
        if not cursor.fetchone():
            return jsonify({"status": "error", "message": f"Session ID {session_id} not found."}), 404

        cursor.execute(
            """
            SELECT id, reaction_time, accuracy_rate, difficulty_level, recorded_at, rule_shift_latency_ms, path_efficiency
            FROM performance_metrics
            WHERE session_id = ?
            ORDER BY id ASC
            """,
            (session_id,)
        )
        rows = cursor.fetchall()
        
        metrics = []
        for r in rows:
            metrics.append({
                "metric_id": r["id"],
                "reaction_time": r["reaction_time"],
                "reaction_time_ms": r["reaction_time"],  # legacy compatibility
                "accuracy_rate": r["accuracy_rate"],
                "difficulty_level": r["difficulty_level"],
                "recorded_at": r["recorded_at"],
                "timestamp": r["recorded_at"],  # legacy compatibility
                "rule_shift_latency_ms": r["rule_shift_latency_ms"],
                "path_efficiency": r["path_efficiency"]
            })
            
        return jsonify({"status": "success", "session_id": session_id, "metrics": metrics}), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_session_metrics: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/api/cohort-comparison/<username>', methods=['GET'])
def get_cohort_comparison(username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get active user averages
        cursor.execute(
            """
            SELECT 
                AVG(pm.reaction_time) as avg_rt,
                AVG(pm.accuracy_rate) as avg_acc
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            WHERE u.username = ?
            """,
            (username,)
        )
        user_stats = cursor.fetchone()
        user_rt = round(user_stats["avg_rt"], 2) if user_stats and user_stats["avg_rt"] is not None else 0.0
        user_acc = round(user_stats["avg_acc"], 4) if user_stats and user_stats["avg_acc"] is not None else 0.0
        
        # Get clinical cohort averages (seeded clinical_subject_%)
        cursor.execute(
            """
            SELECT 
                AVG(pm.reaction_time) as avg_rt,
                AVG(pm.accuracy_rate) as avg_acc
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            WHERE u.username LIKE 'clinical_subject_%'
            """
        )
        cohort_stats = cursor.fetchone()
        cohort_rt = round(cohort_stats["avg_rt"], 2) if cohort_stats and cohort_stats["avg_rt"] is not None else 0.0
        cohort_acc = round(cohort_stats["avg_acc"], 4) if cohort_stats and cohort_stats["avg_acc"] is not None else 0.0
        
        return jsonify({
            "status": "success",
            "username": username,
            "user_averages": {
                "reaction_time": user_rt,
                "reaction_time_ms": user_rt,  # legacy compatibility
                "accuracy_rate": user_acc
            },
            "cohort_averages": {
                "reaction_time": cohort_rt,
                "reaction_time_ms": cohort_rt,  # legacy compatibility
                "accuracy_rate": cohort_acc
            }
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_cohort_comparison: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/api/archetype-progression/<username>', methods=['GET'])
def get_archetype_progression(username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get user
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "success", "history": []}), 200
        user_id = user['id']
        
        # Fetch progression history joined with game_sessions to know what game they played
        cursor.execute(
            """
            SELECT ah.id, ah.session_id, gs.game_type, ah.archetype_name, ah.confidence_score, ah.timestamp
            FROM archetype_history ah
            LEFT JOIN game_sessions gs ON ah.session_id = gs.id
            WHERE ah.user_id = ?
            ORDER BY ah.timestamp ASC, ah.id ASC
            """,
            (user_id,)
        )
        rows = cursor.fetchall()
        
        history = []
        for r in rows:
            history.append({
                "id": r["id"],
                "session_id": r["session_id"],
                "game_type": r["game_type"] or "Unknown",
                "archetype_name": r["archetype_name"],
                "confidence_score": r["confidence_score"],
                "timestamp": r["timestamp"]
            })
            
        return jsonify({"status": "success", "history": history}), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_archetype_progression: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


def calculate_pearson_r(x, y):
    n = len(x)
    if n <= 1:
        return 0.0, 1.0  # (r, p-value)
    
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
    
    # Calculate simple p-value using t-statistic
    p_val = 1.0
    if SCIPY_AVAILABLE:
        try:
            r_exact, p_val = stats.pearsonr(x, y)
            return float(r_exact), float(p_val)
        except Exception:
            pass
            
    # Simple mathematical approximation or fallback for p-value if scipy is missing:
    try:
        df = n - 2
        if df > 0 and abs(r) < 1.0:
            t = r * ((df / (1 - r * r)) ** 0.5)
            z = abs(t)
            # Standard normal CDF approximation (Abramowitz and Stegun)
            t_approx = 1 / (1 + 0.2316419 * z)
            d = 0.3989423 * (2.7182818 ** (-z * z / 2))
            prob = d * t_approx * (0.3193815 + t_approx * (-0.3565638 + t_approx * (1.7814779 + t_approx * (-1.821256 + t_approx * 1.330274))))
            p_val = 2.0 * prob
            p_val = max(0.0, min(1.0, p_val))
    except Exception:
        p_val = 0.05 if abs(r) > 0.3 else 0.5
        
    return float(r), float(p_val)


@app.route('/api/research/correlations', methods=['GET'])
def get_research_correlations():
    try:
        var1 = request.args.get('var1', 'rule_shift_latency_ms')
        var2 = request.args.get('var2', 'spam_click_count')
        cohort = request.args.get('cohort', 'all')  # 'all', 'clinical', 'active'
        active_username = request.args.get('username', '')

        # Valid numeric variables for correlation matrix comparison
        valid_vars = {
            'reaction_time', 'accuracy_rate', 'difficulty_level', 
            'error_count', 'hesitation_ms', 'spam_click_count', 
            'rule_shift_latency_ms', 'path_efficiency'
        }
        if var1 not in valid_vars or var2 not in valid_vars:
            return jsonify({"status": "error", "message": "Invalid variables selected"}), 400

        conn = get_db_connection()
        try:
            cursor = conn.cursor()

            if cohort == 'active' and active_username:
                query = f"""
                    SELECT pm.{var1}, pm.{var2}, u.username
                    FROM performance_metrics pm
                    JOIN game_sessions gs ON pm.session_id = gs.id
                    JOIN users u ON gs.user_id = u.id
                    WHERE u.username = ? AND pm.{var1} IS NOT NULL AND pm.{var2} IS NOT NULL
                """
                cursor.execute(query, (active_username,))
            elif cohort == 'clinical':
                query = f"""
                    SELECT pm.{var1}, pm.{var2}, u.username
                    FROM performance_metrics pm
                    JOIN game_sessions gs ON pm.session_id = gs.id
                    JOIN users u ON gs.user_id = u.id
                    WHERE u.username LIKE 'clinical_subject_%' AND pm.{var1} IS NOT NULL AND pm.{var2} IS NOT NULL
                """
                cursor.execute(query)
            else:  # all
                query = f"""
                    SELECT pm.{var1}, pm.{var2}, u.username
                    FROM performance_metrics pm
                    JOIN game_sessions gs ON pm.session_id = gs.id
                    JOIN users u ON gs.user_id = u.id
                    WHERE pm.{var1} IS NOT NULL AND pm.{var2} IS NOT NULL
                """
                cursor.execute(query)

            rows = cursor.fetchall()
        finally:
            conn.close()

        x_vals = []
        y_vals = []
        data_points = []

        for r in rows:
            val1 = r[var1]
            val2 = r[var2]
            if val1 is not None and val2 is not None:
                x_vals.append(float(val1))
                y_vals.append(float(val2))
                data_points.append({
                    "x": float(val1),
                    "y": float(val2),
                    "username": r["username"]
                })

        r_coeff, p_value = calculate_pearson_r(x_vals, y_vals)
        r_squared = r_coeff * r_coeff

        abs_r = abs(r_coeff)
        if abs_r >= 0.7:
            magnitude = "strong"
        elif abs_r >= 0.4:
            magnitude = "moderate"
        elif abs_r >= 0.1:
            magnitude = "weak"
        else:
            magnitude = "negligible"

        direction = "positive" if r_coeff >= 0 else "negative"
        interpretation = f"There is a {magnitude} {direction} correlation between {var1.replace('_', ' ')} and {var2.replace('_', ' ')} (r = {r_coeff:.4f}, p = {p_value:.4f})."

        return jsonify({
            "status": "success",
            "var1": var1,
            "var2": var2,
            "cohort": cohort,
            "r": round(r_coeff, 4),
            "r_squared": round(r_squared, 4),
            "p_value": round(p_value, 4),
            "magnitude": magnitude,
            "direction": direction,
            "interpretation": interpretation,
            "data_points": data_points
        }), 200
    except Exception as e:
        app.logger.error(f"Error in get_research_correlations: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


@app.route('/api/research/learning-curves/<username>', methods=['GET'])
def get_learning_curves(username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT gs.user_id, u.username, gs.id AS session_id, gs.start_time,
                   AVG(pm.accuracy_rate) as avg_acc,
                   AVG(pm.reaction_time) as avg_rt
            FROM game_sessions gs
            JOIN users u ON gs.user_id = u.id
            LEFT JOIN performance_metrics pm ON pm.session_id = gs.id
            WHERE u.username = ? OR u.username LIKE 'clinical_subject_%'
            GROUP BY gs.id
            ORDER BY gs.user_id, gs.start_time ASC
        """, (username,))
        rows = cursor.fetchall()

        user_sessions = {}
        for r in rows:
            uid = r["user_id"]
            if uid not in user_sessions:
                user_sessions[uid] = []
            user_sessions[uid].append({
                "username": r["username"],
                "avg_acc": r["avg_acc"] if r["avg_acc"] is not None else 0.0,
                "avg_rt": r["avg_rt"] if r["avg_rt"] is not None else 0.0
            })

        active_user_curve = []
        clinical_cohort_curves = {}
        all_cohort_curves = {}

        for uid, sessions in user_sessions.items():
            is_active = (sessions[0]["username"] == username) if sessions else False
            is_clinical = sessions[0]["username"].startswith("clinical_subject_") if sessions else False
            
            for idx, s in enumerate(sessions):
                session_num = idx + 1
                
                if is_active:
                    active_user_curve.append({
                        "session_index": session_num,
                        "accuracy": round(s["avg_acc"], 4),
                        "reaction_time": round(s["avg_rt"], 2)
                    })
                
                if is_clinical:
                    if session_num not in clinical_cohort_curves:
                        clinical_cohort_curves[session_num] = []
                    clinical_cohort_curves[session_num].append(s)
                
                if session_num not in all_cohort_curves:
                    all_cohort_curves[session_num] = []
                all_cohort_curves[session_num].append(s)

        clinical_curve = []
        for idx in sorted(clinical_cohort_curves.keys()):
            s_list = clinical_cohort_curves[idx]
            avg_acc = sum(x["avg_acc"] for x in s_list) / len(s_list)
            avg_rt = sum(x["avg_rt"] for x in s_list) / len(s_list)
            clinical_curve.append({
                "session_index": idx,
                "accuracy": round(avg_acc, 4),
                "reaction_time": round(avg_rt, 2)
            })

        all_curve = []
        for idx in sorted(all_cohort_curves.keys()):
            s_list = all_cohort_curves[idx]
            avg_acc = sum(x["avg_acc"] for x in s_list) / len(s_list)
            avg_rt = sum(x["avg_rt"] for x in s_list) / len(s_list)
            all_curve.append({
                "session_index": idx,
                "accuracy": round(avg_acc, 4),
                "reaction_time": round(avg_rt, 2)
            })

        return jsonify({
            "status": "success",
            "username": username,
            "curves": {
                "active_user": active_user_curve,
                "clinical_cohort": clinical_curve,
                "all_cohort": all_curve
            }
        }), 200

    except Exception as e:
        app.logger.error(f"Error in get_learning_curves: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route('/api/training-goals/<username>', methods=['GET'])
def get_training_goals(username):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            with conn:
                cursor.execute("INSERT INTO users (username) VALUES (?)", (username,))
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cursor.fetchone()
        
        user_id = user['id']

        cursor.execute("SELECT id, domain, metric_type, target_value, is_completed FROM training_goals WHERE user_id = ?", (user_id,))
        goals_rows = cursor.fetchall()

        # Query all domain averages for this user in a single database roundtrip
        cursor.execute(
            """
            SELECT 
                pm.cognitive_domain,
                AVG(pm.accuracy_rate) AS avg_acc,
                AVG(pm.reaction_time) AS avg_rt,
                MAX(pm.difficulty_level) AS max_diff
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            WHERE gs.user_id = ?
            GROUP BY pm.cognitive_domain
            """,
            (user_id,)
        )
        stats_rows = cursor.fetchall()
        
        # Map cognitive_domain to its metrics
        domain_stats = {
            row['cognitive_domain']: {
                'avg_acc': row['avg_acc'],
                'avg_rt': row['avg_rt'],
                'max_diff': row['max_diff']
            }
            for row in stats_rows if row['cognitive_domain'] is not None
        }

        goals = []
        for g in goals_rows:
            gid = g['id']
            domain = g['domain']
            metric_type = g['metric_type']
            target_value = g['target_value']
            is_completed_db = g['is_completed']

            stats = domain_stats.get(domain)
            current_value = 0.0
            achieved = False

            if stats:
                if metric_type == 'accuracy':
                    avg_acc = stats['avg_acc'] if stats['avg_acc'] is not None else 0.0
                    current_value = round(avg_acc * 100, 1)
                    achieved = (current_value >= target_value)
                elif metric_type == 'reaction_time':
                    avg_rt = stats['avg_rt'] if stats['avg_rt'] is not None else 0.0
                    current_value = round(avg_rt, 1)
                    achieved = (0 < current_value <= target_value)
                elif metric_type == 'difficulty':
                    max_diff = stats['max_diff'] if stats['max_diff'] is not None else 1
                    current_value = float(max_diff)
                    achieved = (current_value >= target_value)

            just_completed = False
            if achieved and is_completed_db == 0:
                with conn:
                    cursor.execute("UPDATE training_goals SET is_completed = 1 WHERE id = ?", (gid,))
                just_completed = True
                is_completed_db = 1

            goals.append({
                "id": gid,
                "domain": domain,
                "metric_type": metric_type,
                "target_value": target_value,
                "current_value": current_value,
                "is_completed": is_completed_db,
                "just_completed": just_completed
            })

        return jsonify({"status": "success", "goals": goals}), 200

    except Exception as e:
        app.logger.error(f"Error in get_training_goals: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route('/api/training-goals', methods=['POST'])
def create_training_goal():
    try:
        data = request.json or {}
        username = data.get('username')
        domain = data.get('domain')
        metric_type = data.get('metric_type')
        target_value = data.get('target_value')

        if not username or not domain or not metric_type or target_value is None:
            return jsonify({"status": "error", "message": "Missing required parameters"}), 400

        # Input Validation
        valid_domains = {"spatial_visual_memory", "logical_mathematical", "reflexes_and_focus", "executive_strategy"}
        if domain not in valid_domains:
            return jsonify({"status": "error", "message": f"Invalid cognitive domain: {domain}"}), 400

        if metric_type not in {"accuracy", "reaction_time", "difficulty"}:
            return jsonify({"status": "error", "message": f"Invalid metric type: {metric_type}"}), 400

        try:
            val = float(target_value)
            if val < 0:
                return jsonify({"status": "error", "message": "target_value must be a positive number."}), 400
            if metric_type == "accuracy" and (val < 0.0 or val > 100.0):
                return jsonify({"status": "error", "message": "Accuracy target must be a percentage between 0 and 100."}), 400
            if metric_type == "difficulty" and (val < 1.0 or val > 5.0):
                return jsonify({"status": "error", "message": "Difficulty target must be a level between 1 and 5."}), 400
        except (ValueError, TypeError):
            return jsonify({"status": "error", "message": "target_value must be a valid number."}), 400

        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()

                cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
                user = cursor.fetchone()
                if not user:
                    cursor.execute("INSERT INTO users (username) VALUES (?)", (username,))
                    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
                    user = cursor.fetchone()

                user_id = user['id']

                cursor.execute(
                    """
                    INSERT INTO training_goals (user_id, domain, metric_type, target_value, is_completed)
                    VALUES (?, ?, ?, ?, 0)
                    """,
                    (user_id, domain, metric_type, val)
                )
        finally:
            conn.close()

        return jsonify({"status": "success", "message": "Goal created successfully"}), 201

    except Exception as e:
        app.logger.error(f"Error in create_training_goal: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


@app.route('/api/training-goals/<int:goal_id>', methods=['DELETE'])
def delete_training_goal(goal_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        with conn:
            cursor.execute("DELETE FROM training_goals WHERE id = ?", (goal_id,))
            if cursor.rowcount == 0:
                return jsonify({"status": "error", "message": f"Training goal with ID {goal_id} not found."}), 404
        return jsonify({"status": "success", "message": "Goal deleted successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error in delete_training_goal: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route('/metrics', methods=['GET'])
def get_metrics():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Total sessions
        cursor.execute("SELECT COUNT(*) FROM game_sessions")
        total_sessions = cursor.fetchone()[0]
        
        # Average score (based on accuracy rate * 100)
        cursor.execute("SELECT AVG(accuracy_rate) FROM performance_metrics")
        avg_acc = cursor.fetchone()[0]
        average_score = round(avg_acc * 100, 2) if avg_acc is not None else 0.0
        
        # Domain breakdown (average score per domain)
        cursor.execute("""
            SELECT cognitive_domain, AVG(accuracy_rate) as avg_acc, COUNT(*) as cnt
            FROM performance_metrics 
            WHERE cognitive_domain IS NOT NULL
            GROUP BY cognitive_domain
        """)
        domain_rows = cursor.fetchall()
        
        domain_breakdown = {}
        for row in domain_rows:
            domain = row['cognitive_domain']
            acc = row['avg_acc']
            cnt = row['cnt']
            domain_breakdown[domain] = {
                "average_accuracy": round(acc * 100, 2) if acc is not None else 0.0,
                "total_records": cnt
            }
            
        return jsonify({
            "status": "success",
            "total_sessions": total_sessions,
            "average_score": average_score,
            "domain_breakdown": domain_breakdown
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_metrics: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()





if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. Please make sure it exists.")
    
    app.run(debug=True, port=5000)
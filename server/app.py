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
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool
import os
import time
import bcrypt
from dotenv import load_dotenv

load_dotenv()

# Import Machine Learning Classifier Strategy
from model import archetype_classifier

# Try importing scipy.stats for Paired t-test
try:
    from scipy import stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

app = Flask(__name__)
# CORS restricts your React/Phaser frontend to authorized origins
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL").replace("postgres://", "postgresql://")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from database import db
db.init_app(app)

# Rate limiter to prevent brute-force and spam
redis_url = os.environ.get("REDIS_URL", "memory://")
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri=redis_url
)

from routes.leaderboard import leaderboard_bp
from routes.gamification import gamification_bp
from routes.auth import auth_bp
from routes.game import game_bp
from routes.analytics import analytics_bp
from routes.research import research_bp
from routes.ml import ml_bp

app.register_blueprint(leaderboard_bp)
app.register_blueprint(gamification_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(game_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(research_bp)
app.register_blueprint(ml_bp)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Lightweight health probe for frontend polling."""
    return jsonify({"status": "ok"}), 200

import jwt
from functools import wraps
import datetime
import hashlib
from schemas import validate_json, StartSessionRequest, SubmitMetricsRequest, DDARequest, SubmitAssessmentRequest, SyncOfflineTelemetryRequest

from auth import token_required

# Auth routes moved to server/routes/auth.py

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

def db_execute_with_retry(cursor, sql, params=(), max_retries=5):
    """
    Executes a database statement with exponential backoff retry logic.
    Catches psycopg2.OperationalError and retries
    up to max_retries times with delays: 50ms, 100ms, 200ms, 400ms, 800ms.
    """
    backoff_ms = 50
    for attempt in range(max_retries):
        try:
            cursor.execute(sql, params)
            return  # success
        except psycopg2.OperationalError as e:
            if attempt < max_retries - 1:
                time.sleep(backoff_ms / 1000.0)
                backoff_ms *= 2  # exponential backoff
            else:
                raise  # re-raise on final attempt or non-lock errors

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
ml_history_cache = {}
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

from database import get_db_connection, init_pool

# Programmatic Schema Migration / Initialization
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Ensure core tables exist before running migrations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS game_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            game_type VARCHAR(255) NOT NULL,
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS performance_metrics (
            id SERIAL PRIMARY KEY,
            session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
            reaction_time REAL,
            accuracy_rate REAL,
            difficulty_level INTEGER,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cognitive_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            archetype_name VARCHAR(255),
            confidence_score REAL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Get existing columns in performance_metrics using PostgreSQL catalog
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'performance_metrics'
    """)
    columns = [row['column_name'] for row in cursor.fetchall()]
    
    # Re-fetch or run programmatic column migrations if needed
    if "reaction_time_ms" in columns and "reaction_time" not in columns:
        cursor.execute("ALTER TABLE performance_metrics RENAME COLUMN reaction_time_ms TO reaction_time")
        print("[DB Migration] Renamed reaction_time_ms to reaction_time")
    if "timestamp" in columns and "recorded_at" not in columns:
        cursor.execute("ALTER TABLE performance_metrics RENAME COLUMN timestamp TO recorded_at")
        print("[DB Migration] Renamed timestamp to recorded_at")
        
    # Re-fetch columns
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'performance_metrics'
    """)
    columns = [row['column_name'] for row in cursor.fetchall()]

    if "cognitive_domain" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN cognitive_domain VARCHAR(255)")
    if "game_type" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN game_type VARCHAR(255)")
    if "error_count" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN error_count INTEGER DEFAULT 0")
    if "hesitation_ms" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN hesitation_ms REAL DEFAULT 0.0")
    if "spam_click_count" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN spam_click_count INTEGER DEFAULT 0")
    if "rule_shift_latency_ms" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN rule_shift_latency_ms REAL")
    if "path_efficiency" not in columns:
        cursor.execute("ALTER TABLE performance_metrics ADD COLUMN path_efficiency REAL")
    
    # Create iso_evaluations table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS iso_evaluations (
            id SERIAL PRIMARY KEY,
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
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            assessment_type VARCHAR(50) CHECK(assessment_type IN ('pre-test', 'post-test')),
            spatial_visual_score REAL NOT NULL,
            logical_math_score REAL NOT NULL,
            attention_score REAL NOT NULL,
            executive_score REAL NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create archetype_history table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS archetype_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
            archetype_name VARCHAR(255) NOT NULL,
            confidence_score REAL NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create training_goals table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS training_goals (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            domain VARCHAR(255) NOT NULL,
            metric_type VARCHAR(255) NOT NULL,
            target_value REAL NOT NULL,
            is_completed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            task_description TEXT NOT NULL,
            target_amount INTEGER NOT NULL,
            current_amount INTEGER DEFAULT 0,
            is_completed INTEGER DEFAULT 0,
            reward_coins INTEGER DEFAULT 200,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_achievements (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            achievement_id VARCHAR(255) NOT NULL,
            current_amount INTEGER DEFAULT 0,
            is_completed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, achievement_id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_streaks (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            last_login_date DATE,
            current_streak INTEGER DEFAULT 1,
            longest_streak INTEGER DEFAULT 1
        )
    """)
    
    # Programmatic column migrations:
    try:
        cursor.execute("ALTER TABLE game_sessions ADD COLUMN current_smooth_difficulty REAL DEFAULT 1.0")
        print("[DB Migration] Added current_smooth_difficulty column to game_sessions")
    except psycopg2.Error:
        pass

    try:
        cursor.execute("ALTER TABLE game_sessions ADD COLUMN game_mode VARCHAR(50) DEFAULT 'timed'")
        print("[DB Migration] Added game_mode column to game_sessions")
    except psycopg2.Error:
        pass
    
    # Add pin_hash column to users table (for optional PIN authentication)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN pin_hash VARCHAR(64) DEFAULT NULL")
        print("[DB Migration] Added pin_hash column to users")
    except psycopg2.Error:
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
                # Base formula: User's average RT * 1.2 + (6 - difficulty) * 1500ms grace period
                dynamic_limit = (user_avg_rt * 1.2) + ((6 - lvl) * 1500)
                min_floor = 2500 if lvl == 5 else 3000
                configs[lvl]["time_limit"] = int(max(min_floor, min(15000, dynamic_limit)))
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
    app.run(debug=True, port=5000)

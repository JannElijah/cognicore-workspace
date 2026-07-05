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
app.register_blueprint(leaderboard_bp)
app.register_blueprint(gamification_bp)

import jwt
from functools import wraps
import datetime
import hashlib
from schemas import validate_json, StartSessionRequest, SubmitMetricsRequest, DDARequest, SubmitAssessmentRequest, SyncOfflineTelemetryRequest

from auth import token_required

@app.route('/api/auth/set-pin', methods=['POST'])
@token_required
def set_pin(current_user_id, current_username):
    data = request.get_json()
    pin = data.get("pin")
    if not pin or len(str(pin)) < 4:
        return jsonify({"status": "error", "message": "Valid PIN of at least 4 digits required"}), 400
        
    # Hash PIN securely using bcrypt
    salt = bcrypt.gensalt()
    pin_hash = bcrypt.hashpw(str(pin).encode('utf-8'), salt).decode('utf-8')
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET pin_hash = %s WHERE id = %s", (pin_hash, current_user_id))
        
    return jsonify({"status": "success", "message": "PIN set successfully"})

@app.route('/api/auth/verify-pin', methods=['POST'])
@limiter.limit("5 per minute")
@token_required
def verify_pin(current_user_id, current_username):
    data = request.get_json()
    pin = data.get("pin")
    if not pin:
        return jsonify({"status": "error", "message": "PIN required"}), 400
        
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT pin_hash FROM users WHERE id = %s", (current_user_id,))
        row = cursor.fetchone()
        
        if not row or not row['pin_hash']:
            return jsonify({"status": "error", "message": "No PIN set for user"}), 400
            
        stored_hash = row['pin_hash']
        
        # Verify hash
        if bcrypt.checkpw(str(pin).encode('utf-8'), stored_hash.encode('utf-8')):
            return jsonify({"status": "success", "message": "PIN verified"})
        else:
            return jsonify({"status": "error", "message": "Invalid PIN"}), 401

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
                # Base formula: User's average RT + (6 - difficulty) * 1000ms grace period
                dynamic_limit = user_avg_rt + ((6 - lvl) * 1000)
                min_floor = 1500 if lvl == 5 else 2000
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


@app.route('/api/health', methods=['GET'])
def health_check():
    """Lightweight health probe for frontend polling."""
    return jsonify({"status": "ok"}), 200


@app.route('/api/sync-user', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
def sync_user(current_user_id, current_username):
    """
    Called after Supabase Auth login on the frontend.
    The @token_required decorator verifies the JWT and automatically creates
    the internal integer user ID if this is the first login.
    This route just handles daily streak and returns coins.
    """
    try:
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                user_id = current_user_id
                
                # Check / Update Login Streak
                cursor.execute("SELECT last_login_date, current_streak, longest_streak FROM user_streaks WHERE user_id = %s", (user_id,))
                streak_row = cursor.fetchone()
                
                daily_reward = {
                    "granted": False,
                    "streak": 1,
                    "coins": 0
                }
                
                import datetime
                today = datetime.date.today()
                
                if not streak_row:
                    # First login streak entry ever
                    cursor.execute("""
                        INSERT INTO user_streaks (user_id, last_login_date, current_streak, longest_streak)
                        VALUES (%s, %s, 1, 1)
                    """, (user_id, today))
                    
                    coins_reward = 100
                    cursor.execute("""
                        INSERT INTO user_profiles (user_id, coins)
                        VALUES (%s, %s)
                        ON CONFLICT(user_id) DO UPDATE SET coins = user_profiles.coins + excluded.coins
                    """, (user_id, coins_reward))
                    
                    daily_reward = {
                        "granted": True,
                        "streak": 1,
                        "coins": coins_reward
                    }
                else:
                    last_login = streak_row['last_login_date']
                    current_streak = streak_row['current_streak']
                    longest_streak = streak_row['longest_streak']
                    
                    if last_login is None:
                        # Streak table entry exists but last_login_date is null
                        cursor.execute("""
                            UPDATE user_streaks 
                            SET last_login_date = %s, current_streak = 1, longest_streak = GREATEST(longest_streak, 1) 
                            WHERE user_id = %s
                        """, (today, user_id))
                        
                        coins_reward = 100
                        cursor.execute("""
                            INSERT INTO user_profiles (user_id, coins)
                            VALUES (%s, %s)
                            ON CONFLICT(user_id) DO UPDATE SET coins = user_profiles.coins + excluded.coins
                        """, (user_id, coins_reward))
                        
                        daily_reward = {
                            "granted": True,
                            "streak": 1,
                            "coins": coins_reward
                        }
                    else:
                        if isinstance(last_login, str):
                            last_login_date = datetime.datetime.strptime(last_login, "%Y-%m-%d").date()
                        else:
                            last_login_date = last_login
                            
                        if last_login_date == today:
                            # Already logged in today
                            daily_reward = {
                                "granted": False,
                                "streak": current_streak,
                                "coins": 0
                            }
                        elif last_login_date == today - datetime.timedelta(days=1):
                            # Yesterday - increment streak
                            new_streak = current_streak + 1
                            new_longest = max(longest_streak, new_streak)
                            
                            cursor.execute("""
                                UPDATE user_streaks 
                                SET last_login_date = %s, current_streak = %s, longest_streak = %s 
                                WHERE user_id = %s
                            """, (today, new_streak, new_longest, user_id))
                            
                            coins_reward = min(500, 100 + (new_streak - 1) * 50)
                            
                            cursor.execute("""
                                INSERT INTO user_profiles (user_id, coins)
                                VALUES (%s, %s)
                                ON CONFLICT(user_id) DO UPDATE SET coins = user_profiles.coins + excluded.coins
                            """, (user_id, coins_reward))
                            
                            daily_reward = {
                                "granted": True,
                                "streak": new_streak,
                                "coins": coins_reward
                            }
                        else:
                            # Streak broken - reset to 1
                            cursor.execute("""
                                UPDATE user_streaks 
                                SET last_login_date = %s, current_streak = 1 
                                WHERE user_id = %s
                            """, (today, user_id))
                            
                            coins_reward = 100
                            cursor.execute("""
                                INSERT INTO user_profiles (user_id, coins)
                                VALUES (%s, %s)
                                ON CONFLICT(user_id) DO UPDATE SET coins = user_profiles.coins + excluded.coins
                            """, (user_id, coins_reward))
                            
                            daily_reward = {
                                "granted": True,
                                "streak": 1,
                                "coins": coins_reward
                            }
        finally:
            conn.close()
            
        return jsonify({
            'status': 'success',
            'user': {
                'id': user_id,
                'username': current_username
            },
            'daily_reward': daily_reward
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

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

@app.route('/api/submit-assessment', methods=['POST'])
@token_required
@validate_json(SubmitAssessmentRequest)
def submit_assessment(current_user_id, current_username):
    """
    Submits user pre-test or post-test assessment scores.
    Determines cognitive domain strengths/weaknesses and prescribes the target game module.
    """
    try:
        data = request.validated_data.dict()
        username = current_username
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
                user_id = current_user_id
                
                # Insert into cognitive_assessments
                cursor.execute(
                    """
                    INSERT INTO cognitive_assessments 
                    (user_id, assessment_type, spatial_visual_score, logical_math_score, attention_score, executive_score)
                    VALUES (%s, %s, %s, %s, %s, %s)
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
            "executive_strategy": "PriorityQueue"
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
            "prescribed_game": prescribed_game,
            "personalized_report": generate_pros_cons(scores_map)
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
                cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
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
                    WHERE user_id = %s AND assessment_type = 'pre-test'
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
                    WHERE user_id = %s AND assessment_type = 'post-test'
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
                        "executive_strategy": "PriorityQueue"
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
                    "prescribed_game": prescribed_game,
                    "personalized_report": generate_pros_cons(pre_data) if pre_data else None
                }), 200
        finally:
            conn.close()
    except Exception as e:
        app.logger.error(f"Error in get_assessment_status: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/start-session', methods=['POST'])
@token_required
@validate_json(StartSessionRequest)
def start_session(current_user_id, current_username):
    """
    Starts a new game session.
    Returns: session_id, user_id, and initial DDA game parameters.
    """
    try:
        data = request.validated_data.dict()
        username = current_username
        user_id = current_user_id
        game_type = str(data.get('game_type', 'SpeedTap')).strip()
        game_mode = str(data.get('game_mode', 'timed')).strip().lower()
        
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                
                # User already authenticated via JWT
                    
                # Create game session
                db_execute_with_retry(
                    cursor,
                    "INSERT INTO game_sessions (user_id, game_type, game_mode) VALUES (%s, %s, %s) RETURNING id",
                    (user_id, game_type, game_mode)
                )
                session_id = cursor.fetchone()['id']
                
                # Get initial DDA parameters based on parent domain history for this user
                domain = GAME_TO_DOMAIN.get(game_type, "reflexes_and_focus")
                domain_games = [g for g, d in GAME_TO_DOMAIN.items() if d == domain]
                placeholders = ",".join("%s" for _ in domain_games)
                
                query = f"""
                    SELECT pm.difficulty_level 
                    FROM performance_metrics pm
                    JOIN game_sessions gs ON pm.session_id = gs.id
                    WHERE gs.user_id = %s AND (pm.cognitive_domain = %s OR gs.game_type IN ({placeholders}))
                    ORDER BY pm.recorded_at DESC, pm.id DESC LIMIT 1
                """
                cursor.execute(query, [user_id, domain] + domain_games)
                row = cursor.fetchone()
                if row:
                    initial_difficulty = row['difficulty_level']
                else:
                    initial_difficulty = 1
                    
                # Standardize Daily Challenge to exactly difficulty level 3
                if game_mode == 'daily_challenge':
                    initial_difficulty = 3
                    
                # Initialize smooth difficulty state for the session
                cursor.execute(
                    "UPDATE game_sessions SET current_smooth_difficulty = %s WHERE id = %s",
                    (float(initial_difficulty), session_id)
                )
                
                # Fetch existing cognitive profile archetype if available
                cursor.execute(
                    "SELECT archetype_name, confidence_score FROM cognitive_profiles WHERE user_id = %s",
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
@token_required
@validate_json(DDARequest)
def adjust_difficulty(current_user_id, current_username):
    """
    Analyzes recent performance telemetry for a session, updates difficulty parameters, 
    and classifies/updates the user's cognitive profile archetype.
    """
    try:
        data = request.validated_data.dict()
        session_id = safe_int(data.get('session_id'))
        if not session_id or session_id <= 0:
            return jsonify({"status": "error", "message": "Valid positive session_id is required."}), 400
            
        conn = get_db_connection()
        try:
            with conn:
                cursor = conn.cursor()
                
                # Verify session and get user_id, game_type, game_mode
                cursor.execute("SELECT user_id, game_type, game_mode FROM game_sessions WHERE id = %s", (session_id,))
                session = cursor.fetchone()
                if not session:
                    return jsonify({"status": "error", "message": "Invalid session_id"}), 404
                user_id = session['user_id']
                game_type = session['game_type']
                game_mode = session['game_mode']
                
                # Daily Challenge bypasses DDA and remains locked at Level 3
                if game_mode == 'daily_challenge':
                    return jsonify({
                        "status": "success",
                        "new_difficulty": 3,
                        "is_level_up": False,
                        "is_level_down": False,
                        "classification": None,
                        "advisor_message": None,
                        "debug": "DDA disabled for daily challenge"
                    })
                
                domain = GAME_TO_DOMAIN.get(game_type, "reflexes_and_focus")
        
                # Determine sliding window size k based on game type (Option C Volatility Windows)
                if game_type in ("SpeedTap", "StroopShift", "speed_tap", "stroop_shift"):
                    k = 10
                elif game_type in ("MazeEscape", "RouteOptimizer", "maze_escape", "route_optimizer", "PriorityQueue", "priority_queue"):
                    k = 3
                else:
                    k = 5
        
                # Fetch the last k performance metrics for this session and specific cognitive domain
                cursor.execute(
                    """
                    SELECT reaction_time, accuracy_rate, difficulty_level 
                    FROM performance_metrics 
                    WHERE session_id = %s AND (cognitive_domain = %s OR game_type = %s)
                    ORDER BY recorded_at DESC, id DESC LIMIT %s
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
                        WHERE session_id = %s 
                        ORDER BY recorded_at DESC, id DESC LIMIT %s
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
                # Default: 0.3 (Moving average smoothing to prevent difficulty yo-yo effects)
                alpha = safe_float(data.get('smoothing_alpha'), 0.3)
                alpha = max(0.1, min(1.0, alpha))
                
                # Fetch current smooth difficulty from session
                cursor.execute("SELECT current_smooth_difficulty FROM game_sessions WHERE id = %s", (session_id,))
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
                    "UPDATE game_sessions SET current_smooth_difficulty = %s WHERE id = %s",
                    (smooth_diff, session_id)
                )
                    
                # Calculate new parameters using active avg_rt for dynamic timer scaling
                dda_params = calculate_dda_parameters(new_difficulty, game_type, user_avg_rt=avg_rt)
                
                # Cognitive Profiling Archetype Determination using Random Forest
                # Features: avg_accuracy, avg_rt, acc_slope, rt_slope
                
                # Query preceding and current session averages for this user to compute slopes, limiting to latest 20 sessions
                cache_key = f"{user_id}"
                # If we have 20 cached, we can just use cache and slide the window
                if cache_key in ml_history_cache and len(ml_history_cache[cache_key]['acc']) >= 20:
                    history_acc = ml_history_cache[cache_key]['acc'][-19:]
                    history_rt = ml_history_cache[cache_key]['rt'][-19:]
                    history_acc.append(avg_accuracy)
                    history_rt.append(avg_rt)
                else:
                    cursor.execute(
                        """
                        SELECT session_id, avg_accuracy, avg_rt FROM (
                            SELECT 
                                gs.id AS session_id,
                                AVG(pm.accuracy_rate) AS avg_accuracy,
                                AVG(pm.reaction_time) AS avg_rt
                            FROM game_sessions gs
                            JOIN performance_metrics pm ON gs.id = pm.session_id
                            WHERE gs.user_id = %s AND gs.id <= %s
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
                        
                ml_history_cache[cache_key] = {'acc': history_acc.copy(), 'rt': history_rt.copy()}

                    
                acc_slope = calculate_ols_slope(history_acc)
                rt_slope = calculate_ols_slope(history_rt)
                
                pred_res = archetype_classifier.predict(avg_accuracy, avg_rt, acc_slope, rt_slope)
                archetype = pred_res["archetype"]
                confidence = pred_res["confidence_score"]
                
                trajectory_msg = archetype_classifier.predict_trajectory(new_difficulty, acc_slope, rt_slope)
                        
                # Insert or update cognitive profile
                cursor.execute("SELECT id FROM cognitive_profiles WHERE user_id = %s", (user_id,))
                profile = cursor.fetchone()
                if profile:
                    cursor.execute(
                        """
                        UPDATE cognitive_profiles 
                        SET archetype_name = %s, confidence_score = %s, updated_at = CURRENT_TIMESTAMP 
                        WHERE user_id = %s
                        """,
                        (archetype, confidence, user_id)
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO cognitive_profiles (user_id, archetype_name, confidence_score) 
                        VALUES (%s, %s, %s)
                        """,
                        (user_id, archetype, confidence)
                    )
                    
                # Log this archetype classification in archetype_history for longitudinal tracking
                cursor.execute(
                    """
                    INSERT INTO archetype_history (user_id, session_id, archetype_name, confidence_score) 
                    VALUES (%s, %s, %s, %s)
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
                "trajectory_prediction": trajectory_msg,
                "history_accuracy": history_acc,
                "history_reaction_time": history_rt
            }
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in adjust_difficulty: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

def execute_gamification(cursor, uid, reaction_time, accuracy, difficulty, game_type):
    xp_gained = difficulty * 15
    coins_gained = int(accuracy * 10) + (difficulty * 2)
    leveled_up = False
    newly_unlocked = []

    # 1. Update Profile XP & Coins
    cursor.execute("""
        INSERT INTO user_profiles (user_id, xp, coins, level) 
        VALUES (%s, %s, %s, 1) 
        ON CONFLICT(user_id) DO UPDATE SET 
            xp = user_profiles.xp + excluded.xp,
            coins = user_profiles.coins + excluded.coins
    """, (uid, xp_gained, coins_gained))

    # Check level up
    cursor.execute("SELECT xp, level FROM user_profiles WHERE user_id = %s", (uid,))
    prof = cursor.fetchone()
    new_level = 1
    if prof:
        new_level = (prof['xp'] // 500) + 1
        if new_level > prof['level']:
            leveled_up = True
            coins_gained += 500 # 500 bonus
            cursor.execute("UPDATE user_profiles SET level = %s, coins = coins + 500 WHERE user_id = %s", (new_level, uid))

    # Update daily tasks
    cursor.execute("UPDATE daily_tasks SET current_amount = current_amount + 1 WHERE user_id = %s AND task_description = 'Play 3 Training Games' AND DATE(created_at) = CURRENT_DATE", (uid,))
    if accuracy >= 0.8:
        cursor.execute("UPDATE daily_tasks SET current_amount = current_amount + 1 WHERE user_id = %s AND task_description = 'Achieve 80%% accuracy in any game' AND DATE(created_at) = CURRENT_DATE", (uid,))
    if reaction_time < 800:
        cursor.execute("UPDATE daily_tasks SET current_amount = current_amount + 1 WHERE user_id = %s AND task_description = 'Achieve reaction time under 800ms' AND DATE(created_at) = CURRENT_DATE", (uid,))

    # Update permanent achievements
    # 1. Speed Demon (RT < 400ms, 10 times)
    if reaction_time < 400:
        cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'speed_demon') ON CONFLICT DO NOTHING", (uid,))
        cursor.execute("UPDATE user_achievements SET current_amount = current_amount + 1 WHERE user_id = %s AND achievement_id = 'speed_demon' AND is_completed = 0", (uid,))
        cursor.execute("SELECT current_amount FROM user_achievements WHERE user_id = %s AND achievement_id = 'speed_demon' AND is_completed = 0", (uid,))
        ach_sd = cursor.fetchone()
        if ach_sd and ach_sd['current_amount'] >= 10:
            cursor.execute("UPDATE user_achievements SET is_completed = 1 WHERE user_id = %s AND achievement_id = 'speed_demon'", (uid,))
            cursor.execute("INSERT INTO user_inventory (user_id, item_id, item_type) VALUES (%s, 'avatar-speed-demon', 'avatar') ON CONFLICT DO NOTHING", (uid,))
            newly_unlocked.append('speed_demon')

    # 2. Scholar (Reach Level 10)
    if new_level >= 10:
        cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'scholar') ON CONFLICT DO NOTHING", (uid,))
        cursor.execute("SELECT is_completed FROM user_achievements WHERE user_id = %s AND achievement_id = 'scholar'", (uid,))
        ach_sc = cursor.fetchone()
        if ach_sc and ach_sc['is_completed'] == 0:
            cursor.execute("UPDATE user_achievements SET is_completed = 1, current_amount = 1 WHERE user_id = %s AND achievement_id = 'scholar'", (uid,))
            cursor.execute("INSERT INTO user_inventory (user_id, item_id, item_type) VALUES (%s, 'banner-scholar', 'banner') ON CONFLICT DO NOTHING", (uid,))
            newly_unlocked.append('scholar')

    # 3. First Steps (Complete 1 game)
    cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'first_steps') ON CONFLICT DO NOTHING", (uid,))
    cursor.execute("SELECT is_completed FROM user_achievements WHERE user_id = %s AND achievement_id = 'first_steps'", (uid,))
    ach_fs = cursor.fetchone()
    if ach_fs and ach_fs['is_completed'] == 0:
        cursor.execute("UPDATE user_achievements SET is_completed = 1, current_amount = 1 WHERE user_id = %s AND achievement_id = 'first_steps'", (uid,))
        cursor.execute("UPDATE user_profiles SET coins = coins + 100 WHERE user_id = %s", (uid,))
        coins_gained += 100
        newly_unlocked.append('first_steps')

    # 4. Consistency (Complete 50 games)
    cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'consistency') ON CONFLICT DO NOTHING", (uid,))
    cursor.execute("UPDATE user_achievements SET current_amount = current_amount + 1 WHERE user_id = %s AND achievement_id = 'consistency' AND is_completed = 0", (uid,))
    cursor.execute("SELECT current_amount FROM user_achievements WHERE user_id = %s AND achievement_id = 'consistency' AND is_completed = 0", (uid,))
    ach_con = cursor.fetchone()
    if ach_con and ach_con['current_amount'] >= 50:
        cursor.execute("UPDATE user_achievements SET is_completed = 1 WHERE user_id = %s AND achievement_id = 'consistency'", (uid,))
        cursor.execute("UPDATE user_profiles SET coins = coins + 500 WHERE user_id = %s", (uid,))
        coins_gained += 500
        newly_unlocked.append('consistency')

    # 5. Accuracy Master (100% accuracy, 5 times)
    if accuracy >= 1.0:
        cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'accuracy_master') ON CONFLICT DO NOTHING", (uid,))
        cursor.execute("UPDATE user_achievements SET current_amount = current_amount + 1 WHERE user_id = %s AND achievement_id = 'accuracy_master' AND is_completed = 0", (uid,))
        cursor.execute("SELECT current_amount FROM user_achievements WHERE user_id = %s AND achievement_id = 'accuracy_master' AND is_completed = 0", (uid,))
        ach_am = cursor.fetchone()
        if ach_am and ach_am['current_amount'] >= 5:
            cursor.execute("UPDATE user_achievements SET is_completed = 1 WHERE user_id = %s AND achievement_id = 'accuracy_master'", (uid,))
            cursor.execute("UPDATE user_profiles SET coins = coins + 1000 WHERE user_id = %s", (uid,))
            coins_gained += 1000
            newly_unlocked.append('accuracy_master')

    # 6. Sharpshooter (90%+ accuracy, 20 times)
    if accuracy >= 0.9:
        cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'sharpshooter') ON CONFLICT DO NOTHING", (uid,))
        cursor.execute("UPDATE user_achievements SET current_amount = current_amount + 1 WHERE user_id = %s AND achievement_id = 'sharpshooter' AND is_completed = 0", (uid,))
        cursor.execute("SELECT current_amount FROM user_achievements WHERE user_id = %s AND achievement_id = 'sharpshooter' AND is_completed = 0", (uid,))
        ach_ss = cursor.fetchone()
        if ach_ss and ach_ss['current_amount'] >= 20:
            cursor.execute("UPDATE user_achievements SET is_completed = 1 WHERE user_id = %s AND achievement_id = 'sharpshooter'", (uid,))
            cursor.execute("UPDATE user_profiles SET coins = coins + 500 WHERE user_id = %s", (uid,))
            coins_gained += 500
            newly_unlocked.append('sharpshooter')

    # 7. Lightning Reflexes (RT under 300ms)
    if reaction_time < 300:
        cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'lightning_reflexes') ON CONFLICT DO NOTHING", (uid,))
        cursor.execute("SELECT is_completed FROM user_achievements WHERE user_id = %s AND achievement_id = 'lightning_reflexes'", (uid,))
        ach_lr = cursor.fetchone()
        if ach_lr and ach_lr['is_completed'] == 0:
            cursor.execute("UPDATE user_achievements SET is_completed = 1, current_amount = 1 WHERE user_id = %s AND achievement_id = 'lightning_reflexes'", (uid,))
            cursor.execute("UPDATE user_profiles SET coins = coins + 200 WHERE user_id = %s", (uid,))
            cursor.execute("INSERT INTO user_inventory (user_id, item_id, item_type) VALUES (%s, 'banner-lightning', 'banner') ON CONFLICT DO NOTHING", (uid,))
            coins_gained += 200
            newly_unlocked.append('lightning_reflexes')

    # 8. Peak Performer (Reach difficulty level 5)
    if difficulty >= 5:
        cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'peak_performer') ON CONFLICT DO NOTHING", (uid,))
        cursor.execute("SELECT is_completed FROM user_achievements WHERE user_id = %s AND achievement_id = 'peak_performer'", (uid,))
        ach_pp = cursor.fetchone()
        if ach_pp and ach_pp['is_completed'] == 0:
            cursor.execute("UPDATE user_achievements SET is_completed = 1, current_amount = 1 WHERE user_id = %s AND achievement_id = 'peak_performer'", (uid,))
            cursor.execute("UPDATE user_profiles SET coins = coins + 1000 WHERE user_id = %s", (uid,))
            coins_gained += 1000
            newly_unlocked.append('peak_performer')

    # 9. Versatile Mind (Play all 5 game types)
    if game_type:
        cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'versatile_mind') ON CONFLICT DO NOTHING", (uid,))
        cursor.execute("SELECT COUNT(DISTINCT gs.game_type) as gt_count FROM game_sessions gs WHERE gs.user_id = %s AND gs.game_type IS NOT NULL", (uid,))
        gt_row = cursor.fetchone()
        if gt_row and gt_row['gt_count'] >= 5:
            cursor.execute("SELECT is_completed FROM user_achievements WHERE user_id = %s AND achievement_id = 'versatile_mind'", (uid,))
            ach_vm = cursor.fetchone()
            if ach_vm and ach_vm['is_completed'] == 0:
                cursor.execute("UPDATE user_achievements SET is_completed = 1, current_amount = %s WHERE user_id = %s AND achievement_id = 'versatile_mind'", (gt_row['gt_count'], uid))
                cursor.execute("UPDATE user_profiles SET coins = coins + 400 WHERE user_id = %s", (uid,))
                coins_gained += 400
                newly_unlocked.append('versatile_mind')
            else:
                cursor.execute("UPDATE user_achievements SET current_amount = %s WHERE user_id = %s AND achievement_id = 'versatile_mind' AND is_completed = 0", (gt_row['gt_count'], uid))
        elif gt_row:
            cursor.execute("UPDATE user_achievements SET current_amount = %s WHERE user_id = %s AND achievement_id = 'versatile_mind' AND is_completed = 0", (gt_row['gt_count'], uid))

    # 10. Brain Marathon (Complete 10 games in a single day)
    cursor.execute("""
        SELECT COUNT(*) as games_today 
        FROM game_sessions 
        WHERE user_id = %s AND DATE(start_time AT TIME ZONE 'UTC') = CURRENT_DATE
    """, (uid,))
    games_today_row = cursor.fetchone()
    if games_today_row:
        games_today = games_today_row['games_today']
        cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'brain_marathon') ON CONFLICT DO NOTHING", (uid,))
        if games_today >= 10:
            cursor.execute("SELECT is_completed FROM user_achievements WHERE user_id = %s AND achievement_id = 'brain_marathon'", (uid,))
            ach_bm = cursor.fetchone()
            if ach_bm and ach_bm['is_completed'] == 0:
                cursor.execute("UPDATE user_achievements SET is_completed = 1, current_amount = %s WHERE user_id = %s AND achievement_id = 'brain_marathon'", (games_today, uid))
                cursor.execute("UPDATE user_profiles SET coins = coins + 300 WHERE user_id = %s", (uid,))
                coins_gained += 300
                newly_unlocked.append('brain_marathon')
            else:
                cursor.execute("UPDATE user_achievements SET current_amount = %s WHERE user_id = %s AND achievement_id = 'brain_marathon' AND is_completed = 0", (games_today, uid))
        else:
            cursor.execute("UPDATE user_achievements SET current_amount = %s WHERE user_id = %s AND achievement_id = 'brain_marathon' AND is_completed = 0", (games_today, uid))

    # 11. On Fire (7-day login streak)
    cursor.execute("SELECT current_streak FROM user_streaks WHERE user_id = %s", (uid,))
    streak_row = cursor.fetchone()
    if streak_row:
        current_streak = streak_row['current_streak']
        cursor.execute("INSERT INTO user_achievements (user_id, achievement_id) VALUES (%s, 'on_fire') ON CONFLICT DO NOTHING", (uid,))
        if current_streak >= 7:
            cursor.execute("SELECT is_completed FROM user_achievements WHERE user_id = %s AND achievement_id = 'on_fire'", (uid,))
            ach_of = cursor.fetchone()
            if ach_of and ach_of['is_completed'] == 0:
                cursor.execute("UPDATE user_achievements SET is_completed = 1, current_amount = %s WHERE user_id = %s AND achievement_id = 'on_fire'", (current_streak, uid))
                cursor.execute("UPDATE user_profiles SET coins = coins + 750 WHERE user_id = %s", (uid,))
                coins_gained += 750
                newly_unlocked.append('on_fire')
            else:
                cursor.execute("UPDATE user_achievements SET current_amount = %s WHERE user_id = %s AND achievement_id = 'on_fire' AND is_completed = 0", (current_streak, uid))
        else:
            cursor.execute("UPDATE user_achievements SET current_amount = %s WHERE user_id = %s AND achievement_id = 'on_fire' AND is_completed = 0", (current_streak, uid))

    return xp_gained, coins_gained, leveled_up, newly_unlocked

@app.route('/api/submit-metrics', methods=['POST'])
@token_required
def submit_metrics(current_user_id, current_username):
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
            return jsonify({"status": "error", "message": "session_id, reaction_time, accuracy_rate and difficulty_level are required fields."}), 400
            
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
                    cursor.execute("SELECT game_type FROM game_sessions WHERE id = %s", (session_id,))
                    session_row = cursor.fetchone()
                    if session_row:
                        game_type = session_row['game_type']
                        
                if game_type and not cognitive_domain:
                    cognitive_domain = GAME_TO_DOMAIN.get(game_type)
                    
                if error_count is None:
                    error_count = 0
 
                # Insert performance metric with retry for SQLite lock contention
                db_execute_with_retry(
                    cursor,
                    """
                    INSERT INTO performance_metrics 
                    (session_id, reaction_time, accuracy_rate, difficulty_level, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (session_id, reaction_time, accuracy, difficulty, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency)
                )
                
                # Gamification: Award XP and Coins
                cursor.execute("SELECT user_id FROM game_sessions WHERE id = %s", (session_id,))
                user_row = cursor.fetchone()
                
                xp_gained = 0
                coins_gained = 0
                leveled_up = False
                newly_unlocked = []
                
                if user_row:
                    uid = user_row['user_id']
                    try:
                        xp_gained, coins_gained, leveled_up, newly_unlocked = execute_gamification(
                            cursor, uid, reaction_time, accuracy, difficulty, game_type
                        )
                    except Exception as pg_err:
                        import traceback
                        traceback.print_exc()
                        print(f"Gamification update skipped: {pg_err}")
        finally:
            conn.close()

        return jsonify({
            "status": "success", 
            "message": "Metrics recorded",
            "rewards": {
                "xp": xp_gained,
                "coins": coins_gained,
                "leveled_up": leveled_up,
                "newly_unlocked": newly_unlocked
            }
        }), 201
 
    except Exception as e:
        app.logger.error(f"Error in submit_metrics: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

@app.route('/api/user-analytics/<username>', methods=['GET'])
@token_required
def get_user_analytics(current_user_id, current_username, username):
    # Ownership check: users can only view their own analytics
    if current_username != username:
        return jsonify({'status': 'error', 'message': 'Unauthorized: you can only view your own analytics'}), 403

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        target_uid = user['id']
        
        # Fetch metrics grouped by domain
        cursor.execute("""
            SELECT 
                cognitive_domain, 
                AVG(accuracy_rate) as avg_accuracy, 
                AVG(reaction_time) as avg_rt 
            FROM performance_metrics 
            JOIN game_sessions ON performance_metrics.session_id = game_sessions.id 
            WHERE game_sessions.user_id = %s
            GROUP BY cognitive_domain
        """, (target_uid,))
        domain_stats = cursor.fetchall()
        
        # Fetch time series (daily average accuracy/rt)
        cursor.execute("""
            SELECT 
                date(game_sessions.start_time) as day, 
                AVG(accuracy_rate) as avg_accuracy, 
                AVG(reaction_time) as avg_rt
            FROM performance_metrics
            JOIN game_sessions ON performance_metrics.session_id = game_sessions.id
            WHERE game_sessions.user_id = %s
            GROUP BY date(game_sessions.start_time)
            ORDER BY day ASC
            LIMIT 14
        """, (target_uid,))
        timeline_stats = cursor.fetchall()
        
        # Fetch latest archetype
        cursor.execute("""
            SELECT archetype_name, confidence_score, trajectory_msg
            FROM archetype_history 
            WHERE user_id = %s 
            ORDER BY timestamp DESC, id DESC LIMIT 1
        """, (target_uid,))
        latest_archetype_row = cursor.fetchone()
        
        return jsonify({
            "status": "success",
            "domain_stats": [dict(row) for row in domain_stats],
            "timeline_stats": [dict(row) for row in timeline_stats],
            "cognitive_profile": dict(latest_archetype_row) if latest_archetype_row else None
        }), 200
    finally:
        conn.close()



@app.route('/api/submit-metrics/batch', methods=['POST'])
@token_required
@validate_json(SyncOfflineTelemetryRequest)
def submit_metrics_batch(current_user_id, current_username):
    """
    Submits a batch of game metrics telemetry to database in a single transaction.
    """
    try:
        data = request.validated_data.dict()
        
        # Pydantic schema expects a dict with 'telemetry' list
        metrics_list = data.get("telemetry", [])
        
        if not metrics_list:
            return jsonify({"status": "success", "message": "No metrics to record"}), 201
            
        conn = get_db_connection()
        recorded_count = 0
        total_xp = 0
        total_coins = 0
        leveled_up_flag = False
        newly_unlocked_set = set()
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
                            cursor.execute("SELECT game_type FROM game_sessions WHERE id = %s", (session_id,))
                            session_row = cursor.fetchone()
                            if session_row:
                                game_type = session_row['game_type']
                                session_game_types[session_id] = game_type
                    else:
                        session_game_types[session_id] = game_type
                            
                    if game_type and not cognitive_domain:
                        cognitive_domain = GAME_TO_DOMAIN.get(game_type)
                        
                    # Insert metric with retry for SQLite lock contention
                    db_execute_with_retry(
                        cursor,
                        """
                        INSERT INTO performance_metrics 
                        (session_id, reaction_time, accuracy_rate, difficulty_level, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (session_id, reaction_time, accuracy, difficulty, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count, rule_shift_latency_ms, path_efficiency)
                    )
                    
                    cursor.execute("SELECT user_id FROM game_sessions WHERE id = %s", (session_id,))
                    user_row = cursor.fetchone()
                    if user_row:
                        uid = user_row['user_id']
                        try:
                            xp_gained, coins_gained, leveled_up, newly_unlocked = execute_gamification(
                                cursor, uid, reaction_time, accuracy, difficulty, game_type
                            )
                            total_xp += xp_gained
                            total_coins += coins_gained
                            if leveled_up:
                                leveled_up_flag = True
                            newly_unlocked_set.update(newly_unlocked)
                        except Exception as pg_err:
                            import traceback
                            traceback.print_exc()
                            print(f"Gamification update skipped in batch: {pg_err}")
                    recorded_count += 1
        finally:
            conn.close()
            
        return jsonify({
            "status": "success", 
            "message": f"{recorded_count} metrics recorded",
            "rewards": {
                "xp": total_xp,
                "coins": total_coins,
                "leveled_up": leveled_up_flag,
                "newly_unlocked": list(newly_unlocked_set)
            }
        }), 201
        
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
                cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
                user_row = cursor.fetchone()
                if not user_row:
                    return jsonify({"status": "error", "message": f"User '{username}' not found."}), 404
                user_id = user_row['id']
                
                # Fetch latest pre-test
                cursor.execute(
                    """
                    SELECT spatial_visual_score, logical_math_score, attention_score, executive_score 
                    FROM cognitive_assessments 
                    WHERE user_id = %s AND assessment_type = 'pre-test'
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
                    WHERE user_id = %s AND assessment_type = 'post-test'
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
                    VALUES (%s, %s, %s, %s, %s)
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
                WHERE gs.user_id = %s
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
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
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
            WHERE gs.user_id = %s
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
        cursor.execute("SELECT id FROM game_sessions WHERE id = %s", (session_id,))
        if not cursor.fetchone():
            return jsonify({"status": "error", "message": f"Session ID {session_id} not found."}), 404

        cursor.execute(
            """
            SELECT id, reaction_time, accuracy_rate, difficulty_level, recorded_at, rule_shift_latency_ms, path_efficiency
            FROM performance_metrics
            WHERE session_id = %s
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
            WHERE u.username = %s
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
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
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
            WHERE ah.user_id = %s
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
                    WHERE u.username = %s AND pm.{var1} IS NOT NULL AND pm.{var2} IS NOT NULL
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
            WHERE u.username = %s OR u.username LIKE 'clinical_subject_%'
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

        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            with conn:
                cursor.execute("INSERT INTO users (username) VALUES (%s)", (username,))
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
        
        user_id = user['id']

        cursor.execute("SELECT id, domain, metric_type, target_value, is_completed FROM training_goals WHERE user_id = %s", (user_id,))
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
            WHERE gs.user_id = %s
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
                    cursor.execute("UPDATE training_goals SET is_completed = 1 WHERE id = %s", (gid,))
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

                cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
                user = cursor.fetchone()
                if not user:
                    cursor.execute("INSERT INTO users (username) VALUES (%s)", (username,))
                    cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
                    user = cursor.fetchone()

                user_id = user['id']

                cursor.execute(
                    """
                    INSERT INTO training_goals (user_id, domain, metric_type, target_value, is_completed)
                    VALUES (%s, %s, %s, %s, 0)
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
            cursor.execute("DELETE FROM training_goals WHERE id = %s", (goal_id,))
            if cursor.rowcount == 0:
                return jsonify({"status": "error", "message": f"Training goal with ID {goal_id} not found."}), 404
        return jsonify({"status": "success", "message": "Goal deleted successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error in delete_training_goal: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()



import threading
import time

# Global model training state tracking
model_training_state = {
    "status": "idle", # "idle", "training", "error"
    "error_message": None,
    "last_trained_at": None,
    "last_retrain_metrics": None
}

@app.route('/api/model/status', methods=['GET'])
def get_model_status():
    try:
        from model import SKLEARN_AVAILABLE
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(DISTINCT session_id) FROM performance_metrics")
            dataset_size = cursor.fetchone()[0]
        finally:
            conn.close()

        hyperparams = None
        rf_classes = None
        if SKLEARN_AVAILABLE and archetype_classifier.model is not None:
            hyperparams = archetype_classifier.model.get_params()
            rf_classes = list(archetype_classifier.model.classes_)

        return jsonify({
            "status": "success",
            "is_sklearn_available": SKLEARN_AVAILABLE,
            "is_loaded_from_disk": archetype_classifier.is_loaded_from_disk,
            "has_rf_model": archetype_classifier.model is not None,
            "has_clustering_model": archetype_classifier.clustering_model is not None,
            "has_scaler": archetype_classifier.scaler is not None,
            "hyperparameters": hyperparams,
            "rf_classes": rf_classes,
            "dataset_size": dataset_size,
            "training_status": model_training_state["status"],
            "training_error": model_training_state["error_message"],
            "last_trained_at": model_training_state["last_trained_at"],
            "last_retrain_metrics": model_training_state["last_retrain_metrics"]
        }), 200
    except Exception as e:
        app.logger.error(f"Error in get_model_status: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


@app.route('/api/model/retrain', methods=['POST'])
def retrain_model():
    if model_training_state["status"] == "training":
        return jsonify({"status": "error", "message": "Model retraining is already in progress."}), 400

    def run_training():
        model_training_state["status"] = "training"
        model_training_state["error_message"] = None
        try:
            from train_model import train_retargeted_classifier
            res = train_retargeted_classifier()
            if res and res.get("status") == "success":
                # Reload classifier instance to fetch newly serialized pickle files
                archetype_classifier.__init__()
                model_training_state["status"] = "idle"
                model_training_state["last_trained_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
                model_training_state["last_retrain_metrics"] = res
            else:
                model_training_state["status"] = "error"
                model_training_state["error_message"] = "Model retraining pipeline completed with error or insufficient data samples."
        except Exception as e:
            model_training_state["status"] = "error"
            model_training_state["error_message"] = str(e)

    threading.Thread(target=run_training).start()
    return jsonify({"status": "success", "message": "Model retraining started in background."}), 202


@app.route('/api/model/clusters', methods=['GET'])
def get_model_clusters():
    try:
        import numpy as np
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            query = """
                SELECT 
                    gs.id AS session_id,
                    u.username,
                    gs.game_type,
                    AVG(pm.accuracy_rate) AS avg_acc,
                    AVG(pm.reaction_time) AS avg_rt,
                    AVG(pm.hesitation_ms) AS avg_hes,
                    AVG(pm.spam_click_count) AS avg_spam,
                    AVG(pm.rule_shift_latency_ms) AS avg_rule,
                    AVG(pm.path_efficiency) AS avg_path
                FROM game_sessions gs
                JOIN users u ON gs.user_id = u.id
                JOIN performance_metrics pm ON gs.id = pm.session_id
                GROUP BY gs.id
                ORDER BY gs.id ASC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
        finally:
            conn.close()

        user_sessions = {}
        for r in rows:
            uname = r["username"]
            if uname not in user_sessions:
                user_sessions[uname] = []
            user_sessions[uname].append(r)

        data_points = []
        X_features = []

        for uname, sessions in user_sessions.items():
            history_acc = []
            history_rt = []
            for s in sessions:
                avg_acc = s["avg_acc"]
                avg_rt = s["avg_rt"]
                history_acc.append(avg_acc)
                history_rt.append(avg_rt)

                acc_slope = calculate_ols_slope(history_acc)
                rt_slope = calculate_ols_slope(history_rt)

                avg_hes = s["avg_hes"] if s["avg_hes"] is not None else 0.0
                avg_spam = s["avg_spam"] if s["avg_spam"] is not None else 0.0
                avg_path = s["avg_path"] if s["avg_path"] is not None else 1.0

                feature_vector = [avg_acc, avg_rt, acc_slope, rt_slope, avg_hes, avg_spam, avg_path]
                X_features.append(feature_vector)

                data_points.append({
                    "session_id": s["session_id"],
                    "username": uname,
                    "game_type": s["game_type"],
                    "accuracy": round(avg_acc, 4),
                    "reaction_time": round(avg_rt, 2),
                    "acc_slope": round(acc_slope, 4),
                    "rt_slope": round(rt_slope, 2),
                    "hesitation": round(avg_hes, 2),
                    "spam_clicks": round(avg_spam, 2),
                    "path_efficiency": round(avg_path, 4)
                })

        if not data_points:
            return jsonify({"status": "success", "data_points": []}), 200

        from model import SKLEARN_AVAILABLE
        if SKLEARN_AVAILABLE and archetype_classifier.clustering_model is not None and archetype_classifier.scaler is not None:
            X_arr = np.array(X_features)
            X_scaled = archetype_classifier.scaler.transform(X_arr)
            cluster_labels = archetype_classifier.clustering_model.predict(X_scaled)

            centroids = archetype_classifier.clustering_model.cluster_centers_
            centroids_orig = archetype_classifier.scaler.inverse_transform(centroids)

            cluster_scores = []
            for i in range(3):
                mean_acc = centroids_orig[i][0]
                mean_rt = centroids_orig[i][1]
                score = mean_acc * 1000.0 - mean_rt
                cluster_scores.append((score, i))
            cluster_scores.sort()

            cluster_mapping = {
                cluster_scores[0][1]: "High Fatigue",
                cluster_scores[1][1]: "Plateauing",
                cluster_scores[2][1]: "Fast Learner"
            }

            for idx, label in enumerate(cluster_labels):
                data_points[idx]["cluster"] = cluster_mapping[label]
        else:
            for dp in data_points:
                acc_slope = dp["acc_slope"]
                rt_slope = dp["rt_slope"]
                if acc_slope > 0.01 and rt_slope < -10.0:
                    dp["cluster"] = "Fast Learner"
                elif acc_slope < -0.01 and rt_slope > 10.0:
                    dp["cluster"] = "High Fatigue"
                else:
                    dp["cluster"] = "Plateauing"

        return jsonify({
            "status": "success",
            "data_points": data_points
        }), 200
    except Exception as e:
        app.logger.error(f"Error in get_model_clusters: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


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





@app.route('/api/admin/retrain', methods=['POST'])
@token_required
def admin_retrain(current_user_id, current_username):
    """
    Dynamically rebuilds the RandomForest, KMeans, and IsolationForest models
    using live database telemetry.
    """
    try:
        from train_model import train_retargeted_classifier
        
        metrics = train_retargeted_classifier()
        if not metrics:
            return jsonify({"status": "error", "message": "Failed to retrain models. Check database size or logs."}), 500
            
        # Dynamically reload the models in the app memory
        from model import archetype_classifier
        archetype_classifier.__init__()  # Re-init will pick up new .pkls
        
        return jsonify(metrics), 200
        
    except Exception as e:
        app.logger.error(f"Error in admin_retrain: {e}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)

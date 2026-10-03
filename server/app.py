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
from flask_compress import Compress
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool
import os
import time
import bcrypt
from utils import safe_float
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

def create_app(test_config=None):
    app = Flask(__name__)
    Compress(app)
    # CORS restricts your React/Phaser frontend to authorized origins
    cors_origins = os.environ.get("CORS_ORIGINS")
    if cors_origins:
        CORS(app, supports_credentials=True, origins=cors_origins.split(","))
    else:
        CORS(app, supports_credentials=True)

    if test_config is None:
        db_url = os.environ.get("DATABASE_URL")
        if db_url:
            app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://")
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    else:
        app.config.update(test_config)

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
    from routes.admin import admin_bp
    app.register_blueprint(admin_bp)
    app.register_blueprint(ml_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Lightweight health probe for frontend polling."""
        return jsonify({"status": "ok"}), 200
        
    return app

import jwt
from functools import wraps
import datetime
import hashlib
from schemas import validate_json, StartSessionRequest, SubmitMetricsRequest, DDARequest, SubmitAssessmentRequest, SyncOfflineTelemetryRequest

from auth import token_required

# Auth routes moved to server/routes/auth.py



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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pin_hash VARCHAR(64) DEFAULT NULL,
            course VARCHAR(255) DEFAULT NULL,
            age INTEGER DEFAULT NULL,
            gender VARCHAR(50) DEFAULT NULL
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
            item_metadata JSONB DEFAULT NULL,
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

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN course VARCHAR(255) DEFAULT NULL")
        cursor.execute("ALTER TABLE users ADD COLUMN age INTEGER DEFAULT NULL")
        cursor.execute("ALTER TABLE users ADD COLUMN gender VARCHAR(50) DEFAULT NULL")
        print("[DB Migration] Added demographics columns to users")
    except psycopg2.Error:
        pass

    try:
        cursor.execute("ALTER TABLE cognitive_assessments ADD COLUMN item_metadata JSON DEFAULT NULL")
        print("[DB Migration] Added item_metadata column to cognitive_assessments")
    except psycopg2.Error:
        pass

    try:
        cursor.execute("ALTER TABLE cognitive_assessments ADD COLUMN ai_feedback TEXT DEFAULT NULL")
        print("[DB Migration] Added ai_feedback column to cognitive_assessments")
    except psycopg2.Error:
        pass

    # Create indexes for query optimizations
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_performance_metrics_session ON performance_metrics (session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions (user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cognitive_assessments_user ON cognitive_assessments (user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_performance_metrics_domain ON performance_metrics (cognitive_domain)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded ON performance_metrics (recorded_at)")

    
    # Admin Panel Migrations
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active'")
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'student'")
        print("[DB Migration] Added status and role columns to users")
    except psycopg2.Error:
        pass

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_config (
            id SERIAL PRIMARY KEY,
            config_key VARCHAR(255) NOT NULL UNIQUE,
            config_value VARCHAR(255) NOT NULL,
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_announcements (
            id SERIAL PRIMARY KEY,
            message TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            admin_username VARCHAR(255) NOT NULL,
            action_taken VARCHAR(255) NOT NULL,
            target_user VARCHAR(255),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bug_reports (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            message TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_module_config (
            id SERIAL PRIMARY KEY,
            game_type VARCHAR(255) NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT TRUE
        )
    ''')

    conn.commit()
    conn.close()

app = create_app()

# Run database schema migration on startup if not testing
if os.environ.get("FLASK_ENV") != "testing":
    try:
        init_db()
    except Exception as e:
        print(f"[DB Init Error] {e}")



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
    import redis
    import json
    redis_url = os.environ.get("REDIS_URL", "memory://")
    redis_client = None
    if redis_url != "memory://":
        try:
            redis_client = redis.from_url(redis_url)
            cached_metrics = redis_client.get("cognicore:global_metrics")
            if cached_metrics:
                return jsonify(json.loads(cached_metrics)), 200
        except Exception:
            pass

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        

        # Total sessions
        cursor.execute("SELECT COUNT(*) as cnt FROM game_sessions")
        total_sessions = cursor.fetchone()["cnt"]

        # Total Users
        cursor.execute("SELECT COUNT(*) as cnt FROM users")
        total_registered_users = cursor.fetchone()["cnt"]

        # Active Users (last 7 days)
        cursor.execute("SELECT COUNT(*) as cnt FROM user_streaks WHERE last_login_date >= CURRENT_DATE - INTERVAL \'7 days\'")
        active_users = cursor.fetchone()["cnt"]

        
        # Average score (based on accuracy rate * 100)
        cursor.execute("SELECT AVG(accuracy_rate) as avg_val FROM performance_metrics")
        row = cursor.fetchone()
        avg_acc = row["avg_val"] if row else None
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
            
        # Archetype Distribution
        cursor.execute("""
            SELECT archetype_name, COUNT(*) as cnt 
            FROM (
                SELECT DISTINCT ON (user_id) archetype_name 
                FROM cognitive_profiles 
                ORDER BY user_id, updated_at DESC
            ) sub 
            WHERE archetype_name IS NOT NULL
            GROUP BY archetype_name
        """)
        archetype_rows = cursor.fetchall()
        archetype_distribution = {row['archetype_name']: row['cnt'] for row in archetype_rows}
            
        response_data = {
            "status": "success",
            "total_sessions": total_sessions,
            "total_registered_users": total_registered_users,
            "active_users": active_users,
            "system_health": "Online",
            "average_score": average_score,
            "domain_breakdown": domain_breakdown,
            "archetype_distribution": archetype_distribution,
            "cached": False
        }
        
        if redis_client:
            try:
                # Cache for 5 minutes
                redis_client.setex("cognicore:global_metrics", 300, json.dumps(response_data))
            except Exception:
                pass
                
        return jsonify(response_data), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_metrics: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    finally:
        conn.close()


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5000)

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

DB_PATH = 'cognicore.db'

# 4-Tier Cognitive Domain Categorization Framework Configuration Mapping
GAME_TO_DOMAIN = {
    "MemoryMatch": "spatial_visual_memory",
    "memory_match": "spatial_visual_memory",
    "LogicLink": "logical_mathematical",
    "logic_link": "logical_mathematical",
    "EquationBalance": "logical_mathematical",
    "equation_balance": "logical_mathematical",
    "SpeedTap": "reflexes_and_focus",
    "speed_tap": "reflexes_and_focus",
    "FocusFinder": "reflexes_and_focus",
    "focus_finder": "reflexes_and_focus",
    "MazeEscape": "executive_strategy",
    "maze_escape": "executive_strategy",
    "MatrixRecall": "spatial_visual_memory",
    "matrix_recall": "spatial_visual_memory",
    "StroopShift": "reflexes_and_focus",
    "stroop_shift": "reflexes_and_focus",
    "MentalFlex": "executive_strategy",
    "mental_flex": "executive_strategy"
}

# Helper function to get database connection
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Programmatic Schema Migration / Initialization
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
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
            "/api/submit-metrics": "POST - Record player performance metrics",
            "/api/dda": "POST - Query active feedback loop DDA updates & cognitive profile classifications"
        }
    }), 200

@app.route('/api/start-session', methods=['POST'])
def start_session():
    """
    Starts a new game session. If the user doesn't exist, it creates one.
    Returns: session_id, user_id, and initial DDA game parameters.
    """
    try:
        data = request.get_json() or {}
        username = data.get('username', 'default_player')
        game_type = data.get('game_type', 'SpeedTap')
        
        conn = get_db_connection()
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
            "INSERT INTO game_sessions (user_id, game_type) VALUES (?, ?)",
            (user_id, game_type)
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
            ORDER BY pm.timestamp DESC, pm.id DESC LIMIT 1
        """
        cursor.execute(query, [user_id, domain] + domain_games)
        row = cursor.fetchone()
        if row:
            initial_difficulty = row['difficulty_level']
        else:
            initial_difficulty = 1
            
        conn.commit()
        conn.close()
        
        # Get initial DDA parameters
        initial_params = calculate_dda_parameters(initial_difficulty, game_type)
        
        return jsonify({
            "status": "success",
            "session_id": session_id,
            "user_id": user_id,
            "dda_parameters": initial_params
        }), 201
        
    except Exception as e:
        app.logger.error(f"Error in start_session: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

@app.route('/api/dda', methods=['POST'])
def adjust_difficulty():
    """
    Analyzes recent performance telemetry for a session, updates difficulty parameters, 
    and classifies/updates the user's cognitive profile archetype.
    """
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id')
        if not session_id:
            return jsonify({"status": "error", "message": "session_id is required"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify session and get user_id and game_type
        cursor.execute("SELECT user_id, game_type FROM game_sessions WHERE id = ?", (session_id,))
        session = cursor.fetchone()
        if not session:
            conn.close()
            return jsonify({"status": "error", "message": "Invalid session_id"}), 404
        user_id = session['user_id']
        game_type = session['game_type']
        
        domain = GAME_TO_DOMAIN.get(game_type, "reflexes_and_focus")

        # Fetch the last 5 performance metrics for this session and specific cognitive domain
        cursor.execute(
            """
            SELECT reaction_time_ms, accuracy_rate, difficulty_level 
            FROM performance_metrics 
            WHERE session_id = ? AND (cognitive_domain = ? OR game_type = ?)
            ORDER BY timestamp DESC, id DESC LIMIT 5
            """,
            (session_id, domain, game_type)
        )
        metrics = cursor.fetchall()
        
        # Fallback if no matching records found with domain
        if not metrics:
            cursor.execute(
                """
                SELECT reaction_time_ms, accuracy_rate, difficulty_level 
                FROM performance_metrics 
                WHERE session_id = ? 
                ORDER BY timestamp DESC, id DESC LIMIT 5
                """,
                (session_id,)
            )
            metrics = cursor.fetchall()
        
        # Default difficulty configuration
        if not metrics:
            conn.close()
            return jsonify({
                "status": "success",
                "dda_parameters": calculate_dda_parameters(1, game_type)
            }), 200
            
        # Calculate averages
        avg_rt = sum(m['reaction_time_ms'] for m in metrics) / len(metrics)
        avg_accuracy = sum(m['accuracy_rate'] for m in metrics) / len(metrics)
        current_difficulty = metrics[0]['difficulty_level']
        
        # Strict 3-Tier DDA rules matching professor's specifications
        new_difficulty = current_difficulty
        if avg_accuracy > 0.90:
            # Performance Tier 1 (Accuracy > 90%): Upgrade difficulty level
            new_difficulty = min(5, current_difficulty + 1)
        elif avg_accuracy < 0.70:
            # Performance Tier 3 (Accuracy < 70%): De-escalate difficulty level
            new_difficulty = max(1, current_difficulty - 1)
        # Tier 2 (Accuracy 70% - 90%): Stagnate current challenge (equilibrium)
            
        # Calculate new parameters
        dda_params = calculate_dda_parameters(new_difficulty, game_type)
        
        # Cognitive Profiling Archetype Determination using Random Forest
        # Features: avg_accuracy, avg_rt_ms, error_rate (1.0 - avg_accuracy)
        error_rate = 1.0 - avg_accuracy
        pred_res = archetype_classifier.predict(avg_accuracy, avg_rt, error_rate)
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
            
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success",
            "dda_parameters": dda_params,
            "cognitive_profile": {
                "archetype": archetype,
                "confidence_score": confidence
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
        
        session_id = data.get('session_id')
        
        # Support reaction_time and reaction_time_ms
        reaction_time = data.get('reaction_time') if data.get('reaction_time') is not None else data.get('reaction_time_ms')
        
        # Support accuracy_rate and accuracy
        accuracy = data.get('accuracy_rate') if data.get('accuracy_rate') is not None else data.get('accuracy')
        
        # Support difficulty and difficulty_level
        difficulty = data.get('difficulty') if data.get('difficulty') is not None else data.get('difficulty_level')
        
        cognitive_domain = data.get('cognitive_domain')
        game_type = data.get('game_type')
        error_count = data.get('error_count')
        hesitation_ms = data.get('hesitation_ms', 0.0)
        spam_click_count = data.get('spam_click_count', 0)
        
        if session_id is None or reaction_time is None or accuracy is None or difficulty is None:
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        # Infer game_type and cognitive_domain if not provided
        conn = get_db_connection()
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
            (session_id, reaction_time_ms, accuracy_rate, difficulty_level, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (session_id, reaction_time, accuracy, difficulty, cognitive_domain, game_type, error_count, hesitation_ms, spam_click_count)
        )
        conn.commit()
        conn.close()

        return jsonify({"status": "success", "message": "Metrics recorded"}), 201

    except Exception as e:
        app.logger.error(f"Error in submit_metrics: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

@app.route('/api/evaluate', methods=['POST'])
def evaluate_thesis():
    """
    Pillar 1: Empirical Cognitive Improvement (Pretest-Posttest Analysis).
    Calculates individual and average improvement rates, and performs a Paired t-test
    to determine if improvements are statistically significant.
    """
    try:
        data = request.get_json() or {}
        pretest = data.get('pretest_scores')
        posttest = data.get('posttest_scores')
        
        if not pretest or not posttest or len(pretest) != len(posttest):
            return jsonify({
                "status": "error", 
                "message": "Both pretest_scores and posttest_scores lists are required and must be of equal length."
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
        if SCIPY_AVAILABLE:
            t_stat, p_val = stats.ttest_rel(posttest, pretest)
        else:
            # Fallback manual calculation
            mean_diff = sum(diffs) / n
            variance_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1)
            sd_diff = variance_diff ** 0.5
            se_diff = sd_diff / (n ** 0.5)
            t_stat = mean_diff / se_diff if se_diff != 0 else 0.0
            # Rough lookup approximation for p-value (df = n - 1)
            # Just for safety if scipy is not installed
            p_val = 0.01 if abs(t_stat) > 2.0 else 0.45
            
        # Handle nan/inf cases in float formatting
        import math
        if math.isnan(t_stat) or math.isinf(t_stat):
            t_stat = 0.0
        if math.isnan(p_val) or math.isinf(p_val):
            p_val = 1.0
            
        significant = p_val < 0.05
        
        return jsonify({
            "status": "success",
            "sample_size": n,
            "mean_pretest": round(mean_pre, 2),
            "mean_posttest": round(mean_post, 2),
            "mean_difference": round(mean_post - mean_pre, 2),
            "overall_improvement_rate_pct": round(overall_improvement_rate, 2),
            "t_statistic": round(t_stat, 4),
            "p_value": round(p_val, 6),
            "statistically_significant": bool(significant),
            "hypothesis_result": "Reject Null Hypothesis: Significant improvement detected!" if significant else "Fail to Reject Null Hypothesis: Improvement is not statistically significant."
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in evaluate_thesis: {e}")
        return jsonify({"status": "error", "message": f"Statistical engine error: {str(e)}"}), 500

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
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO iso_evaluations 
            (functionality_score, usability_score, reliability_score, efficiency_score, ux_score) 
            VALUES (?, ?, ?, ?, ?)
            """,
            scores
        )
        conn.commit()
        conn.close()
        
        return jsonify({"status": "success", "message": "ISO 25010 evaluation recorded successfully."}), 201
        
    except Exception as e:
        app.logger.error(f"Error in submit_iso_evaluation: {e}")
        return jsonify({"status": "error", "message": f"Database or server error: {str(e)}"}), 500

@app.route('/api/iso-evaluations', methods=['GET'])
def get_iso_evaluations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, functionality_score, usability_score, reliability_score, efficiency_score, ux_score, created_at FROM iso_evaluations ORDER BY created_at DESC"
        )
        rows = cursor.fetchall()
        conn.close()
        
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

@app.route('/api/iso-evaluations/summary', methods=['GET'])
def get_iso_evaluations_summary():
    try:
        conn = get_db_connection()
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
        conn.close()
        
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

@app.route('/api/cohort-db-scores', methods=['GET'])
def get_cohort_db_scores():
    try:
        conn = get_db_connection()
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
                
        conn.close()
        
        return jsonify({
            "status": "success",
            "pretest_scores": pretest_scores,
            "posttest_scores": posttest_scores,
            "count": len(pretest_scores)
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_cohort_db_scores: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500

@app.route('/api/export-csv', methods=['GET'])
def export_csv():
    try:
        from flask import Response
        import csv
        import io
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                pm.id AS metric_id,
                pm.session_id,
                gs.user_id,
                u.username,
                pm.cognitive_domain,
                pm.game_type,
                pm.reaction_time_ms,
                pm.accuracy_rate,
                pm.difficulty_level,
                pm.error_count,
                pm.hesitation_ms,
                pm.spam_click_count,
                pm.timestamp
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            ORDER BY pm.timestamp DESC, pm.id DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()

        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers matching professor telemetry specifications
        writer.writerow([
            "Metric ID", "Session ID", "User ID", "Username", 
            "Cognitive Domain", "Game Type", "Reaction Time (ms)", 
            "Accuracy Rate", "Difficulty Level", "Error Count", 
            "Hesitation (ms)", "Spam Click Count", "Timestamp"
        ])
        
        for r in rows:
            writer.writerow([
                r["metric_id"], r["session_id"], r["user_id"], r["username"],
                r["cognitive_domain"], r["game_type"], r["reaction_time_ms"],
                r["accuracy_rate"], r["difficulty_level"], r["error_count"],
                r["hesitation_ms"], r["spam_click_count"], r["timestamp"]
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

@app.route('/api/user-session-history/<username>', methods=['GET'])
def get_user_session_history(username):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({"status": "success", "sessions": []}), 200
        user_id = user['id']
        
        # Fetch sessions
        cursor.execute(
            """
            SELECT id, game_type, start_time 
            FROM game_sessions 
            WHERE user_id = ? 
            ORDER BY start_time DESC
            """,
            (user_id,)
        )
        sessions_rows = cursor.fetchall()
        
        sessions = []
        for s in sessions_rows:
            sid = s['id']
            # Get summary stats for this session
            cursor.execute(
                """
                SELECT 
                    AVG(reaction_time_ms) as avg_rt,
                    AVG(accuracy_rate) as avg_acc,
                    MAX(difficulty_level) as max_diff,
                    COUNT(*) as count
                FROM performance_metrics
                WHERE session_id = ?
                """,
                (sid,)
            )
            stats = cursor.fetchone()
            
            sessions.append({
                "session_id": sid,
                "game_type": s["game_type"],
                "start_time": s["start_time"],
                "avg_rt": round(stats["avg_rt"], 2) if stats["avg_rt"] is not None else 0.0,
                "avg_acc": round(stats["avg_acc"], 4) if stats["avg_acc"] is not None else 0.0,
                "max_diff": stats["max_diff"] if stats["max_diff"] is not None else 1,
                "rounds_count": stats["count"]
            })
            
        conn.close()
        return jsonify({"status": "success", "sessions": sessions}), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_user_session_history: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500

@app.route('/api/session-metrics/<int:session_id>', methods=['GET'])
def get_session_metrics(session_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            SELECT id, reaction_time_ms, accuracy_rate, difficulty_level, timestamp
            FROM performance_metrics
            WHERE session_id = ?
            ORDER BY id ASC
            """,
            (session_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        
        metrics = []
        for r in rows:
            metrics.append({
                "metric_id": r["id"],
                "reaction_time_ms": r["reaction_time_ms"],
                "accuracy_rate": r["accuracy_rate"],
                "difficulty_level": r["difficulty_level"],
                "timestamp": r["timestamp"]
            })
            
        return jsonify({"status": "success", "session_id": session_id, "metrics": metrics}), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_session_metrics: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500

@app.route('/api/cohort-comparison/<username>', methods=['GET'])
def get_cohort_comparison(username):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get active user averages
        cursor.execute(
            """
            SELECT 
                AVG(pm.reaction_time_ms) as avg_rt,
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
                AVG(pm.reaction_time_ms) as avg_rt,
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
        
        conn.close()
        return jsonify({
            "status": "success",
            "username": username,
            "user_averages": {
                "reaction_time_ms": user_rt,
                "accuracy_rate": user_acc
            },
            "cohort_averages": {
                "reaction_time_ms": cohort_rt,
                "accuracy_rate": cohort_acc
            }
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error in get_cohort_comparison: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500

@app.route('/api/archetype-progression/<username>', methods=['GET'])
def get_archetype_progression(username):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            conn.close()
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
        conn.close()
        
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


if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. Please make sure it exists.")
    
    app.run(debug=True, port=5000)
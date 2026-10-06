-- Phase 1: Core Tables Migration from SQLite to PostgreSQL
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pin_hash VARCHAR(64),
    supabase_uid VARCHAR(36),
    course VARCHAR(255),
    age INTEGER,
    gender VARCHAR(50),
    pwd_status VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    role VARCHAR(50) DEFAULT 'student'
);

CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_type VARCHAR(255) NOT NULL,
    game_mode VARCHAR(50) DEFAULT 'timed',
    current_smooth_difficulty REAL DEFAULT 1.0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
    reaction_time REAL,
    accuracy_rate REAL,
    difficulty_level INTEGER,
    cognitive_domain VARCHAR(255),
    game_type VARCHAR(255),
    error_count INTEGER DEFAULT 0,
    hesitation_ms REAL DEFAULT 0.0,
    spam_click_count INTEGER DEFAULT 0,
    rule_shift_latency_ms REAL,
    path_efficiency REAL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cognitive_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    archetype_name VARCHAR(255),
    confidence_score REAL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iso_evaluations (
    id SERIAL PRIMARY KEY,
    functionality_score INTEGER NOT NULL,
    usability_score INTEGER NOT NULL,
    reliability_score INTEGER NOT NULL,
    efficiency_score INTEGER NOT NULL,
    ux_score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cognitive_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) CHECK(assessment_type IN ('pre-test', 'post-test')),
    spatial_visual_score REAL NOT NULL,
    logical_math_score REAL NOT NULL,
    attention_score REAL NOT NULL,
    executive_score REAL NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS archetype_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
    archetype_name VARCHAR(255) NOT NULL,
    confidence_score REAL NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    metric_type VARCHAR(255) NOT NULL,
    target_value REAL NOT NULL,
    is_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phase 2: Gamification Tables
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    coins INTEGER DEFAULT 0,
    equipped_avatar VARCHAR(255) DEFAULT 'default_avatar',
    equipped_banner VARCHAR(255) DEFAULT 'default_banner',
    equipped_theme VARCHAR(255) DEFAULT 'theme-blue',
    reduce_flashes BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK(item_type IN ('avatar', 'banner', 'theme')),
    item_id VARCHAR(255) NOT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    target_amount INTEGER NOT NULL,
    current_amount INTEGER DEFAULT 0,
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at DATE DEFAULT CURRENT_DATE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session ON performance_metrics (session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_assessments_user ON cognitive_assessments (user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_domain ON performance_metrics (cognitive_domain);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded ON performance_metrics (recorded_at);

-- Phase 3: Security & RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE iso_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE archetype_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Allow read-only public access to user_profiles so Leaderboard Realtime works
DROP POLICY IF EXISTS "Allow public read-only access to user_profiles" ON user_profiles;
CREATE POLICY "Allow public read-only access to user_profiles" ON user_profiles FOR SELECT USING (true);

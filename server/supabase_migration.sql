-- =========================================================================
-- CogniCore PostgreSQL / Supabase Canonical Schema Migration
-- Aligned with server/models.py, server/app.py, and live Supabase schema.
-- Safe to execute repeatedly (idempotent CREATE IF NOT EXISTS / ALTER IF NOT EXISTS).
-- =========================================================================

-- 1. Core Identity & Auth
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    pin_hash VARCHAR(255) DEFAULT NULL,
    supabase_uid VARCHAR(36) DEFAULT NULL,
    course VARCHAR(255) DEFAULT NULL,
    age INTEGER DEFAULT NULL,
    gender VARCHAR(50) DEFAULT NULL,
    pwd_status VARCHAR(255) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'active',
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Gameplay Sessions & Telemetry
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

-- 3. Cognitive Profiling & Research Evaluation
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
    assessment_type VARCHAR(50) CHECK (assessment_type IN ('pre-test', 'post-test')),
    spatial_visual_score REAL NOT NULL,
    logical_math_score REAL NOT NULL,
    attention_score REAL NOT NULL,
    executive_score REAL NOT NULL,
    item_metadata JSON DEFAULT NULL,
    ai_feedback TEXT DEFAULT NULL,
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

-- Legacy compatibility table preserved for existing Supabase deployments
CREATE TABLE IF NOT EXISTS training_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    target_value REAL NOT NULL,
    is_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Gamification, Cosmetics & Engagement
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    coins INTEGER DEFAULT 0,
    equipped_avatar VARCHAR(255) DEFAULT 'default_avatar',
    equipped_banner VARCHAR(255) DEFAULT 'default_banner',
    equipped_theme VARCHAR(255) DEFAULT 'theme-blue',
    equipped_visualizer VARCHAR(255) DEFAULT 'default_visualizer',
    equipped_title VARCHAR(255) DEFAULT 'default-title',
    reduce_flashes BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('avatar', 'banner', 'theme', 'visualizer', 'title')),
    item_id VARCHAR(255) NOT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    target_amount INTEGER NOT NULL,
    current_amount INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    reward_coins INTEGER DEFAULT 100,
    created_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(255) NOT NULL,
    current_amount INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS user_streaks (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_login_date DATE,
    current_streak INTEGER DEFAULT 1,
    longest_streak INTEGER DEFAULT 1
);

-- 5. Administration, Configuration & Diagnostics
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_announcements (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_username VARCHAR(255) NOT NULL,
    action_taken VARCHAR(255) NOT NULL,
    target_user VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bug_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_module_config (
    id SERIAL PRIMARY KEY,
    game_type VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- =========================================================================
-- Idempotent Column & Constraint Reconciliation for Existing Deployments
-- =========================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_uid VARCHAR(36) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS course VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pwd_status VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';

ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS game_mode VARCHAR(50) DEFAULT 'timed';
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS current_smooth_difficulty REAL DEFAULT 1.0;

ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS cognitive_domain VARCHAR(255);
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS game_type VARCHAR(255);
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS hesitation_ms REAL DEFAULT 0.0;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS spam_click_count INTEGER DEFAULT 0;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS rule_shift_latency_ms REAL;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS path_efficiency REAL;

ALTER TABLE cognitive_assessments ADD COLUMN IF NOT EXISTS item_metadata JSON DEFAULT NULL;
ALTER TABLE cognitive_assessments ADD COLUMN IF NOT EXISTS ai_feedback TEXT DEFAULT NULL;

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS equipped_visualizer VARCHAR(255) DEFAULT 'default_visualizer';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS equipped_title VARCHAR(255) DEFAULT 'default-title';

ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS reward_coins INTEGER DEFAULT 100;

DO $$
BEGIN
    ALTER TABLE user_inventory DROP CONSTRAINT IF EXISTS user_inventory_item_type_check;
    ALTER TABLE user_inventory
        ADD CONSTRAINT user_inventory_item_type_check
        CHECK (item_type IN ('avatar', 'banner', 'theme', 'visualizer', 'title'));
END $$;

-- =========================================================================
-- Query Performance Indexes
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions (user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session ON performance_metrics (session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics (session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_domain ON performance_metrics (cognitive_domain);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded ON performance_metrics (recorded_at);
CREATE INDEX IF NOT EXISTS idx_cognitive_assessments_user ON cognitive_assessments (user_id);
CREATE INDEX IF NOT EXISTS idx_archetype_history_user_id ON archetype_history (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_training_goals_user_id ON training_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements (user_id);

-- =========================================================================
-- Row Level Security (RLS)
-- Note: Flask/psycopg2 connects as database owner/service role and bypasses RLS.
-- =========================================================================
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
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_module_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = current_schema()
          AND tablename = 'user_profiles'
          AND policyname = 'Allow public read-only access to user_profiles'
    ) THEN
        CREATE POLICY "Allow public read-only access to user_profiles"
            ON user_profiles FOR SELECT USING (true);
    END IF;
END $$;

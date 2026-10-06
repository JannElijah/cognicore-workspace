-- Supabase Performance Migration
-- These indexes prevent Full Table Scans when querying user analytics and game sessions.

CREATE INDEX IF NOT EXISTS idx_game_sessions_userid ON game_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_sessionid ON performance_metrics (session_id);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_recorded_at ON performance_metrics (recorded_at);
CREATE INDEX IF NOT EXISTS idx_archetype_history_userid ON archetype_history (user_id);
CREATE INDEX IF NOT EXISTS idx_archetype_history_timestamp ON archetype_history (timestamp);
CREATE INDEX IF NOT EXISTS idx_training_goals_userid ON training_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_userid ON daily_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_created_at ON daily_tasks (created_at);
CREATE INDEX IF NOT EXISTS idx_user_inventory_userid ON user_inventory (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_userid ON user_achievements (user_id);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_domain ON performance_metrics (cognitive_domain);

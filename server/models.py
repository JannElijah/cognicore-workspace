from database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    pin_hash = db.Column(db.String(255))
    supabase_uid = db.Column(db.String(36))
    course = db.Column(db.String(255))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(50))
    pwd_status = db.Column(db.String(255))

    # Relationships
    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade='all, delete')
    sessions = db.relationship('GameSession', backref='user', cascade='all, delete')
    assessments = db.relationship('CognitiveAssessment', backref='user', cascade='all, delete')
    archetype_history = db.relationship('ArchetypeHistory', backref='user', cascade='all, delete')
    goals = db.relationship('TrainingGoal', backref='user', cascade='all, delete')
    inventory = db.relationship('UserInventory', backref='user', cascade='all, delete')
    tasks = db.relationship('DailyTask', backref='user', cascade='all, delete')
    cognitive_profile = db.relationship('CognitiveProfile', backref='user', uselist=False, cascade='all, delete')
    achievements = db.relationship('UserAchievement', backref='user', cascade='all, delete')
    streak = db.relationship('UserStreak', backref='user', uselist=False, cascade='all, delete')

class GameSession(db.Model):
    __tablename__ = 'game_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'))
    game_type = db.Column(db.String(255), nullable=False)
    game_mode = db.Column(db.String(50), default='timed')
    current_smooth_difficulty = db.Column(db.Float, default=1.0)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    
    metrics = db.relationship('PerformanceMetric', backref='session', cascade='all, delete')

class PerformanceMetric(db.Model):
    __tablename__ = 'performance_metrics'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('game_sessions.id', ondelete='CASCADE'))
    reaction_time = db.Column(db.Float)
    accuracy_rate = db.Column(db.Float)
    difficulty_level = db.Column(db.Integer)
    cognitive_domain = db.Column(db.String(255))
    game_type = db.Column(db.String(255))
    error_count = db.Column(db.Integer, default=0)
    hesitation_ms = db.Column(db.Float, default=0.0)
    spam_click_count = db.Column(db.Integer, default=0)
    rule_shift_latency_ms = db.Column(db.Float)
    path_efficiency = db.Column(db.Float)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

class CognitiveProfile(db.Model):
    __tablename__ = 'cognitive_profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'))
    archetype_name = db.Column(db.String(255))
    confidence_score = db.Column(db.Float)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IsoEvaluation(db.Model):
    __tablename__ = 'iso_evaluations'
    id = db.Column(db.Integer, primary_key=True)
    functionality_score = db.Column(db.Integer, nullable=False)
    usability_score = db.Column(db.Integer, nullable=False)
    reliability_score = db.Column(db.Integer, nullable=False)
    efficiency_score = db.Column(db.Integer, nullable=False)
    ux_score = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CognitiveAssessment(db.Model):
    __tablename__ = 'cognitive_assessments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    assessment_type = db.Column(db.String(50))
    spatial_visual_score = db.Column(db.Float, nullable=False)
    logical_math_score = db.Column(db.Float, nullable=False)
    attention_score = db.Column(db.Float, nullable=False)
    executive_score = db.Column(db.Float, nullable=False)
    item_metadata = db.Column(db.JSON)
    ai_feedback = db.Column(db.Text)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

class ArchetypeHistory(db.Model):
    __tablename__ = 'archetype_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('game_sessions.id', ondelete='CASCADE'))
    archetype_name = db.Column(db.String(255), nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class TrainingGoal(db.Model):
    __tablename__ = 'training_goals'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    domain = db.Column(db.String(255), nullable=False)
    metric_type = db.Column(db.String(255), nullable=False)
    target_value = db.Column(db.Float, nullable=False)
    is_completed = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    coins = db.Column(db.Integer, default=0)
    equipped_avatar = db.Column(db.String(255), default='default_avatar')
    equipped_banner = db.Column(db.String(255), default='default_banner')
    equipped_theme = db.Column(db.String(255), default='theme-blue')
    reduce_flashes = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserInventory(db.Model):
    __tablename__ = 'user_inventory'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    item_type = db.Column(db.String(50), nullable=False)
    item_id = db.Column(db.String(255), nullable=False)
    acquired_at = db.Column(db.DateTime, default=datetime.utcnow)

class DailyTask(db.Model):
    __tablename__ = 'daily_tasks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    task_description = db.Column(db.Text, nullable=False)
    target_amount = db.Column(db.Integer, nullable=False)
    current_amount = db.Column(db.Integer, default=0)
    is_completed = db.Column(db.Boolean, default=False)
    reward_coins = db.Column(db.Integer, default=100)
    created_at = db.Column(db.Date, default=datetime.utcnow)

class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    achievement_id = db.Column(db.String(255), nullable=False)
    current_amount = db.Column(db.Integer, default=0)
    is_completed = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserStreak(db.Model):
    __tablename__ = 'user_streaks'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    last_login_date = db.Column(db.Date)
    current_streak = db.Column(db.Integer, default=1)
    longest_streak = db.Column(db.Integer, default=1)

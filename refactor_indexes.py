import os

filepath = r'd:\cognicore-workspace\server\models.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'))", "user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), index=True)")
content = content.replace("user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)", "user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)")
content = content.replace("session_id = db.Column(db.Integer, db.ForeignKey('game_sessions.id', ondelete='CASCADE'))", "session_id = db.Column(db.Integer, db.ForeignKey('game_sessions.id', ondelete='CASCADE'), index=True)")
content = content.replace("recorded_at = db.Column(db.DateTime, default=datetime.utcnow)", "recorded_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)")
content = content.replace("created_at = db.Column(db.Date, default=datetime.utcnow)", "created_at = db.Column(db.Date, default=datetime.utcnow, index=True)")
content = content.replace("timestamp = db.Column(db.DateTime, default=datetime.utcnow)", "timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

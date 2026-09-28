import os

filepath = r'd:\cognicore-workspace\client\components\DailyQuests.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_loading = '''        {loading ? (
          <div style={{ color: '#94a3b8', padding: '1rem' }}>Loading quests...</div>
        ) : quests.length === 0 ? ('''

new_loading = '''        {loading ? (
          <>
            <div className="skeleton-box" style={{ height: '110px', borderRadius: '12px' }}></div>
            <div className="skeleton-box" style={{ height: '110px', borderRadius: '12px' }}></div>
            <div className="skeleton-box" style={{ height: '110px', borderRadius: '12px' }}></div>
          </>
        ) : quests.length === 0 ? ('''

content = content.replace(old_loading, new_loading)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

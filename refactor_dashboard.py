import os
import re

filepath = r'd:\cognicore-workspace\client\components\Dashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace cohortLoading skeleton
new_cohort = '''          {cohortLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div className="skeleton-box" style={{ height: '300px', flex: 1, borderRadius: '12px' }}></div>
                <div className="skeleton-box" style={{ height: '300px', flex: 1, borderRadius: '12px' }}></div>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div className="skeleton-box" style={{ height: '350px', flex: 2, borderRadius: '12px' }}></div>
                <div className="skeleton-box" style={{ height: '350px', flex: 1, borderRadius: '12px' }}></div>
              </div>
            </div>
          ) : cohortData ? ('''

content = re.sub(
    r"          \{cohortLoading \? \(\n            <div style=\{\{ textAlign: 'center', color: '#94a3b8', padding: '3rem' \}\}>Loading cohort metrics\.\.\.</div>\n          \) : cohortData \? \(",
    new_cohort,
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


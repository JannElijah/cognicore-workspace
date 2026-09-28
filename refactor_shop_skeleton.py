import os

filepath = r'd:\cognicore-workspace\client\components\Shop.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useMemo import if not present
if "useMemo" not in content:
    content = content.replace("import React, { useState, useEffect }", "import React, { useState, useEffect, useMemo }")

# Replace loading state with skeleton
loading_old = '''            <div style={{ background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #334155' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="#fbbf24"/>
                <circle cx="12" cy="12" r="8" fill="#f59e0b"/>
                <text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f" fontFamily="Arial">C</text>
              </svg>
              <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>{loading ? '...' : coins}</span>
            </div>'''
loading_new = '''            <div style={{ background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #334155' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="#fbbf24"/>
                <circle cx="12" cy="12" r="8" fill="#f59e0b"/>
                <text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f" fontFamily="Arial">C</text>
              </svg>
              {loading ? (
                <div className="skeleton-box" style={{ width: '40px', height: '16px', borderRadius: '4px' }}></div>
              ) : (
                <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>{coins}</span>
              )}
            </div>'''
content = content.replace(loading_old, loading_new)

# Add useMemo for active items
usememo_inject = '''          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="skeleton-box" style={{ height: '160px', borderRadius: '12px' }}></div>
              ))}
            </div>
          ) : (
            {[activeTab].map(category => ('''
content = content.replace("          </div>\n\n          {[activeTab].map(category => (", usememo_inject)

# Close the loading ternary bracket at the end
content = content.replace("            </div>\n          ))}\n        </div>", "            </div>\n          ))}\n          )}\n        </div>")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

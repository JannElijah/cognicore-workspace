import os

filepath = r'd:\cognicore-workspace\client\App.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "label:  Baseline,",
    "label: \${cognitiveProfile?.archetype || 'Archetype'} Baseline\,"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

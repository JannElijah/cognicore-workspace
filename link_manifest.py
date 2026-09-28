import os

filepath = r'd:\cognicore-workspace\client\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'manifest.json' not in content:
    content = content.replace('<link rel="apple-touch-icon"', '<link rel="manifest" href="/manifest.json" />\n    <link rel="apple-touch-icon"')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

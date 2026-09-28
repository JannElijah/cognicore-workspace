import os

filepath = r'd:\cognicore-workspace\client\index.css'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if '-webkit-touch-callout: none;' not in content:
    content = content.replace('-webkit-user-select: none;', '-webkit-user-select: none;\n    -webkit-touch-callout: none;')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

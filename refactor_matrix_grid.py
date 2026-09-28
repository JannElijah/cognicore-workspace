import os

filepath = r'd:\cognicore-workspace\client\games\MatrixRecallScene.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const gridAreaWidth = 380;',
    'const gridAreaWidth = Math.min(380, width - 40);'
).replace(
    'const gridAreaHeight = 380;',
    'const gridAreaHeight = Math.min(380, width - 40);'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

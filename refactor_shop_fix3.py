import os

filepath = r'd:\cognicore-workspace\client\components\Shop.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("          ))}\n          )}", "          ))\n          )}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

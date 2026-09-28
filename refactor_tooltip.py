import os

filepath = r'd:\cognicore-workspace\client\components\HoverTooltip.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'onMouseEnter={handleMouseEnter}\n      onMouseLeave={handleMouseLeave}',
    'onMouseEnter={handleMouseEnter}\n      onMouseLeave={handleMouseLeave}\n      onTouchStart={handleMouseEnter}\n      onTouchEnd={handleMouseLeave}'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

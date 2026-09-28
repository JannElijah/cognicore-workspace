import os
import glob
import re

for filepath in glob.glob(r'd:\cognicore-workspace\client\games\*.js'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # Match: const gridAreaSize = 360; -> const gridAreaSize = Math.min(360, width - 40);
    new_content = re.sub(r'const gridAreaSize = (\d+);', r'const gridAreaSize = Math.min(\1, width - 40);', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

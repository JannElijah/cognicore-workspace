import os
import glob
import re

for filepath in glob.glob(r'd:\cognicore-workspace\client\components\*Game.jsx'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the dynamic logical bounds with fixed 800x600 bounds.
    # Phaser.Scale.FIT will handle the visual CSS scaling for mobile.
    new_content = re.sub(
        r'width: window\.innerWidth < 768 \? window\.innerWidth : 800,\n\s*height: window\.innerWidth < 768 \? Math\.round\(window\.innerWidth \* 0\.75\) : 600,',
        'width: 800,\n                height: 600,',
        content
    )
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

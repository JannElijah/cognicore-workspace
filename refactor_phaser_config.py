import os
import glob

directory = r'd:\cognicore-workspace\client\components'
files = glob.glob(os.path.join(directory, '*Game.jsx'))

render_config = '''            render: {
                powerPreference: 'high-performance',
                antialias: true,
                roundPixels: true,
                batchSize: 4096
            },
            scale: {'''

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'scale: {' in content and 'powerPreference' not in content:
        content = content.replace('scale: {', render_config)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"Updated {len(files)} files.")

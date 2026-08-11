import glob
import re

for fpath in glob.glob('d:/cognicore-workspace/client/games/*Scene.js'):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(
        r"'Authorization':\s*Bearer\s*",
        r"'Authorization': `Bearer ${useCogniStore.getState().token}`",
        content
    )
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Fixed Scene Auth Headers')

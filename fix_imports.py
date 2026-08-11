import glob
import re

for fpath in glob.glob('d:/cognicore-workspace/client/games/*Scene.js'):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix the .js extension in useCogniStore import
    content = content.replace("'../store/useCogniStore.js'", "'../store/useCogniStore'")
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Fixed imports')

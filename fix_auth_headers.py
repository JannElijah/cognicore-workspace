import glob
import re

for fpath in glob.glob('d:/cognicore-workspace/client/components/*Game.jsx'):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The bad string is `'Authorization': Bearer ` or `'Authorization': Bearer  },`
    # We will just replace `'Authorization': Bearer ` with the correct template string
    
    # regex replace `'Authorization': Bearer\s*(?=\r?\n|},)`
    # wait, just replacing `'Authorization': Bearer ` and `'Authorization': Bearer  },` is easier.
    
    content = re.sub(
        r"'Authorization':\s*Bearer\s*",
        r"'Authorization': `Bearer ${useCogniStore.getState().token}`",
        content
    )
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Fixed React Wrapper Auth Headers')

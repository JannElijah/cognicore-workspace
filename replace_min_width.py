import os
import glob
import re

client_path = r"d:\cognicore-workspace\client\components"

files = glob.glob(os.path.join(client_path, "*.jsx"))
files.extend(glob.glob(os.path.join(client_path, "*.js")))

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = re.sub(r"minWidth:\s*'260px',\s*", "", content)
    
    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file_path}")

print("Done")

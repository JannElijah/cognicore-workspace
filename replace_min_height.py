import os
import glob
import re

client_path = r"d:\cognicore-workspace\client\components"
game_files = glob.glob(os.path.join(client_path, "*Game.jsx"))

for file_path in game_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = re.sub(r"minHeight:\s*'600px',", r"minHeight: 'auto',", content)
    
    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file_path}")

print("Done")

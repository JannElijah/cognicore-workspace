import re

with open('app.py', 'r') as f:
    content = f.read()

# We will remove from `def generate_pros_cons(scores_map):` up to `@app.route('/metrics', methods=['GET'])`
match1 = re.search(r"def generate_pros_cons\(scores_map\):", content)
match2 = re.search(r"@app\.route\('/metrics', methods=\['GET'\]\)", content)

if match1 and match2:
    start = match1.start()
    end = match2.start()
    new_content = content[:start] + content[end:]
    with open('app.py', 'w') as f:
        f.write(new_content)
    print("Wiped successfully")
else:
    print("Could not find start/end")

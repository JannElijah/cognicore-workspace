with open('app.py', 'r') as f:
    lines = f.readlines()

# We need to wipe between the last route we want to keep and `/metrics`.
# Let's find the exact indices.
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "@app.route('/', methods=['GET'])" in line:
        # Keep this route, so the wipe should start AFTER its function ends.
        # This function returns `send_from_directory...`
        pass
    if "def serve_react_app():" in line:
        start_idx = i + 2 # Start wiping after the return statement
    if "@app.route('/metrics', methods=['GET'])" in line:
        end_idx = i

if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
    new_lines = lines[:start_idx] + lines[end_idx:]
    with open('app.py', 'w') as f:
        f.writelines(new_lines)
else:
    print("Could not find start/end indices")

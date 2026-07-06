import re

with open('app.py', 'r') as f:
    content = f.read()

# Extract GAME_TO_DOMAIN
m = re.search(r'GAME_TO_DOMAIN = \{[\s\S]*?\}', content)
game_to_domain = m.group(0) if m else ''

# Extract t_test_paired
m = re.search(r'def t_test_paired\([\s\S]*?return max\(0\.0, min\(1\.0, two_sided_p\)\)', content)
t_test_paired = m.group(0) if m else ''

# Extract calculate_ols_slope
m = re.search(r'def calculate_ols_slope\([\s\S]*?return slope', content)
calculate_ols_slope = m.group(0) if m else ''

# Extract calculate_dda_parameters
m = re.search(r'def calculate_dda_parameters\([\s\S]*?return configs\.get\(clamped_difficulty, configs\[1\]\)', content)
calculate_dda_parameters = m.group(0) if m else ''

utils_content = f"""import math

{game_to_domain}

{t_test_paired}

{calculate_ols_slope}

{calculate_dda_parameters}
"""

with open('utils.py', 'w') as f:
    f.write(utils_content)

print("utils.py created")

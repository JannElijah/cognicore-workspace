import os
import re
import glob

directory = r'd:\cognicore-workspace\server\routes'
files = glob.glob(os.path.join(directory, '*.py'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace cases like f"Database error: {str(e)}" -> "An internal server error occurred"
    content = re.sub(
        r'f\"[^\"]*\{str\(e\)\}[^\"]*\"',
        r'"An internal server error occurred."',
        content
    )
    # Replace cases like str(e) inside jsonify
    content = re.sub(
        r'\"message\":\s*str\(e\)',
        r'"message": "An internal server error occurred."',
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

import os
import re

base = 'd:/cognicore-workspace/client'

def replace_file(p, d):
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    # 1. Template literal: `${API_BASE}/api/health`
    # Replace `http://127.0.0.1:5000/api/...` with `${API_BASE}/api/...`
    content = re.sub(r'`http://127\.0\.0\.1:5000(.*?)`', r'`${API_BASE}\1`', content)
    
    # 2. String concat: API_BASE + '/api/login'
    # Replace 'http://127.0.0.1:5000/api/...' with API_BASE + '/api/...'
    content = re.sub(r'\'http://127\.0\.0\.1:5000(.*?)\'', r"API_BASE + '\1'", content)
    
    # Clean up any API_BASE + '' created by exact URL match
    content = content.replace("API_BASE + ''", "API_BASE")
    
    if content != orig:
        if 'API_BASE' in content and 'apiClient.js' not in content:
            rel_dir = os.path.relpath(os.path.join(base, 'utils'), d).replace('\\\\', '/')
            import_stmt = f"import {{ API_BASE }} from '{rel_dir}/apiClient.js';\n"
            content = import_stmt + content
            
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)

for d, _, fs in os.walk(base):
    for f in fs:
        if f.endswith(('.js', '.jsx')):
            replace_file(os.path.join(d, f), d)

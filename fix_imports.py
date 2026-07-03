import os

base = 'd:/cognicore-workspace/client'

for d, _, fs in os.walk(base):
    for f in fs:
        if f.endswith(('.js', '.jsx')):
            p = os.path.join(d, f)
            with open(p, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Fix relative imports
            content = content.replace("import { API_BASE } from 'utils/apiClient.js';", "import { API_BASE } from './utils/apiClient.js';")
            content = content.replace("import { API_BASE } from '..\\utils/apiClient.js';", "import { API_BASE } from '../utils/apiClient.js';")
            content = content.replace("import { API_BASE } from '..\\..\\utils/apiClient.js';", "import { API_BASE } from '../../utils/apiClient.js';")
            
            with open(p, 'w', encoding='utf-8') as file:
                file.write(content)

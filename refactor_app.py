import os
import re

filepath = r'd:\cognicore-workspace\server\app.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import_str = '''from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_compress import Compress'''
content = content.replace('from flask import Flask, request, jsonify\nfrom flask_cors import CORS', import_str)

init_str = '''def create_app(test_config=None):
    app = Flask(__name__)
    Compress(app)'''
content = content.replace('''def create_app(test_config=None):
    app = Flask(__name__)''', init_str)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


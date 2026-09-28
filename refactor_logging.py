import os
import re

filepath = r'd:\cognicore-workspace\server\app.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

logging_setup = '''
import logging
from pythonjsonlogger import jsonlogger

# Configure Structured JSON Logging for Render/Datadog
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
# Clear existing handlers to prevent duplicate logs
while root_logger.hasHandlers():
    root_logger.removeHandler(root_logger.handlers[0])
    
log_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
log_handler.setFormatter(formatter)
root_logger.addHandler(log_handler)

from database import init_db'''

content = content.replace('from database import init_db', logging_setup)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


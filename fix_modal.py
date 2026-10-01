import os

file_path = 'client/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix modal padding and gap
content = content.replace("padding: '2.5rem',", "padding: '1.5rem',")
content = content.replace("gap: '1.5rem',", "gap: '1rem',\n                  maxHeight: '90vh',\n                  overflowY: 'auto',")

# Fix button padding
content = content.replace("padding: '0.85rem',", "padding: '0.6rem',")

# Fix hover panel padding
content = content.replace("padding: '1.25rem',", "padding: '0.75rem',")

# Fix modal header font size
content = content.replace("fontSize: '1.75rem',", "fontSize: '1.35rem',")
content = content.replace("fontSize: '2.25rem'", "fontSize: '1.75rem'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

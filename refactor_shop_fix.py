import os

filepath = r'd:\cognicore-workspace\client\components\Shop.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the JSX syntax error inside the ternary operator
content = content.replace("{[activeTab].map", "[activeTab].map")

# I need to fix the ending brackets as well.
# It currently has:
#            </div>
#          ))}
#          )}
#        </div>

content = content.replace("          ))}\n          )}\n        </div>", "          ))}\n        </div>")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

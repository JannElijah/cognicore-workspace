import os

filepath = r'd:\cognicore-workspace\server\routes\ml.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("acc_slope = calculate_ols_slope(history_acc)", "acc_slope = calculate_ols_slope(history_acc[-20:])")
content = content.replace("rt_slope = calculate_ols_slope(history_rt)", "rt_slope = calculate_ols_slope(history_rt[-20:])")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


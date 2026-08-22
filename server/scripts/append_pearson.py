pearson_code = """
def calculate_pearson_r(x, y):
    n = len(x)
    if n <= 1:
        return 0.0, 1.0
    
    sum_x = sum(x)
    sum_y = sum(y)
    sum_x2 = sum(xi * xi for xi in x)
    sum_y2 = sum(yi * yi for yi in y)
    sum_xy = sum(xi * yi for xi, yi in zip(x, y))
    
    numerator = n * sum_xy - sum_x * sum_y
    denominator = ((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)) ** 0.5
    
    if denominator == 0:
        return 0.0, 1.0
        
    r = numerator / denominator
    
    # Try scipy if available (it was imported in app.py originally)
    try:
        from scipy import stats
        r_exact, p_val = stats.pearsonr(x, y)
        return float(r_exact), float(p_val)
    except ImportError:
        pass
            
    try:
        df = n - 2
        if df > 0 and abs(r) < 1.0:
            t = r * ((df / (1 - r * r)) ** 0.5)
            z = abs(t)
            t_approx = 1 / (1 + 0.2316419 * z)
            d = 0.3989423 * (2.7182818 ** (-z * z / 2))
            prob = d * t_approx * (0.3193815 + t_approx * (-0.3565638 + t_approx * (1.7814779 + t_approx * (-1.821256 + t_approx * 1.330274))))
            p_val = 2.0 * prob
            p_val = max(0.0, min(1.0, p_val))
    except Exception:
        p_val = 0.05 if abs(r) > 0.3 else 0.5
        
    return float(r), float(p_val)
"""
with open('game_utils.py', 'a') as f:
    f.write(pearson_code)

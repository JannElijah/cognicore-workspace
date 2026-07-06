import inspect
from app import calculate_dda_parameters, calculate_ols_slope, GAME_TO_DOMAIN, generate_pros_cons

with open('game_utils.py', 'w') as f:
    f.write('GAME_TO_DOMAIN = ' + repr(GAME_TO_DOMAIN) + '\n\n')
    f.write(inspect.getsource(calculate_ols_slope) + '\n\n')
    f.write(inspect.getsource(generate_pros_cons) + '\n\n')
    f.write(inspect.getsource(calculate_dda_parameters) + '\n\n')

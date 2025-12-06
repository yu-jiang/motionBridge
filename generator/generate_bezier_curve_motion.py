import numpy as np
from .helper_generate_random_color import helper_generate_random_color

def generate_bezier_curve_motion(src_motion):
    """
    Generate a built motion with an impulse spike at the start.

    Parameters:
        src_motion (dict):
            - 'name'
            - 'parameters': {
                - 'data' (float[], motion curve points)
                - 'duration' (float, seconds)
                - 'magnitude' (int, newtons)
                - 'direction' (str, like 'heave')
                }

    Returns:
        dict: builtMotion with actuator waveforms and metadata.
    """
    # Extract parameters
    params = src_motion['parameters']
    data = params['data']
    duration = params['duration']
    magnitude = params['magnitude']
    direction = params['direction'].lower()

    # Constants
    Fs = 100
    Ts = 1 / Fs
    signal_len = round(duration * Fs)

    # Validation
    if duration <= 0:
        raise ValueError("Duration must be positive")
    if magnitude < 0 or magnitude > 3000:
        raise ValueError("Magnitude must be between 0 and 3000")
    if not data or len(data) < 2:
        raise ValueError("Data must contain at least two points")
    # Check if data points are normalized (between 0 and 1)
    if not all(-1 <= point <= 1 for point in data):
        raise ValueError("All data points must be normalized between -1 and 1")
    
    fl = np.copy(data)
    fr = np.copy(data)
    rl = np.copy(data)
    rr = np.copy(data)
    
    if direction == 'heave':
        pass
    elif direction == 'pitch':
        rl *= -1
        rr *= -1
    elif direction == 'roll':
        fr *= -1
        rr *= -1
    elif direction == 'fl':
        fr[:] = rl[:] = rr[:] = 0
    elif direction == 'fr':
        fl[:] = rl[:] = rr[:] = 0
    elif direction == 'rl':
        fl[:] = fr[:] = rr[:] = 0
    elif direction == 'rr':
        fl[:] = fr[:] = rl[:] = 0
    elif direction == 'front':
        rl[:] = rr[:] = 0
    elif direction == 'rear':
        fl[:] = fr[:] = 0
    elif direction == 'left':
        fr[:] = rr[:] = 0
    elif direction == 'right':
        fl[:] = rl[:] = 0
    else:
        raise ValueError(f"Invalid direction: {direction}")

    # Build result
    built_motion = {
        'name': src_motion['name'],
        'compositionDegree': 0,
        'color': helper_generate_random_color(),
        'shortDisplayName': 'Bezier Curve',
        'longDisplayName': f'Bezier Curve',
        'magnitude': magnitude,
        'offset': 0,
        'duration': duration,
        'flShape': fl.tolist(),
        'frShape': fr.tolist(),
        'rlShape': rl.tolist(),
        'rrShape': rr.tolist(),
    }

    return built_motion

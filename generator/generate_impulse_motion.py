import numpy as np
from .helper_generate_random_color import helper_generate_random_color

def generate_impulse_motion(src_motion):
    """
    Generate a built motion with an impulse spike at the start.

    Parameters:
        src_motion (dict):
            - 'name'
            - 'parameters': {
                - 'duration' (float, seconds)
                - 'direction' (str, like 'heave')
                }

    Returns:
        dict: builtMotion with actuator waveforms and metadata.
    """
    # Extract parameters
    duration = src_motion['parameters']['duration']
    direction = src_motion['parameters']['direction'].lower()
    magnitude = 300  # Fixed value in Newtons

    # Constants
    Fs = 100
    Ts = 1 / Fs
    signal_len = round(duration * Fs)

    # Validation
    if duration <= 0:
        raise ValueError("Duration must be positive")

    # Generate impulse: 1 at t=0, then 0
    y = np.zeros((signal_len, 1))
    y[0, 0] = 1
    y = np.tile(y, (1, 4))  # replicate across 4 actuators

    # Apply direction shaping
    fl, fr, rl, rr = [y[:, i] for i in range(4)]
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
        'shortDisplayName': 'Impulse',
        'longDisplayName': 'Impulse (300N)',
        'magnitude': magnitude,
        'offset': 0,
        'duration': duration,
        'flShape': fl.tolist(),
        'frShape': fr.tolist(),
        'rlShape': rl.tolist(),
        'rrShape': rr.tolist(),
    }

    return built_motion

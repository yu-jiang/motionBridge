import numpy as np
from .helper_generate_random_color import helper_generate_random_color

def generate_min_jerk_motion(src_motion):
    """
    Generate a minimum-jerk trajectory from startValue to endValue.

    Parameters:
        src_motion (dict):
            - 'name'
            - 'parameters': {
                - 'duration' (float, seconds)
                - 'magnitude' (int, newtons)
                - 'direction' (str, like 'heave')
                - 'startValue' (float between -1 and 1)
                - 'endValue' (float between -1 and 1)
                }

    Returns:
        dict: builtMotion structure with actuator waveforms and metadata.
    """
    # Extract parameters
    params = src_motion['parameters']
    duration = params['duration']
    magnitude = params['magnitude']
    direction = params['direction'].lower()
    start_value = params['startValue']
    end_value = params['endValue']

    # Constants
    Fs = 100
    Ts = 1 / Fs
    signal_len = round(duration * Fs)

    # Validation
    if duration <= 0:
        raise ValueError("Duration must be positive")
    if not (-1 <= start_value <= 1 and -1 <= end_value <= 1):
        raise ValueError("startValue and endValue must be between -1 and 1")

    # Generate min-jerk trajectory (normalized time)
    t = np.arange(0, duration, Ts) / duration
    tau = 10 * t**3 - 15 * t**4 + 6 * t**5
    y = start_value + (end_value - start_value) * tau
    y = np.tile(y.reshape(-1, 1), (1, 4))  # replicate across 4 actuators

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

    # Construct result
    built_motion = {
        'name': src_motion['name'],
        'compositionDegree': 0,
        'color': helper_generate_random_color(),
        'shortDisplayName': 'MinJerk',
        'longDisplayName': f"Minimum Jerk Curve ({start_value:g} to {end_value:g})",
        'magnitude': magnitude,
        'offset': 0,
        'duration': duration,
        'flShape': fl.tolist(),
        'frShape': fr.tolist(),
        'rlShape': rl.tolist(),
        'rrShape': rr.tolist(),
    }

    return built_motion

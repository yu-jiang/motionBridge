import numpy as np
from scipy.interpolate import PchipInterpolator
from .helper_generate_random_color import helper_generate_random_color

def generate_twin_peak_motion(src_motion):
    """
    Generate a twin-peak shaped motion using smoothed trajectory with PCHIP.

    Parameters:
        src_motion (dict):
            - 'name'
            - 'parameters': { 
                - 'duration' (float, seconds)
                - 'magnitude' (int, newtons)
                - 'direction' (str, like 'heave')
                - 'firstPeakTime' (float, time of first peak)
                - 'firstPeakValue' (float between -1 and - 1)
                - 'secondPeakTime' (float, time of second peak)
                - 'secondPeakValue' (float between -1 and - 1)
                }

    Returns:
        dict: builtMotion dictionary containing actuator waveforms and metadata.
    """
    # Extract parameters
    params = src_motion['parameters']
    duration = params['duration']
    magnitude = params['magnitude']
    direction = params['direction'].lower()
    first_peak_time = params['firstPeakTime']
    first_peak_value = params['firstPeakValue']
    second_peak_time = params['secondPeakTime']
    second_peak_value = params['secondPeakValue']

    # Constants
    Fs = 100
    Ts = 1 / Fs
    signal_len = round(duration * Fs)
    c = 0.5

    # Validation
    if duration <= 0:
        raise ValueError("Duration must be positive")
    if not (0 <= first_peak_time < second_peak_time <= duration):
        raise ValueError("Invalid peak times")
    if not (-1 <= first_peak_value <= 1 and -1 <= second_peak_value <= 1):
        raise ValueError("Peak values must be between -1 and 1")

    # Define control points for twin peak shape
    xy = np.array([
        [0, 0],
        [first_peak_time * c, c * first_peak_value],
        [first_peak_time, first_peak_value],
        [second_peak_time, second_peak_value],
        [duration - (duration - second_peak_time) * c, c * second_peak_value],
        [duration, 0]
    ])

    # Generate time vector and interpolate
    t = np.arange(0, duration + Ts, Ts)
    interp = PchipInterpolator(xy[:, 0], xy[:, 1])
    y = interp(t)
    y = np.tile(y.reshape(-1, 1), (1, 4))  # replicate for 4 actuators

    # Apply direction
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

    # Assemble result
    built_motion = {
        'name': src_motion['name'],
        'compositionDegree': 0,
        'color': helper_generate_random_color(),
        'shortDisplayName': 'TwinPeak',
        'longDisplayName': (
            f"Twin Peak ({first_peak_value:g} at {first_peak_time:g}s, "
            f"{second_peak_value:g} at {second_peak_time:g}s)"
        ),
        'magnitude': magnitude,
        'offset': 0,
        'duration': duration,
        'flShape': fl.tolist(),
        'frShape': fr.tolist(),
        'rlShape': rl.tolist(),
        'rrShape': rr.tolist(),
    }

    return built_motion

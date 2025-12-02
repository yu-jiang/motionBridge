import numpy as np
from .helper_generate_random_color import helper_generate_random_color

def generate_sine_motion(src_motion):
    """
    Generate a sine wave motion for 4 actuators based on input parameters.

    Parameters:
        src_motion (dict):
            - 'name'
            - 'parameters': {
                - 'duration' (float, seconds)
                - 'magnitude' (int, newtons)
                - 'frequency' (float, Hz), 
                - 'direction' (str, like 'heave')
                - 'phase' (float, degrees)
                }

    Returns:
        dict: A builtMotion dictionary with actuator waveforms and metadata.
    """

    # Sampling
    Fs = 100
    Ts = 1 / Fs
    duration = src_motion['parameters']['duration']
    magnitude = src_motion['parameters']['magnitude']
    frequency = src_motion['parameters']['frequency']
    direction = src_motion['parameters']['direction'].lower()
    phase = src_motion['parameters']["phase"] * np.pi / 180

    signal_len = round(duration * Fs)
    t = np.arange(0, duration, Ts)

    # Generate base sine wave with phase offset
    y = np.sin(2 * np.pi * frequency * t + phase)
    y = np.tile(y.reshape(-1, 1), (1, 4))  # replicate for 4 actuators

    # Extract individual actuator channels
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
        'shortDisplayName': 'Sine',
        'longDisplayName': f"Sine Wave ({frequency:g} Hz, φ={phase:.2f})",
        'magnitude': magnitude,
        'offset': 0,
        'duration': duration,
        'flShape': fl.tolist(),
        'frShape': fr.tolist(),
        'rlShape': rl.tolist(),
        'rrShape': rr.tolist(),
    }

    return built_motion

import numpy as np
from scipy.signal import bilinear, lfilter
from .helper_generate_random_color import helper_generate_random_color
from .helper_get_duration import helper_get_duration

def design_hpf(fn, Ts):
    """Design a 2nd-order high-pass filter using bilinear transform."""
    wn = 2 * np.pi * fn
    num = [1, 0, 0]
    den = [1, 2 * wn, wn ** 2]
    return bilinear(num, den, fs=1 / Ts)

def design_lpf(fn, Ts):
    """Design a 2nd-order low-pass filter using bilinear transform."""
    wn = 2 * np.pi * fn
    num = [wn ** 2]
    den = [1, 2 * wn, wn ** 2]
    return bilinear(num, den, fs=1 / Ts)

def generate_white_noise_motion(src_motion):
    """
    Generate band-pass filtered white noise motion for one or more actuators.

    Parameters:
        src_motion (dict):
            - 'name'
            - 'parameters': {
                - 'duration' (float, seconds)
                - 'magnitude' (int, newtons)
                - 'direction' (str, like 'heave')
                - 'lowCutoff' (float): Low cutoff freq in Hz
                - 'highCutoff' (float): High cutoff freq in Hz
                - 'seed' (int): Random seed for reproducibility
                }

    Returns:
        dict: builtMotion structure with filtered waveforms and metadata.
    """
    # Parameters
    params = src_motion['parameters']
    duration = params['duration']
    magnitude = params['magnitude']
    direction = params['direction'].lower()
    low_cutoff = params['lowCutoff']
    high_cutoff = params['highCutoff']
    seed = params['seed']

    # Sampling config
    Fs = 100
    Ts = 1 / Fs
    N = round(duration * Fs)

    # Set random seed
    np.random.seed(seed)

    # Generate white noise in range [-1, 1]
    noise = 2 * np.random.rand(N) - 1

    # Create high-pass and low-pass filters
    hp_b, hp_a = design_hpf(low_cutoff, Ts)
    lp_b, lp_a = design_lpf(high_cutoff, Ts)

    # Apply filters
    filtered = lfilter(hp_b, hp_a, noise)
    filtered = lfilter(lp_b, lp_a, filtered)

    # Normalize to [-1, 1]
    max_abs = np.max(np.abs(filtered))
    if max_abs > 0:
        filtered /= max_abs

    fl = np.copy(filtered)  # Keep as NumPy arrays
    fr = np.copy(filtered)
    rl = np.copy(filtered)
    rr = np.copy(filtered)
    
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
    
    # Prepare motion structure
    built_motion = {
        'name': src_motion.get('name', 'WhiteNoise'),
        'compositionDegree': 0,
        'color': helper_generate_random_color(),
        'shortDisplayName': 'White Noise',
        'longDisplayName': f"Band-Pass Filtered Noise ({low_cutoff:.1f}-{high_cutoff:.1f} Hz)",
        'magnitude': magnitude,
        'offset': 0,
        'duration': None,  # to be filled
        'flShape': fl.tolist(),  # Convert to list only when assigning
        'frShape': fr.tolist(),
        'rlShape': rl.tolist(),
        'rrShape': rr.tolist()
    }

    built_motion['duration'] = helper_get_duration(built_motion, Ts)

    return built_motion

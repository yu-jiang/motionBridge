import numpy as np
import json
import os
from .helper_generate_random_color import helper_generate_random_color

def generate_composite_motion(src_composition, motion_dir="motions/"):
    """
    Generate a composite motion from multiple motion references.

    Parameters:
        src_composition (dict):
            - 'name'
            - 'composition': {
                'operation': ['add', 'multiply', 'concat'],
                'motions': [ 
                    { 
                        'motionRef' (str), 
                        'startTime' (float), 
                        'magnitudeOverride' (float, optional) 
                    }, 
                    ... 
                    ]
                }
        motion_dir (str): Path to directory with pre-built motion JSON files.

    Returns:
        dict: builtMotion containing combined actuator waveforms and metadata.
    """
    Fs = 100
    composition = src_composition['composition']
    motions = composition['motions']
    operation = composition['operation'].lower()

    composite_magnitude = 1 if operation == 'multiply' else 0
    max_end_time = 0
    max_degree = 0

    # First pass: calculate total duration, composite magnitude, degree
    loaded_motions = []
    
    # For concat operation, ignore startTime and calculate sequential timing
    current_time = 0
    
    for i, motion in enumerate(motions):
        filepath = os.path.join(motion_dir, motion['motionRef'] + '.json')
        with open(filepath, 'r') as f:
            built_motion_temp = json.load(f)

        mag = motion.get('magnitudeOverride', built_motion_temp['magnitude'])
        duration = len(built_motion_temp['flShape']) / Fs
        
        if operation == 'concat':
            # For concat, override startTime to be sequential
            motion_start_time = current_time
            end_time = current_time + duration
            current_time = end_time  # Next motion starts where this one ends
        else:
            motion_start_time = motion['startTime']
            end_time = motion['startTime'] + duration
            
        max_end_time = max(max_end_time, end_time)
        max_degree = max(max_degree, built_motion_temp.get('compositionDegree', 0))

        if operation == 'multiply':
            composite_magnitude *= mag
        else:  # add
            composite_magnitude = max(composite_magnitude, abs(mag))

        # Store the calculated start time for concat operation
        motion_with_timing = motion.copy()
        motion_with_timing['calculatedStartTime'] = motion_start_time
        loaded_motions.append((motion_with_timing, built_motion_temp, mag))

    total_samples = round(max_end_time * Fs)
    duration = max_end_time

    # Initialize composite shapes
    if operation == 'multiply':
        fl, fr, rl, rr = [np.ones(total_samples) for _ in range(4)]
    else:  # add or concat
        fl, fr, rl, rr = [np.zeros(total_samples) for _ in range(4)]

    # Second pass: apply shifts, scaling, combine shapes
    for i, (motion, built_motion, mag) in enumerate(loaded_motions):
        scale = 1 if operation == 'multiply' else mag / composite_magnitude
        
        # Use calculated start time for concat, original startTime for others
        start_time = motion.get('calculatedStartTime', motion['startTime'])
        start_sample = round(start_time * Fs)
        seq_len = len(built_motion['flShape'])

        # Extract and scale
        fl_seq = np.array(built_motion['flShape']) * scale
        fr_seq = np.array(built_motion['frShape']) * scale
        rl_seq = np.array(built_motion['rlShape']) * scale
        rr_seq = np.array(built_motion['rrShape']) * scale

        # Pad to shift
        pre_pad = start_sample
        post_pad = total_samples - pre_pad - seq_len
        pad_value = 1 if operation == 'multiply' else 0

        def pad_and_shift(seq):
            return np.concatenate([
                np.full(pre_pad, pad_value),
                seq,
                np.full(post_pad, pad_value)
            ]) if post_pad >= 0 else seq[:total_samples - pre_pad]

        fl_s = pad_and_shift(fl_seq)
        fr_s = pad_and_shift(fr_seq)
        rl_s = pad_and_shift(rl_seq)
        rr_s = pad_and_shift(rr_seq)

        # Combine
        if operation == 'concat':
            # For concat, directly place each motion in its time segment
            # Extract the actual motion data without padding
            end_sample = start_sample + seq_len
            if end_sample <= total_samples:
                fl[start_sample:end_sample] = fl_seq
                fr[start_sample:end_sample] = fr_seq
                rl[start_sample:end_sample] = rl_seq
                rr[start_sample:end_sample] = rr_seq
        elif i == 0:
            fl, fr, rl, rr = fl_s, fr_s, rl_s, rr_s
        else:
            if operation == 'multiply':
                fl *= fl_s
                fr *= fr_s
                rl *= rl_s
                rr *= rr_s
            else:  # add
                fl += fl_s
                fr += fr_s
                rl += rl_s
                rr += rr_s

    # Normalize if needed
    max_val = max(np.max(np.abs(s)) for s in [fl, fr, rl, rr])
    if max_val > 1:
        fl /= max_val
        fr /= max_val
        rl /= max_val
        rr /= max_val
        composite_magnitude *= max_val
    
    if operation == 'add':
        operation_str = " + "
    elif operation == 'multiply':
        operation_str = " * "
    else:  # concat
        operation_str = " · "
    
    composition_str = operation_str.join([m['motionRef'] for m in motions])

    # Construct result
    built_motion = {
        'name': src_composition['name'],
        'color': helper_generate_random_color(),
        'shortDisplayName': 'Composite Motion',
        'longDisplayName': composition_str,
        'magnitude': int(composite_magnitude),
        'offset': 0,
        'duration': duration,
        'compositionDegree': max_degree + 1,
        'flShape': fl.tolist(),
        'frShape': fr.tolist(),
        'rlShape': rl.tolist(),
        'rrShape': rr.tolist()
    }

    return built_motion

import numpy as np

def scale_motion(motion, scale):
    """
    Scale the motion's actuator waveforms by a given factor.
    Parameters:
        motion (dict): A built motion dictionary with actuator waveforms.
        scale (float): Scaling factor between -2 and 2.
    Returns:

        dict: The scaled motion dictionary.
    """
    if scale > 2 or scale < -2:
        raise ValueError("Scale must be between -2 and 2")
    for shape in ['flShape', 'frShape', 'rlShape', 'rrShape']:
        data = np.array(motion[shape])
        scaled = np.clip(data * scale, -1, 1)
        motion[shape] = scaled.tolist()
    
    return motion
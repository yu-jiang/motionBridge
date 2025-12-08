def helper_get_duration(built_motion, Ts):
    """
    Calculate the duration of a built motion.

    Parameters:
        built_motion (dict): Dictionary containing motion sequences (e.g., 'flShape' as a list or array).
        Ts (float): Sampling period in seconds.

    Returns:
        float: Total duration of the motion in seconds.
    """
    num_samples = len(built_motion['flShape'])
    duration = num_samples * Ts
    return duration

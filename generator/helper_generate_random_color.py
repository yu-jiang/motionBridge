import random

def helper_generate_random_color():
    """
    Generate a random hex color.

    Returns:
        str: A hex color string, e.g., '#D67615'
    """
    rgb = [random.randint(0, 255) for _ in range(3)]
    return "#{:02X}{:02X}{:02X}".format(*rgb)

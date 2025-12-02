from pathlib import Path
import shutil

unique_effects = [
    "sinewave",
    "wavebeatRight",
    "wavebeatLeft",
    "impulseHeave",
    "gesture_dip",
    "heaveDownHit",
    "carsfly_bass_effect_1",
    "stop",
    "nod_1",
    "nod_2",
    "nod_3",
    "cos_fl_12Hz",
    "cos_fr_12Hz",
    "jump001",
    "gesture_wave",
    "chirp_003",
    "head_down",
    "head_up",
    "waveUpHeaveDownHit",
    "heaveUpHit",
    "DownHit0",
    "qRight",
    "LeftRightUpHit0",
    "rawbeat",
    "qDown",
    "qLeft",
    "UpHit0",
    "RightHit",
    "rumbling",
    "LeftHit0",
    "fullHeaveUpHit",
    "RightHit0",
    "LeftHit",
    "fullHeaveDoneHit",
    "qUp",
    "RightLeftUpHit0",
    "vibration_fr_12hz",
    "vibration_fl_12hz",
    "frameCut",
    "humming12"
]

# Create destination folder
dest = Path('motions_to_public')
dest.mkdir(exist_ok=True)

# Copy only files in the list
motions = Path('motions')
for name in unique_effects:
    src = motions / f"{name}.json"
    if src.exists():
        shutil.copy2(src, dest / src.name)
        print(f"Copied {src.name}")
    else:
        print(f"Not found: {src.name}")
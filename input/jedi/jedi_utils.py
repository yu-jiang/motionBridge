# Refactored from original jedi_utils.py
# This file should be placed under apps/jedi/jedi_utils.py

import json
from pathlib import Path


JEDI_CONFIG_PATH = "input/jedi/jedi_config.json"
CONFIG = {}

def load_jedi_config():
    global CONFIG
    with open(JEDI_CONFIG_PATH, "r") as f:
        CONFIG = json.load(f)

load_jedi_config()

liveForceScale = CONFIG.get("live_force_scale", 1)
gesture_cfg = CONFIG.get("gesture_settings", {})
start_follower_label = gesture_cfg.get("start", "both_arms_out") # switch to follower mode
stop_gesture_label = gesture_cfg.get("stop", "stop") # switch to off mode
activate_gesture_label = gesture_cfg.get("activate", "wave") # switch to event mode
deactivate_gesture_label = gesture_cfg.get("deactivate", "bow") # discarded

SPECIAL_GESTURES = {
    "start_live": start_follower_label,
    "stop": stop_gesture_label,
    "start_event": activate_gesture_label
}

def get_live_force_scale():
    return liveForceScale

def update_jedi_state(is_ready, player_mode, gesture):
    if not is_ready:
        return None

    if player_mode != "off" and gesture == stop_gesture_label:
        return "off"

    if player_mode != "event" and gesture == activate_gesture_label:
        return "event"

    if player_mode != "live" and gesture == start_follower_label:
        return "live"

    return gesture

def check_ready_state(landmarks):
    try:
        if len(landmarks) < 33:
            return False

        def is_visible(index, th=0.5):
            return landmarks[index].get("visibility", 0.0) > th

        knee_ready = is_visible(25) or is_visible(26)
        hip_ready = is_visible(23) or is_visible(24)
        x_center = landmarks[0].get("x", 0.5)
        center_ready = (1/3) <= x_center <= (2/3)

        return knee_ready and center_ready

    except Exception:
        return False

def extract_pose_features(landmarks, landmark_indices=None):
    try:
        if landmark_indices is None:
            landmark_indices = [0, 9, 10, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26]

        selected = [landmarks[i] for i in landmark_indices]
        xs = [lm['x'] for lm in selected]
        ys = [lm['y'] for lm in selected]

        x_center = (landmarks[23]['x'] + landmarks[24]['x']) / 2
        norm_xs = [(x - x_center) for x in xs]

        y_center = (landmarks[11]['y'] + landmarks[12]['y']) / 2
        norm_ys = [(y - y_center) for y in ys]

        shoulder_y = y_center
        knee_y = (landmarks[25]['y'] + landmarks[26]['y']) / 2
        scale = max(abs(knee_y - shoulder_y), 1e-6)
        norm_xs = [x / scale for x in norm_xs]
        norm_ys = [y / scale for y in norm_ys]

        features = []
        for x, y in zip(norm_xs, norm_ys):
            features.extend([x, y])

        return features
    except Exception:
        return None

def checkVisibility(landmarks):
    try:
        if not landmarks or len(landmarks) < 33:  # Need all landmarks
            return False

        # Key landmarks
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_hip = landmarks[23]
        right_hip = landmarks[24]

        # Check visibility (threshold: 0.5)
        if (
            left_wrist.get("visibility", 0) > 0.5 and
            right_wrist.get("visibility", 0) > 0.5 and
            left_shoulder.get("visibility", 0) + right_shoulder.get("visibility", 0) > 0.75 and
            left_hip.get("visibility", 0) > 0.5 and
            right_hip.get("visibility", 0) > 0.5
        ):
            return True
        else:
            return False
        
    except Exception as e:
        print(f"Error in liveForceGenerator: {e}")
        return False
        
def liveForceGenerator(landmarks):
    """Compute forces from MediaPipe pose message based on wrist height and pitch gesture."""
    try:
        # Extract landmarks from message
        if not checkVisibility(landmarks):
            return (0, 0, 0, 0), False

        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_hip = landmarks[23]
        right_hip = landmarks[24]

        # Shoulder/hip y-range for normalization
        left_range = left_hip["y"] - left_shoulder["y"]
        right_range = right_hip["y"] - right_shoulder["y"]
        if left_range == 0 or right_range == 0:
            return (0, 0, 0, 0), False

        # Normalize wrist height relative to torso
        left_norm = (left_hip["y"] - left_wrist["y"]) / left_range * 2 - 1
        right_norm = (right_hip["y"] - right_wrist["y"]) / right_range * 2 - 1

        # Clamp and flip (person facing car)
        left_force = max(-1, min(1, right_norm))
        right_force = max(-1, min(1, left_norm))

        # convert to heave and roll
        heave_force = 0.5 * (left_force + right_force)
        roll_force  = 0.5 * (left_force - right_force)

        # --- Pitch force computation ---
        wrist_dist = abs(left_wrist["x"] - right_wrist["x"])
        shoulder_dist = abs(left_shoulder["x"] - right_shoulder["x"])
        if shoulder_dist == 0:
            pitch_force = 0
        else:
            pitch_force = (wrist_dist - shoulder_dist) / (2 * shoulder_dist)
            pitch_force = max(-1, min(1, pitch_force))  # Clamp to [-1, 1]

        # Combine base and pitch forces (scale pitch as well)
        fl = liveForceScale * (heave_force + roll_force + pitch_force)
        fr = liveForceScale * (heave_force - roll_force + pitch_force)
        rl = liveForceScale * (heave_force + roll_force - pitch_force)
        rr = liveForceScale * (heave_force - roll_force - pitch_force)

        force_command = (fl, fr, rl, rr)

        # Final filter for tiny values
        threshold = 1e-3
        if all(abs(f) < threshold for f in force_command):
            return (0, 0, 0, 0), False
        else:
            return force_command, True

    except Exception as e:
        print("Error in liveForceGenerator:", e)
        return (0, 0, 0, 0), False
# mapping/gesture_track_mapper.py

import json
from player.motion_player import BEHAVIORS, load_motion_lib

class GestureTrackMapper:
    def __init__(self, path="tracks/gesture2motion.json"):
        self.mapping_path = path
        self.load_mapping()

    def load_mapping(self):
        with open(self.mapping_path, "r") as f:
            self.mapping = json.load(f)

    def save_mapping(self):
        with open(self.mapping_path, "w") as f:
            json.dump(self.mapping, f, indent=4)
    
    def get_mapping(self):
        result = []
        for gesture, data in self.mapping.items():
            motion = data.get("motion")
            if motion not in load_motion_lib():
                motion = "none"
            behavior = data.get("behavior")
            if behavior not in BEHAVIORS:
                behavior = "disable"
            frames = data.get("frames", 3)
            channel = data.get("channel", 0)
            
            result.append({
                "gesture": gesture,
                "motion": motion,
                "behavior": behavior,
                "frames": frames,
                "channel": channel
            })
        return result

    def map_gesture_track(self, gesture):
        data = self.mapping.get(gesture, {})
        motion = data.get("motion", "none")
        behavior = data.get("behavior", "disable")
        frames = data.get("frames", 3)
        channel = data.get("channel", 0)
        return motion, behavior, frames, channel
    
    def update_gesture_track(self, gesture, motion, behavior, frames, channel):
        data = self.mapping.get(gesture, {})
        if not data:
            return "gesture"
        if motion not in load_motion_lib():
            return "motion"
        data["motion"] = motion
        data["behavior"] = behavior
        data["frames"] = frames
        data["channel"] = channel
        return None
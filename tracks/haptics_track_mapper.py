
# mapping/haptics_track_mapper.py

import json
from player.motion_player import load_motion_lib, BEHAVIORS

class HapticsTrackMapper:
    def __init__(self, path="tracks/haptics2motion.json"):
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
        for program, haptics in self.mapping.items():
            haptics_list = []
            for hid, props in haptics.items():
                entry = {"haptics": hid}
                entry.update(props)
                if entry.get("motion") not in load_motion_lib():
                    entry["motion"] = "none"
                if entry.get("behavior") not in BEHAVIORS:
                    entry["behavior"] = "replace"
                haptics_list.append(entry)

            result.append({
                "program": program,
                "hapticsList": haptics_list
            })
        return result

    def get_program_list(self):
        return list(self.mapping.keys())
    
    def to_haptics(self, largeMotor, smallMotor):
        return f"{largeMotor:03d}:{smallMotor:03d}"

    def add_haptics_track(self, program, haptics):
        self.mapping.setdefault(program, {}).setdefault(haptics, {
            "motion": "none",
            "behavior": "replace",
            "scale": 0.5,
            "channel": 0
        })
    
    def update_haptics_track(self, program, haptics, motion, behavior, scale, channel, alias=None):
        if motion not in load_motion_lib():
            return "motion"
        
        if behavior not in BEHAVIORS:
            return "behavior"
        
        data = self.mapping.get(program, {}).get(haptics)
        if not data:
            return "haptics"
        
        data["motion"] = motion
        data["behavior"] = behavior
        data["scale"] = scale
        data["channel"] = channel
        if alias:
            data["alias"] = alias
        
        return None
    
    def delete_haptics_entry(self, program, haptics):
        program_mapping = self.mapping.get(program, {})
        result = program_mapping.pop(haptics, None)
        if not program_mapping:
            self.mapping.pop(program, None)
        return result
    
    def delete_haptics_track(self, program):
        return self.mapping.pop(program, None)

    def map_haptics_track(self, program, haptics):
        data = self.mapping.get(program, {}).get(haptics)
        motion = data.get("motion")
        behavior = data.get("behavior")
        scale = data.get("scale")
        channel = data.get("channel", 0)
        return motion, behavior, scale, channel
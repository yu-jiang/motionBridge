import json
from pathlib import Path

MOTION_TYPES = ["sine", "ramp", "impulse", "min_jerk", "twin_peak", "white_noise", "bezier_curve", "composite"]

class MotionPresets:
    def __init__(self, preset_json_path="editor/motion_presets.json"):
        self.preset_json_path = preset_json_path
        self.load_mapping()
    
    def load_mapping(self):
        with open(self.preset_json_path, "r") as f:
            self.mapping = json.load(f)
    
    def save_mapping(self):
        sorted_dict = dict(sorted(self.mapping.items()))
        with open(self.preset_json_path, "w") as f:
            json.dump(sorted_dict, f, indent=4)
        self.mapping = sorted_dict
    
    def get_all_presets(self):
        return list(self.mapping.keys())
    
    def get_presets_of_type(self, preset_type):
        if preset_type not in MOTION_TYPES:
            return []
        presets = []
        for name, entry in self.mapping.items():
            if entry.get("type") == preset_type:
                presets.append(name)
        return presets
    
    def read_preset(self, preset_name):
        return self.mapping.get(preset_name)

    def write_preset(self, preset):
        preset_name = preset.get('name')
        if not preset_name or preset.get('type') not in MOTION_TYPES:
            return False
        self.mapping[preset_name] = preset
        self.save_mapping()
        return True
    
    def rename_preset(self, old_name, new_name):
        if old_name not in self.mapping or new_name in self.mapping:
            return False
        self.mapping[new_name] = self.mapping.pop(old_name)
        self.mapping[new_name]['name'] = new_name
        self.save_mapping()
        return True

    def remove_preset(self, name):
        if name in self.mapping:
            del self.mapping[name]
            self.save_mapping()
            return True
        return False
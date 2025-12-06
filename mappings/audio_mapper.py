
# mapping/audio_mapper.py

import json
from pathlib import Path

AUDIO_PATH = "public/audios"
AUDIO_JSON_PATH = "mappings/audio2motion.json"

class AudioMapper:
    def __init__(self, audio_dir_path=AUDIO_PATH):
        self.audio_dir = Path(audio_dir_path)
        self.mapping_path = AUDIO_JSON_PATH
        self.load_mapping()
        self.flip = False
        self.sign = 1
    
    def get_empty_mapping(self):
        return { 
            "motion": "none",
            "behavior": "disable",
            "scale": 1.0,
            "channel": 0
        }
    
    def load_mapping(self):
        with open(self.mapping_path, "r") as f:
            self.mapping = json.load(f)

    def save_mapping(self):
        with open(self.mapping_path, "w") as f:
            json.dump(self.mapping, f, indent=4)
    
    def update_mapping(self, data):
        self.mapping = data
        self.save_mapping()
    
    def get_all_audios(self):
        audios = {f for f in self.audio_dir.glob("*") if f.suffix in [".mp3", ".wav", ".m4a"]}
        return [f.name for f in audios]
    
    def get_mapping(self):
        return self.mapping
    
    def map_audio(self):
        motion = self.mapping.get("motion", "none")
        behavior = self.mapping.get("behavior", "disable")
        scale = self.mapping.get("scale", 1.0)
        if self.flip:
            scale *= self.sign
            self.sign *= -1
        channel = self.mapping.get("channel", 0)
        return motion, behavior, scale, channel
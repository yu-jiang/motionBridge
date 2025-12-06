
# mapping/video_mapper.py

import json
from pathlib import Path

VIDEO_PATH = "public/videos"
VIDEO_JSON_PATH = "public/videos"

class VideoMapper:
    def __init__(self, video_dir_path=VIDEO_PATH, json_dir_path=VIDEO_JSON_PATH):
        self.video_dir = Path(video_dir_path)
        self.json_dir = Path(json_dir_path)

    def get_all_videos(self):
        videos = {f for f in self.video_dir.glob("*") if f.suffix in [".mp4", ".mov", ".youtube"]}
        return [f.name for f in videos]

    def get_all_jsons(self):
        return [f.name for f in self.json_dir.glob("*.json")]
    
    def get_mapping(self, file_base):
        videos = self.get_all_videos()
        if file_base not in videos:
            return None
        json_path = self.json_dir / f"{file_base}.json"
        if not json_path.exists():
            return None
        with open(json_path, "r") as f:
            data = json.load(f)
        return data
    
    def save_mapping(self, file_base, data):
        path = self.json_dir / f"{file_base}.json"
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
    
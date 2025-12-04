import json

class MotionLocks:
    def __init__(self, lock_path="editor_utils/editable_motions.json"):
        self.lock_path = lock_path
        self.load_locks()
    
    def load_locks(self):
        with open(self.lock_path, "r") as f:
            self.editable_motions = json.load(f)
    
    def save_locks(self):
        with open(self.lock_path, "w") as f:
            json.dump(self.editable_motions, f, indent=4)
    
    def is_motion_locked(self, motion_name):
        if motion_name == "none":
            return True
        return motion_name not in self.editable_motions
    
    def lock_motion(self, motion_name):
        if motion_name in self.editable_motions:
            self.editable_motions.remove(motion_name)
            self.save_locks()
    
    def unlock_motion(self, motion_name):
        if motion_name not in self.editable_motions:
            self.editable_motions.append(motion_name)
            self.save_locks()
    
    def remove_lock(self, motion_name):
        if motion_name in self.editable_motions:
            self.editable_motions.remove(motion_name)
            self.save_locks()
    
    def get_editable_motions(self):
        return self.editable_motions
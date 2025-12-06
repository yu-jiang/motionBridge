
# player/motion_player.py

from enum import Enum, auto
import json
from pathlib import Path

FREQUENCY = 100
BEHAVIORS = ["disable", "inherit", "replace", "append", "clear", "single"]

class MotionMode(Enum):
    OFF = 0
    EVENT = 1
    LIVE = 2
MODE_LIST = [mode.name.lower() for mode in MotionMode]

TARGET_LIST = [
    "none",
    "bridge",
    "arduino",
    "gamepad"
    ]

motion_dir = Path("motions/")
def load_motion_lib(include_none=True):
    motion_lib = [f.stem for f in motion_dir.iterdir() if f.is_file()]
    if include_none:
        return ["none"] + motion_lib
    else:
        return motion_lib

def load_motion(motion_name):
    if not motion_name:
        return {}
    if motion_name == "none":
        return {}
    path = motion_dir / f"{motion_name}.json"
    if not path.exists():
        return {}
    with open(path, "r") as f:
        motion_data = json.load(f)
    motion_data["duration"] = len(motion_data["flShape"]) / FREQUENCY
    return motion_data

def load_motion_shapes(motion_name):
    if motion_name == "none":
        return []
    path = motion_dir / f"{motion_name}.json"
    with open(path, "r") as f:
        motion_data = json.load(f)

    fl = motion_data["flShape"]
    fr = motion_data["frShape"]
    rl = motion_data["rlShape"]
    rr = motion_data["rrShape"]
    return list(zip(fl, fr, rl, rr))

class MotionPlayer:
    def __init__(self, buffer_size=5000):
        self.mode = MotionMode.OFF
        self.buffer_size = buffer_size

        self.start_index = buffer_size // 3
        self.pointer = self.start_index

        self.buffer = [(0, 0, 0, 0)] * buffer_size
        self.accuracy_buffer = [False] * buffer_size
        self.latest_force = (0, 0, 0, 0)
        self.accuracy = False
        self.latest_motion = "none"

    def set_mode(self, new_mode: MotionMode):
        self.mode = new_mode
        self._reset_buffer()

    def _reset_buffer(self):
        self.buffer = [(0, 0, 0, 0)] * self.buffer_size
        self.accuracy_buffer = [False] * self.buffer_size
        self.pointer = self.start_index

    def update(self, signal=None):
        if self.mode == MotionMode.OFF:
            self.latest_force = (0, 0, 0, 0)
            self.accuracy = False

        elif self.mode == MotionMode.EVENT:
            self.latest_force = self.get_next_buffer_command()

        elif self.mode == MotionMode.LIVE:
            if signal:
                force, acc = signal, True
            else:
                force, acc = (0, 0, 0, 0), True
            self.latest_force = force
            self.accuracy = acc

        return self.latest_force

    def handle_motion(self, motion, behavior="disable", scale = 1.0):
        motion_sequence = load_motion_shapes(motion)
    
        print(f"[MotionPlayer] Handling motion {motion} with behavior: {behavior}, length = {len(motion_sequence)}")
        print(f"Pointer before: {self.pointer}, start_index: {self.start_index}")
        N = len(motion_sequence)
        if N == 0:
            return
        scale_abs = abs(scale)
        if scale_abs <= 1 and scale_abs > 0:
            motion_sequence = [tuple(x * scale for x in tup) for tup in motion_sequence]

        # Allow only if the last motion is different
        if behavior == "single" and motion != self.latest_motion:
            behavior = "replace"
        
        # same motion persists, other motion interrupts
        if behavior == "inherit":
            behavior = "append" if self.latest_motion == motion else "replace"

        if behavior == "replace":
            self._reset_buffer()
            if self.start_index + N > self.buffer_size:
                return
            self.buffer[self.start_index:self.start_index+N] = motion_sequence
            self.accuracy_buffer[self.start_index:self.start_index+N] = [True] * N
            self.pointer = self.start_index + N

        if behavior == "append":
            if self.pointer + N > self.buffer_size:
                return
            self.buffer[self.pointer:self.pointer+N] = motion_sequence
            self.accuracy_buffer[self.pointer:self.pointer+N] = [True] * N
            self.pointer += N

        if behavior == "clear":
            self._reset_buffer()
        
        self.latest_motion = motion
    
    def handle_motion_data(self, motion_data, behavior="disable", scale = 1.0):
        motion = motion_data.get("name")
        if not motion:
            return
        motion_sequence = list(zip(
            motion_data.get("flShape", []),
            motion_data.get("frShape", []),
            motion_data.get("rlShape", []),
            motion_data.get("rrShape", []),
        ))
    
        print(f"[MotionPlayer] Handling motion {motion} with behavior: {behavior}, length = {len(motion_sequence)}")
        print(f"Pointer before: {self.pointer}, start_index: {self.start_index}")
        N = len(motion_sequence)
        if N == 0:
            return
        scale_abs = abs(scale)
        if scale_abs <= 1 and scale_abs > 0:
            motion_sequence = [tuple(x * scale for x in tup) for tup in motion_sequence]

        # Allow only if the last motion is different
        if behavior == "single" and motion != self.latest_motion:
            behavior = "replace"
        
        # same motion persists, other motion interrupts
        if behavior == "inherit":
            behavior = "append" if self.latest_motion == motion else "replace"

        if behavior == "replace":
            self._reset_buffer()
            if self.start_index + N > self.buffer_size:
                return
            self.buffer[self.start_index:self.start_index+N] = motion_sequence
            self.accuracy_buffer[self.start_index:self.start_index+N] = [True] * N
            self.pointer = self.start_index + N

        if behavior == "append":
            if self.pointer + N > self.buffer_size:
                return
            self.buffer[self.pointer:self.pointer+N] = motion_sequence
            self.accuracy_buffer[self.pointer:self.pointer+N] = [True] * N
            self.pointer += N

        if behavior == "clear":
            self._reset_buffer()
        
        self.latest_motion = motion

    def get_next_buffer_command(self):
        cmd = self.buffer[self.start_index]
        self.buffer = self.buffer[1:] + [(0, 0, 0, 0)]
        self.accuracy_buffer = self.accuracy_buffer[1:] + [False]
        self.pointer = max(self.pointer-1, self.start_index)
        return cmd
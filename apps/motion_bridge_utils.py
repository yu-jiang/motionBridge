from mappings.haptics_mapper import HapticsMapper
from mappings.gesture_mapper import GestureMapper
from mappings.audio_mapper import AudioMapper
from player.motion_player import MODE_LIST, TARGET_LIST
import logging
from .schema import *
import json
import time
from jsonschema import validate

__all__ = [
    "player_config",
    "load_player_config",
    "save_player_config",
    "player_clients",
    "input_clients",
    "output_clients",
    "status_clients",
    "haptics_mapper",
    "gesture_mapper",
    "audio_mapper",
    "adapt_motion",
    "adapt_signal",
    "set_target_adaptors",
    "send_motion",
    "send_motion_data",
    "send_signal",
    "send_status_update",
    "broadcast_forces",
    "broadcast_status",
    "logger",
]

logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
logging.getLogger('hypercorn.access').disabled = True
logging.getLogger('hypercorn.error').disabled = True
logger = logging.getLogger("MotionBridge")

PLAYER_CONFIG_PATH = "apps/player_config.json"
player_config = {
    "mode": "off",
    "target": "none"
}

def load_player_config():
    global player_config
    with open(PLAYER_CONFIG_PATH, "r") as f:
        data = json.load(f)
        mode = data.get("mode", "off")
        target = data.get("target", "none")
        if mode in MODE_LIST:
            player_config["mode"] = mode
        if target in TARGET_LIST:
            player_config["target"] = target

def save_player_config():
    global player_config
    local_config = player_config.copy()
    local_config.pop("target_connected", None)
    with open(PLAYER_CONFIG_PATH, "w") as f:
        json.dump(local_config, f, indent=4)

player_clients = set()
input_clients = set()
output_clients = set()
status_clients = set()
haptics_mapper = HapticsMapper()
gesture_mapper = GestureMapper()
audio_mapper = AudioMapper()

adaptor_name = None
adapt_motion = None
adapt_signal = None

def set_target_adaptors(_target):
    global adapt_motion, adapt_signal, adaptor_name
    adaptor_name = None
    adapt_motion = None
    adapt_signal = None

async def send_motion_data(motion_data, behavior, scale):
    validate(instance=motion_data, schema=motionSchema)
    package = {
        "command": "motion_data",
        "motion_data": motion_data,
        "behavior": behavior,
        "scale": scale,
        "time_stamp": time.time()
    }
    if not player_clients:
        logger.info(f"MotionPlayer is disconnected.")
    for player in player_clients:
        try:
            await player.send(json.dumps(package))
            logger.info(f"Sent motion data to player.")
        except Exception as e:
            logger.info(f"Failed to send motion data to player: {e}")

async def send_motion(motion, behavior, scale, channel):
    motion_data = None
    if adapt_motion:
        motion, behavior, scale, motion_data = adapt_motion(motion, behavior, scale, channel)
    if not motion and motion_data:
        await send_motion_data(motion_data, behavior, scale)
        return
    package = {
        "command": "motion",
        "motion": motion,
        "behavior": behavior,
        "scale": scale,
        "time_stamp": time.time()
    }
    if not player_clients:
        logger.info(f"MotionPlayer is disconnected. Package: {package}")
    for player in player_clients:
        try:
            await player.send(json.dumps(package))
            logger.info(f"Sent motion to player. Package: {package}")
        except Exception as e:
            logger.info(f"Failed to send motion to player: {e}")

async def send_signal(signal, muted=True):
    if adapt_signal:
        signal = adapt_signal(signal)
    package = {
        "command": "signal",
        "signal": signal,
        "time_stamp": time.time()
    }
    if not player_clients:
        if not muted:
            logger.info(f"MotionPlayer is disconnected. Package: {package}")
    for player in player_clients:
        try:
            await player.send(json.dumps(package))
            if not muted:
                logger.info(f"Sent signal to player. Package: {package}")
        except Exception as e:
            if not muted:
                logger.info(f"Failed to send signal to player: {e}")

async def send_status_update(mode=None, target=None):
    package = {
        "command": "mode_update"
    }
    if mode == "shutdown":
        package["command"] = "shutdown"
    elif mode:
        package["mode"] = mode
    if target:
        package["target"] = target
    if not player_clients:
        logger.info(f"MotionPlayer is disconnected. Package: {package}")
    for player in player_clients:
        try:
            await player.send(json.dumps(package))
            logger.info(f"Sent status to player. Package: {package}")
        except Exception as e:
            logger.info(f"Failed to send status to player: {e}")

async def broadcast_forces(forces, muted=True):
    package = {
        "command": "forces",
        "forces": forces,
    }
    if not output_clients:
        if not muted:
            logger.info(f"No output clients connected. Package: {package}")
    for client in output_clients:
        try:
            await client.send(json.dumps(package))
            if not muted:
                logger.info(f"Sent forces to output client. Package: {package}")
        except Exception as e:
            if not muted:
                logger.info(f"Failed to send forces to output client: {e}")

async def broadcast_status():
    package = {
        "player_connected": bool(player_clients),
        "player_mode": player_config["mode"],
        "player_target": player_config["target"],
        "input_clients": [client.id for client in input_clients],
        "output_clients": [client.id for client in output_clients],
        "target_connected": player_config.get("target_connected", False)
    }
    for client in status_clients:
        try:
            await client.send(json.dumps(package))
            logger.info(f"Sent status to output client. Package: {package}")
        except Exception as e:
            logger.info(f"Failed to send status to output client: {e}")
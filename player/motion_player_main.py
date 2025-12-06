import asyncio
import websockets  # or any async client
import time
import json
import argparse
import threading
from player.motion_player import MotionPlayer, MotionMode, MODE_LIST, TARGET_LIST
from output.bridge_driver import BridgeDriver
from output.gamepad_driver import GamepadDriver
from player.player_utils import BRIDGE_API

EMPTY_BEHAVIOR = "disable"
EMPTY_SCALE = 0.0

async def main(_mode="none", _target="none", silent=False):
    stop_event = threading.Event()
    signal = None
    motion_command = {}
    motion_data = {}

    player = MotionPlayer()
    hardware = None
    send = lambda force: None
    forces = []

    def get_signal():
        nonlocal signal
        return signal

    def get_motion_command():
        nonlocal motion_command
        command = motion_command
        motion_command = {}
        return command
    
    def get_motion_data_command():
        nonlocal motion_data
        data = motion_data
        motion_data = {}
        return data
    
    def set_target(target):
        nonlocal hardware, send, _target, signal
        signal = (0, 0, 0, 0)
        if hasattr(hardware, 'shutdown'):
            hardware.shutdown()
        elif target == "none":
            hardware = None
            send = lambda force: None
        elif target == "bridge":
            hardware = BridgeDriver(BRIDGE_API)
            send = lambda force: hardware.send(force)
            hardware.connect()
        elif target == "arduino":
            from output.arduino_driver import ArduinoDriver
            hardware = ArduinoDriver()
            hardware.connect()
            send = lambda force: hardware.send(force)
        elif target == "gamepad":
            hardware = GamepadDriver()
            hardware.connect()
            send = lambda force: hardware.send(force)
        _target = target
    
    def set_mode(mode):
        nonlocal signal
        signal = (0, 0, 0, 0)
        if mode == "event":
            player.set_mode(MotionMode.EVENT)
            print("Running EVENT mode using WebSocket input...")
        elif mode == "live":
            player.set_mode(MotionMode.LIVE)
            print("Running LIVE mode using WebSocket input...")
        elif mode == "off":
            player.set_mode(MotionMode.OFF)
            print("Running OFF mode...")
    
    def is_target_connected():
        nonlocal hardware
        if hasattr(hardware, 'connected'):
            return hardware.connected
        return False
    
    def run_task_sync():
        nonlocal forces
        prev_time = time.perf_counter()
        target_interval = 0.01
        next_time = time.perf_counter() + target_interval
        i = 0
        while not stop_event.is_set():
            now = time.perf_counter()
            dt = (now - prev_time) * 1000
            prev_time = now
            _signal = get_signal()
            _command = get_motion_command()
            _data_command = get_motion_data_command()
            if _command:
                player.handle_motion(
                    _command["motion"], 
                    _command["behavior"], 
                    _command["scale"]
                )
            elif _data_command:
                player.handle_motion_data(
                    _data_command["motion_data"], 
                    _data_command["behavior"], 
                    _data_command["scale"]
                    )
            force = player.update(_signal)
            send(force)
            if not silent:
                print(f"[{player.mode.name} {_target} {i+1}] Sent: {force}, ∆t: {dt:.2f} ms")
            next_time += target_interval
            time.sleep(max(0, next_time - time.perf_counter()))
            i += 1
        
        if hasattr(hardware, 'shutdown'):
            hardware.shutdown()

    async def listen_task():
        nonlocal signal, motion_command, motion_data
        try:
            async with websockets.connect(BRIDGE_API) as ws:
                await ws.send(json.dumps({
                    "mode": player.mode.name.lower(), 
                    "target": _target,
                    "target_connected": is_target_connected()
                    }))
                async for msg in ws:
                    data = json.loads(msg)
                    if data.get("command") in ["signal", "motion", "motion_data"]:
                        signal = data.get("signal")
                        if data.get("motion"):
                            motion_command = {
                                "motion": data.get("motion"),
                                "behavior": data.get("behavior", EMPTY_BEHAVIOR),
                                "scale": data.get("scale", EMPTY_SCALE)
                            }
                        elif data.get("motion_data"):
                            motion_data = {
                                "motion_data": data.get("motion_data"),
                                "behavior": data.get("behavior", EMPTY_BEHAVIOR),
                                "scale": data.get("scale", EMPTY_SCALE)
                            }
                    else:
                        if data.get("command") == "shutdown":
                            break
                        new_mode = data.get("mode")
                        if new_mode:
                            set_mode(new_mode)
                        new_target = data.get("target")
                        if new_target:
                            set_target(new_target)
                        await ws.send(json.dumps({
                            "mode": player.mode.name.lower(), 
                            "target": _target,
                            "target_connected": is_target_connected()
                            }))
        except (websockets.ConnectionClosedError, ConnectionRefusedError) as e:
            print("Unable to connect to MotionBridge.")
        except Exception as e:
            print(f"Unexpected error: {e}.")
        finally:
            stop_event.set()
    
    set_target(_target)
    set_mode(_mode)

    run_thread = threading.Thread(target=run_task_sync, daemon=True)
    run_thread.start()

    await listen_task()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-m", "--mode", choices=MODE_LIST, default="off", help="Player playback mode")
    parser.add_argument("-t", "--target", choices=TARGET_LIST, default="none", help="Player force output target")
    parser.add_argument("-s", "--silent", action="store_true", help="Disable console output")
    args = parser.parse_args()
    asyncio.run(main(args.mode, args.target, args.silent))
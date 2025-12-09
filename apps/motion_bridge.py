from quart import Quart, request, websocket, jsonify
from .motion_bridge_utils import *
from .motion_editor import editor, presets, locks
from .video_mapping_editor import video
from .audio_mapping_editor import audio
from .motion_jedi import jedi
from input.jedi.jedi_utils import load_jedi_config, SPECIAL_GESTURES
from jsonschema import validate, ValidationError
from .schema import *
from player.motion_player import MODE_LIST, TARGET_LIST, load_motion_lib
import json
import asyncio
import subprocess
import sys

player_process = None
haptics_process = None
audio_process = None
gamepad_process = None

bridge = Quart(__name__, static_folder="../public", static_url_path="/public")
bridge.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 200  # 500 MB

@bridge.before_serving
async def before_serving():
    load_player_config()
    set_target_adaptors(player_config["target"])
    await broadcast_status()

# clients who send event inputs
@bridge.websocket("/input", endpoint="input_channel")
async def input_channel():
    client_id = websocket.args.get("client", "unknown")
    client = websocket._get_current_object()
    client.id = client_id
    input_clients.add(client)
    logger.info(f"[Input: {client_id}] Connected!")
    await broadcast_status()
    try:
        while True:
            message = await websocket.receive()
            logger.info(f"[Input: {client_id}] Received: {message}.")
            data = json.loads(message)

            motion, behavior, scale, fallback = None, None, None, None
            
            if "program" in data:
                validate(instance=data, schema=hapticsInputSchema)
                program = data["program"]
                largeMotor = data["largeMotor"]
                smallMotor = data["smallMotor"]
                haptics = haptics_mapper.to_haptics(largeMotor=largeMotor, smallMotor=smallMotor)
                motion, behavior, scale, fallback = haptics_mapper.map_haptics(program=program, haptics=haptics)
                if not motion:
                    logger.info(f"[Input: {client_id}] New event detected. Now saving...")
                    haptics_mapper.add_mapping(program=program, haptics=haptics)
                    haptics_mapper.save_mapping()
            elif "timeOffset" in data:
                validate(instance=data, schema=videoEventSchema)
                motion = data["motion"]
                behavior = data["behavior"]
                scale = data["scale"]
                fallback = data["fallback"]
            elif "beat" in data:
                motion, behavior, scale, fallback = audio_mapper.map_audio()
            
            if motion and behavior and scale:
                await send_motion(motion, behavior, scale, fallback)

    except ValidationError as ve:
        logger.info(f"[Input: {client_id}] Validation Error: {ve.message}")
    except asyncio.CancelledError:
        logger.info(f"[Input: {client_id}] Disconnected.")
    except Exception as e:
        logger.info(f"Error: {e}")
    finally:
        input_clients.discard(client)
        logger.info(f"[Input: {client_id}] Disconnected.")
        await broadcast_status()

# fallback for the motion player
# may add authentication later
@bridge.websocket("/player", endpoint="player_channel")
async def player_channel():
    global target_connected
    player = websocket._get_current_object()
    player_clients.add(player)
    logger.info(f"[MotionPlayer] Connected!")
    await broadcast_status()
    try:
        while True:
            message = await websocket.receive()
            data = json.loads(message)
            forces = data.get("forces")
            if forces:
                await broadcast_forces(forces, True)
            else:
                logger.info(f"[MotionPlayer] Received: {message}.")
                mode = data.get("mode")
                target = data.get("target")
                if mode and target:
                    player_config["mode"] = mode
                    player_config["target"] = target
                    save_player_config()
                    set_target_adaptors(target)
                    await broadcast_status()
                connected = data.get("target_connected")
                if type(connected) == bool:
                    player_config["target_connected"] = connected
                    await broadcast_status()
    except Exception as e:
        logger.info(f"[MotionPlayer] Error: {e}")
    finally:
        player_config["target_connected"] = False
        player_clients.discard(player)
        logger.info(f"[MotionPlayer] Disconnected.")
        await broadcast_status()


# clients who receive MotionBridge and MotionPlayer status updates
@bridge.websocket("/status", endpoint="status_channel")
async def status_channel():
    client_id = websocket.args.get("client", "unknown")
    client = websocket._get_current_object()
    client.id = client_id
    status_clients.add(client)
    logger.info(f"[Output: {client_id}] Connected!")
    await broadcast_status()
    try:
        while True:
            message = await websocket.receive()
            pass
    except Exception as e:
        logger.info(f"[Output: {client_id}] Error: {e}")
    finally:
        status_clients.discard(client)
        logger.info(f"[Output: {client_id}] Disconnected.")
        await broadcast_status()


# clients who receive force array outputs
@bridge.websocket("/output", endpoint="output_channel")
async def output_channel():
    client_id = websocket.args.get("client", "unknown")
    client = websocket._get_current_object()
    client.id = client_id
    output_clients.add(client)
    logger.info(f"[Output: {client_id}] Connected!")
    await broadcast_status()
    try:
        while True:
            message = await websocket.receive()
    except Exception as e:
        logger.info(f"[Output: {client_id}] Error: {e}")
    finally:
        output_clients.discard(client)
        logger.info(f"[Output: {client_id}] Disconnected.")
        await broadcast_status()

@bridge.route("/api/player", methods=["POST"])
async def player_api():
    """
    Update MotionPlayer mode and target.
    """
    try:
        if not player_clients:
            logger.info("MotionPlayer is disconnected.")
            return jsonify({"error": "MotionPlayer is disconnected."}), 503

        data = await request.get_json(force=True, silent=True)
        if "mode" not in data or "target" not in data:
            return jsonify({"error": "Missing 'mode' or 'target' field"}), 400
        mode = data["mode"]
        target = data["target"]

        if mode not in MODE_LIST:
            return jsonify({"error": f"Valid modes: {MODE_LIST}"}), 400
        if target not in TARGET_LIST:
            return jsonify({"error": f"Valid targets: {TARGET_LIST}"}), 400
        
        if mode != player_config["mode"] or target != player_config["target"]:
            await send_status_update(mode, target)
        logger.info(f"Sent config change to MotionPlayer.")
        return jsonify({"message": "Sent config change to MotionPlayer."})
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@bridge.route("/api/player/target")
async def get_player_targets():
    return TARGET_LIST

@bridge.route("/api/player/mode")
async def get_player_modes():
    return MODE_LIST

@bridge.route("/api/start/<service>", methods=["POST"])
async def start_service(service):
    global player_process, haptics_process, audio_process, gamepad_process
    message = ""
    if service == "player":
        if player_clients or (player_process and player_process.poll() is None):
            message = "MotionPlayer is already running."
        else:
            player_process = subprocess.Popen([
                "python", "-m", "player.motion_player_main", 
                "-m", player_config["mode"], 
                "-t", player_config["target"], 
                "-s"
                ])
            message = "Sent startup signal to MotionPlayer."
    elif service == "haptics":
        if "haptics" in [client.id for client in input_clients] or (haptics_process and haptics_process.poll() is None):
            message = "HapticsMonitorService is already running."
        else:
            haptics_process = subprocess.Popen([
                "dotnet", "run", "--", "silent"
                ], cwd="input/HapticsMonitorService")
            message = "Sent startup signal to HapticsMonitor."
    elif service == "audio":
        if "audio" in [client.id for client in input_clients] or (audio_process and audio_process.poll() is None):
            message = "BeatDetector is already running."
        else:
            audio_process = subprocess.Popen([
                sys.executable, "-m", "input.audio.beat_detector.py"
                ])
            message = "Sent startup signal to BeatDetector."
    elif service == "gamepad":
        if "gamepad" in [client.id for client in output_clients] or (gamepad_process and gamepad_process.poll() is None):
            message = "GamepadDriver is already running."
        else:
            gamepad_process = subprocess.Popen([
                ".\\output\\GamepadDriver\\x64\\Release\\GamepadDriver.exe", "-s"
                ])
            message = "Sent startup signal to GamepadDriver."
    return jsonify({"message": message})

@bridge.route("/api/stop/<service>", methods=["POST"])
async def stop_service(service):
    global haptics_process, audio_process, gamepad_process
    message = ""
    if service == "player":
        if player_clients:
            await send_status_update(mode="shutdown")
            message = "Sent shutdown signal to MotionPlayer."
        else:
            message = "MotionPlayer is not running."
        return jsonify({"message": message})
    elif service == "haptics":
        if haptics_process and haptics_process.poll() is None:
            haptics_process.terminate()
            message = "Terminated HapticsMonitor."
        else:
            message = "HapticsMonitor is not running or running in debug mode."
    elif service == "audio":
        if audio_process and audio_process.poll() is None:
            audio_process.terminate()
            message = "Terminated BeatDetector."
        else:
            message = "BeatDetector is not running or running in debug mode."
    elif service == "gamepad":
        if gamepad_process and gamepad_process.poll() is None:
            gamepad_process.terminate()
            message = "Terminated GamepadDriver."
        else:
            message = "GamepadDriver is not running or running in debug mode."
    return jsonify({"message": message})

@bridge.route("/api/restart/player", methods=["POST"])
async def restart_player():
    if player_clients:
        await send_status_update(target=player_config["target"])
        return jsonify({"message": "Sent restart signal to MotionPlayer."})
    else:
        return jsonify({"message": "MotionPlayer is not running."})


@bridge.route("/api/haptics-mapping", methods=["GET", "POST", "PUT", "DELETE"])
async def haptics_mapping_api():
    try:
        if request.method == "GET":
            return jsonify(haptics_mapper.get_mapping())
        elif request.method == "POST":
            data = await request.get_json(force=True, silent=True)
            validate(instance=data, schema=hapticsMappingSchema)
            program = data["program"]
            haptics_list = data["hapticsList"]
            for entry in haptics_list:
                haptics = entry["haptics"]
                motion = entry["motion"]
                behavior = entry["behavior"]
                scale = entry["scale"]
                fallback = entry["fallback"]
                alias = entry.get("alias", None)
                error =  haptics_mapper.update_mapping(
                    program, haptics, motion, behavior, scale, fallback, alias
                )
                if error:
                    haptics_mapper.load_mapping()
                    return jsonify({"error": f"Invalid {error} mapped to haptics {haptics}"}), 400
            haptics_mapper.save_mapping()
            return jsonify(haptics_mapper.get_mapping())
        elif request.method == "PUT":
            data = await request.get_json(force=True, silent=True)
            logger.info(f"Received data for PUT: {data}")
            validate(instance=data, schema=hapticsEntrySchema)
            program = data["program"]
            haptics = data["haptics"]
            haptics_mapper.delete_haptics_entry(program, haptics)
            haptics_mapper.save_mapping()
            return jsonify(haptics_mapper.get_mapping())
        else:
            data = await request.get_json(force=True, silent=True)
            validate(instance=data, schema=hapticsMappingSchema)
            program = data["program"]
            if not haptics_mapper.delete_program_entry(program):
                return jsonify({"error": f"Haptics map for program {program} not found."}), 404
            haptics_mapper.save_mapping()
            return jsonify(haptics_mapper.get_mapping())
    except ValidationError as ve:
        return jsonify({"error": f"Validation Error: {ve}."}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@bridge.route("/api/gesture-mapping", methods=["GET", "POST"])
async def gesture_mapping_api():
    try:
        if request.method == "GET":
            return jsonify(gesture_mapper.get_mapping())
        else:
            data = await request.get_json(force=True, silent=True)
            validate(instance=data, schema=gestureMappingsSchema)
            for entry in data:
                gesture = entry["gesture"]
                motion = entry["motion"]
                behavior = entry["behavior"]
                frames = entry["frames"]
                fallback = entry["fallback"]
                error = gesture_mapper.update_mapping(gesture, motion, behavior, frames, fallback)
                if error:
                    gesture_mapper.load_mapping()
                    return jsonify({"error": f"Invalid {error}. Gesture: {gesture}"}), 400
            gesture_mapper.save_mapping()
            return jsonify(gesture_mapper.get_mapping())
    except ValidationError as ve:
        return jsonify({"error": f"Validation Error: {ve}."}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500


@bridge.route("/api/special-gesture", methods=["GET"])
async def get_special_gestures():
    return SPECIAL_GESTURES


@bridge.route("/api/reload", methods=["POST"])
async def reload_api():
    """
    Reload all mappings from config files and update motion player status.
    """
    try:
        haptics_mapper.load_mapping()
        audio_mapper.load_mapping()
        gesture_mapper.load_mapping()
        presets.load_mapping()
        locks.load_locks()
        load_jedi_config()
        logger.info("Reloaded all mappings successfully.")
        return jsonify({"message": "Reloaded all mappings successfully."})
    except Exception as e:
        logger.info(f"Unhandled error during reload: {e}")
        return jsonify({"error": f"Unhandled error during reload: {e}"}), 500

@bridge.route("/motion/play", methods=["POST"])
async def play_cached_motion():
    if not player_clients:
        logger.info("MotionPlayer is disconnected.")
        return jsonify({"error": "MotionPlayer is disconnected."}), 503
    data = await request.get_json(force=True, silent=True)
    validate(instance=data, schema=motionSchema)
    motion_name = data["name"]
    await send_motion_data(data, "replace", 1.0)
    return jsonify({"message": f"Sent motion {motion_name} to MotionPlayer."})


@bridge.route("/motion/play/<motion_name>", methods=["POST"])
async def play_motion(motion_name):
    try:
        if not player_clients:
            logger.info("MotionPlayer is disconnected.")
            return jsonify({"error": "MotionPlayer is disconnected."}), 503
        if motion_name not in load_motion_lib():
            return jsonify({"error": f"Motion {motion_name} not found in motion library."}), 404
        await send_motion(motion_name, "replace", 1.0, 0)
        return jsonify({"message": f"Sent motion {motion_name} to MotionPlayer."})
    except Exception as e:
        logger.info(f"Unhandled error during playing motion: {e}")
        return jsonify({"error": f"Unhandled error during playing motion: {e}"}), 500


@bridge.after_serving
async def shutdown():
    if player_clients:
        await send_status_update(mode="shutdown")
    await asyncio.sleep(1)
    await broadcast_status()

bridge.register_blueprint(editor)
bridge.register_blueprint(video)
bridge.register_blueprint(jedi)
bridge.register_blueprint(audio)

if __name__ == "__main__":
    logger.info("WebSocket relay running at ws://localhost:6789")
    logger.info("HTTP server running at http://localhost:6789")
    bridge.run(host="localhost", port=6789)
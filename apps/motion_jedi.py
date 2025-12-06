from quart import Blueprint, websocket
from .motion_bridge_utils import *
import json
import time
import numpy as np
from input.jedi.gestureClassifier import load_models
from input.jedi.jedi_utils import extract_pose_features, check_ready_state, liveForceGenerator, update_jedi_state

jedi = Blueprint('jedi', __name__)

# Jedi related
latest_is_ready_flag = False
force_csv_file = None
gesture_csv_file = None
force_csv_writer = None
gesture_csv_writer = None

models = load_models()

# Jedi related
def get_player_mode():
    return player_to_jedi(player_config.get("mode"))

def player_to_jedi(mode):
    if not latest_is_ready_flag:
        return "not_ready"
    if not bool(player_clients):
        return "inactive"
    match mode:
        case "event":
            return "gesture"
        case "live":
            return "follower"
        case "off":
            return "inactive"
        case _:
            return "inactive"

def run_inference(model, input_tensor, model_type):
    start = time.perf_counter()
    predicted_label = model.infer(input_tensor, model_type)
    inference_time = (time.perf_counter() - start) * 1000
    return predicted_label, inference_time

# Jedi mode handler (both input and output)
@jedi.websocket("/jedi", endpoint="jedi_channel")
async def jedi_channel():
    client = websocket._get_current_object()
    client.id = "jedi"
    logger.info(f"Jedi Connected!")
    input_clients.add(client)
    output_clients.add(client)
    await broadcast_status()

    last_inference_time = 0
    min_interval = 0.1
    gesture_counter = {}
    last_matched_gesture = None

    initial_mode = get_player_mode()
    mode_update = json.dumps({
        "command": "mode_update",
        "mode": initial_mode
    })

    await websocket.send(mode_update)
    logger.info("Sent initial mode update: %s", get_player_mode())

    try:
        while True:
            message = await websocket.receive()
            now = time.perf_counter()
            if now - last_inference_time < min_interval:
                continue
            last_inference_time = now

            try:
                data = json.loads(message)
                model_type = data.get('type')
                landmarks = data.get('landmarks')
                mediapipe_time = data.get('mediapipe_time', 0)

                if model_type not in models:
                    logger.info("Unsupported model type: %s", model_type)
                    continue

                global latest_is_ready_flag
                is_ready_flag = latest_is_ready_flag
                if model_type == "pose" and landmarks:
                    is_ready_flag = check_ready_state(landmarks)
                    global last_pose_timestamp
                    last_pose_timestamp = time.perf_counter()
                elif model_type == "pose":
                    is_ready_flag = False  # pose type but no landmarks
                else:
                    is_ready_flag = True  # assume true for hand, etc.
                if is_ready_flag != latest_is_ready_flag:
                    latest_is_ready_flag = is_ready_flag
                    mode_update = json.dumps({
                        "command": "mode_update",
                        "mode": get_player_mode()
                    })
                    await websocket.send(mode_update)
                    logger.info("Sent mode update: %s", get_player_mode())

                # Always call update_system_state
                # motion_player.update_system_state(latest_is_ready_flag, "none")
                # motion_player.update_state("none", latest_is_ready_flag)
                if not latest_is_ready_flag:
                    await send_signal((0, 0, 0, 0), True) # reset signal
                    continue

                if landmarks and model_type in models:
                    if model_type == 'hand':
                        if landmarks and len(landmarks) > 0:
                            landmarks_flat = landmarks[0]
                        else:
                            logger.info("No hand landmarks detected")
                            gesture_counter.clear()
                            gesture_update = json.dumps({
                                "command": "gesture_update",
                                "detected_gesture": "none",
                                "matched_gesture": "none",
                                "current_count": 0,
                                "required_frames": 0,
                                "previous_gesture": last_matched_gesture or "none",
                                "inference_time": 0,
                                "total_inference_time": 0
                            })
                            await websocket.send(gesture_update)
                            last_matched_gesture = "none"
                            continue
                    else:
                        landmarks_flat = landmarks

                    if model_type == 'pose' and get_player_mode() == "follower":
                        signal, accuracy = liveForceGenerator(landmarks)
                        await send_signal(signal, True)
                        # motion_player.follower_update(data)
                        if not landmarks_flat:
                            logger.info("No pose landmarks detected")
                            gesture_counter.clear()
                            gesture_update = json.dumps({
                                "command": "gesture_update",
                                "detected_gesture": "none",
                                "matched_gesture": "none",
                                "current_count": 0,
                                "required_frames": 0,
                                "previous_gesture": last_matched_gesture or "none",
                                "inference_time": 0,
                                "total_inference_time": 0
                            })
                            await websocket.send(gesture_update)
                            last_matched_gesture = "none"
                            continue

                    if model_type == 'pose':
                        features = extract_pose_features(landmarks_flat)
                        if features is None:
                            logger.info("Failed to extract pose features")
                            continue
                    else:
                        # For hand or face, flatten full xyz (assuming 21 or 468 points respectively)
                        features = [l[k] for l in landmarks_flat for k in ['x', 'y', 'z']]

                    input_tensor = np.array(features, dtype=np.float32).reshape(1, -1)
                    detected_gesture, inference_time = run_inference(models[model_type], input_tensor, model_type)

                    total_inference_time = mediapipe_time + inference_time
                    # logger.info("Detected %s gesture: %s (model inference: %.2fms, total inference: %.2fms)", model_type, detected_gesture, inference_time, total_inference_time)

                    if detected_gesture not in gesture_mapper.mapping:
                        matched_gesture = "unknown"
                        current_count = 0
                        required_frames = 0
                        gesture_counter.clear()
                    else:
                        matched_gesture = detected_gesture
                        required_frames = gesture_mapper.mapping[detected_gesture].get('frames', 3)
                        if matched_gesture == last_matched_gesture:
                            gesture_counter[matched_gesture] = gesture_counter.get(matched_gesture, 0) + 1
                        else:
                            gesture_counter.clear()
                            gesture_counter[matched_gesture] = 1
                        current_count = gesture_counter[matched_gesture]

                    gesture_update = json.dumps({
                        "command": "gesture_update",
                        "detected_gesture": detected_gesture,
                        "matched_gesture": matched_gesture,
                        "current_count": current_count,
                        "required_frames": required_frames,
                        "previous_gesture": last_matched_gesture or "none",
                        "inference_time": round(inference_time, 2),
                        "total_inference_time": round(total_inference_time, 2)
                    })
                    await websocket.send(gesture_update)
                    # logger.info("Sent gesture update: %s -> %s (%d/%d)", detected_gesture, matched_gesture, current_count, required_frames)

                    if matched_gesture != "unknown" and current_count >= required_frames:
                        result = update_jedi_state(latest_is_ready_flag, get_player_mode(), matched_gesture)
                        if result == None:
                            continue # cannot recognize gesture from current landmarks
                        if result == matched_gesture: # gesture confirmed
                            motion, behavior, _, channel = gesture_mapper.map_gesture(matched_gesture)
                            await send_motion(motion, behavior, 1, channel)
                        else: # gesture indicates mode change
                            new_mode = result
                            await send_status_update(mode=new_mode)
                            new_jedi_mode = player_to_jedi(new_mode)
                            mode_update = json.dumps({
                                "command": "mode_update",
                                "mode": new_jedi_mode
                            })
                            await websocket.send(mode_update)
                            logger.info("Sent mode update: %s", new_jedi_mode)

                        # motion_player.update_system_state(latest_is_ready_flag, matched_gesture)
                        # motion_player.update_state(matched_gesture, latest_is_ready_flag)
                        logger.info("Gesture %s confirmed after %d frames, state updated", matched_gesture, current_count)
                        gesture_counter[matched_gesture] = 0
                        gesture_message = json.dumps({"command": "gesture", "gesture": matched_gesture})
                        await websocket.send(gesture_message)
                        # Log gesture to CSV if enabled
                        # if args.log and gesture_csv_writer:
                        #     try:
                        #         time_offset = now - start_time
                        #         gesture_csv_writer.writerow([time_offset, matched_gesture])
                        #         gesture_csv_file.flush()
                        #     except Exception as e:
                        #         logger.error("Error writing to gestures.csv: %s", e)

                    last_matched_gesture = matched_gesture

            except json.JSONDecodeError:
                logger.info("[Jedi] Error: Received invalid JSON: %s", message)
            except Exception as e:
                logger.info("[Jedi] Error processing message: %s", e)
    except Exception as e:
        logger.info("[Jedi] Error: %s", e)
    finally:
        latest_is_ready_flag = False
        input_clients.remove(client)
        output_clients.remove(client)
        await broadcast_status()
        logger.info("Jedi disconnected")
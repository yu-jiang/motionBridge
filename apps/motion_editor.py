from quart import Blueprint, request, jsonify
from jsonschema import validate, ValidationError
from .schema import *
from generator import *
import json
import logging
from pathlib import Path
from player.motion_player import load_motion_lib, load_motion
from editor_utils.motion_presets import MotionPresets, MOTION_TYPES
from editor_utils.motion_locks import MotionLocks

editor = Blueprint("users", __name__)

logger = logging.getLogger("MotionEditor")

presets = MotionPresets()
locks = MotionLocks()

motion_dir = Path("motions/")

def handle_motion_type(motion_type, bezier_curve_baked):
    schema = None
    generate = None
    match motion_type:
        case "sine":
            schema = sineMotionSchema
            generate = generate_sine_motion
        case "ramp":
            schema = rampMotionSchema
            generate = generate_ramp_motion
        case "impulse":
            schema = impulseMotionSchema
            generate = generate_impulse_motion
        case "min_jerk":
            schema = minJerkMotionSchema
            generate = generate_min_jerk_motion
        case "twin_peak":
            schema = twinPeakMotionSchema
            generate = generate_twin_peak_motion
        case "white_noise":
            schema = whiteNoiseMotionSchema
            generate = generate_white_noise_motion
        case "bezier_curve":
            if bezier_curve_baked:
                schema = bakedBezierCurveMotionSchema
            else:
                schema = bezierCurveMotionSchema
            generate = generate_bezier_curve_motion
        case "composite":
            schema = compositeMotionSchema
            generate = generate_composite_motion
    return schema, generate

@editor.route("/motion/generate", methods=["POST"])
async def generate_motion():
    try:
        data = await request.get_json(force=True, silent=True)
        motion_type = data.get("type")
        if not motion_type or motion_type not in MOTION_TYPES:
            return jsonify({"error": "Invalid motion type"}), 400
        schema, generate = handle_motion_type(motion_type, bezier_curve_baked=True)
        if not schema or not generate:
            return jsonify({"error": "Invalid motion type"}), 400
        validate(instance=data, schema=schema)
        if data["name"] in load_motion_lib() and locks.is_motion_locked(data["name"]):
            return jsonify({"error": f"Motion {data["name"]} is protected."}), 400
        motion = generate(data)
        return jsonify(motion)
    except ValueError as e:
        logger.info(f"Value error: {e}")
        return jsonify({"error": str(e)}), 400
    except ValidationError:
        return jsonify({"error": f"Bad request type. Correct format:\n{json.dumps(sineMotionSchema, indent=2)}"}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@editor.route("/motion/save", methods=["POST"])
async def save_motion():
    try:
        data = await request.get_json(force=True, silent=True)
        validate(instance=data, schema=motionSchema)
        if data["name"] in load_motion_lib() and locks.is_motion_locked(data["name"]):
            return jsonify({"error": "Motion name already exists"}), 400
        motion_name = data["name"]
        fpath = motion_dir / f"{motion_name}.json"
        with open(fpath, "w") as f:
            json.dump(data, f, indent=4)
        locks.unlock_motion(motion_name)
        logger.info(f"Saved motion to {fpath}")
        return jsonify({"message": f"Motion {motion_name} saved successfully!"}), 200
    except ValueError as e:
        logger.info(f"Value error: {e}")
        return jsonify({"error": str(e)}), 400
    except ValidationError:
        return jsonify({"error": f"Motion data has incorrect format. Please create a new one"}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@editor.route("/motion/<motion_name>", methods=["GET", "POST", "PUT", "DELETE"])
async def edit_motion_api(motion_name):
    logger.info(f"Accessing motion {motion_name} with method {request.method}")
    try:
        if request.method == "GET":
            fpath = motion_dir / f"{motion_name}.json"
            if not fpath.exists():
                return jsonify({"error": "Motion not found"}), 404
            with open(fpath, "r") as f:
                motion_data = json.load(f)
            validate(instance=motion_data, schema=motionSchema)
            return jsonify(motion_data), 200
        
        schema = motionScaleSchema if request.method == "PUT" else motionSchema
        data = await request.get_json(force=True, silent=True)
        validate(instance=data, schema=schema)
        if locks.is_motion_locked(motion_name):
            return jsonify({"error": "Motion is locked."}), 403
        fpath = motion_dir / f"{motion_name}.json"
        if not fpath.exists():
            return jsonify({"error": "Motion not found"}), 404
        logger.info(f"Received update for motion {motion_name}.")
        
        if request.method == "POST":
            new_motion_name = data["name"]
            is_rename_request = motion_name != new_motion_name
            if is_rename_request and new_motion_name in load_motion_lib():
                return jsonify({"error": "Motion name already exists"}), 400
            with open(fpath, "w") as f:
                json.dump(data, f, indent=4)
            logger.info(f"Updated motion {motion_name}")
            if is_rename_request:
                new_fpath = motion_dir / f"{new_motion_name}.json"
                fpath.rename(new_fpath)
                presets.rename_preset(motion_name, new_motion_name)
                locks.remove_lock(motion_name)
                logger.info(f"Renamed motion to {new_motion_name}")
            return jsonify(data), 200

        elif request.method == "PUT":
            scale = data["scale"]
            motion = data["motion"]
            scaled_motion = scale_motion(motion, scale)
            with open(fpath, "w") as f:
                json.dump(scaled_motion, f, indent=4)
            logger.info(f"Scaled motion {motion_name} by factor {scale}")
            return jsonify(scaled_motion), 200

        if request.method == "DELETE":
            fpath.unlink()
            presets.remove_preset(motion_name)
            locks.remove_lock(motion_name)
            logger.info(f"Deleted motion {motion_name}")
            return jsonify({"message": f"Motion {motion_name} deleted successfully!"}), 200
    except ValueError as e:
        logger.info(f"Value error: {e}")
        return jsonify({"error": str(e)}), 400
    except ValidationError:
        if request.method == "GET":
            return jsonify({"error": f"Motion data is corrupted."}), 500
        else:
            return jsonify({"error": f"Bad request type. Correct format:\n{json.dumps(motionSchema, indent=2)}"}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@editor.route("/motion")
async def get_motion_list():
    try:
        return jsonify(load_motion_lib()), 200
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@editor.route("/motion/<motion_name>/metadata")
async def get_motion_metadata(motion_name):
    try:
        motion_data = load_motion(motion_name)
        if not motion_data:
            return jsonify({"error": "Motion not found"}), 404
        validate(instance=motion_data, schema=motionSchema)
        del motion_data["flShape"]
        del motion_data["frShape"]
        del motion_data["rlShape"]
        del motion_data["rrShape"]
        return motion_data
    except ValidationError:
        return jsonify({"error": f"Motion data is corrupted."}), 500
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@editor.route("/motion/preset", methods=["GET", "POST"])
async def motion_preset_api():
    try:
        if request.method == "GET":
            preset_type = request.args.get("type")
            if preset_type:
                return jsonify(presets.get_presets_of_type(preset_type)), 200
            else:
                return jsonify(presets.get_all_presets()), 200
        elif request.method == "POST":
            data = await request.get_json(force=True, silent=True)
            preset_type = data.get("type")
            if not preset_type or preset_type not in MOTION_TYPES:
                return jsonify({"error": "Invalid preset type"}), 400
            schema, _ = handle_motion_type(data.get("type"), bezier_curve_baked=False)
            if not schema:
                return jsonify({"error": "Invalid preset type"}), 400
            validate(instance=data, schema=schema)
            if presets.write_preset(data):
                logger.info(f"Saved preset {data['name']}")
                return jsonify({"message": f"Preset {data['name']} saved successfully!"}), 200
            else:
                return jsonify({"error": "Invalid preset data"}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@editor.route("/motion/preset/<preset_name>")
async def get_motion_preset_data(preset_name):
    try:
        return jsonify(presets.read_preset(preset_name)), 200
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@editor.route("/motion/lock", methods=["GET", "POST"])
async def motion_lock_api():
    try:
        if request.method == "GET":
            return jsonify(locks.get_editable_motions()), 200
        
        data = await request.get_json(force=True, silent=True)
        validate(instance=data, schema=motionSchema)
        motion_name = data["name"]
        
        if request.method == "POST":
            if locks.is_motion_locked(motion_name):
                locks.unlock_motion(motion_name)
                logger.info(f"Unlocked motion {motion_name}")
                return jsonify(locks.get_editable_motions()), 200
            else:
                locks.lock_motion(motion_name)
                logger.info(f"Locked motion {motion_name}")
                return jsonify(locks.get_editable_motions()), 200
    except ValueError as e:
        logger.info(f"Value error: {e}")
        return jsonify({"error": str(e)}), 400
    except ValidationError:
        return jsonify({"error": f"Bad request type. Correct format:\n{json.dumps(motionSchema, indent=2)}"}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500
from quart import Blueprint, request, jsonify
from tracks.audio_track_mapper import AudioTrackMapper, AUDIO_PATH
from player.motion_player import load_motion
from jsonschema import validate, ValidationError
from .schema import *
import logging
import json
import aiofiles
from pathlib import Path
from werkzeug.utils import secure_filename
from .motion_bridge_utils import audio_track_mapper

audio_dir = Path(AUDIO_PATH)

audio = Blueprint("audio", __name__)

logger = logging.getLogger("AudioTrackEditor")

@audio.route("/api/audio-track", methods=["GET", "POST"])
async def audio_track_api():
    try:
        if request.method == "GET":
            return audio_track_mapper.get_mapping(), 200
        elif request.method == "POST":
            data = await request.get_json(force=True, silent=True)
            validate(instance=data, schema=motionTrackSchema)
            audio_track_mapper.update_mapping(data)
            return audio_track_mapper.get_mapping(), 200
    except ValidationError as ve:
        return jsonify({"error": f"Validation Error: {ve}. Correct format:\n{json.dumps(motionTrackSchema, indent=2)}"}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@audio.route("/api/audio-track/flip", methods=["GET", "POST"])
async def flip_audio_track():
    try:
        if request.method == "GET":
            return {"flip": audio_track_mapper.flip}, 200
        elif request.method == "POST":
            audio_track_mapper.flip = not audio_track_mapper.flip
            return {"flip": audio_track_mapper.flip}, 200
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@audio.route("/api/audio")
async def get_audios():
    try:
        return audio_track_mapper.get_all_audios(), 200
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@audio.route("/api/audio/upload", methods=["POST"])
async def upload_audio():
    try:
        files = await request.files
        audio = files.get("audio")

        if not audio:
            return jsonify({"error": "No audio uploaded"}), 400

        save_path = audio_dir / audio.filename

        # Use aiofiles for async file saving
        async with aiofiles.open(save_path, "wb") as f:
            await f.write(audio.read())

        return jsonify({"message": "Audio uploaded!"}), 200
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@audio.route("/api/audio/<audioFileName>", methods=["POST", "DELETE"])
async def audio_api(audioFileName):
    try:
        audio_path = audio_dir / audioFileName
        if not audio_path.exists():
            return jsonify({"error": "Audio file not found"}), 404
        
        if request.method == "POST":
            data = await request.get_json(force=True, silent=True)
            validate(instance=data, schema=renameSchema)
            newName = data["newName"]
            ext = audio_path.suffix
            newFname = newName + ext
            if newFname == audioFileName:
                return jsonify({"error": "New name is the same as the old name"}), 400
            secure_new_name = secure_filename(newFname)
            if secure_new_name != newFname:
                return jsonify({"error": "New name is invalid"}), 400
            new_path = audio_dir / newFname
            if new_path.exists():
                return jsonify({"error": "A audio with the new name already exists"}), 400
            audio_path.rename(new_path)
            json_path = audio_dir / f"{audioFileName}.json"
            new_json_path = audio_dir / f"{newFname}.json"
            if json_path.exists():
                if new_json_path.exists():
                    new_json_path.unlink()
                json_path.rename(new_json_path)
            return jsonify({"message": newFname}), 200 
        elif request.method == "DELETE":
            audio_path.unlink()
            json_path = audio_dir / f"{audioFileName}.json"
            if json_path.exists():
                json_path.unlink()
            return jsonify({"message": "Audio and associated JSON deleted"}), 200
    except ValidationError as ve:
        return jsonify({"error": f"New name is invalid."}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500
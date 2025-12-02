from quart import Blueprint, request, jsonify
from tracks.video_track_mapper import VideoTrackMapper, VIDEO_PATH
from player.motion_player import load_motion
from jsonschema import validate, ValidationError
from .schema import *
import logging
import json
import aiofiles
from pathlib import Path
from werkzeug.utils import secure_filename

video_dir = Path(VIDEO_PATH)

video = Blueprint("video", __name__)

logger = logging.getLogger("VideoTrackEditor")

video_track_mapper = VideoTrackMapper()

@video.route("/api/video-track", methods=["GET", "POST"])
async def video_track_api():
    try:
        if request.method == "GET":
            return video_track_mapper.get_all_videos(), 200
        elif request.method == "POST":
            data = await request.get_json(force=True, silent=True)
            validate(instance=data, schema=videoTrackSchema)
            video_track_mapper.save_mapping(data["videoFileName"], data)
            return jsonify({"message": "Video tracks saved successfully"}), 200
    except ValidationError as ve:
        return jsonify({"error": f"Validation Error: {ve}. Correct format:\n{json.dumps(videoTrackSchema, indent=2)}"}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@video.route("/api/video-track/<videoFileName>", methods=["GET"])
async def get_video_track(videoFileName):
    try:
        data = video_track_mapper.get_mapping(videoFileName)
        if data is None:
            return jsonify({"error": "Video track not found"}), 404
        validate(instance=data, schema=videoTrackSchema)
        videoTracks = data.get("videoEvents", [])
        for track in videoTracks:
            validate(instance=track, schema=videoEventSchema)
            motion = track.get("motion", "none")
            if motion == "none":
                videoTracks.remove(track)
                video_track_mapper.save_mapping(videoFileName, data)
                continue
            track["motion"] = motion
            motion_data = load_motion(motion)
            validate(instance=motion_data, schema=motionSchema)
            track["magnitude"] = motion_data["magnitude"]
            track["color"] = motion_data["color"]
            track["duration"] = motion_data["duration"]
        return jsonify(data), 200
    except ValidationError as ve:
        return jsonify({"error": f"Corrupted video event data: {ve}"}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@video.route("/api/video/upload", methods=["POST"])
async def upload_video():
    try:
        files = await request.files
        video = files.get("video")

        if not video:
            return jsonify({"error": "No video uploaded"}), 400

        save_path = video_dir / video.filename

        # Use aiofiles for async file saving
        async with aiofiles.open(save_path, "wb") as f:
            await f.write(video.read())

        return jsonify({"message": "Video uploaded!"}), 200
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@video.route("/api/video/upload-youtube", methods=["POST"])
async def upload_youtube_video():
    try:
        data = await request.get_json(force=True, silent=True)
        validate(instance=data, schema=youtubeVideoSchema)
        name = data["name"]
        fpath = video_dir / f"{name}.youtube"
        del data["name"]
        with open(fpath, "w") as f:
            json.dump(data, f, indent=4)
        return jsonify({ "message": "Video uploaded!" }), 200
    except ValidationError as ve:
        return jsonify({"error": f"Invalid name or youtube id."}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500

@video.route("/api/video/<videoFileName>", methods=["POST", "DELETE"])
async def video_api(videoFileName):
    try:
        video_path = video_dir / videoFileName
        if not video_path.exists():
            return jsonify({"error": "Video file not found"}), 404
        
        if request.method == "POST":
            data = await request.get_json(force=True, silent=True)
            validate(instance=data, schema=renameSchema)
            newName = data["newName"]
            ext = video_path.suffix
            newFname = newName + ext
            if newFname == videoFileName:
                return jsonify({"error": "New name is the same as the old name"}), 400
            secure_new_name = secure_filename(newFname)
            if secure_new_name != newFname:
                return jsonify({"error": "New name is invalid"}), 400
            new_path = video_dir / newFname
            if new_path.exists():
                return jsonify({"error": "A video with the new name already exists"}), 400
            video_path.rename(new_path)
            json_path = video_dir / f"{videoFileName}.json"
            new_json_path = video_dir / f"{newFname}.json"
            if json_path.exists():
                if new_json_path.exists():
                    new_json_path.unlink()
                json_path.rename(new_json_path)
            return jsonify({"message": newFname}), 200 
        elif request.method == "DELETE":
            video_path.unlink()
            json_path = video_dir / f"{videoFileName}.json"
            if json_path.exists():
                json_path.unlink()
            return jsonify({"message": "Video and associated JSON deleted"}), 200
    except ValidationError as ve:
        return jsonify({"error": f"New name is invalid."}), 400
    except Exception as e:
        logger.info(f"Unhandled error: {e}")
        return jsonify({"error": f"Unhandled error: {e}"}), 500
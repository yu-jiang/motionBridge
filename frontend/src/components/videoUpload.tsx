import { useState } from "react";
import {
  uploadVideoFile,
  uploadYouTubeVideo,
} from "../services/videoTrackService";
import { NAME_REGEX, YOUTUBE_REGEX } from "../shared";
import { YoutubeVideoPayload } from "../shared/video.track.type";
import useMessage from "../hooks/useMessage";
import useRefresh from "../hooks/useRefresh";

export default function VideoUpload() {
  const { setRefresh } = useRefresh();
  const { setMessage } = useMessage();
  const [youtubeId, setYouTubeId] = useState("");
  const [youtubeName, setYouTubeName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus(0);
    const res = await uploadVideoFile(file, (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / (progressEvent.total || 1)
      );
      setUploadStatus(percentCompleted);
    });
    if (res.data) {
      setMessage("Upload successful!");
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
    setUploadStatus(null);
    setRefresh((prev) => !prev);
  };

  const handleYouTubeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYouTubeId(e.target.value);
  };

  const handleYouTubeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYouTubeName(e.target.value);
  };

  const handleYouTubeUpload = async () => {
    if (!YOUTUBE_REGEX.test(youtubeId)) {
      setMessage(
        "Youtube id is a 11-character string which you can find in the video URL."
      );
      return;
    }
    const name = youtubeName.trim();
    if (name === "" || NAME_REGEX.test(name) === false) {
      setMessage("Invalid video name.");
      return;
    }
    const payload: YoutubeVideoPayload = {
      name,
      videoId: youtubeId,
    };
    const res = await uploadYouTubeVideo(payload);
    if (res.data) {
      setMessage("YouTube video upload successful!");
      setYouTubeId("");
      setYouTubeName("");
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
    setRefresh((prev) => !prev);
  };

  return (
    <div className="flex-col">
      <label htmlFor="videoUpload">
        <h3>Video Upload</h3>
      </label>
      <input
        id="videoUpload"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploadStatus !== null}
      >
        Upload
      </button>
      <div className="gray">No larger than 200MB.</div>
      {uploadStatus !== null && ` Uploading: ${uploadStatus}% `}
      <h3>Youtube Video Upload</h3>
      <label htmlFor="youtubeVideoId">
        Video id:{" "}
        <input
          id="youtubeVideoId"
          type="text"
          onChange={handleYouTubeIdChange}
        />
      </label>
      <label htmlFor="youtubeVideoName">
        Name this video:{" "}
        <input
          id="youtubeVideoName"
          type="text"
          onChange={handleYouTubeNameChange}
        />
      </label>
      <button
        type="button"
        onClick={handleYouTubeUpload}
        disabled={!youtubeId || !youtubeName || uploadStatus !== null}
      >
        Upload
      </button>
    </div>
  );
}

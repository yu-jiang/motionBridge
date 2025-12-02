import { useState } from "react";
import useMessage from "../hooks/useMessage";
import { uploadAudioFile } from "../services/audioTrackService";
import useRefresh from "../hooks/useRefresh";

export default function AudioUpload() {
  const { setRefresh } = useRefresh();
  const { setMessage } = useMessage();
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
    const res = await uploadAudioFile(file, (progressEvent) => {
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

  return (
    <div className="flex-col">
      <label htmlFor="audioUpload">
        <h3>Audio Upload</h3>
      </label>
      <input
        id="audioUpload"
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploadStatus !== null}
      >
        Upload
      </button>
      {uploadStatus !== null && ` Uploading: ${uploadStatus}% `}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  getAudioFileNames,
  getAudioFlip,
  getAudioTrack,
  saveAudioTrack,
  toggleAudioFlip,
} from "../services/audioTrackService";
import { useLocation, useNavigate } from "react-router-dom";
import { MotionPayload } from "../shared/motion.track.type";
import useMessage from "../hooks/useMessage";
import MotionSearch from "./motionSearch";
import { behaviors } from "../shared/bridge.type";
import useRefresh from "../hooks/useRefresh";

export default function AudioTrackEditor() {
  const { refresh } = useRefresh();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { setMessage } = useMessage();
  const params = new URLSearchParams(search);
  const audioFileName = params.get("name") || "";
  const [audioFileNames, setAudioFileNames] = useState<string[]>([]);
  const [motionTrack, setMotionTrack] = useState<MotionPayload | null>(null);
  const [audioFlip, setAudioFlip] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const [resNames, resTrack, resFlip] = await Promise.all([
        getAudioFileNames(),
        getAudioTrack(),
        getAudioFlip(),
      ]);
      if (resNames.data) setAudioFileNames(resNames.data);
      if (resTrack.data) setMotionTrack(resTrack.data);
      if (resFlip.data !== undefined) setAudioFlip(resFlip.data);

      if (resNames.errorMsg) setMessage(resNames.errorMsg.error);
      if (resTrack.errorMsg) setMessage(resTrack.errorMsg.error);
      if (resFlip.errorMsg) setMessage(resFlip.errorMsg.error);
    })();
  }, [refresh]);
  const selectAudio = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    const dest = name === "" ? "?" : `?name=${encodeURIComponent(name)}`;
    navigate(dest);
  };
  const handleFieldChange = (
    field: "motion" | "behavior" | "scale" | "channel",
    value: string | number
  ) => {
    if (!motionTrack) return;
    const updatedEntry = {
      ...motionTrack,
      [field]: value,
    };
    setMotionTrack(updatedEntry);
  };
  const handleSubmit = async () => {
    if (!motionTrack) return;
    const res = await saveAudioTrack(motionTrack);
    if (res.data) {
      setMotionTrack(res.data);
      setMessage("Audio track updated successfully.");
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
  };
  const handleToggleFlip = async () => {
    const res = await toggleAudioFlip();
    if (res.data !== undefined) {
      setAudioFlip(res.data);
      setMessage(`Audio flip set to ${res.data}.`);
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
  };
  return (
    <div className="flex-col">
      <h1>Audio Track</h1>
      {audioFileNames.length === 0 ? (
        <p>No audio files available.</p>
      ) : (
        <div>
          <label htmlFor="selectAudio">Saved Audios: </label>
          <select
            id="selectAudio"
            onChange={selectAudio}
            style={{ marginRight: 10 }}
          >
            <option key={""} value="">
              -- Select audio --
            </option>
            {audioFileNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
      {audioFileName && (
        <audio key={audioFileName} controls>
          <source src={`/public/audios/${audioFileName}`} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
      {motionTrack && (
        <>
          <div>Flip Motion Per Beat: {`${audioFlip}`}</div>
          <button onClick={handleToggleFlip}>Toggle</button>
          <div>
            <label>Motion: </label>
            <MotionSearch
              value={motionTrack.motion}
              onChange={(name) => {
                handleFieldChange("motion", name);
              }}
              includesNone={true}
            />
          </div>
          <div>
            <label>Behavior: </label>
            <select
              value={motionTrack.behavior}
              onChange={(e) => handleFieldChange("behavior", e.target.value)}
            >
              {behaviors.map((behavior) => (
                <option key={behavior} value={behavior}>
                  {behavior}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Scale: </label>
            <input
              type="number"
              value={motionTrack.scale}
              onChange={(e) =>
                handleFieldChange("scale", Number(e.target.value))
              }
              step="0.01"
              min="0"
              max="1"
            />
          </div>
          <div>
            <label>Channel: </label>
            <input
              type="number"
              value={motionTrack.channel}
              onChange={(e) =>
                handleFieldChange("channel", Number(e.target.value))
              }
              step="1"
              min="0"
            />
          </div>
          <button onClick={handleSubmit}>Save Audio Track</button>
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import Message from "../components/message";
import SplitView from "../layouts/splitView";
import StatusBar from "../components/statusBar";
import useStatus from "../hooks/useStatus";
import { MessageContext } from "../hooks/useMessage";
import AudioUpload from "../components/audioUpload";
import AudioTrackEditor from "../components/audioTrackEditor";
import {
  startBeatDetector,
  stopBeatDetector,
} from "../services/audioTrackService";
import StatusPanel from "../components/statusPanel";

export default function AudioTrackPage() {
  const [message, setMessage] = useState<string>("");
  const status = useStatus();
  const Instructions = () => (
    <>
      <h3>Requirements</h3>
      <ul>
        <li>
          Ensure PortAudio and dependencies on
          <strong>
            <code> requirements_audio.txt </code>
          </strong>
          installed. <br />
          <span className="gray">
            (shortcut: <code>npm run i:audio</code>)
          </span>
        </li>
        <li>Beat Detector and MotionPlayer are connected.</li>
        <li>
          Route your system audio input to internal audio{" "}
          <span className="gray">
            (if you want to exclude external noises).
          </span>
        </li>
        <li>Play an audio on your computer or elsewhere.</li>
      </ul>
    </>
  );
  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      <SplitView
        leftRatio={40}
        childrenLeft={
          <div className="flex-col">
            <Message message={message} />
            <StatusPanel>
              <StatusBar
                connected={status.input_clients.includes("audio")}
                label={"Beat Detector Status: "}
              />
              <div className="flex-row">
                <button
                  onClick={async () => {
                    await startBeatDetector(setMessage);
                  }}
                >
                  Start
                </button>
                <button
                  onClick={async () => {
                    await stopBeatDetector(setMessage);
                  }}
                >
                  Stop
                </button>
              </div>
            </StatusPanel>
            <Instructions />
            <AudioUpload />
          </div>
        }
        childrenRight={<AudioTrackEditor />}
      />
    </MessageContext.Provider>
  );
}

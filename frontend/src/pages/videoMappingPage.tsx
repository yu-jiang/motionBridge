import { useEffect, useState } from "react";
import VideoMappingEditor from "../components/videoMappingEditor";
import Message from "../components/message";
import { useWebSocket } from "../hooks/useWebSocket";
import SplitView from "../layouts/splitView";
import VideoUpload from "../components/videoUpload";
import { MessageContext } from "../hooks/useMessage";
import useRefresh from "../hooks/useRefresh";
import StatusPanel from "../components/statusPanel";

export default function VideoMappingPage() {
  const [message, setMessage] = useState<string>("");
  const { refresh } = useRefresh();
  const [lastEvent, setLastEvent] = useState<string>("none");
  const { sendMessage } = useWebSocket(
    "ws://localhost:6789/input?client=video"
  );

  useEffect(() => {}, [refresh]);

  const Shortcuts = () => (
    <>
      <h3>Keyboard shortcuts:</h3>
      <table className="bordered-table">
        <tbody>
          <tr>
            <td>← → arrow keys</td>
            <td>Nudge play head</td>
          </tr>
          <tr>
            <td>Spacebar</td>
            <td>Play/pause</td>
          </tr>
          <tr>
            <td>R key</td>
            <td>Rewind</td>
          </tr>
          <tr>
            <td>E key</td>
            <td>Add event</td>
          </tr>
          <tr>
            <td>Backspace</td>
            <td>Delete event</td>
          </tr>
          <tr>
            <td>+/- keys</td>
            <td>Zoom</td>
          </tr>
          <tr>
            <td>ctrl + S key</td>
            <td>Save</td>
          </tr>
        </tbody>
      </table>
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
              <Message message={lastEvent} label={"Latest Event:"} />
            </StatusPanel>
            <VideoUpload />
            <Shortcuts />
          </div>
        }
        childrenRight={
          <VideoMappingEditor
            setLastEvent={setLastEvent}
            sendMessage={sendMessage}
          />
        }
      />
    </MessageContext.Provider>
  );
}

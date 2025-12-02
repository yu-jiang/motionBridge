import useMessage from "../hooks/useMessage";
import useRefresh from "../hooks/useRefresh";
import useStatus from "../hooks/useStatus";
import {
  reloadMappings,
  startPlayer,
  stopPlayer,
} from "../services/motionBridgeService";
import StatusBar from "./statusBar";

export default function StatusPanel({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { bridge_connected, player_connected } = useStatus();
  const { setMessage } = useMessage();
  const { setRefresh } = useRefresh();
  return (
    <>
      <StatusBar
        connected={bridge_connected || false}
        label={"Bridge Status: "}
      />
      <StatusBar connected={player_connected} label={"Player Status: "} />
      <div className="flex-row">
        <button
          onClick={async () => {
            await startPlayer(setMessage);
          }}
        >
          Start
        </button>
        <button
          onClick={async () => {
            await stopPlayer(setMessage);
          }}
        >
          Stop
        </button>
      </div>
      {children}
      <div>
        <strong>Refresh Server: </strong>
        <button
          onClick={() => {
            reloadMappings(setMessage);
            setRefresh((prev) => !prev);
          }}
        >
          Refresh
        </button>
      </div>
    </>
  );
}

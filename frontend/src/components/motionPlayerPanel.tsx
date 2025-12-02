import StatusBar from "../components/statusBar";
import useStatus from "../hooks/useStatus";
import { playerModes } from "../shared/bridge.type";
import {
  startPlayer,
  stopPlayer,
  getPlayerTargets,
  postPlayerConfig,
  restartPlayer,
} from "../services/motionBridgeService";
import useMessage from "../hooks/useMessage";
import { adaptorElements } from "../adaptors/adaptorElements";
import { useEffect, useState } from "react";

export function MotionPlayerPanel({ minimized }: { minimized?: boolean }) {
  const { setMessage } = useMessage();
  const {
    player_connected: playerConnected,
    player_mode: playerMode,
    player_target: playerTarget,
    target_connected: targetConnected,
  } = useStatus();
  const [playerTargets, setPlayerTargets] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const res = await getPlayerTargets();
      if (res.data) setPlayerTargets(res.data);
    })();
  }, []);

  const updatePlayerStatus = async (mode: string, target: string) => {
    if (mode === "" || !playerModes.includes(mode as any)) {
      setMessage(`Invalid mode: ${mode}`);
      return;
    }
    if (target === "" || !playerTargets.includes(target)) {
      setMessage(`Invalid target: ${target}`);
      return;
    }
    const res = await postPlayerConfig({ mode, target });
    if (res.data) {
      setMessage(res.data.message);
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
  };
  return (
    <>
      {!minimized && <h1>MotionPlayer</h1>}
      <StatusBar connected={playerConnected} label={"Motion Player Status: "} />
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
      <div>
        <label>Mode: </label>
        <select
          onChange={(e) => updatePlayerStatus(e.target.value, playerTarget)}
          value={playerMode}
        >
          {playerModes.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Target: </label>
        <select
          onChange={(e) => updatePlayerStatus(playerMode, e.target.value)}
          value={playerTarget}
        >
          {playerTargets.length === 0 && (
            <option value="">-- No Targets Available --</option>
          )}
          {playerTargets.map((target) => (
            <option key={target} value={target}>
              {target}
            </option>
          ))}
        </select>
      </div>
      <div>
        <StatusBar
          connected={targetConnected || false}
          label={"Output Target: "}
        />
      </div>
      <button onClick={() => restartPlayer(setMessage)}>Refresh Target</button>
      {!minimized && (
        <div className="gray">
          Manually refresh the status after you turned on or off output target.
        </div>
      )}

      {!minimized && adaptorElements[playerTarget || ""]}
    </>
  );
}

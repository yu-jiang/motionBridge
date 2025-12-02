import { useState, useEffect } from "react";
import {
  deleteHapticsEntry,
  deleteHapticsTrack,
  getHapticsTracks,
  postHapticsTracks,
  startHapticsMonitor,
  stopHapticsMonitor,
} from "../services/hapticsTrackService";
import { HapticsTrack } from "../shared/motion.track.type";
import Message from "../components/message";
import useMotion from "../hooks/useMotion";
import { behaviors } from "../shared/bridge.type";
import MotionSearch from "../components/motionSearch";
import { MessageContext } from "../hooks/useMessage";
import SplitView from "../layouts/splitView";
import StatusBar from "../components/statusBar";
import useStatus from "../hooks/useStatus";
import useRefresh from "../hooks/useRefresh";
import StatusPanel from "../components/statusPanel";

export default function HapticsTrackPage() {
  const { refresh, setRefresh } = useRefresh();
  const [message, setMessage] = useState("");
  const [hapticsTracks, setHapticsTracks] = useState<HapticsTrack[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const { motions } = useMotion();
  const { input_clients } = useStatus();

  useEffect(() => {
    (async () => {
      const res = await getHapticsTracks();

      if (res.data) setHapticsTracks(res.data);
      if (res.errorMsg) setMessage(res.errorMsg.error);
    })();
  }, [refresh]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgram(e.target.value);
  };

  const selectedTrack = hapticsTracks.find(
    (track) => track.program === selectedProgram
  );

  const handleSubmit = async () => {
    if (!selectedTrack) return;

    for (const entry of selectedTrack.hapticsList) {
      if (!motions.includes(entry.motion)) {
        setMessage(`Invalid motion: ${entry.motion || "empty"}.`);
        setRefresh((prev) => !prev);
        return;
      }
    }

    const res = await postHapticsTracks(selectedTrack);

    if (res.data) {
      setHapticsTracks(res.data);
      setMessage("Haptics track updated successfully.");
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
      setRefresh((prev) => !prev);
    }
  };

  const handleFieldChange = (
    idx: number,
    field: "motion" | "behavior" | "scale" | "alias" | "channel",
    value: string | number
  ) => {
    if (!selectedTrack) return;

    const updatedEntry = {
      ...selectedTrack.hapticsList[idx],
      [field]: value,
    };
    if (field === "alias" && value === "") {
      delete updatedEntry.alias;
    }
    selectedTrack.hapticsList[idx] = updatedEntry;
    setHapticsTracks([...hapticsTracks]);
  };
  const handleDeleteEntry = async (idx: number) => {
    if (!selectedTrack) return;
    if (selectedTrack.hapticsList.length <= 1) {
      if (
        !window.confirm(
          "Deleting the last entry will delete the entire haptics track. Proceed?"
        )
      ) {
        return;
      }
    }
    const entry = selectedTrack.hapticsList[idx];
    const res = await deleteHapticsEntry({
      program: selectedTrack.program,
      ...entry,
    });
    if (res.data) {
      setHapticsTracks(res.data);
      setMessage("Haptics entry deleted successfully.");
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
  };
  const handleDeleteTrack = async () => {
    if (!selectedTrack) return;
    if (
      !window.confirm("Are you sure you want to delete this haptics track?")
    ) {
      return;
    }
    const res = await deleteHapticsTrack(selectedTrack);
    if (res.data) {
      setHapticsTracks(res.data);
      setSelectedProgram("");
      setMessage("Haptics track deleted successfully.");
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
  };

  const Instructions = () => (
    <>
      <h3>Requirements</h3>
      <ul>
        <li>Windows only.</li>
        <li>Ensure Haptics Monitor and MotionPlayer are connected.</li>
        <li>Open a game with haptic feedback.</li>
      </ul>
      <div className="gray">
        Registered haptics will trigger the motions during gameplay.
        <br />
        New games or new haptics will be automatically registered.
        <br />
        If you don't see your game registered, try refresh the server.
      </div>
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
                connected={input_clients.includes("haptics")}
                label={"Haptics Monitor Status: "}
              />
              <div className="flex-row">
                <button
                  onClick={async () => {
                    await startHapticsMonitor(setMessage);
                  }}
                >
                  Start
                </button>
                <button
                  onClick={async () => {
                    await stopHapticsMonitor(setMessage);
                  }}
                >
                  Stop
                </button>
              </div>
            </StatusPanel>
            <Instructions />
          </div>
        }
        childrenRight={
          <div className="flex-col">
            <h1>Haptics Track (Game)</h1>
            {hapticsTracks.length > 0 ? (
              <>
                <label htmlFor="programSelect">Select Program:</label>
                <select
                  id="programSelect"
                  value={selectedProgram}
                  onChange={handleSelectChange}
                >
                  <option value="">-- Select a Program --</option>
                  {hapticsTracks.map((track) => (
                    <option key={track.program} value={track.program}>
                      {track.program}
                    </option>
                  ))}
                </select>
                {selectedTrack && (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <th>Haptics</th>
                          <th>Motion</th>
                          <th>Alias</th>
                          <th>Behavior</th>
                          <th>Scale</th>
                          <th>Channel</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTrack.hapticsList.map((entry, index) => (
                          <tr key={index}>
                            <td>{entry.haptics}</td>
                            <td>
                              <MotionSearch
                                value={entry.motion || ""}
                                onChange={(name) => {
                                  setMessage("");
                                  handleFieldChange(index, "motion", name);
                                }}
                                includesNone={true}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={entry.alias || ""}
                                placeholder="name"
                                onChange={(e) =>
                                  handleFieldChange(
                                    index,
                                    "alias",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <select
                                value={entry.behavior}
                                onChange={(e) =>
                                  handleFieldChange(
                                    index,
                                    "behavior",
                                    e.target.value
                                  )
                                }
                              >
                                {behaviors.map((behavior) => (
                                  <option key={behavior} value={behavior}>
                                    {behavior}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={entry.scale}
                                onChange={(e) =>
                                  handleFieldChange(
                                    index,
                                    "scale",
                                    Number(e.target.value)
                                  )
                                }
                                min="0"
                                max="1"
                                step="0.01"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={entry.channel}
                                onChange={(e) =>
                                  handleFieldChange(
                                    index,
                                    "channel",
                                    Number(e.target.value)
                                  )
                                }
                                min="0"
                                step="1"
                              />
                            </td>
                            <td>
                              <button onClick={() => handleDeleteEntry(index)}>
                                -
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={handleSubmit}>Save Changes</button>
                    <button onClick={handleDeleteTrack}>Delete Track</button>
                  </>
                )}
              </>
            ) : (
              <p>No haptics tracks available.</p>
            )}
          </div>
        }
      />
    </MessageContext.Provider>
  );
}

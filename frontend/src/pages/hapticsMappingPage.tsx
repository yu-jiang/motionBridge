import { useState, useEffect } from "react";
import {
  deleteHapticsEntry,
  deleteHapticsMapping,
  getHapticsMappings,
  postHapticsMappings,
  startHapticsMonitor,
  stopHapticsMonitor,
} from "../services/hapticsMappingService";
import { HapticsMapping } from "../shared/motion.map.type";
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

export default function HapticsMappingPage() {
  const { refresh, setRefresh } = useRefresh();
  const [message, setMessage] = useState("");
  const [hapticsMappings, setHapticsMappings] = useState<HapticsMapping[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const { motions } = useMotion();
  const { input_clients } = useStatus();

  useEffect(() => {
    (async () => {
      const res = await getHapticsMappings();

      if (res.data) setHapticsMappings(res.data);
      if (res.errorMsg) setMessage(res.errorMsg.error);
    })();
  }, [refresh]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgram(e.target.value);
  };

  const selectedMapping = hapticsMappings.find(
    (mapping) => mapping.program === selectedProgram
  );

  const handleSubmit = async () => {
    if (!selectedMapping) return;

    for (const entry of selectedMapping.hapticsList) {
      if (!motions.includes(entry.motion)) {
        setMessage(`Invalid motion: ${entry.motion || "empty"}.`);
        setRefresh((prev) => !prev);
        return;
      }
    }

    const res = await postHapticsMappings(selectedMapping);

    if (res.data) {
      setHapticsMappings(res.data);
      setMessage("Haptics mapping updated successfully.");
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
      setRefresh((prev) => !prev);
    }
  };

  const handleFieldChange = (
    idx: number,
    field: "motion" | "behavior" | "scale" | "alias" | "fallback",
    value: string | number
  ) => {
    if (!selectedMapping) return;

    const updatedEntry = {
      ...selectedMapping.hapticsList[idx],
      [field]: value,
    };
    if (field === "alias" && value === "") {
      delete updatedEntry.alias;
    }
    selectedMapping.hapticsList[idx] = updatedEntry;
    setHapticsMappings([...hapticsMappings]);
  };
  const handleDeleteEntry = async (idx: number) => {
    if (!selectedMapping) return;
    if (selectedMapping.hapticsList.length <= 1) {
      if (
        !window.confirm(
          "Deleting the last entry will delete the entire haptics mapping. Proceed?"
        )
      ) {
        return;
      }
    }
    const entry = selectedMapping.hapticsList[idx];
    const res = await deleteHapticsEntry({
      program: selectedMapping.program,
      ...entry,
    });
    if (res.data) {
      setHapticsMappings(res.data);
      setMessage("Haptics entry deleted successfully.");
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
    }
  };
  const handleDeleteMapping = async () => {
    if (!selectedMapping) return;
    if (
      !window.confirm("Are you sure you want to delete this haptics mapping?")
    ) {
      return;
    }
    const res = await deleteHapticsMapping(selectedMapping);
    if (res.data) {
      setHapticsMappings(res.data);
      setSelectedProgram("");
      setMessage("Haptics mapping deleted successfully.");
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
            <h1>Haptics Mapping (Game)</h1>
            {hapticsMappings.length > 0 ? (
              <>
                <label htmlFor="programSelect">Select Program:</label>
                <select
                  id="programSelect"
                  value={selectedProgram}
                  onChange={handleSelectChange}
                >
                  <option value="">-- Select a Program --</option>
                  {hapticsMappings.map((mapping) => (
                    <option key={mapping.program} value={mapping.program}>
                      {mapping.program}
                    </option>
                  ))}
                </select>
                {selectedMapping && (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <th>Haptics</th>
                          <th>Motion</th>
                          <th>Alias</th>
                          <th>Behavior</th>
                          <th>Scale</th>
                          <th>Fallback #</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMapping.hapticsList.map((entry, index) => (
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
                                value={entry.fallback}
                                onChange={(e) =>
                                  handleFieldChange(
                                    index,
                                    "fallback",
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
                    <button onClick={handleDeleteMapping}>Delete Mapping</button>
                  </>
                )}
              </>
            ) : (
              <p>No haptics mappings available.</p>
            )}
          </div>
        }
      />
    </MessageContext.Provider>
  );
}

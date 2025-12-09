import { useEffect, useState } from "react";
import { GestureMapping, GestureConfig } from "../shared/motion.map.type";
import {
  getGestureMappings,
  getJediConfig,
  postGestureMappings,
} from "../services/gestureMappingService";
import Message from "../components/message";
import { useLocation } from "react-router-dom";
import useMotion from "../hooks/useMotion";
import { behaviors } from "../shared/bridge.type";
import MotionSearch from "../components/motionSearch";
import { MessageContext } from "../hooks/useMessage";
import SplitView from "../layouts/splitView";
import useRefresh from "../hooks/useRefresh";
import StatusPanel from "../components/statusPanel";

export default function GestureMappingPage() {
  const { refresh, setRefresh } = useRefresh();
  const { motions } = useMotion();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const page = params.get("p") || "";
  const [message, setMessage] = useState("");
  const [gestureMappings, setGestureMappings] = useState<GestureMapping[]>([]);
  const [jediConfig, setJediConfig] = useState<GestureConfig | null>(null);

  useEffect(() => {
    (async () => {
      const res = await getGestureMappings();
      if (res.data) setGestureMappings(res.data);
      if (res.errorMsg) setMessage(res.errorMsg.error);

      const configRes = await getJediConfig();
      if (configRes.data) setJediConfig(configRes.data);
      if (configRes.errorMsg) setMessage(configRes.errorMsg.error);
    })();
  }, [refresh]);

  const handleFieldChange = (
    idx: number,
    field: "motion" | "behavior" | "frames" | "fallback",
    value: string | number
  ) => {
    setGestureMappings((prev) => {
      const updated = [...prev];
      const entry = updated[idx];
      if (!entry) return prev;
      const updatedEntry = {
        ...entry,
        [field]: value,
      };
      updated[idx] = updatedEntry;
      return updated;
    });
  };

  const handleSubmit = async () => {
    for (const entry of gestureMappings) {
      if (!motions.includes(entry.motion)) {
        setMessage(`Invalid motion: ${entry.motion || "empty"}.`);
        setRefresh((prev) => !prev);
        return;
      }
    }

    const res = await postGestureMappings(gestureMappings);

    if (res.data) {
      setGestureMappings(res.data);
      setMessage("Gesture mapping updated successfully.");
    }
    if (res.errorMsg) {
      setMessage(res.errorMsg.error);
      setRefresh((prev) => !prev);
    }
  };
  const Instructions = () => (
    <>
      <ul>
        <li>Ensure your camera is opened.</li>
        <li>Ensure MotionPlayer is connected.</li>
        <div className="gray">
          <strong>Note: </strong> Inactive could mean the player is not
          connected or running in OFF mode.
        </div>
        <li>Click on Gesture Input in the navbar.</li>
        <div className="gray">
          You need to stand at a distance from the camera so that your full
          upper body is visible.
        </div>
        <li>The stop gesture means to put your hands on knees.</li>
      </ul>
      <div className="gray">
        Special gestures are used to switch modes and will not be played.
      </div>
    </>
  );

  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      <SplitView
        leftRatio={20}
        childrenLeft={
          <>
            <div className="flex-col">
              <Message message={message} />
              <StatusPanel />
              <Instructions />
            </div>
          </>
        }
        childrenRight={
          page === "gesture-input" ? (
            <iframe
              src="/jedi/index.html"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              title="Jedi"
            />
          ) : (
            <div className="flex-col">
              <h1>Gesture Mapping</h1>
              <div>
                Here lists all recognizable gestures.
                <br />
                To start detecting gesture, click on Gesture Input in the
                navbar.
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Special Note</th>
                    <th>Gesture</th>
                    <th>Motion</th>
                    <th>Behavior</th>
                    <th>Frames</th>
                    <th>Fallback #</th>
                  </tr>
                </thead>
                <tbody>
                  {gestureMappings.map((mapping, idx) => (
                    <tr key={idx}>
                      <td className="gray">
                        {mapping.gesture === jediConfig?.start_event &&
                          "Event (Gesture) switch"}
                        {mapping.gesture === jediConfig?.start_live &&
                          "Live (Follower) switch"}
                        {mapping.gesture === jediConfig?.stop &&
                          "Off (Inactive) switch"}
                      </td>
                      <td>{mapping.gesture}</td>
                      <td>
                        <MotionSearch
                          value={mapping.motion}
                          onChange={(name) => {
                            handleFieldChange(idx, "motion", name);
                          }}
                          includesNone={true}
                        />
                      </td>
                      <td>
                        <select
                          value={mapping.behavior}
                          onChange={(e) =>
                            handleFieldChange(idx, "behavior", e.target.value)
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
                          value={mapping.frames}
                          onChange={(e) =>
                            handleFieldChange(
                              idx,
                              "frames",
                              Number(e.target.value)
                            )
                          }
                          step="1"
                          min="1"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={mapping.fallback}
                          onChange={(e) =>
                            handleFieldChange(
                              idx,
                              "fallback",
                              Number(e.target.value)
                            )
                          }
                          step="1"
                          min="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={handleSubmit}>Save Changes</button>
            </div>
          )
        }
      />
    </MessageContext.Provider>
  );
}

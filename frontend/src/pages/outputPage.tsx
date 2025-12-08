import { useState } from "react";
import MotionSearch from "../components/motionSearch";
import { useWindow } from "../hooks/useWindow";
import CarSimulation from "../components/carSimulation";
import { playMotionByName } from "../services/motionEditorService";
import { MessageContext } from "../hooks/useMessage";
import StatusBar from "../components/statusBar";
import useStatus from "../hooks/useStatus";
import { MotionPlayerPanel } from "../components/motionPlayerPanel";
import Message from "../components/message";
import WheelSimulation from "../components/wheelSimulation";
import TrifoldView from "../layouts/trifoldView";

export default function OutputPage() {
  const [message, setMessage] = useState<string>("");
  const { bridge_connected } = useStatus();
  const [motionName, setMotionName] = useState<string>("");
  const { windowOpened } = useWindow();
  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      <TrifoldView
        children1Ratio={30}
        children2Ratio={30}
        children1={
          <div className="flex-col">
            <Message message={message} />
            <StatusBar
              connected={bridge_connected || false}
              label={"Bridge Status: "}
            />
            <MotionPlayerPanel minimized={true} />

            <div className="flex-col">
              <h2>Try with a motion!</h2>
              <div>
                Ensure MotionPlayer is connected, mode is event, target is
                bridge, and target is connected.
              </div>
              <MotionSearch value={motionName} onChange={setMotionName} />

              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (!motionName) return;
                  await playMotionByName(motionName, (msg) => setMessage(msg));
                }}
                disabled={!motionName}
              >
                Play Motion
              </button>
            </div>
          </div>
        }
        children2={
          !windowOpened && (
            <div className="flex-col">
              <h1>Automobile Output Simulation</h1>
              <CarSimulation />
              <div>
                MotionBridge and MotionPlayer were originally designed for an
                intelligent proactive suspension system.
              </div>
            </div>
          )
        }
        children3={
          !windowOpened && (
            <div className="flex-col">
              <h1>Steering Wheel Simulation</h1>
              <WheelSimulation />

              <h3>Actuator Mapping</h3>
              <table className="bordered-table">
                <thead>
                  <tr>
                    <th>Steering Wheel Actuator</th>
                    <th>CM Actuators</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowSpan={4}>
                      Roll
                      <br />
                      (FR + RR - FL - FR)/2
                    </td>
                    <td>FL</td>
                  </tr>
                  <tr>
                    <td>FR</td>
                  </tr>
                  <tr>
                    <td>RL</td>
                  </tr>
                  <tr>
                    <td>RR</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        }
      />
    </MessageContext.Provider>
  );
}

export function OutputWindow() {
  return (
    <div className="flex-col no-gap">
      <CarSimulation />
      <WheelSimulation />
    </div>
  );
}

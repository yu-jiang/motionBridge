import useStatus from "../hooks/useStatus";
import StatusBar from "./statusBar";

export function MotionBridgePanel() {
  const {
    bridge_connected: isOpen,
    input_clients: inputClients,
    output_clients: outputClients,
  } = useStatus();
  return (
    <>
      <h1>MotionBridge</h1>
      <StatusBar connected={isOpen || false} label={"Motion Bridge Status: "} />
      <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem" }}>
        <div>
          <h4 style={{ margin: "0 0 0.5rem 0" }}>Input Clients</h4>
          <div style={{ minHeight: "1.5rem", fontSize: "0.9rem" }}>
            {inputClients.length > 0 ? (
              <span>{inputClients.join(", ")}</span>
            ) : (
              <span style={{ color: "#888" }}>None</span>
            )}
          </div>
        </div>
        <div>
          <h4 style={{ margin: "0 0 0.5rem 0" }}>Output Clients</h4>
          <div style={{ minHeight: "1.5rem", fontSize: "0.9rem" }}>
            {outputClients.length > 0 ? (
              <span>{outputClients.join(", ")}</span>
            ) : (
              <span style={{ color: "#888" }}>None</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

import { createContext, useContext, useEffect, useState } from "react";
import { BridgeStatus, bridgeStatusSchema } from "../shared/bridge.type";
import { useWebSocket } from "./useWebSocket";

const getEmptyStatus = (): BridgeStatus => ({
  player_connected: false,
  player_mode: "off",
  player_target: "none",
  input_clients: [],
  output_clients: [],
});

export const StatusContext = createContext<BridgeStatus>(getEmptyStatus());

export const StatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<BridgeStatus>(getEmptyStatus());
  const { message, isOpen } = useWebSocket("ws://localhost:6789/status");

  useEffect(() => {
    if (message) {
      const newStatus = bridgeStatusSchema.parse(JSON.parse(message));
      setStatus({ ...newStatus, bridge_connected: isOpen });
    }
  }, [message]);

  return (
    <StatusContext.Provider value={status}>{children}</StatusContext.Provider>
  );
};

export default function useStatus() {
  return useContext(StatusContext);
}

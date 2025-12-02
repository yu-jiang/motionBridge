import { useState } from "react";
import Message from "../components/message";
import CarSimulation from "../jsx/carSimulation";
import { MessageContext } from "../hooks/useMessage";
import SplitView from "../layouts/splitView";
import { MotionBridgePanel } from "../components/motionBridgePanel";
import { MotionPlayerPanel } from "../components/motionPlayerPanel";

export default function HomePage() {
  const [message, setMessage] = useState<string>("");
  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      <SplitView
        childrenLeft={
          <div className="flex-col">
            <Message message={message} />
            <MotionBridgePanel />
          </div>
        }
        childrenRight={
          <div className="flex-col">
            <MotionPlayerPanel />
          </div>
        }
      />
    </MessageContext.Provider>
  );
}

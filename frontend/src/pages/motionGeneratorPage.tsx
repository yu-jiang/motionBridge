import { useState } from "react";
import { Motion } from "../shared/motion.type";
import MotionGenerator from "../components/motionGenerator";
import MotionEditor from "../components/motionEditor";
import Message from "../components/message";
import MotionSVG from "../components/motionSVG";
import SplitView from "../layouts/splitView";
import PlayMotionButton from "../components/playMotionButton";
import { MessageContext } from "../hooks/useMessage";

export default function MotionGeneratorPage() {
  const [message, setMessage] = useState<string>("");
  const [motion, setMotion] = useState<Motion | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      <SplitView
        leftRatio={25}
        childrenLeft={
          <div className="flex-col">
            <Message message={message} />
            <MotionGenerator
              motion={motion}
              setMotion={setMotion}
              readOnly={readOnly}
              setReadOnly={setReadOnly}
            />
            <MotionEditor
              motion={motion}
              setMotion={setMotion}
              readOnly={readOnly}
            />
            {motion && <PlayMotionButton motion={motion} />}
          </div>
        }
        childrenRight={<MotionSVG motions={motion ? [motion] : []} />}
      />
    </MessageContext.Provider>
  );
}

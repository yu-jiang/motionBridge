import { useState } from "react";
import MotionGraph from "../components/motionGraph";
import { Motion } from "../shared/motion.type";
import MotionEditor from "../components/motionEditor";
import Message from "../components/message";
import MotionComposer from "../components/motionComposer";
import SplitView from "../layouts/splitView";
import PlayMotionButton from "../components/playMotionButton";
import { MessageContext } from "../hooks/useMessage";

export default function MotionComposerPage() {
  const [message, setMessage] = useState<string>("");
  const [resMotion, setResMotion] = useState<Motion | null>(null);
  const [srcMotion1, setSrcMotion1] = useState<Motion | null>(null);
  const [srcMotion2, setSrcMotion2] = useState<Motion | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      <SplitView
        leftRatio={25}
        childrenLeft={
          <div className="flex-col">
            <Message message={message} />
            <MotionComposer
              motion={resMotion}
              srcMotion1={srcMotion1}
              srcMotion2={srcMotion2}
              setMotion={setResMotion}
              setSrcMotion1={setSrcMotion1}
              setSrcMotion2={setSrcMotion2}
              readOnly={readOnly}
              setReadOnly={setReadOnly}
            />
            <MotionEditor
              motion={resMotion}
              setMotion={setResMotion}
              readOnly={readOnly}
            />
            {resMotion && <PlayMotionButton motion={resMotion} />}
          </div>
        }
        childrenRight={
          <MotionGraph
            motions={[resMotion, srcMotion1, srcMotion2].filter(
              (m): m is Motion => m !== null
            )}
          />
        }
      />
    </MessageContext.Provider>
  );
}

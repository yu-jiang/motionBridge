import { useEffect, useState } from "react";
import { Motion } from "../shared/motion.type";
import MotionEditor from "../components/motionEditor";
import Message from "../components/message";
import MotionSVG from "../components/motionSVG";
import SplitView from "../layouts/splitView";
import MotionSearch from "../components/motionSearch";
import useMotion from "../hooks/useMotion";
import {
  getMotionByName,
  toggleMotionLock,
} from "../services/motionEditorService";
import PlayMotionButton from "../components/playMotionButton";
import { MessageContext } from "../hooks/useMessage";
import useRefresh from "../hooks/useRefresh";

export default function MotionEditorPage() {
  const { setRefresh } = useRefresh();
  const { editableMotions } = useMotion();
  const [message, setMessage] = useState<string>("");
  const [motion, setMotion] = useState<Motion | null>(null);
  const [readOnly, setReadOnly] = useState(
    !editableMotions.includes(motion?.name || "")
  );

  useEffect(() => {
    setReadOnly(!editableMotions.includes(motion?.name || ""));
  }, [editableMotions, motion?.name]);

  const handleToggleLock = async () => {
    if (motion) {
      const res = await toggleMotionLock(motion);
      if (res.errorMsg) setMessage(res.errorMsg.error);
      if (res.data) {
        setRefresh((prev) => !prev);
        setMessage(
          readOnly
            ? `Motion ${motion.name} is unlocked.`
            : `Motion ${motion.name} is locked.`
        );
      }
    }
  };

  const handleSelectMotionName = async (name: string) => {
    const res = await getMotionByName(name);
    if (res.data) {
      setMotion(res.data);
      setMessage("");
    }
    if (res.errorMsg) setMessage(res.errorMsg.error);
  };

  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      <SplitView
        leftRatio={25}
        childrenLeft={
          <>
            <Message message={message} />

            <h2>Select Motion</h2>
            <MotionSearch
              value={motion?.name || ""}
              onChange={handleSelectMotionName}
              readOnly={false}
            />
            <MotionEditor
              motion={motion}
              setMotion={setMotion}
              readOnly={readOnly}
            />
            {motion && (
              <div className="flex-col">
                <br />
                <PlayMotionButton motion={motion} />
                <button
                  style={{ marginTop: "10px" }}
                  onClick={handleToggleLock}
                >
                  {readOnly ? "Unlock Motion" : "Lock Motion"}
                </button>
              </div>
            )}
          </>
        }
        childrenRight={<MotionSVG motions={motion ? [motion] : []} />}
      />
    </MessageContext.Provider>
  );
}

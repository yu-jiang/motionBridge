import { useState } from "react";
import { Anchor, Motion } from "../shared/motion.type";
import BezierCurveSVG from "../components/bezierCurveSVG";
import Message from "../components/message";
import BezierCurveEditor from "../components/bezierCurveEditor";
import MotionSVG from "../components/motionSVG";
import MotionEditor from "../components/motionEditor";
import SplitView from "../layouts/splitView";
import { MessageContext } from "../hooks/useMessage";

export default function BezierCurveEditorPage() {
  const [message, setMessage] = useState<string>("");
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [duration, setDuration] = useState<number>(1);
  const [magnitude, setMagnitude] = useState<number>(100);
  const [data, setData] = useState<number[]>([]);
  const [motion, setMotion] = useState<Motion | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  return (
    <MessageContext.Provider value={{ message, setMessage }}>
      <SplitView
        leftRatio={25}
        childrenLeft={
          <div className="flex-col">
            <Message message={message} />
            <BezierCurveEditor
              data={data}
              anchors={anchors}
              setAnchors={setAnchors}
              duration={duration}
              setDuration={setDuration}
              magnitude={magnitude}
              setMagnitude={setMagnitude}
              motion={motion}
              setMotion={setMotion}
              setReadOnly={setReadOnly}
            />

            <MotionEditor
              motion={motion}
              setMotion={setMotion}
              readOnly={readOnly}
            />
          </div>
        }
        childrenRight={
          <>
            <div style={{ marginBottom: "1rem" }}>
              <button
                onClick={() => setReadOnly(false)}
                style={{
                  padding: "0.5rem 1rem",
                  marginRight: "0.5rem",
                  backgroundColor: !readOnly ? "#007acc" : "#f0f0f0",
                  color: !readOnly ? "white" : "black",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Editor
              </button>
              <button
                onClick={() => setReadOnly(true)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: readOnly ? "#007acc" : "#f0f0f0",
                  color: readOnly ? "white" : "black",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Motion
              </button>
            </div>
            {!readOnly ? (
              <BezierCurveSVG
                data={data}
                setData={setData}
                anchors={anchors}
                setAnchors={setAnchors}
                magnitude={magnitude}
                duration={duration}
              />
            ) : (
              <MotionSVG motions={motion ? [motion] : []} />
            )}
          </>
        }
      />
    </MessageContext.Provider>
  );
}

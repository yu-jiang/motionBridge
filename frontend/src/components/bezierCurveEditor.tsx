import { useEffect, useState } from "react";
import {
  Anchor,
  BezierCurveMotionPayload,
  bezierCurveMotionSchema,
  Direction,
  motionDirections,
  MotionGetSetProps,
  MotionGenPayload,
} from "../shared/motion.type";
import {
  generateMotion,
  getPreset,
  getPresetNamesByType,
  saveMotion,
  savePreset,
} from "../services/motionEditorService";
import useMotion from "../hooks/useMotion";
import useMessage from "../hooks/useMessage";
import useRefresh from "../hooks/useRefresh";

export interface BezierCurveProps extends MotionGetSetProps {
  data: number[];
  anchors: Anchor[];
  setAnchors: (a: Anchor[]) => void;
  duration: number;
  setDuration: (d: number) => void;
  magnitude: number;
  setMagnitude: (m: number) => void;
}

export default function BezierCurveEditor({
  data,
  anchors,
  setAnchors,
  duration,
  setDuration,
  magnitude,
  setMagnitude,
  motion,
  setMotion,
  setReadOnly,
}: BezierCurveProps) {
  const { setRefresh } = useRefresh();
  const { editableMotions } = useMotion();
  const { setMessage } = useMessage();
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<Direction>("heave");
  const [isGenerating, setIsGenerating] = useState(false);
  const [presetNames, setPresetNames] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  useEffect(() => {
    fetchPresets();
  }, []);

  const resetForm = () => {
    setMotion(null);
    setName("");
    setReadOnly?.(false);
    setMessage?.("");
  };

  const handleGenerate = async () => {
    if (!data || data.length < 2) {
      return;
    }
    setIsGenerating(true);
    const res = await generateMotion(
      {
        type: "bezier_curve",
        name,
        parameters: {
          data,
          duration,
          magnitude,
          direction,
        },
      },
      true
    );
    if (res.errorMsg) setMessage?.(res.errorMsg.error);
    if (res.data) {
      setReadOnly?.(true);
      setMotion(res.data);
      if (editableMotions.includes(name)) {
        setMessage?.(
          `Motion ${res.data.name} will overwrite existing motion when saved.`
        );
      } else {
        setMessage?.(`Generated motion "${res.data.name}" successfully.`);
      }
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (editableMotions.includes(name)) {
      if (
        !window.confirm(
          `This will overwrite existing motion "${name}". Proceed?`
        )
      ) {
        return;
      }
    }
    if (motion === null) {
      setMessage?.("No motion data to save");
      return;
    }
    if (anchors.length < 1) {
      setMessage?.("No anchor points to save");
      return;
    }
    const payload: BezierCurveMotionPayload = {
      type: "bezier_curve",
      name: name,
      parameters: {
        anchors,
        duration,
        magnitude,
        direction,
      },
    };
    let str = "";
    const presetRes = await savePreset(payload);
    if (presetRes.data) str += presetRes.data.message + "\n";
    if (presetRes.errorMsg) str += presetRes.errorMsg.error + "\n";

    const motionRes = await saveMotion(motion);
    if (motionRes.data) {
      setReadOnly?.(false);
      str += motionRes.data.message + "\n";
    }
    if (motionRes.errorMsg) str += motionRes.errorMsg.error + "\n";
    setMessage?.(str);
    setRefresh((prev) => !prev);
  };

  const loadPreset = (preset: MotionGenPayload) => {
    const parsed = bezierCurveMotionSchema.parse(preset);
    setName(parsed.name);
    setDuration(parsed.parameters.duration);
    setMagnitude(parsed.parameters.magnitude);
    setDirection(parsed.parameters.direction as Direction);
    setAnchors(parsed.parameters.anchors);
  };

  const handleSelectPresetChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e.target.value === "") {
      return;
    }
    const presetRes = await getPreset(e.target.value);
    if (presetRes.data) {
      setSelectedPreset(presetRes.data.name);
      loadPreset(presetRes.data);
    }
    if (presetRes.errorMsg) {
      setMessage?.(presetRes.errorMsg.error);
    }
  };

  const fetchPresets = async () => {
    const presetRes = await getPresetNamesByType("bezier_curve");
    if (presetRes.data) setPresetNames(presetRes.data);
    if (presetRes.errorMsg) setMessage?.(presetRes.errorMsg.error);
  };
  return (
    <div>
      <h2>Bezier Curve Motion</h2>

      <div className="flex-col">
        <div>
          <label>Presets: </label>
          <select value={selectedPreset} onChange={handleSelectPresetChange}>
            <option value="">-- Select Preset --</option>
            {presetNames.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Motion Name"
          />
        </div>
        <div>
          <label>Duration (s): </label>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={duration || ""}
            placeholder="0"
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
        <div>
          <label>Magnitude (N): </label>
          <input
            type="number"
            min={0}
            step={10}
            value={magnitude || ""}
            placeholder="0"
            onChange={(e) => setMagnitude(Number(e.target.value))}
          />
        </div>
        <div>
          <label>Direction: </label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
          >
            {motionDirections.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="actions">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="generate-button"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>

          <button
            onClick={handleSave}
            disabled={!motion || isGenerating}
            className="save-button"
          >
            Save
          </button>

          <button onClick={resetForm} className="reset-button">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

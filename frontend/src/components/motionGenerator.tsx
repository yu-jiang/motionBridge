import { useEffect, useRef, useState } from "react";
import {
  motionDirections,
  Direction,
  MotionGenType,
  MotionGetSetProps,
  MotionGenPayload,
  schemaMap,
  motionGenTypes,
} from "../shared/motion.type";
import {
  saveMotion,
  savePreset,
  getPresetNamesByType,
  getPreset,
  generateMotion,
} from "../services/motionEditorService";
import { toErrorMsg } from "../services/api";
import useMotion from "../hooks/useMotion";
import { useLocation, useNavigate } from "react-router-dom";
import useMessage from "../hooks/useMessage";
import useRefresh from "../hooks/useRefresh";

export default function MotionGenerator({
  motion,
  setMotion,
  setReadOnly,
}: MotionGetSetProps) {
  const { setRefresh } = useRefresh();
  const { setMessage } = useMessage();
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const getMotionType = () => {
    const type = params.get("type");
    if (motionGenTypes.includes(type as MotionGenType)) {
      return type as MotionGenType;
    }
    return "";
  };
  const motionType = getMotionType();
  const { editableMotions } = useMotion();
  const payload = useRef<MotionGenPayload | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [presetNames, setPresetNames] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  // Common form fields
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(1);
  const [magnitude, setMagnitude] = useState(1);
  const [direction, setDirection] = useState<Direction>("heave");

  // Sine motion specific
  const [frequency, setFrequency] = useState(1);
  const [phase, setPhase] = useState(0.0);

  // Ramp and MinJerk specific
  const [startValue, setStartValue] = useState(0);
  const [endValue, setEndValue] = useState(1);

  // Twin Peak specific
  const [firstPeakTime, setFirstPeakTime] = useState(0.3);
  const [firstPeakValue, setFirstPeakValue] = useState(1);
  const [secondPeakTime, setSecondPeakTime] = useState(0.7);
  const [secondPeakValue, setSecondPeakValue] = useState(1);

  // White Noise specific
  const [lowCutoff, setLowCutoff] = useState(0.1);
  const [highCutoff, setHighCutoff] = useState(10);
  const [seed, setSeed] = useState(42);
  useEffect(() => {
    fetchPresets();
  }, [motionType]);

  const resetForm = () => {
    setName("");
    setDuration(1);
    setMagnitude(1);
    setDirection("heave");
    setFrequency(1);
    setStartValue(0);
    setEndValue(1);
    setFirstPeakTime(0.3);
    setFirstPeakValue(1);
    setSecondPeakTime(0.7);
    setSecondPeakValue(1);
    setLowCutoff(0.1);
    setHighCutoff(10);
    setSeed(42);
    setDirection("heave");
    setMessage?.("");
    setMotion(null);
  };

  const handleGenerate = async () => {
    let result;

    switch (motionType) {
      case "sine": {
        payload.current = {
          type: "sine",
          name,
          parameters: {
            duration,
            magnitude,
            frequency,
            direction,
            phase,
          },
        };
        break;
      }

      case "impulse": {
        payload.current = {
          type: "impulse",
          name,
          parameters: {
            duration,
            direction,
          },
        };
        break;
      }

      case "ramp": {
        payload.current = {
          type: "ramp",
          name,
          parameters: {
            duration,
            magnitude,
            direction,
            startValue,
            endValue,
          },
        };
        break;
      }

      case "min_jerk": {
        payload.current = {
          type: "min_jerk",
          name,
          parameters: {
            duration,
            magnitude,
            direction,
            startValue,
            endValue,
          },
        };
        break;
      }

      case "twin_peak": {
        payload.current = {
          type: "twin_peak",
          name,
          parameters: {
            duration,
            magnitude,
            direction,
            firstPeakTime,
            firstPeakValue,
            secondPeakTime,
            secondPeakValue,
          },
        };
        break;
      }

      case "white_noise": {
        payload.current = {
          type: "white_noise",
          name,
          parameters: {
            duration,
            magnitude,
            direction,
            lowCutoff,
            highCutoff,
            seed,
          },
        };
        break;
      }

      default:
        setMessage?.("Unsupported motion type");
        return;
    }

    setMessage?.("");
    setIsGenerating(true);
    result = await generateMotion(payload.current);

    if (result.errorMsg) setMessage?.(result.errorMsg.error);
    if (result.data) {
      setReadOnly?.(true);
      setMotion(result.data);
      if (editableMotions.includes(name)) {
        setMessage?.(
          `Motion ${result.data.name} will overwrite existing motion when saved.`
        );
      } else {
        setMessage?.(`Generated motion "${result.data.name}" successfully.`);
      }
    }
    setIsGenerating(false);
  };

  const renderMotionSpecificFields = () => {
    switch (motionType) {
      case "sine":
        return (
          <>
            <div>
              <label>Frequency: </label>
              <input
                type="number"
                value={frequency || ""}
                placeholder="0"
                onChange={(e) => setFrequency(Number(e.target.value))}
                step="0.1"
                min="0.1"
              />
            </div>
            <div>
              <label>Phase (Degrees): </label>
              <input
                type="number"
                value={phase || ""}
                placeholder="0"
                onChange={(e) => setPhase(Number(e.target.value))}
                step="0.1"
                min="0.1"
              />
            </div>
          </>
        );

      case "ramp":
      case "min_jerk":
        return (
          <>
            <div>
              <label>Start Value: </label>
              <input
                type="number"
                value={startValue || ""}
                placeholder="0"
                onChange={(e) => setStartValue(Number(e.target.value))}
                step="0.1"
              />
            </div>
            <div>
              <label>End Value: </label>
              <input
                type="number"
                value={endValue || ""}
                placeholder="0"
                onChange={(e) => setEndValue(Number(e.target.value))}
                step="0.1"
              />
            </div>
          </>
        );

      case "twin_peak":
        return (
          <>
            <div>
              <label>First Peak Time: </label>
              <input
                type="number"
                value={firstPeakTime || ""}
                placeholder="0"
                onChange={(e) => setFirstPeakTime(Number(e.target.value))}
                step="0.1"
                min="0"
                max={duration || ""}
              />
            </div>
            <div>
              <label>First Peak Value: </label>
              <input
                type="number"
                value={firstPeakValue || ""}
                placeholder="0"
                onChange={(e) => setFirstPeakValue(Number(e.target.value))}
                step="0.1"
              />
            </div>
            <div>
              <label>Second Peak Time: </label>
              <input
                type="number"
                value={secondPeakTime || ""}
                placeholder="0"
                onChange={(e) => setSecondPeakTime(Number(e.target.value))}
                step="0.1"
                min="0"
                max={duration || ""}
              />
            </div>
            <div>
              <label>Second Peak Value: </label>
              <input
                type="number"
                value={secondPeakValue || ""}
                placeholder="0"
                onChange={(e) => setSecondPeakValue(Number(e.target.value))}
                step="0.1"
              />
            </div>
          </>
        );

      case "white_noise":
        return (
          <>
            <div>
              <label>Low Cutoff: </label>
              <input
                type="number"
                value={lowCutoff || ""}
                placeholder="0"
                onChange={(e) => setLowCutoff(Number(e.target.value))}
                step="0.1"
                min="0.1"
              />
            </div>
            <div>
              <label>High Cutoff: </label>
              <input
                type="number"
                value={highCutoff || ""}
                placeholder="0"
                onChange={(e) => setHighCutoff(Number(e.target.value))}
                step="0.1"
                min="0.1"
              />
            </div>
            <div>
              <label>Seed: </label>
              <input
                type="number"
                value={seed || ""}
                placeholder="0"
                onChange={(e) => setSeed(Number(e.target.value))}
                step="1"
              />
            </div>
          </>
        );

      default:
        return null;
    }
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
    if (payload.current === null) {
      setMessage?.("No motion payload available");
      return;
    }
    let msg = "";
    const presetRes = await savePreset(payload.current);
    if (presetRes.data) msg += presetRes.data.message + "\n";
    if (presetRes.errorMsg) msg += presetRes.errorMsg.error + "\n";

    const motionRes = await saveMotion(motion);
    if (motionRes.data) {
      setReadOnly?.(false);
      msg += motionRes.data.message + "\n";
    }
    if (motionRes.errorMsg) msg += motionRes.errorMsg.error + "\n";
    setMessage?.(msg);
    setRefresh((prev) => !prev);
  };

  const handleSelectMotionType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "") {
      navigate("/generate");
      return;
    }
    const newType = e.target.value as MotionGenType;
    resetForm();
    setPresetNames([]);
    setSelectedPreset("");
    navigate(`/generate?type=${newType}`);
  };

  const loadPreset = (preset: MotionGenPayload) => {
    try {
      let parsed;
      switch (preset.type) {
        case "sine": {
          parsed = schemaMap[preset.type].parse(preset);
          setFrequency(parsed.parameters.frequency);
          break;
        }
        case "ramp":
        case "min_jerk": {
          parsed = schemaMap[preset.type].parse(preset);
          setStartValue(parsed.parameters.startValue);
          setEndValue(parsed.parameters.endValue);
          break;
        }
        case "twin_peak": {
          parsed = schemaMap[preset.type].parse(preset);
          setFirstPeakTime(parsed.parameters.firstPeakTime);
          setFirstPeakValue(parsed.parameters.firstPeakValue);
          setSecondPeakTime(parsed.parameters.secondPeakTime);
          setSecondPeakValue(parsed.parameters.secondPeakValue);
          break;
        }
        case "white_noise": {
          parsed = schemaMap[preset.type].parse(preset);
          setLowCutoff(parsed.parameters.lowCutoff);
          setHighCutoff(parsed.parameters.highCutoff);
          setSeed(parsed.parameters.seed);
          break;
        }
        case "impulse": {
          parsed = schemaMap[preset.type].parse(preset);
          break;
        }
        default: {
          setMessage?.("Unsupported motion type for preset loading");
          return;
        }
      }
      setName(parsed.name);
      if ("parameters" in parsed) {
        setDuration(parsed.parameters.duration);
        if ("magnitude" in parsed.parameters) {
          setMagnitude(parsed.parameters.magnitude as number);
        }
        if ("direction" in parsed.parameters) {
          setDirection(parsed.parameters.direction as Direction);
        }
      }
      setMessage?.(`Loaded preset "${preset.name}" successfully!`);
    } catch (err) {
      setMessage?.(toErrorMsg(err).error);
    }
  };

  const handleSelectPreset = async (
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
    if (motionType === "") {
      return;
    }
    const presetRes = await getPresetNamesByType(motionType);
    if (presetRes.data) setPresetNames(presetRes.data);
    if (presetRes.errorMsg) setMessage?.(presetRes.errorMsg.error);
  };

  return (
    <div className="motion-generator">
      <h2>Generate Motion</h2>

      <div className="flex-col">
        <div className="motion-type-selector">
          <label>Motion Type: </label>
          <select value={motionType} onChange={handleSelectMotionType}>
            <option value="">-- Select Motion Type --</option>
            <option value="sine">Sine Motion</option>
            <option value="impulse">Impulse Motion</option>
            <option value="ramp">Ramp Motion</option>
            <option value="min_jerk">Min Jerk Motion</option>
            <option value="twin_peak">Twin Peak Motion</option>
            <option value="white_noise">White Noise Motion</option>
          </select>
        </div>
        {motionType !== "" && (
          <>
            <div>
              <label>Presets: </label>
              <select value={selectedPreset} onChange={handleSelectPreset}>
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
              <label>Duration (seconds): </label>
              <input
                type="number"
                value={duration || ""}
                placeholder="0"
                onChange={(e) => setDuration(Number(e.target.value))}
                step="0.1"
                min="0.1"
              />
            </div>
            {motionType !== "impulse" && (
              <div>
                <label>Magnitude: </label>
                <input
                  type="number"
                  value={magnitude || ""}
                  placeholder="0"
                  onChange={(e) => setMagnitude(Number(e.target.value))}
                  step="1"
                  min="0"
                />
              </div>
            )}

            <div>
              <label>Direction: </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as Direction)}
              >
                {motionDirections.map((dir) => (
                  <option key={dir} value={dir}>
                    {dir}
                  </option>
                ))}
              </select>
            </div>
            {renderMotionSpecificFields()}
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
                disabled={!motion}
                className="save-button"
              >
                Save
              </button>
              <button onClick={resetForm} className="reset-button">
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

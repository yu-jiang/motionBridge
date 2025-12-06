import { useEffect, useRef, useState } from "react";
import {
  CompositeMotionPayload,
  compositeMotionSchema,
  CompositionOperation,
  compositionOperations,
  Motion,
  MotionGetSetProps,
  MotionGenPayload,
} from "../shared/motion.type";
import {
  generateMotion,
  getMotionByName,
  getPreset,
  getPresetNamesByType,
  saveMotion,
  savePreset,
} from "../services/motionEditorService";
import MotionSearch from "./motionSearch";
import { toErrorMsg } from "../services/api";
import useMotion from "../hooks/useMotion";
import useMessage from "../hooks/useMessage";
import useRefresh from "../hooks/useRefresh";

interface MotionComposerProps extends MotionGetSetProps {
  srcMotion1: Motion | null;
  srcMotion2: Motion | null;
  setSrcMotion1: React.Dispatch<React.SetStateAction<Motion | null>>;
  setSrcMotion2: React.Dispatch<React.SetStateAction<Motion | null>>;
}

export default function MotionComposer({
  motion: resMotion,
  setMotion: setResMotion,
  srcMotion1,
  setSrcMotion1,
  srcMotion2,
  setSrcMotion2,
  setReadOnly,
}: MotionComposerProps) {
  const { setRefresh } = useRefresh();
  const { editableMotions } = useMotion();
  const { setMessage } = useMessage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [name, setName] = useState("");
  const [operation, setOperation] = useState<CompositionOperation>("add");
  const [magnitudeOvr1, setMagnitudeOvr1] = useState<number | undefined>(
    undefined
  );
  const [magnitudeOvr2, setMagnitudeOvr2] = useState<number | undefined>(
    undefined
  );
  const [presetNames, setPresetNames] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const payload = useRef<CompositeMotionPayload | null>(null);
  useEffect(() => {
    fetchPresets();
  }, []);
  const resetForm = () => {
    payload.current = null;
    setSelectedPreset("");
    setSrcMotion1(null);
    setSrcMotion2(null);
    setResMotion(null);
    setName("");
    setReadOnly?.(false);
    setMessage?.("");
  };

  const handleGenerate = async () => {
    if (!srcMotion1 || !srcMotion2) {
      setMessage?.("Please select both motions to compose.");
      return;
    }

    payload.current = {
      type: "composite",
      name,
      composition: {
        operation: operation,
        motions: [
          {
            motionRef: srcMotion1.name,
            startTime: srcMotion1.offset ?? 0,
            magnitudeOverride: magnitudeOvr1,
          },
          {
            motionRef: srcMotion2.name,
            startTime: srcMotion2.offset ?? 0,
            magnitudeOverride: magnitudeOvr2,
          },
        ],
      },
    };

    setIsGenerating(true);
    const res = await generateMotion(payload.current);
    if (res.errorMsg) setMessage?.(res.errorMsg.error);
    if (res.data) {
      setReadOnly?.(true);
      setResMotion(res.data);
      setSrcMotion1(null);
      setSrcMotion2(null);
      setMagnitudeOvr1(undefined);
      setMagnitudeOvr2(undefined);
      if (editableMotions.includes(name)) {
        setMessage?.(
          `Motion ${res.data.name} will overwrite existing motion when saved.`
        );
      } else {
        setMessage?.(
          `Generated composite motion "${res.data.name}" successfully.`
        );
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
    if (resMotion === null) {
      setMessage?.("No motion data to save");
      return;
    }
    if (payload.current === null) {
      setMessage?.("No composition parameters to save");
      return;
    }
    let msg = "";
    const presetRes = await savePreset(payload.current);
    if (presetRes.data) msg += presetRes.data.message + "\n";
    if (presetRes.errorMsg) msg += presetRes.errorMsg.error + "\n";

    const motionRes = await saveMotion(resMotion);
    if (motionRes.data) {
      setReadOnly?.(false);
      msg += motionRes.data.message + "\n";
    }
    if (motionRes.errorMsg) msg += motionRes.errorMsg.error + "\n";
    setMessage?.(msg);
    setRefresh((prev) => !prev);
  };

  const loadPreset = async (preset: MotionGenPayload) => {
    try {
      const parsed = compositeMotionSchema.parse(preset);
      const motion1 = await getMotionByName(
        parsed.composition.motions[0].motionRef
      );
      const motion2 = await getMotionByName(
        parsed.composition.motions[1].motionRef
      );
      if (motion1.data && motion2.data) {
        setName(preset.name);
        setSrcMotion1({
          ...motion1.data,
          offset: parsed.composition.motions[0].startTime,
        });
        setSrcMotion2({
          ...motion2.data,
          offset: parsed.composition.motions[1].startTime,
        });
        setMagnitudeOvr1(
          parsed.composition.motions[0].magnitudeOverride ?? undefined
        );
        setMagnitudeOvr2(
          parsed.composition.motions[1].magnitudeOverride ?? undefined
        );
        setOperation(parsed.composition.operation as CompositionOperation);
        setResMotion(null);
        setReadOnly?.(false);
        setMessage?.(`Loaded preset "${preset.name}" successfully.`);
      } else {
        let str = "";
        if (motion1.errorMsg) {
          str += motion1.errorMsg.error + "\n";
        }
        if (motion2.errorMsg) {
          str += motion2.errorMsg.error + "\n";
        }
        setMessage?.(str);
      }
    } catch (err) {
      setMessage?.(toErrorMsg(err).error);
    }
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

  const handleSelectMotionName =
    (setMotion: React.Dispatch<React.SetStateAction<Motion | null>>) =>
    async (name: string) => {
      if (name === "") {
        setMotion(null);
        return;
      }
      const res = await getMotionByName(name);
      if (res.data) {
        setMotion(res.data);
        setMessage?.("");
      }
      if (res.errorMsg) {
        setMessage?.(res.errorMsg.error);
      }
    };

  const fetchPresets = async () => {
    const presetRes = await getPresetNamesByType("composite");
    if (presetRes.data) setPresetNames(presetRes.data);
    if (presetRes.errorMsg) setMessage?.(presetRes.errorMsg.error);
  };
  return (
    <div>
      <h2>Compose Motion</h2>
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
          <label>Result Motion Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Motion Name"
          />
        </div>

        <div>
          <label>Motion 1: </label>
          <MotionSearch
            value={srcMotion1?.name || ""}
            onChange={handleSelectMotionName(setSrcMotion1)}
          />
        </div>

        {srcMotion1 && (
          <>
            <div>
              <label>Start Time: </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={srcMotion1.offset || ""}
                placeholder="0"
                onChange={(e) => {
                  setSrcMotion1({
                    ...srcMotion1,
                    offset: parseFloat(e.target.value),
                  });
                }}
              />
            </div>

            <div>
              <label>Magnitude Override: </label>
              <input
                type="number"
                min="0"
                step="1"
                value={magnitudeOvr1 || ""}
                placeholder="0"
                onChange={(e) => {
                  setMagnitudeOvr1(parseFloat(e.target.value));
                }}
              />
            </div>
          </>
        )}

        <div>
          <label>Operation: </label>
          <select
            value={operation}
            onChange={(e) =>
              setOperation(e.target.value as CompositionOperation)
            }
          >
            {compositionOperations.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>
            Motion 2:
            <MotionSearch
              value={srcMotion2?.name || ""}
              onChange={handleSelectMotionName(setSrcMotion2)}
            />
          </label>
        </div>
        {srcMotion2 && (
          <>
            <div>
              <label>Start Time: </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={srcMotion2.offset || ""}
                placeholder="0"
                onChange={(e) => {
                  setSrcMotion2({
                    ...srcMotion2,
                    offset: parseFloat(e.target.value),
                  });
                }}
              />
            </div>

            <div>
              <label>Magnitude Override: </label>
              <input
                type="number"
                min="0"
                step="1"
                value={magnitudeOvr2 || ""}
                placeholder="0"
                onChange={(e) => {
                  setMagnitudeOvr2(parseFloat(e.target.value));
                }}
              />
            </div>
          </>
        )}
        <div className="actions">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !srcMotion1 || !srcMotion2}
            className="generate-button"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>

          <button
            onClick={handleSave}
            disabled={!resMotion}
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

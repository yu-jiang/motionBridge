import { useEffect, useState } from "react";
import { Motion, MotionGetSetProps } from "../shared/motion.type";
import {
  deleteMotion,
  scaleMotion,
  updateMotion,
} from "../services/motionEditorService";
import MotionInfo from "./motionInfo";
import useMessage from "../hooks/useMessage";
import useRefresh from "../hooks/useRefresh";

export default function MotionEditor({
  motion,
  setMotion,
  readOnly,
}: MotionGetSetProps) {
  const { setMessage } = useMessage();
  const { setRefresh } = useRefresh();
  const [updated, setUpdated] = useState(false);
  const [formMotion, setFormMotion] = useState<Motion | null>(motion);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setFormMotion(motion);
    setUpdated(false);
  }, [motion, readOnly]);

  const handleFieldChange =
    <K extends keyof Motion>(
      key: K,
      transform?: (value: string) => Motion[K]
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!motion) {
        return;
      }
      const rawValue = e.target.value;
      const processedValue = transform ? transform(rawValue) : rawValue;
      setFormMotion((prev) => {
        const base = prev ?? motion;
        return { ...base, [key]: processedValue };
      });
      setUpdated(true);
    };

  const handleUpdate = async () => {
    if (!motion) {
      return;
    }

    if (!formMotion || !updated) {
      setMessage?.("You must make changes before submitting");
      return;
    }

    const res = await updateMotion(motion.name, formMotion);
    if (res.errorMsg) setMessage?.(res.errorMsg.error);
    if (res.data) {
      setMotion(res.data);
      setFormMotion(motion);
      setUpdated(false);
      setMessage?.("Motion updated successfully!");
      setRefresh((prev) => !prev);
    }
  };

  const handleScaleSubmit = async () => {
    if (!motion) {
      return;
    }
    if (scale < -2 || scale > 2) {
      setMessage?.("Scale must be between -2 and 2.");
      return;
    }
    const maxMag = Math.max(
      ...motion.flShape,
      ...motion.frShape,
      ...motion.rlShape,
      ...motion.rrShape
    );
    const minMag = Math.min(
      ...motion.flShape,
      ...motion.frShape,
      ...motion.rlShape,
      ...motion.rrShape
    );
    if (maxMag * scale > 1 || minMag * scale < -1) {
      if (
        !window.confirm(
          "This scaling will cause clipping and motion deformation. Continue?"
        )
      ) {
        setMessage?.("Motion scaling cancelled");
        return;
      }
    }

    const res = await scaleMotion(motion, scale);
    if (res.errorMsg) setMessage?.(res.errorMsg.error);
    if (res.data) {
      setMotion(res.data);
      setFormMotion(res.data);
      setUpdated(false);
      setMessage?.("Motion rescaled successfully!");
      setRefresh((prev) => !prev);
    }
  };

  const handleDelete = async () => {
    if (!motion) {
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete motion "${motion.name}"?`
      )
    ) {
      setMessage?.("Motion deletion cancelled");
      return;
    }

    const res = await deleteMotion(motion);
    if (res.errorMsg) setMessage?.(res.errorMsg.error);
    if (res.data) {
      setMessage?.(res.data.message);
      setMotion(null);
      setFormMotion(null);
      setUpdated(false);
      setRefresh((prev) => !prev);
    }
  };

  const handleReset = () => {
    if (!updated) {
      setMessage?.("Motion already in original state");
      return;
    }
    setFormMotion(motion);
    setUpdated(false);
    setMessage?.("Motion reset to original state");
  };
  if (!motion) {
    return <div className="motion-form"></div>;
  }
  if (readOnly) {
    return <MotionInfo motion={motion} />;
  }

  return (
    <>
      {motion &&
        (readOnly ? (
          <MotionInfo motion={motion} />
        ) : (
          <div className="motion-form">
            <h2>Edit Motion</h2>
            <div className="flex-col">
              <div>
                <label>Name: </label>
                <input
                  type="text"
                  value={formMotion?.name}
                  onChange={handleFieldChange("name")}
                  placeholder="Motion Name"
                />
              </div>
              {motion.id !== undefined && (
                <div>
                  <label>ID: </label>
                  <input
                    type="text"
                    value={formMotion?.id}
                    onChange={handleFieldChange("id")}
                    placeholder="Motion ID"
                  />
                </div>
              )}
              <div>
                <label>Short Display Name: </label>
                <input
                  type="text"
                  value={formMotion?.shortDisplayName}
                  onChange={handleFieldChange("shortDisplayName")}
                  placeholder="Short Display Name"
                />
              </div>
              <div>
                <label>Long Display Name: </label>
                <input
                  type="text"
                  value={formMotion?.longDisplayName}
                  onChange={handleFieldChange("longDisplayName")}
                  placeholder="Long Display Name"
                />
              </div>
              <div>
                <label>Color: </label>
                <input
                  style={{ color: motion.color }}
                  type="text"
                  value={formMotion?.color}
                  onChange={handleFieldChange("color")}
                  placeholder="#RRGGBB"
                />
              </div>
              <div>
                <label>Magnitude: </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formMotion?.magnitude || ""}
                  placeholder="0"
                  onChange={handleFieldChange(
                    "magnitude",
                    (value) => parseInt(value, 10) || 0
                  )}
                />
              </div>
              <div className="actions">
                <button type="button" onClick={handleUpdate}>
                  Update
                </button>
                <button type="button" onClick={handleReset}>
                  Reset
                </button>
                <button type="button" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
            <h2>Adjust Motion Scale</h2>
            <div className="flex-col">
              <p>
                Scale the motion's magnitude by a factor between -2 and 2.
                Negative values will invert the motion.
              </p>
              <div>
                <label>Scale Factor: </label>
                <input
                  type="number"
                  min="-2"
                  max="2"
                  step="0.1"
                  defaultValue={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                />
                <button type="button" onClick={handleScaleSubmit}>
                  Apply Scale
                </button>
              </div>
            </div>
          </div>
        ))}
    </>
  );
}

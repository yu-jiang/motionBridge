import { useEffect, useState } from "react";
import { MotionSelectorProps } from "../shared/motion.type";
import useMotion from "../hooks/useMotion";
import useMessage from "../hooks/useMessage";

export default function MotionSelector({
  value: motionName,
  onChange: setMotionName,
}: MotionSelectorProps) {
  const { setMessage } = useMessage();
  const { motions } = useMotion();
  const motionList = motions.filter((m) => m !== "none");
  const [selectValue, setSelectValue] = useState("");

  useEffect(() => {
    setSelectValue(motionName);
  }, [motionName]);

  const handleSelectChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectValue(e.target.value);
    setMotionName(e.target.value);
    setMessage?.("");
  };

  return (
    <div>
      <label htmlFor="motionSelect">Select Motion:</label>
      <select
        id="motionSelect"
        value={selectValue}
        onChange={handleSelectChange}
      >
        <option value="">-- Select a Motion --</option>
        {motionList.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

import { createContext, useContext, useEffect, useState } from "react";
import {
  getEditableMotions,
  getMotions,
  getPresetNames,
} from "../services/motionEditorService";

interface MotionContext {
  motions: string[];
  editableMotions: string[];
  presets: string[];
}

export const MotionContext = createContext<MotionContext>({
  motions: [],
  editableMotions: [],
  presets: [],
});

export const MotionProvider = ({
  children,
  refresh,
}: {
  children: React.ReactNode;
  refresh?: boolean;
}) => {
  const [motions, setMotions] = useState<string[]>([]);
  const [editableMotions, setEditableMotions] = useState<string[]>([]);
  const [presets, setPresets] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const motionRes = await getMotions();
      if (motionRes.data) {
        setMotions(motionRes.data);
      }
      const lockRes = await getEditableMotions();
      if (lockRes.data) {
        setEditableMotions(lockRes.data);
      }
      const presetRes = await getPresetNames();
      if (presetRes.data) {
        setPresets(presetRes.data);
      }
    })();
  }, [refresh]);
  return (
    <MotionContext.Provider
      value={{
        motions,
        editableMotions,
        presets,
      }}
    >
      {children}
    </MotionContext.Provider>
  );
};

export default function useMotion() {
  return useContext(MotionContext);
}

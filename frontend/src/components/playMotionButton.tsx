import useMessage from "../hooks/useMessage";
import { playMotion } from "../services/motionEditorService";
import { MotionGetterProps } from "../shared/motion.type";

export default function PlayMotionButton({ motion }: MotionGetterProps) {
  const { setMessage } = useMessage();
  return (
    <button
      className="btn btn-primary"
      onClick={async () => {
        if (!motion) return;
        await playMotion(motion, setMessage);
      }}
      disabled={!motion}
    >
      Play Motion
    </button>
  );
}

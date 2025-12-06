import { MotionGetterProps } from "../shared/motion.type";

export default function MotionInfo({ motion }: MotionGetterProps) {
  return (
    <>
      {motion && (
        <div>
          <h2>Motion Info</h2>
          <div className="flex-col">
            <div>Name: {motion.name}</div>
            <div>Short Display Name: {motion.shortDisplayName}</div>
            <div>Long Display Name: {motion.longDisplayName}</div>
            <div>
              Color: <span style={{ color: motion.color }}>{motion.color}</span>
            </div>
            <div>Magnitude: {motion.magnitude}</div>
            {motion.duration !== undefined && (
              <div>Duration: {motion.duration}s</div>
            )}
            {motion.offset !== undefined && <div>Offset: {motion.offset}</div>}
            {motion.compositionDegree !== undefined && (
              <div>Composition Degree: {motion.compositionDegree}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

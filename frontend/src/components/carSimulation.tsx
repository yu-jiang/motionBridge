import { useWebSocket } from "../hooks/useWebSocket";
import { useEffect, useRef, useState } from "react";

const carCanvasWidth = 350;
const carCanvasHeight = 300;
const wheelPosList = [
  [200, 100],
  [300, 150],
  [50, 200],
  [150, 250],
];
const wheelLabels = ["FL", "FR", "RL", "RR"]; // Front-Left, Front-Right, Rear-Left, Rear-Right
const chassisOffset = 60;
const vibrationWindow = 30;

const drawCar = (context: CanvasRenderingContext2D, forces: number[]): void => {
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, carCanvasWidth, carCanvasHeight);
  wheelPosList.forEach((pos, index) => {
    context.fillStyle = `rgb(0, 0, 0)`;
    context.beginPath();
    context.arc(pos[0], pos[1], 20, 0, 2 * Math.PI);
    context.fill();
  });

  // Labels next to wheels (drawn after wheels for visibility)
  context.font = "12px Segoe UI, Arial, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  wheelPosList.forEach((pos, index) => {
    const labelX = pos[0] + 26; // to the right of each wheel
    const labelY = pos[1];
    // outline for contrast
    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 3;
    context.strokeText(wheelLabels[index], labelX, labelY);
    // fill color
    context.fillStyle = "#333333";
    context.fillText(wheelLabels[index], labelX, labelY);
  });

  const cornerOffsets = forces.map((force) => chassisOffset + force * 30);
  context.strokeStyle = "#0000FF";
  context.lineWidth = 3;
  context.beginPath();
  const wheelIndexes = [0, 1, 3, 2, 0];
  for (let drawIndex = 0; drawIndex < wheelIndexes.length; drawIndex += 1) {
    const wheelIndex = wheelIndexes[drawIndex];
    const pos = wheelPosList[wheelIndex];
    const posX = pos[0];
    const posY = pos[1] - cornerOffsets[wheelIndex];
    if (drawIndex <= 0) {
      context.moveTo(posX, posY);
    } else {
      context.lineTo(posX, posY);
    }
  }
  context.stroke();
  wheelPosList.forEach((pos, index) => {
    context.beginPath();
    context.moveTo(pos[0], pos[1]);
    context.lineTo(pos[0], pos[1] - cornerOffsets[index]);
    context.stroke();
  });
};

const CarSimulation = () => {
  const { message } = useWebSocket("ws://localhost:6789/output?client=bridge");
  const [forces, setForces] = useState<number[]>([0, 0, 0, 0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update forces when message changes
  useEffect(() => {
    if (!message) {
      return;
    }
    const data = JSON.parse(message);
    if (data.forces && Array.isArray(data.forces) && data.forces.length === 4) {
      setForces(data.forces);
    }
  }, [message]);

  // Redraw canvas whenever forces change
  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        drawCar(context, forces);
      }
    }
  }, [forces]);

  return (
    <canvas
      ref={canvasRef}
      width={carCanvasWidth}
      height={carCanvasHeight}
      style={{
        width: carCanvasWidth,
        height: carCanvasHeight,
        border: "3px #888888 solid",
      }}
    />
  );
};

export default CarSimulation;

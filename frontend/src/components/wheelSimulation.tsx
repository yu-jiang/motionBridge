import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

const canvasWidth = 300;
const canvasHeight = 300;

// Map roll (unitless from forces) to wheel angle in degrees
const mapRollToAngleDeg = (roll: number): number => {
  // Scale factor chosen empirically; clamp to avoid extreme rotation
  const scaled = roll * 45; // 1.0 roll => 45 degrees
  return Math.max(-90, Math.min(90, scaled));
};

const drawWheel = (ctx: CanvasRenderingContext2D, angleDeg: number) => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const outerR = 110;
  const innerR = 80;

  // Outer rim
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 10;
  ctx.stroke();

  // Inner rim
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Hub
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle = "#999";
  ctx.fill();

  // Rotate spokes by angle
  const ang = (angleDeg * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);

  // Three-spoke design
  ctx.strokeStyle = "#0078D4";
  ctx.lineWidth = 6;
  // Top spoke
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -innerR);
  ctx.stroke();
  // Bottom-left spoke
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-innerR * Math.cos(Math.PI / 6), innerR * Math.sin(Math.PI / 6));
  ctx.stroke();
  // Bottom-right spoke
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(innerR * Math.cos(Math.PI / 6), innerR * Math.sin(Math.PI / 6));
  ctx.stroke();

  ctx.restore();

  // Angle label
  ctx.fillStyle = "#222";
  ctx.font = "14px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Angle: ${angleDeg.toFixed(1)}°`, cx, canvasHeight - 20);
};

const WheelSimulation = () => {
  const { message } = useWebSocket("ws://localhost:6789/output?client=bridge");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angleDeg, setAngleDeg] = useState<number>(0);

  // Parse incoming websocket message for forces and derive roll
  useEffect(() => {
    if (!message) return;
    try {
      const data = JSON.parse(message);
      // Expected: { forces: number[4] } for FL, FR, RL, RR
      if (data && Array.isArray(data.forces)) {
        const forces: number[] = data.forces;
        // Derive roll: difference between right side and left side averages
        // roll > 0 => tilt to the right; roll < 0 => tilt to the left
        if (forces.length >= 4) {
          const leftAvg = (forces[0] + forces[2]) / 2; // FL, RL
          const rightAvg = (forces[1] + forces[3]) / 2; // FR, RR
          const roll = rightAvg - leftAvg;
          setAngleDeg((deg) => deg + mapRollToAngleDeg(roll));
        } else {
          // Fallback: use first value as roll
          setAngleDeg((deg) => deg + mapRollToAngleDeg(forces[0] ?? 0));
        }
      }
    } catch (e) {
      // Ignore malformed messages
    }
  }, [message]);

  // Redraw when angle changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawWheel(ctx, angleDeg);
  }, [angleDeg]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        width: canvasWidth,
        height: canvasHeight,
        border: "3px #888888 solid",
        background: "#fff",
      }}
    />
  );
};

export default WheelSimulation;

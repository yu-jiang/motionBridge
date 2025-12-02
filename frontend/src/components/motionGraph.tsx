import { useState, useRef, useEffect, MouseEvent } from "react";
import {
  motionShapeKeys,
  MotionShapeKey,
  MotionViewProps,
  MotionViewDataset,
  Motion,
} from "../shared/motion.type";
import { FREQUENCY } from "../shared";
import { prepareDatasets, prepareCombinedDatasets } from "../utils/helper";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CanvasRenderer,
  drawPlotBase,
  computePlotDimensions,
  drawDatasetsCurves,
  drawLegend,
} from "../utils/plot";

// Grid and axes handled by shared plotting module

// ===== INDIVIDUAL GRAPH CANVAS COMPONENT =====
function GraphCanvas({
  label,
  datasets,
  offsetX,
  onDrag,
  samples,
  xScale,
}: {
  label: string;
  datasets: MotionViewDataset[];
  offsetX: number;
  onDrag: (dx: number) => void;
  samples: number;
  xScale: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas setup
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const dims = computePlotDimensions(CANVAS_WIDTH, CANVAS_HEIGHT);
    const stepX = (dims.plotWidth / samples) * xScale;
    const maxMagnitude = datasets.reduce(
      (max, dataset) => Math.max(max, dataset.magnitude),
      1
    );
    const pixelsPerSecond = stepX / (1 / FREQUENCY);
    const renderer = new CanvasRenderer(ctx);
    const { dims: plotDimensions } = drawPlotBase(renderer, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      magnitude: maxMagnitude,
      pixelsPerSecond,
      offsetX,
    });

    // ===== MOTION DATA LINES =====
    drawDatasetsCurves(renderer, datasets, {
      dims: plotDimensions,
      stepX,
      offsetX,
      axisMagnitude: maxMagnitude,
      frequency: FREQUENCY,
    });

    // ===== LEGEND BOX (when multiple datasets) - POSITIONED ON TOP OF PLOTTING AREA =====
    drawLegend(renderer, datasets, { dims: plotDimensions });
  }, [datasets, offsetX, samples, xScale]);

  // ===== MOUSE INTERACTION HANDLERS (for panning) =====
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    setDragStartX(e.clientX);
    onDrag(dx);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // ===== GRAPH CONTAINER WITH TITLE AND TIME LABEL =====
  return (
    <div className="graph-container">
      <h3>{label}</h3>
      <canvas
        style={{
          border: "none",
          cursor: isDragging ? "grabbing" : "grab",
          backgroundColor: "#fff",
        }}
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

// ===== MAIN MOTION GRAPH COMPONENT =====
export default function MotionGraph({ motions }: MotionViewProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [linearSlider, setLinearSlider] = useState(50);
  const [xScale, setXScale] = useState(1);

  // Reset view when motions change
  useEffect(() => {
    setOffsetX(0);
    setLinearSlider(50);
    setXScale(1);
  }, [motions]);

  if (!motions || motions.length === 0) {
    return <div className="motion-graph">No motion data available</div>;
  }

  // ===== DATA PREPARATION =====
  const referenceMotion = motions[0];
  const samples =
    referenceMotion.flShape.length ||
    referenceMotion.frShape.length ||
    referenceMotion.rlShape.length ||
    referenceMotion.rrShape.length;

  // ===== INTERACTION HANDLERS =====
  // Handle horizontal panning
  const handleDrag = (dx: number) => {
    const dims = computePlotDimensions(CANVAS_WIDTH, CANVAS_HEIGHT);
    const stepX = (dims.plotWidth / samples) * xScale;

    let maxExtent = 0;
    motions.forEach((motion) => {
      const motionLength = Math.max(
        motion.flShape?.length || 0,
        motion.frShape?.length || 0,
        motion.rlShape?.length || 0,
        motion.rrShape?.length || 0
      );
      const offsetSamples = Math.round((motion.offset || 0) * FREQUENCY);
      const motionExtent = motionLength + offsetSamples;
      maxExtent = Math.max(maxExtent, motionExtent);
    });

    const totalWidth = maxExtent * stepX;
    const minOffset = Math.min(0, dims.plotWidth - totalWidth);
    const maxOffset = 0;
    setOffsetX((prev) => Math.max(minOffset, Math.min(prev + dx, maxOffset)));
  };

  // Handle X-scale zoom slider
  const handleSliderChange = (val: number) => {
    setLinearSlider(val);
    const midpoint = 50;
    const t =
      val < midpoint ? val / midpoint : (val - midpoint) / (100 - midpoint);
    const newScale =
      val < midpoint ? 0.1 * Math.pow(10, t) : 1 * Math.pow(10, t);
    setXScale(newScale);
  };

  // ===== LAYOUT RENDERING =====
  return (
    <div className="motion-graph">
      <h2>Motion Graphs</h2>

      {/* X-Scale control slider */}
      <div className="controls">
        <label>
          X Scale: <span>{xScale.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={linearSlider}
          step="1"
          onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
        />
      </div>

      {/* Individual shape graphs (flShape, frShape, rlShape, rrShape) */}
      <div className="grid-container">
        {motionShapeKeys.map((shapeKey) => (
          <GraphCanvas
            key={shapeKey}
            label={shapeKey}
            datasets={prepareDatasets(motions, shapeKey)}
            offsetX={offsetX}
            onDrag={handleDrag}
            samples={samples}
            xScale={xScale}
          />
        ))}
      </div>

      {/* Combined graph showing all shapes together */}
      <GraphCanvas
        key="combined"
        label="Combined Shapes"
        datasets={prepareCombinedDatasets(motions)}
        offsetX={offsetX}
        onDrag={handleDrag}
        samples={samples}
        xScale={xScale}
      />
    </div>
  );
}

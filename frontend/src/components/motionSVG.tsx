import { useRef, useEffect, useState, MouseEvent } from "react";
import SVG from "svg.js";
import {
  Motion,
  motionShapeKeys,
  MotionShapeKey,
  MotionViewProps,
  MotionViewDataset,
} from "../shared/motion.type";
import { FREQUENCY } from "../shared";
import { prepareDatasets, prepareCombinedDatasets } from "../utils/helper";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SVGRenderer,
  drawPlotBase,
  computePlotDimensions,
  drawDatasetsCurves,
  drawLegend,
} from "../utils/plot";

function ShapeSVG({
  motions,
  shapeKey,
  offsetX,
  onDrag,
  samples,
  xScale,
}: {
  motions: Motion[];
  shapeKey?: MotionShapeKey;
  offsetX: number;
  onDrag: (dx: number) => void;
  samples: number;
  xScale: number;
}) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  useEffect(() => {
    if (!svgRef.current || !motions || motions.length === 0) return;

    // Clear existing SVG
    svgRef.current.innerHTML = "";

    // Create new SVG with svg.js v2.x API
    const draw = SVG(svgRef.current).size(CANVAS_WIDTH, CANVAS_HEIGHT);
    const renderer = new SVGRenderer(draw);

    // Calculate maximum magnitude from all motions for consistent scaling
    const maxMagnitude = motions.reduce(
      (max, motion) => Math.max(max, motion.magnitude || 1),
      1
    );

    // Dimensions and pixelsPerSecond
    const dims = computePlotDimensions(CANVAS_WIDTH, CANVAS_HEIGHT);
    const stepX = (dims.plotWidth / samples) * xScale;
    const pixelsPerSecond = stepX / (1 / FREQUENCY);

    // Draw background, grid, axes, labels via shared module
    drawPlotBase(renderer, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      magnitude: Math.max(1, maxMagnitude),
      pixelsPerSecond,
      offsetX,
    });

    // ===== MOTION DATA LINES =====
    const { plotLeft, plotTop, plotWidth, plotHeight, plotCenterY } = dims;
    const plotRight = plotLeft + plotWidth;
    const yScale = plotHeight / 2;

    // Prepare datasets similar to motionGraph
    const datasets: MotionViewDataset[] = shapeKey
      ? prepareDatasets(motions, shapeKey)
      : prepareCombinedDatasets(motions);

    // Draw polylines for all datasets via shared helper
    drawDatasetsCurves(renderer, datasets, {
      dims,
      stepX,
      offsetX,
      axisMagnitude: Math.max(1, maxMagnitude),
      frequency: FREQUENCY,
    });

    // ===== LEGEND BOX (when multiple datasets) =====
    drawLegend(renderer, datasets, { dims });

    return () => {
      if (svgRef.current) {
        svgRef.current.innerHTML = "";
      }
    };
  }, [motions, shapeKey, offsetX, samples, xScale]);

  // ===== MOUSE INTERACTION HANDLERS (for panning) =====
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    setDragStartX(e.clientX);
    onDrag(dx);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  return (
    <div className="graph-container">
      <h3>{shapeKey || "Combined View"}</h3>
      <div
        ref={svgRef}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          backgroundColor: "#fff",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

export default function MotionSVG({ motions }: MotionViewProps) {
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

  return (
    <div className="motion-graph">
      <h2>Motion Graph</h2>

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
          <ShapeSVG
            key={shapeKey}
            motions={motions}
            shapeKey={shapeKey}
            offsetX={offsetX}
            onDrag={handleDrag}
            samples={samples}
            xScale={xScale}
          />
        ))}
      </div>

      {/* Combined graph showing all shapes together */}
      <ShapeSVG
        motions={motions}
        offsetX={offsetX}
        onDrag={handleDrag}
        samples={samples}
        xScale={xScale}
      />
    </div>
  );
}

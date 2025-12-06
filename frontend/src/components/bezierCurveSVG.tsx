import { useRef, useEffect, useState, MouseEvent } from "react";
import SVG from "svg.js";
import {
  EDITOR_CANVAS_WIDTH,
  EDITOR_CANVAS_HEIGHT,
  SVGRenderer,
  drawPlotBase,
  computePlotDimensions,
  isInsidePlot,
  drawDatasetsCurves,
} from "../utils/plot";
import { Anchor } from "../shared/motion.type";
import { FREQUENCY } from "../shared";
import { sampleHermiteSegment, clamp } from "../utils/helper";

// Simple id factory hook
const useIdFactory = () => {
  const counter = useRef(0);
  return () => `a_${counter.current++}`;
};

// Stable time sort with tie-breaker on id to avoid shuffling when x is equal
const sortByTimeThenId = (a: Anchor, b: Anchor) =>
  a.x === b.x ? a.id.localeCompare(b.id) : a.x - b.x;

// Helper function to calculate straight line angle between two points
const calculateStraightLineAngle = (from: Anchor, to: Anchor): number => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return dx !== 0 ? Math.atan(dy / dx) : 0;
};

// Helper function to get display angle (same as rendering)
const getDisplayAngle = (
  sorted: Anchor[],
  anchor: Anchor,
  angleType: "in" | "out",
  anchorIndex: number
): number | null => {
  const isFirst = anchorIndex === 0;
  const isLast = anchorIndex === sorted.length - 1;

  if (angleType === "in") {
    if (isFirst) return null;
    if (anchor.angleIn !== null) return anchor.angleIn;
    const prevAnchor = sorted[anchorIndex - 1];
    const dx = anchor.x - prevAnchor.x;
    const dy = anchor.y - prevAnchor.y;
    return dx !== 0 ? Math.atan(dy / dx) : 0;
  } else {
    if (isLast) return null;
    if (anchor.angleOut !== null) return anchor.angleOut;
    const nextAnchor = sorted[anchorIndex + 1];
    const dx = nextAnchor.x - anchor.x;
    const dy = nextAnchor.y - anchor.y;
    return dx !== 0 ? Math.atan(dy / dx) : 0;
  }
};
// Local anchor/handle hit-testing to keep anchor-related logic within this file
function hitTestAnchors(
  anchors: Anchor[],
  x: number,
  y: number,
  dims: any,
  pixelsPerSecond: number,
  yScale: number,
  offsetX: number,
  opts?: { handleLen?: number; hitTolerance?: number }
): { kind: "anchor" | "in" | "out"; id: string } | null {
  const handleLen = opts?.handleLen ?? 40;
  const hitTolerance = opts?.hitTolerance ?? 8;
  if (!anchors || anchors.length === 0) return null;
  // Use the same ordering as rendering to determine start/end (handle visibility)
  const sorted = [...anchors].sort(sortByTimeThenId);

  let hit: null | { kind: "anchor" | "in" | "out"; id: string } = null;
  anchors.forEach((a) => {
    const si = sorted.findIndex((s) => s.id === a.id);
    const isStart = si === 0;
    const isEnd = si === sorted.length - 1;

    // Determine which handles are visible based on new rules
    const showInHandle = (() => {
      if (sorted.length === 1) return false; // Single anchor: no handles at all
      if (sorted.length === 2) return isEnd; // Two anchors: only last anchor's in-handle
      return !isStart; // 3+ anchors: all except first have in-handles
    })();

    const showOutHandle = (() => {
      if (sorted.length === 1) return false; // Single anchor: no handles at all
      if (sorted.length === 2) return isStart; // Two anchors: only first anchor's out-handle
      return !isEnd; // 3+ anchors: all except last have out-handles
    })();

    const ax = dims.plotLeft + a.x * pixelsPerSecond + offsetX;
    const ay = dims.plotCenterY - a.y * yScale;
    const distA = Math.hypot(x - ax, y - ay);
    if (distA <= hitTolerance) {
      hit = { kind: "anchor", id: a.id };
      return;
    }

    if (showInHandle) {
      const displayAngle = getDisplayAngle(sorted, a, "in", si);
      if (displayAngle !== null) {
        const inX = ax - handleLen * Math.cos(displayAngle);
        const inY = ay + handleLen * Math.sin(displayAngle);
        const distIn = Math.hypot(x - inX, y - inY);
        if (!hit && distIn <= hitTolerance) hit = { kind: "in", id: a.id };
      }
    }

    if (showOutHandle) {
      const displayAngle = getDisplayAngle(sorted, a, "out", si);
      if (displayAngle !== null) {
        const outX = ax + handleLen * Math.cos(displayAngle);
        const outY = ay - handleLen * Math.sin(displayAngle);
        const distOut = Math.hypot(x - outX, y - outY);
        if (!hit && distOut <= hitTolerance) hit = { kind: "out", id: a.id };
      }
    }
  });
  return hit;
}

export default function BezierCurveSVG({
  data,
  setData,
  anchors,
  setAnchors,
  magnitude,
  duration,
}: {
  data: number[];
  setData: React.Dispatch<React.SetStateAction<number[]>>;
  anchors: Anchor[];
  setAnchors: React.Dispatch<React.SetStateAction<Anchor[]>>;
  magnitude: number;
  duration: number;
}) {
  const svgRef = useRef<HTMLDivElement>(null);
  const makeId = useIdFactory();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [xScale, setXScale] = useState(1);
  const [linearSlider, setLinearSlider] = useState(50);
  const samples = Math.max(2, Math.round(duration * FREQUENCY));
  const [hitState, setHitState] = useState<null | {
    kind: "anchor" | "in" | "out";
    id: string;
  }>(null);

  // Regenerate curve from anchors whenever anchors or duration change
  useEffect(() => {
    // Handle special cases based on anchor count
    if (anchors.length === 0) {
      // No anchors: straight line at value 0
      const totalSamples = Math.max(2, Math.round(duration * FREQUENCY));
      const out = new Array(totalSamples).fill(0);
      setData(out);
      return;
    }

    if (anchors.length === 1) {
      // One anchor: straight line at the anchor's y-value
      const anchor = anchors[0];
      const totalSamples = Math.max(2, Math.round(duration * FREQUENCY));
      const out = new Array(totalSamples).fill(anchor.y);
      setData(out);
      return;
    }

    // Two or more anchors: generate bezier curve
    // Sort with stable tie-breaker and strip ids for sampling
    const sortedWithId = [...anchors].sort(sortByTimeThenId);
    let sorted: Anchor[] = sortedWithId.map(
      ({ id, x, y, angleIn, angleOut }) => ({
        id,
        x,
        y,
        angleIn,
        angleOut,
      })
    );

    // Resolve null angles to straight line angles
    for (let i = 0; i < sorted.length; i++) {
      const anchor = sorted[i];
      const isFirst = i === 0;
      const isLast = i === sorted.length - 1;

      // First anchor: angleIn should always be null
      if (isFirst) {
        anchor.angleIn = null;
      }

      // Last anchor: angleOut should always be null
      if (isLast) {
        anchor.angleOut = null;
      }

      // Calculate straight line angles for null values
      if (anchor.angleIn === null && !isFirst) {
        const prevAnchor = sorted[i - 1];
        anchor.angleIn = calculateStraightLineAngle(prevAnchor, anchor);
      }

      if (anchor.angleOut === null && !isLast) {
        const nextAnchor = sorted[i + 1];
        anchor.angleOut = calculateStraightLineAngle(anchor, nextAnchor);
      }
    }

    // Ensure pre-first line exists but isn't shaped by first anchor's handles:
    // - Force the first real anchor's in-handle to 0
    // - If we inject a synthetic x=0 anchor, give it angleOut=0
    let firstIndex = 0;
    if (sorted[0].x > 0) {
      const firstReal = sorted[0];
      sorted.unshift({
        id: makeId(),
        x: 0,
        y: firstReal.y,
        angleIn: null,
        angleOut: 0,
      });
      firstIndex = 1;
    }
    // Force first real anchor's in-handle to zero
    sorted[firstIndex] = { ...sorted[firstIndex], angleIn: 0 } as Anchor;
    const last = sorted[sorted.length - 1];
    // Now sample from 0 to full duration instead of stopping at last anchor
    const totalSamples = Math.max(2, Math.round(duration * FREQUENCY));
    const out: number[] = new Array(totalSamples);
    const slopeOut = (a: Anchor) => clamp(Math.tan(a.angleOut ?? 0), -5, 5);
    const slopeIn = (a: Anchor) => clamp(Math.tan(a.angleIn ?? 0), -5, 5);
    for (let i = 0; i < totalSamples; i++) {
      const t = (i / (totalSamples - 1)) * duration; // Sample across full duration

      // Check if we're beyond the last anchor
      if (t > last.x) {
        // Extend horizontally at the last anchor's y-value
        out[i] = last.y;
        continue;
      }
      let k = 0;
      while (
        k < sorted.length - 1 &&
        !(t >= sorted[k].x && t <= sorted[k + 1].x)
      )
        k++;
      if (k >= sorted.length - 1) {
        out[i] = sorted[sorted.length - 1].y;
        continue;
      }
      const A = sorted[k];
      const B = sorted[k + 1];
      const y = sampleHermiteSegment(
        A.x,
        A.y,
        slopeOut(A),
        B.x,
        B.y,
        slopeIn(B),
        t
      );
      out[i] = clamp(y, -1, 1);
    }
    setData(out);
  }, [anchors, duration]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear existing SVG
    svgRef.current.innerHTML = "";

    // Create new SVG with svg.js v2.x API
    const draw = SVG(svgRef.current).size(
      EDITOR_CANVAS_WIDTH,
      EDITOR_CANVAS_HEIGHT
    );
    const renderer = new SVGRenderer(draw);

    // Axis magnitude (guard against 0 to avoid div-by-zero)
    const maxMagnitude = Math.max(1, magnitude);
    const dims = computePlotDimensions(
      EDITOR_CANVAS_WIDTH,
      EDITOR_CANVAS_HEIGHT
    );
    const pixelsPerSecond = dims.plotWidth / duration;

    // Shared grid/axes drawing
    drawPlotBase(renderer, {
      width: EDITOR_CANVAS_WIDTH,
      height: EDITOR_CANVAS_HEIGHT,
      magnitude: maxMagnitude,
      pixelsPerSecond,
      offsetX,
    });
    const { plotLeft, plotTop, plotWidth, plotHeight, plotCenterY } = dims;
    const plotRight = plotLeft + plotWidth;
    const yScale = plotHeight / 2;

    // ===== CURVE =====
    if (data && data.length >= 2) {
      drawDatasetsCurves(
        renderer,
        [
          {
            name: "curve",
            data: data,
            color: "#ff4d4f",
            magnitude: magnitude,
          },
        ],
        {
          dims,
          offsetX,
          axisMagnitude: maxMagnitude,
          frequency: FREQUENCY,
          stepX: (plotWidth / data.length) * xScale,
        }
      );
    }

    // ===== EDITOR OVERLAY (always) =====
    const handleRadius = 5;
    const handleLen = 40; // px
    const anchorFill = "#ff7f0e";
    const handleColor = "#ffbb78";

    // Draw anchors and handles
    const sorted = [...anchors].sort(sortByTimeThenId);

    // Helper function to calculate display angle (including straight line angles for null values)
    const getDisplayAngle = (
      anchor: Anchor,
      angleType: "in" | "out",
      anchorIndex: number
    ): number | null => {
      const isFirst = anchorIndex === 0;
      const isLast = anchorIndex === sorted.length - 1;

      let angle = 0;
      if (angleType === "in") {
        if (isFirst) return null; // First anchor never has in-handle
        if (anchor.angleIn !== null) return anchor.angleIn;
        // Calculate straight line angle to previous anchor
        const prevAnchor = sorted[anchorIndex - 1];
        const dx = anchor.x - prevAnchor.x;
        const dy = anchor.y - prevAnchor.y;
        angle = dx !== 0 ? Math.atan(dy / dx) : 0;
      } else {
        if (isLast) return null; // Last anchor never has out-handle
        if (anchor.angleOut !== null) return anchor.angleOut;
        // Calculate straight line angle to next anchor
        const nextAnchor = sorted[anchorIndex + 1];
        const dx = nextAnchor.x - anchor.x;
        const dy = nextAnchor.y - anchor.y;
        angle = dx !== 0 ? Math.atan(dy / dx) : 0;
      }
      return angle;
    };

    sorted.forEach((a, idx) => {
      const ax = plotLeft + a.x * pixelsPerSecond + offsetX;
      const ay = plotCenterY - a.y * yScale;
      const isStart = idx === 0;
      const isEnd = idx === sorted.length - 1;

      // Determine which handles to show based on anchor count and position
      const showInHandle = (() => {
        if (sorted.length === 1) return false; // Single anchor: no handles at all
        if (sorted.length === 2) return isEnd; // Two anchors: only last anchor's in-handle
        return !isStart; // 3+ anchors: all except first have in-handles
      })();

      const showOutHandle = (() => {
        if (sorted.length === 1) return false; // Single anchor: no handles at all
        if (sorted.length === 2) return isStart; // Two anchors: only first anchor's out-handle
        return !isEnd; // 3+ anchors: all except last have out-handles
      })();

      // In-handle endpoint (to the left)
      if (showInHandle) {
        const displayAngle = getDisplayAngle(a, "in", idx);
        if (displayAngle !== null) {
          const inX = ax - handleLen * Math.cos(displayAngle);
          const inY = ay + handleLen * Math.sin(displayAngle);
          const isNullAngle = a.angleIn === null;
          const lineColor = isNullAngle ? "#ccc" : handleColor;
          const fillColor = isNullAngle ? "#ddd" : handleColor;
          const strokeColor = isNullAngle ? "#999" : "#b37c4d";

          draw.line(ax, ay, inX, inY).stroke({
            color: lineColor,
            width: 1,
            dasharray: isNullAngle ? "4,4" : "2,2",
          });
          draw
            .circle(handleRadius * 2)
            .move(inX - handleRadius, inY - handleRadius)
            .fill(fillColor)
            .stroke({ color: strokeColor, width: 1 });
        }
      }

      // Out-handle endpoint (to the right)
      if (showOutHandle) {
        const displayAngle = getDisplayAngle(a, "out", idx);
        if (displayAngle !== null) {
          const outX = ax + handleLen * Math.cos(displayAngle);
          const outY = ay - handleLen * Math.sin(displayAngle);
          const isNullAngle = a.angleOut === null;
          const lineColor = isNullAngle ? "#ccc" : handleColor;
          const fillColor = isNullAngle ? "#ddd" : handleColor;
          const strokeColor = isNullAngle ? "#999" : "#b37c4d";

          draw.line(ax, ay, outX, outY).stroke({
            color: lineColor,
            width: 1,
            dasharray: isNullAngle ? "4,4" : "2,2",
          });
          draw
            .circle(handleRadius * 2)
            .move(outX - handleRadius, outY - handleRadius)
            .fill(fillColor)
            .stroke({ color: strokeColor, width: 1 });
        }
      }

      // Anchor point
      draw
        .circle(handleRadius * 2 + 2)
        .move(ax - handleRadius - 1, ay - handleRadius - 1)
        .fill(anchorFill)
        .stroke({ color: "#b35a1e", width: 2 });
    });

    // No legend in single-curve editor

    return () => {
      if (svgRef.current) {
        svgRef.current.innerHTML = "";
      }
    };
  }, [data, anchors, magnitude, duration, offsetX, samples, xScale]);

  // ===== MOUSE INTERACTION HANDLERS (for panning) =====
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // Prevent text selection and default drag behavior
    e.preventDefault();
    // Hit test anchors/handles using the actual SVG element bounds
    const container = e.currentTarget as HTMLDivElement;
    const svgEl = container.querySelector("svg") as SVGElement | null;
    const rect = (svgEl || container).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Recompute plotting geometry
    const dims = computePlotDimensions(
      EDITOR_CANVAS_WIDTH,
      EDITOR_CANVAS_HEIGHT
    );
    const plotLeft = dims.plotLeft;
    const plotRight = dims.plotRight;
    const plotCenterY = dims.plotCenterY;
    const yScale = dims.plotHeight / 2;
    const pixelsPerSecond = dims.plotWidth / duration;
    const insidePlot = isInsidePlot(dims, x, y);

    const hit = hitTestAnchors(
      anchors,
      x,
      y,
      dims,
      pixelsPerSecond,
      yScale,
      offsetX
    );

    if (hit) {
      setHitState(hit);
      setIsDragging(true);
      setDragStartX(e.clientX);
      return;
    }

    // Not on anchor/handle: check if click is near the curve; add a point there, else pan
    let added = false;
    if (insidePlot) {
      // For anchor creation, we need to handle different cases based on current anchor count
      const sortedAnch = [...anchors].sort(sortByTimeThenId);
      const xRaw = (x - plotLeft - offsetX) / pixelsPerSecond;
      const xClamped = clamp(xRaw, 0, duration);
      // Remove snapping - allow continuous float values

      let yAt: number;
      let shouldCreateAnchor = false;

      if (anchors.length === 0) {
        // No anchors: click anywhere to create first anchor
        yAt = clamp((plotCenterY - y) / yScale, -1, 1);
        shouldCreateAnchor = true;
      } else if (anchors.length === 1) {
        // One anchor: click anywhere to create second anchor
        yAt = clamp((plotCenterY - y) / yScale, -1, 1);
        shouldCreateAnchor = true;
      } else if (data && data.length >= 2) {
        // Two or more anchors: check if click is near the curve
        const sortedAnch = [...anchors].sort(sortByTimeThenId);
        const lastAnchorX =
          sortedAnch.length > 0 ? sortedAnch[sortedAnch.length - 1].x : 0;

        if (xClamped <= lastAnchorX) {
          // Click is within the bezier curve region
          // Convert time to curve index space for y-value lookup
          const N = data.length;
          const iFloat = (xClamped / duration) * (N - 1);
          const i0 = Math.max(0, Math.min(N - 1, Math.floor(iFloat)));
          const i1 = Math.max(0, Math.min(N - 1, i0 + 1));
          const frac = Math.max(0, Math.min(1, iFloat - i0));
          yAt = clamp(data[i0] + (data[i1] - data[i0]) * frac, -1, 1);
        } else {
          // Click is in the horizontal extension region
          yAt = sortedAnch[sortedAnch.length - 1].y;
        }

        // Confirm the click is near the curve visually
        const yOn = plotCenterY - yAt * yScale;
        const curveTolerance = 8; // px from curve
        if (Math.abs(y - yOn) <= curveTolerance) {
          shouldCreateAnchor = true;
        }
      }

      if (shouldCreateAnchor) {
        const newId = makeId();
        setAnchors((prev) => {
          const next = [
            ...prev,
            { id: newId, x: xClamped, y: yAt, angleIn: 0, angleOut: 0 },
          ];
          next.sort(sortByTimeThenId);
          return next;
        });
        setHitState({ kind: "anchor", id: newId });
        setIsDragging(true);
        setDragStartX(e.clientX);
        added = true;
      }
    }

    if (insidePlot && !added) {
      // Start panning on empty region
      setIsDragging(true);
      setDragStartX(e.clientX);
    }
    return;
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    // Prevent text selection while dragging
    e.preventDefault();
    if (hitState) {
      const container = e.currentTarget as HTMLDivElement;
      const svgEl = container.querySelector("svg") as SVGElement | null;
      const rect = (svgEl || container).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dims = computePlotDimensions(
        EDITOR_CANVAS_WIDTH,
        EDITOR_CANVAS_HEIGHT
      );
      const plotLeft = dims.plotLeft;
      const plotCenterY = dims.plotCenterY;
      const pixelsPerSecond = dims.plotWidth / duration;
      const yScale = dims.plotHeight / 2;

      const shift = e.shiftKey;
      setAnchors((prev) => {
        const idx = prev.findIndex((p) => p.id === hitState.id);
        if (idx < 0) return prev;
        const next = [...prev];
        const a = { ...next[idx] };
        if (hitState.kind === "anchor") {
          const t = clamp(
            (x - plotLeft - offsetX) / pixelsPerSecond,
            0,
            duration
          );
          const v = clamp((plotCenterY - y) / yScale, -1, 1);
          a.x = t;
          a.y = v;
          next[idx] = a;
          next.sort(sortByTimeThenId);
          // No need to recalculate angles - display logic handles this automatically
        } else if (hitState.kind === "in") {
          const ax = plotLeft + a.x * pixelsPerSecond + offsetX;
          const ay = plotCenterY - a.y * yScale;
          if (shift) {
            // Independent edit of in-handle only
            const dx = ax - x;
            const dy = y - ay;
            a.angleIn = Math.atan2(dy, dx);
          } else {
            // Locked: move both handles in line with this drag
            const dx = ax - x;
            const dy = y - ay;
            const angle = Math.atan2(dy, dx);
            a.angleIn = angle;
            a.angleOut = angle;
          }
          next[idx] = a;
        } else if (hitState.kind === "out") {
          const ax = plotLeft + a.x * pixelsPerSecond + offsetX;
          const ay = plotCenterY - a.y * yScale;
          if (shift) {
            // Independent edit of out-handle only
            const dx = x - ax;
            const dy = ay - y;
            a.angleOut = Math.atan2(dy, dx);
          } else {
            // Locked: move both handles in line with this drag
            const dx = x - ax;
            const dy = ay - y;
            const angle = Math.atan2(dy, dx);
            a.angleOut = angle;
            a.angleIn = angle;
          }
          next[idx] = a;
        }
        return next;
      });
      return;
    }
    // Default panning
    const dx = e.clientX - dragStartX;
    setDragStartX(e.clientX);
    // Compute panning bounds based on plot width
    const dimsPan = computePlotDimensions(
      EDITOR_CANVAS_WIDTH,
      EDITOR_CANVAS_HEIGHT
    );
    const totalWidth = duration * (dimsPan.plotWidth / duration);
    const minOffset = Math.min(0, dimsPan.plotWidth - totalWidth);
    const maxOffset = 0;
    setOffsetX((prev) => Math.max(minOffset, Math.min(prev + dx, maxOffset)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setHitState(null);
  };
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHitState(null);
  };

  // Right-click: delete anchor or snap handle to straight line toward neighbor
  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    // Prevent the browser context menu
    e.preventDefault();

    const container = e.currentTarget as HTMLDivElement;
    const svgEl = container.querySelector("svg") as SVGElement | null;
    const rect = (svgEl || container).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Plot geometry (mirror what's used elsewhere)
    const dimsCtxt = computePlotDimensions(
      EDITOR_CANVAS_WIDTH,
      EDITOR_CANVAS_HEIGHT
    );
    const insidePlot = isInsidePlot(dimsCtxt, x, y);
    const pixelsPerSecond = dimsCtxt.plotWidth / duration;
    const yScale = dimsCtxt.plotHeight / 2;

    // Hit test similar to mousedown
    const hit = hitTestAnchors(
      anchors,
      x,
      y,
      dimsCtxt,
      pixelsPerSecond,
      yScale,
      offsetX
    );

    if (!hit) return;
    const picked = hit as { kind: "anchor" | "in" | "out"; id: string };

    if (picked.kind === "anchor") {
      // Delete anchor (allow deleting any anchor, but keep behavior consistent)
      setAnchors((prev) => {
        const idx = prev.findIndex((a) => a.id === picked.id);
        if (idx < 0) return prev;
        const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        return next;
      });
      setHitState(null);
      setIsDragging(false);
      return;
    }

    // Snap handle to straight line toward neighbor
    setAnchors((prev) => {
      const next = [...prev];
      const idx = next.findIndex((a) => a.id === picked.id);
      if (idx < 0) return prev;
      const cur = next[idx];
      // Determine neighbors by time ordering
      const sorted = [...next].sort(sortByTimeThenId);
      const si = sorted.findIndex((s) => s.id === cur.id);
      if (si === -1) return next;
      if (picked.kind === "in" && si > 0) {
        // Set to null to make it a straight line
        cur.angleIn = null;
      } else if (picked.kind === "out" && si < sorted.length - 1) {
        // Set to null to make it a straight line
        cur.angleOut = null;
      }
      next[idx] = { ...cur };
      return next;
    });
  };

  // While dragging, disable user-select globally to avoid highlighting labels
  useEffect(() => {
    if (isDragging) {
      const prev = document.body.style.userSelect;
      document.body.style.userSelect = "none";
      return () => {
        document.body.style.userSelect = prev;
      };
    }
  }, [isDragging]);

  const resetAnchors = () => {
    setXScale(1);
    setLinearSlider(50);
    setAnchors([]);
  };

  // Display info for the currently operated control point
  const controlInfo: string | null = (() => {
    if (!isDragging || !hitState) return null;
    const a = anchors.find((p) => p.id === hitState.id);
    if (!a) return null;
    if (hitState.kind === "anchor") {
      return `x=${a.x.toFixed(3)}s, y=${a.y.toFixed(3)}`;
    }
    if (hitState.kind === "in") {
      if (a.angleIn === null) return "straight line";
      const deg = ((a.angleIn * 180) / Math.PI).toFixed(1);
      return `angle=${deg}°`;
    }
    if (a.angleOut === null) return "straight line";
    const deg = ((a.angleOut * 180) / Math.PI).toFixed(1);
    return `angle=${deg}°`;
  })();

  return (
    <div className="graph-container">
      <h2>Editor Graph</h2>
      {/* X-Scale control slider (internal) */}
      <div className="controls" style={{ marginBottom: 8 }}>
        <label>
          X Scale: <span>{xScale.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={linearSlider}
          step="1"
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setLinearSlider(val);
            const midpoint = 50;
            const t =
              val < midpoint
                ? val / midpoint
                : (val - midpoint) / (100 - midpoint);
            const newScale =
              val < midpoint ? 0.1 * Math.pow(10, t) : 1 * Math.pow(10, t);
            setXScale(newScale);
          }}
        />
        <button onClick={resetAnchors}>Reset</button>
      </div>
      {/* Active control point stats */}
      <div
        style={{
          fontSize: 12,
          color: "#333",
          marginBottom: 6,
          minHeight: 18,
        }}
      >
        {controlInfo ?? "\u00A0"}
      </div>
      <div
        ref={svgRef}
        style={{
          userSelect: "none",
          cursor: isDragging ? "grabbing" : "crosshair",
          backgroundColor: "#fff",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}

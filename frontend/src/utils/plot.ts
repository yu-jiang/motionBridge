import { MotionViewDataset } from "../shared/motion.type";
import {
  chooseNiceForceTick,
  chooseNiceTimeTick,
  prepareForceTicks,
} from "./helper";

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 300;
export const EDITOR_CANVAS_WIDTH = 1200;
export const EDITOR_CANVAS_HEIGHT = 600;

export type PlotDimensions = {
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;
  plotCenterY: number;
  plotRight: number;
  plotBottom: number;
};

export type LineStyle = {
  color?: string;
  width?: number;
  dasharray?: string;
};

export type RectStyle = {
  fill?: string;
  stroke?: string;
  width?: number;
};

export type PolylineStyle = {
  color?: string;
  width?: number;
};

export type TextStyle = {
  color?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  baseline?: "top" | "middle" | "bottom";
  rotate?: number; // degrees
};

export interface PlotRenderer {
  rect(x: number, y: number, w: number, h: number, style: RectStyle): void;
  line(x1: number, y1: number, x2: number, y2: number, style: LineStyle): void;
  text(text: string, x: number, y: number, style: TextStyle): void;
  polyline(points: Array<[number, number]>, style: PolylineStyle): void;
}

export type PlotGeometry = {
  dims: PlotDimensions;
  stepX: number;
  pixelsPerSecond: number;
  yScale: number;
};

export function computePlotDimensions(
  width: number,
  height: number
): PlotDimensions {
  const marginLeft = 60;
  const marginRight = 20;
  const marginTop = 30;
  const marginBottom = 50;

  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;
  const plotLeft = marginLeft;
  const plotTop = marginTop;
  const plotRight = plotLeft + plotWidth;
  const plotBottom = plotTop + plotHeight;
  const plotCenterY = plotTop + plotHeight / 2;

  return {
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    plotCenterY,
    plotRight,
    plotBottom,
  };
}

export function drawPlotBase(
  r: PlotRenderer,
  opts: {
    width?: number;
    height?: number;
    magnitude: number;
    pixelsPerSecond: number;
    offsetX: number;
  }
) {
  const width = opts.width ?? CANVAS_WIDTH;
  const height = opts.height ?? CANVAS_HEIGHT;
  const dims = computePlotDimensions(width, height);

  const maxMagnitude = Math.max(1, opts.magnitude);

  // Background
  r.rect(dims.plotLeft, dims.plotTop, dims.plotWidth, dims.plotHeight, {
    fill: "#fff",
  });

  // Grid - horizontal (force)
  const pixelsPerNewton = dims.plotHeight / (2 * maxMagnitude);
  const forceTick = chooseNiceForceTick(pixelsPerNewton);
  const yTicks = prepareForceTicks(maxMagnitude, forceTick);
  yTicks.forEach((yVal) => {
    const y = dims.plotCenterY - (yVal / maxMagnitude) * (dims.plotHeight / 2);
    r.line(dims.plotLeft, y, dims.plotRight, y, { color: "#555", width: 0.5 });
  });

  // Grid - vertical (time)
  const tickSec = chooseNiceTimeTick(opts.pixelsPerSecond);
  const startSec = Math.max(0, -opts.offsetX / opts.pixelsPerSecond);
  const endSec = (dims.plotWidth - opts.offsetX) / opts.pixelsPerSecond;
  for (
    let t = Math.floor(startSec / tickSec) * tickSec;
    t <= endSec;
    t += tickSec
  ) {
    const x = t * opts.pixelsPerSecond + opts.offsetX + dims.plotLeft;
    if (x >= dims.plotLeft && x <= dims.plotRight) {
      r.line(x, dims.plotTop, x, dims.plotBottom, {
        color: "#555",
        width: 0.5,
      });
    }
  }

  // Axes
  r.line(dims.plotLeft, dims.plotCenterY, dims.plotRight, dims.plotCenterY, {
    color: "#999",
    width: 1,
  });
  r.line(dims.plotLeft, dims.plotTop, dims.plotLeft, dims.plotBottom, {
    color: "#999",
    width: 1,
  });

  // Y-axis ticks and labels
  yTicks.forEach((yVal) => {
    const y = dims.plotCenterY - (yVal / maxMagnitude) * (dims.plotHeight / 2);
    r.line(dims.plotLeft - 4, y, dims.plotLeft, y, { color: "#999", width: 1 });
    r.text(yVal.toString(), dims.plotLeft - 8, y - 6, {
      size: 11,
      anchor: "end",
      color: "#555",
    });
  });

  // X-axis ticks and labels
  for (
    let t = Math.floor(startSec / tickSec) * tickSec;
    t <= endSec;
    t += tickSec
  ) {
    const x = t * opts.pixelsPerSecond + opts.offsetX + dims.plotLeft;
    if (x >= dims.plotLeft && x <= dims.plotRight) {
      r.line(x, dims.plotBottom, x, dims.plotBottom + 4, {
        color: "#999",
        width: 1,
      });
      r.text(t.toFixed(1), x - 10, dims.plotBottom + 8, {
        size: 10,
        anchor: "middle",
        color: "#555",
      });
    }
  }

  // Axis labels
  r.text("Force (N)", 15, height / 2, {
    size: 12,
    anchor: "middle",
    baseline: "middle",
    color: "#333",
    rotate: -90,
  });
  r.text("Time (s)", width / 2 - 20, height - 15, {
    size: 12,
    anchor: "middle",
    color: "#333",
  });

  return { dims, pixelsPerSecond: opts.pixelsPerSecond };
}

// SVG.js renderer
export class SVGRenderer implements PlotRenderer {
  private draw: any;
  constructor(draw: any) {
    this.draw = draw;
  }
  rect(x: number, y: number, w: number, h: number, style: RectStyle): void {
    const r = this.draw.rect(w, h).move(x, y);
    if (style.fill) r.fill(style.fill);
    if (style.stroke)
      r.stroke({ color: style.stroke, width: style.width || 1 });
    else r.stroke("none");
  }
  line(x1: number, y1: number, x2: number, y2: number, style: LineStyle): void {
    const l = this.draw.line(x1, y1, x2, y2);
    l.stroke({
      color: style.color || "#000",
      width: style.width || 1,
      dasharray: style.dasharray,
    });
  }
  text(text: string, x: number, y: number, style: TextStyle): void {
    const t = this.draw.text(text).move(x, y);
    t.font({ size: style.size || 12, anchor: style.anchor || "start" }).fill(
      style.color || "#000"
    );
    if (style.rotate !== undefined) {
      t.rotate(style.rotate, x, y);
    }
  }
  polyline(points: Array<[number, number]>, style: PolylineStyle): void {
    if (!points.length) return;
    const str = points.map(([x, y]) => `${x},${y}`).join(" ");
    const p = this.draw.polyline(str);
    p.fill("none").stroke({
      color: style.color || "#000",
      width: style.width || 2,
    });
  }
}

// Canvas renderer
export class CanvasRenderer implements PlotRenderer {
  private ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  rect(x: number, y: number, w: number, h: number, style: RectStyle): void {
    if (style.fill) {
      this.ctx.fillStyle = style.fill;
      this.ctx.fillRect(x, y, w, h);
    }
    if (style.stroke) {
      this.ctx.strokeStyle = style.stroke;
      this.ctx.lineWidth = style.width || 1;
      this.ctx.strokeRect(x, y, w, h);
    }
  }
  line(x1: number, y1: number, x2: number, y2: number, style: LineStyle): void {
    this.ctx.strokeStyle = style.color || "#000";
    this.ctx.lineWidth = style.width || 1;
    this.ctx.setLineDash(
      style.dasharray
        ? style.dasharray.split(",").map((s) => parseFloat(s))
        : []
    );
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
  text(text: string, x: number, y: number, style: TextStyle): void {
    this.ctx.fillStyle = style.color || "#000";
    this.ctx.font = `${style.size || 12}px sans-serif`;
    // Text anchor mapping: start|middle|end
    const ta = style.anchor || "start";
    const align = ta === "middle" ? "center" : ta === "end" ? "right" : "left";
    // Baseline mapping
    const bl = style.baseline || "top";
    const base =
      bl === "middle" ? "middle" : bl === "bottom" ? "bottom" : "top";
    if (style.rotate !== undefined) {
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate((style.rotate * Math.PI) / 180);
      this.ctx.textAlign = align;
      this.ctx.textBaseline = base;
      this.ctx.fillText(text, 0, 0);
      this.ctx.restore();
    } else {
      this.ctx.textAlign = align;
      this.ctx.textBaseline = base;
      this.ctx.fillText(text, x, y);
    }
  }
  polyline(points: Array<[number, number]>, style: PolylineStyle): void {
    if (!points.length) return;
    this.ctx.strokeStyle = style.color || "#000";
    this.ctx.lineWidth = style.width || 2;
    this.ctx.lineJoin = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1]);
    }
    this.ctx.stroke();
  }
}

// Convenience: compute geometry pieces used throughout interactions
export function computePlotGeometry(args: {
  samples: number;
  xScale: number;
  offsetX: number;
  width?: number;
  height?: number;
}): PlotGeometry {
  const width = args.width ?? CANVAS_WIDTH;
  const height = args.height ?? CANVAS_HEIGHT;
  const dims = computePlotDimensions(width, height);
  const stepX = (dims.plotWidth / Math.max(1, args.samples)) * args.xScale;
  const pixelsPerSecond = stepX / (1 / 1); // callers usually scale by FREQUENCY externally
  // Note: for callers that use FREQUENCY, compute pixelsPerSecond as stepX / (1/FREQUENCY)
  const yScale = dims.plotHeight / 2;
  return { dims, stepX, pixelsPerSecond, yScale };
}

export function isInsidePlot(dims: PlotDimensions, x: number, y: number) {
  return (
    x >= dims.plotLeft &&
    x <= dims.plotRight &&
    y >= dims.plotTop &&
    y <= dims.plotBottom
  );
}

export function xToTime(x: number, geom: PlotGeometry, offsetX: number) {
  return (x - geom.dims.plotLeft - offsetX) / geom.pixelsPerSecond;
}

export function drawDatasetsCurves(
  r: PlotRenderer,
  datasets: MotionViewDataset[],
  opts: {
    dims: PlotDimensions;
    stepX: number;
    offsetX: number;
    axisMagnitude: number; // max magnitude used to normalize Y across datasets
    frequency: number; // Hz
  }
) {
  const { dims, stepX, offsetX, axisMagnitude, frequency } = opts;
  const plotLeft = dims.plotLeft;
  const plotRight = dims.plotRight;
  const centerY = dims.plotCenterY;
  const yScale = dims.plotHeight / 2;

  datasets.forEach((dataset) => {
    const { data, color, offset = 0, magnitude = axisMagnitude } = dataset;
    if (!data || data.length === 0) return;

    const offsetSamples = Math.round(offset * frequency);
    const points: Array<[number, number]> = [];
    const axisMag = Math.max(1, axisMagnitude);

    for (let i = 0; i < data.length; i++) {
      const x = (i + offsetSamples) * stepX + offsetX + plotLeft;
      const scaledValue = data[i] * magnitude;
      const normalizedValue = scaledValue / axisMag;
      const y = centerY - normalizedValue * yScale;
      if (x >= plotLeft - stepX && x <= plotRight + stepX) {
        points.push([x, y]);
      }
    }
    if (points.length > 0) {
      r.polyline(points, { color, width: 2 });
    }
  });
}

// Shared legend drawing for datasets
export function drawLegend(
  r: PlotRenderer,
  datasets: MotionViewDataset[],
  opts: {
    dims: PlotDimensions;
    maxItemsPerRow?: number;
    itemWidth?: number;
    rowHeight?: number;
    padding?: number;
    backgroundFill?: string;
    borderColor?: string;
    fontSize?: number;
  }
) {
  if (!datasets || datasets.length <= 1) return;
  const {
    dims,
    maxItemsPerRow = 4,
    itemWidth = 140,
    rowHeight = 16,
    padding = 5,
    backgroundFill = "rgba(255, 255, 255, 0.95)",
    borderColor = "#ccc",
    fontSize = 9,
  } = opts;

  const rows = Math.ceil(datasets.length / maxItemsPerRow);
  const totalHeight = rows * rowHeight + padding * 2;
  const totalWidth =
    Math.min(datasets.length, maxItemsPerRow) * itemWidth + padding * 2;

  // Center above plotting area
  const legendX = dims.plotLeft + (dims.plotWidth - totalWidth) / 2;
  const legendY = dims.plotTop - totalHeight - 5;

  // Background and border
  r.rect(legendX, legendY, totalWidth, totalHeight, {
    fill: backgroundFill,
    stroke: borderColor,
    width: 1,
  });

  // Render items
  datasets.forEach((dataset, index) => {
    const row = Math.floor(index / maxItemsPerRow);
    const col = index % maxItemsPerRow;
    const itemX = legendX + col * itemWidth + padding;
    const itemY = legendY + row * rowHeight + padding + rowHeight / 2;

    // Color line sample
    r.line(itemX, itemY, itemX + 15, itemY, { color: dataset.color, width: 2 });

    // Text label (simple truncation by character count)
    const maxChars = Math.max(3, Math.floor((itemWidth - 25) / 6));
    let label = dataset.name;
    if (label.length > maxChars) label = label.slice(0, maxChars - 3) + "...";
    r.text(label, itemX + 20, itemY, {
      size: fontSize,
      color: "#333",
      anchor: "start",
      baseline: "middle",
    });
  });
}

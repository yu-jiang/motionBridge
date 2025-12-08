import {
  Motion,
  MotionShapeKey,
  motionShapeKeys,
  MotionViewDataset,
} from "../shared/motion.type";

// ===== TIME AXIS TICK SPACING ALGORITHM =====
export const chooseNiceTimeTick = (pixelsPerSecond: number): number => {
  const spacing = 60;
  const options = [0.1, 0.2, 0.5, 1, 2, 5, 10];
  for (let opt of options) {
    if (opt * pixelsPerSecond >= spacing) return opt;
  }
  return options[options.length - 1];
};

export const chooseNiceForceTick = (pixelsPerNewton: number): number => {
  const spacing = 30;
  const options = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
  for (let opt of options) {
    if (opt * pixelsPerNewton >= spacing) return opt;
  }
  return options[options.length - 1];
};

export const prepareForceTicks = (
  magnitude: number,
  tick: number
): number[] => {
  const ticks: number[] = [];
  const maxTick = Math.floor(magnitude / tick) * tick;
  for (let i = -maxTick; i <= maxTick; i += tick) {
    ticks.push(i);
  }
  return ticks;
};

// Prepare datasets for individual shape graphs
export const prepareDatasets = (
  motions: Motion[],
  shapeKey: MotionShapeKey
) => {
  const datasets: MotionViewDataset[] = [];

  motions.forEach((motion, index) => {
    const shapeData = motion[shapeKey];
    if (motion && shapeData) {
      datasets.push({
        name: `Motion ${index + 1}`,
        data: shapeData,
        color: motion.color || `hsl(${index * 60}, 70%, 50%)`,
        magnitude: motion.magnitude,
        offset: motion.offset || 0,
      });
    }
  });

  return datasets;
};

// Prepare datasets for combined graph (all shapes)
export const prepareCombinedDatasets = (motions: Motion[]) => {
  const datasets: MotionViewDataset[] = [];

  motions.forEach((motion, motionIndex) => {
    motionShapeKeys.forEach((shapeKey, shapeIndex) => {
      const shapeData = motion[shapeKey];
      if (shapeData) {
        datasets.push({
          name: `Motion ${motionIndex + 1} ${shapeKey
            .substring(0, 2)
            .toUpperCase()}`,
          data: shapeData,
          color: `hsl(${shapeIndex * 90 + motionIndex * 30}, 70%, ${
            50 + motionIndex * 10
          }%)`,
          magnitude: motion.magnitude,
          offset: motion.offset || 0,
        });
      }
    });
  });

  return datasets;
};

// Hermite cubic interpolation for y(t) given endpoints and slopes
export function sampleHermiteSegment(
  t0: number,
  y0: number,
  m0: number, // dy/dt at t0
  t1: number,
  y1: number,
  m1: number, // dy/dt at t1
  t: number
) {
  const dt = t1 - t0;
  if (dt === 0) return y0;
  const u = Math.max(0, Math.min(1, (t - t0) / dt));
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  const h11 = u * u * u - u * u;
  return h00 * y0 + h10 * m0 * dt + h01 * y1 + h11 * m1 * dt;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Normalize any angle to the range [-π/2, π/2] without using floating modulo
export function normalizeHalfPi(angle: number) {
  const PI = Math.PI;
  // First wrap into (-PI, PI] robustly using trig identities
  let a = Math.atan2(Math.sin(angle), Math.cos(angle));
  // Then shift into [-PI/2, PI/2] by adding/subtracting PI if needed
  if (a < -PI / 2) a += PI;
  else if (a > PI / 2) a -= PI;
  return a;
}

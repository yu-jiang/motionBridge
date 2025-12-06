/**
 * Somehow I can't use z.enum or z.union in this file.
 * It will run into an unsolvable compilation error that tells you not to put any argument in z.enum or z.union.
 * So I replaced them with z.string() for now.
 */
import z from "zod";
import { NAME_REGEX, COLOR_REGEX, MAX_MAGNITUDE } from ".";

/**
 * Motion library object
 */
export type Motion = z.infer<typeof motionSchema>;
export const motionSchema = z.object({
  id: z.string().regex(NAME_REGEX).optional(),
  name: z.string().regex(NAME_REGEX),
  shortDisplayName: z.string(),
  longDisplayName: z.string(),
  color: z.string().regex(COLOR_REGEX),
  magnitude: z.number().int().min(0).max(MAX_MAGNITUDE),
  offset: z.number().optional(),
  duration: z.number().optional(),
  compositionDegree: z.number().int().optional(),
  flShape: z.array(z.number()),
  frShape: z.array(z.number()),
  rlShape: z.array(z.number()),
  rrShape: z.array(z.number()),
});

export type MotionMetadata = z.infer<typeof motionMetadataSchema>;
export const motionMetadataSchema = z.object({
  name: z.string().regex(NAME_REGEX),
  shortDisplayName: z.string(),
  longDisplayName: z.string(),
  color: z.string().regex(COLOR_REGEX),
  magnitude: z.number().int().min(0).max(MAX_MAGNITUDE),
  duration: z.number(),
  offset: z.number().optional(),
  compositionDegree: z.number().int().optional(),
});

/**
 * ===== Payloads used for generating primitive motions =====
 */
export const motionDirections = [
  "heave",
  "pitch",
  "roll",
  "front",
  "rear",
  "left",
  "right",
  "fl",
  "fr",
  "rl",
  "rr",
] as const;
export type Direction = (typeof motionDirections)[number];

export type SineMotionPayload = z.infer<typeof sineMotionSchema>;
export const sineMotionSchema = z.object({
  type: z.literal("sine"),
  name: z.string().regex(NAME_REGEX),
  parameters: z.object({
    duration: z.number().min(0),
    magnitude: z.number().int().min(0).max(MAX_MAGNITUDE),
    frequency: z.number().min(0),
    direction: z.enum(motionDirections),
    phase: z.number(),
  }),
});

export type ImpulseMotionPayload = z.infer<typeof impulseMotionSchema>;
export const impulseMotionSchema = z.object({
  type: z.literal("impulse"),
  name: z.string().regex(NAME_REGEX),
  parameters: z.object({
    duration: z.number().min(0),
    direction: z.enum(motionDirections),
  }),
});

export type RampMotionPayload = z.infer<typeof rampMotionSchema>;
export const rampMotionSchema = z.object({
  type: z.literal("ramp"),
  name: z.string().regex(NAME_REGEX),
  parameters: z.object({
    duration: z.number().min(0),
    magnitude: z.number().int().min(0).max(MAX_MAGNITUDE),
    direction: z.enum(motionDirections),
    startValue: z.number().min(-1).max(1),
    endValue: z.number().min(-1).max(1),
  }),
});

export type MinJerkMotionPayload = z.infer<typeof minJerkMotionSchema>;
export const minJerkMotionSchema = z.object({
  type: z.literal("min_jerk"),
  name: z.string().regex(NAME_REGEX),
  parameters: z.object({
    duration: z.number().min(0),
    magnitude: z.number().int().min(0).max(MAX_MAGNITUDE),
    direction: z.enum(motionDirections),
    startValue: z.number().min(-1).max(1),
    endValue: z.number().min(-1).max(1),
  }),
});

export type TwinPeakMotionPayload = z.infer<typeof twinPeakMotionSchema>;
export const twinPeakMotionSchema = z.object({
  type: z.literal("twin_peak"),
  name: z.string().regex(NAME_REGEX),
  parameters: z.object({
    duration: z.number().min(0),
    magnitude: z.number().int().min(0).max(MAX_MAGNITUDE),
    direction: z.enum(motionDirections),
    firstPeakTime: z.number().min(0),
    firstPeakValue: z.number().min(-1).max(1),
    secondPeakTime: z.number().min(0),
    secondPeakValue: z.number().min(-1).max(1),
  }),
});

export type WhiteNoiseMotionPayload = z.infer<typeof whiteNoiseMotionSchema>;
export const whiteNoiseMotionSchema = z.object({
  type: z.literal("white_noise"),
  name: z.string().regex(NAME_REGEX),
  parameters: z.object({
    duration: z.number().min(0),
    magnitude: z.number().int().min(0).max(MAX_MAGNITUDE),
    direction: z.enum(motionDirections),
    lowCutoff: z.number().min(0),
    highCutoff: z.number().min(0),
    seed: z.number().int(),
  }),
});

export const compositionOperations = ["add", "multiply", "concat"] as const;
export type CompositionOperation = (typeof compositionOperations)[number];

export type CompositeMotionPayload = z.infer<typeof compositeMotionSchema>;
export const compositeMotionSchema = z.object({
  type: z.literal("composite"),
  name: z.string().regex(NAME_REGEX),
  composition: z.object({
    operation: z.enum(compositionOperations),
    motions: z.array(
      z.object({
        motionRef: z.string().regex(NAME_REGEX),
        startTime: z.number().min(0),
        magnitudeOverride: z
          .number()
          .int()
          .min(0)
          .max(MAX_MAGNITUDE)
          .optional(),
      })
    ),
  }),
});

// Anchor for curve editing
export interface Anchor {
  id: string;
  x: number; // seconds (time)
  y: number; // normalized [-1, 1] (value)
  angleIn: number | null; // radians, null means straight line to previous anchor
  angleOut: number | null; // radians, null means straight line to next anchor
}
export const anchorSchema = z.object({
  id: z.string(), // internal id used for differentiating anchors
  x: z.number().min(0), // seconds (time)
  y: z.number().min(-1).max(1), // normalized [-1, 1] (value)
  angleIn: z.number().nullable(), // radians, null means straight line to previous anchor
  angleOut: z.number().nullable(), // radians, null means straight line to next anchor
});

export type BezierCurveMotionPayload = z.infer<typeof bezierCurveMotionSchema>;
export const bezierCurveMotionSchema = z.object({
  type: z.literal("bezier_curve"),
  name: z.string().regex(NAME_REGEX),
  parameters: z.object({
    anchors: z.array(anchorSchema).min(1),
    duration: z.number().min(0),
    magnitude: z.number().int().min(0).max(MAX_MAGNITUDE),
    direction: z.enum(motionDirections),
  }),
});

export type BakedBezierCurveMotionPayload = z.infer<
  typeof bakedbezierCurveMotionSchema
>;
export const bakedbezierCurveMotionSchema = z.object({
  type: z.literal("bezier_curve"),
  name: z.string().regex(NAME_REGEX),
  parameters: z.object({
    data: z.array(z.number()).min(2),
    duration: z.number().min(0),
    magnitude: z.number().int().min(0).max(MAX_MAGNITUDE),
    direction: z.enum(motionDirections),
  }),
});

export const motionGenTypes = [
  "sine",
  "impulse",
  "ramp",
  "min_jerk",
  "twin_peak",
  "white_noise",
  "bezier_curve",
  "composite",
] as const;
export type MotionGenType = (typeof motionGenTypes)[number];
export type MotionGenPayload = z.infer<typeof motionGenSchemas>;
export const motionGenSchemas = z.union([
  sineMotionSchema,
  impulseMotionSchema,
  rampMotionSchema,
  minJerkMotionSchema,
  twinPeakMotionSchema,
  whiteNoiseMotionSchema,
  bakedbezierCurveMotionSchema,
  bezierCurveMotionSchema,
  compositeMotionSchema,
]);

export const schemaMap = {
  sine: sineMotionSchema,
  impulse: impulseMotionSchema,
  ramp: rampMotionSchema,
  min_jerk: minJerkMotionSchema,
  twin_peak: twinPeakMotionSchema,
  white_noise: whiteNoiseMotionSchema,
  bezier_curve: bezierCurveMotionSchema,
  composite: compositeMotionSchema,
} as const;

/**
 * ===== Types for motion view components =====
 */

export const motionShapeKeys = [
  "flShape",
  "frShape",
  "rlShape",
  "rrShape",
] as const;
export type MotionShapeKey = (typeof motionShapeKeys)[number];

export interface MotionFetcherProps {
  readOnly?: boolean;
  setReadOnly?: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface MotionSelectorProps extends MotionFetcherProps {
  value: string;
  onChange: (value: string) => void;
  includesNone?: boolean;
}

export interface MotionGetterProps extends MotionFetcherProps {
  motion: Motion | null;
}

export interface MotionSetterProps extends MotionFetcherProps {
  setMotion: React.Dispatch<React.SetStateAction<Motion | null>>;
}

export interface MotionGetSetProps
  extends MotionGetterProps,
    MotionSetterProps {}

export interface MotionViewProps {
  motions: Motion[];
  readOnly?: boolean;
}

export interface MotionViewDataset {
  name: string;
  data: number[];
  color: string;
  magnitude: number;
  offset?: number;
}

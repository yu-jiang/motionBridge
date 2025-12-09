import z from "zod";
import { HAPTICS_REGEX, NAME_REGEX } from ".";

export type MotionPayload = z.infer<typeof motionPayloadSchema>;
export const motionPayloadSchema = z.object({
  motion: z.string().regex(NAME_REGEX),
  behavior: z.string(),
  scale: z.float32(),
  fallback: z.number().int().min(0),
});

export type RenamePayload = z.infer<typeof renamePayloadSchema>;
export const renamePayloadSchema = z.object({
  oldName: z.string().regex(NAME_REGEX),
  newName: z.string().regex(NAME_REGEX),
});

export type HapticsMapping = z.infer<typeof hapticsMappingSchema>;
export const hapticsMappingSchema = z.object({
  program: z.string(),
  hapticsList: z.array(
    z.object({
      haptics: z.string().regex(HAPTICS_REGEX), // e.g. "255:255"
      motion: z.string().regex(NAME_REGEX).regex(NAME_REGEX),
      behavior: z.string(),
      scale: z.number().min(0).max(1),
      fallback: z.number().int().min(0),
      alias: z.string().regex(NAME_REGEX).optional(),
    })
  ),
});

export type HapticsEntry = z.infer<typeof hapticsEntrySchema>;
export const hapticsEntrySchema = z.object({
  program: z.string(),
  haptics: z.string().regex(HAPTICS_REGEX),
  motion: z.string().regex(NAME_REGEX).regex(NAME_REGEX),
  behavior: z.string(),
  scale: z.number().min(0).max(1),
  fallback: z.number().int().min(0),
  alias: z.string().regex(NAME_REGEX).optional(),
});

export type GestureMapping = z.infer<typeof gestureMappingSchema>;
export const gestureMappingSchema = z.object({
  gesture: z.string(),
  motion: z.string().regex(NAME_REGEX),
  behavior: z.string(),
  fallback: z.number().int().min(0),
  frames: z.number().int().min(1),
});

export type GestureConfig = z.infer<typeof GestureConfigSchema>;
export const GestureConfigSchema = z.object({
  start_live: z.string(),
  stop: z.string(),
  start_event: z.string(),
});

export type AudioFlipPayload = z.infer<typeof audioFlipPayloadSchema>;
export const audioFlipPayloadSchema = z.object({
  flip: z.boolean(),
});

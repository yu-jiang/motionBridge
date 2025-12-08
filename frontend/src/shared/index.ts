import z from "zod";

export const NAME_REGEX = /^[\w ]{1,100}$/;
export const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const HAPTICS_REGEX = /^\d{3}:\d{3}$/; // e.g. "255:255"
export const MAX_MAGNITUDE = 3000; // N
export const FREQUENCY = 100; // H
export const YOUTUBE_REGEX = /^[\w-]{11}$/; // YouTube video ID

export interface ErrorMsg {
  error: string;
}

export interface APIResponse<T> {
  data?: T;
  errorMsg?: ErrorMsg;
}

export type ServerMsg = z.infer<typeof serverMsgSchema>;
export const serverMsgSchema = z.object({
  message: z.string(),
});

export type ForceCommand = z.infer<typeof forceCommandScehma>;
export const forceCommandScehma = z.object({
  command: z.string().regex(/^forces$/),
  forces: z.array(z.number()),
});

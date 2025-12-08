import z from "zod";

export const behaviors = [
  "disable",
  "inherit",
  "replace",
  "append",
  "clear",
  "single",
] as const;

export const playerModes = ["off", "live", "event"] as const;
export type PlayerMode = (typeof playerModes)[number];

export type PlayerConfig = z.infer<typeof postPlayerConfigSchema>;
export const postPlayerConfigSchema = z.object({
  mode: z.string(),
  target: z.string(),
});

export type BridgeStatus = z.infer<typeof bridgeStatusSchema>;
export const bridgeStatusSchema = z.object({
  player_connected: z.boolean(),
  player_mode: z.string(),
  player_target: z.string(),
  input_clients: z.array(z.string()),
  output_clients: z.array(z.string()),
  target_connected: z.boolean().optional(),
  bridge_connected: z.boolean().optional(),
});

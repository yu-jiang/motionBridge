import {
  HapticsEntry,
  hapticsEntrySchema,
  hapticsTrackSchema,
} from "../shared/motion.track.type";
import { HapticsTrack } from "../shared/motion.track.type";
import { api, toErrorMsg } from "./api";
import { APIResponse, ServerMsg } from "../shared";
import z from "zod";
import { startService, stopService } from "./motionBridgeService";

const URL = "/api/haptics-track";

export async function getHapticsTracks(): Promise<APIResponse<HapticsTrack[]>> {
  try {
    const res = await api.get<HapticsTrack[]>(URL);
    const data = z.array(hapticsTrackSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function postHapticsTracks(
  payload: HapticsTrack
): Promise<APIResponse<HapticsTrack[]>> {
  try {
    const parsed = hapticsTrackSchema.parse(payload);
    const res = await api.post<HapticsTrack[]>(URL, parsed);
    const data = z.array(hapticsTrackSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function startHapticsMonitor(
  callback: (message: string) => void
): Promise<APIResponse<ServerMsg>> {
  return await startService("haptics", callback);
}

export async function stopHapticsMonitor(
  callback: (message: string) => void
): Promise<APIResponse<ServerMsg>> {
  return await stopService("haptics", callback);
}

export async function deleteHapticsEntry(
  payload: HapticsEntry
): Promise<APIResponse<HapticsTrack[]>> {
  try {
    const parsed = hapticsEntrySchema.parse(payload);
    const res = await api.put<HapticsTrack[]>(URL, parsed);
    const data = z.array(hapticsTrackSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function deleteHapticsTrack(
  payload: HapticsTrack
): Promise<APIResponse<HapticsTrack[]>> {
  try {
    const parsed = hapticsTrackSchema.parse(payload);
    const res = await api.delete<HapticsTrack[]>(URL, { data: parsed });
    const data = z.array(hapticsTrackSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

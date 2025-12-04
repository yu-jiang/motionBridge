import {
  HapticsEntry,
  hapticsEntrySchema,
  hapticsMappingSchema,
} from "../shared/motion.map.type";
import { HapticsMapping } from "../shared/motion.map.type";
import { api, toErrorMsg } from "./api";
import { APIResponse, ServerMsg } from "../shared";
import z from "zod";
import { startService, stopService } from "./motionBridgeService";

const URL = "/api/haptics-mapping";

export async function getHapticsMappings(): Promise<APIResponse<HapticsMapping[]>> {
  try {
    const res = await api.get<HapticsMapping[]>(URL);
    const data = z.array(hapticsMappingSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function postHapticsMappings(
  payload: HapticsMapping
): Promise<APIResponse<HapticsMapping[]>> {
  try {
    const parsed = hapticsMappingSchema.parse(payload);
    const res = await api.post<HapticsMapping[]>(URL, parsed);
    const data = z.array(hapticsMappingSchema).parse(res.data);
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
): Promise<APIResponse<HapticsMapping[]>> {
  try {
    const parsed = hapticsEntrySchema.parse(payload);
    const res = await api.put<HapticsMapping[]>(URL, parsed);
    const data = z.array(hapticsMappingSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function deleteHapticsMapping(
  payload: HapticsMapping
): Promise<APIResponse<HapticsMapping[]>> {
  try {
    const parsed = hapticsMappingSchema.parse(payload);
    const res = await api.delete<HapticsMapping[]>(URL, { data: parsed });
    const data = z.array(hapticsMappingSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

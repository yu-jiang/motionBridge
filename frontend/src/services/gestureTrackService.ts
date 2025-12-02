import z from "zod";
import { APIResponse } from "../shared";
import {
  JediConfig,
  jediConfigSchema,
  gestureTrackSchema,
} from "../shared/motion.track.type";
import { GestureTrack } from "../shared/motion.track.type";
import { api, toErrorMsg } from "./api";

const URL = "/api/gesture-track";

export async function getGestureTracks(): Promise<APIResponse<GestureTrack[]>> {
  try {
    const res = await api.get<GestureTrack[]>(URL);
    const data = z.array(gestureTrackSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function postGestureTracks(
  payload: GestureTrack[]
): Promise<APIResponse<GestureTrack[]>> {
  try {
    const parsed = z.array(gestureTrackSchema).parse(payload);
    const res = await api.post<GestureTrack[]>(URL, parsed);
    const data = z.array(gestureTrackSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function getJediConfig(): Promise<APIResponse<JediConfig>> {
  try {
    const res = await api.get<JediConfig>("/api/special-gesture");
    const data = jediConfigSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

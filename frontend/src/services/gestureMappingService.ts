import z from "zod";
import { APIResponse } from "../shared";
import {
  GestureConfig,
  GestureConfigSchema,
  gestureMappingSchema,
} from "../shared/motion.map.type";
import { GestureMapping } from "../shared/motion.map.type";
import { api, toErrorMsg } from "./api";

const URL = "/api/gesture-mapping";

export async function getGestureMappings(): Promise<APIResponse<GestureMapping[]>> {
  try {
    const res = await api.get<GestureMapping[]>(URL);
    const data = z.array(gestureMappingSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function postGestureMappings(
  payload: GestureMapping[]
): Promise<APIResponse<GestureMapping[]>> {
  try {
    const parsed = z.array(gestureMappingSchema).parse(payload);
    const res = await api.post<GestureMapping[]>(URL, parsed);
    const data = z.array(gestureMappingSchema).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function getJediConfig(): Promise<APIResponse<GestureConfig>> {
  try {
    const res = await api.get<GestureConfig>("/api/special-gesture");
    const data = GestureConfigSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

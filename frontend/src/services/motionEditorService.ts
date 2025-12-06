import {
  Motion,
  motionSchema,
  MotionGenPayload,
  MotionGenType,
  schemaMap,
  motionMetadataSchema,
  MotionMetadata,
  motionGenSchemas,
  bakedbezierCurveMotionSchema,
} from "../shared/motion.type";
import { NAME_REGEX } from "../shared";
import { api, toErrorMsg } from "./api";
import { APIResponse, ServerMsg, serverMsgSchema } from "../shared";
import z from "zod";

const MOTION_URL = "/motion";
const GENERATE_URL = "/motion/generate";
const COMPOSE_URL = "/motion/compose";
const SAVE_URL = "/motion/save";
const PRESET_URL = "/motion/preset";

export async function getMotions(): Promise<APIResponse<string[]>> {
  try {
    const res = await api.get<string[]>(MOTION_URL);
    const data = z.array(z.string()).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function getMotionByName(
  name: string
): Promise<APIResponse<Motion>> {
  if (!NAME_REGEX.test(name)) {
    return {
      errorMsg: { error: "Invalid motion name format" },
    };
  }
  const param = encodeURIComponent(name);
  try {
    const res = await api.get<Motion>(`${MOTION_URL}/${param}`);
    const data = motionSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function getMotionMetadataByName(
  name: string
): Promise<APIResponse<MotionMetadata>> {
  if (name === "none") {
    return {
      errorMsg: { error: "Motion name can't be none." },
    };
  }
  const param = encodeURIComponent(name);
  try {
    const res = await api.get<MotionMetadata>(
      `${MOTION_URL}/${param}/metadata`
    );
    const data = motionMetadataSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function playMotion(
  motion: Motion,
  callback: (message: string) => void
): Promise<void> {
  try {
    const parsed = motionSchema.parse(motion);
    const res = await api.post<ServerMsg>(`${MOTION_URL}/play`, parsed);
    const data = serverMsgSchema.parse(res.data);
    callback(data.message);
  } catch (error) {
    callback(toErrorMsg(error).error);
  }
}

export async function playMotionByName(
  name: string,
  callback: (message: string) => void
): Promise<void> {
  if (!NAME_REGEX.test(name)) {
    callback("Invalid motion name format");
    return;
  }
  const param = encodeURIComponent(name);
  try {
    const res = await api.post<ServerMsg>(`${MOTION_URL}/play/${param}`);
    const data = serverMsgSchema.parse(res.data);
    callback(data.message);
  } catch (error) {
    callback(toErrorMsg(error).error);
  }
}

export async function generateMotion(
  payload: MotionGenPayload,
  baked_bezier_curve = false
): Promise<APIResponse<Motion>> {
  const schema = baked_bezier_curve
    ? bakedbezierCurveMotionSchema
    : schemaMap[payload.type];
  try {
    const parsed = schema.parse(payload);
    const res = await api.post<Motion>(`${GENERATE_URL}`, parsed);
    const data = motionSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function saveMotion(
  motion: Motion
): Promise<APIResponse<ServerMsg>> {
  try {
    const parsed = motionSchema.parse(motion);
    const res = await api.post<ServerMsg>(SAVE_URL, parsed);
    const data = serverMsgSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function updateMotion(
  originalName: string,
  formMotion: Motion
): Promise<APIResponse<Motion>> {
  if (!NAME_REGEX.test(originalName)) {
    return {
      errorMsg: { error: "The original motion name is invalid." },
    };
  }
  try {
    const parsed = motionSchema.parse(formMotion);
    const param = encodeURIComponent(originalName);
    const res = await api.post<Motion>(`${MOTION_URL}/${param}`, parsed);
    const data = motionSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function scaleMotion(
  motion: Motion,
  scale: number
): Promise<APIResponse<Motion>> {
  if (scale < -2 || scale > 2) {
    return {
      errorMsg: { error: "Scale must be between -2 and 2." },
    };
  }
  try {
    const param = encodeURIComponent(motion.name);
    const parsed = motionSchema.parse(motion);
    const res = await api.put<Motion>(`${MOTION_URL}/${param}`, {
      motion: parsed,
      scale,
    });
    const data = motionSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function deleteMotion(
  motion: Motion
): Promise<APIResponse<ServerMsg>> {
  try {
    const parsed = motionSchema.parse(motion);
    const param = encodeURIComponent(parsed.name);
    const res = await api.delete<ServerMsg>(`${MOTION_URL}/${param}`, {
      data: parsed,
    });
    const data = serverMsgSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function getPreset(
  name: string
): Promise<APIResponse<MotionGenPayload>> {
  if (!NAME_REGEX.test(name)) {
    return {
      errorMsg: { error: "Invalid motion name format" },
    };
  }
  try {
    const param = encodeURIComponent(name);
    const res = await api.get<MotionGenPayload>(`${PRESET_URL}/${param}`);
    const data = motionGenSchemas.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function getPresetNames(): Promise<APIResponse<string[]>> {
  try {
    const res = await api.get<string[]>(PRESET_URL);
    const data = z.array(z.string()).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function getPresetNamesByType(
  type: MotionGenType
): Promise<APIResponse<string[]>> {
  try {
    const res = await api.get<string[]>(`${PRESET_URL}?type=${type}`);
    const parsed = z.array(z.string()).parse(res.data);
    return {
      data: parsed,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function savePreset(
  payload: MotionGenPayload
): Promise<APIResponse<ServerMsg>> {
  try {
    const parsed = schemaMap[payload.type].parse(payload);
    const res = await api.post<ServerMsg>(`${PRESET_URL}`, parsed);
    const data = serverMsgSchema.parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function getEditableMotions(): Promise<APIResponse<string[]>> {
  try {
    const res = await api.get<string[]>(`${MOTION_URL}/lock`);
    const data = z.array(z.string()).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function toggleMotionLock(
  motion: Motion
): Promise<APIResponse<string[]>> {
  try {
    const parsed = motionSchema.parse(motion);
    const res = await api.post<string[]>(`${MOTION_URL}/lock`, parsed);
    const data = z.array(z.string()).parse(res.data);
    return {
      data: data,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

import z from "zod";
import { APIResponse, ServerMsg, serverMsgSchema } from "../shared";
import { PlayerConfig, postPlayerConfigSchema } from "../shared/bridge.type";
import { api, toErrorMsg } from "./api";

export async function reloadMappings(callback: (message: string) => void) {
  try {
    const res = await api.post<ServerMsg>("/api/reload");
    const data = serverMsgSchema.parse(res.data);
    callback(data.message);
  } catch (error) {
    callback(toErrorMsg(error).error);
  }
}

export async function startService(
  service: "player" | "haptics" | "audio" | "gamepad",
  callback: (message: string) => void
): Promise<APIResponse<ServerMsg>> {
  try {
    const res = await api.post<ServerMsg>(`/api/start/${service}`);
    const data = serverMsgSchema.parse(res.data);
    callback(data.message);
    return {
      data: data,
    };
  } catch (error) {
    const errMsg = toErrorMsg(error);
    callback(errMsg.error);
    return {
      errorMsg: errMsg,
    };
  }
}

export async function stopService(
  service: string,
  callback: (message: string) => void
): Promise<APIResponse<ServerMsg>> {
  try {
    const res = await api.post<ServerMsg>(`/api/stop/${service}`);
    const data = serverMsgSchema.parse(res.data);
    callback(data.message);
    return {
      data: data,
    };
  } catch (error) {
    const errMsg = toErrorMsg(error);
    callback(errMsg.error);
    return {
      errorMsg: errMsg,
    };
  }
}

export async function startPlayer(
  callback: (message: string) => void
): Promise<APIResponse<ServerMsg>> {
  return startService("player", callback);
}

export async function stopPlayer(
  callback: (message: string) => void
): Promise<APIResponse<ServerMsg>> {
  return await stopService("player", callback);
}

export async function restartPlayer(
  callback: (message: string) => void
): Promise<APIResponse<ServerMsg>> {
  try {
    const res = await api.post<ServerMsg>(`/api/restart/player`);
    const data = serverMsgSchema.parse(res.data);
    callback(data.message);
    return {
      data: data,
    };
  } catch (error) {
    const errMsg = toErrorMsg(error);
    callback(errMsg.error);
    return {
      errorMsg: errMsg,
    };
  }
}

export async function getPlayerTargets(): Promise<APIResponse<string[]>> {
  try {
    const res = await api.get<string[]>("/api/player/target");
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

export async function postPlayerConfig(
  payload: PlayerConfig
): Promise<APIResponse<ServerMsg>> {
  try {
    const parsed = postPlayerConfigSchema.parse(payload);
    const res = await api.post<ServerMsg[]>("/api/player", parsed);
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

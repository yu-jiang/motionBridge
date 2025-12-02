import z from "zod";
import { APIResponse, ServerMsg, serverMsgSchema } from "../shared";
import { api, toErrorMsg } from "./api";
import { AxiosProgressEvent } from "axios";
import {
  AudioFlipPayload,
  audioFlipPayloadSchema,
  MotionPayload,
  motionPayloadSchema,
} from "../shared/motion.track.type";
import { startService, stopService } from "./motionBridgeService";

const AUDIO_TRACK_URL = "/api/audio-track";
const AUDIO_URL = "/api/audio";

export async function getAudioFileNames(): Promise<APIResponse<string[]>> {
  try {
    const res = await api.get<string[]>(AUDIO_URL);
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

export async function getAudioTrack(): Promise<APIResponse<MotionPayload>> {
  try {
    const res = await api.get<MotionPayload>(AUDIO_TRACK_URL);
    const parsed = motionPayloadSchema.parse(res.data);
    return {
      data: parsed,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function saveAudioTrack(
  data: MotionPayload
): Promise<APIResponse<MotionPayload>> {
  try {
    const res = await api.post<MotionPayload>(AUDIO_TRACK_URL, data);
    const parsed = motionPayloadSchema.parse(res.data);
    return {
      data: parsed,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function uploadAudioFile(
  file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<APIResponse<ServerMsg>> {
  const formData = new FormData();
  formData.append("audio", file);
  try {
    const res = await api.post<ServerMsg>(`${AUDIO_URL}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    const parsed = serverMsgSchema.parse(res.data);
    return {
      data: parsed,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function deleteAudioFile(
  audioFileName: string
): Promise<APIResponse<ServerMsg>> {
  try {
    const res = await api.delete<ServerMsg>(`${AUDIO_URL}/${audioFileName}`);
    const parsed = serverMsgSchema.parse(res.data);
    return {
      data: parsed,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function renameAudioFile(
  audioFileName: string,
  newName: string
): Promise<APIResponse<ServerMsg>> {
  try {
    const res = await api.post<ServerMsg>(`${AUDIO_URL}/${audioFileName}`, {
      oldName: audioFileName,
      newName,
    });
    const parsed = serverMsgSchema.parse(res.data);
    return {
      data: parsed,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function startBeatDetector(
  callback: (message: string) => void
): Promise<APIResponse<ServerMsg>> {
  return await startService("audio", callback);
}

export async function stopBeatDetector(
  callback: (message: string) => void
): Promise<APIResponse<ServerMsg>> {
  return await stopService("audio", callback);
}

export async function getAudioFlip(): Promise<APIResponse<boolean>> {
  try {
    const res = await api.get<AudioFlipPayload>(`${AUDIO_TRACK_URL}/flip`);
    const data = audioFlipPayloadSchema.parse(res.data);
    return {
      data: data.flip,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function toggleAudioFlip(): Promise<APIResponse<boolean>> {
  try {
    const res = await api.post<AudioFlipPayload>(`${AUDIO_TRACK_URL}/flip`);
    const data = audioFlipPayloadSchema.parse(res.data);
    return {
      data: data.flip,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

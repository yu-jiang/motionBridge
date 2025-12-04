import z from "zod";
import { APIResponse, ServerMsg, serverMsgSchema } from "../shared";
import { api, toErrorMsg } from "./api";
import {
  VideoMapping,
  videoMappingSchema,
  YoutubeVideoPayload,
} from "../shared/video.map.type";
import { AxiosProgressEvent } from "axios";

const VIDEO_MAPPING_URL = "/api/video-mapping";
const VIDEO_URL = "/api/video";

export async function getVideoFileNames(): Promise<APIResponse<string[]>> {
  try {
    const res = await api.get<string[]>(VIDEO_MAPPING_URL);
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

export async function getVideoMapping(
  videoFileName: string
): Promise<APIResponse<VideoMapping>> {
  try {
    const res = await api.get<VideoMapping>(
      `${VIDEO_MAPPING_URL}/${videoFileName}`
    );
    const parsed = videoMappingSchema.parse(res.data);
    return {
      data: parsed,
    };
  } catch (error) {
    return {
      errorMsg: toErrorMsg(error),
    };
  }
}

export async function postVideoMapping(
  data: VideoMapping
): Promise<APIResponse<ServerMsg>> {
  try {
    const res = await api.post<ServerMsg>(VIDEO_MAPPING_URL, data);
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

export async function uploadVideoFile(
  file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<APIResponse<ServerMsg>> {
  const formData = new FormData();
  formData.append("video", file);
  try {
    const res = await api.post<ServerMsg>(`${VIDEO_URL}/upload`, formData, {
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

export async function deleteVideoFile(
  videoFileName: string
): Promise<APIResponse<ServerMsg>> {
  try {
    const res = await api.delete<ServerMsg>(`${VIDEO_URL}/${videoFileName}`);
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

export async function renameVideoFile(
  videoFileName: string,
  newName: string
): Promise<APIResponse<ServerMsg>> {
  try {
    const res = await api.post<ServerMsg>(`${VIDEO_URL}/${videoFileName}`, {
      oldName: videoFileName,
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

export async function uploadYouTubeVideo(
  payload: YoutubeVideoPayload
): Promise<APIResponse<ServerMsg>> {
  try {
    const res = await api.post<ServerMsg>(
      `${VIDEO_URL}/upload-youtube`,
      payload
    );
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

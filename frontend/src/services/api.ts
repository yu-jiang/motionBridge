import axios from "axios";
import { ErrorMsg } from "../shared";
import z from "zod";

export const api = axios.create();

export function toErrorMsg(error: unknown): ErrorMsg {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      if (error.response.data.error) {
        return { error: `Error: ${error.response.data.error}` };
      }
      return {
        error: `RequestError: ${error.response.status} ${error.response.statusText}`,
      };
    }
  } else if (error instanceof z.ZodError) {
    let str = "";
    for (const issue of error.issues) {
      const path = issue.path.pop();
      switch (path) {
        case "motion":
          str = `Invalid motion.\n`;
          break;
        case "name":
        case "id":
        case "motionRef":
          str = `${path}: Invalid format. Allow alphanumeric, space and _ only\n`;
          break;
        case "color":
          str = `${path}: Invalid format, must be #RRGGBB\n`;
          break;
        case "magnitude":
        case "magnitudeOverride":
          str = `${path}: Invalid number, must be an integer between 0 and 2000\n`;
          break;
        case "seed":
          str = `${path}: Invalid value, must be a positive integer\n`;
          break;
        case "direction":
          str = `${path}: Invalid value, must be one of the allowed directions\n`;
          break;
        case "startValue":
        case "endValue":
        case "firstPeakValue":
        case "secondPeakValue":
          str = `${path}: Invalid value, must be between -1 and 1\n`;
          break;
        case "duration":
        case "frequency":
        case "firstPeakTime":
        case "secondPeakTime":
        case "lowCutoff":
        case "highCutoff":
        case "startTime":
          str = `${path}: Invalid value, must be a positive number\n`;
          break;
        default:
          str = `${String(path)}: ${issue.message}\n`;
          break;
      }
    }
    return {
      error: str,
    };
  } else if (error instanceof Error) {
    return { error: `Unhandled Error: ${error.message}` };
  }
  return { error: `Unknown error: ${error}` };
}

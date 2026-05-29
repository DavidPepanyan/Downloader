import type { ApiErrorCode } from "@/types/api";
import { ENV } from "@/lib/utils/env";

export class YtdlpError extends Error {
  readonly stderr: string;

  constructor(message: string, stderr = "") {
    super(message);
    this.name = "YtdlpError";
    this.stderr = stderr;
  }
}

export function mapYtdlpError(error: unknown): { code: ApiErrorCode; message: string } {
  const text = [
    error instanceof YtdlpError ? error.message : "",
    error instanceof YtdlpError ? error.stderr : "",
    error instanceof Error ? error.message : String(error),
  ]
    .join("\n")
    .toLowerCase();

  if (
    text.includes("sign in") ||
    text.includes("private video") ||
    text.includes("members only") ||
    text.includes("not available in your country") ||
    text.includes("age-restricted") ||
    text.includes("video unavailable")
  ) {
    return {
      code: "UNSUPPORTED_SOURCE",
      message: "This video is restricted or unavailable for automated processing.",
    };
  }

  if (text.includes("not a youtube url") || text.includes("could not extract")) {
    return {
      code: "INVALID_URL",
      message: "Please provide a valid YouTube video link.",
    };
  }

  if (text.includes("ffmpeg") && (text.includes("not found") || text.includes("not installed"))) {
    return {
      code: "DOWNLOAD_FAILED",
      message:
        "High-quality download requires ffmpeg. Install ffmpeg or run npm install in this project.",
    };
  }

  if (text.includes("ffmpeg is required") || text.includes("set ffmpeg_path")) {
    return {
      code: "DOWNLOAD_FAILED",
      message:
        "ffmpeg is required for YouTube downloads. Run npm install in the project folder or set FFMPEG_PATH.",
    };
  }

  if (text.includes("did not produce a merged") || text.includes("merge may have failed")) {
    return {
      code: "DOWNLOAD_FAILED",
      message:
        "Could not merge video and audio. Ensure ffmpeg is installed (npm install) and try again.",
    };
  }

  if (text.includes("file_too_large") || text.includes("exceeds maximum size")) {
    return {
      code: "FILE_TOO_LARGE",
      message: `File is too large. Maximum allowed size is ${ENV.maxVideoFileSizeMb} MB.`,
    };
  }

  return {
    code: "DOWNLOAD_FAILED",
    message: "Could not process this source right now. Please check the link and try again.",
  };
}

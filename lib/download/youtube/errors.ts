import type { ApiErrorCode } from "@/types/api";

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

  return {
    code: "DOWNLOAD_FAILED",
    message: "Could not process this source right now. Please check the link and try again.",
  };
}

import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { VideoFormat, VideoInfoData, VideoInfoRequest } from "@/types/video";

const VIDEO_EXTENSIONS = new Set<VideoFormat>(["mp4", "webm", "mp3"]);

function getFileExtensionFromPath(pathname: string): string | null {
  const parts = pathname.split(".");
  if (parts.length < 2) return null;

  const ext = parts[parts.length - 1]?.toLowerCase() ?? "";
  return ext || null;
}

function normalizeFileTitle(pathname: string): string {
  const fallbackTitle = "media-file";
  const rawName = pathname.split("/").pop();
  if (!rawName) return fallbackTitle;

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

export async function POST(request: Request) {
  let body: VideoInfoRequest;

  try {
    body = (await request.json()) as VideoInfoRequest;
  } catch {
    const response: ApiResponse<never> = {
      ok: false,
      error: {
        code: "BAD_REQUEST",
        message: "Invalid JSON payload.",
      },
    };
    return NextResponse.json(response, { status: 400 });
  }

  if (!body?.url || typeof body.url !== "string") {
    const response: ApiResponse<never> = {
      ok: false,
      error: {
        code: "BAD_REQUEST",
        message: "Field 'url' is required.",
      },
    };
    return NextResponse.json(response, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.url);
  } catch {
    const response: ApiResponse<never> = {
      ok: false,
      error: {
        code: "INVALID_URL",
        message: "URL is invalid.",
      },
    };
    return NextResponse.json(response, { status: 400 });
  }

  const extension = getFileExtensionFromPath(parsedUrl.pathname);
  const isSupportedDirectMedia = extension ? VIDEO_EXTENSIONS.has(extension as VideoFormat) : false;

  if (!isSupportedDirectMedia) {
    const response: ApiResponse<never> = {
      ok: false,
      error: {
        code: "UNSUPPORTED_FORMAT",
        message: "Only direct mp4/webm/mp3 links are supported in MVP.",
      },
    };
    return NextResponse.json(response, { status: 422 });
  }

  const data: VideoInfoData = {
    title: normalizeFileTitle(parsedUrl.pathname),
    sourceUrl: parsedUrl.toString(),
    sourceHost: parsedUrl.hostname,
    sourceExtension: extension,
    thumbnailUrl: null,
    durationSec: null,
    availableFormats: [extension as VideoFormat],
    availableQualities: ["source"],
  };

  const response: ApiResponse<VideoInfoData> = {
    ok: true,
    data,
  };

  return NextResponse.json(response, { status: 200 });
}

export function GET() {
  const response: ApiResponse<never> = {
    ok: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "Use POST /api/video/info.",
    },
  };

  return NextResponse.json(response, { status: 405 });
}

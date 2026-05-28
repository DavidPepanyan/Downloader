import { NextResponse } from "next/server";

import {
  detectVideoSource,
  getFileExtension,
  getYoutubeVideoInfo,
  normalizeFileTitle,
} from "@/lib/download/video";
import type { ApiResponse } from "@/types/api";
import type { VideoInfoData, VideoInfoRequest } from "@/types/video";

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

  const sourceType = detectVideoSource(parsedUrl);
  if (!sourceType) {
    const response: ApiResponse<never> = {
      ok: false,
      error: {
        code: "UNSUPPORTED_SOURCE",
        message:
          "This URL is not supported. Use a YouTube link or a direct MP4/WEBM/MP3 media URL.",
      },
    };
    return NextResponse.json(response, { status: 422 });
  }

  let data: VideoInfoData;
  if (sourceType === "youtube") {
    try {
      const ytInfo = await getYoutubeVideoInfo(parsedUrl.toString());
      data = {
        sourceType,
        title: ytInfo.title,
        sourceUrl: parsedUrl.toString(),
        sourceHost: parsedUrl.hostname,
        sourceExtension: null,
        thumbnailUrl: ytInfo.thumbnailUrl,
        durationSec: ytInfo.durationSec,
        availableFormats: ytInfo.availableFormats,
        availableQualities: ytInfo.availableQualities,
      };
    } catch {
      const response: ApiResponse<never> = {
        ok: false,
        error: {
          code: "DOWNLOAD_FAILED",
          message: "Failed to read YouTube video metadata.",
        },
      };
      return NextResponse.json(response, { status: 502 });
    }
  } else {
    const extension = getFileExtension(parsedUrl.pathname);
    if (!extension) {
      const response: ApiResponse<never> = {
        ok: false,
        error: {
          code: "UNSUPPORTED_FORMAT",
          message: "Direct links must end with .mp4, .webm, or .mp3",
        },
      };
      return NextResponse.json(response, { status: 422 });
    }

    data = {
      sourceType,
      title: normalizeFileTitle(parsedUrl.pathname),
      sourceUrl: parsedUrl.toString(),
      sourceHost: parsedUrl.hostname,
      sourceExtension: extension,
      thumbnailUrl: null,
      durationSec: null,
      availableFormats: [extension],
      availableQualities: ["source"],
    };
  }

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

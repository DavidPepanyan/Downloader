import { NextResponse } from "next/server";
import { Readable } from "node:stream";

import {
  detectVideoSource,
  getFileExtension,
  normalizeFileTitle,
  resolveYoutubeDownload,
} from "@/lib/download/video";
import type { ApiResponse } from "@/types/api";
import type { VideoDownloadRequest } from "@/types/video";

export async function POST(request: Request) {
  let body: VideoDownloadRequest;
  try {
    body = (await request.json()) as VideoDownloadRequest;
  } catch {
    const response: ApiResponse<never> = {
      ok: false,
      error: { code: "BAD_REQUEST", message: "Invalid JSON payload." },
    };
    return NextResponse.json(response, { status: 400 });
  }

  if (!body?.url || typeof body.url !== "string") {
    const response: ApiResponse<never> = {
      ok: false,
      error: { code: "BAD_REQUEST", message: "Field 'url' is required." },
    };
    return NextResponse.json(response, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.url);
  } catch {
    const response: ApiResponse<never> = {
      ok: false,
      error: { code: "INVALID_URL", message: "URL is invalid." },
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

  if (sourceType === "direct") {
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

    return NextResponse.json(
      {
        ok: true,
        data: {
          sourceType,
          downloadUrl: parsedUrl.toString(),
          fileName: normalizeFileTitle(parsedUrl.pathname),
        },
      },
      { status: 200 }
    );
  }

  try {
    const { stream, fileExtension } = await resolveYoutubeDownload(
      parsedUrl.toString(),
      body.format,
      body.quality
    );
    const title = `youtube-${Date.now()}.${fileExtension}`;
    const contentType =
      fileExtension === "mp3"
        ? "audio/mpeg"
        : fileExtension === "webm"
          ? "video/webm"
          : "video/mp4";

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${title}"`,
      },
    });
  } catch {
    const response: ApiResponse<never> = {
      ok: false,
      error: {
        code: "DOWNLOAD_FAILED",
        message: "Could not start download for this video.",
      },
    };
    return NextResponse.json(response, { status: 502 });
  }
}

export function GET() {
  const response: ApiResponse<never> = {
    ok: false,
    error: { code: "METHOD_NOT_ALLOWED", message: "Use POST /api/video/download." },
  };
  return NextResponse.json(response, { status: 405 });
}

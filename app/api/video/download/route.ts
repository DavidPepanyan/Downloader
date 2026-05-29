import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { z } from "zod";

import {
  getYoutubeVideoInfo,
  detectVideoSource,
  getFileExtension,
  normalizeFileTitle,
  resolveYoutubeDownloadStream,
} from "@/lib/download/video";
import { mapYtdlpError } from "@/lib/download/youtube/errors";
import { isDirectHostAllowed } from "@/lib/security/allowed-hosts";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { RequestTimeoutError, withTimeout } from "@/lib/utils/errors";
import { ENV } from "@/lib/utils/env";
import { fail, ok } from "@/lib/utils/response";
import type { VideoDownloadRequest } from "@/types/video";

const downloadRequestSchema = z.object({
  url: z.string().url().max(2048),
  format: z.enum(["mp4", "webm", "mp3"]),
  quality: z.enum(["source", "1080p", "720p", "480p", "360p"]),
});

export async function POST(request: Request) {
  const rate = checkRateLimit(request, "video-download");
  if (!rate.allowed) {
    return fail(
      "RATE_LIMITED",
      `Too many requests. Try again in ${rate.retryAfterSec}s.`,
      429
    );
  }

  let rawBody: unknown;
  try {
    rawBody = (await request.json()) as VideoDownloadRequest;
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON payload.", 400);
  }

  const parsedBody = downloadRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return fail("BAD_REQUEST", "Invalid request body.", 400);
  }
  const body = parsedBody.data;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.url);
  } catch {
    return fail("INVALID_URL", "URL is invalid.", 400);
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return fail("INVALID_URL", "Only http/https URLs are supported.", 400);
  }

  const sourceType = detectVideoSource(parsedUrl);
  if (!sourceType) {
    return fail(
      "UNSUPPORTED_SOURCE",
      "This URL is not supported. Use a YouTube link or a direct MP4/WEBM/MP3 media URL.",
      422
    );
  }

  if (sourceType === "direct") {
    if (!isDirectHostAllowed(parsedUrl.hostname)) {
      return fail(
        "FORBIDDEN_HOST",
        "This direct host is not allowed by server policy.",
        403
      );
    }

    const extension = getFileExtension(parsedUrl.pathname);
    if (!extension) {
      return fail("UNSUPPORTED_FORMAT", "Direct links must end with .mp4, .webm, or .mp3", 422);
    }

    return ok(
      {
        sourceType,
        downloadUrl: parsedUrl.toString(),
        fileName: normalizeFileTitle(parsedUrl.pathname),
      },
      200
    );
  }

  try {
    const meta = await withTimeout(
      getYoutubeVideoInfo(parsedUrl.toString()),
      ENV.requestTimeoutMs,
      "Metadata request timed out."
    );
    if (meta.durationSec && meta.durationSec > ENV.maxVideoDurationSec) {
      return fail(
        "UNSUPPORTED_FORMAT",
        `Video is too long. Maximum allowed duration is ${ENV.maxVideoDurationSec}s.`,
        422
      );
    }

    const { stream, fileExtension, byteLength } = await withTimeout(
      resolveYoutubeDownloadStream(parsedUrl.toString(), body.format, body.quality),
      ENV.ytdlpDownloadTimeoutMs,
      "Download timed out."
    );
    const title = `youtube-${Date.now()}.${fileExtension}`;
    const contentType = fileExtension === "webm" ? "video/webm" : "video/mp4";

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(byteLength),
        "Content-Disposition": `attachment; filename="${title}"`,
      },
    });
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      return fail(
        "REQUEST_TIMEOUT",
        "The request took too long. Please try again in a few moments.",
        504
      );
    }

    console.error("video/download youtube error:", error);
    const mapped = mapYtdlpError(error);
    const status =
      mapped.code === "UNSUPPORTED_SOURCE" ||
      mapped.code === "FILE_TOO_LARGE" ||
      mapped.code === "UNSUPPORTED_FORMAT"
        ? 422
        : mapped.code === "INVALID_URL"
          ? 400
          : 502;
    return fail(mapped.code, mapped.message, status);
  }
}

export function GET() {
  return fail("METHOD_NOT_ALLOWED", "Use POST /api/video/download.", 405);
}

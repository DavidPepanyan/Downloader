import { z } from "zod";

import {
  detectVideoSource,
  getFileExtension,
  getYoutubeVideoInfo,
  normalizeFileTitle,
} from "@/lib/download/video";
import { mapYtdlpError } from "@/lib/download/youtube/errors";
import { isDirectHostAllowed } from "@/lib/security/allowed-hosts";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { RequestTimeoutError, withTimeout } from "@/lib/utils/errors";
import { ENV } from "@/lib/utils/env";
import { fail, ok } from "@/lib/utils/response";
import type { VideoInfoData, VideoInfoRequest } from "@/types/video";

const videoInfoSchema = z.object({
  url: z.string().url().max(2048),
});

export async function POST(request: Request) {
  const rate = checkRateLimit(request, "video-info");
  if (!rate.allowed) {
    return fail(
      "RATE_LIMITED",
      `Too many requests. Try again in ${rate.retryAfterSec}s.`,
      429
    );
  }

  let rawBody: unknown;

  try {
    rawBody = (await request.json()) as VideoInfoRequest;
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON payload.", 400);
  }

  const parsedBody = videoInfoSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return fail("BAD_REQUEST", "Invalid request body.", 400);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(parsedBody.data.url);
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

  let data: VideoInfoData;
  if (sourceType === "youtube") {
    try {
      const ytInfo = await withTimeout(
        getYoutubeVideoInfo(parsedUrl.toString()),
        ENV.requestTimeoutMs,
        "Metadata request timed out."
      );

      if (ytInfo.durationSec && ytInfo.durationSec > ENV.maxVideoDurationSec) {
        return fail(
          "UNSUPPORTED_FORMAT",
          `Video is too long. Maximum allowed duration is ${ENV.maxVideoDurationSec}s.`,
          422
        );
      }

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
    } catch (error) {
      if (error instanceof RequestTimeoutError) {
        return fail(
          "REQUEST_TIMEOUT",
          "The request took too long. Please try again in a few moments.",
          504
        );
      }

      console.error("video/info youtube metadata error:", error);
      const mapped = mapYtdlpError(error);
      const status = mapped.code === "UNSUPPORTED_SOURCE" ? 422 : mapped.code === "INVALID_URL" ? 400 : 502;
      return fail(mapped.code, mapped.message, status);
    }
  } else {
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

  return ok<VideoInfoData>(data, 200);
}

export function GET() {
  return fail("METHOD_NOT_ALLOWED", "Use POST /api/video/info.", 405);
}

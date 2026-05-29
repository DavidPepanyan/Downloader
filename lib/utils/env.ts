import { LIMITS } from "@/config/limits";

function toPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseAllowedHosts(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const requestTimeoutMs = toPositiveInt(process.env.REQUEST_TIMEOUT_MS, LIMITS.requestTimeoutMs);

export const ENV = {
  requestTimeoutMs,
  ytdlpDownloadTimeoutMs: toPositiveInt(
    process.env.YTDLP_DOWNLOAD_TIMEOUT_MS,
    Math.max(requestTimeoutMs, 120_000)
  ),
  maxVideoDurationSec: toPositiveInt(process.env.MAX_VIDEO_DURATION_SEC, LIMITS.maxVideoDurationSec),
  rateLimitWindowMs: toPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, LIMITS.rateLimitWindowMs),
  rateLimitMaxRequests: toPositiveInt(
    process.env.RATE_LIMIT_MAX_REQUESTS,
    LIMITS.rateLimitMaxRequests
  ),
  allowedHosts: parseAllowedHosts(process.env.ALLOWED_HOSTS),
  ytdlpPath: process.env.YTDLP_PATH?.trim() || "",
  ffmpegPath: process.env.FFMPEG_PATH?.trim() || "",
} as const;

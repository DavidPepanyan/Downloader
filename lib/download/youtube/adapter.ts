import type { Readable } from "node:stream";

import { buildYtdlpFormatSelector, mapHeightsToQualities } from "@/lib/download/youtube/format-mapper";
import { normalizeYoutubeUrl } from "@/lib/download/youtube/normalize-url";
import { createYtdlpStdoutStream, runYtdlpJson } from "@/lib/download/youtube/ytdlp-runner";
import { ENV } from "@/lib/utils/env";
import type { VideoFormat, VideoQuality } from "@/types/video";

type YtdlpFormat = {
  ext?: string;
  height?: number | null;
  vcodec?: string | null;
};

type YtdlpVideoJson = {
  title?: string;
  duration?: number;
  thumbnail?: string;
  formats?: YtdlpFormat[];
  entries?: unknown[];
};

function isPlaylistPayload(payload: YtdlpVideoJson): boolean {
  return Array.isArray(payload.entries);
}

function collectVideoHeights(formats: YtdlpFormat[]): number[] {
  const heights: number[] = [];
  for (const format of formats) {
    if (!format.height) continue;
    if (!format.vcodec || format.vcodec === "none") continue;
    heights.push(format.height);
  }
  return heights;
}

function collectAvailableFormats(formats: YtdlpFormat[]): VideoFormat[] {
  const available = new Set<VideoFormat>(["mp4"]);
  for (const format of formats) {
    if (format.ext === "webm") available.add("webm");
    if (format.ext === "mp4") available.add("mp4");
  }
  return Array.from(available);
}

export async function getYoutubeVideoInfo(url: string) {
  const normalizedUrl = normalizeYoutubeUrl(url);
  const payload = await runYtdlpJson<YtdlpVideoJson>(
    normalizedUrl,
    ["-J", "--no-playlist", "--no-warnings"],
    ENV.requestTimeoutMs
  );

  if (isPlaylistPayload(payload)) {
    throw new Error("Playlist URLs are not supported. Use a single video link.");
  }

  const formats = payload.formats ?? [];
  const heights = collectVideoHeights(formats);

  return {
    title: payload.title || "youtube-video",
    durationSec: Number(payload.duration || 0) || null,
    thumbnailUrl: payload.thumbnail ?? null,
    availableFormats: collectAvailableFormats(formats),
    availableQualities: mapHeightsToQualities(heights),
  };
}

export async function resolveYoutubeDownload(url: string, format: VideoFormat, quality: VideoQuality) {
  const normalizedUrl = normalizeYoutubeUrl(url);
  const formatSelector = buildYtdlpFormatSelector(quality, format);
  const stream = await createYtdlpStdoutStream(
    normalizedUrl,
    ["-f", formatSelector, "-o", "-", "--no-playlist", "--no-warnings"],
    ENV.requestTimeoutMs
  );

  const fileExtension: VideoFormat = format === "webm" ? "webm" : "mp4";
  return { stream: stream as Readable, fileExtension };
}

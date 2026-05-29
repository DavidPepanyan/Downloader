import type { Readable } from "node:stream";

import {
  buildYtdlpFormatSelector,
  getYtdlpMergeOutputFormat,
  mapHeightsToQualities,
} from "@/lib/download/youtube/format-mapper";
import { resolveFfmpegPath } from "@/lib/download/youtube/ffmpeg-path";
import { normalizeYoutubeUrl } from "@/lib/download/youtube/normalize-url";
import { createYtdlpMergedFileStream, runYtdlpJson } from "@/lib/download/youtube/ytdlp-runner";
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

function buildYtdlpDownloadArgs(
  formatSelector: string,
  mergeOutputFormat: "mp4" | "webm",
  ffmpegPath: string | null,
  containerFormat: VideoFormat
): string[] {
  const args = [
    "-f",
    formatSelector,
    "--merge-output-format",
    mergeOutputFormat,
    "--no-playlist",
    "--no-warnings",
    "--no-part",
  ];

  if (containerFormat !== "webm") {
    args.push("--audio-format", "aac");
  }

  if (!ffmpegPath) {
    throw new Error(
      "ffmpeg is required for YouTube downloads. Run npm install or set FFMPEG_PATH in .env.local."
    );
  }

  args.push("--ffmpeg-location", ffmpegPath);

  return args;
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
  const mergeOutputFormat = getYtdlpMergeOutputFormat(format);
  const fileExtension: VideoFormat = format === "webm" ? "webm" : "mp4";
  const ffmpegPath = await resolveFfmpegPath();

  const optionArgs = buildYtdlpDownloadArgs(
    formatSelector,
    mergeOutputFormat,
    ffmpegPath,
    fileExtension
  );

  const { stream, byteLength } = await createYtdlpMergedFileStream(
    normalizedUrl,
    optionArgs,
    ENV.ytdlpDownloadTimeoutMs,
    fileExtension
  );

  return { stream: stream as Readable, fileExtension, byteLength };
}

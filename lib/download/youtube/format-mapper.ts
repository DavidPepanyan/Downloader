import type { VideoFormat, VideoQuality } from "@/types/video";

const QUALITY_MAX_HEIGHT: Record<Exclude<VideoQuality, "source">, number> = {
  "1080p": 1080,
  "720p": 720,
  "480p": 480,
  "360p": 360,
};

function heightFilter(quality: VideoQuality): string {
  if (quality === "source") return "";
  const maxHeight = QUALITY_MAX_HEIGHT[quality];
  return `[height<=${maxHeight}]`;
}

/**
 * yt-dlp format string for YouTube DASH (video+audio) with ffmpeg merge.
 */
export function buildYtdlpFormatSelector(quality: VideoQuality, format: VideoFormat): string {
  if (format === "mp3") {
    throw new Error("MP3 conversion for YouTube is not supported.");
  }

  const hf = heightFilter(quality);

  if (format === "webm") {
    return [
      `bestvideo${hf}+bestaudio`,
      `best${hf}[ext=webm]`,
      `best${hf}`,
      "best",
    ].join("/");
  }

  return [
    `bestvideo${hf}+bestaudio`,
    `best${hf}[ext=mp4]`,
    `best${hf}`,
    "best",
  ].join("/");
}

export function getYtdlpMergeOutputFormat(format: VideoFormat): "mp4" | "webm" {
  return format === "webm" ? "webm" : "mp4";
}

export function mapHeightsToQualities(heights: number[]): VideoQuality[] {
  const qualities = new Set<VideoQuality>(["source"]);

  for (const [quality, maxHeight] of Object.entries(QUALITY_MAX_HEIGHT) as [
    Exclude<VideoQuality, "source">,
    number,
  ][]) {
    if (heights.some((height) => height >= maxHeight - 120 && height <= maxHeight + 120)) {
      qualities.add(quality);
    }
  }

  if (qualities.size === 1 && heights.length > 0) {
    const max = Math.max(...heights);
    if (max >= 1000) qualities.add("1080p");
    else if (max >= 650) qualities.add("720p");
    else if (max >= 400) qualities.add("480p");
    else qualities.add("360p");
  }

  return Array.from(qualities);
}

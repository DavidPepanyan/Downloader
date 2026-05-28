import ytdl from "@distube/ytdl-core";
import { readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";

import type { VideoFormat, VideoQuality, VideoSourceType } from "@/types/video";

const DIRECT_FORMAT_EXTENSIONS: VideoFormat[] = ["mp4", "webm", "mp3"];
const YOUTUBE_ALLOWED_FORMATS: VideoFormat[] = ["mp4", "webm"];
const YOUTUBE_QUALITY_ORDER: VideoQuality[] = ["1080p", "720p", "480p", "360p"];
const PLAYER_SCRIPT_FILE_PATTERN = /^\d+-player-script\.js$/;

async function cleanupGeneratedPlayerScripts() {
  try {
    const workspaceRoot = process.cwd();
    const entries = await readdir(workspaceRoot, { withFileTypes: true });
    const deletions = entries
      .filter((entry) => entry.isFile() && PLAYER_SCRIPT_FILE_PATTERN.test(entry.name))
      .map((entry) => unlink(resolve(workspaceRoot, entry.name)));

    if (deletions.length > 0) {
      await Promise.allSettled(deletions);
    }
  } catch {
    // Best-effort cleanup; do not fail request flow.
  }
}

export function detectVideoSource(url: URL): VideoSourceType | null {
  if (ytdl.validateURL(url.toString())) {
    return "youtube";
  }

  const ext = getFileExtension(url.pathname);
  if (ext && DIRECT_FORMAT_EXTENSIONS.includes(ext)) {
    return "direct";
  }

  return null;
}

export function getFileExtension(pathname: string): VideoFormat | null {
  const parts = pathname.split(".");
  if (parts.length < 2) return null;
  const ext = parts[parts.length - 1]?.toLowerCase();

  if (ext === "mp4" || ext === "webm" || ext === "mp3") {
    return ext;
  }

  return null;
}

export function normalizeFileTitle(pathname: string): string {
  const fallbackTitle = "media-file";
  const rawName = pathname.split("/").pop();
  if (!rawName) return fallbackTitle;

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

export async function getYoutubeVideoInfo(url: string) {
  await cleanupGeneratedPlayerScripts();
  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title || "youtube-video";
  const durationSec = Number(info.videoDetails.lengthSeconds || 0) || null;
  const thumbnailUrl =
    info.videoDetails.thumbnails?.[info.videoDetails.thumbnails.length - 1]?.url ?? null;

  const availableFormats = new Set<VideoFormat>();
  const availableQualities = new Set<VideoQuality>();

  for (const format of info.formats) {
    if (!YOUTUBE_ALLOWED_FORMATS.includes((format.container as VideoFormat) ?? "mp4")) continue;

    if (format.container === "mp4" || format.container === "webm") {
      availableFormats.add(format.container);
    }

    const quality = format.qualityLabel?.replace(/\s+/g, "") as VideoQuality | undefined;
    if (quality && YOUTUBE_QUALITY_ORDER.includes(quality)) {
      availableQualities.add(quality);
    }
  }

  if (availableFormats.size === 0) {
    availableFormats.add("mp4");
  }

  if (availableQualities.size === 0) {
    availableQualities.add("source");
  } else {
    availableQualities.add("source");
  }

  await cleanupGeneratedPlayerScripts();
  return {
    title,
    durationSec,
    thumbnailUrl,
    availableFormats: Array.from(availableFormats),
    availableQualities: Array.from(availableQualities),
  };
}

export async function resolveYoutubeDownload(url: string, format: VideoFormat, quality: VideoQuality) {
  await cleanupGeneratedPlayerScripts();
  if (format === "mp3") {
    throw new Error("MP3 conversion for YouTube is not supported.");
  }

  const filter = "audioandvideo";

  let stream: ReturnType<typeof ytdl>;
  if (quality === "source") {
    stream = ytdl(url, { quality: "highest", filter });
  } else {
    const info = await ytdl.getInfo(url);
    const candidate = info.formats.find(
      (item) =>
        item.qualityLabel?.replace(/\s+/g, "") === quality &&
        item.container === format &&
        item.hasAudio &&
        item.hasVideo
    );

    stream = ytdl(url, { quality: candidate?.itag ?? "highest", filter });
  }

  const fileExtension = format;
  await cleanupGeneratedPlayerScripts();
  return { stream, fileExtension };
}

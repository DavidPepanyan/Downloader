import type { VideoFormat } from "@/types/video";

const DIRECT_FORMAT_EXTENSIONS: VideoFormat[] = ["mp4", "webm", "mp3"];

export function getFileExtension(pathname: string): VideoFormat | null {
  const parts = pathname.split(".");
  if (parts.length < 2) return null;
  const ext = parts[parts.length - 1]?.toLowerCase();

  if (ext === "mp4" || ext === "webm" || ext === "mp3") {
    return ext;
  }

  return null;
}

export function isDirectMediaUrl(pathname: string): boolean {
  const ext = getFileExtension(pathname);
  return Boolean(ext && DIRECT_FORMAT_EXTENSIONS.includes(ext));
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

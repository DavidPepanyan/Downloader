import type { Readable } from "node:stream";

import { getFileExtension, isDirectMediaUrl, normalizeFileTitle } from "@/lib/download/direct";
import { getYoutubeVideoInfo, resolveYoutubeDownload } from "@/lib/download/youtube/adapter";
import { isYoutubeUrl } from "@/lib/download/youtube/normalize-url";
import type { VideoFormat, VideoQuality, VideoSourceType } from "@/types/video";

export { getFileExtension, normalizeFileTitle };

export function detectVideoSource(url: URL): VideoSourceType | null {
  if (isYoutubeUrl(url)) {
    return "youtube";
  }

  if (isDirectMediaUrl(url.pathname)) {
    return "direct";
  }

  return null;
}

export { getYoutubeVideoInfo };

export async function resolveYoutubeDownloadStream(
  url: string,
  format: VideoFormat,
  quality: VideoQuality
): Promise<{ stream: Readable; fileExtension: VideoFormat }> {
  return resolveYoutubeDownload(url, format, quality);
}

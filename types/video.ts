export type VideoFormat = "mp4" | "webm" | "mp3";
export type VideoQuality = "source" | "1080p" | "720p" | "480p" | "360p";
export type VideoSourceType = "direct" | "youtube";

export type VideoInfoRequest = {
  url: string;
};

export type VideoInfoData = {
  sourceType: VideoSourceType;
  title: string;
  sourceUrl: string;
  sourceHost: string;
  sourceExtension: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
  availableFormats: VideoFormat[];
  availableQualities: VideoQuality[];
};

export type VideoDownloadRequest = {
  url: string;
  format: VideoFormat;
  quality: VideoQuality;
};

export type VideoFormat = "mp4" | "webm" | "mp3";
export type VideoQuality = "source" | "1080p" | "720p" | "480p" | "360p";

export type VideoInfoRequest = {
  url: string;
};

export type VideoInfoData = {
  title: string;
  sourceUrl: string;
  sourceHost: string;
  sourceExtension: string | null;
  thumbnailUrl: null;
  durationSec: null;
  availableFormats: VideoFormat[];
  availableQualities: VideoQuality[];
};

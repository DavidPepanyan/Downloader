import type { ImageFormat } from "@/types/image";
import type { VideoFormat, VideoQuality } from "@/types/video";

export const VIDEO_FORMATS: VideoFormat[] = ["mp4", "webm", "mp3"];
export const VIDEO_QUALITIES: VideoQuality[] = [
  "source",
  "1080p",
  "720p",
  "480p",
  "360p",
];

export const IMAGE_FORMATS: ImageFormat[] = ["jpg", "jpeg", "png", "webp"];

export type ImageFormat = "jpg" | "jpeg" | "png" | "webp";

export type ImageUploadData = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type ImageConvertRequest = {
  format: ImageFormat;
  quality: number;
  width?: number;
  height?: number;
};

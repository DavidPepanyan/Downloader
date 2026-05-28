export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INVALID_URL"
  | "UNSUPPORTED_SOURCE"
  | "UNSUPPORTED_FORMAT"
  | "DOWNLOAD_FAILED"
  | "METHOD_NOT_ALLOWED"
  | "INTERNAL_ERROR";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: ApiError;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

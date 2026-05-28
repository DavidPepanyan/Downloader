import { NextResponse } from "next/server";

import type { ApiErrorCode, ApiResponse } from "@/types/api";

export function ok<T>(data: T, status = 200) {
  const payload: ApiResponse<T> = { ok: true, data };
  return NextResponse.json(payload, { status });
}

export function fail(code: ApiErrorCode, message: string, status: number) {
  const payload: ApiResponse<never> = {
    ok: false,
    error: { code, message },
  };
  return NextResponse.json(payload, { status });
}

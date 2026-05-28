import type { NextRequest } from "next/server";

import { ENV } from "@/lib/utils/env";

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

function getClientIdentifier(request: Request | NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function cleanupExpired(now: number) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  request: Request | NextRequest,
  scope: string
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  cleanupExpired(now);

  const key = `${scope}:${getClientIdentifier(request)}`;
  const current = store.get(key);
  const windowMs = ENV.rateLimitWindowMs;
  const maxRequests = ENV.rateLimitMaxRequests;

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true };
}

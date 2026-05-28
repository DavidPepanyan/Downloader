export const LIMITS = {
  requestTimeoutMs: 30_000,
  maxVideoDurationSec: 1_800,
  maxVideoFileSizeMb: 500,
  maxImageFileSizeMb: 20,
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 30,
} as const;

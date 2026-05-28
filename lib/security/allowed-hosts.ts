import { ENV } from "@/lib/utils/env";

function isIpAddress(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((value) => Number.parseInt(value, 10));
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) return false;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === "localhost" || lower === "::1" || lower.endsWith(".local");
}

export function isDirectHostAllowed(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  if (!normalized) return false;
  if (isLocalHostname(normalized)) return false;
  if (isIpAddress(normalized) && isPrivateIpv4(normalized)) return false;

  if (ENV.allowedHosts.length === 0) {
    return true;
  }

  return ENV.allowedHosts.some(
    (host) => normalized === host || normalized.endsWith(`.${host}`)
  );
}

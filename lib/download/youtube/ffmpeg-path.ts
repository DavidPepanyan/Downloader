import { access } from "node:fs/promises";
import path from "node:path";

import { ENV } from "@/lib/utils/env";

let resolveFfmpegPromise: Promise<string | null> | null = null;

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getBundledFfmpegPath(): string {
  const fileName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  return path.join(process.cwd(), "node_modules", "ffmpeg-static", fileName);
}

async function resolveBundledFfmpegPath(): Promise<string | null> {
  const cwdPath = getBundledFfmpegPath();
  if (await pathExists(cwdPath)) {
    return cwdPath;
  }

  try {
    const ffmpegStatic = await import("ffmpeg-static");
    const binaryPath = typeof ffmpegStatic.default === "string" ? ffmpegStatic.default : null;
    if (!binaryPath) return null;
    return (await pathExists(binaryPath)) ? binaryPath : null;
  } catch {
    return null;
  }
}

/** Path to ffmpeg binary for yt-dlp merge, or null to use PATH. */
export async function resolveFfmpegPath(): Promise<string | null> {
  if (!resolveFfmpegPromise) {
    resolveFfmpegPromise = (async () => {
      if (ENV.ffmpegPath) {
        return (await pathExists(ENV.ffmpegPath)) ? ENV.ffmpegPath : null;
      }
      return resolveBundledFfmpegPath();
    })();
  }

  return resolveFfmpegPromise;
}

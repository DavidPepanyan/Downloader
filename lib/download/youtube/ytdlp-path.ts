import { access } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { ENV } from "@/lib/utils/env";

let ensureBinaryPromise: Promise<string> | null = null;

function getBundledYtdlpPath(): string {
  const fileName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  return path.join(process.cwd(), "node_modules", "@distube", "yt-dlp", "bin", fileName);
}

function getBundledDownloadScriptPath(): string {
  return path.join(process.cwd(), "node_modules", "@distube", "yt-dlp", "script", "download.js");
}

async function downloadBundledYtdlpBinary(): Promise<void> {
  const scriptPath = getBundledDownloadScriptPath();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: "pipe",
      windowsHide: true,
    });

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `yt-dlp binary download failed with code ${code ?? "unknown"}.`));
    });
  });
}

export function resolveYtdlpPath(): string {
  return ENV.ytdlpPath || getBundledYtdlpPath();
}

export async function ensureYtdlpBinary(): Promise<string> {
  if (!ensureBinaryPromise) {
    ensureBinaryPromise = (async () => {
      const binaryPath = resolveYtdlpPath();
      try {
        await access(binaryPath);
        return binaryPath;
      } catch {
        await downloadBundledYtdlpBinary();
        await access(binaryPath);
        return binaryPath;
      }
    })();
  }

  return ensureBinaryPromise;
}

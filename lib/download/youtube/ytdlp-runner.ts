import { spawn } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";

import { RequestTimeoutError } from "@/lib/utils/errors";
import { YtdlpError } from "@/lib/download/youtube/errors";
import { ensureYtdlpBinary } from "@/lib/download/youtube/ytdlp-path";

export type YtdlpMergedDownload = {
  stream: Readable;
  byteLength: number;
};

const FILE_LOOKUP_RETRIES = 6;
const FILE_LOOKUP_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runYtdlpJson<T>(url: string, optionArgs: string[], timeoutMs: number): Promise<T> {
  const binaryPath = await ensureYtdlpBinary();
  const args = [url, ...optionArgs];

  return new Promise<T>((resolve, reject) => {
    const child = spawn(binaryPath, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new RequestTimeoutError("Metadata request timed out."));
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout) as T);
        } catch {
          reject(new YtdlpError("Invalid metadata response from yt-dlp.", stderr));
        }
        return;
      }
      reject(new YtdlpError(stderr || stdout || "yt-dlp metadata failed.", stderr));
    });
  });
}

type YtdlpRunResult = {
  stderr: string;
};

function runYtdlpToDirectory(
  url: string,
  optionArgs: string[],
  outputDir: string,
  timeoutMs: number
): Promise<YtdlpRunResult> {
  const outputDirPosix = outputDir.replace(/\\/g, "/");
  const outputTemplate = "media.%(ext)s";

  return ensureYtdlpBinary().then((resolvedBinary) => {
    const args = [
      url,
      ...optionArgs,
      "-P",
      `home:${outputDirPosix}`,
      "-o",
      outputTemplate,
    ];

    return new Promise<YtdlpRunResult>((resolve, reject) => {
      const child = spawn(resolvedBinary, args, { windowsHide: true });
      const stderrChunks: string[] = [];

      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new RequestTimeoutError("Download timed out."));
      }, timeoutMs);

      child.stderr?.on("data", (chunk: Buffer) => {
        stderrChunks.push(chunk.toString());
      });

      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const stderr = stderrChunks.join("");
        if (code === 0) {
          resolve({ stderr });
          return;
        }
        reject(new YtdlpError(stderr || "yt-dlp download failed.", stderr));
      });
    });
  });
}

function isYtdlpFragmentFile(name: string): boolean {
  return /\.f\d+\./i.test(name);
}

async function listOutputDir(outputDir: string): Promise<string[]> {
  try {
    return await readdir(outputDir);
  } catch {
    return [];
  }
}

async function findMergedMediaFile(outputDir: string, expectedExt: string): Promise<string> {
  const exactPath = path.join(outputDir, `media.${expectedExt}`);
  try {
    const exactStat = await stat(exactPath);
    if (exactStat.isFile() && exactStat.size > 0) {
      return exactPath;
    }
  } catch {
    // fall through
  }

  const entries = await readdir(outputDir, { withFileTypes: true });
  const candidates: { filePath: string; size: number }[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (isYtdlpFragmentFile(entry.name)) continue;

    const extension = path.extname(entry.name).slice(1).toLowerCase();
    if (extension !== expectedExt) continue;

    const filePath = path.join(outputDir, entry.name);
    const fileStat = await stat(filePath);
    if (fileStat.size <= 0) continue;

    candidates.push({ filePath, size: fileStat.size });
  }

  if (candidates.length === 0) {
    const listing = await listOutputDir(outputDir);
    throw new YtdlpError(
      `yt-dlp did not produce a merged ${expectedExt} file. Found: ${listing.join(", ") || "(empty)"}.`
    );
  }

  candidates.sort((a, b) => b.size - a.size);
  return candidates[0].filePath;
}

async function findMergedMediaFileWithRetry(
  outputDir: string,
  expectedExt: string
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < FILE_LOOKUP_RETRIES; attempt += 1) {
    try {
      return await findMergedMediaFile(outputDir, expectedExt);
    } catch (error) {
      lastError = error;
      if (attempt < FILE_LOOKUP_RETRIES - 1) {
        await sleep(FILE_LOOKUP_DELAY_MS);
      }
    }
  }

  throw lastError;
}

export async function createYtdlpMergedFileStream(
  url: string,
  optionArgs: string[],
  timeoutMs: number,
  expectedExt: string
): Promise<YtdlpMergedDownload> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "ytdlp-"));

  try {
    const { stderr } = await runYtdlpToDirectory(url, optionArgs, tempDir, timeoutMs);

    const filePath = await findMergedMediaFileWithRetry(tempDir, expectedExt);
    const data = await readFile(filePath);

    if (data.byteLength === 0) {
      throw new YtdlpError("Downloaded file is empty.", stderr);
    }

    return {
      stream: Readable.from(data),
      byteLength: data.byteLength,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

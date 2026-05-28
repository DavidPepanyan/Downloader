import { spawn } from "node:child_process";
import { Readable } from "node:stream";

import { RequestTimeoutError } from "@/lib/utils/errors";
import { YtdlpError } from "@/lib/download/youtube/errors";
import { ensureYtdlpBinary } from "@/lib/download/youtube/ytdlp-path";

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

export async function createYtdlpStdoutStream(
  url: string,
  optionArgs: string[],
  timeoutMs: number
): Promise<Readable> {
  const binaryPath = await ensureYtdlpBinary();
  const args = [url, ...optionArgs];
  const child = spawn(binaryPath, args, { windowsHide: true });
  const stdout = child.stdout;
  const stderrChunks: string[] = [];

  if (!stdout) {
    child.kill("SIGKILL");
    throw new YtdlpError("yt-dlp did not provide stdout stream.");
  }

  const timer = setTimeout(() => {
    child.kill("SIGKILL");
  }, timeoutMs);

  child.stderr?.on("data", (chunk: Buffer) => {
    stderrChunks.push(chunk.toString());
  });

  const stream = new Readable({
    read() {},
  });

  stdout.on("data", (chunk: Buffer) => {
    stream.push(chunk);
  });

  const finalize = (error?: Error) => {
    clearTimeout(timer);
    if (error) {
      stream.destroy(error);
      return;
    }
    stream.push(null);
  };

  child.on("error", (error) => {
    finalize(error);
  });

  child.on("close", (code) => {
    if (code === 0) {
      finalize();
      return;
    }
    const stderr = stderrChunks.join("");
    finalize(new YtdlpError(stderr || "yt-dlp download failed.", stderr));
  });

  return stream;
}

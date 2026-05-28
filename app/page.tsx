"use client";

import { FormEvent, useMemo, useState } from "react";
import { ClipboardPaste, Download, Link2, Loader2, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ApiErrorPayload = {
  code?: string;
  message?: string;
};

type UiError = {
  code: string;
  message: string;
};

function mapErrorMessage(error: ApiErrorPayload): UiError {
  const code = error.code ?? "UNKNOWN_ERROR";
  const fallbackMessage = error.message ?? "Request failed.";

  if (code === "RATE_LIMITED") {
    const seconds = fallbackMessage.match(/(\d+)s/)?.[1];
    return {
      code,
      message: seconds
        ? `Too many requests right now. Try again in ${seconds} seconds.`
        : "Too many requests right now. Please try again shortly.",
    };
  }

  const friendlyMessages: Record<string, string> = {
    BAD_REQUEST: "Request is invalid. Please check the URL and try again.",
    INVALID_URL: "Please enter a valid URL.",
    FORBIDDEN_HOST: "This direct host is blocked by current security policy.",
    UNSUPPORTED_SOURCE: "This source is unsupported. Use YouTube or a direct media URL.",
    UNSUPPORTED_FORMAT: "This format is not available for the selected media.",
    DOWNLOAD_FAILED: "Download could not be started. Please try again.",
    REQUEST_TIMEOUT: "The request took too long. Please try again.",
    INTERNAL_ERROR: "Unexpected server error. Please try again later.",
  };

  return {
    code,
    message: friendlyMessages[code] ?? fallbackMessage,
  };
}

export default function HomePage() {
  const steps = [
    {
      icon: Link2,
      title: "Copy or prepare your media source",
      description:
        "Use a supported video link such as YouTube or a direct media URL, or prepare an image file for conversion.",
    },
    {
      icon: Download,
      title: "Open the downloader tool",
      description:
        "Go to this website and use the downloader section to start processing your media.",
    },
    {
      icon: ClipboardPaste,
      title: "Paste the link or upload a file",
      description:
        "Paste your media URL into the input field, or upload an image when you need image conversion.",
    },
    {
      icon: SlidersHorizontal,
      title: "Select options and download",
      description:
        "Choose format and quality options, then start processing and download the final result.",
    },
  ];

  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("source");
  const [format, setFormat] = useState("mp4");
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<UiError | null>(null);
  const [result, setResult] = useState<{
    sourceType: "direct" | "youtube";
    title: string;
    sourceHost: string;
    sourceExtension: string | null;
    sourceUrl: string;
    availableFormats: string[];
    availableQualities: string[];
  } | null>(null);

  const isSubmitDisabled = useMemo(() => !url.trim() || isChecking, [url, isChecking]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/video/info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            data: {
              sourceType: "direct" | "youtube";
              title: string;
              sourceHost: string;
              sourceExtension: string | null;
              sourceUrl: string;
              availableFormats: string[];
              availableQualities: string[];
            };
          }
        | {
            ok: false;
            error: ApiErrorPayload;
          };

      if (!response.ok || !payload.ok) {
        setError(
          payload.ok
            ? { code: "UNKNOWN_ERROR", message: "Request failed." }
            : mapErrorMessage(payload.error)
        );
        return;
      }

      setResult({
        sourceType: payload.data.sourceType,
        title: payload.data.title,
        sourceHost: payload.data.sourceHost,
        sourceExtension: payload.data.sourceExtension,
        sourceUrl: payload.data.sourceUrl,
        availableFormats: payload.data.availableFormats,
        availableQualities: payload.data.availableQualities,
      });
      if (payload.data.availableFormats.length > 0) {
        setFormat(payload.data.availableFormats[0]);
      }
      if (payload.data.availableQualities.length > 0) {
        setQuality(payload.data.availableQualities[0]);
      }
    } catch {
      setError({
        code: "NETWORK_ERROR",
        message: "Network error. Please check connection and try again.",
      });
    } finally {
      setIsChecking(false);
    }
  }

  async function handleDownload() {
    if (!result) return;

    setError(null);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/video/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: result.sourceUrl,
          format,
          quality,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || contentType.includes("application/json")) {
        const payload = (await response.json()) as {
          ok: boolean;
          error?: ApiErrorPayload;
          data?: { downloadUrl?: string };
        };

        if (payload?.ok && payload.data?.downloadUrl) {
          window.open(payload.data.downloadUrl, "_blank", "noopener,noreferrer");
          return;
        }

        setError(mapErrorMessage(payload.error ?? { code: "DOWNLOAD_FAILED", message: "Download failed." }));
        return;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${result.title}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError({
        code: "NETWORK_ERROR",
        message: "Network error. Please check connection and try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/40 text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-20 text-center">
        <span className="rounded-full border bg-card px-4 py-1 text-sm text-muted-foreground">
          Fast media downloader
        </span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">Downloader</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Paste a video link and choose your preferred quality and format. The
          system processes the media and prepares it for download. Fast and
          simple extraction in one place. No extra steps required.
        </p>

        <section className="mt-14 w-full max-w-4xl text-left">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-muted-foreground sm:text-base">
            A quick four-step flow designed to stay simple, even when source links
            and formats vary.
          </p>
          <div className="relative mx-auto mt-10 max-w-3xl">
            <div className="absolute left-5 top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-primary/70 via-primary/30 to-transparent" />
            <div className="space-y-7">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={`group relative flex gap-4 rounded-xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    index % 2 === 0 ? "sm:ml-0" : "sm:ml-5"
                  }`}
                >
                  <div className="relative z-10 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow">
                    {index + 1}
                  </div>
                  <div>
                    <div className="mb-1 inline-flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <step.icon className="size-3.5" />
                      Step {index + 1}
                    </div>
                    <h3 className="text-base font-semibold leading-6">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground sm:text-base">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="mt-10 w-full max-w-3xl text-left shadow-sm">
          <CardHeader>
            <CardTitle>Download your media</CardTitle>
            <CardDescription>
              Paste a YouTube or direct media URL, then choose format and quality.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="video-url" className="text-sm font-medium">
                Video URL
              </label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://example.com/video.mp4"
                className="h-11"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quality</label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {(result?.availableQualities ?? ["source", "1080p", "720p", "480p"]).map(
                      (item) => (
                        <SelectItem key={item} value={item}>
                          {item.toUpperCase()}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {(result?.availableFormats ?? ["mp4", "webm", "mp3"]).map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

              <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitDisabled}>
                {isChecking ? <Loader2 className="animate-spin" /> : <Download />}
                {isChecking ? "Checking..." : "Check media"}
              </Button>
            </form>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <p className="font-semibold">{error.code}</p>
                <p className="mt-1">{error.message}</p>
              </div>
            ) : null}

            {result ? (
              <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-sm font-medium">{result.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Source: {result.sourceType.toUpperCase()} | Host: {result.sourceHost} | Format:{" "}
                  {(result.sourceExtension ?? format).toUpperCase()} | Quality: {quality}
                </p>
                <Button
                  type="button"
                  className="mt-3 h-9"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
                  {isDownloading ? "Preparing..." : "Start download"}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

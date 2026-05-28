"use client";

import { FormEvent, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";

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

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("source");
  const [format, setFormat] = useState("mp4");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    sourceHost: string;
    sourceExtension: string | null;
  } | null>(null);

  const isSubmitDisabled = useMemo(() => !url.trim() || isLoading, [url, isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
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
              title: string;
              sourceHost: string;
              sourceExtension: string | null;
            };
          }
        | {
            ok: false;
            error: { message?: string };
          };

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? "Request failed." : payload.error.message ?? "Request failed.");
        return;
      }

      setResult({
        title: payload.data.title,
        sourceHost: payload.data.sourceHost,
        sourceExtension: payload.data.sourceExtension,
      });
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
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

        <Card className="mt-10 w-full max-w-3xl text-left shadow-sm">
          <CardHeader>
            <CardTitle>Download your media</CardTitle>
            <CardDescription>
              Paste a direct media URL, then choose format and quality.
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
                    <SelectItem value="source">Source</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="480p">480p</SelectItem>
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
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="webm">WEBM</SelectItem>
                    <SelectItem value="mp3">MP3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

              <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitDisabled}>
                {isLoading ? <Loader2 className="animate-spin" /> : <Download />}
                {isLoading ? "Checking..." : "Download"}
              </Button>
            </form>

            {errorMessage ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            {result ? (
              <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-sm font-medium">{result.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Host: {result.sourceHost} | Format: {(result.sourceExtension ?? format).toUpperCase()} | Quality: {quality}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

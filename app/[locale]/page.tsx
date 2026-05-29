"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Download, Link2, Loader2, SlidersHorizontal } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ApiErrorPayload = {
  code?: string;
  message?: string;
};

type UiError = {
  code: string;
  message: string;
};

export default function HomePage() {
  const t = useTranslations("home");
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

  const steps = [
    { icon: Link2, title: t("steps.1.title"), description: t("steps.1.description") },
    { icon: Download, title: t("steps.2.title"), description: t("steps.2.description") },
    { icon: ClipboardPaste, title: t("steps.3.title"), description: t("steps.3.description") },
    { icon: SlidersHorizontal, title: t("steps.4.title"), description: t("steps.4.description") },
  ];

  const faqItems = [
    { id: "faq-2", q: t("faq.q2"), a: t("faq.a2") },
    { id: "faq-3", q: t("faq.q3"), a: t("faq.a3") },
    { id: "faq-4", q: t("faq.q4"), a: t("faq.a4") },
    { id: "faq-5", q: t("faq.q5"), a: t("faq.a5") },
    { id: "faq-6", q: t("faq.q6"), a: t("faq.a6") },
    { id: "faq-7", q: t("faq.q7"), a: t("faq.a7") },
    { id: "faq-8", q: t("faq.q8"), a: t("faq.a8") },
  ];

  const isSubmitDisabled = useMemo(() => !url.trim() || isChecking, [url, isChecking]);

  function mapErrorMessage(errorPayload: ApiErrorPayload): UiError {
    const code = errorPayload.code ?? "UNKNOWN_ERROR";
    const fallbackMessage = errorPayload.message ?? t("errors.requestFailed");

    if (code === "RATE_LIMITED") {
      const seconds = fallbackMessage.match(/(\d+)s/)?.[1];
      return {
        code,
        message: seconds
          ? t("errors.rateLimitedWithSeconds", { seconds })
          : t("errors.rateLimited"),
      };
    }

    const friendlyMessages: Record<string, string> = {
      BAD_REQUEST: t("errors.badRequest"),
      INVALID_URL: t("errors.invalidUrl"),
      FORBIDDEN_HOST: t("errors.forbiddenHost"),
      UNSUPPORTED_SOURCE: t("errors.unsupportedSource"),
      UNSUPPORTED_FORMAT: t("errors.unsupportedFormat"),
      FILE_TOO_LARGE: t("errors.fileTooLarge"),
      DOWNLOAD_FAILED: t("errors.downloadFailed"),
      REQUEST_TIMEOUT: t("errors.requestTimeout"),
      INTERNAL_ERROR: t("errors.internalError"),
    };

    return { code, message: friendlyMessages[code] ?? fallbackMessage };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/video/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const payload = (await response.json()) as
        | { ok: true; data: NonNullable<typeof result> }
        | { ok: false; error: ApiErrorPayload };

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? { code: "UNKNOWN_ERROR", message: t("errors.requestFailed") } : mapErrorMessage(payload.error));
        return;
      }

      setResult(payload.data);
      if (payload.data.availableFormats.length > 0) setFormat(payload.data.availableFormats[0]);
      if (payload.data.availableQualities.length > 0) setQuality(payload.data.availableQualities[0]);
    } catch {
      setError({ code: "NETWORK_ERROR", message: t("errors.networkError") });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.sourceUrl, format, quality }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || contentType.includes("application/json")) {
        const payload = (await response.json()) as {
          ok: boolean;
          error?: ApiErrorPayload;
          data?: { downloadUrl?: string };
        };

        if (payload.ok && payload.data?.downloadUrl) {
          window.open(payload.data.downloadUrl, "_blank", "noopener,noreferrer");
          return;
        }

        setError(mapErrorMessage(payload.error ?? { code: "DOWNLOAD_FAILED", message: t("errors.downloadFailed") }));
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
      setError({ code: "NETWORK_ERROR", message: t("errors.networkError") });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/40 text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-20 text-center">
        <span className="rounded-full border bg-card px-4 py-1 text-sm text-muted-foreground">{t("badge")}</span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">{t("title")}</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t("description")}</p>

        <section className="mt-14 w-full max-w-4xl text-left">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{t("howItWorks.title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-7 text-muted-foreground sm:text-lg">{t("howItWorks.description")}</p>
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
                      {t("stepLabel", { step: index + 1 })}
                    </div>
                    <h3 className="text-lg font-semibold leading-7">{step.title}</h3>
                    <p className="mt-1 text-base leading-7 text-muted-foreground sm:text-lg">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-14 w-full max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("start.title")}</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">{t("start.description")}</p>
        </div>

        <Card className="mt-8 w-full max-w-3xl text-left shadow-sm">
          <CardHeader>
            <CardTitle>{t("form.title")}</CardTitle>
            <CardDescription>{t("form.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="video-url" className="text-sm font-medium">{t("form.urlLabel")}</label>
                <Input
                  id="video-url"
                  type="url"
                  placeholder={t("form.urlPlaceholder")}
                  className="h-11"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("form.qualityLabel")}</label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder={t("form.selectQuality")} /></SelectTrigger>
                    <SelectContent>
                      {(result?.availableQualities ?? ["source", "1080p", "720p", "480p"]).map((item) => (
                        <SelectItem key={item} value={item}>{item.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("form.formatLabel")}</label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder={t("form.selectFormat")} /></SelectTrigger>
                    <SelectContent>
                      {(result?.availableFormats ?? ["mp4", "webm", "mp3"]).map((item) => (
                        <SelectItem key={item} value={item}>{item.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitDisabled}>
                {isChecking ? <Loader2 className="animate-spin" /> : <Download />}
                {isChecking ? t("form.checking") : t("form.checkMedia")}
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
                  {t("result.source")}: {result.sourceType.toUpperCase()} | {t("result.host")}: {result.sourceHost} | {t("result.format")}: {(result.sourceExtension ?? format).toUpperCase()} | {t("result.quality")}: {quality}
                </p>
                <Button type="button" className="mt-3 h-9" onClick={handleDownload} disabled={isDownloading}>
                  {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
                  {isDownloading ? t("form.preparing") : t("form.startDownload")}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <section className="mt-14 w-full max-w-3xl text-left">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{t("faq.title")}</h2>
          <div className="mt-7 rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-semibold">{t("faq.q1")}</h3>
            <p className="mt-2 text-base leading-7 text-muted-foreground sm:text-lg">{t("faq.a1")}</p>
          </div>
          <Accordion type="single" collapsible className="mt-4 rounded-xl border bg-card px-5 shadow-sm">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </section>
    </main>
  );
}

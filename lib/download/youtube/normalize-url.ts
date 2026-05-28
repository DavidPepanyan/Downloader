export function isYoutubeHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "youtu.be") return true;
  return host === "youtube.com" || host.endsWith(".youtube.com");
}

export function extractYoutubeVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();

  if (host === "youtu.be" || host.endsWith(".youtu.be")) {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ?? null;
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery) return fromQuery;

  const shortsMatch = url.pathname.match(/^\/shorts\/([^/]+)/);
  if (shortsMatch?.[1]) return shortsMatch[1];

  const embedMatch = url.pathname.match(/^\/embed\/([^/]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  return null;
}

export function normalizeYoutubeUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  if (!isYoutubeHost(parsed.hostname)) {
    throw new Error("Not a YouTube URL.");
  }

  const videoId = extractYoutubeVideoId(parsed);
  if (!videoId) {
    throw new Error("Could not extract YouTube video id.");
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function isYoutubeUrl(url: URL): boolean {
  return isYoutubeHost(url.hostname) && extractYoutubeVideoId(url) !== null;
}

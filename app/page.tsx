import { Download } from "lucide-react";

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
            <div className="space-y-2">
              <label htmlFor="video-url" className="text-sm font-medium">
                Video URL
              </label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://example.com/video.mp4"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quality</label>
                <Select defaultValue="source">
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
                <Select defaultValue="mp4">
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

            <Button type="button" size="lg" className="h-11 w-full">
              <Download />
              Download
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

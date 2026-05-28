"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Globe, Moon, Sun } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDarkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolvedTheme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : isDarkPreferred
          ? "dark"
          : "light";

    setTheme(resolvedTheme);
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  return (
    <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/photos/logo.ico"
              alt="Downloader logo"
              className="h-9 w-9 rounded-md"
            />
            <span className="text-lg font-semibold tracking-tight">Downloader</span>
          </Link>

          <div className="relative">
            <details>
              <summary
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-8 cursor-pointer list-none gap-1 px-2 text-sm font-medium text-foreground marker:content-none hover:text-foreground"
                )}
              >
                More
                <ChevronDown className="size-4" />
              </summary>
              <div className="absolute left-0 z-50 mt-2 w-48 rounded-xl border bg-card p-2 shadow-md">
                <Link
                  href="/privacy"
                  className="block rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  Privacy Policy
                </Link>
              </div>
            </details>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
          <Globe className="size-4 text-foreground/80" />
        </div>
      </div>
    </header>
  );
}

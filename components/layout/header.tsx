"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Globe, Moon, Sun } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Header() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-8 gap-1 px-2 text-sm font-medium text-foreground hover:text-foreground"
                )}
              >
                More
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/privacy">Privacy Policy</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/terms">Terms of Use</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dmca">Copyright &amp; DMCA</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? (
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

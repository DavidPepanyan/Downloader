"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Globe, Moon, Sun } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/src/i18n/navigation";

export function Header() {
  const t = useTranslations("layout.header");
  const locale = useLocale();
  const pathname = usePathname();

  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  return (
    <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/photos/logo.ico" alt="Downloader logo" width={36} height={36} className="rounded-md" />
            <span className="text-lg font-semibold tracking-tight">{t("brand")}</span>
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
                {t("more")}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/privacy">{t("privacy")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/terms">{t("terms")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dmca">{t("dmca")}</Link>
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
            <Sun className="hidden size-4 dark:block" />
            <Moon className="size-4 dark:hidden" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                <Globe className="size-4 text-foreground/80" />
                <span className="text-xs uppercase">{locale}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={pathname} locale="en">English</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={pathname} locale="ru">Русский</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={pathname} locale="hy">Հայերեն</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

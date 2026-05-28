"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";

export function Footer() {
  const t = useTranslations("layout.footer");
  const legalLinks = [
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
    { href: "/dmca", label: t("dmca") },
  ] as const;

  return (
    <footer className="border-t bg-background/95">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <Image src="/photos/logo.ico" alt="Downloader logo" width={36} height={36} className="rounded-md" />
          <div>
            <p className="text-lg font-semibold tracking-tight">{t("brand")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </div>

        <div className="sm:justify-self-end">
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
            {t("legal")}
          </p>
          <nav className="mt-3 flex flex-col gap-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

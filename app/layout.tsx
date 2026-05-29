import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getSiteBaseUrl } from "@/lib/site/base-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteBaseUrl()),
  icons: {
    icon: "/photos/logo.ico",
    shortcut: "/photos/logo.ico",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};
export default function RootLayout({ children }: RootLayoutProps) {
  const themeInitScript = `
    (function () {
      try {
        var saved = localStorage.getItem('theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = saved ? saved === 'dark' : prefersDark;
        document.documentElement.classList.toggle('dark', isDark);
      } catch (e) {}
    })();
  `;

  return (
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

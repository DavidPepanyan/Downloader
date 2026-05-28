import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { defaultLocale } from "./src/i18n/config";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacy", destination: `/${defaultLocale}/privacy`, permanent: true },
      { source: "/terms", destination: `/${defaultLocale}/terms`, permanent: true },
      { source: "/dmca", destination: `/${defaultLocale}/dmca`, permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);

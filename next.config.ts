import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { routing } from "./src/i18n/routing";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacy", destination: `/${routing.defaultLocale}/privacy`, permanent: true },
      { source: "/terms", destination: `/${routing.defaultLocale}/terms`, permanent: true },
      { source: "/dmca", destination: `/${routing.defaultLocale}/dmca`, permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);

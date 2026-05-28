import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacy", destination: "/en/privacy", permanent: true },
      { source: "/terms", destination: "/en/terms", permanent: true },
      { source: "/dmca", destination: "/en/dmca", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);

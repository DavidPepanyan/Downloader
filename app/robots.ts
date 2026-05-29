import type { MetadataRoute } from "next";

import { getSiteBaseUrl } from "@/lib/site/base-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${getSiteBaseUrl()}/sitemap.xml`,
  };
}

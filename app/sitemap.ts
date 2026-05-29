import type { MetadataRoute } from "next";

import { getSiteBaseUrl } from "@/lib/site/base-url";
import { defaultLocale } from "@/src/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${getSiteBaseUrl()}/${defaultLocale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}

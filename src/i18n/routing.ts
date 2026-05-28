import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "@/src/i18n/config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

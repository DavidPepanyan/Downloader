import createMiddleware from "next-intl/middleware";
import { routing } from "@/src/i18n/routing";

const proxy = createMiddleware(routing);

export default proxy;

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};

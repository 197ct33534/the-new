import { siteConfig } from "@/config/site";

/** URL gốc (không dấu / cuối) — AUTH_URL, NEXT_PUBLIC_SITE_URL, hoặc siteConfig. */
export function getSiteBaseUrl() {
  const fromEnv = process.env.AUTH_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return siteConfig.url.replace(/\/$/, "");
}

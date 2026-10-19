import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";

export async function SiteFooter() {
  const t = await getTranslations("site");

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400 sm:px-6">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
        <p>
          <NextLink href={ROUTES.feed} className="text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200">
            {t("rssFeed")}
          </NextLink>
        </p>
      </div>
    </footer>
  );
}

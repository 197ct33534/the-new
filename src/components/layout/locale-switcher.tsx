"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { ROUTES } from "@/constants/routes";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { useArticleLocaleSlugsForHeader } from "./article-locale-context";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const searchParams = useSearchParams();
  const articleSlugs = useArticleLocaleSlugsForHeader();

  const newsQuery = useMemo(() => {
    const o: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      o[k] = v;
    });
    return Object.keys(o).length ? o : undefined;
  }, [searchParams]);

  function hrefForLocale(targetLocale: (typeof routing.locales)[number]) {
    if (pathname === "/tin-tuc/[slug]") {
      const viSlug = articleSlugs?.vi ?? (typeof params.slug === "string" ? params.slug : "");
      const enSlug = articleSlugs?.en ?? viSlug;
      const slug = targetLocale === "en" ? enSlug : viSlug;
      return { pathname: "/tin-tuc/[slug]", params: { slug } } as const;
    }
    if (pathname === "/tin-tuc") {
      if (!newsQuery) return ROUTES.news;
      return { pathname: ROUTES.news, query: newsQuery } as const;
    }
    return pathname;
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50/90 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/80">
      <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">{t("label")}</span>
      <nav className="flex gap-0.5" aria-label={t("label")}>
        {routing.locales.map((loc) => (
          <Link
            key={loc}
            href={hrefForLocale(loc)}
            locale={loc}
            className={
              loc === locale
                ? "rounded px-2 py-0.5 font-semibold text-zinc-900 dark:text-zinc-50"
                : "rounded px-2 py-0.5 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }
            hrefLang={loc}
            prefetch={false}
          >
            {loc === "vi" ? t("vi") : t("en")}
          </Link>
        ))}
      </nav>
    </div>
  );
}

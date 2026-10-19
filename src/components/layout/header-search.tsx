"use client";

import { useTranslations } from "next-intl";

type Props = { action: string };

export function HeaderSearch({ action }: Props) {
  const t = useTranslations("nav");

  return (
    <form action={action} method="get" className="hidden min-w-0 flex-1 sm:block sm:max-w-xs md:max-w-sm">
      <label htmlFor="nav-search" className="sr-only">
        {t("searchNews")}
      </label>
      <input
        id="nav-search"
        name="q"
        type="search"
        placeholder={t("searchPlaceholder")}
        autoComplete="off"
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
      />
    </form>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";
import { signOut } from "next-auth/react";

import { ROUTES } from "@/constants/routes";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = {
  email: string | null | undefined;
  showAdminLink: boolean;
};

export function HeaderUserNav({ email, showAdminLink }: Props) {
  const t = useTranslations("nav");
  const locale = useLocale();

  const callbackUrl = locale === routing.defaultLocale ? ROUTES.home : `/${locale}`;

  return (
    <div className="flex max-w-[16rem] flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
      <Link
        href={ROUTES.account}
        className="text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-300 sm:text-sm"
      >
        {t("account")}
      </Link>
      {showAdminLink ? (
        <NextLink
          href="/admin"
          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 sm:text-sm"
        >
          {t("admin")}
        </NextLink>
      ) : null}
      <span
        className="hidden max-w-[10rem] truncate text-xs text-zinc-500 sm:inline dark:text-zinc-400"
        title={email ?? ""}
      >
        {email}
      </span>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl })}
        className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 sm:text-sm"
      >
        {t("signOut")}
      </button>
    </div>
  );
}

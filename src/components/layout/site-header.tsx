import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ROUTES } from "@/constants/routes";
import { siteConfig } from "@/config/site";
import { Link, getPathname } from "@/i18n/navigation";
import { isStaffRole } from "@/lib/permissions";

import { HeaderSearch } from "./header-search";
import { HeaderUserNav } from "./header-user-nav";
import { LocaleSwitcher } from "./locale-switcher";

const navLinkClass =
  "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

export async function SiteHeader() {
  const session = await auth().catch(() => null);
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const newsSearchAction = getPathname({ locale, href: ROUTES.news });

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link
          href={ROUTES.home}
          className="shrink-0 text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          {siteConfig.name}
        </Link>
        <HeaderSearch action={newsSearchAction} />
        <nav
          className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-1 sm:gap-x-6"
          aria-label={t("main")}
        >
          <Suspense
            fallback={
              <div
                className="h-7 w-[4.5rem] shrink-0 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800"
                aria-hidden
              />
            }
          >
            <LocaleSwitcher />
          </Suspense>
          <Link href={ROUTES.news} className={navLinkClass}>
            {t("news")}
          </Link>
          <Link href={ROUTES.schedule} className={navLinkClass}>
            {t("scheduleShort")}
          </Link>
          <Link href={ROUTES.standings} className={navLinkClass}>
            {t("standingsShort")}
          </Link>
          {session?.user ? (
            <HeaderUserNav
              email={session.user.email}
              showAdminLink={isStaffRole(session.user.role)}
            />
          ) : (
            <>
              <Link href={ROUTES.signIn} className={navLinkClass}>
                {t("signIn")}
              </Link>
              <Link href={ROUTES.register} className={navLinkClass}>
                {t("register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

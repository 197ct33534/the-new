import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MatchStatus } from "@prisma/client";

import { ROUTES } from "@/constants/routes";
import { Link } from "@/i18n/navigation";
import { intlLocaleTag } from "@/lib/locale-format";
import { getPublicArticles, toSiteLocale } from "@/lib/public-articles";
import { getUpcomingMatches } from "@/lib/public-matches";

type Params = { locale: string };

export default async function HomePage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const tSite = await getTranslations("site");
  const tStatus = await getTranslations("matchStatus");
  const tag = intlLocaleTag(locale);

  const [articles, matches] = await Promise.all([
    getPublicArticles({ take: 4, locale: toSiteLocale(locale) }),
    getUpcomingMatches(4),
  ]);

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tSite("title")}</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">{tSite("description")}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("featured")}</h2>
          <Link
            href={ROUTES.news}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("viewAll")}
          </Link>
        </div>
        {articles.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noArticles")}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={{ pathname: "/tin-tuc/[slug]", params: { slug: a.slug } }}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  {a.coverImageUrl ? (
                    <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={a.coverImageUrl}
                        alt=""
                        width={640}
                        height={360}
                        className="h-full w-full object-cover transition group-hover:opacity-95"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <p className="text-xs text-zinc-500">{a.category.name}</p>
                    <h3 className="font-semibold leading-snug text-zinc-900 group-hover:underline dark:text-zinc-50">
                      {a.title}
                    </h3>
                    <p className="line-clamp-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">{a.summary}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("upcoming")}</h2>
          <Link
            href={ROUTES.schedule}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("fullSchedule")}
          </Link>
        </div>
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noMatches")}</p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {m.homeTeam.shortName ?? m.homeTeam.name} vs {m.awayTeam.shortName ?? m.awayTeam.name}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  {m.status === MatchStatus.LIVE ? (
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {m.homeScore ?? 0} - {m.awayScore ?? 0}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                    {tStatus(m.status)}
                  </span>
                  <time dateTime={m.kickoffAt.toISOString()}>{new Date(m.kickoffAt).toLocaleString(tag)}</time>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="grid gap-3 sm:grid-cols-3">
        <li>
          <Link
            href={ROUTES.news}
            className="block rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            {t("cardNews")}
          </Link>
        </li>
        <li>
          <Link
            href={ROUTES.schedule}
            className="block rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            {t("cardSchedule")}
          </Link>
        </li>
        <li>
          <Link
            href={ROUTES.standings}
            className="block rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            {t("cardStandings")}
          </Link>
        </li>
      </ul>
    </div>
  );
}

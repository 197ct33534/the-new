import { getTranslations } from "next-intl/server";
import { MatchStatus } from "@prisma/client";

import { DEMO_LEAGUE_NAME } from "@/constants/demo-league";
import { intlLocaleTag } from "@/lib/locale-format";
import { getRecentResults, getUpcomingMatches } from "@/lib/public-matches";

type Params = { locale: string };

function scoreLine(
  tDash: string,
  status: MatchStatus,
  homeScore: number | null,
  awayScore: number | null,
): string {
  if (status === MatchStatus.SCHEDULED || status === MatchStatus.POSTPONED || status === MatchStatus.CANCELLED) {
    return tDash;
  }
  if (homeScore == null || awayScore == null) return tDash;
  return `${homeScore} - ${awayScore}`;
}

export default async function SchedulePage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const t = await getTranslations("schedule");
  const tStatus = await getTranslations("matchStatus");
  const tag = intlLocaleTag(locale);

  const [upcoming, results] = await Promise.all([getUpcomingMatches(24), getRecentResults(16)]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("intro", { league: DEMO_LEAGUE_NAME })}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("upcoming")}</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noUpcoming")}</p>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {upcoming.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-900"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-xs text-zinc-500">
                    {m.league ?? t("dash")}
                    {m.venue ? ` · ${m.venue}` : null}
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    <span className="inline-block min-w-32">{m.homeTeam.name}</span>
                    <span className="px-2 text-zinc-400">{t("vs")}</span>
                    <span>{m.awayTeam.name}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 text-sm">
                  <span
                    className={
                      m.status === MatchStatus.LIVE
                        ? "font-semibold text-red-600 dark:text-red-400"
                        : "text-zinc-600 dark:text-zinc-400"
                    }
                  >
                    {scoreLine(t("dash"), m.status, m.homeScore, m.awayScore)}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {tStatus(m.status)}
                  </span>
                  <time className="text-zinc-500" dateTime={m.kickoffAt.toISOString()}>
                    {new Date(m.kickoffAt).toLocaleString(tag)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("recent")}</h2>
        {results.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noResults")}</p>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {results.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-900"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-xs text-zinc-500">{m.league ?? t("dash")}</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    <span className="inline-block min-w-32">{m.homeTeam.name}</span>
                    <span className="px-2 font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                      {m.homeScore ?? t("dash")} - {m.awayScore ?? t("dash")}
                    </span>
                    <span>{m.awayTeam.name}</span>
                  </p>
                </div>
                <time className="shrink-0 text-sm text-zinc-500" dateTime={m.kickoffAt.toISOString()}>
                  {new Date(m.kickoffAt).toLocaleString(tag)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

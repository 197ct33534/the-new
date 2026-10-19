import { getTranslations } from "next-intl/server";

import { DEMO_LEAGUE_NAME } from "@/constants/demo-league";
import { getStandingsFromFinishedMatches } from "@/lib/public-standings";

export default async function StandingsPage() {
  const t = await getTranslations("standings");

  const rows = await getStandingsFromFinishedMatches(DEMO_LEAGUE_NAME);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("intro", { league: DEMO_LEAGUE_NAME })}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-50">{t("rank")}</th>
                <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-50">{t("team")}</th>
                <th className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">{t("played")}</th>
                <th className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">{t("won")}</th>
                <th className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">{t("drawn")}</th>
                <th className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">{t("lost")}</th>
                <th className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">{t("gf")}</th>
                <th className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">{t("ga")}</th>
                <th className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">{t("gd")}</th>
                <th className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">{t("pts")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.team.id}
                  className="border-b border-zinc-100 bg-white last:border-0 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <td className="px-3 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">{r.team.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{r.played}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{r.won}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{r.drawn}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{r.lost}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{r.goalsFor}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{r.goalsAgainst}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{r.goalDiff}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {r.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

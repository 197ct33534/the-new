import type { Team } from "@prisma/client";
import { MatchStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type StandingRow = {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

/** Tính BXH từ các trận đã kết thúc có tỉ số trong một giải (demo / không cần bảng riêng). */
export async function getStandingsFromFinishedMatches(league: string): Promise<StandingRow[]> {
  const matches = await prisma.match.findMany({
    where: {
      league,
      status: MatchStatus.FINISHED,
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: { homeTeam: true, awayTeam: true },
  });

  const map = new Map<string, StandingRow>();

  function rowFor(team: Team): StandingRow {
    let r = map.get(team.id);
    if (!r) {
      r = {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      };
      map.set(team.id, r);
    }
    return r;
  }

  for (const m of matches) {
    const hs = m.homeScore ?? 0;
    const as = m.awayScore ?? 0;
    const home = rowFor(m.homeTeam);
    const away = rowFor(m.awayTeam);
    home.played += 1;
    away.played += 1;
    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;

    if (hs > as) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (hs < as) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const r of map.values()) {
    r.goalDiff = r.goalsFor - r.goalsAgainst;
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name, "vi");
  });
}

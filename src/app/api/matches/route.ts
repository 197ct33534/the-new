import { MatchStatus, type Match, type Prisma, type Team } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  MATCH_LIST_CACHE_TTL_SECONDS,
  buildMatchListCacheKey,
  getCache,
  setCache,
} from "@/lib/cache";
import { prisma } from "@/lib/prisma";

export type MatchWithTeams = Match & {
  homeTeam: Team;
  awayTeam: Team;
};

export type MatchesApiResponse = {
  matches: MatchWithTeams[];
  meta: { limit: number; status: string | null; league: string | null };
};

function isMatchStatus(value: string | null): value is MatchStatus {
  if (value == null) return false;
  return (Object.values(MatchStatus) as string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.floor(rawLimit)), 50) : 20;
  const statusParam = searchParams.get("status");
  const leagueParam = searchParams.get("league");
  const statusFilter = isMatchStatus(statusParam) ? statusParam : null;
  const league = leagueParam?.trim() ?? "";

  const cacheKey = buildMatchListCacheKey({
    limit: String(limit),
    status: statusFilter ?? "",
    league,
  });

  const cached = await getCache<MatchesApiResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  const where: Prisma.MatchWhereInput = {};
  if (statusFilter) where.status = statusFilter;
  if (league) where.league = league;

  const matches = await prisma.match.findMany({
    where,
    take: limit,
    orderBy: { kickoffAt: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  const payload: MatchesApiResponse = {
    matches,
    meta: {
      limit,
      status: statusFilter,
      league: league || null,
    },
  };

  await setCache(cacheKey, payload, MATCH_LIST_CACHE_TTL_SECONDS);

  return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
}

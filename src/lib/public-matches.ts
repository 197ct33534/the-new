import { MatchStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function matchStatusLabel(status: MatchStatus) {
  switch (status) {
    case MatchStatus.SCHEDULED:
      return "Sắp đá";
    case MatchStatus.LIVE:
      return "Đang diễn ra";
    case MatchStatus.FINISHED:
      return "Kết thúc";
    case MatchStatus.POSTPONED:
      return "Hoãn";
    case MatchStatus.CANCELLED:
      return "Huỷ";
    default:
      return status;
  }
}

const teamInclude = { homeTeam: true, awayTeam: true } as const;

export type PublicMatchListItem = Prisma.MatchGetPayload<{ include: typeof teamInclude }>;

function sortUpcoming(a: PublicMatchListItem, b: PublicMatchListItem) {
  if (a.status === MatchStatus.LIVE && b.status !== MatchStatus.LIVE) return -1;
  if (b.status === MatchStatus.LIVE && a.status !== MatchStatus.LIVE) return 1;
  return a.kickoffAt.getTime() - b.kickoffAt.getTime();
}

/** Trận sắp diễn ra / đang đá (ưu tiên LIVE, sắp xếp theo giờ). */
export async function getUpcomingMatches(limit = 8) {
  const now = new Date();
  const rows = await prisma.match.findMany({
    where: {
      OR: [
        { status: MatchStatus.LIVE },
        {
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.POSTPONED] },
          kickoffAt: { gte: new Date(now.getTime() - 36 * 60 * 60 * 1000) },
        },
      ],
    },
    include: teamInclude,
  });
  return rows.sort(sortUpcoming).slice(0, limit);
}

/** Kết quả gần đây. */
export async function getRecentResults(limit = 12) {
  return prisma.match.findMany({
    where: { status: MatchStatus.FINISHED },
    orderBy: { kickoffAt: "desc" },
    take: limit,
    include: teamInclude,
  });
}

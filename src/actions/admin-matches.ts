"use server";

import { MatchStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { revalidatePublicPaths } from "@/lib/revalidate-public";
import { z } from "zod";

import { requireStaffSession } from "@/lib/auth-session";
import { canReviewOrPublish } from "@/lib/permissions";
import { uniqueMatchSlug } from "@/lib/match-slug";
import { prisma } from "@/lib/prisma";

export const ADMIN_MATCHES_PAGE_SIZE = 25;

export async function listAdminMatches(input?: { page?: number }) {
  await requireStaffSession();
  const pageSize = ADMIN_MATCHES_PAGE_SIZE;
  const page = Math.max(1, Math.floor(input?.page ?? 1));
  const [items, total] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoffAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        homeTeam: { select: { name: true, shortName: true } },
        awayTeam: { select: { name: true, shortName: true } },
      },
    }),
    prisma.match.count(),
  ]);
  return { items, total, page, pageSize };
}

const createMatchSchema = z.object({
  homeTeamId: z.string().cuid(),
  awayTeamId: z.string().cuid(),
  league: z.string().max(200).optional().or(z.literal("")),
  venue: z.string().max(200).optional().or(z.literal("")),
  kickoffAt: z.string().min(1),
  status: z.nativeEnum(MatchStatus),
  homeScore: z.coerce.number().int().min(0).optional().nullable(),
  awayScore: z.coerce.number().int().min(0).optional().nullable(),
});

export async function createAdminMatch(data: z.infer<typeof createMatchSchema>) {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) {
    return { ok: false as const, error: "Chỉ biên tập / quản trị mới thêm trận." };
  }
  const parsed = createMatchSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: "Dữ liệu không hợp lệ." };
  }
  const d = parsed.data;
  if (d.homeTeamId === d.awayTeamId) {
    return { ok: false as const, error: "Hai đội phải khác nhau." };
  }
  const kickoff = new Date(d.kickoffAt);
  if (Number.isNaN(kickoff.getTime())) {
    return { ok: false as const, error: "Thời gian thi đấu không hợp lệ." };
  }
  const [home, away] = await Promise.all([
    prisma.team.findUnique({ where: { id: d.homeTeamId }, select: { slug: true } }),
    prisma.team.findUnique({ where: { id: d.awayTeamId }, select: { slug: true } }),
  ]);
  if (!home || !away) {
    return { ok: false as const, error: "Không tìm thấy đội." };
  }
  const base = `${home.slug}-vs-${away.slug}-${kickoff.toISOString().slice(0, 16)}`;
  const slug = await uniqueMatchSlug(prisma, base);
  const clearScores =
    d.status === MatchStatus.SCHEDULED ||
    d.status === MatchStatus.POSTPONED ||
    d.status === MatchStatus.CANCELLED;
  await prisma.match.create({
    data: {
      slug,
      league: d.league?.trim() || null,
      venue: d.venue?.trim() || null,
      kickoffAt: kickoff,
      status: d.status,
      homeTeamId: d.homeTeamId,
      awayTeamId: d.awayTeamId,
      homeScore: clearScores ? null : d.homeScore ?? null,
      awayScore: clearScores ? null : d.awayScore ?? null,
    },
  });
  revalidatePublicPaths("/lich-thi-dau");
  revalidatePublicPaths("/bang-xep-hang");
  revalidatePath("/admin/tran-dau");
  return { ok: true as const };
}

const updateMatchSchema = createMatchSchema.extend({ id: z.string().cuid() });

export async function updateAdminMatch(data: z.infer<typeof updateMatchSchema>) {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) {
    return { ok: false as const, error: "Chỉ biên tập / quản trị mới sửa trận." };
  }
  const parsed = updateMatchSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: "Dữ liệu không hợp lệ." };
  }
  const d = parsed.data;
  if (d.homeTeamId === d.awayTeamId) {
    return { ok: false as const, error: "Hai đội phải khác nhau." };
  }
  const kickoff = new Date(d.kickoffAt);
  if (Number.isNaN(kickoff.getTime())) {
    return { ok: false as const, error: "Thời gian thi đấu không hợp lệ." };
  }
  const [current, home, away] = await Promise.all([
    prisma.match.findUnique({ where: { id: d.id }, select: { id: true } }),
    prisma.team.findUnique({ where: { id: d.homeTeamId }, select: { slug: true } }),
    prisma.team.findUnique({ where: { id: d.awayTeamId }, select: { slug: true } }),
  ]);
  if (!current) {
    return { ok: false as const, error: "Không tìm thấy trận." };
  }
  if (!home || !away) {
    return { ok: false as const, error: "Không tìm thấy đội." };
  }
  const base = `${home.slug}-vs-${away.slug}-${kickoff.toISOString().slice(0, 16)}`;
  const slug = await uniqueMatchSlug(prisma, base, d.id);
  const clearScores =
    d.status === MatchStatus.SCHEDULED ||
    d.status === MatchStatus.POSTPONED ||
    d.status === MatchStatus.CANCELLED;
  await prisma.match.update({
    where: { id: d.id },
    data: {
      slug,
      league: d.league?.trim() || null,
      venue: d.venue?.trim() || null,
      kickoffAt: kickoff,
      status: d.status,
      homeTeamId: d.homeTeamId,
      awayTeamId: d.awayTeamId,
      homeScore: clearScores ? null : d.homeScore ?? null,
      awayScore: clearScores ? null : d.awayScore ?? null,
    },
  });
  revalidatePublicPaths("/lich-thi-dau");
  revalidatePublicPaths("/bang-xep-hang");
  revalidatePath("/admin/tran-dau");
  return { ok: true as const };
}

export async function deleteAdminMatch(id: string) {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) {
    return { ok: false as const, error: "Chỉ biên tập / quản trị mới xoá trận." };
  }
  if (typeof id !== "string" || !id) {
    return { ok: false as const, error: "Thiếu mã trận." };
  }
  const linked = await prisma.article.count({ where: { matchId: id } });
  if (linked > 0) {
    return {
      ok: false as const,
      error: `Không thể xoá: còn ${linked} bài viết gắn với trận này.`,
    };
  }
  await prisma.match.delete({ where: { id } });
  revalidatePublicPaths("/lich-thi-dau");
  revalidatePublicPaths("/bang-xep-hang");
  revalidatePath("/admin/tran-dau");
  return { ok: true as const };
}

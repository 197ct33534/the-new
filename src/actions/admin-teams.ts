"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaffSession } from "@/lib/auth-session";
import { canReviewOrPublish } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { uniqueTeamSlug } from "@/lib/team-slug";

export async function listAdminTeams() {
  await requireStaffSession();
  return prisma.team.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
      country: true,
      stadium: true,
      logoUrl: true,
      foundedYear: true,
    },
  });
}

const teamFields = z.object({
  name: z.string().trim().min(1).max(200),
  shortName: z.string().trim().max(50).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  stadium: z.string().trim().max(200).optional().or(z.literal("")),
  logoUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  foundedYear: z.number().int().min(1800).max(2100).nullable().optional(),
});

export async function createAdminTeam(data: z.infer<typeof teamFields>) {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) {
    return { ok: false as const, error: "Chỉ biên tập / quản trị mới thêm đội." };
  }
  const parsed = teamFields.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: "Dữ liệu không hợp lệ." };
  const d = parsed.data;
  const slug = await uniqueTeamSlug(prisma, d.name);
  await prisma.team.create({
    data: {
      slug,
      name: d.name,
      shortName: d.shortName?.trim() || null,
      country: d.country?.trim() || null,
      stadium: d.stadium?.trim() || null,
      logoUrl: d.logoUrl?.trim() || null,
      foundedYear: d.foundedYear ?? null,
    },
  });
  revalidatePath("/admin/doi-bong");
  revalidatePath("/admin/tran-dau");
  return { ok: true as const };
}

export async function deleteAdminTeam(id: string) {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) {
    return { ok: false as const, error: "Chỉ biên tập / quản trị mới xoá đội." };
  }
  if (typeof id !== "string" || !id) {
    return { ok: false as const, error: "Thiếu mã đội." };
  }
  const [matchCount, articleCount] = await Promise.all([
    prisma.match.count({ where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] } }),
    prisma.article.count({ where: { teamId: id } }),
  ]);
  if (matchCount > 0 || articleCount > 0) {
    const parts: string[] = [];
    if (matchCount > 0) parts.push(`${matchCount} trận`);
    if (articleCount > 0) parts.push(`${articleCount} bài viết`);
    return {
      ok: false as const,
      error: `Không thể xoá: còn ${parts.join(" và ")} gắn với đội này.`,
    };
  }
  await prisma.team.delete({ where: { id } });
  revalidatePath("/admin/doi-bong");
  revalidatePath("/admin/tran-dau");
  return { ok: true as const };
}

const updateSchema = teamFields.extend({ id: z.string().cuid() });

export async function updateAdminTeam(data: z.infer<typeof updateSchema>) {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) {
    return { ok: false as const, error: "Chỉ biên tập / quản trị mới sửa đội." };
  }
  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: "Dữ liệu không hợp lệ." };
  const d = parsed.data;
  const row = await prisma.team.findUnique({ where: { id: d.id } });
  if (!row) return { ok: false as const, error: "Không tìm thấy đội." };
  await prisma.team.update({
    where: { id: d.id },
    data: {
      name: d.name,
      shortName: d.shortName?.trim() || null,
      country: d.country?.trim() || null,
      stadium: d.stadium?.trim() || null,
      logoUrl: d.logoUrl?.trim() || null,
      foundedYear: d.foundedYear ?? null,
    },
  });
  revalidatePath("/admin/doi-bong");
  revalidatePath("/admin/tran-dau");
  return { ok: true as const };
}

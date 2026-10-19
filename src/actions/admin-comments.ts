"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { revalidatePublishedArticleById } from "@/lib/revalidate-public";
import { unauthorized } from "next/navigation";

import { requireStaffSession } from "@/lib/auth-session";
import { canReviewOrPublish } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const ADMIN_COMMENTS_PAGE_SIZE = 20;

export async function listAdminComments(input?: {
  q?: string;
  kind?: "top" | "reply";
  page?: number;
}) {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) unauthorized();
  const where: Prisma.CommentWhereInput = {};
  if (input?.kind === "top") where.parentId = null;
  if (input?.kind === "reply") where.parentId = { not: null };
  if (input?.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { body: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { article: { title: { contains: q, mode: "insensitive" } } },
    ];
  }
  const pageSize = ADMIN_COMMENTS_PAGE_SIZE;
  const page = Math.max(1, Math.floor(input?.page ?? 1));
  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { email: true, name: true } },
        article: { select: { slug: true, title: true } },
        parent: { select: { user: { select: { name: true } } } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function deleteAdminCommentFormAction(formData: FormData) {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) {
    return;
  }
  const id = formData.get("commentId");
  if (typeof id !== "string" || !id) return;
  const row = await prisma.comment.findUnique({
    where: { id },
    select: { articleId: true },
  });
  if (!row) return;
  await prisma.comment.delete({ where: { id } });
  revalidatePath("/admin/binh-luan");
  await revalidatePublishedArticleById(row.articleId);
}

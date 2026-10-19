"use server";

import { revalidatePublishedArticleById } from "@/lib/revalidate-public";
import { z } from "zod";

import { auth } from "@/auth";
import { getPublicArticleBySlug, type SiteLocale } from "@/lib/public-articles";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  slug: z.string().min(1),
  locale: z.enum(["vi", "en"]),
  body: z.string().trim().min(1).max(4000),
  parentId: z.string().cuid().optional(),
});

export async function addArticleComment(input: z.infer<typeof schema>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Bạn cần đăng nhập để bình luận." };
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Nội dung không hợp lệ (tối đa 4000 ký tự)." };
  }
  const locale = parsed.data.locale as SiteLocale;
  const article = await getPublicArticleBySlug(parsed.data.slug, locale);
  if (!article) {
    return { ok: false as const, error: "Không tìm thấy bài hoặc bài chưa xuất bản." };
  }
  let parentId: string | null = null;
  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { articleId: true, parentId: true, id: true },
    });
    if (!parent || parent.articleId !== article.id) {
      return { ok: false as const, error: "Không tìm thấy bình luận gốc." };
    }
    // Chỉ một cấp trả lời: gắn vào bình luận gốc nếu đang trả lời một trả lời.
    parentId = parent.parentId ?? parent.id;
  }
  await prisma.comment.create({
    data: {
      articleId: article.id,
      userId: session.user.id,
      body: parsed.data.body,
      parentId,
    },
  });
  await revalidatePublishedArticleById(article.id);
  return { ok: true as const };
}

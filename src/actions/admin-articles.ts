"use server";

import { ArticleStatus, type Prisma } from "@prisma/client";
import { revalidatePublishedArticleById, revalidatePublicPaths } from "@/lib/revalidate-public";
import { z } from "zod";

import { uniqueArticleLocaleSlug } from "@/lib/article-locale-slug";
import { uniqueArticleSlug } from "@/lib/article-slug";
import { requireStaffSession, type SessionUser } from "@/lib/auth-session";
import {
  canAuthorSetStatus,
  canDeleteArticle,
  canEditArticleContent,
  canReviewOrPublish,
  canViewArticleInAdmin,
  isElevatedContentRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { syncArticleTags } from "@/lib/sync-article-tags";

const tagLineSchema = z.string().optional().default("");

const optionalUrl = z
  .string()
  .optional()
  .refine((s) => s == null || s === "" || /^https?:\/\/.+/i.test(s), "URL không hợp lệ");

const baseArticleSchema = z.object({
  title: z.string().min(1, "Cần tiêu đề").max(500),
  summary: z.string().min(1, "Cần tóm tắt").max(20_000),
  body: z.string().min(1, "Cần nội dung"),
  categoryId: z.string().cuid("Chọn chuyên mục"),
  coverImageUrl: optionalUrl,
  metaTitle: z.string().max(200).optional().or(z.literal("")),
  metaDescription: z.string().max(2000).optional().or(z.literal("")),
  ogImageUrl: optionalUrl,
  tagLine: tagLineSchema,
});

const enFieldsSchema = z.object({
  enTitle: z.string().optional(),
  enSummary: z.string().optional(),
  enBody: z.string().optional(),
  enMetaTitle: z.string().max(200).optional().or(z.literal("")),
  enMetaDescription: z.string().max(2000).optional().or(z.literal("")),
  enOgImageUrl: optionalUrl,
});

function refineEnPartial<T extends { enTitle?: string; enSummary?: string; enBody?: string }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  const t = data.enTitle?.trim() ?? "";
  const s = data.enSummary?.trim() ?? "";
  const b = data.enBody?.trim() ?? "";
  const any = t || s || b;
  if (!any) return;
  if (!t || !s || !b) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Bản tiếng Anh: nhập đủ tiêu đề, tóm tắt và nội dung hoặc để trống cả ba.",
      path: ["enTitle"],
    });
  }
}

async function syncArticleOptionalEnLocale(
  articleId: string,
  data: z.infer<typeof enFieldsSchema>,
) {
  const t = data.enTitle?.trim() ?? "";
  const s = data.enSummary?.trim() ?? "";
  const b = data.enBody?.trim() ?? "";
  if (!t || !s || !b) {
    await prisma.articleLocale.deleteMany({ where: { articleId, locale: "en" } });
    return;
  }
  const slug = await uniqueArticleLocaleSlug(prisma, "en", t, { articleId });
  await prisma.articleLocale.upsert({
    where: { articleId_locale: { articleId, locale: "en" } },
    create: {
      articleId,
      locale: "en",
      slug,
      title: t,
      summary: s,
      body: b,
      metaTitle: emptyToUndef(data.enMetaTitle),
      metaDescription: emptyToUndef(data.enMetaDescription),
      ogImageUrl: emptyToUndef(data.enOgImageUrl),
    },
    update: {
      slug,
      title: t,
      summary: s,
      body: b,
      metaTitle: emptyToUndef(data.enMetaTitle),
      metaDescription: emptyToUndef(data.enMetaDescription),
      ogImageUrl: emptyToUndef(data.enOgImageUrl),
    },
  });
}

function parseTagLine(line: string) {
  return line
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type ActionErr = { ok: false; error: string };
type ActionOk = { ok: true };

function staffWhere(user: SessionUser): Prisma.ArticleWhereInput {
  if (isElevatedContentRole(user.role)) return {};
  return { authorId: user.id };
}

function emptyToUndef(s: string | undefined) {
  if (s == null || s === "") return undefined;
  return s;
}

export const ADMIN_ARTICLES_PAGE_SIZE = 20;

export async function listAdminArticles(input?: {
  status?: ArticleStatus;
  q?: string;
  page?: number;
}) {
  const { user } = await requireStaffSession();
  const where: Prisma.ArticleWhereInput = { ...staffWhere(user) };
  if (input?.status) where.status = input.status;
  if (input?.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      {
        locales: {
          some: {
            locale: "en",
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }
  const pageSize = ADMIN_ARTICLES_PAGE_SIZE;
  const page = Math.max(1, Math.floor(input?.page ?? 1));
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { name: true, email: true } },
        category: { select: { name: true, slug: true } },
        locales: { where: { locale: "en" }, take: 1 },
      },
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getAdminArticle(id: string) {
  const { user } = await requireStaffSession();
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, email: true, id: true } },
      category: true,
      tags: { include: { tag: true } },
      locales: { where: { locale: "en" }, take: 1 },
    },
  });
  if (!article) return null;
  if (!canViewArticleInAdmin(user, article)) return null;
  return article;
}

function resolveStatusForCreate(
  user: SessionUser,
  requested: ArticleStatus,
  scheduledAt?: string,
) {
  if (isElevatedContentRole(user.role)) {
    if (requested === ArticleStatus.SCHEDULED) {
      const t = scheduledAt ? new Date(scheduledAt) : null;
      if (!t || Number.isNaN(t.getTime())) {
        return { error: "Cần thời gian hẹn đăng hợp lệ (ISO-8601)." } as const;
      }
      return {
        data: {
          status: ArticleStatus.SCHEDULED,
          scheduledPublishAt: t,
          publishedAt: null,
        },
      } as const;
    }
    if (requested === ArticleStatus.PUBLISHED) {
      return {
        data: {
          status: ArticleStatus.PUBLISHED,
          scheduledPublishAt: null,
          publishedAt: new Date(),
        },
      } as const;
    }
    return {
      data: {
        status: requested,
        scheduledPublishAt: null,
        publishedAt: null,
      },
    } as const;
  }
  if (requested === ArticleStatus.DRAFT || requested === ArticleStatus.PENDING_REVIEW) {
    return {
      data: {
        status: requested,
        scheduledPublishAt: null,
        publishedAt: null,
      },
    } as const;
  }
  return { error: "Bạn chỉ có thể lưu nháp hoặc gửi duyệt." } as const;
}

const createSchema = baseArticleSchema
  .extend({
    status: z.nativeEnum(ArticleStatus).optional(),
    scheduledAt: z.string().optional().or(z.literal("")).optional(),
  })
  .merge(enFieldsSchema)
  .superRefine(refineEnPartial);

export async function createAdminArticle(
  data: z.infer<typeof createSchema>,
): Promise<ActionOk | ActionErr> {
  const { user } = await requireStaffSession();
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const d = parsed.data;
  const tags = parseTagLine(d.tagLine);
  const requested = d.status ?? ArticleStatus.DRAFT;
  if (!canAuthorSetStatus(user.role, requested) && !isElevatedContentRole(user.role)) {
    return { ok: false, error: "Trạng thái không hợp lệ với tài khoản của bạn." };
  }
  if (!isElevatedContentRole(user.role) && (requested === ArticleStatus.SCHEDULED || requested === ArticleStatus.PUBLISHED)) {
    return { ok: false, error: "Chỉ biên tập mới xuất bản hoặc hẹn giờ từ bài mới (dùng gửi duyệt)." };
  }
  const resolved = resolveStatusForCreate(user, requested, d.scheduledAt);
  if ("error" in resolved) {
    return { ok: false, error: resolved.error as string };
  }
  const slug = await uniqueArticleSlug(prisma, d.title);
  const article = await prisma.article.create({
    data: {
      slug,
      title: d.title,
      summary: d.summary,
      body: d.body,
      categoryId: d.categoryId,
      coverImageUrl: emptyToUndef(d.coverImageUrl),
      metaTitle: emptyToUndef(d.metaTitle),
      metaDescription: emptyToUndef(d.metaDescription),
      ogImageUrl: emptyToUndef(d.ogImageUrl),
      status: resolved.data.status,
      scheduledPublishAt: resolved.data.scheduledPublishAt,
      publishedAt: resolved.data.publishedAt,
      authorId: user.id,
    },
  });
  await syncArticleTags(article.id, tags);
  await syncArticleOptionalEnLocale(article.id, d);
  await revalidatePublishedArticleById(article.id);
  return { ok: true };
}

const updateSchema = baseArticleSchema
  .extend({
    id: z.string().cuid(),
    status: z.nativeEnum(ArticleStatus).optional(),
    scheduledAt: z.string().optional().or(z.literal("")).optional(),
  })
  .merge(enFieldsSchema)
  .superRefine(refineEnPartial);

function resolveStatusForUpdate(
  user: SessionUser,
  existing: { status: ArticleStatus; publishedAt: Date | null; scheduledPublishAt: Date | null },
  requested: ArticleStatus,
  scheduledAt: string | undefined,
) {
  if (!isElevatedContentRole(user.role)) {
    if (existing.status === ArticleStatus.PUBLISHED) {
      return {
        data: {
          status: ArticleStatus.PUBLISHED,
          scheduledPublishAt: null,
          publishedAt: existing.publishedAt,
        },
      } as const;
    }
    if (existing.status === ArticleStatus.SCHEDULED) {
      return {
        data: {
          status: ArticleStatus.SCHEDULED,
          scheduledPublishAt: existing.scheduledPublishAt,
          publishedAt: null,
        },
      } as const;
    }
    if (requested === ArticleStatus.DRAFT || requested === ArticleStatus.PENDING_REVIEW) {
      return {
        data: {
          status: requested,
          scheduledPublishAt: null,
          publishedAt: null,
        },
      } as const;
    }
    return { error: "Chỉ lưu nháp / gửi duyệt, hoặc cập nhật nội dung theo trạng thái hiện tại." } as const;
  }

  if (requested === ArticleStatus.SCHEDULED) {
    const t = scheduledAt ? new Date(scheduledAt) : null;
    if (!t || Number.isNaN(t.getTime())) {
      return { error: "Cần thời gian hẹn đăng hợp lệ (ISO-8601)." } as const;
    }
    return {
      data: { status: ArticleStatus.SCHEDULED, scheduledPublishAt: t, publishedAt: null },
    } as const;
  }
  if (requested === ArticleStatus.PUBLISHED) {
    const pub = existing.publishedAt ?? new Date();
    return {
      data: {
        status: ArticleStatus.PUBLISHED,
        scheduledPublishAt: null,
        publishedAt: pub,
      },
    } as const;
  }
  return {
    data: {
      status: requested,
      scheduledPublishAt: null,
      publishedAt: null,
    },
  } as const;
}

export async function updateAdminArticle(
  data: z.infer<typeof updateSchema>,
): Promise<ActionOk | ActionErr> {
  const { user } = await requireStaffSession();
  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const d = parsed.data;
  const existing = await prisma.article.findUnique({ where: { id: d.id } });
  if (!existing) return { ok: false, error: "Không tìm thấy bài viết." };
  if (!canEditArticleContent(user, existing)) {
    return { ok: false, error: "Bạn không được sửa bài này." };
  }
  const tags = parseTagLine(d.tagLine);
  const requested = d.status ?? existing.status;
  if (!isElevatedContentRole(user.role)) {
    const lockedByWorkflow =
      existing.status === ArticleStatus.PUBLISHED ||
      existing.status === ArticleStatus.SCHEDULED;
    if (!lockedByWorkflow && !canAuthorSetStatus(user.role, requested)) {
      return { ok: false, error: "Trạng thái không hợp lệ." };
    }
    if (requested === ArticleStatus.SCHEDULED || requested === ArticleStatus.PUBLISHED) {
      if (existing.status !== ArticleStatus.PUBLISHED && existing.status !== ArticleStatus.SCHEDULED) {
        return { ok: false, error: "Bạn không tự xuất bản/hẹn giờ." };
      }
    }
  }
  const resolved = resolveStatusForUpdate(user, existing, requested, d.scheduledAt);
  if ("error" in resolved) {
    return { ok: false, error: resolved.error as string };
  }
  let newSlug = existing.slug;
  if (d.title !== existing.title) {
    newSlug = await uniqueArticleSlug(prisma, d.title, { excludeId: d.id });
  }
  await prisma.article.update({
    where: { id: d.id },
    data: {
      slug: newSlug,
      title: d.title,
      summary: d.summary,
      body: d.body,
      categoryId: d.categoryId,
      coverImageUrl: emptyToUndef(d.coverImageUrl),
      metaTitle: emptyToUndef(d.metaTitle),
      metaDescription: emptyToUndef(d.metaDescription),
      ogImageUrl: emptyToUndef(d.ogImageUrl),
      status: resolved.data.status,
      scheduledPublishAt: resolved.data.scheduledPublishAt,
      publishedAt: resolved.data.publishedAt,
    },
  });
  await syncArticleTags(d.id, tags);
  await syncArticleOptionalEnLocale(d.id, d);
  await revalidatePublishedArticleById(d.id);
  return { ok: true };
}

export async function deleteAdminArticle(id: string): Promise<ActionOk | ActionErr> {
  const { user } = await requireStaffSession();
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return { ok: false, error: "Không tìm thấy bài." };
  if (!canDeleteArticle(user, article)) return { ok: false, error: "Không được xóa bài này." };
  await revalidatePublishedArticleById(id);
  await prisma.article.delete({ where: { id } });
  revalidatePublicPaths("/tin-tuc");
  revalidatePublicPaths("/");
  return { ok: true };
}

/** Form: hidden input `articleId` */
export async function deleteAdminArticleFormAction(formData: FormData) {
  const id = formData.get("articleId");
  if (typeof id !== "string" || !id) return;
  await deleteAdminArticle(id);
}

const reviewSchema = z.object({
  id: z.string().cuid(),
  action: z.enum(["publish_now", "schedule", "reject"]),
  scheduledAt: z.string().optional(),
  rejectReason: z.string().max(2000).optional().or(z.literal("")),
});

export async function reviewAdminArticle(
  data: z.infer<typeof reviewSchema>,
): Promise<ActionOk | ActionErr> {
  const { user } = await requireStaffSession();
  if (!canReviewOrPublish(user.role)) {
    return { ok: false, error: "Chỉ biên tập / quản trị mới duyệt bài." };
  }
  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "Dữ liệu duyệt không hợp lệ." };
  }
  const { id, action, scheduledAt, rejectReason } = parsed.data;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return { ok: false, error: "Không tìm thấy bài." };

  if (action === "reject") {
    await prisma.article.update({
      where: { id },
      data: {
        status: ArticleStatus.REJECTED,
        rejectReason: emptyToUndef(rejectReason) ?? "Từ chối",
        reviewedAt: new Date(),
        reviewedById: user.id,
        scheduledPublishAt: null,
      },
    });
  } else if (action === "publish_now") {
    await prisma.article.update({
      where: { id },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        scheduledPublishAt: null,
        rejectReason: null,
        reviewedAt: new Date(),
        reviewedById: user.id,
      },
    });
  } else {
    if (!scheduledAt) return { ok: false, error: "Cần thời gian hẹn đăng." };
    const t = new Date(scheduledAt);
    if (Number.isNaN(t.getTime())) {
      return { ok: false, error: "Thời gian không hợp lệ." };
    }
    await prisma.article.update({
      where: { id },
      data: {
        status: ArticleStatus.SCHEDULED,
        scheduledPublishAt: t,
        publishedAt: null,
        rejectReason: null,
        reviewedAt: new Date(),
        reviewedById: user.id,
      },
    });
  }
  await revalidatePublishedArticleById(id);
  return { ok: true };
}

import type { Prisma } from "@prisma/client";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SiteLocale = "vi" | "en";

export function toSiteLocale(raw: string): SiteLocale {
  return raw === "en" ? "en" : "vi";
}

export function publicArticleListWhere(): Prisma.ArticleWhereInput {
  return {
    status: ArticleStatus.PUBLISHED,
    OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
  };
}

const listIncludeBase = {
  category: { select: { name: true, slug: true } },
  author: { select: { name: true, image: true } },
} as const;

const listIncludeWithEn = {
  ...listIncludeBase,
  locales: { where: { locale: "en" }, take: 1 },
} as const;

const detailIncludeBase = {
  category: { select: { name: true, slug: true } },
  author: { select: { name: true, image: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
  comments: {
    where: { parentId: null },
    orderBy: { createdAt: "asc" as const },
    include: {
      user: { select: { name: true } },
      replies: {
        orderBy: { createdAt: "asc" as const },
        include: { user: { select: { name: true } } },
      },
    },
  },
} as const;

const detailIncludeWithEn = {
  ...detailIncludeBase,
  locales: { where: { locale: "en" }, take: 1 },
} as const;

type ArticleListRow = Prisma.ArticleGetPayload<{ include: typeof listIncludeWithEn }>;
type ArticleDetailRow = Prisma.ArticleGetPayload<{ include: typeof detailIncludeWithEn }>;

function enRow(article: { locales: { slug: string; title: string; summary: string; body: string; metaTitle: string | null; metaDescription: string | null; ogImageUrl: string | null }[] }) {
  return article.locales[0] ?? null;
}

function mapListItem(a: ArticleListRow, locale: SiteLocale) {
  const en = enRow(a);
  const useEn = locale === "en" && en;
  return {
    id: a.id,
    slug: useEn ? en.slug : a.slug,
    title: useEn ? en.title : a.title,
    summary: useEn ? en.summary : a.summary,
    coverImageUrl: a.coverImageUrl,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
    category: a.category,
    author: a.author,
  };
}

export type PublicArticleListItem = ReturnType<typeof mapListItem>;

export function getPublicArticles(options?: { take?: number; locale?: SiteLocale }) {
  const locale = options?.locale ?? "vi";
  return prisma.article
    .findMany({
      where: publicArticleListWhere(),
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: options?.take,
      include: listIncludeWithEn,
    })
    .then((rows) => rows.map((a) => mapListItem(a, locale)));
}

export function searchPublicArticles(query: string, options?: { take?: number; locale?: SiteLocale }) {
  const locale = options?.locale ?? "vi";
  const q = query.trim();
  if (!q) {
    return getPublicArticles(options);
  }
  const take = options?.take ?? 60;
  const searchOr: Prisma.ArticleWhereInput[] = [
    { title: { contains: q, mode: "insensitive" } },
    { summary: { contains: q, mode: "insensitive" } },
  ];
  if (locale === "en") {
    searchOr.push({
      locales: {
        some: {
          locale: "en",
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { summary: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    });
  }
  return prisma.article
    .findMany({
      where: {
        AND: [publicArticleListWhere(), { OR: searchOr }],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
      include: listIncludeWithEn,
    })
    .then((rows) => rows.map((a) => mapListItem(a, locale)));
}

export type PublicArticleListParams = {
  q?: string;
  categorySlug?: string;
  tagSlug?: string;
  skip?: number;
  take?: number;
  locale?: SiteLocale;
};

export async function listPublicArticlesPage(params: PublicArticleListParams) {
  const locale = params.locale ?? "vi";
  const take = Math.min(Math.max(1, params.take ?? 12), 48);
  const skip = Math.max(0, params.skip ?? 0);
  const q = params.q?.trim() ?? "";
  const categorySlug = params.categorySlug?.trim();
  const tagSlug = params.tagSlug?.trim();

  const filters: Prisma.ArticleWhereInput[] = [publicArticleListWhere()];
  if (categorySlug) filters.push({ category: { slug: categorySlug } });
  if (tagSlug) filters.push({ tags: { some: { tag: { slug: tagSlug } } } });
  if (q) {
    const searchOr: Prisma.ArticleWhereInput[] = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
    if (locale === "en") {
      searchOr.push({
        locales: {
          some: {
            locale: "en",
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      });
    }
    filters.push({ OR: searchOr });
  }
  const where: Prisma.ArticleWhereInput = { AND: filters };

  const [rows, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take,
      include: listIncludeWithEn,
    }),
    prisma.article.count({ where }),
  ]);

  return { items: rows.map((a) => mapListItem(a, locale)), total, take, skip };
}

export function getPublicCategoriesForNav() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
}

export function getPublicTagsForNav() {
  return prisma.tag.findMany({
    where: {
      articles: {
        some: {
          article: publicArticleListWhere(),
        },
      },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

function mapRelatedItem(
  a: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    coverImageUrl: string | null;
    publishedAt: Date | null;
    locales: { slug: string; title: string; summary: string }[];
  },
  locale: SiteLocale,
) {
  const en = a.locales[0];
  const useEn = locale === "en" && en;
  return {
    id: a.id,
    slug: useEn ? en.slug : a.slug,
    title: useEn ? en.title : a.title,
    summary: useEn ? en.summary : a.summary,
    coverImageUrl: a.coverImageUrl,
    publishedAt: a.publishedAt,
  };
}

export type PublicRelatedArticle = ReturnType<typeof mapRelatedItem>;

export function getRelatedPublicArticles(
  categoryId: string,
  excludeArticleId: string,
  take = 4,
  locale: SiteLocale = "vi",
) {
  return prisma.article
    .findMany({
      where: {
        AND: [
          publicArticleListWhere(),
          { categoryId },
          { id: { not: excludeArticleId } },
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        coverImageUrl: true,
        publishedAt: true,
        locales: { where: { locale: "en" }, take: 1, select: { slug: true, title: true, summary: true } },
      },
    })
    .then((rows) => rows.map((a) => mapRelatedItem(a, locale)));
}

function toPublicDetail(article: ArticleDetailRow, locale: SiteLocale) {
  const en = enRow(article);
  const useEn = locale === "en" && en;
  return {
    id: article.id,
    slug: useEn ? en.slug : article.slug,
    title: useEn ? en.title : article.title,
    summary: useEn ? en.summary : article.summary,
    body: useEn ? en.body : article.body,
    metaTitle: useEn ? en.metaTitle ?? article.metaTitle : article.metaTitle,
    metaDescription: useEn ? en.metaDescription ?? article.metaDescription : article.metaDescription,
    ogImageUrl: useEn ? en.ogImageUrl ?? article.ogImageUrl : article.ogImageUrl,
    coverImageUrl: article.coverImageUrl,
    publishedAt: article.publishedAt,
    categoryId: article.categoryId,
    category: article.category,
    author: article.author,
    tags: article.tags,
    comments: article.comments,
    /** Slug gốc để chuyển ngôn ngữ đúng URL (VI khác EN). */
    localeSlugs: { vi: article.slug, en: en?.slug ?? null },
  };
}

export type PublicArticleDetail = ReturnType<typeof toPublicDetail>;

export async function getPublicArticleBySlug(slug: string, locale: SiteLocale = "vi") {
  if (locale === "vi") {
    const article = await prisma.article.findFirst({
      where: {
        slug,
        status: ArticleStatus.PUBLISHED,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      include: detailIncludeWithEn,
    });
    return article ? toPublicDetail(article, "vi") : null;
  }

  const byEnSlug = await prisma.articleLocale.findFirst({
    where: { locale: "en", slug },
    include: {
      article: {
        include: detailIncludeWithEn,
      },
    },
  });
  if (byEnSlug?.article) {
    const { article } = byEnSlug;
    const ok =
      article.status === ArticleStatus.PUBLISHED &&
      (article.publishedAt == null || article.publishedAt <= new Date());
    if (ok) {
      return toPublicDetail(article, "en");
    }
  }

  const byViSlug = await prisma.article.findFirst({
    where: {
      slug,
      status: ArticleStatus.PUBLISHED,
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
    },
    include: detailIncludeWithEn,
  });
  if (!byViSlug) return null;
  return toPublicDetail(byViSlug, "en");
}

import type { PrismaClient } from "@prisma/client";

import { slugifyTitle } from "@/lib/slugify";

/** Slug URL cho `ArticleLocale` (unique theo cặp locale + slug). */
export async function uniqueArticleLocaleSlug(
  prisma: PrismaClient,
  locale: string,
  title: string,
  options?: { articleId?: string },
) {
  const base = slugifyTitle(title);
  let slug = base;
  let n = 2;
  for (;;) {
    const existing = await prisma.articleLocale.findFirst({
      where: {
        locale,
        slug,
        ...(options?.articleId ? { NOT: { articleId: options.articleId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${n++}`;
  }
}

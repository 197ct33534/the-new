import type { PrismaClient } from "@prisma/client";

import { slugifyTitle } from "@/lib/slugify";

export async function uniqueArticleSlug(
  prisma: PrismaClient,
  title: string,
  options?: { excludeId?: string },
) {
  const base = slugifyTitle(title);
  let slug = base;
  let n = 2;
  for (;;) {
    const existing = await prisma.article.findFirst({
      where: {
        slug,
        ...(options?.excludeId ? { id: { not: options.excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${n++}`;
  }
}

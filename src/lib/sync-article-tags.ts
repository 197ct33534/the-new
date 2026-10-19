import { slugifyTitle } from "@/lib/slugify";
import { prisma } from "@/lib/prisma";

function tagSlug(name: string) {
  return slugifyTitle(name) || "tag";
}

export async function syncArticleTags(articleId: string, tagNames: string[]) {
  const cleaned = [
    ...new Set(tagNames.map((s) => s.trim()).filter((s) => s.length > 0)),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.articleTag.deleteMany({ where: { articleId } });
    if (cleaned.length === 0) return;
    const tagIds: string[] = [];
    for (const name of cleaned) {
      const slug = tagSlug(name);
      const tag = await tx.tag.upsert({
        where: { slug },
        create: { slug, name },
        update: { name },
        select: { id: true },
      });
      tagIds.push(tag.id);
    }
    await tx.articleTag.createMany({
      data: tagIds.map((tagId) => ({ articleId, tagId })),
    });
  });
}

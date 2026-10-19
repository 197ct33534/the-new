import type { PrismaClient } from "@prisma/client";

import { slugifyTitle } from "@/lib/slugify";

export async function uniqueTeamSlug(prisma: PrismaClient, base: string, excludeId?: string) {
  const root = slugifyTitle(base) || "doi-bong";
  let slug = root;
  let n = 2;
  for (;;) {
    const existing = await prisma.team.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${root}-${n++}`;
  }
}

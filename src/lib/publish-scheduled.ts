import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Gọi từ cron: chuyển bài SCHEDULED đến hạn thành PUBLISHED.
 */
export async function publishDueScheduledArticles() {
  const now = new Date();
  const due = await prisma.article.findMany({
    where: {
      status: ArticleStatus.SCHEDULED,
      scheduledPublishAt: { not: null, lte: now },
    },
    select: { id: true, scheduledPublishAt: true },
  });
  for (const row of due) {
    const publishedAt = row.scheduledPublishAt ?? now;
    await prisma.article.update({
      where: { id: row.id },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt,
        scheduledPublishAt: null,
      },
    });
  }
  return { published: due.length };
}

import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { publicPathForLocale } from "@/lib/public-path";
import { publicArticleListWhere } from "@/lib/public-articles";
import { prisma } from "@/lib/prisma";
import { getSiteBaseUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBaseUrl();

  const articles = await prisma.article.findMany({
    where: publicArticleListWhere(),
    select: {
      slug: true,
      publishedAt: true,
      updatedAt: true,
      locales: { where: { locale: "en" }, take: 1, select: { slug: true } },
    },
  });

  const staticPaths = ["", "/tin-tuc", "/lich-thi-dau", "/bang-xep-hang", "/dang-nhap", "/dang-ky", "/tai-khoan"];

  const staticEntries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      staticEntries.push({
        url: `${base}${publicPathForLocale(locale, path)}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }

  const articleEntries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const a of articles) {
      const slug = locale === "en" && a.locales[0] ? a.locales[0].slug : a.slug;
      articleEntries.push({
        url: `${base}${publicPathForLocale(locale, `/tin-tuc/${slug}`)}`,
        lastModified: a.publishedAt ?? a.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  const feedEntry: MetadataRoute.Sitemap = [
    {
      url: `${base}/feed`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
  ];

  return [...staticEntries, ...articleEntries, ...feedEntry];
}

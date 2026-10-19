import { siteConfig } from "@/config/site";
import { getPublicArticles } from "@/lib/public-articles";
import { getSiteBaseUrl } from "@/lib/site-url";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const base = getSiteBaseUrl();
  const articles = await getPublicArticles({ take: 40 });
  const buildDate = new Date().toUTCString();
  const items = articles
    .map((a) => {
      const link = `${base}/tin-tuc/${a.slug}`;
      const pub = (a.publishedAt ?? a.createdAt).toUTCString();
      const desc = escapeXml(a.summary.replace(/\s+/g, " ").slice(0, 500));
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${desc}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>vi-vn</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

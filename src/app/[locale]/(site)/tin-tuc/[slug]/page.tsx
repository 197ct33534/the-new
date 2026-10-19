import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ArticleLocaleSlugsRegistrar } from "@/components/layout/article-locale-context";
import { ArticleCommentForm } from "@/components/site/article-comment-form";
import { CommentThread } from "@/components/site/comment-thread";
import { ROUTES } from "@/constants/routes";
import { Link } from "@/i18n/navigation";
import { intlLocaleTag } from "@/lib/locale-format";
import {
  getPublicArticleBySlug,
  getRelatedPublicArticles,
  toSiteLocale,
} from "@/lib/public-articles";
import { absolutePublicUrl } from "@/lib/public-path";
import { getSiteBaseUrl } from "@/lib/site-url";

type Params = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const siteLocale = toSiteLocale(locale);
  const t = await getTranslations({ locale, namespace: "article" });
  const article = await getPublicArticleBySlug(slug, siteLocale);
  if (!article) return { title: t("metaFallbackTitle") };
  const title = article.metaTitle?.trim() || article.title;
  const desc = article.metaDescription?.trim() || article.summary;
  const og = article.ogImageUrl || article.coverImageUrl;
  const base = getSiteBaseUrl();
  const canonical = absolutePublicUrl(base, locale, `/tin-tuc/${article.slug}`);
  return {
    title,
    description: desc.slice(0, 200),
    alternates: { canonical },
    openGraph: {
      title,
      description: desc.slice(0, 200),
      images: og ? [{ url: og }] : undefined,
      type: "article",
      url: canonical,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug, locale } = await params;
  const siteLocale = toSiteLocale(locale);
  const t = await getTranslations("article");
  const dateTag = intlLocaleTag(locale);

  const article = await getPublicArticleBySlug(slug, siteLocale);
  if (!article) notFound();

  const related = await getRelatedPublicArticles(article.categoryId, article.id, 4, siteLocale);
  const baseUrl = getSiteBaseUrl();
  const canonical = absolutePublicUrl(baseUrl, locale, `/tin-tuc/${article.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    image: article.ogImageUrl || article.coverImageUrl || undefined,
    datePublished: article.publishedAt?.toISOString(),
    author: { "@type": "Person", name: article.author.name ?? t("jsonLdAuthor") },
  };

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <ArticleLocaleSlugsRegistrar vi={article.localeSlugs.vi} en={article.localeSlugs.en} />
      <link rel="canonical" href={canonical} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav>
        <Link href={ROUTES.news} className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          {t("backToNews")}
        </Link>
      </nav>
      <header className="space-y-2">
        <p className="text-xs text-zinc-500">
          <Link
            href={{ pathname: ROUTES.news, query: { chuyenMuc: article.category.slug } }}
            className="hover:underline"
          >
            {article.category.name}
          </Link>
          {article.publishedAt ? ` · ${new Date(article.publishedAt).toLocaleString(dateTag)}` : null}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{article.title}</h1>
        <p className="text-sm text-zinc-500">{article.author.name ?? t("authorFallback")}</p>
      </header>
      {article.coverImageUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
          <Image
            src={article.coverImageUrl}
            alt=""
            width={800}
            height={450}
            className="h-full w-full object-cover"
            unoptimized
            priority
          />
        </div>
      ) : null}
      <p className="text-lg text-zinc-700 dark:text-zinc-300">{article.summary}</p>
      <div
        className="article-body text-zinc-800 dark:text-zinc-200"
        dangerouslySetInnerHTML={{ __html: article.body }}
      />
      {article.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2 text-sm">
          {article.tags.map((row) => (
            <li key={row.tagId}>
              <Link
                href={{ pathname: ROUTES.news, query: { tag: row.tag.slug } }}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 hover:underline dark:bg-zinc-800 dark:text-zinc-300"
              >
                {row.tag.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {related.length > 0 ? (
        <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("related")}</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={{ pathname: "/tin-tuc/[slug]", params: { slug: r.slug } }}
                  className="group flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  {r.coverImageUrl ? (
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={r.coverImageUrl}
                        alt=""
                        width={112}
                        height={80}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-medium leading-snug text-zinc-900 group-hover:underline dark:text-zinc-50">
                      {r.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">{r.summary}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t("commentsHeading", { count: article.comments.length })}
        </h2>
        <div className="mb-6">
          <ArticleCommentForm articleSlug={article.slug} />
        </div>
        {article.comments.length > 0 ? (
          <ul className="space-y-4">
            {article.comments.map((c) => (
              <CommentThread key={c.id} articleSlug={article.slug} comment={c} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">{t("noComments")}</p>
        )}
      </section>
    </article>
  );
}

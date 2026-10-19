import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { ROUTES } from "@/constants/routes";
import { getPathname, Link } from "@/i18n/navigation";
import { intlLocaleTag } from "@/lib/locale-format";
import {
  getPublicCategoriesForNav,
  getPublicTagsForNav,
  listPublicArticlesPage,
  toSiteLocale,
} from "@/lib/public-articles";

const PAGE_SIZE = 12;

type Search = { q?: string; chuyenMuc?: string; tag?: string; page?: string };

type NewsIndexQuery = { q?: string; chuyenMuc?: string; tag?: string; page?: string };

function buildNewsHref(opts: { q: string; chuyenMuc: string; tag: string; page: number }) {
  const query: NewsIndexQuery = {};
  if (opts.q) query.q = opts.q;
  if (opts.chuyenMuc) query.chuyenMuc = opts.chuyenMuc;
  if (opts.tag) query.tag = opts.tag;
  if (opts.page > 1) query.page = String(opts.page);
  if (Object.keys(query).length === 0) return ROUTES.news;
  return { pathname: ROUTES.news, query };
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Search>;
}) {
  const { locale } = await params;
  const t = await getTranslations("news");
  const tArticle = await getTranslations("article");
  const newsLocale = await getLocale();
  const formAction = getPathname({ locale: newsLocale, href: ROUTES.news });
  const dateTag = intlLocaleTag(locale);

  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim() ?? "";
  const chuyenMuc = sp.chuyenMuc?.trim() ?? "";
  const tag = sp.tag?.trim() ?? "";
  const pageRaw = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const skip = (page - 1) * PAGE_SIZE;

  const [categories, tags, { items: list, total, take }] = await Promise.all([
    getPublicCategoriesForNav(),
    getPublicTagsForNav(),
    listPublicArticlesPage({
      q: q || undefined,
      categorySlug: chuyenMuc || undefined,
      tagSlug: tag || undefined,
      skip,
      take: PAGE_SIZE,
      locale: toSiteLocale(newsLocale),
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));
  const activeCategory = chuyenMuc ? categories.find((c) => c.slug === chuyenMuc) : undefined;
  const activeTag = tag ? tags.find((tg) => tg.slug === tag) : undefined;

  const hrefOpts = (partial: Partial<{ q: string; chuyenMuc: string; tag: string; page: number }>) =>
    buildNewsHref({
      q,
      chuyenMuc,
      tag,
      page: 1,
      ...partial,
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {q ? (
            <>
              {t("searchPrefix")} <span className="font-medium text-zinc-800 dark:text-zinc-200">&quot;{q}&quot;</span>
              {activeCategory ? (
                <>
                  {" "}
                  {t("inCategory")} <span className="font-medium">{activeCategory.name}</span>
                </>
              ) : null}
              {activeTag ? (
                <>
                  {" "}
                  · {t("tagLabel")} <span className="font-medium">{activeTag.name}</span>
                </>
              ) : null}
              {" · "}
              <Link href={hrefOpts({ q: "" })} className="text-blue-600 underline dark:text-blue-400">
                {t("clearQuery")}
              </Link>
            </>
          ) : activeTag && !activeCategory ? (
            <>
              {t("tagHeading")} <span className="font-medium text-zinc-800 dark:text-zinc-200">{activeTag.name}</span> ·{" "}
              <Link href={hrefOpts({ tag: "" })} className="text-blue-600 underline dark:text-blue-400">
                {t("clearTag")}
              </Link>
            </>
          ) : activeCategory ? (
            <>
              {t("categoryHeading")}{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{activeCategory.name}</span>
              {activeTag ? (
                <>
                  {" "}
                  · {t("tagLabel")} <span className="font-medium">{activeTag.name}</span>
                </>
              ) : null}
              {" · "}
              <Link href={ROUTES.news} className="text-blue-600 underline dark:text-blue-400">
                {t("allNews")}
              </Link>
            </>
          ) : activeTag ? (
            <>
              {t("tagHeading")} <span className="font-medium text-zinc-800 dark:text-zinc-200">{activeTag.name}</span> ·{" "}
              <Link href={hrefOpts({ tag: "" })} className="text-blue-600 underline dark:text-blue-400">
                {t("clearTag")}
              </Link>
            </>
          ) : (
            t("intro")
          )}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={hrefOpts({ chuyenMuc: "", page: 1 })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !chuyenMuc ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {t("allSections")}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildNewsHref({ q, chuyenMuc: c.slug, tag, page: 1 })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                chuyenMuc === c.slug
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">{t("tagsLabel")}</span>
            <Link
              href={hrefOpts({ tag: "", page: 1 })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                !tag ? "bg-emerald-800 text-white dark:bg-emerald-200 dark:text-emerald-950" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {t("tagsAll")}
            </Link>
            {tags.map((tg) => (
              <Link
                key={tg.id}
                href={buildNewsHref({ q, chuyenMuc, tag: tg.slug, page: 1 })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tag === tg.slug
                    ? "bg-emerald-800 text-white dark:bg-emerald-200 dark:text-emerald-950"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {tg.name}
              </Link>
            ))}
          </div>
        ) : null}

        <form action={formAction} method="get" className="mt-4 max-w-md">
          <label htmlFor="news-q" className="sr-only">
            {t("searchInNews")}
          </label>
          {chuyenMuc ? <input type="hidden" name="chuyenMuc" value={chuyenMuc} /> : null}
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          <div className="flex gap-2">
            <input
              id="news-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder={t("searchPlaceholderLong")}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {t("searchButton")}
            </button>
          </div>
        </form>
      </div>

      {list.length === 0 ? (
        <p className="text-zinc-500">{q || chuyenMuc || tag ? t("emptyFiltered") : t("emptyNone")}</p>
      ) : (
        <ul className="space-y-6">
          {list.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 border-b border-zinc-200 pb-6 sm:flex-row sm:gap-6 dark:border-zinc-800"
            >
              {a.coverImageUrl ? (
                <Link
                  href={{ pathname: "/tin-tuc/[slug]", params: { slug: a.slug } }}
                  className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:aspect-[4/3] sm:max-w-xs dark:bg-zinc-900"
                >
                  <Image
                    src={a.coverImageUrl}
                    alt=""
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </Link>
              ) : null}
              <div className="min-w-0 space-y-2">
                <p className="text-xs text-zinc-500">
                  <Link
                    href={buildNewsHref({ q: "", chuyenMuc: a.category.slug, tag, page: 1 })}
                    className="hover:underline"
                  >
                    {a.category.name}
                  </Link>
                  {a.publishedAt ? ` · ${new Date(a.publishedAt).toLocaleString(dateTag)}` : null}
                </p>
                <h2 className="text-xl font-semibold leading-snug">
                  <Link
                    href={{ pathname: "/tin-tuc/[slug]", params: { slug: a.slug } }}
                    className="text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {a.title}
                  </Link>
                </h2>
                <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{a.summary}</p>
                <p className="text-xs text-zinc-500">{a.author.name ?? tArticle("authorFallback")}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-3 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
          {page > 1 ? (
            <Link
              href={buildNewsHref({ q, chuyenMuc, tag, page: page - 1 })}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              ← {t("prev")}
            </Link>
          ) : (
            <span className="text-zinc-400">← {t("prev")}</span>
          )}
          <span className="text-zinc-600 dark:text-zinc-400">{t("pageOf", { page, total: totalPages })}</span>
          {page < totalPages ? (
            <Link
              href={buildNewsHref({ q, chuyenMuc, tag, page: page + 1 })}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {t("next")} →
            </Link>
          ) : (
            <span className="text-zinc-400">
              {t("next")} →
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}

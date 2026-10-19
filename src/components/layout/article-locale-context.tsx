"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

export type ArticleLocaleSlugs = { vi: string; en: string | null };

const Ctx = createContext<{
  articleSlugs: ArticleLocaleSlugs | null;
  setArticleSlugs: (v: ArticleLocaleSlugs | null) => void;
} | null>(null);

export function ArticleLocaleSwitchProvider({ children }: { children: React.ReactNode }) {
  const [articleSlugs, setArticleSlugs] = useState<ArticleLocaleSlugs | null>(null);
  const value = useMemo(
    () => ({ articleSlugs, setArticleSlugs }),
    [articleSlugs],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useArticleLocaleSlugsForHeader() {
  return useContext(Ctx)?.articleSlugs ?? null;
}

/** Gắn slug VI/EN thật cho header (client) — cleanup khi rời trang bài. */
export function ArticleLocaleSlugsRegistrar({ vi, en }: ArticleLocaleSlugs) {
  const setArticleSlugs = useContext(Ctx)?.setArticleSlugs;
  useLayoutEffect(() => {
    if (!setArticleSlugs) return;
    setArticleSlugs({ vi, en });
    return () => setArticleSlugs(null);
  }, [vi, en, setArticleSlugs]);
  return null;
}

import { SiteFooter, SiteHeader } from "@/components/layout";
import { ArticleLocaleSwitchProvider } from "@/components/layout/article-locale-context";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ArticleLocaleSwitchProvider>
      <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <SiteFooter />
      </div>
    </ArticleLocaleSwitchProvider>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { addArticleComment } from "@/actions/article-comments";
import { ROUTES } from "@/constants/routes";
import { Link, useRouter } from "@/i18n/navigation";
import { toSiteLocale } from "@/lib/public-articles";

type Props = {
  articleSlug: string;
  /** Nếu có, form gửi dưới dạng trả lời cho bình luận này. */
  parentId?: string;
  /** Hiển thị gọn (dùng trong khung trả lời). */
  compact?: boolean;
  /** Gọi sau khi gửi thành công hoặc khi người dùng huỷ. */
  onDone?: () => void;
};

export function ArticleCommentForm({ articleSlug, parentId, compact, onDone }: Props) {
  const t = useTranslations("comments");
  const tNav = useTranslations("nav");
  const locale = toSiteLocale(useLocale());
  const { data: session, status } = useSession();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await addArticleComment({ slug: articleSlug, body, locale, parentId });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setBody("");
    router.refresh();
    onDone?.();
  }

  if (status === "loading") {
    return <p className="text-sm text-zinc-500">{t("sessionLoading")}</p>;
  }

  if (!session?.user) {
    const callback = `/tin-tuc/${articleSlug}`;
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href={{ pathname: ROUTES.signIn, query: { callbackUrl: callback } }}
          className="font-medium text-blue-600 underline dark:text-blue-400"
        >
          {tNav("signIn")}
        </Link>{" "}
        {t("commentPrompt")} {t("noAccountYet")}{" "}
        <Link href={ROUTES.register} className="font-medium text-blue-600 underline dark:text-blue-400">
          {tNav("register")}
        </Link>
      </p>
    );
  }

  const fieldId = compact && parentId ? `reply-${parentId}` : "article-comment";

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {compact ? t("reply") : t("formLabel")}
      </label>
      <textarea
        id={fieldId}
        name="body"
        rows={compact ? 3 : 4}
        maxLength={4000}
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
        placeholder={compact ? t("replyPlaceholder") : t("placeholderLong")}
      />
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? t("submitting") : compact ? t("replySubmit") : t("submitLong")}
        </button>
        {compact && onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {t("cancelReply")}
          </button>
        ) : null}
      </div>
    </form>
  );
}

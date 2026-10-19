"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { intlLocaleTag } from "@/lib/locale-format";

import { ArticleCommentForm } from "./article-comment-form";

type CommentNode = {
  id: string;
  body: string;
  createdAt: string | Date;
  user: { name: string | null };
};

type Props = {
  articleSlug: string;
  comment: CommentNode & { replies: CommentNode[] };
};

function CommentCard({
  comment,
  dateTag,
  userFallback,
}: {
  comment: CommentNode;
  dateTag: string;
  userFallback: string;
}) {
  const created = new Date(comment.createdAt);
  return (
    <>
      <p className="text-xs text-zinc-500">
        {comment.user.name ?? userFallback}
        <span className="mx-1">·</span>
        <time dateTime={created.toISOString()}>{created.toLocaleString(dateTag)}</time>
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{comment.body}</p>
    </>
  );
}

export function CommentThread({ articleSlug, comment }: Props) {
  const t = useTranslations("comments");
  const tArticle = useTranslations("article");
  const dateTag = intlLocaleTag(useLocale());
  const userFallback = tArticle("userFallback");
  const [replying, setReplying] = useState(false);

  return (
    <li className="rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
      <CommentCard comment={comment} dateTag={dateTag} userFallback={userFallback} />

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setReplying((v) => !v)}
          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {t("reply")}
        </button>
      </div>

      {replying ? (
        <div className="mt-3">
          <ArticleCommentForm
            articleSlug={articleSlug}
            parentId={comment.id}
            compact
            onDone={() => setReplying(false)}
          />
        </div>
      ) : null}

      {comment.replies.length > 0 ? (
        <ul className="mt-3 space-y-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
          {comment.replies.map((r) => (
            <li key={r.id} className="rounded-lg bg-white px-3 py-2 dark:bg-zinc-950">
              <CommentCard comment={r} dateTag={dateTag} userFallback={userFallback} />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

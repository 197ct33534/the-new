"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { reviewAdminArticle } from "@/actions/admin-articles";

type Props = {
  articleId: string;
  status: string;
};

export function ArticleReviewActions({ articleId, status }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [when, setWhen] = useState("");
  const [reason, setReason] = useState("");

  if (status !== "PENDING_REVIEW" && status !== "DRAFT") {
    return null;
  }

  async function run(
    action: "publish_now" | "schedule" | "reject",
    extra?: { scheduledAt?: string; rejectReason?: string },
  ) {
    setErr(null);
    setPending(true);
    try {
      const res = await reviewAdminArticle({
        id: articleId,
        action,
        scheduledAt: extra?.scheduledAt,
        rejectReason: extra?.rejectReason,
      });
      if (!res.ok) setErr(res.error);
      else router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Duyệt bài</h3>
      {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void run("publish_now")}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          Xuất bản ngay
        </button>
        <div className="flex flex-wrap items-end gap-2">
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!when) {
                setErr("Chọn thời gian hẹn đăng.");
                return;
              }
              const t = new Date(when);
              void run("schedule", { scheduledAt: t.toISOString() });
            }}
            className="rounded-md bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-800 disabled:opacity-50"
          >
            Hẹn giờ
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2 border-t border-amber-200 pt-2 dark:border-amber-800">
        <input
          placeholder="Lý do từ chối (tùy chọn)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-w-[200px] flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => void run("reject", { rejectReason: reason })}
          className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          Từ chối
        </button>
      </div>
    </div>
  );
}

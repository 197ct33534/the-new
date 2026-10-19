"use client";

import type { ArticleStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createAdminArticle,
  updateAdminArticle,
} from "@/actions/admin-articles";
import { canManageCategories, isElevatedContentRole } from "@/lib/permissions";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

const STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: "Nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Từ chối",
  SCHEDULED: "Hẹn giờ",
};

type ArticleLocaleRow = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
};

type ArticleRow = {
  id: string;
  title: string;
  summary: string;
  body: string;
  categoryId: string;
  coverImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  status: ArticleStatus;
  scheduledPublishAt: Date | null;
  publishedAt: Date | null;
  tags: { tag: { name: string } }[];
  locales?: ArticleLocaleRow[];
};

type CategoryOption = { id: string; name: string; label?: string };

type Props = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  userRole: UserRole;
  initial?: ArticleRow;
};

export function ArticleForm({ mode, categories, userRole, initial }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [body, setBody] = useState(initial?.body ?? "<p></p>");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(initial?.ogImageUrl ?? "");
  const [tagLine, setTagLine] = useState(
    initial?.tags.map((t) => t.tag.name).join(", ") ?? "",
  );
  const en0 = initial?.locales?.[0];
  const [enTitle, setEnTitle] = useState(en0?.title ?? "");
  const [enSummary, setEnSummary] = useState(en0?.summary ?? "");
  const [enBody, setEnBody] = useState(en0?.body ?? "<p></p>");
  const [enMetaTitle, setEnMetaTitle] = useState(en0?.metaTitle ?? "");
  const [enMetaDescription, setEnMetaDescription] = useState(en0?.metaDescription ?? "");
  const [enOgImageUrl, setEnOgImageUrl] = useState(en0?.ogImageUrl ?? "");
  const [status, setStatus] = useState<ArticleStatus>(initial?.status ?? "DRAFT");
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduledPublishAt
      ? toLocalDatetimeValue(initial.scheduledPublishAt)
      : "",
  );

  const showStatus = isElevatedContentRole(userRole) || !initial || initial.status === "DRAFT" || initial.status === "PENDING_REVIEW" || initial.status === "REJECTED";
  const lockStatusForAuthor =
    !isElevatedContentRole(userRole) &&
    initial &&
    (initial.status === "PUBLISHED" || initial.status === "SCHEDULED");

  async function upload(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) {
      setMessage("Tải ảnh thất bại.");
      return null;
    }
    const j = (await res.json()) as { url?: string };
    return j.url ?? null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    const scheduledIso =
      scheduledAt && status === "SCHEDULED"
        ? fromLocalDatetimeValue(scheduledAt)
        : undefined;
    try {
      if (mode === "create") {
        const res = await createAdminArticle({
          title,
          summary,
          body,
          categoryId,
          coverImageUrl,
          metaTitle,
          metaDescription,
          ogImageUrl,
          tagLine,
          status,
          scheduledAt: scheduledIso,
          enTitle,
          enSummary,
          enBody,
          enMetaTitle,
          enMetaDescription,
          enOgImageUrl,
        });
        if (!res.ok) setMessage(res.error);
        else router.push("/admin/bai-viet");
      } else if (initial) {
        const res = await updateAdminArticle({
          id: initial.id,
          title,
          summary,
          body,
          categoryId,
          coverImageUrl,
          metaTitle,
          metaDescription,
          ogImageUrl,
          tagLine,
          status: lockStatusForAuthor ? initial.status : status,
          scheduledAt: scheduledIso,
          enTitle,
          enSummary,
          enBody,
          enMetaTitle,
          enMetaDescription,
          enOgImageUrl,
        });
        if (!res.ok) setMessage(res.error);
        else router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {message}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Tiêu đề</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Chuyên mục</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label ?? c.name}
              </option>
            ))}
          </select>
        </div>
        {showStatus && !lockStatusForAuthor ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ArticleStatus)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {(isElevatedContentRole(userRole)
                ? (["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SCHEDULED", "REJECTED"] as const)
                : (["DRAFT", "PENDING_REVIEW"] as const)
              ).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {lockStatusForAuthor ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Trạng thái</label>
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              {STATUS_LABEL[initial!.status]}
              {initial?.status === "SCHEDULED" && initial.scheduledPublishAt
                ? ` — ${new Date(initial.scheduledPublishAt).toLocaleString("vi-VN")}`
                : null}
            </p>
          </div>
        ) : null}
        {isElevatedContentRole(userRole) && status === "SCHEDULED" ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Hẹn đăng (giờ địa phương)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        ) : null}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Tóm tắt</label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Nội dung</label>
          <RichTextEditor
            key={initial?.id ?? "new"}
            value={body}
            onChange={setBody}
            onUploadImage={upload}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Ảnh bìa (URL)</label>
          <input
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">SEO — tiêu đề meta</label>
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">SEO — ảnh OG (URL)</label>
          <input
            value={ogImageUrl}
            onChange={(e) => setOgImageUrl(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">SEO — mô tả meta</label>
          <textarea
            rows={2}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Thẻ (phân tách bằng dấu phẩy)</label>
          <input
            value={tagLine}
            onChange={(e) => setTagLine(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-600">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Bản tiếng Anh (tùy chọn — để trống nếu chỉ có tiếng Việt)
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Khi nhập, cần đủ tiêu đề, tóm tắt và nội dung. Slug URL tiếng Anh được tạo tự động từ tiêu đề.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Title (EN)</label>
            <input
              value={enTitle}
              onChange={(e) => setEnTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Summary (EN)</label>
            <textarea
              rows={3}
              value={enSummary}
              onChange={(e) => setEnSummary(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Body (EN)</label>
            <RichTextEditor
              key={`${initial?.id ?? "new"}-en`}
              value={enBody}
              onChange={setEnBody}
              onUploadImage={upload}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">SEO — meta title (EN)</label>
            <input
              value={enMetaTitle}
              onChange={(e) => setEnMetaTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">SEO — OG image URL (EN)</label>
            <input
              value={enOgImageUrl}
              onChange={(e) => setEnOgImageUrl(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">SEO — meta description (EN)</label>
            <textarea
              rows={2}
              value={enMetaDescription}
              onChange={(e) => setEnMetaDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Đang lưu…" : mode === "create" ? "Tạo bài" : "Lưu thay đổi"}
        </button>
        {canManageCategories(userRole) ? (
          <Link
            href="/admin/chuyen-muc"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
          >
            Chuyên mục
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function toLocalDatetimeValue(d: Date) {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

function fromLocalDatetimeValue(local: string) {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

import Link from "next/link";
import { ArticleStatus } from "@prisma/client";

import { deleteAdminArticleFormAction, listAdminArticles } from "@/actions/admin-articles";
import { requireStaffSession } from "@/lib/auth-session";
import { canDeleteArticle } from "@/lib/permissions";
import { Pagination } from "@/components/admin/pagination";

const LABEL: Record<ArticleStatus, string> = {
  DRAFT: "Nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Từ chối",
  SCHEDULED: "Hẹn giờ",
};

type Search = { status?: string; q?: string; page?: string };

function DeleteForm({ id, canDelete }: { id: string; canDelete: boolean }) {
  if (!canDelete) return null;
  return (
    <form action={deleteAdminArticleFormAction}>
      <input type="hidden" name="articleId" value={id} />
      <button type="submit" className="text-sm text-red-600 hover:underline dark:text-red-400">
        Xóa
      </button>
    </form>
  );
}

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { user } = await requireStaffSession();
  const sp = await searchParams;
  const status =
    sp.status && Object.values(ArticleStatus).includes(sp.status as ArticleStatus)
      ? (sp.status as ArticleStatus)
      : undefined;
  const page = Number(sp.page) > 0 ? Math.floor(Number(sp.page)) : 1;
  const { items: list, total, page: currentPage, pageSize } = await listAdminArticles({
    status,
    q: sp.q,
    page,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Bài viết</h1>
        <Link
          href="/admin/bai-viet/moi"
          className="inline-block rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Tạo bài mới
        </Link>
      </div>
      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          placeholder="Tìm tiêu đề, tóm tắt…"
          defaultValue={sp.q}
          className="min-w-[180px] rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Mọi trạng thái</option>
          {Object.values(ArticleStatus).map((s) => (
            <option key={s} value={s}>
              {LABEL[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600">
          Lọc
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="p-2 font-medium">Tiêu đề</th>
              <th className="p-2 font-medium">Tác giả</th>
              <th className="p-2 font-medium">Mục</th>
              <th className="p-2 font-medium">Trạng thái</th>
              <th className="p-2 font-medium w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-zinc-500">
                  Chưa có bài nào.
                </td>
              </tr>
            ) : (
              list.map((a) => (
                <tr key={a.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="p-2 font-medium text-zinc-900 dark:text-zinc-100">
                    <Link href={`/admin/bai-viet/${a.id}`} className="hover:underline">
                      {a.title}
                    </Link>
                  </td>
                  <td className="p-2 text-zinc-600 dark:text-zinc-400">
                    {a.author.name ?? a.author.email}
                  </td>
                  <td className="p-2 text-zinc-600 dark:text-zinc-400">{a.category.name}</td>
                  <td className="p-2">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                      {LABEL[a.status]}
                    </span>
                    {a.status === "SCHEDULED" && a.scheduledPublishAt ? (
                      <span className="ml-1 text-xs text-zinc-500">
                        {new Date(a.scheduledPublishAt).toLocaleString("vi-VN")}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <Link href={`/admin/bai-viet/${a.id}`} className="text-blue-600 dark:text-blue-400">
                        Sửa
                      </Link>
                      <DeleteForm
                        id={a.id}
                        canDelete={canDeleteArticle(user, a)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={currentPage}
        total={total}
        pageSize={pageSize}
        basePath="/admin/bai-viet"
        params={{ q: sp.q, status: sp.status }}
      />
    </div>
  );
}

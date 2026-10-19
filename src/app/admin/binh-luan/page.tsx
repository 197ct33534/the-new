import Link from "next/link";

import { listAdminComments } from "@/actions/admin-comments";
import { requireStaffSession } from "@/lib/auth-session";
import { Pagination } from "@/components/admin/pagination";

import { DeleteCommentButton } from "./delete-comment-button";

type Search = { q?: string; kind?: string; page?: string };

export default async function AdminCommentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireStaffSession();
  const sp = await searchParams;
  const kind = sp.kind === "top" || sp.kind === "reply" ? sp.kind : undefined;
  const page = Number(sp.page) > 0 ? Math.floor(Number(sp.page)) : 1;
  const { items: comments, total, page: currentPage, pageSize } = await listAdminComments({
    q: sp.q,
    kind,
    page,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bình luận</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Xoá nội dung không phù hợp (biên tập / quản trị).
        </p>
      </div>
      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          placeholder="Tìm nội dung, người gửi, bài…"
          defaultValue={sp.q}
          className="min-w-[200px] rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <select
          name="kind"
          defaultValue={kind ?? ""}
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Tất cả</option>
          <option value="top">Bình luận gốc</option>
          <option value="reply">Trả lời</option>
        </select>
        <button type="submit" className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600">
          Lọc
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="p-2 font-medium">Thời gian</th>
              <th className="p-2 font-medium">Người gửi</th>
              <th className="p-2 font-medium">Bài</th>
              <th className="p-2 font-medium">Nội dung</th>
              <th className="p-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="whitespace-nowrap p-2 text-zinc-600 dark:text-zinc-400">
                  {new Date(c.createdAt).toLocaleString("vi-VN")}
                </td>
                <td className="p-2 text-zinc-800 dark:text-zinc-200">
                  <span className="block font-medium">{c.user.name ?? "—"}</span>
                  <span className="text-xs text-zinc-500">{c.user.email}</span>
                </td>
                <td className="p-2">
                  <Link
                    href={`/tin-tuc/${c.article.slug}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {c.article.title}
                  </Link>
                </td>
                <td className="max-w-md p-2">
                  {c.parentId ? (
                    <span className="mb-1 inline-block rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      ↳ Trả lời {c.parent?.user.name ?? "—"}
                    </span>
                  ) : c._count.replies > 0 ? (
                    <span className="mb-1 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {c._count.replies} trả lời
                    </span>
                  ) : null}
                  <p className="line-clamp-3 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{c.body}</p>
                </td>
                <td className="whitespace-nowrap p-2">
                  <DeleteCommentButton commentId={c.id} replyCount={c._count.replies} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {comments.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Chưa có bình luận.</p>
        ) : null}
      </div>
      <Pagination
        page={currentPage}
        total={total}
        pageSize={pageSize}
        basePath="/admin/binh-luan"
        params={{ q: sp.q, kind }}
      />
    </div>
  );
}

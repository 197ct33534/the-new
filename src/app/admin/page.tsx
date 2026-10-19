import Link from "next/link";

import { requireStaffSession } from "@/lib/auth-session";
import { canManageCategories } from "@/lib/permissions";

export default async function AdminHomePage() {
  const { user } = await requireStaffSession();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Quản trị nội dung</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Xin chào,{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {user.email ?? "—"}
        </span>{" "}
        <span className="text-zinc-400">({user.role})</span>
      </p>
      <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
        <li>
          <Link href="/admin/bai-viet" className="text-blue-600 underline dark:text-blue-400">
            Quản lý bài viết
          </Link>
        </li>
        {canManageCategories(user.role) ? (
          <li>
            <Link href="/admin/chuyen-muc" className="text-blue-600 underline dark:text-blue-400">
              Chuyên mục
            </Link>
          </li>
        ) : null}
        {canManageCategories(user.role) ? (
          <li>
            <Link href="/admin/binh-luan" className="text-blue-600 underline dark:text-blue-400">
              Bình luận (duyệt / xoá)
            </Link>
          </li>
        ) : null}
        <li>
          <Link href="/admin/tran-dau" className="text-blue-600 underline dark:text-blue-400">
            Trận đấu (lịch)
          </Link>
        </li>
        {canManageCategories(user.role) ? (
          <li>
            <Link href="/admin/doi-bong" className="text-blue-600 underline dark:text-blue-400">
              Đội bóng
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

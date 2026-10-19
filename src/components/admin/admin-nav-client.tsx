"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { canManageCategoriesRole } from "@/lib/role-guards";
import type { UserRole } from "@prisma/client";

const base =
  "block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-200 dark:hover:bg-zinc-800";
const active = "bg-zinc-200 font-medium dark:bg-zinc-800";

type Props = { userEmail?: string | null; role: UserRole };

export function AdminNavClient({ userEmail, role }: Props) {
  const pathname = usePathname();
  return (
    <>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Quản trị</p>
      <nav className="space-y-1">
        <Link href="/admin" className={pathname === "/admin" ? `${base} ${active}` : base}>
          Tổng quan
        </Link>
        <Link
          href="/admin/bai-viet"
          className={pathname === "/admin/bai-viet" || pathname?.startsWith("/admin/bai-viet/") ? `${base} ${active}` : base}
        >
          Bài viết
        </Link>
        {canManageCategoriesRole(role) ? (
          <Link
            href="/admin/chuyen-muc"
            className={pathname?.startsWith("/admin/chuyen-muc") ? `${base} ${active}` : base}
          >
            Chuyên mục
          </Link>
        ) : null}
        {canManageCategoriesRole(role) ? (
          <Link
            href="/admin/binh-luan"
            className={pathname?.startsWith("/admin/binh-luan") ? `${base} ${active}` : base}
          >
            Bình luận
          </Link>
        ) : null}
        <Link
          href="/admin/tran-dau"
          className={pathname?.startsWith("/admin/tran-dau") ? `${base} ${active}` : base}
        >
          Trận đấu
        </Link>
        {canManageCategoriesRole(role) ? (
          <Link
            href="/admin/doi-bong"
            className={pathname?.startsWith("/admin/doi-bong") ? `${base} ${active}` : base}
          >
            Đội bóng
          </Link>
        ) : null}
      </nav>
      <p className="mt-6 text-xs text-zinc-500">
        {userEmail}
        <br />
        <span className="text-zinc-400">{role}</span>
      </p>
    </>
  );
}

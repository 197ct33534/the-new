import { redirect } from "next/navigation";

import { listCategoriesFlat } from "@/actions/admin-categories";
import { ChuyenMucManager } from "@/components/admin/chuyen-muc-manager";
import { requireStaffSession } from "@/lib/auth-session";
import { canManageCategories } from "@/lib/permissions";

type Search = { needCategory?: string };

export default async function ChuyenMucPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { user } = await requireStaffSession();
  if (!canManageCategories(user.role)) {
    redirect("/admin");
  }
  const sp = await searchParams;
  const list = await listCategoriesFlat();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Chuyên mục</h1>
      {sp.needCategory ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Tạo ít nhất một chuyên mục trước khi thêm bài.
        </p>
      ) : null}
      <ChuyenMucManager initialCategories={list} />
    </div>
  );
}

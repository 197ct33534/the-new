import { redirect } from "next/navigation";

import { ArticleForm } from "@/components/admin/article-form";
import { listCategoriesFlat } from "@/actions/admin-categories";
import { requireStaffSession } from "@/lib/auth-session";
import { categorySelectOptions } from "@/lib/category-labels";
import { canManageCategories } from "@/lib/permissions";

export default async function NewArticlePage() {
  const { user } = await requireStaffSession();
  const raw = await listCategoriesFlat();
  if (raw.length === 0) {
    if (canManageCategories(user.role)) {
      redirect("/admin/chuyen-muc?needCategory=1");
    }
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Bài mới</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Chưa có chuyên mục. Vui lòng liên hệ biên tập / quản trị để tạo chuyên mục trước.
        </p>
      </div>
    );
  }
  const categories = categorySelectOptions(raw);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Bài mới</h1>
      <ArticleForm
        mode="create"
        userRole={user.role}
        categories={categories}
      />
    </div>
  );
}

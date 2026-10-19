import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  deleteAdminArticleFormAction,
  getAdminArticle,
} from "@/actions/admin-articles";
import { listCategoriesFlat } from "@/actions/admin-categories";
import { ArticleForm } from "@/components/admin/article-form";
import { ArticleReviewActions } from "@/components/admin/article-review-actions";
import { requireStaffSession } from "@/lib/auth-session";
import { categorySelectOptions } from "@/lib/category-labels";
import { canDeleteArticle, canReviewOrPublish } from "@/lib/permissions";

type Params = { id: string };

export default async function EditArticlePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const { user } = await requireStaffSession();
  const [article, rawCats] = await Promise.all([getAdminArticle(id), listCategoriesFlat()]);
  if (!article) notFound();
  if (rawCats.length === 0) {
    if (canReviewOrPublish(user.role)) {
      redirect("/admin/chuyen-muc?needCategory=1");
    }
    notFound();
  }
  const categories = categorySelectOptions(rawCats);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Sửa bài</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/bai-viet" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
            ← Danh sách
          </Link>
          {canDeleteArticle(user, article) ? (
            <form action={deleteAdminArticleFormAction}>
              <input type="hidden" name="articleId" value={article.id} />
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline dark:text-red-400"
              >
                Xóa bài
              </button>
            </form>
          ) : null}
        </div>
      </div>
      {canReviewOrPublish(user.role) && (
        (article.status === "PENDING_REVIEW" || article.status === "DRAFT") ? (
          <ArticleReviewActions articleId={article.id} status={article.status} />
        ) : null
      )}
      <ArticleForm
        mode="edit"
        userRole={user.role}
        categories={categories}
        initial={article}
      />
    </div>
  );
}

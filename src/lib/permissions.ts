import type { UserRole } from "@prisma/client";
import { ArticleStatus } from "@prisma/client";

const STAFF_ROLES: UserRole[] = ["CONTRIBUTOR", "AUTHOR", "EDITOR", "ADMIN"];

export function isStaffRole(role: UserRole) {
  return STAFF_ROLES.includes(role);
}

export function canAccessAdminDashboard(role: UserRole) {
  return isStaffRole(role);
}

export function canManageCategories(role: UserRole) {
  return role === "EDITOR" || role === "ADMIN";
}

export function canReviewOrPublish(role: UserRole) {
  return role === "EDITOR" || role === "ADMIN";
}

export function isElevatedContentRole(role: UserRole) {
  return role === "EDITOR" || role === "ADMIN";
}

export function canViewArticleInAdmin(
  user: { id: string; role: UserRole },
  article: { authorId: string },
) {
  if (isElevatedContentRole(user.role)) return true;
  if (isStaffRole(user.role)) return article.authorId === user.id;
  return false;
}

export function canEditArticleContent(
  user: { id: string; role: UserRole },
  article: { authorId: string; status: ArticleStatus },
) {
  if (isElevatedContentRole(user.role)) return true;
  if (!isStaffRole(user.role)) return false;
  if (article.authorId !== user.id) return false;
  return true;
}

export function canDeleteArticle(
  user: { id: string; role: UserRole },
  article: { authorId: string },
) {
  if (isElevatedContentRole(user.role)) return true;
  if ((user.role === "AUTHOR" || user.role === "CONTRIBUTOR") && article.authorId === user.id) {
    return true;
  }
  return false;
}

/** Trạng thái mà tác giả / CTV có thể đặt khi lưu (không tự xuất bản). */
export const AUTHOR_ALLOWED_STATUSES: ArticleStatus[] = [ArticleStatus.DRAFT, ArticleStatus.PENDING_REVIEW];

export function canAuthorSetStatus(role: UserRole, status: ArticleStatus) {
  if (isElevatedContentRole(role)) return true;
  if (role === "AUTHOR" || role === "CONTRIBUTOR") {
    return AUTHOR_ALLOWED_STATUSES.includes(status);
  }
  return false;
}

export function isArticlePublic(article: { status: ArticleStatus; publishedAt: Date | null }) {
  if (article.status !== ArticleStatus.PUBLISHED) return false;
  if (!article.publishedAt) return true;
  return article.publishedAt.getTime() <= Date.now();
}

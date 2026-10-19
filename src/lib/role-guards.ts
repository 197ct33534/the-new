/** Không phụ thuộc Prisma — dùng cả trên client. */
export function canManageCategoriesRole(role: string) {
  return role === "EDITOR" || role === "ADMIN";
}

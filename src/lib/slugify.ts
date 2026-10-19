import { createHash } from "node:crypto";

/** Slug gọn, ổn định cho URL (không bắt buộc giữ dấu tiếng Việt). */
export function slugifyTitle(title: string) {
  const s = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  if (s.length > 0) return s;
  return `bai-${createHash("sha256").update(title).digest("hex").slice(0, 8)}`;
}

export function uniqueSlugAttempt(base: string, suffix: string | number) {
  return `${base}-${suffix}`;
}

/**
 * AUTH_SECRET bắt buộc trên production. Trên development, dùng fallback cố định
 * để tránh 500 khi .env chưa điền (không dùng fallback khi NODE_ENV=production).
 */
export function getAuthSecret(): string {
  const fromEnv = process.env.AUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    return "";
  }
  return "dev-only-insecure-secret-do-not-use-in-production";
}

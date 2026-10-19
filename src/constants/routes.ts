/**
 * Pathname nội bộ (trùng thư mục trong app + key `pathnames` trong `i18n/routing`).
 * `Link` / `redirect` từ `@/i18n/navigation` sẽ map sang URL đúng locale (vd. en → /news, /schedule).
 */
export const ROUTES = {
  home: "/",
  news: "/tin-tuc",
  schedule: "/lich-thi-dau",
  standings: "/bang-xep-hang",
  signIn: "/dang-nhap",
  register: "/dang-ky",
  feed: "/feed",
  account: "/tai-khoan",
} as const;

import { defineRouting } from "next-intl/routing";

/**
 * pathname key = đường dẫn nội bộ (trùng thư mục app). URL hiển thị theo locale trong `pathnames`.
 */
export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/tin-tuc": { vi: "/tin-tuc", en: "/news" },
    "/tin-tuc/[slug]": { vi: "/tin-tuc/[slug]", en: "/news/[slug]" },
    "/lich-thi-dau": { vi: "/lich-thi-dau", en: "/schedule" },
    "/bang-xep-hang": { vi: "/bang-xep-hang", en: "/standings" },
    "/dang-nhap": { vi: "/dang-nhap", en: "/sign-in" },
    "/dang-ky": { vi: "/dang-ky", en: "/sign-up" },
    "/tai-khoan": { vi: "/tai-khoan", en: "/account" },
  },
});

/** Đường đăng nhập công khai theo locale (middleware Edge — không dùng getPathname). */
export function signInPathForLocale(locale: string | undefined) {
  return locale === "en" ? "/en/sign-in" : "/dang-nhap";
}

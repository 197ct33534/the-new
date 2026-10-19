import { getPathname } from "@/i18n/navigation";

/** Các pathname nội bộ (trùng key trong i18n routing), không gồm /tin-tuc/[slug]. */
type InternalStaticHref =
  | "/"
  | "/tin-tuc"
  | "/lich-thi-dau"
  | "/bang-xep-hang"
  | "/dang-nhap"
  | "/dang-ky"
  | "/tai-khoan";

/**
 * Đường dẫn hiển thị trên URL (đã localized, có tiền tố locale khi cần).
 * `pathname`: nội bộ như `/tin-tuc`, `/tin-tuc/slug-bai`, `/`.
 */
export function publicPathForLocale(locale: string, pathname: string) {
  const raw = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (raw === "" || raw === "/") {
    return getPathname({ locale, href: "/" });
  }

  const articleMatch = raw.match(/^\/tin-tuc\/([^/]+)$/);
  if (articleMatch) {
    return getPathname({
      locale,
      href: { pathname: "/tin-tuc/[slug]", params: { slug: articleMatch[1] } },
    });
  }

  return getPathname({ locale, href: raw as InternalStaticHref });
}

export function absolutePublicUrl(base: string, locale: string, pathname: string) {
  return `${base.replace(/\/$/, "")}${publicPathForLocale(locale, pathname)}`;
}

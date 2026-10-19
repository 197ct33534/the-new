import { revalidatePath } from "next/cache";

import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

type InternalStaticHref =
  | "/"
  | "/tin-tuc"
  | "/lich-thi-dau"
  | "/bang-xep-hang"
  | "/dang-nhap"
  | "/dang-ky"
  | "/tai-khoan";

/** Làm mới route công khai cho mọi locale. `internalPath`: nội bộ (/tin-tuc, /tin-tuc/slug, …). */
export function revalidatePublicPaths(internalPath: string) {
  const normalized =
    internalPath === "" || internalPath === "/"
      ? "/"
      : internalPath.startsWith("/")
        ? internalPath
        : `/${internalPath}`;

  const articleMatch = normalized.match(/^\/tin-tuc\/([^/]+)$/);

  for (const locale of routing.locales) {
    if (articleMatch) {
      revalidatePath(
        getPathname({
          locale,
          href: { pathname: "/tin-tuc/[slug]", params: { slug: articleMatch[1] } },
        }),
      );
    } else if (normalized === "/") {
      revalidatePath(getPathname({ locale, href: "/" }));
    } else {
      revalidatePath(getPathname({ locale, href: normalized as InternalStaticHref }));
    }
  }
}

/** Làm mới trang chủ, danh sách tin và chi tiết bài (mọi locale / mọi slug EN+VI). */
export async function revalidatePublishedArticleById(articleId: string) {
  const row = await prisma.article.findUnique({
    where: { id: articleId },
    select: { slug: true, locales: { where: { locale: "en" }, select: { slug: true } } },
  });
  if (!row) return;
  revalidatePublicPaths(`/tin-tuc/${row.slug}`);
  const en = row.locales[0];
  if (en) revalidatePublicPaths(`/tin-tuc/${en.slug}`);
  revalidatePublicPaths("/tin-tuc");
  revalidatePublicPaths("/");
}

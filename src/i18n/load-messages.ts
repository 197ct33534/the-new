import type { Locale } from "next-intl";

/**
 * Mỗi file = một "nhóm" giống file trong `lang/` của Laravel (`messages.php`, `validation.php`, …).
 * Gộp thành object messages cho next-intl: { site: {...}, nav: {...}, ... }.
 */
export const LANG_NAMESPACES = [
  "site",
  "nav",
  "locale",
  "home",
  "news",
  "article",
  "matchStatus",
  "schedule",
  "standings",
  "auth",
  "account",
  "comments",
  "registerErrors",
] as const;

export type LangNamespace = (typeof LANG_NAMESPACES)[number];

export async function loadMessages(locale: Locale) {
  const messages: Partial<Record<LangNamespace, Record<string, string>>> = {};

  await Promise.all(
    LANG_NAMESPACES.map(async (ns) => {
      const mod = await import(`../lang/${locale}/${ns}.json`);
      messages[ns] = mod.default;
    }),
  );

  return messages as Record<LangNamespace, Record<string, string>>;
}

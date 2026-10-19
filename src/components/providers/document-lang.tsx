"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Đồng bộ <html lang> với locale (layout gốc không biết locale). */
export function DocumentLang() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

// Pick the right localized value for the active locale.
export function pick<T>(locale: string, en: T, ar: T): T {
  return locale === "ar" ? ar : en;
}

// Localize a category record (stored with both names in the DB).
export function categoryName(
  locale: string,
  category: { nameEn: string; nameAr: string },
): string {
  return pick(locale, category.nameEn, category.nameAr);
}

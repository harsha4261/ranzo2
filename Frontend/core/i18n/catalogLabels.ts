import { t } from '@/core/i18n';

export function tCategory(categoryId: string, fallback?: string) {
  const key = `customer.categories.${categoryId}`;
  const translated = t(key);
  return translated === key ? (fallback ?? categoryId) : translated;
}

export function tSubcategory(subcategoryId: string, fallback?: string) {
  const key = `customer.subcategories.${subcategoryId}`;
  const translated = t(key);
  return translated === key ? (fallback ?? subcategoryId) : translated;
}

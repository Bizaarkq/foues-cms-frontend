/**
 * Block-level search helpers — shared by the list-type SDUI blocks
 * (document repository, magazine archive, article list).
 */

/**
 * normalizeSearchText — case- and diacritic-insensitive comparison key
 * ("odontologia" matches "Odontología").
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Whether `haystack` contains `query`, ignoring case and accents. */
export function matchesSearch(haystack: string, query: string): boolean {
  return normalizeSearchText(haystack).includes(normalizeSearchText(query));
}

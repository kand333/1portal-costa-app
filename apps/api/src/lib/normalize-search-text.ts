/**
 * Normalizes text for accent- and case-insensitive search: lowercase and without diacritics,
 * so "Maipú" -> "maipu", "Ñuñoa" -> "nunoa" and "Concón" -> "concon".
 *
 * It decomposes the text with Unicode NFD (an accented letter becomes the base letter plus
 * combining marks) and drops the marks, so it works for any Latin letter and for text in either
 * composed or decomposed form. It must give the same result as the `search_normalize()` SQL
 * function that fills `Property.searchText`; a database test keeps both aligned.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // combining diacritical marks
    .toLowerCase();
}

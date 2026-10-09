export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** True for a usable page address: lower-case words joined by single hyphens. */
export function isValidSlug(slug: string): boolean {
  return slug.length >= SLUG_MIN_LENGTH && slug.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(slug);
}

/**
 * Suggests a page address from a business name: "Ace Floors & Co." becomes
 * "ace-floors-co". The result may be too short to be valid; check it with
 * `isValidSlug`.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");
}

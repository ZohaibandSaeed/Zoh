export const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "dashboard",
  "manage",
  "list",
  "login",
  "auth",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "not-found",
  "_next",
  "public",
  "static",
  "setup-db",
]);

/**
 * Validates whether the given string is a valid HTTP or HTTPS URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalizes an input URL by trimming and adding https:// if protocol was omitted
 */
export function normalizeUrl(url: string): string {
  let cleaned = url.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

/**
 * Sanitizes a custom slug into a clean, URL-safe format:
 * - Converts to lowercase
 * - Replaces spaces and underscores with hyphens
 * - Removes any character that is not alphanumeric or a hyphen
 * - Removes leading/trailing hyphens and collapses consecutive hyphens
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Checks whether a slug is reserved by the application routes
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}


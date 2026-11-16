/**
 * Utilities for extracting, validating, and formatting user avatar profile URLs and initials.
 */

/**
 * Checks whether a candidate string is a valid image URL or image data string.
 * Avoids misidentifying short initials strings (e.g. "NK", "JD", "U") as image sources.
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Initials strings are typically <= 4 characters and contain no path separators or file extensions
  if (trimmed.length <= 4 && !trimmed.includes("/") && !trimmed.includes(".")) {
    return false;
  }

  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/") ||
    trimmed.includes("cloudinary.com") ||
    trimmed.includes("/")
  );
}

/**
 * Extracts a profile image URL from any user, employee, or leaderboard object.
 * Checks backend field "avtar", standard "avatar", "avatarUrl", "photo", "profileImage",
 * and nested user objects without throwing type errors.
 */
export function getAvatarUrl(user: unknown): string | undefined {
  if (!user) return undefined;
  if (typeof user === "string") {
    return isValidImageUrl(user) ? user.trim() : undefined;
  }
  if (typeof user !== "object") return undefined;

  const obj = user as Record<string, unknown>;
  const nested =
    obj.user && typeof obj.user === "object"
      ? (obj.user as Record<string, unknown>)
      : undefined;

  const candidate =
    obj.avatarUrl ||
    obj.avtar ||
    obj.avatar ||
    obj.photo ||
    obj.profileImage ||
    obj.image ||
    nested?.avatarUrl ||
    nested?.avtar ||
    nested?.avatar ||
    nested?.photo ||
    nested?.profileImage;

  if (typeof candidate === "string" && isValidImageUrl(candidate)) {
    return candidate.trim();
  }

  return undefined;
}

/**
 * Returns clean 1 or 2 letter initials for a given person name.
 */
export function getInitials(name?: string | null, fallback = "U"): string {
  if (!name || typeof name !== "string") return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


/**
 * Lightweight client-side sanitization utilities.
 * Strips HTML/script tags and control characters from user-supplied text
 * so nothing injected through kid names or pet names can execute as markup.
 */

const HTML_TAG_RE = /<[^>]*>/g;
const CONTROL_CHAR_RE = /[\x00-\x1F\x7F]/g;

/**
 * Strips HTML tags, control characters, and leading/trailing whitespace from
 * a user-supplied string. Truncates to `maxLen` characters (default 80).
 */
export function sanitizeText(raw: string, maxLen = 80): string {
  return raw
    .replace(HTML_TAG_RE, '')
    .replace(CONTROL_CHAR_RE, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Sanitize a display name (kid name, pet name).  Max 40 characters.
 */
export function sanitizeName(raw: string): string {
  return sanitizeText(raw, 40);
}

/**
 * Strips HTML tags, control characters, and trims whitespace from input text.
 * @param {string} text - The raw input text to sanitize.
 * @returns {string} Sanitized text.
 */
export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Formats a date into a human-readable string.
 * @param {Date|string|number} date - The date to format.
 * @returns {string} Formatted date string, e.g. "May 21, 2026".
 */
export function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncates text to the specified maximum length, appending an ellipsis if truncated.
 * @param {string} text - The text to truncate.
 * @param {number} maxLength - Maximum allowed length (default: 100).
 * @returns {string} Truncated text.
 */
export function truncateText(text, maxLength = 100) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Joins CSS class names, filtering out falsy values.
 * @param {...(string|boolean|undefined|null)} classes - Class names to join.
 * @returns {string} Joined class string.
 */
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Copies text to the clipboard with a fallback for older browsers.
 * @param {string} text - The text to copy.
 * @returns {Promise<boolean>} Whether the copy succeeded.
 */
export async function copyToClipboard(text) {
  if (typeof navigator === 'undefined') return false;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }

  return fallbackCopy(text);
}

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  } catch {
    return false;
  }
}

/**
 * Generates a random alphanumeric ID string.
 * @param {number} length - Length of the ID (default: 16).
 * @returns {string} Random ID.
 */
export function generateId(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map((byte) => chars[byte % chars.length])
    .join('');
}

/**
 * Returns the first two initials from a name.
 * @param {string} name - Full name.
 * @returns {string} Up to two uppercase initials, e.g. "JD".
 */
export function getInitials(name) {
  if (typeof name !== 'string' || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns a human-readable relative time string such as "2 days ago".
 * @param {Date|string|number} date - The date to compare against now.
 * @returns {string} Relative time string.
 */
export function formatRelativeTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 0) return 'just now';
  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
}

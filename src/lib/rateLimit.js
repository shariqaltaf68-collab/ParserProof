const rateLimitStore = new Map();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * In-memory rate limiter. Tracks request counts per key within a sliding window.
 *
 * @param {string} key - Unique identifier for the rate limit bucket (e.g., IP address, user ID).
 * @param {number} limit - Maximum number of requests allowed within the window.
 * @param {number} windowMs - Duration of the rate limit window in milliseconds.
 * @returns {{ success: boolean, remaining: number, resetIn: number }}
 */
export function rateLimit(key, limit = 10, windowMs = 60_000) {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetIn: windowMs,
    };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const resetIn = entry.resetAt - now;

  if (entry.count > limit) {
    return {
      success: false,
      remaining: 0,
      resetIn,
    };
  }

  return {
    success: true,
    remaining,
    resetIn,
  };
}

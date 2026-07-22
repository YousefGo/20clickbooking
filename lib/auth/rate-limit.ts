const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

const attemptsByKey = new Map<string, { count: number; resetAt: number }>();

/** Simple in-memory sliding-window limiter. Good enough for a single-instance MVP admin login. */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attemptsByKey.get(key);

  if (!entry || entry.resetAt < now) {
    attemptsByKey.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export function resetRateLimit(key: string): void {
  attemptsByKey.delete(key);
}

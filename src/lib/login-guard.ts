export type Attempt = { count: number; until: number };

const WINDOW = 15 * 60 * 1000;
const MAX_KEYS = 500;

/** Prefer the platform IP. A caller can prepend values to X-Forwarded-For. */
export function clientAddress(headers: Headers) {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for");
  if (!forwarded) return "local";
  const parts = forwarded
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.at(-1) || "local";
}

export function isBlocked(attempts: Map<string, Attempt>, key: string, now: number) {
  const entry = attempts.get(key);
  return Boolean(entry && entry.until > now && entry.count >= 8);
}

export function noteAttempt(attempts: Map<string, Attempt>, key: string, ok: boolean, now: number) {
  if (ok) {
    attempts.delete(key);
    return;
  }
  const entry = attempts.get(key);
  if (!entry || entry.until <= now) {
    attempts.set(key, { count: 1, until: now + WINDOW });
  } else {
    entry.count += 1;
  }
  while (attempts.size > MAX_KEYS) {
    const oldest = attempts.keys().next().value;
    if (!oldest || oldest === key) break;
    attempts.delete(oldest);
  }
}

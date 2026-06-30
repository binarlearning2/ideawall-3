/**
 * Minimal in-memory rate limiter (PRD §12: "batasi pembuatan sticky note ... untuk cegah
 * spam tidak sengaja"). This is best-effort: on Vercel's serverless runtime each request
 * may land on a different instance, so this does NOT guarantee a global limit. It's
 * sufficient for the stated goal (catching accidental double-clicks within one warm
 * instance), not for defending against a determined abuser. If stricter limiting is ever
 * needed, move this to a shared store (e.g. Upstash Redis / Vercel KV).
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string, max = MAX_PER_WINDOW, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const existing = hits.get(key) ?? [];
  const recent = existing.filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
}

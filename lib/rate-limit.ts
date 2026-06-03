// Lightweight in-memory fixed-window rate limiter.
// Good enough for a single-instance deployment / development. For multi-instance
// production, swap the Map for a shared store (e.g. Upstash Redis).

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return {
    success,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/** Best-effort client IP from common proxy headers. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Periodically evict expired buckets so the Map doesn't grow unbounded.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    store.forEach((v, k) => {
      if (v.resetAt < now) store.delete(k);
    });
  }, 5 * 60_000);
  // Don't keep the Node process alive solely for this cleanup timer
  if (typeof timer === "object" && "unref" in timer) timer.unref();
}

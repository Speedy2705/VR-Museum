type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  options: { limit?: number; windowMs?: number } = {},
) {
  const limit = options.limit ?? 10;
  const windowMs = options.windowMs ?? 60_000;
  if (!Number.isInteger(limit) || limit < 1 || windowMs < 1) {
    throw new RangeError("Rate-limit values must be positive");
  }
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

/** Test-only reset hook; the limiter remains process-local by design. */
export function resetRateLimits() {
  buckets.clear();
}

export function getRequestIdentity(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local"
  );
}

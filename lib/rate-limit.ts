type Bucket = { timestamps: number[] }

const store = new Map<string, Bucket>()

export type RateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = store.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)

  if (bucket.timestamps.length >= max) {
    const oldest = bucket.timestamps[0]
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000))
    store.set(key, bucket)
    return { ok: false, remaining: 0, retryAfterSec }
  }

  bucket.timestamps.push(now)
  store.set(key, bucket)
  return { ok: true, remaining: max - bucket.timestamps.length, retryAfterSec: 0 }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

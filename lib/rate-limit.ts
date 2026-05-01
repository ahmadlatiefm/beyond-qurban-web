type WindowEntry = { count: number; resetAt: number }

const store = new Map<string, WindowEntry>()

const WINDOW_MS = 60_000
const MAX_REQUESTS = 5

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now >= entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count += 1
  return { allowed: true, retryAfterMs: 0 }
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now >= entry.resetAt) store.delete(key)
  })
}, 5 * 60_000)

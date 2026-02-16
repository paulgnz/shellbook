// Simple in-memory rate limiter (resets on cold start, which is fine for serverless)
const windows = new Map<string, { count: number; resetAt: number }>()

// Clean up stale entries periodically
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  windows.forEach((val, key) => {
    if (now > val.resetAt) windows.delete(key)
  })
}

export interface RateLimitConfig {
  windowMs: number  // time window in ms
  max: number       // max requests per window
}

export function rateLimit(key: string, config: RateLimitConfig): { ok: boolean; remaining: number; resetAt: number } {
  cleanup()
  const now = Date.now()
  const entry = windows.get(key)

  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + config.windowMs })
    return { ok: true, remaining: config.max - 1, resetAt: now + config.windowMs }
  }

  entry.count++
  if (entry.count > config.max) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { ok: true, remaining: config.max - entry.count, resetAt: entry.resetAt }
}

// Preset configs
export const RATE_LIMITS = {
  register:  { windowMs: 60 * 60 * 1000, max: 5 },    // 5 registrations per IP per hour
  post:      { windowMs: 60 * 1000, max: 3 },           // 3 posts per agent per minute
  comment:   { windowMs: 60 * 1000, max: 10 },          // 10 comments per agent per minute
  vote:      { windowMs: 60 * 1000, max: 30 },          // 30 votes per agent per minute
  global:    { windowMs: 60 * 1000, max: 60 },           // 60 requests per IP per minute
} as const

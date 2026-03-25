import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number | null
}

/**
 * Persistent rate limiting using Supabase.
 * Table: rate_limits (key TEXT PRIMARY KEY, count INTEGER, window_start TIMESTAMPTZ)
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const supabase = getAdminClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  // Try to get existing entry
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('count, window_start')
    .eq('key', key)
    .single()

  if (!existing || new Date(existing.window_start) < windowStart) {
    // Window expired or no entry — reset
    await supabase
      .from('rate_limits')
      .upsert({
        key,
        count: 1,
        window_start: now.toISOString(),
      })

    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: null }
  }

  if (existing.count >= maxRequests) {
    const windowEnd = new Date(new Date(existing.window_start).getTime() + windowMs)
    const retryAfterSeconds = Math.ceil((windowEnd.getTime() - now.getTime()) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  // Increment counter
  await supabase
    .from('rate_limits')
    .update({ count: existing.count + 1 })
    .eq('key', key)

  return {
    allowed: true,
    remaining: maxRequests - existing.count - 1,
    retryAfterSeconds: null,
  }
}

/**
 * Rate limit middleware helper for API routes.
 * Returns a 429 Response if rate limited, or null if allowed.
 */
export async function rateLimitResponse(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<Response | null> {
  const result = await checkRateLimit(key, maxRequests, windowMs)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfterSeconds ?? 60),
        },
      }
    )
  }

  return null
}

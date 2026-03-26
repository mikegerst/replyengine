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
 * Uses an atomic Postgres function to prevent race conditions.
 * Table: rate_limits (key TEXT PRIMARY KEY, count INTEGER, window_start TIMESTAMPTZ)
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const supabase = getAdminClient()

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_max_count: maxRequests,
    p_window_ms: windowMs,
  })

  if (error || !data || data.length === 0) {
    // If the RPC fails (e.g., function not deployed yet), allow the request
    // but log the error for monitoring
    console.error('Rate limit check failed, allowing request:', error?.message)
    return { allowed: true, remaining: maxRequests, retryAfterSeconds: null }
  }

  const row = data[0] as { allowed: boolean; current_count: number }
  const allowed = row.allowed
  const currentCount = row.current_count

  if (!allowed) {
    const retryAfterSeconds = Math.ceil(windowMs / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  return {
    allowed: true,
    remaining: maxRequests - currentCount,
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

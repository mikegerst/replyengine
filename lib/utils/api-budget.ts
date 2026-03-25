import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DAILY_GENERATION_LIMIT = parseInt(
  process.env.AI_DAILY_GENERATION_LIMIT ?? '1000',
  10
)

// Estimated cost per generation in cents (Claude Sonnet ~$0.01-0.015 per call)
const ESTIMATED_COST_PER_GENERATION_CENTS = 1

interface BudgetCheckResult {
  allowed: boolean
  currentCount: number
  limit: number
}

/**
 * Check if the daily AI generation budget has been exceeded.
 * Uses the api_usage table to track daily counts.
 */
export async function checkApiBudget(): Promise<BudgetCheckResult> {
  const supabase = getAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: usage } = await supabase
    .from('api_usage')
    .select('generation_count')
    .eq('date', today)
    .single()

  const currentCount = usage?.generation_count ?? 0

  if (currentCount >= DAILY_GENERATION_LIMIT) {
    console.warn(
      `[API Budget] Daily AI generation limit reached: ${currentCount}/${DAILY_GENERATION_LIMIT}`
    )
    return { allowed: false, currentCount, limit: DAILY_GENERATION_LIMIT }
  }

  return { allowed: true, currentCount, limit: DAILY_GENERATION_LIMIT }
}

/**
 * Increment the daily generation counter after a successful AI call.
 */
export async function incrementApiUsage(): Promise<void> {
  const supabase = getAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('api_usage')
    .select('generation_count, estimated_cost_cents')
    .eq('date', today)
    .single()

  if (existing) {
    await supabase
      .from('api_usage')
      .update({
        generation_count: existing.generation_count + 1,
        estimated_cost_cents:
          existing.estimated_cost_cents + ESTIMATED_COST_PER_GENERATION_CENTS,
      })
      .eq('date', today)
  } else {
    await supabase.from('api_usage').insert({
      date: today,
      generation_count: 1,
      estimated_cost_cents: ESTIMATED_COST_PER_GENERATION_CENTS,
    })
  }
}

/**
 * API budget check that returns a 503 Response if budget exceeded, or null if allowed.
 */
export async function apiBudgetResponse(): Promise<Response | null> {
  const result = await checkApiBudget()

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Service temporarily unavailable. Please try again tomorrow.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return null
}

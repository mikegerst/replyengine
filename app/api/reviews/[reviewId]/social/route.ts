import { createClient } from '@/lib/supabase/server'
import { generateSocialContent } from '@/lib/ai/generate-social-content'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { apiBudgetResponse, incrementApiUsage } from '@/lib/utils/api-budget'
import type { Business, Review } from '@/lib/types/database'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: { reviewId: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 100 per minute per user
  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  // API budget check
  const budgetExceeded = await apiBudgetResponse()
  if (budgetExceeded) return budgetExceeded

  const { data: review } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', params.reviewId)
    .single()

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', (review as Review).business_id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Plan enforcement: social content requires starter or pro
  if ((business as Business).plan === 'free') {
    return NextResponse.json(
      { error: 'This feature requires a Starter or Pro plan. Upgrade at /dashboard/billing' },
      { status: 403 }
    )
  }

  try {
    const content = await generateSocialContent(review as Review, business as Business)
    await incrementApiUsage()
    return NextResponse.json({ data: content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate social content'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

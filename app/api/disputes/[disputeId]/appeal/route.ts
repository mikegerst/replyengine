import { createClient } from '@/lib/supabase/server'
import { generateAppealText } from '@/lib/ai/generate-appeal'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { apiBudgetResponse, incrementApiUsage } from '@/lib/utils/api-budget'
import type { Business, Review, ReviewDispute } from '@/lib/types/database'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: { disputeId: string } }
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

  // Fetch dispute with review
  const { data: dispute, error: disputeError } = await supabase
    .from('review_disputes')
    .select('*, reviews(*)')
    .eq('id', params.disputeId)
    .single()

  if (disputeError || !dispute) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
  }

  const typedDispute = dispute as ReviewDispute & { reviews: Review }

  // Fetch business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', typedDispute.business_id)
    .single()

  if (bizError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Plan enforcement: disputes require starter or pro
  if ((business as Business).plan === 'free') {
    return NextResponse.json(
      { error: 'This feature requires a Starter or Pro plan. Upgrade at /dashboard/billing' },
      { status: 403 }
    )
  }

  try {
    const appealText = await generateAppealText(
      typedDispute.reviews,
      business as Business,
      typedDispute
    )

    await incrementApiUsage()

    // Save appeal text to dispute
    const { data: updated, error: updateError } = await supabase
      .from('review_disputes')
      .update({ appeal_text: appealText })
      .eq('id', params.disputeId)
      .select('*, reviews(*)')
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save appeal' }, { status: 500 })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate appeal'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

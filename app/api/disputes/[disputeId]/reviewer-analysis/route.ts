import { createClient } from '@/lib/supabase/server'
import { analyzeReviewerProfile } from '@/lib/ai/analyze-reviewer'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { apiBudgetResponse, incrementApiUsage } from '@/lib/utils/api-budget'
import type { Review, ReviewDispute } from '@/lib/types/database'
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

  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const budgetExceeded = await apiBudgetResponse()
  if (budgetExceeded) return budgetExceeded

  const { data: dispute, error: disputeError } = await supabase
    .from('review_disputes')
    .select('*, reviews(*)')
    .eq('id', params.disputeId)
    .single()

  if (disputeError || !dispute) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
  }

  const typedDispute = dispute as ReviewDispute & { reviews: Review }

  try {
    const analysis = await analyzeReviewerProfile(
      typedDispute.reviews.reviewer_name,
      typedDispute.reviews.review_text
    )

    await incrementApiUsage()

    // Save to dispute
    const { data: updated, error: updateError } = await supabase
      .from('review_disputes')
      .update({
        reviewer_specificity: analysis.specificityScore,
        reviewer_verifiable_details: analysis.verifiableDetails,
        reviewer_suspicious_indicators: analysis.suspiciousIndicators,
        reviewer_profile_summary: analysis.profileSummary,
      })
      .eq('id', params.disputeId)
      .select('*, reviews(*)')
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze reviewer'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

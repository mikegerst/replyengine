import { createClient } from '@/lib/supabase/server'
import { generateReviewResponse } from '@/lib/ai/generate-response'
import { generateAmplifyResponse } from '@/lib/ai/generate-amplify-response'
import { analyzeForDispute } from '@/lib/ai/analyze-dispute'
import { canGenerateResponse } from '@/lib/utils/plan-limits'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { apiBudgetResponse, incrementApiUsage } from '@/lib/utils/api-budget'
import type { Business, Review, ResponsePattern } from '@/lib/types/database'
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

  // Fetch the review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', params.reviewId)
    .single()

  if (reviewError || !review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const typedReview = review as Review

  // Fetch the business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', typedReview.business_id)
    .single()

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const typedBusiness = business as Business

  // Check plan limits
  if (!canGenerateResponse(typedBusiness)) {
    return NextResponse.json(
      { error: 'Monthly response limit reached. Upgrade your plan for more responses.' },
      { status: 403 }
    )
  }

  // Fetch matching response patterns
  const { data: patterns } = await supabase
    .from('response_patterns')
    .select('*')
    .eq('business_id', typedBusiness.id)
    .eq('is_active', true)

  const typedPatterns = (patterns ?? []) as ResponsePattern[]

  // Generate AI response — use amplify for 4-5 star reviews
  try {
    const result = typedReview.star_rating >= 4
      ? await generateAmplifyResponse(typedReview, typedBusiness)
      : await generateReviewResponse(typedReview, typedBusiness, typedPatterns)

    await incrementApiUsage()

    // Save the response to the review
    const { data: updated, error: updateError } = await supabase
      .from('reviews')
      .update({
        ai_response: result.response,
        response_status: 'draft',
        sentiment: result.sentiment,
        key_topics: result.keyTopics,
      })
      .eq('id', params.reviewId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save generated response' },
        { status: 500 }
      )
    }

    // Increment monthly response count
    const { error: rpcError } = await supabase.rpc('increment_response_count', {
      business_id_input: typedBusiness.id,
    })

    if (rpcError) {
      // RPC may not exist yet — fall back to manual increment
      await supabase
        .from('businesses')
        .update({
          monthly_response_count: typedBusiness.monthly_response_count + 1,
        })
        .eq('id', typedBusiness.id)
    }

    // Analyze reviews that negatively impact the business's rating
    // A review drags the score down if it's below the current average (ceiled),
    // OR if it's 1-2 stars regardless of average
    try {
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('star_rating')
        .eq('business_id', typedBusiness.id)

      const avgRating = allReviews && allReviews.length > 0
        ? allReviews.reduce((sum: number, r: { star_rating: number }) => sum + r.star_rating, 0) / allReviews.length
        : 5

      const isNegativeImpact = typedReview.star_rating < Math.ceil(avgRating)
      const isLowRating = typedReview.star_rating <= 2

      if (isNegativeImpact || isLowRating) {
        const dispute = await analyzeForDispute(typedReview, typedBusiness)
        if (dispute.isDisputable) {
          await supabase.from('review_disputes').insert({
            review_id: typedReview.id,
            business_id: typedBusiness.id,
            reason: dispute.violations.join(', '),
            ai_confidence_score: dispute.confidence === 'high' ? 0.9 : dispute.confidence === 'medium' ? 0.6 : 0.3,
            ai_analysis: dispute.reasoning,
            violations: dispute.violations,
            suggested_dispute_text: dispute.suggestedDisputeText,
            confidence: dispute.confidence,
            status: 'detected',
          })
        }
      }
    } catch {
      // Dispute analysis is non-critical — don't fail the response generation
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

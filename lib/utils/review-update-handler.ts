import type { SupabaseClient } from '@supabase/supabase-js'
import type { Business, Review } from '@/lib/types/database'
import { generateReviewResponse } from '@/lib/ai/generate-response'
import { generateRecoverySequence } from '@/lib/ai/generate-recovery'

export async function handleReviewUpdate(
  oldReview: Review,
  newReview: Review,
  business: Business,
  supabase: SupabaseClient
): Promise<void> {
  const ratingChanged = oldReview.star_rating !== newReview.star_rating
  const textChanged = oldReview.review_text !== newReview.review_text

  if (!ratingChanged && !textChanged) return

  // Record the previous state
  await supabase
    .from('reviews')
    .update({
      previous_star_rating: oldReview.star_rating,
      previous_review_text: oldReview.review_text,
      updated_at_google: new Date().toISOString(),
      update_count: (oldReview.update_count ?? 0) + 1,
      star_rating: newReview.star_rating,
      review_text: newReview.review_text,
    })
    .eq('id', oldReview.id)

  const ratingImproved = ratingChanged && newReview.star_rating > oldReview.star_rating
  const ratingWorsened = ratingChanged && newReview.star_rating < oldReview.star_rating

  if (ratingImproved) {
    await handleRatingImproved(oldReview, newReview, business, supabase)
  } else if (ratingWorsened) {
    await handleRatingWorsened(oldReview, newReview, business, supabase)
  } else if (textChanged) {
    await handleTextChanged(newReview, business, supabase)
  }
}

async function handleRatingImproved(
  oldReview: Review,
  newReview: Review,
  business: Business,
  supabase: SupabaseClient
): Promise<void> {
  // Mark recovery outreach as resolved
  await supabase
    .from('recovery_outreach')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      notes: `Review updated: ${oldReview.star_rating}→${newReview.star_rating} stars`,
    })
    .eq('review_id', oldReview.id)
    .in('status', ['draft', 'scheduled', 'sent', 'responded'])

  // Generate a new response acknowledging the update
  try {
    const updatedReviewForResponse: Review = {
      ...newReview,
      review_text: newReview.review_text ?? oldReview.review_text,
    }

    const result = await generateReviewResponse(updatedReviewForResponse, business, [], {
      isUpdate: true,
      previousRating: oldReview.star_rating,
      currentRating: newReview.star_rating,
    })

    await supabase
      .from('reviews')
      .update({
        ai_response: result.response,
        response_status: 'draft',
        sentiment: result.sentiment,
        key_topics: result.keyTopics,
      })
      .eq('id', oldReview.id)
  } catch {
    // Non-critical — don't fail the update
  }
}

async function handleRatingWorsened(
  oldReview: Review,
  newReview: Review,
  business: Business,
  supabase: SupabaseClient
): Promise<void> {
  // Generate a new response
  try {
    const result = await generateReviewResponse(newReview, business)

    await supabase
      .from('reviews')
      .update({
        ai_response: result.response,
        response_status: 'draft',
        sentiment: result.sentiment,
        key_topics: result.keyTopics,
      })
      .eq('id', oldReview.id)
  } catch {
    // Non-critical
  }

  // Trigger recovery if rating is now 1-2 stars and no active outreach
  if (newReview.star_rating <= 2) {
    const { data: existing } = await supabase
      .from('recovery_outreach')
      .select('id')
      .eq('review_id', oldReview.id)
      .in('status', ['draft', 'scheduled', 'sent', 'responded'])
      .limit(1)

    if (!existing || existing.length === 0) {
      try {
        if (business.plan === 'pro') {
          const seq = await generateRecoverySequence(newReview, business)
          const sequenceId = crypto.randomUUID()

          await supabase.from('recovery_outreach').insert([
            {
              review_id: newReview.id,
              business_id: business.id,
              outreach_type: 'email',
              message_draft: seq.phase1.message,
              suggested_resolution: seq.suggestedResolution,
              status: 'draft',
              phase: 1,
              sequence_id: sequenceId,
            },
          ])
        }
      } catch {
        // Non-critical
      }
    }
  }
}

async function handleTextChanged(
  newReview: Review,
  business: Business,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const result = await generateReviewResponse(newReview, business)

    await supabase
      .from('reviews')
      .update({
        ai_response: result.response,
        response_status: 'draft',
        sentiment: result.sentiment,
        key_topics: result.keyTopics,
      })
      .eq('id', newReview.id)
  } catch {
    // Non-critical
  }
}

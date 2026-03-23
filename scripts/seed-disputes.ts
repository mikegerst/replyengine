import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDisputes() {
  console.log('Seeding dispute test reviews...\n')

  // Find the existing business
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name')
    .limit(1)

  if (bizError || !businesses?.length) {
    console.error('No business found. Run scripts/seed.ts first.')
    process.exit(1)
  }

  const business = businesses[0]
  console.log(`Using business: ${business.name} (${business.id})\n`)

  const now = Date.now()
  const day = 86400000

  const testReviews = [
    {
      business_id: business.id,
      reviewer_name: 'user39281',
      star_rating: 1,
      review_text: 'worst place ever dont go here terrible',
      review_date: new Date(now - 1 * day).toISOString(),
      response_status: 'pending',
      _expected: 'SPAM_FAKE — should be flagged (high confidence)',
    },
    {
      business_id: business.id,
      reviewer_name: 'angry_customer',
      star_rating: 1,
      review_text:
        "The idiot manager Jason is a complete moron who shouldn't be allowed near a restaurant. This place is a disgusting dump run by incompetent fools.",
      review_date: new Date(now - 2 * day).toISOString(),
      response_status: 'pending',
      _expected: 'OFFENSIVE — should be flagged (high confidence)',
    },
    {
      business_id: business.id,
      reviewer_name: 'BestPizzaCO',
      star_rating: 2,
      review_text:
        "Very mediocre pizza, nothing special. I know good pizza and this isn't it. Try Antonio's down the street instead, much better quality and value.",
      review_date: new Date(now - 3 * day).toISOString(),
      response_status: 'pending',
      _expected: 'CONFLICT_OF_INTEREST — should be flagged (medium confidence)',
    },
    {
      business_id: business.id,
      reviewer_name: 'Maria S.',
      star_rating: 2,
      review_text:
        'We waited 40 minutes for our food on a Tuesday when the restaurant was half empty. The pasta was cold when it arrived. Our server apologized but couldn\'t explain the delay. The food itself tasted fine once we got it but the experience was frustrating.',
      review_date: new Date(now - 4 * day).toISOString(),
      response_status: 'pending',
      _expected: 'LEGITIMATE — should NOT be flagged',
    },
  ]

  // Insert reviews
  const reviewsToInsert = testReviews.map(({ _expected, ...review }) => review)
  void testReviews.map((r) => r._expected) // keep lint happy

  const { data: inserted, error: insertError } = await supabase
    .from('reviews')
    .insert(reviewsToInsert)
    .select()

  if (insertError) {
    console.error('Failed to insert reviews:', insertError.message)
    process.exit(1)
  }

  console.log(`Inserted ${inserted.length} test reviews\n`)

  // Get a valid session token to call the API routes
  // Since we need auth, we'll call the AI functions directly instead
  const { analyzeForDispute } = await import('../lib/ai/analyze-dispute')
  const { generateReviewResponse } = await import('../lib/ai/generate-response')

  // Fetch the full business record for response generation
  const { data: fullBusiness } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', business.id)
    .single()

  for (let i = 0; i < inserted.length; i++) {
    const review = inserted[i]
    const expected = testReviews[i]._expected

    console.log(`--- Review ${i + 1}: ${review.reviewer_name} (${review.star_rating}★) ---`)
    console.log(`Text: "${review.review_text}"`)
    console.log(`Expected: ${expected}`)

    // Generate AI response
    try {
      console.log('Generating AI response...')
      const response = await generateReviewResponse(review, fullBusiness, [])

      await supabase
        .from('reviews')
        .update({
          ai_response: response.response,
          response_status: 'draft',
          sentiment: response.sentiment,
          key_topics: response.keyTopics,
        })
        .eq('id', review.id)

      console.log(`  Response: "${response.response.slice(0, 80)}..."`)
      console.log(`  Sentiment: ${response.sentiment}`)
    } catch (err) {
      console.error(`  Response generation failed: ${err instanceof Error ? err.message : err}`)
    }

    // Analyze for disputes (only 1-2 star)
    if (review.star_rating <= 2) {
      try {
        console.log('Analyzing for dispute...')
        const dispute = await analyzeForDispute(review)

        console.log(`  Disputable: ${dispute.isDisputable ? 'YES' : 'NO'}`)
        console.log(`  Confidence: ${dispute.confidence}`)
        console.log(`  Violations: ${dispute.violations.length > 0 ? dispute.violations.join(', ') : 'none'}`)
        console.log(`  Reasoning: ${dispute.reasoning}`)

        if (dispute.isDisputable) {
          const { error: disputeError } = await supabase.from('review_disputes').insert({
            review_id: review.id,
            business_id: business.id,
            reason: dispute.violations.join(', '),
            ai_confidence_score:
              dispute.confidence === 'high' ? 0.9 : dispute.confidence === 'medium' ? 0.6 : 0.3,
            ai_analysis: dispute.reasoning,
            violations: dispute.violations,
            suggested_dispute_text: dispute.suggestedDisputeText,
            confidence: dispute.confidence,
            status: 'detected',
          })

          if (disputeError) {
            console.error(`  Failed to save dispute: ${disputeError.message}`)
          } else {
            console.log('  ✓ Dispute record created')
          }
        } else {
          console.log('  ✓ Not flagged (legitimate review)')
        }
      } catch (err) {
        console.error(`  Dispute analysis failed: ${err instanceof Error ? err.message : err}`)
      }
    }

    console.log('')
  }

  console.log('Done! Check /dashboard/recovery to see the results.')
}

seedDisputes()

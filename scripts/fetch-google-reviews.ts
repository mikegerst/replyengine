import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

// ============================================
// EDIT THESE — add or remove businesses to fetch
// ============================================
const BUSINESSES_TO_FETCH = [
  "Wildflower Cafe Evergreen Colorado",
]

// Only insert reviews at or below this star rating (set to 5 for all reviews)
const MAX_STAR_RATING = 5
// ============================================

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface GoogleReview {
  authorAttribution?: { displayName?: string; photoUri?: string }
  rating?: number
  text?: { text?: string }
  relativePublishTimeDescription?: string
  publishTime?: string
}

interface PlaceResult {
  id: string
  displayName?: { text?: string }
  formattedAddress?: string
  rating?: number
  reviews?: GoogleReview[]
}

interface FetchedBusiness {
  name: string
  address: string
  rating: number
  placeId: string
  reviews: GoogleReview[]
  dbBusinessId?: string
}

async function searchPlace(query: string): Promise<PlaceResult | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating',
    },
    body: JSON.stringify({ textQuery: query }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`  Search failed for "${query}": ${res.status} ${err}`)
    return null
  }

  const data = await res.json()
  const place = data.places?.[0]
  if (!place) {
    console.error(`  No results for "${query}"`)
    return null
  }

  return place
}

async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,reviews',
    },
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`  Details failed for ${placeId}: ${res.status} ${err}`)
    return null
  }

  return await res.json()
}

async function fetchAllBusinesses(): Promise<FetchedBusiness[]> {
  const results: FetchedBusiness[] = []

  for (const query of BUSINESSES_TO_FETCH) {
    console.log(`\nSearching: "${query}"...`)

    const searchResult = await searchPlace(query)
    if (!searchResult) continue

    const placeId = searchResult.id
    const name = searchResult.displayName?.text ?? query
    console.log(`  Found: ${name} (${placeId})`)

    const details = await getPlaceDetails(placeId)
    if (!details) continue

    const business: FetchedBusiness = {
      name: details.displayName?.text ?? name,
      address: details.formattedAddress ?? '',
      rating: details.rating ?? 0,
      placeId,
      reviews: details.reviews ?? [],
    }

    console.log(`  Address: ${business.address}`)
    console.log(`  Rating: ${business.rating}/5`)
    console.log(`  Reviews: ${business.reviews.length}`)

    results.push(business)
  }

  return results
}

async function insertIntoDatabase(businesses: FetchedBusiness[]) {
  // Get the first user as owner
  const { data: users } = await supabase.auth.admin.listUsers()
  if (!users?.users.length) {
    console.error('\nNo users found. Sign up first.')
    return
  }
  const ownerId = users.users[0].id

  for (const biz of businesses) {
    console.log(`\n--- Inserting: ${biz.name} ---`)

    // Check if business already exists by google_place_id
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('google_place_id', biz.placeId)
      .limit(1)

    let businessId: string

    if (existing && existing.length > 0) {
      businessId = existing[0].id
      console.log(`  Business exists (${businessId})`)
    } else {
      const { data: created, error } = await supabase
        .from('businesses')
        .insert({
          owner_id: ownerId,
          name: biz.name,
          google_place_id: biz.placeId,
          business_type: 'Other',
          tone: 'friendly',
          response_length: 'medium',
          plan: 'pro', // pro so AI generation works without limits
        })
        .select()
        .single()

      if (error || !created) {
        console.error(`  Failed to create business: ${error?.message}`)
        continue
      }
      businessId = created.id
      console.log(`  Created business (${businessId})`)
    }

    biz.dbBusinessId = businessId

    // Insert reviews (filtered by MAX_STAR_RATING)
    const filteredReviews = biz.reviews.filter((r) => (r.rating ?? 3) <= MAX_STAR_RATING)
    console.log(`  ${filteredReviews.length} of ${biz.reviews.length} reviews are ${MAX_STAR_RATING}★ or below`)

    for (const review of filteredReviews) {
      const reviewerName = review.authorAttribution?.displayName ?? 'Anonymous'
      const starRating = review.rating ?? 3
      const reviewText = review.text?.text ?? ''
      const publishTime = review.publishTime ?? new Date().toISOString()

      // Check for duplicate by reviewer name + business
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('business_id', businessId)
        .eq('reviewer_name', reviewerName)
        .eq('review_text', reviewText)
        .limit(1)

      if (existingReview && existingReview.length > 0) {
        console.log(`  Skipping duplicate: ${reviewerName}`)
        continue
      }

      const { data: inserted, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          business_id: businessId,
          reviewer_name: reviewerName,
          reviewer_photo_url: review.authorAttribution?.photoUri ?? null,
          star_rating: starRating,
          review_text: reviewText || null,
          review_date: publishTime,
          response_status: 'pending',
        })
        .select()
        .single()

      if (reviewError || !inserted) {
        console.error(`  Failed to insert review from ${reviewerName}: ${reviewError?.message}`)
        continue
      }

      console.log(`  Inserted review: ${reviewerName} (${starRating}★)`)
    }
  }
}

async function generateResponses(businesses: FetchedBusiness[]) {
  const { generateReviewResponse } = await import('../lib/ai/generate-response')
  const { analyzeForDispute } = await import('../lib/ai/analyze-dispute')

  for (const biz of businesses) {
    if (!biz.dbBusinessId) continue

    console.log(`\n=== Generating responses for: ${biz.name} ===`)

    // Fetch the full business record
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', biz.dbBusinessId)
      .single()

    if (!business) continue

    // Fetch all pending reviews for this business
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', biz.dbBusinessId)
      .eq('response_status', 'pending')

    if (!reviews || reviews.length === 0) {
      console.log('  No pending reviews to process.')
      continue
    }

    for (const review of reviews) {
      console.log(`\n  ${review.reviewer_name} (${review.star_rating}★):`)
      console.log(`  "${(review.review_text ?? '').slice(0, 100)}${(review.review_text?.length ?? 0) > 100 ? '...' : ''}"`)

      // Generate AI response
      try {
        const result = await generateReviewResponse(review, business, [])

        await supabase
          .from('reviews')
          .update({
            ai_response: result.response,
            response_status: 'draft',
            sentiment: result.sentiment,
            key_topics: result.keyTopics,
          })
          .eq('id', review.id)

        console.log(`  AI Response: "${result.response.slice(0, 120)}..."`)
        console.log(`  Sentiment: ${result.sentiment} | Topics: ${result.keyTopics.join(', ')}`)
      } catch (err) {
        console.error(`  Response generation failed: ${err instanceof Error ? err.message : err}`)
      }

      // Dispute analysis for 1-2 star reviews
      if (review.star_rating <= 2) {
        try {
          const dispute = await analyzeForDispute(review)

          if (dispute.isDisputable) {
            await supabase.from('review_disputes').insert({
              review_id: review.id,
              business_id: biz.dbBusinessId,
              reason: dispute.violations.join(', '),
              ai_confidence_score: dispute.confidence === 'high' ? 0.9 : dispute.confidence === 'medium' ? 0.6 : 0.3,
              ai_analysis: dispute.reasoning,
              violations: dispute.violations,
              suggested_dispute_text: dispute.suggestedDisputeText,
              confidence: dispute.confidence,
              status: 'detected',
            })
            console.log(`  DISPUTE FLAGGED: ${dispute.violations.join(', ')} (${dispute.confidence})`)
            console.log(`  Reason: ${dispute.reasoning}`)
          } else {
            console.log(`  No dispute flags (legitimate review)`)
          }
        } catch (err) {
          console.error(`  Dispute analysis failed: ${err instanceof Error ? err.message : err}`)
        }
      }
    }
  }
}

function printSummary(businesses: FetchedBusiness[]) {
  console.log('\n\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))

  for (const biz of businesses) {
    console.log(`\n${biz.name}`)
    console.log(`  ${biz.address}`)
    console.log(`  Overall rating: ${biz.rating}/5`)
    console.log(`  Reviews fetched: ${biz.reviews.length}`)

    for (const review of biz.reviews) {
      const name = review.authorAttribution?.displayName ?? 'Anonymous'
      const stars = review.rating ?? 0
      const text = review.text?.text ?? '(no text)'
      const time = review.relativePublishTimeDescription ?? ''
      console.log(`\n    ${name} — ${stars}★ (${time})`)
      console.log(`    "${text.slice(0, 150)}${text.length > 150 ? '...' : ''}"`)
    }
  }
}

async function main() {
  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY is not set in .env.local')
    process.exit(1)
  }

  console.log('Fetching Google reviews...\n')

  // Step 1: Fetch from Google
  const businesses = await fetchAllBusinesses()

  if (businesses.length === 0) {
    console.log('\nNo businesses found.')
    return
  }

  // Step 2: Insert into database
  await insertIntoDatabase(businesses)

  // Step 3: Generate AI responses + dispute analysis
  await generateResponses(businesses)

  // Step 4: Print summary
  printSummary(businesses)

  console.log('\n\nDone! Check /dashboard to see the results.')
}

main()

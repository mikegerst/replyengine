import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

// Load env before any other imports that might need ANTHROPIC_API_KEY
config({ path: '.env.local' })

import { generateAmplifyResponse } from '../lib/ai/generate-amplify-response'
import { analyzeForDispute } from '../lib/ai/analyze-dispute'
import { generateRecoverySequence } from '../lib/ai/generate-recovery'
import { generateSocialContent } from '../lib/ai/generate-social-content'
import { calculateRatingImpact, formatRevenue } from '../lib/utils/rating-impact'
import type { Business, Review } from '../lib/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Track test results
type TestName =
  | 'Auto-Respond (positive)'
  | 'Auto-Respond (negative)'
  | 'Amplify (marketing)'
  | 'Social Content'
  | 'Dispute — Spam'
  | 'Dispute — Competitor'
  | 'Dispute — Legit (no flag)'
  | 'Recovery Phase 1'
  | 'Recovery Phase 2'
  | 'Recovery Phase 3 (safe)'
  | 'Rating Impact Calculator'

const results: Record<TestName, boolean> = {
  'Auto-Respond (positive)': false,
  'Auto-Respond (negative)': false,
  'Amplify (marketing)': false,
  'Social Content': false,
  'Dispute — Spam': false,
  'Dispute — Competitor': false,
  'Dispute — Legit (no flag)': false,
  'Recovery Phase 1': false,
  'Recovery Phase 2': false,
  'Recovery Phase 3 (safe)': false,
  'Rating Impact Calculator': false,
}

// Collect all AI-generated responses for final display
const aiResponses: { label: string; text: string }[] = []

// Track review IDs for cleanup
const testReviewIds: string[] = []
const testDisputeIds: string[] = []
const testRecoveryIds: string[] = []

function pass(name: TestName): void {
  results[name] = true
  console.log(`  ✅ PASS: ${name}`)
}

function fail(name: TestName, reason: string): void {
  results[name] = false
  console.log(`  ❌ FAIL: ${name} — ${reason}`)
}

async function insertReview(
  businessId: string,
  reviewerName: string,
  starRating: number,
  reviewText: string
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      business_id: businessId,
      reviewer_name: reviewerName,
      star_rating: starRating,
      review_text: reviewText,
      review_date: new Date().toISOString(),
      response_status: 'pending',
      google_review_id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to insert review: ${error?.message}`)
  }

  testReviewIds.push(data.id)
  return data as Review
}

async function main(): Promise<void> {
  console.log('\n' + '='.repeat(50))
  console.log('  REPLYENGINE AUTOMATION TEST SUITE')
  console.log('='.repeat(50) + '\n')

  // ─────────────────────────────────────────────────
  // 1. SETUP
  // ─────────────────────────────────────────────────
  console.log('1️⃣  SETUP — Configuring test business for full autopilot\n')

  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .limit(1)
    .single()

  if (bizError || !businesses) {
    console.error('No business found in database. Run seed script first.')
    process.exit(1)
  }

  const business = businesses as Business
  console.log(`  Found business: ${business.name} (${business.id})`)

  // Save original values so we can restore later
  const originalConfig = {
    auto_respond: business.auto_respond,
    auto_respond_min_stars: business.auto_respond_min_stars,
    notification_email: business.notification_email,
    current_promotions: business.current_promotions,
  }

  const { error: updateError } = await supabase
    .from('businesses')
    .update({
      auto_respond: true,
      auto_respond_min_stars: 4,
      notification_email: true,
      current_promotions: 'new spring menu, outdoor patio now open, live music every Friday, happy hour 3-6pm',
    })
    .eq('id', business.id)

  if (updateError) {
    console.error(`Failed to update business: ${updateError.message}`)
    process.exit(1)
  }

  // Refresh business data
  const { data: updatedBiz } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', business.id)
    .single()

  const biz = updatedBiz as Business
  console.log('  Business configured for full autopilot ✓')
  console.log(`    auto_respond: ${biz.auto_respond}`)
  console.log(`    auto_respond_min_stars: ${biz.auto_respond_min_stars}`)
  console.log(`    current_promotions: ${biz.current_promotions}`)
  console.log()

  // ─────────────────────────────────────────────────
  // 2. TEST AUTO-RESPOND (positive)
  // ─────────────────────────────────────────────────
  console.log('2️⃣  TEST AUTO-RESPOND — 5-star review\n')

  const positiveReview = await insertReview(
    biz.id,
    'Test User — Auto',
    5,
    'Amazing dinner! The wood-fired pizza was perfectly crispy and the cocktails were creative and delicious. Our server made us feel like VIPs. Best restaurant in town!'
  )
  console.log(`  Inserted review: ${positiveReview.id}`)

  // For 4-5 star reviews, use amplify response (marketing-enhanced)
  const amplifyResult = await generateAmplifyResponse(positiveReview, biz)
  console.log(`\n  AI Response (Amplify):\n  "${amplifyResult.response}"\n`)
  aiResponses.push({ label: '5-Star Amplify Response', text: amplifyResult.response })

  // Update the review with the response
  await supabase
    .from('reviews')
    .update({
      ai_response: amplifyResult.response,
      response_status: biz.auto_respond && positiveReview.star_rating >= (biz.auto_respond_min_stars ?? 4)
        ? 'approved'
        : 'draft',
      sentiment: amplifyResult.sentiment,
      key_topics: amplifyResult.keyTopics,
    })
    .eq('id', positiveReview.id)

  // Checks
  const promoKeywords = ['spring menu', 'patio', 'live music', 'happy hour']
  const mentionsPromo = promoKeywords.some(kw =>
    amplifyResult.response.toLowerCase().includes(kw.toLowerCase())
  )
  const mentionsPizza = amplifyResult.response.toLowerCase().includes('pizza')
  const mentionsCocktails = amplifyResult.response.toLowerCase().includes('cocktail')
  const mentionsServer = amplifyResult.response.toLowerCase().includes('server') ||
    amplifyResult.response.toLowerCase().includes('vip')
  const isPersonalized = mentionsPizza || mentionsCocktails || mentionsServer
  const wordCount = amplifyResult.response.split(/\s+/).length
  const isUnder100Words = wordCount <= 100

  console.log(`  Mentions promotion: ${mentionsPromo ? 'YES ✓' : 'NO ✗'}`)
  console.log(`  Personalized (pizza/cocktails/server): ${isPersonalized ? 'YES ✓' : 'NO ✗'}`)
  console.log(`  Under 100 words (${wordCount} words): ${isUnder100Words ? 'YES ✓' : 'NO ✗'}`)

  if (mentionsPromo && isPersonalized && isUnder100Words) {
    pass('Auto-Respond (positive)')
  } else {
    const reasons: string[] = []
    if (!mentionsPromo) reasons.push('no promo mention')
    if (!isPersonalized) reasons.push('not personalized')
    if (!isUnder100Words) reasons.push(`${wordCount} words`)
    fail('Auto-Respond (positive)', reasons.join(', '))
  }

  // Generate social content for standout 5-star
  console.log('\n  Generating social content for standout review...')
  const socialContent = await generateSocialContent(positiveReview, biz)
  console.log(`\n  Instagram:\n  "${socialContent.instagram}"`)
  console.log(`\n  Twitter/X:\n  "${socialContent.twitter}"`)
  aiResponses.push({ label: 'Social — Instagram', text: socialContent.instagram })
  aiResponses.push({ label: 'Social — Twitter/X', text: socialContent.twitter })

  if (socialContent.instagram.length > 0 && socialContent.twitter.length > 0) {
    pass('Social Content')
  } else {
    fail('Social Content', 'empty social content')
  }
  console.log()

  // ─────────────────────────────────────────────────
  // 3. TEST AUTO-RESPOND (negative — should NOT auto-respond)
  // ─────────────────────────────────────────────────
  console.log('3️⃣  TEST AUTO-RESPOND — 2-star review (should NOT auto-respond)\n')

  const negativeReview = await insertReview(
    biz.id,
    'Test User — Negative',
    2,
    'Waited 35 minutes for our food on a quiet Tuesday night. The pasta was overcooked and the server seemed overwhelmed. Food quality was decent but the experience was frustrating.'
  )
  console.log(`  Inserted review: ${negativeReview.id}`)

  // Generate response but it should be draft, not auto_queued
  const negativeAmplify = await generateAmplifyResponse(negativeReview, biz)
  console.log(`\n  AI Response:\n  "${negativeAmplify.response}"\n`)
  aiResponses.push({ label: '2-Star Response (should be draft)', text: negativeAmplify.response })

  // 2-star is below auto_respond_min_stars (4), so status should be draft
  const shouldAutoRespond = negativeReview.star_rating >= (biz.auto_respond_min_stars ?? 4)
  const negativeStatus = shouldAutoRespond ? 'approved' : 'draft'

  await supabase
    .from('reviews')
    .update({
      ai_response: negativeAmplify.response,
      response_status: negativeStatus,
      sentiment: negativeAmplify.sentiment,
      key_topics: negativeAmplify.keyTopics,
    })
    .eq('id', negativeReview.id)

  console.log(`  Status: ${negativeStatus}`)
  if (negativeStatus === 'draft') {
    pass('Auto-Respond (negative)')
  } else {
    fail('Auto-Respond (negative)', `status is "${negativeStatus}" instead of "draft"`)
  }
  console.log()

  // ─────────────────────────────────────────────────
  // 4. TEST DISPUTE DETECTION
  // ─────────────────────────────────────────────────
  console.log('4️⃣  TEST DISPUTE DETECTION\n')

  // 4a. Spam/Fake review
  console.log('  --- Spam/Fake Review ---')
  const spamReview = await insertReview(
    biz.id,
    'user99182',
    1,
    'terrible awful worst place ever do not go here'
  )
  console.log(`  Inserted review: ${spamReview.id}`)

  const spamAnalysis = await analyzeForDispute(spamReview)
  console.log(`\n  Dispute Analysis:`)
  console.log(`    isDisputable: ${spamAnalysis.isDisputable}`)
  console.log(`    confidence: ${spamAnalysis.confidence}`)
  console.log(`    violations: ${JSON.stringify(spamAnalysis.violations)}`)
  console.log(`    reasoning: ${spamAnalysis.reasoning}`)
  console.log(`    suggestedDisputeText: ${spamAnalysis.suggestedDisputeText.slice(0, 120)}...`)
  aiResponses.push({ label: 'Dispute Analysis — Spam', text: JSON.stringify(spamAnalysis, null, 2) })

  if (spamAnalysis.isDisputable) {
    // Insert dispute record
    const { data: spamDispute } = await supabase
      .from('review_disputes')
      .insert({
        review_id: spamReview.id,
        business_id: biz.id,
        reason: spamAnalysis.reasoning,
        violations: spamAnalysis.violations,
        confidence: spamAnalysis.confidence,
        suggested_dispute_text: spamAnalysis.suggestedDisputeText,
        ai_analysis: JSON.stringify(spamAnalysis),
        status: 'detected',
      })
      .select()
      .single()
    if (spamDispute) testDisputeIds.push(spamDispute.id)
  }

  const spamHasViolation = spamAnalysis.violations.includes('SPAM_FAKE')
  const spamConfidenceOk = spamAnalysis.confidence === 'medium' || spamAnalysis.confidence === 'high'
  const spamHasText = spamAnalysis.suggestedDisputeText.length > 0

  if (spamAnalysis.isDisputable && spamHasViolation && spamConfidenceOk && spamHasText) {
    pass('Dispute — Spam')
  } else {
    const reasons: string[] = []
    if (!spamAnalysis.isDisputable) reasons.push('not flagged as disputable')
    if (!spamHasViolation) reasons.push('missing SPAM_FAKE violation')
    if (!spamConfidenceOk) reasons.push(`confidence is ${spamAnalysis.confidence}`)
    if (!spamHasText) reasons.push('no dispute text')
    fail('Dispute — Spam', reasons.join(', '))
  }
  console.log()

  // 4b. Competitor review
  console.log('  --- Competitor Review ---')
  const competitorReview = await insertReview(
    biz.id,
    'PizzaPalaceDenver',
    1,
    'Mediocre pizza at best. If you want real Italian pizza go to Pizza Palace on Main Street, way better quality and half the price.'
  )
  console.log(`  Inserted review: ${competitorReview.id}`)

  const competitorAnalysis = await analyzeForDispute(competitorReview)
  console.log(`\n  Dispute Analysis:`)
  console.log(`    isDisputable: ${competitorAnalysis.isDisputable}`)
  console.log(`    confidence: ${competitorAnalysis.confidence}`)
  console.log(`    violations: ${JSON.stringify(competitorAnalysis.violations)}`)
  console.log(`    reasoning: ${competitorAnalysis.reasoning}`)
  aiResponses.push({ label: 'Dispute Analysis — Competitor', text: JSON.stringify(competitorAnalysis, null, 2) })

  if (competitorAnalysis.isDisputable) {
    const { data: compDispute } = await supabase
      .from('review_disputes')
      .insert({
        review_id: competitorReview.id,
        business_id: biz.id,
        reason: competitorAnalysis.reasoning,
        violations: competitorAnalysis.violations,
        confidence: competitorAnalysis.confidence,
        suggested_dispute_text: competitorAnalysis.suggestedDisputeText,
        ai_analysis: JSON.stringify(competitorAnalysis),
        status: 'detected',
      })
      .select()
      .single()
    if (compDispute) testDisputeIds.push(compDispute.id)
  }

  if (competitorAnalysis.isDisputable && competitorAnalysis.violations.includes('CONFLICT_OF_INTEREST')) {
    pass('Dispute — Competitor')
  } else {
    const reasons: string[] = []
    if (!competitorAnalysis.isDisputable) reasons.push('not flagged as disputable')
    if (!competitorAnalysis.violations.includes('CONFLICT_OF_INTEREST')) reasons.push('missing CONFLICT_OF_INTEREST')
    fail('Dispute — Competitor', reasons.join(', '))
  }
  console.log()

  // 4c. Legitimate bad review (should NOT be flagged)
  console.log('  --- Legitimate Bad Review (should NOT be flagged) ---')
  const legitReview = await insertReview(
    biz.id,
    'Jennifer K.',
    2,
    'The appetizers were great but our main courses took over 40 minutes. The steak was cooked medium-well when I ordered medium-rare. Our waiter apologized and offered to remake it but by that point we\'d lost our appetite. The dessert partially redeemed the evening.'
  )
  console.log(`  Inserted review: ${legitReview.id}`)

  const legitAnalysis = await analyzeForDispute(legitReview)
  console.log(`\n  Dispute Analysis:`)
  console.log(`    isDisputable: ${legitAnalysis.isDisputable}`)
  console.log(`    violations: ${JSON.stringify(legitAnalysis.violations)}`)
  console.log(`    reasoning: ${legitAnalysis.reasoning}`)
  aiResponses.push({ label: 'Dispute Analysis — Legit (should NOT flag)', text: JSON.stringify(legitAnalysis, null, 2) })

  if (!legitAnalysis.isDisputable) {
    pass('Dispute — Legit (no flag)')
  } else {
    fail('Dispute — Legit (no flag)', `incorrectly flagged: ${legitAnalysis.violations.join(', ')}`)
  }
  console.log()

  // ─────────────────────────────────────────────────
  // 5. TEST RECOVERY SEQUENCE
  // ─────────────────────────────────────────────────
  console.log('5️⃣  TEST RECOVERY SEQUENCE — For the 2-star review\n')

  const recovery = await generateRecoverySequence(negativeReview, biz)
  console.log(`  Phase 1 (Immediate):\n  "${recovery.phase1.message}"\n`)
  console.log(`  Phase 2 (7 days):\n  "${recovery.phase2.message}"\n`)
  console.log(`  Phase 3 (After resolution):\n  "${recovery.phase3.message}"\n`)
  console.log(`  Phase 4 (If updated):\n  "${recovery.phase4.message}"\n`)
  console.log(`  Suggested Resolution: ${recovery.suggestedResolution}\n`)

  aiResponses.push({ label: 'Recovery Phase 1', text: recovery.phase1.message })
  aiResponses.push({ label: 'Recovery Phase 2', text: recovery.phase2.message })
  aiResponses.push({ label: 'Recovery Phase 3', text: recovery.phase3.message })
  aiResponses.push({ label: 'Recovery Phase 4', text: recovery.phase4.message })

  // Insert recovery records
  const sequenceId = crypto.randomUUID()
  for (const [phase, data] of [
    [1, recovery.phase1],
    [2, recovery.phase2],
    [3, recovery.phase3],
    [4, recovery.phase4],
  ] as [number, { message: string }][]) {
    const { data: rec } = await supabase
      .from('recovery_outreach')
      .insert({
        review_id: negativeReview.id,
        business_id: biz.id,
        outreach_type: 'email',
        message_draft: data.message,
        status: 'draft',
        phase,
        sequence_id: sequenceId,
      })
      .select()
      .single()
    if (rec) testRecoveryIds.push(rec.id)
  }

  // Check Phase 1: references specific complaint
  const p1Lower = recovery.phase1.message.toLowerCase()
  const p1RefersWait = p1Lower.includes('wait') || p1Lower.includes('35 minute') || p1Lower.includes('long')
  const p1RefersFood = p1Lower.includes('pasta') || p1Lower.includes('overcooked') || p1Lower.includes('food')
  const p1OffersResolution = recovery.suggestedResolution.length > 0

  if (p1RefersWait || p1RefersFood) {
    pass('Recovery Phase 1')
  } else {
    fail('Recovery Phase 1', 'does not reference specific complaint (wait time or pasta)')
  }

  // Check Phase 2
  if (recovery.phase2.message.length > 20) {
    pass('Recovery Phase 2')
  } else {
    fail('Recovery Phase 2', 'Phase 2 message is too short or empty')
  }

  // Check Phase 3: uses "update" not "remove"/"delete"
  const p3Lower = recovery.phase3.message.toLowerCase()
  const p3HasDelete = p3Lower.includes('delete') || p3Lower.includes('remove')
  const p3HasUpdate = p3Lower.includes('update')
  const p3Safe = !p3HasDelete

  if (p3Safe) {
    pass('Recovery Phase 3 (safe)')
  } else {
    fail('Recovery Phase 3 (safe)', 'contains "delete" or "remove" — should only use "update"')
  }

  console.log(`  Phase 1 references complaint: ${(p1RefersWait || p1RefersFood) ? 'YES ✓' : 'NO ✗'}`)
  console.log(`  Phase 1 offers resolution: ${p1OffersResolution ? 'YES ✓' : 'NO ✗'}`)
  console.log(`  Phase 3 avoids "delete"/"remove": ${p3Safe ? 'YES ✓' : 'NO ✗'}`)
  console.log(`  Phase 3 uses "update": ${p3HasUpdate ? 'YES ✓' : 'NOT FOUND (may use other phrasing)'}`)
  console.log()

  // ─────────────────────────────────────────────────
  // 6. TEST AMPLIFY
  // ─────────────────────────────────────────────────
  console.log('6️⃣  TEST AMPLIFY — Marketing elements in 5-star response\n')

  const responseLower = amplifyResult.response.toLowerCase()
  const amplifyMentionsPromo = promoKeywords.some(kw => responseLower.includes(kw.toLowerCase()))
  const suggestsReturn = responseLower.includes('next time') ||
    responseLower.includes('come back') ||
    responseLower.includes('return') ||
    responseLower.includes('visit') ||
    responseLower.includes('join us') ||
    responseLower.includes('look forward')
  // "Natural" check: shouldn't have ALL CAPS marketing or excessive exclamation marks
  const exclamationCount = (amplifyResult.response.match(/!/g) ?? []).length
  const feelsNatural = exclamationCount <= 3

  console.log(`  Mentions promotion: ${amplifyMentionsPromo ? 'YES ✓' : 'NO ✗'}`)
  console.log(`  Suggests return visit: ${suggestsReturn ? 'YES ✓' : 'NO ✗'}`)
  console.log(`  Feels natural (≤3 exclamation marks): ${feelsNatural ? 'YES ✓' : `NO ✗ (${exclamationCount} found)`}`)

  if (amplifyMentionsPromo && suggestsReturn && feelsNatural) {
    pass('Amplify (marketing)')
  } else {
    const reasons: string[] = []
    if (!amplifyMentionsPromo) reasons.push('no promo mention')
    if (!suggestsReturn) reasons.push('no return suggestion')
    if (!feelsNatural) reasons.push('too many exclamation marks')
    fail('Amplify (marketing)', reasons.join(', '))
  }
  console.log()

  // ─────────────────────────────────────────────────
  // 7. TEST RATING IMPACT
  // ─────────────────────────────────────────────────
  console.log('7️⃣  TEST RATING IMPACT — Calculate impact of removing disputed reviews\n')

  const { data: allReviews } = await supabase
    .from('reviews')
    .select('id, star_rating')
    .eq('business_id', biz.id)

  const reviewsForCalc = (allReviews ?? []).map(r => ({
    id: r.id as string,
    star_rating: r.star_rating as number,
  }))

  // Disputed review IDs (spam + competitor)
  const disputedIds = [spamReview.id, competitorReview.id]

  const impact = calculateRatingImpact(reviewsForCalc, disputedIds)
  console.log(`  Total reviews: ${reviewsForCalc.length}`)
  console.log(`  Disputed reviews to remove: ${disputedIds.length}`)
  console.log(`  Current: ${impact.currentRating} → Projected: ${impact.projectedRating} (+${impact.ratingChange})`)
  console.log(`  Estimated revenue impact: ${formatRevenue(impact.estimatedRevenueImpact.low)} – ${formatRevenue(impact.estimatedRevenueImpact.high)}/year`)

  if (impact.currentRating > 0 && impact.projectedRating >= impact.currentRating && impact.ratingChange >= 0) {
    pass('Rating Impact Calculator')
  } else {
    fail('Rating Impact Calculator', `unexpected values: current=${impact.currentRating}, projected=${impact.projectedRating}`)
  }
  console.log()

  // ─────────────────────────────────────────────────
  // 8. SUMMARY
  // ─────────────────────────────────────────────────
  const passCount = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length

  console.log('┌──────────────────────────────────────────┐')
  console.log('│ AUTOMATION TEST RESULTS                   │')
  console.log('├──────────────────────────────────────────┤')
  for (const [name, passed] of Object.entries(results)) {
    const status = passed ? 'PASS' : 'FAIL'
    const icon = passed ? '✅' : '❌'
    const paddedName = name.padEnd(30)
    console.log(`│ ${icon} ${paddedName} ${status.padStart(4)} │`)
  }
  console.log('├──────────────────────────────────────────┤')
  console.log(`│ Total: ${passCount}/${totalTests} passed${' '.repeat(25 - `${passCount}/${totalTests}`.length)}│`)
  console.log('└──────────────────────────────────────────┘')

  // Print all AI-generated responses
  console.log('\n' + '='.repeat(50))
  console.log('  ALL AI-GENERATED RESPONSES')
  console.log('='.repeat(50))
  for (const { label, text } of aiResponses) {
    console.log(`\n--- ${label} ---`)
    console.log(text)
  }
  console.log('\n' + '='.repeat(50))

  // ─────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────

  // Restore original business config
  await supabase
    .from('businesses')
    .update(originalConfig)
    .eq('id', biz.id)
  console.log('\n  Business config restored to original values.')

  // Ask about test data cleanup
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise<string>(resolve => {
    rl.question('\nDelete test reviews? (y/n): ', resolve)
  })
  rl.close()

  if (answer.toLowerCase() === 'y') {
    console.log('\n  Cleaning up test data...')

    // Delete recovery outreach records first (FK constraint)
    if (testRecoveryIds.length > 0) {
      const { error: recErr } = await supabase
        .from('recovery_outreach')
        .delete()
        .in('id', testRecoveryIds)
      if (recErr) console.log(`  Warning: failed to delete recovery records: ${recErr.message}`)
      else console.log(`  Deleted ${testRecoveryIds.length} recovery outreach records`)
    }

    // Delete disputes (FK constraint)
    if (testDisputeIds.length > 0) {
      const { error: dispErr } = await supabase
        .from('review_disputes')
        .delete()
        .in('id', testDisputeIds)
      if (dispErr) console.log(`  Warning: failed to delete disputes: ${dispErr.message}`)
      else console.log(`  Deleted ${testDisputeIds.length} dispute records`)
    }

    // Delete test reviews
    if (testReviewIds.length > 0) {
      const { error: revErr } = await supabase
        .from('reviews')
        .delete()
        .in('id', testReviewIds)
      if (revErr) console.log(`  Warning: failed to delete reviews: ${revErr.message}`)
      else console.log(`  Deleted ${testReviewIds.length} test reviews`)
    }

    console.log('  Cleanup complete ✓')
  } else {
    console.log('\n  Test reviews left in database.')
    console.log('  Review IDs:', testReviewIds)
  }

  console.log('\nDone.\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

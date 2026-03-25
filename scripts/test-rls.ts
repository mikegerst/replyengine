/**
 * RLS Verification Test Script
 *
 * Tests that Row Level Security policies properly isolate data between users.
 * Run with: npx tsx scripts/test-rls.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

interface TestResult {
  name: string
  passed: boolean
  detail: string
}

const results: TestResult[] = []

function record(name: string, passed: boolean, detail: string) {
  results.push({ name, passed, detail })
  const icon = passed ? 'PASS' : 'FAIL'
  console.log(`  [${icon}] ${name}: ${detail}`)
}

async function cleanup(userAId: string, userBId: string) {
  console.log('\nCleaning up test data...')

  // Delete in dependency order
  await admin.from('recovery_outreach').delete().in('business_id', [
    // We'll use owner_id to find business IDs
  ])

  // Get business IDs first
  const { data: bizA } = await admin.from('businesses').select('id').eq('owner_id', userAId)
  const { data: bizB } = await admin.from('businesses').select('id').eq('owner_id', userBId)

  const bizIds = [
    ...(bizA ?? []).map((b) => b.id),
    ...(bizB ?? []).map((b) => b.id),
  ]

  if (bizIds.length > 0) {
    await admin.from('recovery_outreach').delete().in('business_id', bizIds)
    await admin.from('review_disputes').delete().in('business_id', bizIds)
    await admin.from('reviews').delete().in('business_id', bizIds)
  }

  await admin.from('businesses').delete().eq('owner_id', userAId)
  await admin.from('businesses').delete().eq('owner_id', userBId)

  // Delete auth users
  await admin.auth.admin.deleteUser(userAId)
  await admin.auth.admin.deleteUser(userBId)

  console.log('Cleanup complete.')
}

async function main() {
  console.log('=== RLS Verification Tests ===\n')

  // Step 1: Create two test users
  console.log('Creating test users...')

  const emailA = `rls-test-a-${Date.now()}@test.replyengine.local`
  const emailB = `rls-test-b-${Date.now()}@test.replyengine.local`

  const { data: userAData, error: errA } = await admin.auth.admin.createUser({
    email: emailA,
    password: 'TestPassword123!',
    email_confirm: true,
  })

  if (errA || !userAData.user) {
    console.error('Failed to create User A:', errA?.message)
    process.exit(1)
  }

  const { data: userBData, error: errB } = await admin.auth.admin.createUser({
    email: emailB,
    password: 'TestPassword456!',
    email_confirm: true,
  })

  if (errB || !userBData.user) {
    console.error('Failed to create User B:', errB?.message)
    await admin.auth.admin.deleteUser(userAData.user.id)
    process.exit(1)
  }

  const userAId = userAData.user.id
  const userBId = userBData.user.id

  console.log(`  User A: ${userAId}`)
  console.log(`  User B: ${userBId}`)

  try {
    // Step 2: Create businesses for each user (using admin to bypass RLS)
    console.log('\nCreating test businesses...')

    const { data: bizA, error: bizAErr } = await admin.from('businesses').insert({
      owner_id: userAId,
      name: 'RLS Test Business A',
      tone: 'professional',
      response_length: 'medium',
      plan: 'pro',
    }).select().single()

    if (bizAErr || !bizA) {
      console.error('Failed to create Business A:', bizAErr?.message)
      await cleanup(userAId, userBId)
      process.exit(1)
    }

    const { data: bizB, error: bizBErr } = await admin.from('businesses').insert({
      owner_id: userBId,
      name: 'RLS Test Business B',
      tone: 'friendly',
      response_length: 'short',
      plan: 'pro',
    }).select().single()

    if (bizBErr || !bizB) {
      console.error('Failed to create Business B:', bizBErr?.message)
      await cleanup(userAId, userBId)
      process.exit(1)
    }

    // Step 3: Create reviews for each business
    console.log('Creating test reviews...')

    const { data: reviewA } = await admin.from('reviews').insert({
      business_id: bizA.id,
      reviewer_name: 'Test Reviewer A',
      star_rating: 5,
      review_text: 'Great service from Business A!',
      response_status: 'pending',
    }).select().single()

    const { data: reviewB } = await admin.from('reviews').insert({
      business_id: bizB.id,
      reviewer_name: 'Test Reviewer B',
      star_rating: 1,
      review_text: 'Bad experience at Business B.',
      response_status: 'pending',
    }).select().single()

    if (!reviewA || !reviewB) {
      console.error('Failed to create test reviews')
      await cleanup(userAId, userBId)
      process.exit(1)
    }

    // Step 4: Create disputes
    console.log('Creating test disputes...')

    await admin.from('review_disputes').insert({
      review_id: reviewA.id,
      business_id: bizA.id,
      reason: 'Test dispute A',
      status: 'detected',
      violations: ['SPAM_FAKE'],
      confidence: 'low',
    })

    await admin.from('review_disputes').insert({
      review_id: reviewB.id,
      business_id: bizB.id,
      reason: 'Test dispute B',
      status: 'detected',
      violations: ['OFFENSIVE'],
      confidence: 'medium',
    })

    // Step 5: Create recovery outreach
    console.log('Creating test recovery outreach...')

    await admin.from('recovery_outreach').insert({
      review_id: reviewA.id,
      business_id: bizA.id,
      outreach_type: 'email',
      message_draft: 'Recovery message for A',
      status: 'draft',
      phase: 1,
    })

    await admin.from('recovery_outreach').insert({
      review_id: reviewB.id,
      business_id: bizB.id,
      outreach_type: 'email',
      message_draft: 'Recovery message for B',
      status: 'draft',
      phase: 1,
    })

    // Step 6: Sign in as User A and test cross-tenant access
    console.log('\n--- Testing RLS as User A ---')

    const clientA = createClient(supabaseUrl, anonKey)
    const { error: signInErr } = await clientA.auth.signInWithPassword({
      email: emailA,
      password: 'TestPassword123!',
    })

    if (signInErr) {
      console.error('Failed to sign in as User A:', signInErr.message)
      await cleanup(userAId, userBId)
      process.exit(1)
    }

    // Test 1: SELECT User B's business
    const { data: crossBiz } = await clientA
      .from('businesses')
      .select('*')
      .eq('id', bizB.id)

    record(
      'SELECT other user business',
      (crossBiz ?? []).length === 0,
      `Returned ${(crossBiz ?? []).length} rows (expected 0)`
    )

    // Test 2: SELECT User B's reviews
    const { data: crossReviews } = await clientA
      .from('reviews')
      .select('*')
      .eq('business_id', bizB.id)

    record(
      'SELECT other user reviews',
      (crossReviews ?? []).length === 0,
      `Returned ${(crossReviews ?? []).length} rows (expected 0)`
    )

    // Test 3: UPDATE User B's review
    const { data: updateResult } = await clientA
      .from('reviews')
      .update({ response_status: 'skipped' })
      .eq('id', reviewB.id)
      .select()

    record(
      'UPDATE other user review',
      (updateResult ?? []).length === 0,
      `Affected ${(updateResult ?? []).length} rows (expected 0)`
    )

    // Verify the review was NOT actually changed
    const { data: checkReview } = await admin
      .from('reviews')
      .select('response_status')
      .eq('id', reviewB.id)
      .single()

    record(
      'Verify review unchanged',
      checkReview?.response_status === 'pending',
      `Status is "${checkReview?.response_status}" (expected "pending")`
    )

    // Test 4: SELECT User B's disputes
    const { data: crossDisputes } = await clientA
      .from('review_disputes')
      .select('*')
      .eq('business_id', bizB.id)

    record(
      'SELECT other user disputes',
      (crossDisputes ?? []).length === 0,
      `Returned ${(crossDisputes ?? []).length} rows (expected 0)`
    )

    // Test 5: SELECT User B's recovery outreach
    const { data: crossRecovery } = await clientA
      .from('recovery_outreach')
      .select('*')
      .eq('business_id', bizB.id)

    record(
      'SELECT other user recovery',
      (crossRecovery ?? []).length === 0,
      `Returned ${(crossRecovery ?? []).length} rows (expected 0)`
    )

    // Bonus: Verify User A CAN see their own data
    console.log('\n--- Verifying User A can access own data ---')

    const { data: ownBiz } = await clientA
      .from('businesses')
      .select('*')
      .eq('id', bizA.id)

    record(
      'SELECT own business',
      (ownBiz ?? []).length === 1,
      `Returned ${(ownBiz ?? []).length} rows (expected 1)`
    )

    const { data: ownReviews } = await clientA
      .from('reviews')
      .select('*')
      .eq('business_id', bizA.id)

    record(
      'SELECT own reviews',
      (ownReviews ?? []).length === 1,
      `Returned ${(ownReviews ?? []).length} rows (expected 1)`
    )

    // Print summary
    console.log('\n=== RLS Test Summary ===')
    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed).length
    console.log(`  Passed: ${passed}`)
    console.log(`  Failed: ${failed}`)

    if (failed > 0) {
      console.log('\n!!! FAILED TESTS — RLS policies may need fixing:')
      for (const r of results.filter((r) => !r.passed)) {
        console.log(`  - ${r.name}: ${r.detail}`)
      }
      console.log('\nCheck RLS policies on: businesses, reviews, review_disputes, recovery_outreach')
    } else {
      console.log('\nAll RLS tests passed. Data isolation is working correctly.')
    }

    // Cleanup
    await cleanup(userAId, userBId)

    process.exit(failed > 0 ? 1 : 0)
  } catch (err) {
    console.error('Unexpected error:', err)
    await cleanup(userAId, userBId)
    process.exit(1)
  }
}

main()

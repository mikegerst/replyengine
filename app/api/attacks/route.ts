import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import { analyzeForAttackPattern } from '@/lib/ai/detect-attack'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { apiBudgetResponse, incrementApiUsage } from '@/lib/utils/api-budget'
import type { Business, Review } from '@/lib/types/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const requestedId = request.nextUrl.searchParams.get('business_id')
  const businessId = await resolveBusinessId(supabase, user.id, requestedId)

  if (!businessId) {
    return NextResponse.json({ data: [] })
  }

  const { data, error } = await supabase
    .from('attack_detections')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch attack detections' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const budgetExceeded = await apiBudgetResponse()
  if (budgetExceeded) return budgetExceeded

  const requestedId = request.nextUrl.searchParams.get('business_id')
  const businessId = await resolveBusinessId(supabase, user.id, requestedId)

  if (!businessId) {
    return NextResponse.json({ error: 'No business found' }, { status: 404 })
  }

  // Plan enforcement: attack detection requires pro plan
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (!business || (business as Business).plan !== 'pro') {
    return NextResponse.json(
      { error: 'This feature requires a Pro plan. Upgrade at /dashboard/billing' },
      { status: 403 }
    )
  }

  // Get reviews from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('business_id', businessId)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: true })

  if (!reviews || reviews.length === 0) {
    return NextResponse.json({ data: { isAttack: false } })
  }

  const result = await analyzeForAttackPattern(
    business as Business,
    reviews as Review[]
  )

  await incrementApiUsage()

  if (result.isAttack) {
    // Store the detection
    const { data: detection, error: insertError } = await supabase
      .from('attack_detections')
      .insert({
        business_id: businessId,
        confidence: result.confidence,
        attack_review_ids: result.attackReviewIds,
        pattern_description: result.patternDescription,
        evidence_package: result.evidencePackage,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save detection' }, { status: 500 })
    }

    return NextResponse.json({ data: { ...result, detection } }, { status: 201 })
  }

  return NextResponse.json({ data: result })
}

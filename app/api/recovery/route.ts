import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import { generateRecoverySequence } from '@/lib/ai/generate-recovery'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { apiBudgetResponse, incrementApiUsage } from '@/lib/utils/api-budget'
import type { Business, Review } from '@/lib/types/database'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CreateRecoverySchema = z.object({
  review_id: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 100 per minute per user
  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const requestedId = request.nextUrl.searchParams.get('business_id')
  const businessId = await resolveBusinessId(supabase, user.id, requestedId)

  if (!businessId) {
    return NextResponse.json({ data: [] })
  }

  // Plan enforcement: recovery requires pro plan
  const { data: business } = await supabase
    .from('businesses')
    .select('plan')
    .eq('id', businessId)
    .single()

  if (!business || (business as Business).plan !== 'pro') {
    return NextResponse.json(
      { error: 'This feature requires a Pro plan. Upgrade at /dashboard/billing' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('recovery_outreach')
    .select('*, reviews(*)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch recovery outreach' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json()
  const parsed = CreateRecoverySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  // Fetch review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', parsed.data.review_id)
    .single()

  if (reviewError || !review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const typedReview = review as Review

  // Fetch business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', typedReview.business_id)
    .single()

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const typedBusiness = business as Business

  // Plan enforcement: recovery requires pro plan
  if (typedBusiness.plan !== 'pro') {
    return NextResponse.json(
      { error: 'This feature requires a Pro plan. Upgrade at /dashboard/billing' },
      { status: 403 }
    )
  }

  // API budget check
  const budgetExceeded = await apiBudgetResponse()
  if (budgetExceeded) return budgetExceeded

  // Check if outreach already exists
  const { data: existing } = await supabase
    .from('recovery_outreach')
    .select('id')
    .eq('review_id', parsed.data.review_id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: 'Recovery outreach already exists for this review' },
      { status: 409 }
    )
  }

  // Rate limit: 100 per minute per user
  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  try {
    const seq = await generateRecoverySequence(typedReview, typedBusiness)
    await incrementApiUsage()
    const sequenceId = crypto.randomUUID()
    const now = new Date()

    const phases = [
      { phase: 1, message_draft: seq.phase1.message, status: 'draft' as const, scheduled_for: null },
      { phase: 2, message_draft: seq.phase2.message, status: 'scheduled' as const, scheduled_for: new Date(now.getTime() + 7 * 86400000).toISOString() },
      { phase: 3, message_draft: seq.phase3.message, status: 'scheduled' as const, scheduled_for: null },
      { phase: 4, message_draft: seq.phase4.message, status: 'scheduled' as const, scheduled_for: null },
    ]

    const rows = phases.map((p) => ({
      review_id: typedReview.id,
      business_id: typedBusiness.id,
      outreach_type: 'email' as const,
      message_draft: p.message_draft,
      suggested_resolution: p.phase === 1 ? seq.suggestedResolution : null,
      status: p.status,
      phase: p.phase,
      sequence_id: sequenceId,
      scheduled_for: p.scheduled_for,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('recovery_outreach')
      .insert(rows)
      .select('*, reviews(*)')

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save outreach' }, { status: 500 })
    }

    return NextResponse.json({ data: inserted }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate recovery message'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

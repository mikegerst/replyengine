import { createClient } from '@/lib/supabase/server'
import { generateRecoveryOutreach } from '@/lib/ai/generate-recovery'
import type { Business, Review } from '@/lib/types/database'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateRecoverySchema = z.object({
  review_id: z.string().uuid(),
})

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)

  if (!businesses || businesses.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const { data, error } = await supabase
    .from('recovery_outreach')
    .select('*, reviews(*)')
    .eq('business_id', businesses[0].id)
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

  try {
    const result = await generateRecoveryOutreach(typedReview, typedBusiness)

    const { data: outreach, error: insertError } = await supabase
      .from('recovery_outreach')
      .insert({
        review_id: typedReview.id,
        business_id: typedBusiness.id,
        outreach_type: 'email',
        message_draft: result.message,
        suggested_resolution: result.suggestedResolution,
        status: 'draft',
      })
      .select('*, reviews(*)')
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save outreach' }, { status: 500 })
    }

    return NextResponse.json({ data: outreach }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate recovery message'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

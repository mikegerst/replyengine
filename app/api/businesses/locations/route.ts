import { createClient } from '@/lib/supabase/server'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { PLANS } from '@/lib/stripe/plans'
import type { Business } from '@/lib/types/database'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CreateLocationSchema = z.object({
  parent_business_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  location_label: z.string().max(100).optional(),
  google_place_id: z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  // Fetch all businesses with review counts
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, business_type, plan, parent_business_id, location_label, google_place_id')
    .eq('owner_id', user.id)
    .order('parent_business_id', { ascending: true, nullsFirst: true })
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }

  // Get review counts per business
  const businessIds = (businesses ?? []).map((b) => b.id)
  const { data: reviewCounts } = await supabase
    .from('reviews')
    .select('business_id')
    .in('business_id', businessIds)

  const countMap = new Map<string, number>()
  for (const r of reviewCounts ?? []) {
    const bid = r.business_id as string
    countMap.set(bid, (countMap.get(bid) ?? 0) + 1)
  }

  const result = (businesses ?? []).map((b) => ({
    ...b,
    reviewCount: countMap.get(b.id) ?? 0,
  }))

  return NextResponse.json({ data: result })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const body: unknown = await request.json()
  const parsed = CreateLocationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  // Verify parent business ownership
  const { data: parent } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', parsed.data.parent_business_id)
    .eq('owner_id', user.id)
    .single()

  if (!parent) {
    return NextResponse.json({ error: 'Parent business not found' }, { status: 404 })
  }

  const typedParent = parent as Business

  // Plan enforcement: check location limits
  const { count: locationCount } = await supabase
    .from('businesses')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  const plan = typedParent.plan as keyof typeof PLANS
  const maxLocations = PLANS[plan]?.maxLocations ?? 1

  if ((locationCount ?? 0) >= maxLocations) {
    return NextResponse.json(
      { error: `Your ${PLANS[plan].name} plan allows up to ${maxLocations} location${maxLocations !== 1 ? 's' : ''}. Upgrade to add more.` },
      { status: 403 }
    )
  }

  // Create child location with inherited config from parent
  const { data: created, error: createError } = await supabase
    .from('businesses')
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      location_label: parsed.data.location_label ?? null,
      parent_business_id: typedParent.id,
      google_place_id: parsed.data.google_place_id ?? null,
      business_type: typedParent.business_type,
      tone: typedParent.tone,
      response_length: typedParent.response_length,
      custom_instructions: typedParent.custom_instructions,
      plan: typedParent.plan,
      business_description: typedParent.business_description,
      business_does_not_have: typedParent.business_does_not_have,
    })
    .select()
    .single()

  if (createError) {
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }

  return NextResponse.json({ data: created }, { status: 201 })
}

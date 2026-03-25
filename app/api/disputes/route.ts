import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import type { Business } from '@/lib/types/database'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

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

  // Plan enforcement: disputes require starter or pro plan
  const { data: business } = await supabase
    .from('businesses')
    .select('plan')
    .eq('id', businessId)
    .single()

  if (!business || (business as Business).plan === 'free') {
    return NextResponse.json(
      { error: 'This feature requires a Starter or Pro plan. Upgrade at /dashboard/billing' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('review_disputes')
    .select('*, reviews(*)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

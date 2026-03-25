import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import { calculateFairnessScore } from '@/lib/utils/fairness-score'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import type { Review, ReviewDispute } from '@/lib/types/database'
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
    return NextResponse.json({ data: null })
  }

  const [reviewsRes, disputesRes] = await Promise.all([
    supabase.from('reviews').select('*').eq('business_id', businessId),
    supabase.from('review_disputes').select('*').eq('business_id', businessId),
  ])

  const reviews = (reviewsRes.data ?? []) as Review[]
  const disputes = (disputesRes.data ?? []) as ReviewDispute[]

  const score = calculateFairnessScore(reviews, disputes)

  return NextResponse.json({ data: score })
}

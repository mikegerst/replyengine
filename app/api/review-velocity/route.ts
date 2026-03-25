import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import { calculateSafeVelocity } from '@/lib/utils/review-velocity'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import type { Review } from '@/lib/types/database'
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

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, star_rating, review_date, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  const velocity = calculateSafeVelocity((reviews ?? []) as Review[])

  return NextResponse.json({ data: velocity })
}

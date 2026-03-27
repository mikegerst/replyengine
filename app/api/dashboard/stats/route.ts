import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import type { DashboardStats } from '@/lib/types/database'
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
  const isAllLocations = requestedId === 'all'

  let businessIds: string[] = []

  if (isAllLocations) {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
    businessIds = (businesses ?? []).map((b) => b.id)
  } else {
    const businessId = await resolveBusinessId(supabase, user.id, requestedId)
    if (businessId) {
      businessIds = [businessId]
    }
  }

  if (businessIds.length === 0) {
    const emptyStats: DashboardStats = {
      totalReviews: 0,
      pendingResponses: 0,
      avgRating: 0,
      responseRate: 0,
      reviewsByStatus: { pending: 0, draft: 0, approved: 0, posted: 0, skipped: 0 },
    }
    return NextResponse.json({ data: emptyStats })
  }

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('star_rating, response_status')
    .in('business_id', businessIds)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }

  const total = reviews?.length ?? 0
  const statusCounts = { pending: 0, draft: 0, approved: 0, posted: 0, skipped: 0 }
  let ratingSum = 0

  for (const r of reviews ?? []) {
    const status = r.response_status as keyof typeof statusCounts
    if (status in statusCounts) {
      statusCounts[status]++
    }
    ratingSum += r.star_rating
  }

  const stats: DashboardStats = {
    totalReviews: total,
    pendingResponses: statusCounts.pending + statusCounts.draft,
    avgRating: total > 0 ? Math.round((ratingSum / total) * 10) / 10 : 0,
    responseRate: total > 0 ? Math.round((statusCounts.posted / total) * 100) : 0,
    reviewsByStatus: statusCounts,
  }

  return NextResponse.json({ data: stats })
}

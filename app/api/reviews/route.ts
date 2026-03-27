import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import { ReviewsQuerySchema } from '@/lib/types/api'
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
    return NextResponse.json({ data: [], total: 0 })
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = ReviewsQuerySchema.safeParse(searchParams)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid query' },
      { status: 400 }
    )
  }

  const { status, star_rating, page, per_page } = parsed.data
  const offset = (page - 1) * per_page

  // For "all locations", also fetch business names
  let query = isAllLocations
    ? supabase
        .from('reviews')
        .select('*, businesses!inner(name)', { count: 'exact' })
        .in('business_id', businessIds)
        .order('review_date', { ascending: false })
        .range(offset, offset + per_page - 1)
    : supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('business_id', businessIds[0])
        .order('review_date', { ascending: false })
        .range(offset, offset + per_page - 1)

  if (status) {
    query = query.eq('response_status', status)
  }

  if (star_rating) {
    query = query.eq('star_rating', star_rating)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  // Flatten business name into the response for "all" mode
  const reviews = isAllLocations
    ? (data ?? []).map((r: Record<string, unknown>) => {
        const businesses = r.businesses as { name: string } | null
        return { ...r, business_name: businesses?.name ?? null, businesses: undefined }
      })
    : data

  return NextResponse.json({ data: reviews, total: count ?? 0, page, per_page })
}

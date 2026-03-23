import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import { ReviewsQuerySchema } from '@/lib/types/api'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestedId = request.nextUrl.searchParams.get('business_id')
  const businessId = await resolveBusinessId(supabase, user.id, requestedId)

  if (!businessId) {
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

  let query = supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
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

  return NextResponse.json({ data, total: count ?? 0, page, per_page })
}

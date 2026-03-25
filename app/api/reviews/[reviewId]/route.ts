import { createClient } from '@/lib/supabase/server'
import { UpdateReviewStatusSchema } from '@/lib/types/api'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { reviewId: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 100 per minute per user
  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', params.reviewId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 100 per minute per user
  const rl = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rl) return rl

  const body: unknown = await request.json()
  const parsed = UpdateReviewStatusSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const updateData: Record<string, unknown> = {
    response_status: parsed.data.status,
  }

  if (parsed.data.edited_response !== undefined) {
    updateData.edited_response = parsed.data.edited_response
  }

  if (parsed.data.status === 'posted') {
    updateData.posted_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('reviews')
    .update(updateData)
    .eq('id', params.reviewId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

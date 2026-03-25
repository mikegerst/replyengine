import { createClient } from '@/lib/supabase/server'
import { generateForumPost } from '@/lib/ai/generate-forum-post'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import type { Business, Review, ReviewDispute } from '@/lib/types/database'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: { disputeId: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const { data: dispute, error: disputeError } = await supabase
    .from('review_disputes')
    .select('*, reviews(*)')
    .eq('id', params.disputeId)
    .single()

  if (disputeError || !dispute) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
  }

  const typedDispute = dispute as ReviewDispute & { reviews: Review }

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', typedDispute.business_id)
    .single()

  if (bizError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const forumPost = generateForumPost(typedDispute, typedDispute.reviews, business as Business)

  // Save to dispute
  const { data: updated, error: updateError } = await supabase
    .from('review_disputes')
    .update({ forum_post_draft: forumPost })
    .eq('id', params.disputeId)
    .select('*, reviews(*)')
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Failed to save forum post' }, { status: 500 })
  }

  return NextResponse.json({ data: updated })
}

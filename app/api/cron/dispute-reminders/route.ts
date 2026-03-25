import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  // Find flagged disputes where 3+ days have passed
  const { data: disputes, error } = await supabase
    .from('review_disputes')
    .select('id, flagged_at')
    .eq('status', 'flagged')
    .not('flagged_at', 'is', null)
    .lte('flagged_at', threeDaysAgo)

  if (error) {
    return NextResponse.json({ error: 'Failed to query disputes' }, { status: 500 })
  }

  let updated = 0

  for (const dispute of disputes ?? []) {
    const { error: updateError } = await supabase
      .from('review_disputes')
      .update({ status: 'appeal_ready' })
      .eq('id', dispute.id)

    if (!updateError) updated++
  }

  return NextResponse.json({
    data: { checked: disputes?.length ?? 0, updated },
  })
}

import { createClient } from '@supabase/supabase-js'
import { generateWeeklyWinsEmail, getWeeklyStats } from '@/lib/notifications/weekly-wins'
import type { Business, Review, ReviewDispute, RecoveryOutreach } from '@/lib/types/database'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isVercelCron = request.headers.get('x-vercel-cron') !== null

  if (!cronSecret || (!isVercelCron && authHeader !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all businesses on paid plans
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .in('plan', ['starter', 'pro'])

  if (!businesses || businesses.length === 0) {
    return NextResponse.json({ data: { sent: 0 } })
  }

  let sent = 0

  for (const biz of businesses) {
    const business = biz as Business

    const [reviewsRes, disputesRes, recoveriesRes] = await Promise.all([
      supabase.from('reviews').select('*').eq('business_id', business.id),
      supabase.from('review_disputes').select('*').eq('business_id', business.id),
      supabase.from('recovery_outreach').select('*').eq('business_id', business.id),
    ])

    const stats = getWeeklyStats(
      (reviewsRes.data ?? []) as Review[],
      (disputesRes.data ?? []) as ReviewDispute[],
      (recoveriesRes.data ?? []) as RecoveryOutreach[],
    )

    const email = generateWeeklyWinsEmail({ business, ...stats })

    // TODO: Send via Resend once the resend package is installed and lib/notifications/email.ts is implemented
    // Install resend (`npm i resend`) then uncomment:
    //   import { Resend } from 'resend'
    //   const resend = new Resend(process.env.RESEND_API_KEY)
    //   await resend.emails.send({ from: '...', to: ownerEmail, subject: email.subject, html: email.body })
    if (process.env.NODE_ENV === 'development') {
      console.log(`[weekly-wins] Would send to ${business.name}: ${email.subject}`)
    }

    sent++
  }

  return NextResponse.json({ data: { sent } })
}

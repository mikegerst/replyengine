import { createClient } from '@supabase/supabase-js'
import { sendRecoveryEmail } from '@/lib/notifications/email'
import { sendRecoverySms } from '@/lib/notifications/sms'
import type { RecoveryOutreach, Business } from '@/lib/types/database'
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

  const now = new Date().toISOString()

  // Find scheduled follow-ups that are due
  const { data: dueOutreach, error } = await supabase
    .from('recovery_outreach')
    .select('*, reviews(reviewer_name)')
    .eq('status', 'scheduled')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', now)

  if (error) {
    return NextResponse.json({ error: 'Failed to query outreach' }, { status: 500 })
  }

  let sent = 0
  let skipped = 0
  let errors = 0

  for (const record of dueOutreach ?? []) {
    const outreach = record as RecoveryOutreach & { reviews: { reviewer_name: string | null } }

    // Check if the sequence has been resolved or opted out
    if (outreach.sequence_id) {
      const { data: sequenceRecords } = await supabase
        .from('recovery_outreach')
        .select('status')
        .eq('sequence_id', outreach.sequence_id)

      const hasTerminal = (sequenceRecords ?? []).some(
        (r: { status: string }) => r.status === 'resolved' || r.status === 'dismissed'
      )

      if (hasTerminal) {
        await supabase
          .from('recovery_outreach')
          .update({ status: 'skipped' })
          .eq('id', outreach.id)
        skipped++
        continue
      }
    }

    if (!outreach.message_draft) {
      skipped++
      continue
    }

    // Fetch business for sending
    const { data: business } = await supabase
      .from('businesses')
      .select('id, owner_id, name, plan, phone')
      .eq('id', outreach.business_id)
      .single()

    if (!business || (business as Business).plan !== 'pro') {
      skipped++
      continue
    }

    const typedBusiness = business as Pick<Business, 'id' | 'owner_id' | 'name' | 'plan' | 'phone'>
    let sendSuccess = false

    if (outreach.outreach_type === 'sms') {
      if (!typedBusiness.phone) {
        skipped++
        continue
      }
      const result = await sendRecoverySms({
        to: typedBusiness.phone,
        body: outreach.message_draft,
      })
      sendSuccess = result.success
    } else {
      const { data: ownerData } = await supabase.auth.admin.getUserById(typedBusiness.owner_id)
      const ownerEmail = ownerData?.user?.email
      if (!ownerEmail) {
        skipped++
        continue
      }

      const reviewerName = outreach.reviews?.reviewer_name ?? 'your customer'
      const result = await sendRecoveryEmail({
        to: ownerEmail,
        subject: `Recovery follow-up (Phase ${outreach.phase}): ${reviewerName}`,
        htmlBody: `<div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #111827;">Recovery Follow-up (Phase ${outreach.phase})</h2>
          <p style="color: #6b7280;">Follow-up message for <strong>${reviewerName}</strong>:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="color: #111827; white-space: pre-wrap;">${outreach.message_draft}</p>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">Sent via ReplyEngine for ${typedBusiness.name}</p>
        </div>`,
        textBody: outreach.message_draft,
        fromName: typedBusiness.name,
      })
      sendSuccess = result.success
    }

    if (sendSuccess) {
      await supabase
        .from('recovery_outreach')
        .update({ status: 'sent', sent_at: now })
        .eq('id', outreach.id)
      sent++
    } else {
      errors++
    }
  }

  return NextResponse.json({
    data: { checked: dueOutreach?.length ?? 0, sent, skipped, errors },
  })
}

import { createClient } from '@/lib/supabase/server'
import { sendRecoveryEmail } from '@/lib/notifications/email'
import { sendRecoverySms } from '@/lib/notifications/sms'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import type { Business, RecoveryOutreach } from '@/lib/types/database'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: { outreachId: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load outreach record
  const { data: outreach, error: outreachError } = await supabase
    .from('recovery_outreach')
    .select('*, reviews(reviewer_name, review_text)')
    .eq('id', params.outreachId)
    .single()

  if (outreachError || !outreach) {
    return NextResponse.json({ error: 'Outreach record not found' }, { status: 404 })
  }

  const typedOutreach = outreach as RecoveryOutreach & { reviews: { reviewer_name: string | null; review_text: string | null } }

  // Verify business ownership
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, owner_id, name, plan, phone, notification_email')
    .eq('id', typedOutreach.business_id)
    .single()

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const typedBusiness = business as Pick<Business, 'id' | 'owner_id' | 'name' | 'plan' | 'phone' | 'notification_email'>

  if (typedBusiness.owner_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Pro plan check
  if (typedBusiness.plan !== 'pro') {
    return NextResponse.json(
      { error: 'Sending recovery messages requires a Pro plan.' },
      { status: 403 }
    )
  }

  // Validate outreach is in sendable state
  if (typedOutreach.status !== 'draft') {
    return NextResponse.json(
      { error: `Cannot send outreach with status "${typedOutreach.status}". Only draft messages can be sent.` },
      { status: 400 }
    )
  }

  if (!typedOutreach.message_draft) {
    return NextResponse.json(
      { error: 'No message draft to send' },
      { status: 400 }
    )
  }

  // Rate limit: 20 sends per hour per business
  const rateLimited = await rateLimitResponse(
    `recovery-send:${typedOutreach.business_id}`,
    20,
    60 * 60 * 1000
  )
  if (rateLimited) return rateLimited

  // Determine channel and send
  const channel = typedOutreach.outreach_type

  if (channel === 'sms') {
    if (!typedBusiness.phone) {
      return NextResponse.json(
        { error: 'No phone number configured for this business. Update in Settings.' },
        { status: 400 }
      )
    }

    const result = await sendRecoverySms({
      to: typedBusiness.phone,
      body: typedOutreach.message_draft,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to send SMS' },
        { status: 500 }
      )
    }
  } else {
    // Email channel
    const { data: ownerData } = await supabase.auth.admin.getUserById(typedBusiness.owner_id)
    const ownerEmail = ownerData?.user?.email

    if (!ownerEmail) {
      return NextResponse.json(
        { error: 'No email address found for business owner' },
        { status: 400 }
      )
    }

    const reviewerName = typedOutreach.reviews?.reviewer_name ?? 'your customer'
    const subject = `Recovery outreach: follow up with ${reviewerName}`

    const result = await sendRecoveryEmail({
      to: ownerEmail,
      subject,
      htmlBody: `<div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #111827;">Recovery Message Ready</h2>
        <p style="color: #6b7280;">Here's your recovery outreach message for <strong>${reviewerName}</strong>:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="color: #111827; white-space: pre-wrap;">${typedOutreach.message_draft}</p>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">Sent via ReplyEngine for ${typedBusiness.name}</p>
      </div>`,
      textBody: typedOutreach.message_draft,
      fromName: typedBusiness.name,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to send email' },
        { status: 500 }
      )
    }
  }

  // Update status to sent
  const { data: updated, error: updateError } = await supabase
    .from('recovery_outreach')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', params.outreachId)
    .select('*, reviews(*)')
    .single()

  if (updateError) {
    return NextResponse.json(
      { error: 'Message sent but failed to update status' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: updated })
}

import { createClient } from '@/lib/supabase/server'
import { UpdateBusinessSchema } from '@/lib/types/api'
import { BUSINESS_PUBLIC_COLUMNS } from '@/lib/utils/sanitize-response'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateBusinessExtendedSchema = UpdateBusinessSchema.extend({
  employee_names: z.array(z.string().max(200)).max(100).optional(),
  competitor_names: z.array(z.string().max(200)).max(50).optional(),
  current_promotions: z.string().max(2000).nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const body: unknown = await request.json()
  const parsed = UpdateBusinessExtendedSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('businesses')
    .select('owner_id, plan')
    .eq('id', params.businessId)
    .single()

  if (!existing || existing.owner_id !== user.id) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Plan enforcement for auto_respond
  if (parsed.data.auto_respond === true && existing.plan === 'free') {
    return NextResponse.json(
      { error: 'Auto-respond requires a Starter or Pro plan. Upgrade at /dashboard/billing' },
      { status: 403 }
    )
  }

  const updateData: Record<string, unknown> = {}
  const fields = parsed.data

  if (fields.name !== undefined) updateData.name = fields.name
  if (fields.business_type !== undefined) updateData.business_type = fields.business_type
  if (fields.tone !== undefined) updateData.tone = fields.tone
  if (fields.response_length !== undefined) updateData.response_length = fields.response_length
  if (fields.custom_instructions !== undefined) updateData.custom_instructions = fields.custom_instructions
  if (fields.auto_respond !== undefined) updateData.auto_respond = fields.auto_respond
  if (fields.auto_respond_min_stars !== undefined) updateData.auto_respond_min_stars = fields.auto_respond_min_stars
  if (fields.notification_email !== undefined) updateData.notification_email = fields.notification_email
  if (fields.notification_sms !== undefined) updateData.notification_sms = fields.notification_sms
  if (fields.phone !== undefined) updateData.phone = fields.phone
  if (fields.employee_names !== undefined) updateData.employee_names = fields.employee_names
  if (fields.competitor_names !== undefined) updateData.competitor_names = fields.competitor_names
  if (fields.current_promotions !== undefined) updateData.current_promotions = fields.current_promotions
  if (fields.business_description !== undefined) updateData.business_description = fields.business_description
  if (fields.business_does_not_have !== undefined) updateData.business_does_not_have = fields.business_does_not_have
  if (fields.location_label !== undefined) updateData.location_label = fields.location_label

  const { data, error } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('id', params.businessId)
    .select(BUSINESS_PUBLIC_COLUMNS + ', employee_names, competitor_names, business_description, business_does_not_have')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

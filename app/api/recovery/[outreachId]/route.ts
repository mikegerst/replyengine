import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateRecoverySchema = z.object({
  status: z.enum(['draft', 'sent', 'responded', 'resolved', 'dismissed']).optional(),
  notes: z.string().max(2000).optional(),
  message_draft: z.string().max(5000).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { outreachId: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json()
  const parsed = UpdateRecoverySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const updateData: Record<string, unknown> = {}

  if (parsed.data.status) {
    updateData.status = parsed.data.status
  }

  if (parsed.data.notes !== undefined) {
    updateData.notes = parsed.data.notes
  }

  if (parsed.data.message_draft !== undefined) {
    updateData.message_draft = parsed.data.message_draft
  }

  if (parsed.data.status === 'sent') {
    updateData.sent_at = new Date().toISOString()
  }

  if (parsed.data.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('recovery_outreach')
    .update(updateData)
    .eq('id', params.outreachId)
    .select('*, reviews(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update outreach' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

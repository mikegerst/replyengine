import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateDisputeSchema = z.object({
  status: z.enum(['detected', 'flagged', 'appeal_ready', 'submitted', 'under_review', 'removed', 'denied', 'escalated', 'dismissed']).optional(),
  google_case_id: z.string().optional(),
  appeal_text: z.string().max(5000).optional(),
  escalation_type: z.enum(['forum', 'support', 'legal']).optional(),
  escalation_notes: z.string().max(5000).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { disputeId: string } }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json()
  const parsed = UpdateDisputeSchema.safeParse(body)

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

  if (parsed.data.google_case_id !== undefined) {
    updateData.google_case_id = parsed.data.google_case_id
  }

  if (parsed.data.appeal_text !== undefined) {
    updateData.appeal_text = parsed.data.appeal_text
  }

  if (parsed.data.escalation_type !== undefined) {
    updateData.escalation_type = parsed.data.escalation_type
  }

  if (parsed.data.escalation_notes !== undefined) {
    updateData.escalation_notes = parsed.data.escalation_notes
  }

  // Auto-set timestamps based on status
  if (parsed.data.status === 'flagged') {
    updateData.flagged_at = new Date().toISOString()
  }

  if (parsed.data.status === 'submitted') {
    updateData.appeal_submitted_at = new Date().toISOString()
    updateData.submitted_at = new Date().toISOString()
  }

  if (parsed.data.status === 'removed' || parsed.data.status === 'denied') {
    updateData.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('review_disputes')
    .update(updateData)
    .eq('id', params.disputeId)
    .select('*, reviews(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update dispute' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

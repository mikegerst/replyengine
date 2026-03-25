import { createClient } from '@/lib/supabase/server'
import { CreateBusinessSchema } from '@/lib/types/api'
import { BUSINESS_PUBLIC_COLUMNS } from '@/lib/utils/sanitize-response'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 100 per minute per user
  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const { data, error } = await supabase
    .from('businesses')
    .select(BUSINESS_PUBLIC_COLUMNS)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json()
  const parsed = CreateBusinessSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('businesses')
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      business_type: parsed.data.business_type ?? null,
      tone: parsed.data.tone,
      response_length: parsed.data.response_length,
      custom_instructions: parsed.data.custom_instructions ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

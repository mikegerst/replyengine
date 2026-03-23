import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestedId = request.nextUrl.searchParams.get('business_id')
  const businessId = await resolveBusinessId(supabase, user.id, requestedId)

  if (!businessId) {
    return NextResponse.json({ data: [] })
  }

  const { data, error } = await supabase
    .from('review_disputes')
    .select('*, reviews(*)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

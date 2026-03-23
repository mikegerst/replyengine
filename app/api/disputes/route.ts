import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)

  if (!businesses || businesses.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const { data, error } = await supabase
    .from('review_disputes')
    .select('*, reviews(*)')
    .eq('business_id', businesses[0].id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import type { Business } from '@/lib/types/database'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const typedBusiness = business as Business

  if (!typedBusiness.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 400 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: typedBusiness.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    })

    return NextResponse.json({ data: { url: session.url } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create portal session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

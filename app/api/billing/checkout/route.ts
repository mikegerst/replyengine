import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { getPriceId } from '@/lib/stripe/plans'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import type { Business } from '@/lib/types/database'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CheckoutSchema = z.object({
  plan: z.enum(['starter', 'pro']),
})

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 100 per minute per user
  const rateLimited = await rateLimitResponse(`user:${user.id}`, 100, 60 * 1000)
  if (rateLimited) return rateLimited

  const body: unknown = await request.json()
  const parsed = CheckoutSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const priceId = getPriceId(parsed.data.plan)
  if (!priceId) {
    return NextResponse.json({ error: 'Plan not configured' }, { status: 500 })
  }

  // Get the business
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const sessionParams: Record<string, unknown> = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/dashboard/billing`,
      metadata: {
        business_id: typedBusiness.id,
        user_id: user.id,
      },
    }

    if (typedBusiness.stripe_customer_id) {
      sessionParams.customer = typedBusiness.stripe_customer_id
    } else {
      sessionParams.customer_email = user.email
    }

    const session = await getStripe().checkout.sessions.create(
      sessionParams as Parameters<ReturnType<typeof getStripe>['checkout']['sessions']['create']>[0]
    )

    return NextResponse.json({ data: { url: session.url } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

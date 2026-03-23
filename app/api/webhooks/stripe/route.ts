import { getStripe } from '@/lib/stripe/client'
import { planFromPriceId } from '@/lib/stripe/plans'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role to bypass RLS in webhook handler
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = getAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const businessId = session.metadata?.business_id
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.toString()
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.toString()

      if (!businessId || !subscriptionId) break

      // Get the subscription to find the price ID
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
      const priceId = subscription.items.data[0]?.price.id ?? ''
      const plan = planFromPriceId(priceId)

      await supabase
        .from('businesses')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan,
        })
        .eq('id', businessId)

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const priceId = subscription.items.data[0]?.price.id ?? ''
      const plan = planFromPriceId(priceId)
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : ''

      if (!customerId) break

      await supabase
        .from('businesses')
        .update({ plan })
        .eq('stripe_customer_id', customerId)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : ''

      if (!customerId) break

      await supabase
        .from('businesses')
        .update({
          plan: 'free',
          stripe_subscription_id: null,
        })
        .eq('stripe_customer_id', customerId)

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : ''

      if (!customerId) break

      // We don't have a dedicated column — store in the existing fields
      // The billing page will check subscription status directly
      break
    }
  }

  return NextResponse.json({ received: true })
}

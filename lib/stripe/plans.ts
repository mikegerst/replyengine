export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    responsesPerMonth: 5,
    features: [
      '5 AI responses per month',
      'Copy-paste responses',
      'Basic tone settings',
    ],
    shield: false,
    recover: false,
  },
  starter: {
    name: 'Starter',
    price: 19,
    responsesPerMonth: 30,
    features: [
      '30 AI responses per month',
      'One-tap posting to Google',
      'Dispute detection alerts',
      'Custom response tone',
      'Email notifications',
    ],
    shield: 'alerts', // alerts only, no filing
    recover: false,
  },
  pro: {
    name: 'Pro',
    price: 39,
    responsesPerMonth: Infinity,
    features: [
      'Unlimited AI responses',
      'Auto-post responses',
      'Full dispute filing assistance',
      'Recovery outreach (email + SMS)',
      'Analytics dashboard',
      'Priority support',
    ],
    shield: true,
    recover: true,
  },
} as const

export type PlanId = keyof typeof PLANS

export function getPriceId(plan: 'starter' | 'pro'): string {
  if (plan === 'starter') {
    return process.env.STRIPE_STARTER_PRICE_ID ?? ''
  }
  return process.env.STRIPE_PRO_PRICE_ID ?? ''
}

export function planFromPriceId(priceId: string): PlanId {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  return 'free'
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/lib/types/database'
import { Button } from '@/components/ui/button'

const PLAN_DETAILS = {
  free: {
    name: 'Free',
    price: '$0',
    limit: 5,
    features: ['5 AI responses/month', 'Copy-paste responses', 'Basic tone settings'],
  },
  starter: {
    name: 'Starter',
    price: '$19/mo',
    limit: 30,
    features: [
      '30 AI responses/month',
      'One-tap posting to Google',
      'Dispute detection alerts',
      'Custom response tone',
      'Email notifications',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$39/mo',
    limit: Infinity,
    features: [
      'Unlimited AI responses',
      'Auto-post responses',
      'Full dispute filing',
      'Recovery outreach',
      'Analytics dashboard',
      'Priority support',
    ],
  },
} as const

export default function BillingPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .limit(1)
        .single()

      if (data) setBusiness(data as Business)
      setLoading(false)
    }
    load()
  }, [])

  async function handleUpgrade(plan: 'starter' | 'pro') {
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      if (json.data?.url) {
        window.location.href = json.data.url
      }
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function handleManage() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const json = await res.json()
      if (json.data?.url) {
        window.location.href = json.data.url
      }
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-32 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  if (!business) return null

  const plan = PLAN_DETAILS[business.plan] ?? PLAN_DETAILS.free
  const usageLimit = plan.limit
  const usageCount = business.monthly_response_count
  const usagePercent = usageLimit === Infinity ? 0 : Math.min(100, Math.round((usageCount / usageLimit) * 100))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and usage.
        </p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {plan.name} Plan
            </h2>
            <p className="text-sm text-gray-500">{plan.price}</p>
          </div>
          {business.plan !== 'free' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManage}
              disabled={portalLoading}
            >
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </Button>
          )}
        </div>

        {/* Usage bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-600">
              AI responses this month
            </span>
            <span className="text-sm font-medium text-gray-900">
              {usageCount} / {usageLimit === Infinity ? '∞' : usageLimit}
            </span>
          </div>
          {usageLimit !== Infinity && (
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-gray-900'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
          {usageLimit !== Infinity && usagePercent >= 90 && (
            <p className="mt-1.5 text-xs text-red-600">
              You&apos;re running low on responses. Upgrade for more.
            </p>
          )}
        </div>

        {/* Current plan features */}
        <ul className="mt-4 space-y-1.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade cards (only show plans above current) */}
      {business.plan === 'free' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UpgradeCard
            name="Starter"
            price="$19/mo"
            features={PLAN_DETAILS.starter.features}
            onUpgrade={() => handleUpgrade('starter')}
            loading={checkoutLoading === 'starter'}
            disabled={checkoutLoading !== null}
          />
          <UpgradeCard
            name="Pro"
            price="$39/mo"
            features={PLAN_DETAILS.pro.features}
            onUpgrade={() => handleUpgrade('pro')}
            loading={checkoutLoading === 'pro'}
            disabled={checkoutLoading !== null}
            highlighted
          />
        </div>
      )}

      {business.plan === 'starter' && (
        <div className="max-w-sm">
          <UpgradeCard
            name="Pro"
            price="$39/mo"
            features={PLAN_DETAILS.pro.features}
            onUpgrade={() => handleUpgrade('pro')}
            loading={checkoutLoading === 'pro'}
            disabled={checkoutLoading !== null}
            highlighted
          />
        </div>
      )}
    </div>
  )
}

function UpgradeCard({
  name,
  price,
  features,
  onUpgrade,
  loading,
  disabled,
  highlighted,
}: {
  name: string
  price: string
  features: readonly string[]
  onUpgrade: () => void
  loading: boolean
  disabled: boolean
  highlighted?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-6 ${
        highlighted
          ? 'border-2 border-gray-900 bg-white'
          : 'border border-gray-200 bg-white'
      }`}
    >
      {highlighted && (
        <span className="inline-block bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full font-medium mb-3">
          Recommended
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{price}</p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Button
        className="w-full mt-6"
        onClick={onUpgrade}
        disabled={disabled}
      >
        {loading ? 'Redirecting...' : `Upgrade to ${name}`}
      </Button>
    </div>
  )
}

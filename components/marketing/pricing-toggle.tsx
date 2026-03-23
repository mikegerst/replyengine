'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Try it out',
    features: [
      '5 AI responses per month',
      'Copy-paste responses',
      'Basic tone settings',
    ],
    cta: 'Get Started',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Starter',
    monthlyPrice: 19,
    annualPrice: 15.83,
    description: 'For growing businesses',
    features: [
      '30 AI responses per month',
      'One-tap posting to Google',
      'Dispute detection alerts',
      'Custom response tone',
      'Email notifications',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
    highlighted: true,
  },
  {
    name: 'Pro',
    monthlyPrice: 39,
    annualPrice: 32.50,
    description: 'For serious reputation management',
    features: [
      'Unlimited AI responses',
      'Auto-post responses',
      'Recovery outreach (email + SMS)',
      'Dispute filing assistance',
      'Analytics dashboard',
      'Social content generation',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
    highlighted: false,
  },
]

export function PricingToggle() {
  const [annual, setAnnual] = useState(false)

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm ${!annual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            annual ? 'bg-gray-900' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              annual ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm ${annual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          Annual
        </span>
        {annual && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            2 months free
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PLANS.map((plan) => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice
          return (
            <div
              key={plan.name}
              className={`rounded-xl p-6 ${
                plan.highlighted
                  ? 'border-2 border-gray-900 bg-white shadow-lg relative'
                  : 'border border-gray-200 bg-white'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">
                  ${price === 0 ? '0' : Math.floor(price)}
                </span>
                {price > 0 && (
                  <span className="text-gray-500 text-sm">/mo</span>
                )}
              </div>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-6 block text-center py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                  plan.highlighted
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

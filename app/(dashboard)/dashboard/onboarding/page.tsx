'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const BUSINESS_TYPES = [
  'Plumber',
  'Electrician',
  'HVAC',
  'General Contractor',
  'Landscaper',
  'Roofing',
  'Painter',
  'Cleaning Service',
  'Auto Repair',
  'Restaurant',
  'Salon / Spa',
  'Dentist',
  'Other',
]

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Polished and business-appropriate' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed and conversational' },
  { value: 'formal', label: 'Formal', desc: 'Traditional and respectful' },
] as const

const LENGTHS = [
  { value: 'short', label: 'Short', desc: '2-3 sentences' },
  { value: 'medium', label: 'Medium', desc: '3-5 sentences' },
  { value: 'long', label: 'Long', desc: '5-7 sentences' },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [tone, setTone] = useState('professional')
  const [responseLength, setResponseLength] = useState('medium')
  const [customInstructions, setCustomInstructions] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          business_type: businessType || undefined,
          tone,
          response_length: responseLength,
          custom_instructions: customInstructions || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Failed to create business. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Set up your business</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tell us about your business so we can tailor AI responses to match your brand.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Business name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Business name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="e.g. Mike's Plumbing"
          />
        </div>

        {/* Business type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Business type
          </label>
          <select
            id="type"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">Select a type</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Response tone */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Response tone</p>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => (
              <label
                key={t.value}
                className={`flex flex-col p-3 rounded-md border cursor-pointer transition-colors ${
                  tone === t.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  value={t.value}
                  checked={tone === t.value}
                  onChange={(e) => setTone(e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-900">{t.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{t.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Response length */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Response length</p>
          <div className="grid grid-cols-3 gap-2">
            {LENGTHS.map((l) => (
              <label
                key={l.value}
                className={`flex flex-col items-center p-3 rounded-md border cursor-pointer transition-colors ${
                  responseLength === l.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="length"
                  value={l.value}
                  checked={responseLength === l.value}
                  onChange={(e) => setResponseLength(e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-900">{l.label}</span>
                <span className="text-xs text-gray-400">{l.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
            Custom instructions <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="instructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
            placeholder="e.g. Always mention our 24/7 emergency service. Offer a 10% discount to unhappy customers."
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Setting up...' : 'Continue to dashboard'}
        </Button>
      </form>
    </div>
  )
}

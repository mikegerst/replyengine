'use client'

import { useState } from 'react'

const BUSINESS_TYPES = [
  'Restaurant',
  'Dental / Medical',
  'Salon / Spa',
  'Home Services',
  'Automotive',
  'Hotel / Lodging',
  'Retail',
  'Legal / Professional',
  'Other',
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
] as const

export function FreeGeneratorForm() {
  const [businessType, setBusinessType] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [tone, setTone] = useState('friendly')
  const [starRating, setStarRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewerName, setReviewerName] = useState('')

  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    if (!businessType) {
      setError('Please select a business type.')
      return
    }
    if (!reviewText || reviewText.trim().length < 5) {
      setError('Please paste a review (at least 5 characters).')
      return
    }

    setError(null)
    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch('/api/free-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type: businessType,
          business_name: businessName || undefined,
          tone,
          star_rating: starRating,
          review_text: reviewText.trim(),
          reviewer_name: reviewerName || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      setResponse(json.data.response)
    } catch {
      setError('Failed to generate response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!response) return
    await navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8 space-y-5">
        {/* Business type */}
        <div>
          <label htmlFor="ft-type" className="block text-sm font-medium text-gray-700 mb-1">
            Business type
          </label>
          <select
            id="ft-type"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">Select your business type</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Business name */}
        <div>
          <label htmlFor="ft-name" className="block text-sm font-medium text-gray-700 mb-1">
            Business name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="ft-name"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Mike's Kitchen & Grill"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Tone */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Response tone</p>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  tone === t.value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Star rating */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            Review star rating
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStarRating(star)}
                className="p-0.5 focus:outline-none"
              >
                <svg
                  className={`w-8 h-8 sm:w-7 sm:h-7 transition-colors ${
                    star <= starRating ? 'text-yellow-400' : 'text-gray-200'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-400">{starRating}/5</span>
          </div>
        </div>

        {/* Reviewer name */}
        <div>
          <label htmlFor="ft-reviewer" className="block text-sm font-medium text-gray-700 mb-1">
            Reviewer name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="ft-reviewer"
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="e.g. Sarah M."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Review text */}
        <div>
          <label htmlFor="ft-review" className="block text-sm font-medium text-gray-700 mb-1">
            Paste the review
          </label>
          <textarea
            id="ft-review"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={5}
            placeholder="Paste the customer's Google review here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gray-900 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating response...' : 'Generate Response'}
        </button>
      </div>

      {/* Result */}
      {response && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Your Response</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setResponse(null)
                  handleGenerate()
                }}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {response}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="mt-4 w-full sm:w-auto bg-gray-900 text-white py-3 sm:py-2 px-6 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      )}
    </div>
  )
}

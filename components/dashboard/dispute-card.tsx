'use client'

import { useState } from 'react'
import type { ReviewDisputeWithReview } from '@/lib/types/database'
import { StarRating } from '@/components/dashboard/star-rating'
import { Button } from '@/components/ui/button'
import { formatRelativeDate } from '@/lib/utils/format'

const VIOLATION_COLORS: Record<string, string> = {
  SPAM_FAKE: 'bg-red-100 text-red-700',
  OFFENSIVE: 'bg-orange-100 text-orange-700',
  CONFLICT_OF_INTEREST: 'bg-purple-100 text-purple-700',
  OFF_TOPIC: 'bg-blue-100 text-blue-700',
  RESTRICTED_CONTENT: 'bg-yellow-100 text-yellow-800',
}

const VIOLATION_LABELS: Record<string, string> = {
  SPAM_FAKE: 'Spam / Fake',
  OFFENSIVE: 'Offensive',
  CONFLICT_OF_INTEREST: 'Conflict of Interest',
  OFF_TOPIC: 'Off Topic',
  RESTRICTED_CONTENT: 'Restricted Content',
}

const STATUS_FLOW = ['detected', 'submitted', 'under_review', 'removed'] as const

const CONFIDENCE_STYLES = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

interface DisputeCardProps {
  dispute: ReviewDisputeWithReview
  onUpdate: (updated: ReviewDisputeWithReview) => void
}

export function DisputeCard({ dispute, onUpdate }: DisputeCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showDisputeText, setShowDisputeText] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  const review = dispute.reviews

  async function handleStatusChange(status: string) {
    setLoading(status)
    try {
      const res = await fetch(`/api/disputes/${dispute.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (json.data) onUpdate(json.data)
    } finally {
      setLoading(null)
    }
  }

  const currentStep = STATUS_FLOW.indexOf(dispute.status as typeof STATUS_FLOW[number])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      {/* Review header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-600">
              {(review?.reviewer_name ?? 'A')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {review?.reviewer_name ?? 'Anonymous'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review?.star_rating ?? 1} size="sm" />
              <span className="text-xs text-gray-400">
                {formatRelativeDate(review?.review_date ?? null)}
              </span>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCE_STYLES[dispute.confidence]}`}>
          {dispute.confidence} confidence
        </span>
      </div>

      {/* Review text */}
      {review?.review_text && (
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {review.review_text}
        </p>
      )}

      {/* Violation badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(dispute.violations ?? []).map((v) => (
          <span
            key={v}
            className={`px-2 py-0.5 rounded text-xs font-medium ${VIOLATION_COLORS[v] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {VIOLATION_LABELS[v] ?? v}
          </span>
        ))}
      </div>

      {/* AI reasoning */}
      <p className="text-sm text-gray-500 italic mb-3">
        {dispute.ai_analysis ?? dispute.reason}
      </p>

      {/* Status tracker */}
      {dispute.status !== 'dismissed' && (
        <div className="flex items-center gap-1 mb-4">
          {STATUS_FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  i <= currentStep ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              />
              {i < STATUS_FLOW.length - 1 && (
                <div className={`w-6 h-0.5 ${i < currentStep ? 'bg-gray-900' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-gray-400 capitalize">
            {dispute.status.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Expandable dispute text */}
      {dispute.suggested_dispute_text && (
        <div className="mb-3">
          <button
            onClick={() => setShowDisputeText(!showDisputeText)}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showDisputeText ? 'Hide' : 'Show'} suggested dispute text
          </button>
          {showDisputeText && (
            <div className="mt-2 bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {dispute.suggested_dispute_text}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(dispute.suggested_dispute_text ?? '')}
                className="mt-2 text-xs text-gray-500 hover:text-gray-900"
              >
                Copy to clipboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {dispute.status === 'detected' && (
          <>
            <Button
              size="sm"
              onClick={() => {
                handleStatusChange('submitted')
                setShowInstructions(true)
              }}
              disabled={loading !== null}
            >
              {loading === 'submitted' ? 'Filing...' : 'File Dispute'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStatusChange('dismissed')}
              disabled={loading !== null}
            >
              Dismiss
            </Button>
          </>
        )}
        {dispute.status === 'submitted' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleStatusChange('under_review')}
            disabled={loading !== null}
          >
            Mark as Under Review
          </Button>
        )}
        {dispute.status === 'under_review' && (
          <>
            <Button
              size="sm"
              onClick={() => handleStatusChange('removed')}
              disabled={loading !== null}
            >
              Removed
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange('denied')}
              disabled={loading !== null}
            >
              Denied
            </Button>
          </>
        )}
        {dispute.status === 'dismissed' && (
          <span className="text-xs text-gray-400">Dismissed</span>
        )}
        {(dispute.status === 'removed' || dispute.status === 'denied') && (
          <span className="text-xs text-gray-400 capitalize">
            {dispute.status} {dispute.resolved_at ? `· ${formatRelativeDate(dispute.resolved_at)}` : ''}
          </span>
        )}
      </div>

      {/* Filing instructions modal */}
      {showInstructions && dispute.status === 'submitted' && (
        <div className="mt-4 bg-blue-50 rounded-md p-4 border border-blue-100">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            How to report this review to Google
          </h4>
          <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
            <li>Open Google Maps and find your business listing</li>
            <li>Find the review from {review?.reviewer_name ?? 'this reviewer'}</li>
            <li>Click the three-dot menu and select &ldquo;Report review&rdquo;</li>
            <li>Select the appropriate violation type and paste the dispute text above</li>
          </ol>
          <button
            onClick={() => setShowInstructions(false)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800"
          >
            Got it, close
          </button>
        </div>
      )}
    </div>
  )
}

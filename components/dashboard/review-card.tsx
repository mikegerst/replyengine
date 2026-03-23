'use client'

import { useState } from 'react'
import type { Review } from '@/lib/types/database'
import { StarRating } from '@/components/dashboard/star-rating'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { Button } from '@/components/ui/button'
import { formatRelativeDate } from '@/lib/utils/format'

interface ReviewCardProps {
  review: Review
  onUpdate: (updated: Review) => void
}

export function ReviewCard({ review, onUpdate }: ReviewCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editedText, setEditedText] = useState(
    review.edited_response ?? review.ai_response ?? ''
  )

  async function handleGenerate() {
    setLoading('generate')
    try {
      const res = await fetch(`/api/reviews/${review.id}/generate`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.data) {
        onUpdate(json.data)
        setEditedText(json.data.ai_response ?? '')
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleStatusChange(
    status: Review['response_status'],
    editedResponse?: string
  ) {
    setLoading(status)
    try {
      const body: Record<string, unknown> = { status }
      if (editedResponse !== undefined) {
        body.edited_response = editedResponse
      }
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.data) {
        onUpdate(json.data)
        setEditing(false)
      }
    } finally {
      setLoading(null)
    }
  }

  const displayResponse = review.edited_response ?? review.ai_response

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-600">
              {(review.reviewer_name ?? 'A')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {review.reviewer_name ?? 'Anonymous'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.star_rating} size="sm" />
              <span className="text-xs text-gray-400">
                {formatRelativeDate(review.review_date)}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={review.response_status} />
      </div>

      {/* Review text */}
      {review.review_text && (
        <p className="mt-3 text-sm text-gray-700 leading-relaxed">
          {review.review_text}
        </p>
      )}

      {/* Topics */}
      {review.key_topics && review.key_topics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.key_topics.map((topic) => (
            <span
              key={topic}
              className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* AI Response */}
      {displayResponse && !editing && (
        <div className="mt-4 bg-gray-50 rounded-md p-3">
          <p className="text-xs font-medium text-gray-400 mb-1">AI Response</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayResponse}
          </p>
        </div>
      )}

      {/* Editing textarea */}
      {editing && (
        <div className="mt-4">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {review.response_status === 'pending' && (
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={loading !== null}
          >
            {loading === 'generate' ? 'Generating...' : 'Generate Response'}
          </Button>
        )}

        {review.response_status === 'draft' && !editing && (
          <>
            <Button
              size="sm"
              onClick={() => handleStatusChange('approved')}
              disabled={loading !== null}
            >
              {loading === 'approved' ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditedText(displayResponse ?? '')
                setEditing(true)
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerate}
              disabled={loading !== null}
            >
              {loading === 'generate' ? 'Regenerating...' : 'Regenerate'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStatusChange('skipped')}
              disabled={loading !== null}
            >
              Skip
            </Button>
          </>
        )}

        {review.response_status === 'draft' && editing && (
          <>
            <Button
              size="sm"
              onClick={() => handleStatusChange('approved', editedText)}
              disabled={loading !== null}
            >
              {loading === 'approved' ? 'Saving...' : 'Save & Approve'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </>
        )}

        {review.response_status === 'approved' && (
          <>
            <Button size="sm" disabled title="Google API integration coming soon">
              Post to Google
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange('draft')}
              disabled={loading !== null}
            >
              Back to Draft
            </Button>
          </>
        )}

        {review.response_status === 'posted' && (
          <span className="text-xs text-gray-400">
            Posted {formatRelativeDate(review.posted_at)}
          </span>
        )}

        {review.response_status === 'skipped' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleGenerate}
            disabled={loading !== null}
          >
            {loading === 'generate' ? 'Generating...' : 'Generate Response'}
          </Button>
        )}
      </div>
    </div>
  )
}

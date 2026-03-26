'use client'

import { useState } from 'react'
import type { RecoveryOutreachWithReview } from '@/lib/types/database'
import { StarRating } from '@/components/dashboard/star-rating'
import { Button } from '@/components/ui/button'
import { formatRelativeDate } from '@/lib/utils/format'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-gray-100 text-gray-500',
  sent: 'bg-blue-100 text-blue-800',
  responded: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-400',
  skipped: 'bg-red-100 text-red-600',
}

const TIMELINE_STEPS = ['draft', 'sent', 'responded', 'resolved'] as const

interface RecoveryCardProps {
  outreach: RecoveryOutreachWithReview
  onUpdate: (updated: RecoveryOutreachWithReview) => void
}

export function RecoveryCard({ outreach, onUpdate }: RecoveryCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState(outreach.message_draft ?? '')
  const [notes, setNotes] = useState(outreach.notes ?? '')
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const review = outreach.reviews

  async function handleStatusChange(status: string, extraData?: Record<string, unknown>) {
    setLoading(status)
    try {
      const res = await fetch(`/api/recovery/${outreach.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraData }),
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

  async function handleSaveEdit() {
    setLoading('save')
    try {
      const res = await fetch(`/api/recovery/${outreach.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_draft: editedMessage }),
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

  async function handleCopy() {
    await navigator.clipboard.writeText(outreach.message_draft ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSend() {
    setLoading('send')
    setToast(null)
    try {
      const res = await fetch(`/api/recovery/${outreach.id}/send`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setToast({ type: 'error', message: json.error ?? 'Failed to send' })
        return
      }
      if (json.data) {
        onUpdate(json.data)
        setToast({ type: 'success', message: `Message sent via ${outreach.outreach_type}` })
        setTimeout(() => setToast(null), 4000)
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to send message' })
    } finally {
      setLoading(null)
    }
  }

  const currentStep = TIMELINE_STEPS.indexOf(outreach.status as typeof TIMELINE_STEPS[number])

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
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[outreach.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {outreach.status}
        </span>
      </div>

      {/* Review text */}
      {review?.review_text && (
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {review.review_text}
        </p>
      )}

      {/* Public response if exists */}
      {review?.ai_response && (
        <div className="bg-gray-50 rounded-md p-3 mb-3">
          <p className="text-xs font-medium text-gray-400 mb-1">Public response</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {review.edited_response ?? review.ai_response}
          </p>
        </div>
      )}

      {/* Timeline */}
      {outreach.status !== 'dismissed' && (
        <div className="flex items-center gap-1 mb-4">
          {TIMELINE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${i <= currentStep ? 'bg-gray-900' : 'bg-gray-200'}`} />
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`w-6 h-0.5 ${i < currentStep ? 'bg-gray-900' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-gray-400 capitalize">{outreach.status}</span>
        </div>
      )}

      {/* Recovery message */}
      {outreach.message_draft && !editing && (
        <div className="bg-blue-50 rounded-md p-3 mb-3 border border-blue-100">
          <p className="text-xs font-medium text-blue-400 mb-1">Recovery message</p>
          <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
            {outreach.message_draft}
          </p>
          {outreach.suggested_resolution && (
            <p className="mt-2 text-xs text-blue-600">
              Resolution: {outreach.suggested_resolution}
            </p>
          )}
        </div>
      )}

      {/* Editing */}
      {editing && (
        <div className="mb-3">
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
          />
        </div>
      )}

      {/* Resolution notes */}
      {outreach.status === 'resolved' && outreach.notes && (
        <div className="bg-green-50 rounded-md p-3 mb-3">
          <p className="text-xs font-medium text-green-600 mb-1">Resolution notes</p>
          <p className="text-sm text-green-800">{outreach.notes}</p>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`rounded-md px-3 py-2 mb-3 text-sm ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {outreach.status === 'draft' && !editing && (
          <>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={loading !== null}
            >
              {loading === 'send' ? 'Sending...' : `Send via ${outreach.outreach_type === 'sms' ? 'SMS' : 'Email'}`}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Message'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditedMessage(outreach.message_draft ?? '')
                setEditing(true)
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStatusChange('sent')}
              disabled={loading !== null}
            >
              {loading === 'sent' ? 'Updating...' : 'Mark as Sent'}
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

        {outreach.status === 'draft' && editing && (
          <>
            <Button size="sm" onClick={handleSaveEdit} disabled={loading !== null}>
              {loading === 'save' ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        )}

        {outreach.status === 'sent' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange('responded')}
              disabled={loading !== null}
            >
              Customer Responded
            </Button>
          </>
        )}

        {outreach.status === 'responded' && (
          <div className="w-full space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Resolution notes (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
            />
            <Button
              size="sm"
              onClick={() => handleStatusChange('resolved', { notes })}
              disabled={loading !== null}
            >
              {loading === 'resolved' ? 'Resolving...' : 'Mark as Resolved'}
            </Button>
          </div>
        )}

        {outreach.status === 'dismissed' && (
          <span className="text-xs text-gray-400">Dismissed</span>
        )}
      </div>
    </div>
  )
}

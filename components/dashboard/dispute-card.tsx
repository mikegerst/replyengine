'use client'

import { useState } from 'react'
import type { ReviewDisputeWithReview } from '@/lib/types/database'
import { StarRating } from '@/components/dashboard/star-rating'
import { Button } from '@/components/ui/button'
import { DisputeFileButton } from '@/components/dashboard/dispute-file-button'
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

const GOOGLE_FLAG_CATEGORIES: Record<string, string> = {
  SPAM_FAKE: 'Spam',
  OFFENSIVE: 'Harassment or bullying',
  CONFLICT_OF_INTEREST: 'Conflict of interest',
  OFF_TOPIC: 'Off topic',
  RESTRICTED_CONTENT: 'Personal information',
}

const CONFIDENCE_STYLES = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

const STEP_LABELS = ['Detection', 'Flag', 'Appeal', 'Resolution']
const STEP_STATUSES = [
  ['detected'],
  ['flagged'],
  ['appeal_ready', 'submitted', 'under_review'],
  ['removed', 'denied', 'escalated'],
] as const

interface DisputeCardProps {
  dispute: ReviewDisputeWithReview
  onUpdate: (updated: ReviewDisputeWithReview) => void
  ratingImpact?: { currentRating: number; projectedRating: number; ratingChange: number; estimatedRevenueImpact: { low: number; high: number } } | null
}

export function DisputeCard({ dispute, onUpdate, ratingImpact }: DisputeCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [appealText, setAppealText] = useState(dispute.appeal_text ?? '')
  const [caseId, setCaseId] = useState(dispute.google_case_id ?? '')
  const [escalationNotes, setEscalationNotes] = useState('')

  const review = dispute.reviews

  async function handleUpdate(data: Record<string, unknown>) {
    const statusKey = (data.status as string) ?? 'update'
    setLoading(statusKey)
    try {
      const res = await fetch(`/api/disputes/${dispute.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.data) onUpdate(json.data)
    } finally {
      setLoading(null)
    }
  }

  async function handleGenerateAppeal() {
    setLoading('appeal')
    try {
      const res = await fetch(`/api/disputes/${dispute.id}/appeal`, { method: 'POST' })
      const json = await res.json()
      if (json.data) {
        onUpdate(json.data)
        setAppealText(json.data.appeal_text ?? '')
      }
    } finally {
      setLoading(null)
    }
  }

  const currentStepIdx = STEP_STATUSES.findIndex((statuses) =>
    (statuses as readonly string[]).includes(dispute.status)
  )

  const daysSinceFlagged = dispute.flagged_at
    ? Math.floor((Date.now() - new Date(dispute.flagged_at).getTime()) / 86400000)
    : 0
  const appealAvailable = daysSinceFlagged >= 3

  const primaryViolation = (dispute.violations ?? [])[0] ?? ''
  const googleCategory = GOOGLE_FLAG_CATEGORIES[primaryViolation] ?? 'Spam'

  if (dispute.status === 'dismissed') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 opacity-60">
        <ReviewHeader review={review} dispute={dispute} />
        <p className="text-xs text-gray-400 mt-2">Dismissed</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <ReviewHeader review={review} dispute={dispute} />

      {/* Review text */}
      {review?.review_text && (
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {review.review_text}
        </p>
      )}

      {/* Violation badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(dispute.violations ?? []).map((v) => (
          <span key={v} className={`px-2 py-0.5 rounded text-xs font-medium ${VIOLATION_COLORS[v] ?? 'bg-gray-100 text-gray-600'}`}>
            {VIOLATION_LABELS[v] ?? v}
          </span>
        ))}
      </div>

      {/* Rating impact */}
      {ratingImpact && ratingImpact.ratingChange > 0 && (
        <div className="bg-green-50 rounded-md px-3 py-2 mb-3 text-sm">
          <span className="text-green-800">If removed: </span>
          <span className="font-medium text-green-900">
            {ratingImpact.currentRating} → {ratingImpact.projectedRating} (+{ratingImpact.ratingChange})
          </span>
          <span className="text-green-700 ml-2">
            Est. +${(ratingImpact.estimatedRevenueImpact.low / 1000).toFixed(0)}K–${(ratingImpact.estimatedRevenueImpact.high / 1000).toFixed(0)}K/yr
          </span>
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center gap-0 mb-4 overflow-x-auto">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                i < currentStepIdx ? 'bg-green-500 text-white'
                  : i === currentStepIdx ? 'bg-gray-900 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {i < currentStepIdx ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (i + 1)}
              </div>
              <span className={`text-[10px] mt-0.5 whitespace-nowrap ${i === currentStepIdx ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-1 mt-[-12px] ${i < currentStepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ===== STEP 1: DETECTED — Ready to File summary ===== */}
      {dispute.status === 'detected' && (
        <div className="border-t border-gray-100 pt-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ready to File</p>
            <div className="space-y-1 text-sm text-gray-700 mb-4">
              <p>Review by: <strong>{review?.reviewer_name ?? 'Anonymous'}</strong></p>
              <p>Policy violated: <strong>{(dispute.violations ?? []).map((v) => VIOLATION_LABELS[v]).join(', ')}</strong></p>
              <p>Google category: <strong>&ldquo;{googleCategory}&rdquo;</strong></p>
            </div>
            <DisputeFileButton
              textToCopy={dispute.suggested_dispute_text ?? ''}
              label="File Dispute — text will be copied"
              confirmPrompt={`Did you submit the dispute for ${review?.reviewer_name ?? 'this reviewer'}'s review?`}
              onConfirm={() => handleUpdate({ status: 'flagged' })}
              onTrouble={() => setShowGuide(true)}
            />
          </div>

          {/* Collapsible guide */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showGuide ? 'Hide' : 'Need help? View'} step-by-step guide
          </button>

          {showGuide && (
            <div className="mt-3 bg-blue-50 rounded-md p-4 border border-blue-100">
              <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                <li>Open Google Maps and search for your business</li>
                <li>Find your Business Profile and go to reviews</li>
                <li>Locate the review from <strong>{review?.reviewer_name ?? 'the reviewer'}</strong></li>
                <li>Click the three dots (&#8942;) next to the review</li>
                <li>Select &ldquo;Flag as inappropriate&rdquo;</li>
                <li>Choose: <strong>&ldquo;{googleCategory}&rdquo;</strong></li>
                <li>Paste the dispute text (already copied to your clipboard)</li>
              </ol>
            </div>
          )}

          <div className="mt-3">
            <Button size="sm" variant="ghost" onClick={() => handleUpdate({ status: 'dismissed' })} disabled={loading !== null}>
              Dismiss
            </Button>
          </div>

          <p className="text-[10px] text-gray-300 mt-3">
            Google doesn&apos;t offer an API for dispute filing, so we open their tool directly and copy your dispute text to make the process as fast as possible.
          </p>
        </div>
      )}

      {/* ===== STEP 2: FLAGGED — waiting for appeal ===== */}
      {dispute.status === 'flagged' && (
        <div className="border-t border-gray-100 pt-4">
          <div className="bg-yellow-50 rounded-md p-3 mb-4 border border-yellow-100">
            <p className="text-sm text-yellow-800">
              Google typically responds within 24–72 hours. You can submit an appeal after 3 days.
            </p>
          </div>

          {!appealAvailable ? (
            <p className="text-sm text-gray-500 mb-4">
              Appeal available in <strong>{3 - daysSinceFlagged} day{3 - daysSinceFlagged !== 1 ? 's' : ''}</strong>
            </p>
          ) : (
            <div className="bg-green-50 rounded-md p-3 mb-4 border border-green-200">
              <p className="text-sm font-medium text-green-800">Appeal available now!</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {appealAvailable && (
              <Button size="sm" onClick={() => handleUpdate({ status: 'appeal_ready' })} disabled={loading !== null}>
                Proceed to Appeal
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => handleUpdate({ status: 'dismissed' })} disabled={loading !== null}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: APPEAL ===== */}
      {dispute.status === 'appeal_ready' && (
        <div className="border-t border-gray-100 pt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Appeal Ready</p>
            <p className="text-xs text-gray-400 mb-3">{daysSinceFlagged} days since flagged</p>

            <div className="bg-amber-50 rounded-md p-2.5 mb-4 border border-amber-200">
              <p className="text-sm font-semibold text-amber-900">You get ONE appeal — review the text below before submitting</p>
            </div>

            {/* Generate or show appeal */}
            {!appealText ? (
              <Button size="sm" onClick={handleGenerateAppeal} disabled={loading !== null} className="mb-3">
                {loading === 'appeal' ? 'Generating appeal...' : 'Generate Appeal Text'}
              </Button>
            ) : (
              <>
                <textarea
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y mb-3"
                />

                <DisputeFileButton
                  textToCopy={appealText}
                  label="Submit Appeal — text will be copied"
                  confirmPrompt={`Did you submit the appeal for ${review?.reviewer_name ?? 'this reviewer'}'s review?`}
                  onConfirm={() => handleUpdate({ status: 'submitted', appeal_text: appealText })}
                  onTrouble={() => setShowGuide(true)}
                />

                {/* Case ID prompt shows after confirm */}
                <div className="mt-4">
                  <label htmlFor={`case-${dispute.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Google Case ID <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={`case-${dispute.id}`}
                      type="text"
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      placeholder="e.g. 1-2345678901234"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    {caseId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdate({ google_case_id: caseId })}
                        disabled={loading !== null}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={handleGenerateAppeal} disabled={loading !== null}>
                    {loading === 'appeal' ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Collapsible appeal guide */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showGuide ? 'Hide' : 'Need help? View'} appeal guide
          </button>

          {showGuide && (
            <div className="mt-3 bg-blue-50 rounded-md p-4 border border-blue-100">
              <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                <li>Go to the <a href="https://business.google.com/reviews" target="_blank" rel="noopener noreferrer" className="underline">Google Reviews Management Tool</a></li>
                <li>Select &ldquo;Check status of a review I reported&rdquo;</li>
                <li>Click &ldquo;Appeal eligible reviews&rdquo;</li>
                <li>Select this review and click Continue</li>
                <li>Paste your appeal text (already copied)</li>
                <li>Click Submit and save your Case ID</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Submitted / Under Review */}
      {(dispute.status === 'submitted' || dispute.status === 'under_review') && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600 mb-1">
            Appeal submitted{dispute.appeal_submitted_at ? ` ${formatRelativeDate(dispute.appeal_submitted_at)}` : ''}.
          </p>
          {dispute.google_case_id && (
            <p className="text-xs text-gray-400 mb-3">Case ID: {dispute.google_case_id}</p>
          )}
          <p className="text-sm text-gray-500 mb-4">Waiting for Google&apos;s response (5–10 business days).</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => handleUpdate({ status: 'removed' })} disabled={loading !== null}>
              Review Removed
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleUpdate({ status: 'denied' })} disabled={loading !== null}>
              Appeal Denied
            </Button>
          </div>
        </div>
      )}

      {/* ===== STEP 4: RESOLUTION ===== */}
      {dispute.status === 'removed' && (
        <div className="border-t border-gray-100 pt-4">
          <div className="bg-green-50 rounded-md p-3">
            <p className="text-sm font-medium text-green-800">Review successfully removed!</p>
            {dispute.resolved_at && (
              <p className="text-xs text-green-600 mt-0.5">Resolved {formatRelativeDate(dispute.resolved_at)}</p>
            )}
          </div>
        </div>
      )}

      {dispute.status === 'denied' && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Appeal denied — but you still have options:</p>

          <div className="bg-gray-50 rounded-md p-3 mb-3">
            <h5 className="text-sm font-medium text-gray-900">Community Forum</h5>
            <p className="text-xs text-gray-500 mt-1">Product Experts can escalate cases to Google.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href="https://support.google.com/business/community" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                Open Forum →
              </a>
              <Button size="sm" variant="secondary" onClick={() => handleUpdate({ status: 'escalated', escalation_type: 'forum', escalation_notes: escalationNotes || 'Posted to forum' })} disabled={loading !== null}>
                I&apos;ve Posted
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-md p-3 mb-3">
            <h5 className="text-sm font-medium text-gray-900">Google Support</h5>
            <p className="text-xs text-gray-500 mt-1">For coordinated review attacks — Google can block new reviews.</p>
            <Button size="sm" variant="secondary" className="mt-2" onClick={() => handleUpdate({ status: 'escalated', escalation_type: 'support', escalation_notes: escalationNotes || 'Contacted support' })} disabled={loading !== null}>
              I&apos;ve Contacted Support
            </Button>
          </div>

          <div className="bg-gray-50 rounded-md p-3 mb-3">
            <h5 className="text-sm font-medium text-gray-900">Legal (defamatory content)</h5>
            <p className="text-xs text-gray-500 mt-1">A court order can compel Google to remove defamatory reviews.</p>
            <p className="text-[10px] text-gray-400 italic">ReplyEngine does not provide legal advice.</p>
          </div>

          <textarea value={escalationNotes} onChange={(e) => setEscalationNotes(e.target.value)} rows={2} placeholder="Notes (optional)..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y mb-3" />
          <Button size="sm" variant="ghost" onClick={() => handleUpdate({ status: 'dismissed' })} disabled={loading !== null}>Close dispute</Button>
        </div>
      )}

      {dispute.status === 'escalated' && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600">
            Escalated via <span className="font-medium capitalize">{dispute.escalation_type ?? 'unknown'}</span>
            {dispute.escalation_notes && <span className="text-gray-400"> — {dispute.escalation_notes}</span>}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" onClick={() => handleUpdate({ status: 'removed' })} disabled={loading !== null}>Review Removed</Button>
            <Button size="sm" variant="ghost" onClick={() => handleUpdate({ status: 'dismissed' })} disabled={loading !== null}>Close dispute</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewHeader({ review, dispute }: { review: ReviewDisputeWithReview['reviews']; dispute: ReviewDisputeWithReview }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-gray-600">
            {(review?.reviewer_name ?? 'A')[0].toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{review?.reviewer_name ?? 'Anonymous'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review?.star_rating ?? 1} size="sm" />
            <span className="text-xs text-gray-400">{formatRelativeDate(review?.review_date ?? null)}</span>
          </div>
        </div>
      </div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCE_STYLES[dispute.confidence]}`}>
        {dispute.confidence}
      </span>
    </div>
  )
}

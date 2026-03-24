'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  Review,
  ReviewDisputeWithReview,
  RecoveryOutreachWithReview,
} from '@/lib/types/database'
import { buildApiUrl } from '@/lib/utils/selected-business'
import { calculateRatingImpact, formatRevenue } from '@/lib/utils/rating-impact'
import { DisputeCard } from '@/components/dashboard/dispute-card'
import { RecoveryCard } from '@/components/dashboard/recovery-card'
import { StarRating } from '@/components/dashboard/star-rating'
import { Button } from '@/components/ui/button'
import { formatRelativeDate } from '@/lib/utils/format'

type Tab = 'shield' | 'recover'

export default function RecoveryPage() {
  const [tab, setTab] = useState<Tab>('shield')
  const [disputes, setDisputes] = useState<ReviewDisputeWithReview[]>([])
  const [outreach, setOutreach] = useState<RecoveryOutreachWithReview[]>([])
  const [negativeReviews, setNegativeReviews] = useState<Review[]>([])
  const [allReviews, setAllReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [disputeRes, recoveryRes, reviewsRes, allReviewsRes] = await Promise.all([
        fetch(buildApiUrl('/api/disputes')),
        fetch(buildApiUrl('/api/recovery')),
        fetch(buildApiUrl('/api/reviews', { star_rating: '1', per_page: '50' })),
        fetch(buildApiUrl('/api/reviews', { per_page: '100' })),
      ])

      const [disputeJson, recoveryJson, reviewsJson, allReviewsJson] = await Promise.all([
        disputeRes.json(),
        recoveryRes.json(),
        reviewsRes.json(),
        allReviewsRes.json(),
      ])

      setDisputes(disputeJson.data ?? [])
      setOutreach(recoveryJson.data ?? [])
      setAllReviews(allReviewsJson.data ?? [])

      // Also fetch 2-star reviews
      const reviews2Res = await fetch(buildApiUrl('/api/reviews', { star_rating: '2', per_page: '50' }))
      const reviews2Json = await reviews2Res.json()

      const allNegative = [
        ...(reviewsJson.data ?? []),
        ...(reviews2Json.data ?? []),
      ].sort((a: Review, b: Review) =>
        (b.review_date ?? '').localeCompare(a.review_date ?? '')
      )

      setNegativeReviews(allNegative)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Stats
  const activeDisputes = disputes.filter((d) => d.status !== 'dismissed')
  const filedDisputes = disputes.filter((d) =>
    ['submitted', 'under_review', 'removed', 'denied', 'escalated'].includes(d.status)
  )
  const removedDisputes = disputes.filter((d) => d.status === 'removed')

  const sentOutreach = outreach.filter((o) =>
    ['sent', 'responded', 'resolved'].includes(o.status)
  )
  const resolvedOutreach = outreach.filter((o) => o.status === 'resolved')

  // Negative reviews without outreach
  const outreachReviewIds = new Set(outreach.map((o) => o.review_id))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recovery</h1>
        <p className="mt-1 text-sm text-gray-500">
          Detect fake reviews and recover unhappy customers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('shield')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'shield'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Shield — Disputes
          {activeDisputes.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">
              {activeDisputes.filter((d) => d.status === 'detected').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('recover')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'recover'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Recover — Outreach
          {negativeReviews.filter((r) => !outreachReviewIds.has(r.id)).length > 0 && (
            <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">
              {negativeReviews.filter((r) => !outreachReviewIds.has(r.id)).length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : tab === 'shield' ? (
        <ShieldTab
          disputes={disputes}
          allReviews={allReviews}
          activeCount={activeDisputes.length}
          filedCount={filedDisputes.length}
          removedCount={removedDisputes.length}
          onUpdate={(updated) =>
            setDisputes((prev) =>
              prev.map((d) => (d.id === updated.id ? updated : d))
            )
          }
        />
      ) : (
        <RecoverTab
          outreach={outreach}
          negativeReviews={negativeReviews}
          outreachReviewIds={outreachReviewIds}
          sentCount={sentOutreach.length}
          resolvedCount={resolvedOutreach.length}
          onOutreachUpdate={(updated) =>
            setOutreach((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            )
          }
          onOutreachCreated={(created) => setOutreach((prev) => [created, ...prev])}
        />
      )}
    </div>
  )
}

// ===================== SHIELD TAB =====================

function ShieldTab({
  disputes,
  allReviews,
  activeCount,
  filedCount,
  removedCount,
  onUpdate,
}: {
  disputes: ReviewDisputeWithReview[]
  allReviews: Review[]
  activeCount: number
  filedCount: number
  removedCount: number
  onUpdate: (updated: ReviewDisputeWithReview) => void
}) {
  const active = disputes.filter((d) => d.status !== 'dismissed')

  // Aggregate rating impact if all flagged reviews removed
  const flaggedReviewIds = active.map((d) => d.review_id)
  const reviewsForCalc = allReviews.map((r) => ({ star_rating: r.star_rating, id: r.id }))
  const aggregateImpact = flaggedReviewIds.length > 0
    ? calculateRatingImpact(reviewsForCalc, flaggedReviewIds)
    : null

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{activeCount}</p>
          <p className="text-xs text-gray-500">Detected</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{filedCount}</p>
          <p className="text-xs text-gray-500">Appealed</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-semibold text-green-600">{removedCount}</p>
          <p className="text-xs text-gray-500">Removed</p>
        </div>
        {aggregateImpact && aggregateImpact.ratingChange > 0 && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
            <p className="text-2xl font-semibold text-green-700">+{aggregateImpact.ratingChange}</p>
            <p className="text-xs text-green-600">Rating if all removed</p>
            <p className="text-[10px] text-green-500 mt-0.5">
              {formatRevenue(aggregateImpact.estimatedRevenueImpact.low)}–{formatRevenue(aggregateImpact.estimatedRevenueImpact.high)}/yr
            </p>
          </div>
        )}
      </div>

      {active.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-gray-500 text-sm">
            No suspicious reviews detected.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            We automatically scan every new review for policy violations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((dispute) => {
            const impact = reviewsForCalc.length > 0
              ? calculateRatingImpact(reviewsForCalc, [dispute.review_id])
              : null
            return (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                onUpdate={onUpdate}
                ratingImpact={impact}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===================== RECOVER TAB =====================

function RecoverTab({
  outreach,
  negativeReviews,
  outreachReviewIds,
  sentCount,
  resolvedCount,
  onOutreachUpdate,
  onOutreachCreated,
}: {
  outreach: RecoveryOutreachWithReview[]
  negativeReviews: Review[]
  outreachReviewIds: Set<string>
  sentCount: number
  resolvedCount: number
  onOutreachUpdate: (updated: RecoveryOutreachWithReview) => void
  onOutreachCreated: (created: RecoveryOutreachWithReview) => void
}) {
  const withoutOutreach = negativeReviews.filter((r) => !outreachReviewIds.has(r.id))

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{negativeReviews.length}</p>
          <p className="text-xs text-gray-500">Negative reviews</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{sentCount}</p>
          <p className="text-xs text-gray-500">Outreach sent</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-semibold text-green-600">{resolvedCount}</p>
          <p className="text-xs text-gray-500">Recovered</p>
        </div>
      </div>

      {/* Existing outreach */}
      {outreach.length > 0 && (
        <div className="space-y-4 mb-8">
          {outreach
            .filter((o) => o.status !== 'dismissed')
            .map((o) => (
              <RecoveryCard key={o.id} outreach={o} onUpdate={onOutreachUpdate} />
            ))}
        </div>
      )}

      {/* Reviews without outreach */}
      {withoutOutreach.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Reviews needing outreach
          </h3>
          <div className="space-y-3">
            {withoutOutreach.map((review) => (
              <NegativeReviewRow
                key={review.id}
                review={review}
                onGenerated={onOutreachCreated}
              />
            ))}
          </div>
        </div>
      )}

      {negativeReviews.length === 0 && outreach.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-gray-500 text-sm">
            No negative reviews to recover. That&apos;s great news!
          </p>
        </div>
      )}
    </div>
  )
}

// Row for a negative review that doesn't have outreach yet
function NegativeReviewRow({
  review,
  onGenerated,
}: {
  review: Review
  onGenerated: (created: RecoveryOutreachWithReview) => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: review.id }),
      })
      const json = await res.json()
      if (json.data) onGenerated(json.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 truncate">
            {review.reviewer_name ?? 'Anonymous'}
          </span>
          <StarRating rating={review.star_rating} size="sm" />
          <span className="text-xs text-gray-400">
            {formatRelativeDate(review.review_date)}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">
          {review.review_text ?? '(No text)'}
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleGenerate}
        disabled={loading}
        className="flex-shrink-0"
      >
        {loading ? 'Generating...' : 'Generate Recovery'}
      </Button>
    </div>
  )
}

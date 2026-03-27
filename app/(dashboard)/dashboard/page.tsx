'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buildApiUrl, getSelectedBusinessId } from '@/lib/utils/selected-business'
import type { DashboardStats, Review, FairnessScoreResult } from '@/lib/types/database'
import { StatCard } from '@/components/dashboard/stat-card'
import { ReviewCard } from '@/components/dashboard/review-card'
import Link from 'next/link'

export default function OverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentReviews, setRecentReviews] = useState<Review[]>([])
  const [fairness, setFairness] = useState<FairnessScoreResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [locationBreakdown, setLocationBreakdown] = useState<Array<{ id: string; name: string; avgRating: number; pending: number }>>([])
  const [isAllLocations, setIsAllLocations] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Check if user has a business
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name')
        .order('created_at', { ascending: true })

      if (!businesses || businesses.length === 0) {
        router.push('/dashboard/onboarding')
        return
      }

      // Use selected business or first one
      const selectedId = getSelectedBusinessId()
      const allMode = selectedId === 'all' && businesses.length > 1
      setIsAllLocations(allMode)

      if (allMode) {
        setBusinessName('All Locations')

        // Build location breakdown
        const breakdownPromises = businesses.map(async (b) => {
          const { data: revs } = await supabase
            .from('reviews')
            .select('star_rating, response_status')
            .eq('business_id', b.id)
          const reviews = revs ?? []
          const avg = reviews.length > 0
            ? Math.round((reviews.reduce((s, r) => s + r.star_rating, 0) / reviews.length) * 10) / 10
            : 0
          const pending = reviews.filter((r) => r.response_status === 'pending' || r.response_status === 'draft').length
          return { id: b.id, name: b.name, avgRating: avg, pending }
        })
        setLocationBreakdown(await Promise.all(breakdownPromises))
      } else {
        const biz = businesses.find((b) => b.id === selectedId) ?? businesses[0]
        setBusinessName(biz.name)
      }

      // Fetch stats, recent reviews, and fairness score in parallel
      const [statsRes, reviewsRes, fairnessRes] = await Promise.all([
        fetch(buildApiUrl('/api/dashboard/stats')),
        fetch(buildApiUrl('/api/reviews', { per_page: '5' })),
        fetch(buildApiUrl('/api/fairness-score')),
      ])

      const [statsJson, reviewsJson, fairnessJson] = await Promise.all([
        statsRes.json(),
        reviewsRes.json(),
        fairnessRes.json(),
      ])

      setStats(statsJson.data ?? null)
      setRecentReviews(reviewsJson.data ?? [])
      setFairness(fairnessJson.data ?? null)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-48 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  function handleReviewUpdate(updated: Review) {
    setRecentReviews((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        {businessName && (
          <p className="mt-1 text-sm text-gray-500">{businessName}</p>
        )}
      </div>

      {/* Fairness Score — centerpiece */}
      {fairness && fairness.googleRating > 0 && (
        <FairnessScoreCard fairness={fairness} />
      )}

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Reviews"
            value={stats.totalReviews}
          />
          <StatCard
            label="Pending Responses"
            value={stats.pendingResponses}
            sublabel="Need attention"
          />
          <StatCard
            label="Avg Rating"
            value={stats.avgRating > 0 ? `${stats.avgRating} / 5` : '—'}
          />
          <StatCard
            label="Response Rate"
            value={stats.responseRate > 0 ? `${stats.responseRate}%` : '—'}
            sublabel="Reviews responded to"
          />
        </div>
      )}

      {/* Location breakdown (all locations mode) */}
      {isAllLocations && locationBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Location Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium text-right">Avg Rating</th>
                  <th className="pb-2 font-medium text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {locationBreakdown.map((loc) => (
                  <tr key={loc.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 text-gray-900">{loc.name}</td>
                    <td className="py-2 text-right text-gray-600">
                      {loc.avgRating > 0 ? loc.avgRating : '\u2014'}
                    </td>
                    <td className="py-2 text-right">
                      {loc.pending > 0 ? (
                        <span className="text-amber-600 font-medium">{loc.pending}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent reviews */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h2>
        {recentReviews.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">
              No reviews yet. Once you connect your Google Business Profile,
              reviews will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onUpdate={handleReviewUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StarDisplay({ rating, label }: { rating: number; label: string }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.3

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg
              key={s}
              className={`w-4 h-4 ${
                s <= fullStars
                  ? 'text-yellow-400'
                  : s === fullStars + 1 && hasHalf
                    ? 'text-yellow-300'
                    : 'text-gray-200'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-xl font-bold text-gray-900">{rating}</span>
      </div>
    </div>
  )
}

function FairnessScoreCard({ fairness }: { fairness: FairnessScoreResult }) {
  const hasUnfairReviews = fairness.unfairReviewCount > 0
  const revenueFormatted = fairness.estimatedRevenueImpact.low > 0
    ? `+$${Math.round(fairness.estimatedRevenueImpact.low / 1000)}K–$${Math.round(fairness.estimatedRevenueImpact.high / 1000)}K/yr`
    : null

  return (
    <div className="bg-white rounded-xl border-2 border-gray-900 p-6 mb-8">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Your Ratings
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
        <StarDisplay rating={fairness.googleRating} label="Google Rating" />
        <StarDisplay rating={fairness.fairnessScore} label="Fairness Score" />
      </div>

      {hasUnfairReviews && (
        <>
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-sm font-medium text-gray-900 mb-2">
              {fairness.unfairReviewCount} review{fairness.unfairReviewCount !== 1 ? 's are' : ' is'} dragging your score down:
            </p>
            <div className="space-y-1 mb-3">
              {fairness.unfairReviews.slice(0, 5).map((r) => (
                <p key={r.id} className="text-sm text-gray-600">
                  <span className="text-yellow-500">{'★'.repeat(r.star_rating)}{'☆'.repeat(5 - r.star_rating)}</span>
                  {' '}&mdash; {r.reason}
                </p>
              ))}
            </div>

            {fairness.ratingGap > 0 && (
              <div className="bg-green-50 rounded-md p-3 mb-3">
                <p className="text-sm text-green-800">
                  <span className="font-medium">If removed:</span>{' '}
                  {fairness.googleRating} → {fairness.potentialRating} (+{fairness.ratingGap} stars)
                </p>
                {revenueFormatted && (
                  <p className="text-sm text-green-700 mt-0.5">
                    Est. revenue impact: {revenueFormatted}
                  </p>
                )}
              </div>
            )}

            {fairness.reviewsNeededToRecover > 0 && fairness.reviewsNeededToRecover < 1000 && (
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Recovery path without removal
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{fairness.reviewsNeededToRecover}</span> more 5-star reviews = {fairness.fairnessScore} rating
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              href="/dashboard/grow"
              className="text-sm bg-white text-gray-900 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Grow Reviews
            </Link>
          </div>
        </>
      )}

      {!hasUnfairReviews && (
        <p className="text-sm text-gray-500 mt-2">
          No unfair reviews detected. Your Google rating reflects your true score.
        </p>
      )}
    </div>
  )
}

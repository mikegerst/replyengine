'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DashboardStats, Review } from '@/lib/types/database'
import { StatCard } from '@/components/dashboard/stat-card'
import { ReviewCard } from '@/components/dashboard/review-card'

export default function OverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentReviews, setRecentReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Check if user has a business
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name')
        .limit(1)

      if (!businesses || businesses.length === 0) {
        router.push('/dashboard/onboarding')
        return
      }

      setBusinessName(businesses[0].name)

      // Fetch stats and recent reviews in parallel
      const [statsRes, reviewsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/reviews?per_page=5'),
      ])

      const [statsJson, reviewsJson] = await Promise.all([
        statsRes.json(),
        reviewsRes.json(),
      ])

      setStats(statsJson.data ?? null)
      setRecentReviews(reviewsJson.data ?? [])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
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

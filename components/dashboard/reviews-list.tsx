'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Review } from '@/lib/types/database'
import { ReviewCard } from '@/components/dashboard/review-card'
import { Button } from '@/components/ui/button'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'posted', label: 'Posted' },
  { value: 'skipped', label: 'Skipped' },
] as const

const RATING_OPTIONS = [
  { value: '', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
] as const

export function ReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')

  const perPage = 20

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (statusFilter) params.set('status', statusFilter)
    if (ratingFilter) params.set('star_rating', ratingFilter)

    try {
      const res = await fetch(`/api/reviews?${params}`)
      const json = await res.json()
      setReviews(json.data ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, ratingFilter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  function handleReviewUpdate(updated: Review) {
    setReviews((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    )
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => {
            setRatingFilter(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="flex items-center text-sm text-gray-400">
          {total} review{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Review cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse"
            >
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            {statusFilter || ratingFilter
              ? 'No reviews match your filters.'
              : 'No reviews yet. Reviews will appear here once synced from Google.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onUpdate={handleReviewUpdate}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

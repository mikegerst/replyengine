import type { Review, ReviewVelocity } from '@/lib/types/database'

/**
 * Calculate review velocity and safe solicitation rate.
 * Google's anti-manipulation AI flags businesses that suddenly get
 * many more reviews than their historical average. Safe solicitation
 * stays within 2-3x the organic rate.
 */
export function calculateSafeVelocity(
  reviews: Review[]
): ReviewVelocity {
  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Reviews in the last 3 months for normal velocity
  const recentReviews = reviews.filter((r) => {
    const date = new Date(r.review_date ?? r.created_at)
    return date >= threeMonthsAgo
  })

  // Reviews this month
  const thisMonthReviews = reviews.filter((r) => {
    const date = new Date(r.review_date ?? r.created_at)
    return date >= oneMonthAgo
  })

  // Calculate normal monthly velocity (3-month average)
  const monthsOfData = Math.max(1, Math.min(3, recentReviews.length > 0
    ? (now.getTime() - new Date(recentReviews[recentReviews.length - 1]?.review_date ?? recentReviews[recentReviews.length - 1]?.created_at ?? now.toISOString()).getTime()) / (30 * 24 * 60 * 60 * 1000)
    : 1
  ))

  const normalVelocity = Math.round(recentReviews.length / monthsOfData)
  const currentMonthCount = thisMonthReviews.length

  // Safe target: 2-3x normal rate, minimum 5
  const safeTarget = Math.max(5, Math.round(normalVelocity * 2.5))

  const remainingThisMonth = Math.max(0, safeTarget - currentMonthCount)

  let warning: string | null = null

  if (currentMonthCount >= safeTarget) {
    warning = 'You have reached your safe review solicitation limit for this month. Requesting more reviews may trigger Google\'s anti-manipulation filters.'
  } else if (currentMonthCount >= safeTarget * 0.8) {
    warning = 'You are approaching your safe review limit for this month. Consider slowing down solicitation.'
  }

  return {
    normalVelocity,
    safeTarget,
    currentMonthCount,
    remainingThisMonth,
    warning,
  }
}

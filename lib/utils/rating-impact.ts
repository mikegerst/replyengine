interface ReviewForCalc {
  star_rating: number
  id: string
}

interface RatingImpact {
  currentRating: number
  projectedRating: number
  ratingChange: number
  estimatedRevenueImpact: { low: number; high: number }
}

// Research: 0.1 star increase ≈ 1-3% revenue increase
// Conservative estimate: $500K annual revenue for small business
const BASE_ANNUAL_REVENUE = 500_000
const REVENUE_PER_TENTH_STAR_LOW = 0.01 * BASE_ANNUAL_REVENUE  // $5,000
const REVENUE_PER_TENTH_STAR_HIGH = 0.03 * BASE_ANNUAL_REVENUE // $15,000

export function calculateRatingImpact(
  reviews: ReviewForCalc[],
  reviewIdsToRemove: string[]
): RatingImpact {
  if (reviews.length === 0) {
    return { currentRating: 0, projectedRating: 0, ratingChange: 0, estimatedRevenueImpact: { low: 0, high: 0 } }
  }

  const removeSet = new Set(reviewIdsToRemove)

  const currentSum = reviews.reduce((sum, r) => sum + r.star_rating, 0)
  const currentRating = Math.round((currentSum / reviews.length) * 10) / 10

  const remaining = reviews.filter((r) => !removeSet.has(r.id))
  if (remaining.length === 0) {
    return { currentRating, projectedRating: 0, ratingChange: -currentRating, estimatedRevenueImpact: { low: 0, high: 0 } }
  }

  const projectedSum = remaining.reduce((sum, r) => sum + r.star_rating, 0)
  const projectedRating = Math.round((projectedSum / remaining.length) * 10) / 10

  const ratingChange = Math.round((projectedRating - currentRating) * 10) / 10
  const tenthStars = Math.abs(ratingChange) * 10

  return {
    currentRating,
    projectedRating,
    ratingChange,
    estimatedRevenueImpact: {
      low: Math.round(tenthStars * REVENUE_PER_TENTH_STAR_LOW),
      high: Math.round(tenthStars * REVENUE_PER_TENTH_STAR_HIGH),
    },
  }
}

export function formatRevenue(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`
  }
  return `$${amount.toLocaleString()}`
}

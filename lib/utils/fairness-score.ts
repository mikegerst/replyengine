import type { Review, ReviewDispute, FairnessScoreResult } from '@/lib/types/database'

// Revenue impact estimates per 0.1 star
const BASE_ANNUAL_REVENUE = 500_000
const REVENUE_PER_TENTH_STAR_LOW = 0.01 * BASE_ANNUAL_REVENUE  // $5,000
const REVENUE_PER_TENTH_STAR_HIGH = 0.03 * BASE_ANNUAL_REVENUE // $15,000

export function calculateFairnessScore(
  reviews: Review[],
  disputes: ReviewDispute[]
): FairnessScoreResult {
  if (reviews.length === 0) {
    return {
      googleRating: 0,
      fairnessScore: 0,
      unfairReviewCount: 0,
      unfairReviews: [],
      ratingGap: 0,
      potentialRating: 0,
      reviewsNeededToRecover: 0,
      estimatedRevenueImpact: { low: 0, high: 0 },
    }
  }

  // Google rating: simple average
  const totalStars = reviews.reduce((sum, r) => sum + r.star_rating, 0)
  const googleRating = round1(totalStars / reviews.length)

  // Identify unfair reviews
  const disputesByReviewId = new Map<string, ReviewDispute>()
  for (const d of disputes) {
    if (d.status !== 'dismissed') {
      disputesByReviewId.set(d.review_id, d)
    }
  }

  const unfairReviews: Array<{ id: string; star_rating: number; reason: string }> = []

  for (const review of reviews) {
    const dispute = disputesByReviewId.get(review.id)
    if (dispute) {
      const violationLabels: Record<string, string> = {
        SPAM_FAKE: 'Suspected spam',
        OFFENSIVE: 'Offensive content',
        CONFLICT_OF_INTEREST: 'Suspected competitor',
        OFF_TOPIC: 'Off-topic',
        RESTRICTED_CONTENT: 'Contains restricted content',
        WRONG_BUSINESS: 'Wrong business',
      }
      const primaryViolation = (dispute.violations ?? [])[0]
      const reason = primaryViolation ? (violationLabels[primaryViolation] ?? primaryViolation) : dispute.reason
      unfairReviews.push({ id: review.id, star_rating: review.star_rating, reason })
    }
  }

  // Fairness Score: average excluding unfair reviews, weighted by recency
  const unfairIds = new Set(unfairReviews.map((u) => u.id))
  const fairReviews = reviews.filter((r) => !unfairIds.has(r.id))

  const now = Date.now()
  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000
  const sixMonthsMs = 182 * 24 * 60 * 60 * 1000

  let weightedSum = 0
  let weightTotal = 0

  for (const review of fairReviews) {
    const reviewDate = new Date(review.review_date ?? review.created_at).getTime()
    const ageMs = now - reviewDate

    let weight: number
    if (ageMs < sixMonthsMs) {
      weight = 2 // Recent reviews count 2x
    } else if (ageMs < twelveMonthsMs) {
      weight = 1 // Normal weight
    } else {
      weight = 0.5 // Old reviews count 0.5x
    }

    weightedSum += review.star_rating * weight
    weightTotal += weight
  }

  const fairnessScore = weightTotal > 0 ? round1(weightedSum / weightTotal) : googleRating

  // Potential rating: if all unfair reviews were removed
  const potentialRating = fairReviews.length > 0
    ? round1(fairReviews.reduce((sum, r) => sum + r.star_rating, 0) / fairReviews.length)
    : googleRating

  // Rating gap
  const ratingGap = round1(fairnessScore - googleRating)

  // Revenue impact of the gap
  const tenthStars = Math.abs(ratingGap) * 10
  const estimatedRevenueImpact = {
    low: Math.round(tenthStars * REVENUE_PER_TENTH_STAR_LOW),
    high: Math.round(tenthStars * REVENUE_PER_TENTH_STAR_HIGH),
  }

  // How many 5-star reviews needed to reach fairness score without removals
  const reviewsNeededToRecover = calculateReviewsNeeded(
    reviews.length,
    totalStars,
    fairnessScore
  )

  return {
    googleRating,
    fairnessScore,
    unfairReviewCount: unfairReviews.length,
    unfairReviews,
    ratingGap,
    potentialRating,
    reviewsNeededToRecover,
    estimatedRevenueImpact,
  }
}

/**
 * Calculate how many 5-star reviews are needed to reach a target rating.
 * (currentTotal + 5*n) / (currentCount + n) >= target
 * => n >= (target * currentCount - currentTotal) / (5 - target)
 */
function calculateReviewsNeeded(
  currentCount: number,
  currentTotalStars: number,
  targetRating: number
): number {
  if (targetRating >= 5) return Infinity
  if (targetRating <= 0) return 0

  const needed = (targetRating * currentCount - currentTotalStars) / (5 - targetRating)
  return Math.max(0, Math.ceil(needed))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

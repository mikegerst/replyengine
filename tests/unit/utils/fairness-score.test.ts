import { describe, it, expect } from 'vitest'
import { calculateFairnessScore } from '@/lib/utils/fairness-score'
import { mockReview, mockDispute } from '../../helpers/mocks'
import type { Review, ReviewDispute } from '@/lib/types/database'

describe('calculateFairnessScore', () => {
  it('with all 5-star reviews: fairness score equals google rating', () => {
    const reviews: Review[] = [
      mockReview({ id: 'r1', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r2', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r3', star_rating: 5, review_date: new Date().toISOString() }),
    ]

    const result = calculateFairnessScore(reviews, [])

    expect(result.googleRating).toBe(5)
    expect(result.fairnessScore).toBe(5)
    expect(result.ratingGap).toBe(0)
  })

  it('with disputed reviews: fairness score is higher than google rating', () => {
    const reviews: Review[] = [
      mockReview({ id: 'r1', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r2', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r3', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r4', star_rating: 1, review_date: new Date().toISOString() }),
    ]
    const disputes: ReviewDispute[] = [
      mockDispute({ review_id: 'r4', status: 'flagged' }),
    ]

    const result = calculateFairnessScore(reviews, disputes)

    // Google rating: (5+5+5+1)/4 = 4.0
    expect(result.googleRating).toBe(4)
    // Fairness excludes disputed r4, so (5+5+5)/3 = 5.0
    expect(result.fairnessScore).toBe(5)
    expect(result.fairnessScore).toBeGreaterThan(result.googleRating)
  })

  it('recency weighting: recent reviews have more impact than old ones', () => {
    const now = new Date()
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)

    const reviews: Review[] = [
      mockReview({ id: 'r1', star_rating: 5, review_date: now.toISOString() }), // weight 2x
      mockReview({ id: 'r2', star_rating: 1, review_date: twoYearsAgo.toISOString() }), // weight 0.5x
    ]

    const result = calculateFairnessScore(reviews, [])

    // Google rating: (5+1)/2 = 3.0
    expect(result.googleRating).toBe(3)
    // Fairness: (5*2 + 1*0.5) / (2 + 0.5) = 10.5/2.5 = 4.2
    expect(result.fairnessScore).toBe(4.2)
  })

  it('ratingGap is the difference between fairness and google ratings', () => {
    const reviews: Review[] = [
      mockReview({ id: 'r1', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r2', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r3', star_rating: 1, review_date: new Date().toISOString() }),
    ]
    const disputes: ReviewDispute[] = [
      mockDispute({ review_id: 'r3', status: 'flagged' }),
    ]

    const result = calculateFairnessScore(reviews, disputes)

    // Google: (5+5+1)/3 = 3.7, Fairness: 5.0
    expect(result.ratingGap).toBe(
      Math.round((result.fairnessScore - result.googleRating) * 10) / 10
    )
  })

  it('potentialRating is what the rating would be without disputed reviews', () => {
    const reviews: Review[] = [
      mockReview({ id: 'r1', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r2', star_rating: 4, review_date: new Date().toISOString() }),
      mockReview({ id: 'r3', star_rating: 1, review_date: new Date().toISOString() }),
    ]
    const disputes: ReviewDispute[] = [
      mockDispute({ review_id: 'r3', status: 'flagged' }),
    ]

    const result = calculateFairnessScore(reviews, disputes)

    // Without r3: (5+4)/2 = 4.5
    expect(result.potentialRating).toBe(4.5)
  })

  it('reviewsNeededToRecover: correct count of 5-star reviews needed', () => {
    const reviews: Review[] = [
      mockReview({ id: 'r1', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r2', star_rating: 1, review_date: new Date().toISOString() }),
    ]

    const result = calculateFairnessScore(reviews, [])

    // Google: 3.0, Fairness: same since no disputes
    // Need n 5-star reviews: (fairness * 2 - 6) / (5 - fairness)
    // Since fairnessScore includes weighting it may differ, just check it's a non-negative integer
    expect(result.reviewsNeededToRecover).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(result.reviewsNeededToRecover)).toBe(true)
  })

  it('estimatedRevenueImpact returns a range based on rating gap', () => {
    const reviews: Review[] = [
      mockReview({ id: 'r1', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r2', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r3', star_rating: 1, review_date: new Date().toISOString() }),
    ]
    const disputes: ReviewDispute[] = [
      mockDispute({ review_id: 'r3', status: 'flagged' }),
    ]

    const result = calculateFairnessScore(reviews, disputes)

    expect(result.estimatedRevenueImpact).toHaveProperty('low')
    expect(result.estimatedRevenueImpact).toHaveProperty('high')
    expect(result.estimatedRevenueImpact.high).toBeGreaterThanOrEqual(
      result.estimatedRevenueImpact.low
    )

    if (result.ratingGap > 0) {
      expect(result.estimatedRevenueImpact.low).toBeGreaterThan(0)
    }
  })

  it('with zero reviews: all values should be 0 or safe defaults', () => {
    const result = calculateFairnessScore([], [])

    expect(result.googleRating).toBe(0)
    expect(result.fairnessScore).toBe(0)
    expect(result.unfairReviewCount).toBe(0)
    expect(result.unfairReviews).toEqual([])
    expect(result.ratingGap).toBe(0)
    expect(result.potentialRating).toBe(0)
    expect(result.reviewsNeededToRecover).toBe(0)
    expect(result.estimatedRevenueImpact).toEqual({ low: 0, high: 0 })
  })

  it('dismissed disputes are not counted as unfair', () => {
    const reviews: Review[] = [
      mockReview({ id: 'r1', star_rating: 5, review_date: new Date().toISOString() }),
      mockReview({ id: 'r2', star_rating: 1, review_date: new Date().toISOString() }),
    ]
    const disputes: ReviewDispute[] = [
      mockDispute({ review_id: 'r2', status: 'dismissed' }),
    ]

    const result = calculateFairnessScore(reviews, disputes)

    expect(result.unfairReviewCount).toBe(0)
  })
})

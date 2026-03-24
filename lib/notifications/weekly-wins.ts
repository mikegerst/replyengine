import type { Business, Review, ReviewDispute, RecoveryOutreach } from '@/lib/types/database'

interface WeeklyWinsData {
  business: Business
  newReviews: Review[]
  respondedCount: number
  avgRatingThisWeek: number
  avgRatingLastWeek: number
  bestReview: Review | null
  disputesFiled: number
  reviewsRemoved: number
  outreachSent: number
  customersRecovered: number
  overallRating: number
}

export function generateWeeklyWinsEmail(data: WeeklyWinsData): {
  subject: string
  body: string
} {
  const {
    business, newReviews, respondedCount, avgRatingThisWeek,
    avgRatingLastWeek, bestReview, disputesFiled, reviewsRemoved,
    outreachSent, customersRecovered, overallRating,
  } = data

  const ratingTrend = avgRatingThisWeek > avgRatingLastWeek
    ? `+${(avgRatingThisWeek - avgRatingLastWeek).toFixed(1)}`
    : avgRatingThisWeek < avgRatingLastWeek
      ? `${(avgRatingThisWeek - avgRatingLastWeek).toFixed(1)}`
      : 'same'

  const subject = `${business.name} — Weekly Review Wins: ${newReviews.length} new reviews`

  const lines: string[] = [
    `Hi! Here's your weekly review update for ${business.name}.`,
    '',
    '--- THIS WEEK ---',
    `New reviews: ${newReviews.length}`,
    `Reviews responded to: ${respondedCount}`,
    `Avg rating this week: ${avgRatingThisWeek > 0 ? avgRatingThisWeek.toFixed(1) : 'N/A'} (${ratingTrend} vs last week)`,
    `Overall rating: ${overallRating.toFixed(1)}/5`,
  ]

  if (bestReview) {
    lines.push(
      '',
      '--- BEST REVIEW ---',
      `${bestReview.reviewer_name ?? 'A customer'} (${bestReview.star_rating} stars):`,
      `"${(bestReview.review_text ?? '').slice(0, 200)}${(bestReview.review_text?.length ?? 0) > 200 ? '...' : ''}"`,
      'This review makes great social content! Log in to grab ready-to-post versions.',
    )
  }

  if (disputesFiled > 0 || reviewsRemoved > 0) {
    lines.push(
      '',
      '--- SHIELD UPDATE ---',
      `Disputes filed: ${disputesFiled}`,
      `Reviews removed: ${reviewsRemoved}`,
    )
  }

  if (outreachSent > 0 || customersRecovered > 0) {
    lines.push(
      '',
      '--- RECOVERY UPDATE ---',
      `Outreach sent: ${outreachSent}`,
      `Customers recovered: ${customersRecovered}`,
    )
  }

  lines.push(
    '',
    '---',
    'Every response you approve brings in more customers. Keep it up!',
    '',
    '— ReplyEngine',
  )

  return { subject, body: lines.join('\n') }
}

export function getWeeklyStats(
  reviews: Review[],
  disputes: ReviewDispute[],
  recoveries: RecoveryOutreach[]
) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000)

  const thisWeekReviews = reviews.filter((r) => new Date(r.created_at) >= weekAgo)
  const lastWeekReviews = reviews.filter(
    (r) => new Date(r.created_at) >= twoWeeksAgo && new Date(r.created_at) < weekAgo
  )

  const respondedThisWeek = thisWeekReviews.filter((r) => r.response_status === 'posted').length

  const avgThis = thisWeekReviews.length > 0
    ? thisWeekReviews.reduce((s, r) => s + r.star_rating, 0) / thisWeekReviews.length
    : 0
  const avgLast = lastWeekReviews.length > 0
    ? lastWeekReviews.reduce((s, r) => s + r.star_rating, 0) / lastWeekReviews.length
    : 0

  const overallRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.star_rating, 0) / reviews.length
    : 0

  // Best review: 5-star with longest text
  const fiveStarThisWeek = thisWeekReviews
    .filter((r) => r.star_rating === 5 && r.review_text)
    .sort((a, b) => (b.review_text?.length ?? 0) - (a.review_text?.length ?? 0))

  const weekDisputesFiled = disputes.filter(
    (d) => d.submitted_at && new Date(d.submitted_at) >= weekAgo
  ).length
  const weekRemoved = disputes.filter(
    (d) => d.status === 'removed' && d.resolved_at && new Date(d.resolved_at) >= weekAgo
  ).length
  const weekOutreach = recoveries.filter(
    (r) => r.sent_at && new Date(r.sent_at) >= weekAgo
  ).length
  const weekRecovered = recoveries.filter(
    (r) => r.status === 'resolved' && r.resolved_at && new Date(r.resolved_at) >= weekAgo
  ).length

  return {
    newReviews: thisWeekReviews,
    respondedCount: respondedThisWeek,
    avgRatingThisWeek: Math.round(avgThis * 10) / 10,
    avgRatingLastWeek: Math.round(avgLast * 10) / 10,
    bestReview: fiveStarThisWeek[0] ?? null,
    disputesFiled: weekDisputesFiled,
    reviewsRemoved: weekRemoved,
    outreachSent: weekOutreach,
    customersRecovered: weekRecovered,
    overallRating: Math.round(overallRating * 10) / 10,
  }
}

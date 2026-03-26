import { createClient } from '@/lib/supabase/server'
import { resolveBusinessId } from '@/lib/utils/resolve-business'
import { rateLimitResponse } from '@/lib/utils/rate-limit'
import type { AnalyticsData, MonthlyDataPoint, KeywordCount } from '@/lib/types/database'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const QuerySchema = z.object({
  business_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await rateLimitResponse(`user:${user.id}`, 60, 60 * 1000)
  if (rateLimited) return rateLimited

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = QuerySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' }, { status: 400 })
  }

  const businessId = await resolveBusinessId(supabase, user.id, parsed.data.business_id)
  if (!businessId) {
    return NextResponse.json({ error: 'No business found' }, { status: 404 })
  }

  const startDate = parsed.data.start_date ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const endDate = parsed.data.end_date ?? new Date().toISOString()

  // Fetch all reviews in the date range
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, star_rating, sentiment, review_date, posted_at, response_status, key_topics, created_at')
    .eq('business_id', businessId)
    .gte('review_date', startDate)
    .lte('review_date', endDate)
    .order('review_date', { ascending: true })

  if (reviewsError) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  const allReviews = reviews ?? []

  // Fetch recovery and dispute stats in parallel
  const [recoveryRes, disputeRes] = await Promise.all([
    supabase
      .from('recovery_outreach')
      .select('status')
      .eq('business_id', businessId),
    supabase
      .from('review_disputes')
      .select('status')
      .eq('business_id', businessId),
  ])

  // 1. Rating trend — average star_rating grouped by month
  const ratingByMonth = new Map<string, { sum: number; count: number }>()
  // 2. Review volume — count per month
  const volumeByMonth = new Map<string, number>()
  // 3. Sentiment breakdown
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0, mixed: 0 }
  // 4. Response performance — average response time by month
  const responseTimeByMonth = new Map<string, { totalMs: number; count: number }>()
  // 5. Star distribution
  const starDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  // 6. Keywords
  const keywordMap = new Map<string, number>()

  let totalResponseTimeMs = 0
  let responseTimeCount = 0
  let postedCount = 0

  for (const review of allReviews) {
    const reviewDate = review.review_date ?? review.created_at
    const monthKey = reviewDate.slice(0, 7) // "YYYY-MM"

    // Rating trend
    const ratingEntry = ratingByMonth.get(monthKey) ?? { sum: 0, count: 0 }
    ratingEntry.sum += review.star_rating
    ratingEntry.count++
    ratingByMonth.set(monthKey, ratingEntry)

    // Volume
    volumeByMonth.set(monthKey, (volumeByMonth.get(monthKey) ?? 0) + 1)

    // Sentiment
    const sentiment = review.sentiment as string | null
    if (sentiment && sentiment in sentimentCounts) {
      sentimentCounts[sentiment as keyof typeof sentimentCounts]++
    }

    // Star distribution
    const stars = review.star_rating
    if (stars >= 1 && stars <= 5) {
      starDist[stars]++
    }

    // Response time
    if (review.posted_at && review.review_date) {
      const reviewTime = new Date(review.review_date).getTime()
      const postedTime = new Date(review.posted_at).getTime()
      const diffMs = postedTime - reviewTime
      if (diffMs > 0) {
        const rtEntry = responseTimeByMonth.get(monthKey) ?? { totalMs: 0, count: 0 }
        rtEntry.totalMs += diffMs
        rtEntry.count++
        responseTimeByMonth.set(monthKey, rtEntry)
        totalResponseTimeMs += diffMs
        responseTimeCount++
      }
    }

    if (review.response_status === 'posted') {
      postedCount++
    }

    // Keywords
    const topics = review.key_topics as string[] | null
    if (topics) {
      for (const topic of topics) {
        const normalized = topic.toLowerCase().trim()
        if (normalized) {
          keywordMap.set(normalized, (keywordMap.get(normalized) ?? 0) + 1)
        }
      }
    }
  }

  // Build monthly arrays sorted chronologically
  const allMonthKeys = new Set<string>()
  ratingByMonth.forEach((_, k) => allMonthKeys.add(k))
  volumeByMonth.forEach((_, k) => allMonthKeys.add(k))
  const sortedMonths = Array.from(allMonthKeys).sort()

  const ratingTrend: MonthlyDataPoint[] = sortedMonths.map((month) => {
    const entry = ratingByMonth.get(month)
    return {
      month,
      value: entry ? Math.round((entry.sum / entry.count) * 10) / 10 : 0,
    }
  })

  const reviewVolume: MonthlyDataPoint[] = sortedMonths.map((month) => ({
    month,
    value: volumeByMonth.get(month) ?? 0,
  }))

  const responsePerformance: MonthlyDataPoint[] = sortedMonths.map((month) => {
    const entry = responseTimeByMonth.get(month)
    return {
      month,
      value: entry ? Math.round(entry.totalMs / entry.count / (1000 * 60 * 60)) : 0, // hours
    }
  })

  // Top 15 keywords
  const topKeywords: KeywordCount[] = Array.from(keywordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => ({ keyword, count }))

  // Recovery stats
  const recoveryStats: Record<string, number> = {}
  for (const row of recoveryRes.data ?? []) {
    const status = row.status as string
    recoveryStats[status] = (recoveryStats[status] ?? 0) + 1
  }

  // Dispute stats
  const disputeStats: Record<string, number> = {}
  for (const row of disputeRes.data ?? []) {
    const status = row.status as string
    disputeStats[status] = (disputeStats[status] ?? 0) + 1
  }

  const avgResponseTimeHours = responseTimeCount > 0
    ? Math.round(totalResponseTimeMs / responseTimeCount / (1000 * 60 * 60))
    : 0

  const data: AnalyticsData = {
    ratingTrend,
    reviewVolume,
    sentimentBreakdown: sentimentCounts,
    responsePerformance,
    starDistribution: starDist,
    topKeywords,
    recoveryStats,
    disputeStats,
    summary: {
      totalReviews: allReviews.length,
      avgRating: allReviews.length > 0
        ? Math.round((allReviews.reduce((s, r) => s + r.star_rating, 0) / allReviews.length) * 10) / 10
        : 0,
      responseRate: allReviews.length > 0
        ? Math.round((postedCount / allReviews.length) * 100)
        : 0,
      avgResponseTimeHours,
    },
  }

  return NextResponse.json({ data })
}

'use client'

import { useEffect, useState } from 'react'
import { buildApiUrl } from '@/lib/utils/selected-business'
import { StatCard } from '@/components/dashboard/stat-card'
import { LineChart } from '@/components/dashboard/line-chart'
import { BarChart } from '@/components/dashboard/bar-chart'
import { DonutChart } from '@/components/dashboard/donut-chart'
import type { AnalyticsData } from '@/lib/types/database'

type DateRange = '30d' | '90d' | '12m' | 'all'

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
]

function getDateRangeParams(range: DateRange): Record<string, string> {
  const now = new Date()
  switch (range) {
    case '30d':
      return { start_date: new Date(now.getTime() - 30 * 86400000).toISOString() }
    case '90d':
      return { start_date: new Date(now.getTime() - 90 * 86400000).toISOString() }
    case '12m':
      return { start_date: new Date(now.getTime() - 365 * 86400000).toISOString() }
    case 'all':
      return {}
  }
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`
}

const DISPUTE_FUNNEL_ORDER = ['detected', 'flagged', 'appeal_ready', 'submitted', 'under_review', 'removed', 'denied', 'escalated', 'dismissed']
const RECOVERY_FUNNEL_ORDER = ['draft', 'scheduled', 'sent', 'responded', 'resolved', 'dismissed', 'skipped']

const FUNNEL_COLORS: Record<string, string> = {
  detected: 'bg-gray-200', flagged: 'bg-yellow-200', appeal_ready: 'bg-yellow-300',
  submitted: 'bg-blue-200', under_review: 'bg-blue-300', removed: 'bg-green-300',
  denied: 'bg-red-200', escalated: 'bg-orange-200', dismissed: 'bg-gray-200',
  draft: 'bg-gray-200', scheduled: 'bg-blue-100', sent: 'bg-blue-200',
  responded: 'bg-yellow-200', resolved: 'bg-green-300', skipped: 'bg-gray-200',
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('12m')

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      setError(null)
      try {
        const params = getDateRangeParams(dateRange)
        const res = await fetch(buildApiUrl('/api/analytics', params))
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Failed to load analytics')
          return
        }
        setData(json.data)
      } catch {
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [dateRange])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="mt-6 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md">{error}</div>
      </div>
    )
  }

  if (!data) return null

  const monthLabels = data.ratingTrend.map((d) => formatMonth(d.month))
  const ratingValues = data.ratingTrend.map((d) => d.value)
  const volumeLabels = data.reviewVolume.map((d) => formatMonth(d.month))
  const volumeValues = data.reviewVolume.map((d) => d.value)

  const totalStars = Object.entries(data.starDistribution).reduce((s, [, c]) => s + c, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Review trends and response metrics.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                dateRange === opt.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Reviews" value={data.summary.totalReviews} />
        <StatCard label="Avg Rating" value={data.summary.avgRating > 0 ? `${data.summary.avgRating} / 5` : '\u2014'} />
        <StatCard label="Response Rate" value={data.summary.responseRate > 0 ? `${data.summary.responseRate}%` : '\u2014'} />
        <StatCard
          label="Avg Response Time"
          value={data.summary.avgResponseTimeHours > 0 ? `${data.summary.avgResponseTimeHours}h` : '\u2014'}
          sublabel={data.summary.avgResponseTimeHours > 0 ? 'hours to respond' : undefined}
        />
      </div>

      {/* Rating Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Rating Trend</h2>
        <LineChart
          labels={monthLabels}
          values={ratingValues}
          color="#2563eb"
          formatValue={(v) => v.toFixed(1)}
        />
      </div>

      {/* Review Volume */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Review Volume</h2>
        <BarChart labels={volumeLabels} values={volumeValues} color="#2563eb" />
      </div>

      {/* Star Distribution + Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Star Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Star Distribution</h2>
          {totalStars === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data.starDistribution[star] ?? 0
                const pct = totalStars > 0 ? Math.round((count / totalStars) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-12 flex-shrink-0">{star} star{star !== 1 ? 's' : ''}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: star >= 4 ? '#22c55e' : star === 3 ? '#eab308' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">
                      {count} ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sentiment Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Sentiment Breakdown</h2>
          <DonutChart
            segments={[
              { label: 'Positive', value: data.sentimentBreakdown.positive, color: '#22c55e' },
              { label: 'Neutral', value: data.sentimentBreakdown.neutral, color: '#eab308' },
              { label: 'Negative', value: data.sentimentBreakdown.negative, color: '#ef4444' },
              { label: 'Mixed', value: data.sentimentBreakdown.mixed, color: '#6b7280' },
            ]}
          />
        </div>
      </div>

      {/* Top Keywords */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Keywords</h2>
        {data.topKeywords.length === 0 ? (
          <p className="text-sm text-gray-400">No keywords extracted yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.topKeywords.map((kw) => (
              <span
                key={kw.keyword}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {kw.keyword}
                <span className="text-xs text-gray-400">{kw.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recovery & Dispute Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FunnelCard
          title="Dispute Pipeline"
          stats={data.disputeStats}
          order={DISPUTE_FUNNEL_ORDER}
        />
        <FunnelCard
          title="Recovery Pipeline"
          stats={data.recoveryStats}
          order={RECOVERY_FUNNEL_ORDER}
        />
      </div>
    </div>
  )
}

function FunnelCard({ title, stats, order }: { title: string; stats: Record<string, number>; order: string[] }) {
  const total = Object.values(stats).reduce((s, v) => s + v, 0)
  const entries = order.filter((key) => (stats[key] ?? 0) > 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {total === 0 ? (
        <p className="text-sm text-gray-400">No data yet</p>
      ) : (
        <div className="space-y-2">
          {entries.map((key) => {
            const count = stats[key] ?? 0
            const pct = Math.round((count / total) * 100)
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-28 flex-shrink-0 capitalize">
                  {key.replace('_', ' ')}
                </span>
                <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${FUNNEL_COLORS[key] ?? 'bg-gray-200'}`}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0">
                  {count} ({pct}%)
                </span>
              </div>
            )
          })}
          <p className="text-xs text-gray-400 pt-1">Total: {total}</p>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="mt-2 h-4 w-56 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-80 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            <div className="mt-2 h-7 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-50 rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-50 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-4" />
            <div className="h-40 bg-gray-50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
